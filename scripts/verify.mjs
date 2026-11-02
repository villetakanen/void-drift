import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	renameSync,
	writeFileSync,
} from "node:fs";

import { verificationUrls } from "../packages/core/src/lib/schemas/verification-ports.mjs";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--quick")) {
	throw new Error("Usage: node scripts/verify.mjs [--quick]");
}
const mode = args[0] === "--quick" ? "quick" : "full";
const browserUrls = verificationUrls();
const allSteps = [
	"check:contracts",
	"check:commits",
	"lint",
	"check:types",
	"test",
	"build",
	"test:browser",
	"test:rules",
	"test:competition",
];
const selectedSteps =
	mode === "quick"
		? ["check:contracts", "lint", "check:types", "test"]
		: allSteps;

function git(...args) {
	const result = spawnSync("git", args, { encoding: "utf8" });
	if (result.status !== 0)
		throw new Error(result.stderr || "Git evidence unavailable");
	return result.stdout.trimEnd();
}

function fingerprint() {
	const hash = createHash("sha256");
	const files = git(
		"ls-files",
		"-z",
		"--cached",
		"--others",
		"--exclude-standard",
	)
		.split("\0")
		.filter(Boolean);
	for (const file of [...new Set(files)].sort()) {
		hash.update(file).update("\0");
		try {
			if (lstatSync(file).isSymbolicLink()) {
				hash.update("<symlink>").update(readlinkSync(file));
			} else {
				hash.update(readFileSync(file));
			}
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			hash.update("<deleted>");
		}
	}
	return hash.digest("hex");
}

const root = "artifacts/verification";
mkdirSync(root, { recursive: true });
const directory = mkdtempSync(
	`${root}/${new Date().toISOString().replaceAll(":", "-")}-`,
);
const report = {
	mode,
	partial: mode === "quick",
	browserUrls,
	skippedSteps: allSteps.filter((name) => !selectedSteps.includes(name)),
	startedAt: new Date().toISOString(),
	revision: git("rev-parse", "HEAD"),
	branch: git("branch", "--show-current"),
	workingTree: git("status", "--short"),
	sourceFingerprint: fingerprint(),
	node: process.version,
	platform: `${process.platform}/${process.arch}`,
	steps: [],
};

console.log(
	`Verification mode: ${mode}${mode === "quick" ? " (PARTIAL; not full verification)" : ""}`,
);
for (const name of selectedSteps) {
	console.log(`Running ${name}…`);
	const started = Date.now();
	const result = spawnSync("pnpm", ["run", name], {
		encoding: "utf8",
		timeout: 180_000,
		maxBuffer: 20 * 1024 * 1024,
	});
	const log = `${directory}/${name.replaceAll(":", "-")}.log`;
	writeFileSync(
		log,
		`${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`,
	);
	const step = {
		command: `pnpm run ${name}`,
		status: result.status === 0 ? "passed" : "failed",
		exitCode: result.status,
		signal: result.signal,
		durationMs: Date.now() - started,
		log,
	};
	report.steps.push(step);
	console.log(`${step.status.toUpperCase()}: ${name} (${log})`);
}

report.finishedAt = new Date().toISOString();
report.sourceUnchanged = fingerprint() === report.sourceFingerprint;
report.selectedChecksPassed =
	report.sourceUnchanged &&
	report.steps.every((step) => step.status === "passed");
report.passed = mode === "full" && report.selectedChecksPassed;
const serialized = `${JSON.stringify(report, null, 2)}\n`;
writeFileSync(`${directory}/report.json`, serialized);
// Atomic convenience copy; each completed run retains its own report and logs.
const latestTemporary = `${directory}/latest.tmp`;
writeFileSync(latestTemporary, serialized);
renameSync(latestTemporary, `${root}/latest.json`);
console.log(
	`${mode === "quick" ? "Partial verification" : "Verification"} ${report.selectedChecksPassed ? "PASSED" : "FAILED"}${mode === "quick" ? " (not a full pass)" : ""}. Evidence: ${directory}/report.json`,
);
process.exitCode = report.selectedChecksPassed ? 0 : 1;
