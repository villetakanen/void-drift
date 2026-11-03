import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";
import { checkRelease, prepareRelease, publishRelease } from "./release.mjs";

function fixture(t) {
	const cwd = mkdtempSync(join(tmpdir(), "void-release-"));
	t.after(() => rmSync(cwd, { recursive: true, force: true }));
	for (const [name, content] of Object.entries({
		".gitignore": "artifacts/\nbin/\n",
		"package.json": '{"version":"0.5.0"}',
		"firebase.json": JSON.stringify({
			firestore: {
				rules: "firestore.rules",
				indexes: "firestore.indexes.json",
			},
			hosting: { public: "apps/web/dist", cleanUrls: true },
		}),
		"firestore.rules": "original rules",
		"firestore.indexes.json": "{}",
	}))
		writeFileSync(join(cwd, name), content);
	for (const args of [
		["init", "--quiet"],
		["add", "."],
		[
			"-c",
			"user.name=Test",
			"-c",
			"user.email=test@example.invalid",
			"commit",
			"--quiet",
			"-m",
			"test: fixture",
		],
	])
		assert.equal(spawnSync("git", args, { cwd }).status, 0);
	mkdirSync(join(cwd, "bin"));
	const pnpm = join(cwd, "bin/pnpm");
	writeFileSync(
		pnpm,
		`#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
fs.mkdirSync("artifacts", {recursive: true});
fs.appendFileSync("artifacts/commands.jsonl", JSON.stringify(process.argv.slice(2)) + "\\n");
if (process.env.FAIL_BUILD) process.exit(7);
const out = process.argv[process.argv.indexOf("--outDir") + 1];
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, "index.html"), "<h1>Built</h1>");
fs.writeFileSync(path.join(out, "app.js"), process.env.OMIT_CONFIG ? "unconfigured" : JSON.stringify([process.env.PUBLIC_FIREBASE_PROJECT_ID, process.env.PUBLIC_FIREBASE_API_KEY, process.env.PUBLIC_FIREBASE_APP_ID]));
if (process.env.MUTATE_SOURCE) fs.writeFileSync("firestore.rules", "changed");
`,
	);
	chmodSync(pnpm, 0o755);
	return {
		cwd,
		env: {
			...process.env,
			PATH: `${join(cwd, "bin")}${delimiter}${process.env.PATH}`,
			PUBLIC_FIREBASE_API_KEY: "fixture-public-key",
			PUBLIC_FIREBASE_PROJECT_ID: "void-drift-alpha",
			PUBLIC_FIREBASE_APP_ID: "fixture-app",
			PUBLIC_FIREBASE_EMULATORS: "false",
		},
		smoke: async () => ({
			passed: true,
			browser: "fixture",
			externalNetwork: "blocked",
			liveBackendVerified: false,
		}),
	};
}
function failedReport(cwd) {
	const root = join(cwd, "artifacts/prepared-releases");
	return JSON.parse(
		readFileSync(join(root, readdirSync(root)[0], "report.json"), "utf8"),
	);
}
test("invalid production configuration fails before a build and does not echo values", async (t) => {
	const options = fixture(t);
	for (const [key, value] of [
		["PUBLIC_FIREBASE_API_KEY", " "],
		["PUBLIC_FIREBASE_APP_ID", ""],
		["PUBLIC_FIREBASE_PROJECT_ID", "demo-void-drift"],
		["PUBLIC_FIREBASE_EMULATORS", "true"],
		["PUBLIC_FIREBASE_EMULATORS", undefined],
	]) {
		await assert.rejects(
			prepareRelease({ ...options, env: { ...options.env, [key]: value } }),
			(error) => error.message === `Invalid release environment: ${key}`,
		);
	}
	assert.throws(() =>
		readFileSync(join(options.cwd, "artifacts/commands.jsonl")),
	);
});
test("preparation saves the tested build, source identity and original deployment inputs", async (t) => {
	const options = fixture(t);
	const directory = await prepareRelease(options);
	const report = checkRelease(directory);
	assert.equal(report.workingTree, "");
	assert.equal(report.sourceUnchanged, true);
	assert.equal(report.smoke.liveBackendVerified, false);
	assert.equal(
		readFileSync(join(directory, "bundle/firestore.rules"), "utf8"),
		"original rules",
	);
	assert(!JSON.stringify(report).includes(options.env.PUBLIC_FIREBASE_API_KEY));
	assert.equal(
		readFileSync(join(options.cwd, "artifacts/commands.jsonl"), "utf8")
			.trim()
			.split("\n").length,
		1,
	);
});
test("build failure, missing embedded configuration and source changes cannot prepare a release", async (t) => {
	for (const flag of ["FAIL_BUILD", "OMIT_CONFIG", "MUTATE_SOURCE"]) {
		const options = fixture(t);
		await assert.rejects(
			prepareRelease({ ...options, env: { ...options.env, [flag]: "1" } }),
		);
		assert.equal(failedReport(options.cwd).status, "failed");
	}
});
test("failed browser smoke remains failed evidence", async (t) => {
	const options = fixture(t);
	await assert.rejects(
		prepareRelease({
			...options,
			smoke: async () => {
				throw new Error("hydration failed");
			},
		}),
		/hydration failed/,
	);
	assert.equal(failedReport(options.cwd).status, "failed");
});
test("changed, added and deleted artifact files prevent publication", async (t) => {
	for (const change of ["changed", "added", "deleted"]) {
		const options = fixture(t);
		const directory = await prepareRelease(options);
		const file = join(
			directory,
			"bundle/public",
			change === "added" ? "extra.js" : "app.js",
		);
		if (change === "deleted") rmSync(file);
		else writeFileSync(file, "different");
		assert.throws(
			() =>
				publishRelease(directory, {
					deploy: () => assert.fail("must not deploy"),
				}),
			/artifact files changed/,
		);
	}
});
test("publication consumes the saved bundle without rebuilding or taking changed source rules", async (t) => {
	const options = fixture(t);
	const directory = await prepareRelease(options);
	writeFileSync(join(options.cwd, "firestore.rules"), "later unrelated rules");
	let calls = 0;
	publishRelease(directory, {
		cwd: options.cwd,
		deploy: (_cwd, args) => {
			calls++;
			assert.deepEqual(args.slice(0, -1), [
				"exec",
				"firebase",
				"deploy",
				"--only",
				"firestore,hosting",
				"--project",
				"void-drift-alpha",
				"--config",
			]);
			const staged = dirname(args.at(-1));
			assert(staged.startsWith(join(directory, "publication-")));
			assert.equal(
				readFileSync(join(staged, "firestore.rules"), "utf8"),
				"original rules",
			);
			mkdirSync(join(staged, ".firebase"));
			writeFileSync(
				join(staged, ".firebase/hosting.public.cache"),
				"CLI cache",
			);
		},
	});
	assert.equal(calls, 1);
	const attempt = readdirSync(directory).find((name) =>
		name.startsWith("publication-"),
	);
	const publication = JSON.parse(
		readFileSync(join(directory, attempt, "report.json"), "utf8"),
	);
	assert.equal(publication.status, "deployed");
	assert.equal(publication.liveVerified, false);
	assert.equal(checkRelease(directory).status, "prepared");
});
test("publication failure is recorded separately from successful preparation", async (t) => {
	const directory = await prepareRelease(fixture(t));
	assert.throws(
		() =>
			publishRelease(directory, {
				deploy: () => {
					throw new Error("deploy failed");
				},
			}),
		/deploy failed/,
	);
	assert.equal(checkRelease(directory).status, "prepared");
	const attempt = readdirSync(directory).find((name) =>
		name.startsWith("publication-"),
	);
	assert.equal(
		JSON.parse(readFileSync(join(directory, attempt, "report.json"))).status,
		"failed",
	);
});
