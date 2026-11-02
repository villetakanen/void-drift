import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { test } from "node:test";
import { verificationUrls } from "../packages/core/src/lib/schemas/verification-ports.mjs";

const runner = resolve("scripts/verify.mjs");

function trial(t, args, overrides = {}) {
	const cwd = mkdtempSync(join(tmpdir(), "void-drift-verify-"));
	t.after(() => rmSync(cwd, { recursive: true, force: true }));
	const git = (...values) => {
		const result = spawnSync("git", values, { cwd, encoding: "utf8" });
		assert.equal(result.status, 0, result.stderr);
	};
	writeFileSync(join(cwd, "source.txt"), "original");
	writeFileSync(join(cwd, ".gitignore"), "artifacts/\n");
	git("init", "--quiet");
	symlinkSync(".", join(cwd, "directory-link"));
	git("add", "source.txt", ".gitignore", "directory-link");
	git(
		"-c",
		"user.name=Test",
		"-c",
		"user.email=test@example.invalid",
		"commit",
		"--quiet",
		"-m",
		"test: fixture",
	);
	mkdirSync(join(cwd, "bin"));
	const pnpm = join(cwd, "bin", "pnpm");
	writeFileSync(
		pnpm,
		`#!${process.execPath}
const fs = require("node:fs");
if (process.env.MUTATE_SOURCE) fs.writeFileSync("source.txt", "changed");
console.log("PASSED (deliberately misleading output)");
process.exit(process.argv[3] === process.env.FAIL_STAGE ? 7 : 0);
`,
	);
	chmodSync(pnpm, 0o755);
	const result = spawnSync(process.execPath, [runner, ...args], {
		cwd,
		encoding: "utf8",
		env: {
			...process.env,
			PLAYWRIGHT_PORT: "4342",
			PLAYWRIGHT_FIREBASE_PORT: "4343",
			FAIL_STAGE: "",
			MUTATE_SOURCE: "",
			...overrides,
			PATH: `${join(cwd, "bin")}${delimiter}${process.env.PATH}`,
		},
	});
	const report = JSON.parse(
		readFileSync(join(cwd, "artifacts/verification/latest.json"), "utf8"),
	);
	return { result, report };
}

test("quick success is explicitly partial, retains logs and records URLs", (t) => {
	const { result, report } = trial(t, ["--quick"]);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(report.mode, "quick");
	assert.equal(report.partial, true);
	assert.equal(report.passed, false);
	assert.equal(report.selectedChecksPassed, true);
	assert.deepEqual(
		report.steps.map((step) => step.command),
		[
			"pnpm run check:contracts",
			"pnpm run lint",
			"pnpm run check:types",
			"pnpm run test",
		],
	);
	assert.equal(report.skippedSteps.length, 5);
	assert.deepEqual(report.browserUrls, {
		browser: "http://127.0.0.1:4342",
		competition: "http://127.0.0.1:4343",
	});
	assert.match(result.stdout, /not a full pass/);
});

test("a failed stage cannot be hidden by successful-looking output", (t) => {
	const { result, report } = trial(t, ["--quick"], { FAIL_STAGE: "lint" });
	assert.equal(result.status, 1);
	assert.equal(report.selectedChecksPassed, false);
	assert.equal(report.steps.length, 4);
	const failed = report.steps.find((step) => step.exitCode === 7);
	assert.equal(failed.status, "failed");
	assert.equal(failed.command, "pnpm run lint");
});

test("source mutation invalidates otherwise successful checks", (t) => {
	const { result, report } = trial(t, ["--quick"], { MUTATE_SOURCE: "1" });
	assert.equal(result.status, 1);
	assert.equal(report.sourceUnchanged, false);
});

test("full mode still requires every stage", (t) => {
	const { result, report } = trial(t, []);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(report.passed, true);
	assert.equal(report.partial, false);
	assert.equal(report.steps.length, 9);
	assert.deepEqual(report.skippedSteps, []);
});

test("browser ports have defaults and reject invalid or colliding overrides", () => {
	assert.deepEqual(verificationUrls({}), {
		browser: "http://127.0.0.1:4322",
		competition: "http://127.0.0.1:4323",
	});
	for (const value of ["", "0", "65536", "43.2", "abc", " 4342"]) {
		assert.throws(() => verificationUrls({ PLAYWRIGHT_PORT: value }));
		assert.throws(() => verificationUrls({ PLAYWRIGHT_FIREBASE_PORT: value }));
	}
	assert.throws(() => verificationUrls({ PLAYWRIGHT_PORT: "4323" }));
});
