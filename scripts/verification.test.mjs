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
const backendRunner = resolve("scripts/verify-backend.mjs");

function trial(t, args, overrides = {}, fixtureSource) {
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
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
const args = process.argv.slice(2);
if (process.env.MUTATE_SOURCE) fs.writeFileSync("source.txt", "changed");
console.log("PASSED (deliberately misleading output)");
if (process.argv[2] === "exec" && process.argv[3] === "firebase") {
  assert.deepEqual(args.slice(0, 7), ["exec", "firebase", "emulators:exec", "--only", "firestore,auth", "--project", "demo-void-drift"]);
  assert.equal(args.length, 8);
  assert(args[7].includes(${JSON.stringify(backendRunner)}));
  fs.mkdirSync("artifacts", { recursive: true });
  fs.appendFileSync("artifacts/emulator-starts", "start\\n");
  if (process.env.FAIL_STAGE === "emulator-startup") process.exit(9);
  if (process.env.FAIL_STAGE === "backend-corrupt") {
    fs.writeFileSync(process.env.VOID_DRIFT_BACKEND_DIRECTORY + "/backend.json", "[");
    process.exit(0);
  }
  if (process.env.FAIL_STAGE === "emulator-hang") {
    process.on("SIGINT", () => { fs.writeFileSync("artifacts/emulator-stopped", "stopped"); process.exit(0); });
    setInterval(() => {}, 1000);
    return;
  }
  const result = spawnSync(process.execPath, [${JSON.stringify(backendRunner)}, "--inside"], { stdio: "inherit" });
  fs.writeFileSync("artifacts/emulator-stopped", "stopped");
  process.exit(result.status);
}
let stage;
if (args[0] === "run") stage = args[1];
else if (args[1] === "node") {
  assert.deepEqual(args, ["exec", "node", "--test", "packages/mode-a/tests/firestore.test.mjs"]);
  stage = "test:rules";
} else {
  assert.deepEqual(args, ["exec", "playwright", "test", "-c", "playwright.firebase.config.ts"]);
  stage = "test:competition";
}
process.exit(stage === process.env.FAIL_STAGE ? 7 : 0);
`,
	);
	chmodSync(pnpm, 0o755);
	const selectedRunner = fixtureSource ? join(cwd, "runner.mjs") : runner;
	if (fixtureSource) writeFileSync(selectedRunner, fixtureSource);
	const result = spawnSync(process.execPath, [selectedRunner, ...args], {
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
	return { result, report, cwd };
}

test("quick success is explicitly partial, retains logs and records URLs", (t) => {
	const { result, report, cwd } = trial(t, ["--quick"]);
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
	for (const step of report.steps)
		assert.match(
			readFileSync(join(cwd, step.log), "utf8"),
			/deliberately misleading/,
		);
	const runReport = join(cwd, report.steps[0].log, "..", "report.json");
	assert.deepEqual(JSON.parse(readFileSync(runReport, "utf8")), report);
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
	const { result, report, cwd } = trial(t, []);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(report.passed, true);
	assert.equal(report.partial, false);
	assert.deepEqual(
		report.steps.map((step) => step.command),
		[
			"check:contracts",
			"check:commits",
			"lint",
			"check:types",
			"test",
			"build",
			"test:browser",
			"test:rules",
			"test:competition",
		].map((name) => `pnpm run ${name}`),
	);
	assert.deepEqual(report.skippedSteps, []);
	assert.equal(
		readFileSync(join(cwd, "artifacts/emulator-starts"), "utf8"),
		"start\n",
	);
	assert.equal(
		readFileSync(join(cwd, "artifacts/emulator-stopped"), "utf8"),
		"stopped",
	);
	assert.equal(report.backendLifecycle.status, "passed");
	assert.deepEqual(
		report.steps.slice(-2).map((step) => step.executedCommand),
		[
			"pnpm exec node --test packages/mode-a/tests/firestore.test.mjs",
			"pnpm exec playwright test -c playwright.firebase.config.ts",
		],
	);
});

test("backend startup and either suite failure remain distinct failures", (t) => {
	for (const stage of [
		"emulator-startup",
		"test:rules",
		"test:competition",
		"backend-corrupt",
	]) {
		const { result, report, cwd } = trial(t, [], { FAIL_STAGE: stage });
		assert.equal(result.status, 1);
		assert.equal(report.passed, false);
		assert.equal(report.backendLifecycle.status, "failed");
		const steps = report.steps.slice(-2);
		if (stage === "emulator-startup" || stage === "backend-corrupt") {
			assert(steps.every((step) => step.status === "failed" && step.notRun));
		} else {
			assert.equal(
				steps.find((step) => step.command === `pnpm run ${stage}`).exitCode,
				7,
			);
			assert.equal(steps.filter((step) => step.status === "passed").length, 1);
			assert.equal(
				readFileSync(join(cwd, "artifacts/emulator-stopped"), "utf8"),
				"stopped",
			);
		}
	}
});

test("a stalled emulator lifecycle is stopped and reported without losing evidence", (t) => {
	const { result, report, cwd } = trial(
		t,
		[],
		{ FAIL_STAGE: "emulator-hang" },
		`
import { mkdirSync, writeFileSync } from "node:fs";
import { runBackend } from ${JSON.stringify(backendRunner)};
mkdirSync("artifacts/verification/timeout", { recursive: true });
const report = await runBackend("artifacts/verification/timeout", { timeoutMs: 300, graceMs: 1000 });
writeFileSync("artifacts/verification/latest.json", JSON.stringify(report));
process.exitCode = report.lifecycle.status === "passed" ? 0 : 1;
`,
	);
	assert.equal(result.status, 1);
	assert.equal(report.lifecycle.status, "failed");
	assert(report.steps.every((step) => step.status === "failed" && step.notRun));
	assert.match(
		readFileSync(join(cwd, report.lifecycle.log), "utf8"),
		/timed out/,
	);
	assert.equal(
		readFileSync(join(cwd, "artifacts/emulator-stopped"), "utf8"),
		"stopped",
	);
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
