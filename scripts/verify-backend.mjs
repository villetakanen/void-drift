import { spawn, spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const names = ["test:rules", "test:competition"];
const script = fileURLToPath(import.meta.url);
const output = (result) =>
	`${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`;

// Own a process group so a stalled startup or shutdown cannot orphan Java.
// Give Firebase time to shut down gracefully before killing the owned group.
function supervise(args, directory, timeoutMs, graceMs) {
	return new Promise((done) => {
		const child = spawn("pnpm", args, {
			detached: process.platform !== "win32",
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, VOID_DRIFT_BACKEND_DIRECTORY: resolve(directory) },
		});
		let stdout = "";
		let error;
		let forceTimer;
		const signalGroup = (signal) => {
			try {
				if (process.platform === "win32") child.kill(signal);
				else if (child.pid) process.kill(-child.pid, signal);
			} catch (failure) {
				if (failure.code !== "ESRCH") error ??= failure;
			}
		};
		const stop = (reason) => {
			if (forceTimer) return;
			error = new Error(reason);
			signalGroup("SIGINT");
			forceTimer = setTimeout(() => signalGroup("SIGKILL"), graceMs);
		};
		const interrupt = () => stop("Backend lifecycle interrupted");
		process.on("SIGINT", interrupt);
		process.on("SIGTERM", interrupt);
		const deadline = setTimeout(
			() => stop("Backend lifecycle timed out"),
			timeoutMs,
		);
		for (const stream of [child.stdout, child.stderr])
			stream.on("data", (chunk) => {
				if (stdout.length < 20 * 1024 * 1024) stdout += chunk.toString();
				else stop("Backend lifecycle exceeded its log limit");
			});
		child.on("error", (failure) => {
			error = failure;
		});
		child.on("close", (status, signal) => {
			clearTimeout(deadline);
			clearTimeout(forceTimer);
			// A wrapper may exit on SIGINT before its children. Reap that group too.
			if (error) signalGroup("SIGKILL");
			process.off("SIGINT", interrupt);
			process.off("SIGTERM", interrupt);
			done({ status, signal, stdout, error });
		});
	});
}

export async function runBackend(
	directory,
	{ timeoutMs = 420_000, graceMs = 10_000 } = {},
) {
	const started = Date.now();
	const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
	const result = await supervise(
		[
			"exec",
			"firebase",
			"emulators:exec",
			"--only",
			"firestore,auth",
			"--project",
			"demo-void-drift",
			`${quote(process.execPath)} ${quote(script)} --inside`,
		],
		directory,
		timeoutMs,
		graceMs,
	);
	const log = `${directory}/backend-lifecycle.log`;
	writeFileSync(log, output(result));
	const lifecycle = {
		command:
			"pnpm exec firebase emulators:exec --only firestore,auth --project demo-void-drift",
		status: result.status === 0 && !result.error ? "passed" : "failed",
		exitCode: result.status,
		signal: result.signal,
		durationMs: Date.now() - started,
		log,
	};
	const reportPath = `${directory}/backend.json`;
	let recorded = [];
	try {
		if (existsSync(reportPath)) {
			const value = JSON.parse(readFileSync(reportPath, "utf8"));
			if (
				!Array.isArray(value) ||
				!value.every(
					(step) =>
						step &&
						typeof step === "object" &&
						names.some((name) => step.command === `pnpm run ${name}`) &&
						["passed", "failed"].includes(step.status) &&
						(step.exitCode === null || Number.isInteger(step.exitCode)) &&
						Number.isFinite(step.durationMs) &&
						step.durationMs >= 0 &&
						typeof step.log === "string" &&
						(step.status !== "passed" || step.exitCode === 0),
				)
			)
				throw new Error("Invalid backend report shape");
			recorded = value;
		}
	} catch (error) {
		lifecycle.status = "failed";
		writeFileSync(log, `\nBackend evidence unavailable: ${error.message}\n`, {
			flag: "a",
		});
	}
	const steps = names.map((name) => {
		const step = recorded.find((entry) => entry.command === `pnpm run ${name}`);
		if (step) return step;
		const missingLog = `${directory}/${name.replaceAll(":", "-")}.log`;
		writeFileSync(
			missingLog,
			`Not run: emulator lifecycle did not complete this stage. See ${log}\n`,
		);
		return {
			command: `pnpm run ${name}`,
			status: "failed",
			notRun: true,
			exitCode: null,
			signal: result.signal,
			durationMs: 0,
			log: missingLog,
		};
	});
	lifecycle.overheadDurationMs = Math.max(
		0,
		lifecycle.durationMs -
			steps.reduce((sum, step) => sum + step.durationMs, 0),
	);
	for (const step of steps)
		console.log(`${step.status.toUpperCase()}: ${step.command} (${step.log})`);
	return { lifecycle, steps };
}

function inside() {
	const directory = process.env.VOID_DRIFT_BACKEND_DIRECTORY;
	if (!directory) throw new Error("Missing backend evidence directory");
	const steps = [];
	for (const [index, args] of [
		["exec", "node", "--test", "packages/mode-a/tests/firestore.test.mjs"],
		["exec", "playwright", "test", "-c", "playwright.firebase.config.ts"],
	].entries()) {
		const started = Date.now();
		const result = spawnSync("pnpm", args, {
			encoding: "utf8",
			timeout: 180_000,
			maxBuffer: 20 * 1024 * 1024,
		});
		const log = `${directory}/${names[index].replaceAll(":", "-")}.log`;
		writeFileSync(log, output(result));
		steps.push({
			command: `pnpm run ${names[index]}`,
			executedCommand: `pnpm ${args.join(" ")}`,
			status: result.status === 0 ? "passed" : "failed",
			exitCode: result.status,
			signal: result.signal,
			durationMs: Date.now() - started,
			log,
		});
		writeFileSync(
			`${directory}/backend.tmp`,
			`${JSON.stringify(steps, null, 2)}\n`,
		);
		renameSync(`${directory}/backend.tmp`, `${directory}/backend.json`);
	}
	process.exitCode = steps.every((step) => step.status === "passed") ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === script) {
	if (process.argv[2] === "--inside") inside();
	else if (process.argv.length === 2) {
		mkdirSync("artifacts/verification", { recursive: true });
		const directory = mkdtempSync("artifacts/verification/backend-");
		const result = await runBackend(directory);
		writeFileSync(
			`${directory}/report.json`,
			`${JSON.stringify(result, null, 2)}\n`,
		);
		process.exitCode =
			result.lifecycle.status === "passed" &&
			result.steps.every((step) => step.status === "passed")
				? 0
				: 1;
	} else throw new Error("Usage: node scripts/verify-backend.mjs [--inside]");
}
