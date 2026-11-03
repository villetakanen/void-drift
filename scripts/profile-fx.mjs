import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { chromium } from "@playwright/test";

const baseURL = process.env.FX_BASE_URL ?? "http://127.0.0.1:4347";
const duration = Number(process.env.FX_PROFILE_SECONDS ?? 60);
const camera = process.env.FX_PROFILE_CAMERA ?? "fixed";
if (!["fixed", "moving"].includes(camera))
	throw new Error("FX_PROFILE_CAMERA must be fixed or moving");
if (!Number.isFinite(duration) || duration < 5 || duration > 300)
	throw new Error("FX_PROFILE_SECONDS must be between 5 and 300");
const directory = `artifacts/fx-profile/${new Date().toISOString().replaceAll(":", "-")}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const graphicsSession = await browser.newBrowserCDPSession();
const { gpu } = await graphicsSession.send("SystemInfo.getInfo");
const graphics = { devices: gpu.devices, features: gpu.featureStatus };
await graphicsSession.detach();
const results = [];
try {
	for (const mobile of [false, true]) {
		const context = await browser.newContext({
			viewport: mobile
				? { width: 844, height: 390 }
				: { width: 1280, height: 720 },
			hasTouch: mobile,
			isMobile: mobile,
		});
		const page = await context.newPage();
		const errors = [];
		page.on("pageerror", (error) => errors.push(error.message));
		await page.goto(`${baseURL}/lab/fx?camera=${camera}`);
		const scene = page.getByRole("region", { name: "Arcade FX instrument" });
		await scene.getByRole("button", { name: "Pause", exact: true }).waitFor();
		await page.waitForTimeout(5000);
		const session = await context.newCDPSession(page);
		await session.send("Tracing.start", {
			categories: "devtools.timeline,cc,gpu",
			transferMode: "ReturnAsStream",
		});
		const samples = [];
		for (let second = 0; second < duration; second++) {
			await page.waitForTimeout(1000);
			samples.push(await scene.evaluate((element) => ({ ...element.dataset })));
		}
		const traceComplete = new Promise((resolve) =>
			session.once("Tracing.tracingComplete", resolve),
		);
		await session.send("Tracing.end");
		const { stream } = await traceComplete;
		let trace = "";
		while (true) {
			const chunk = await session.send("IO.read", { handle: stream });
			trace += chunk.data;
			if (chunk.eof) break;
		}
		await session.send("IO.close", { handle: stream });
		const uninterrupted = samples.every(
			(sample, i) =>
				i === 0 || Number(sample.samples) > Number(samples[i - 1].samples),
		);
		if (!uninterrupted) process.exitCode = 1;
		const label = mobile ? "mobile-emulation" : "desktop";
		await writeFile(`${directory}/${label}-trace.json`, trace);
		const events = JSON.parse(trace).traceEvents;
		const timing = {};
		for (const name of [
			"RasterTask",
			"Paint",
			"CompositeLayers",
			"DrawFrame",
			"FunctionCall",
		]) {
			const ms = events
				.filter((event) => event.name === name && event.ph === "X" && event.dur)
				.map((event) => event.dur / 1000)
				.sort((a, b) => a - b);
			timing[name] = {
				count: ms.length,
				totalMs: ms.reduce((a, b) => a + b, 0),
				p95Ms: ms[Math.floor(ms.length * 0.95)] ?? null,
				maxMs: ms.at(-1) ?? null,
			};
		}
		await scene.getByRole("button", { name: "Pause", exact: true }).click();
		await page.screenshot({
			path: `${directory}/${label}.png`,
			fullPage: true,
		});
		results.push({
			label,
			camera,
			graphics,
			browser: browser.version(),
			host: `${process.platform}/${process.arch}`,
			cpu: cpus()[0]?.model,
			uninterrupted,
			duration,
			backing: [1920, 1080],
			viewport: page.viewportSize(),
			displayedCanvas: await page.locator("canvas").boundingBox(),
			warmupSeconds: 5,
			samples,
			timing,
			errors,
		});
		console.log(
			JSON.stringify({
				label,
				directory,
				samples: samples.length,
				last: samples.at(-1),
				timing,
				errors,
			}),
		);
		await context.close();
	}
	await writeFile(
		`${directory}/report.json`,
		JSON.stringify(
			{
				baseURL,
				results,
				caveat:
					"Headless Chromium on this host; inspect graphics.features for software rendering before interpreting GPU performance. Mobile is viewport/touch emulation, not a physical phone. Trace costs include world/UI work and overlapping threads, not an isolated additive GPU timer.",
			},
			null,
			2,
		),
	);
	console.log(`Evidence: ${directory}/report.json`);
} finally {
	await browser.close();
}
