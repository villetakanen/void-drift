import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
			hash.update(readFileSync(file));
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			hash.update("<deleted>");
		}
	}
	return hash.digest("hex");
}

const directory = "artifacts/verification";
mkdirSync(directory, { recursive: true });
const report = {
	startedAt: new Date().toISOString(),
	revision: git("rev-parse", "HEAD"),
	branch: git("branch", "--show-current"),
	workingTree: git("status", "--short"),
	sourceFingerprint: fingerprint(),
	node: process.version,
	platform: `${process.platform}/${process.arch}`,
	steps: [],
};

for (const name of [
	"check:contracts",
	"lint",
	"check:types",
	"test",
	"build",
	"test:browser",
	"test:rules",
	"test:competition",
]) {
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
report.passed =
	report.sourceUnchanged &&
	report.steps.every((step) => step.status === "passed");
writeFileSync(
	`${directory}/latest.json`,
	`${JSON.stringify(report, null, 2)}\n`,
);
console.log(
	`Verification ${report.passed ? "PASSED" : "FAILED"}. Evidence: ${directory}/latest.json`,
);
process.exitCode = report.passed ? 0 : 1;
