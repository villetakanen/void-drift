import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { chromium, expect } from "@playwright/test";

// Serve only the built artifact, with Astro/Firebase directory-style clean URLs.
export async function serveArtifact(directory) {
	const root = resolve(directory);
	const types = {
		".html": "text/html",
		".js": "text/javascript",
		".css": "text/css",
		".json": "application/json",
		".svg": "image/svg+xml",
		".png": "image/png",
		".jpg": "image/jpeg",
		".webp": "image/webp",
		".woff2": "font/woff2",
	};
	const server = createServer(async (request, response) => {
		try {
			let file = resolve(
				root,
				`.${decodeURIComponent(new URL(request.url, "http://local").pathname)}`,
			);
			assert(file === root || file.startsWith(`${root}${sep}`));
			if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
			const content = await readFile(file);
			response.writeHead(200, {
				"Content-Type": types[extname(file)] ?? "application/octet-stream",
			});
			response.end(content);
		} catch {
			response.writeHead(404).end();
		}
	});
	await new Promise((done, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", done);
	});
	return { server, url: `http://127.0.0.1:${server.address().port}` };
}

export async function smokeArtifact(directory, evidenceDirectory) {
	const { server, url } = await serveArtifact(directory);
	let browser;
	try {
		browser = await chromium.launch();
		const page = await browser.newPage({
			viewport: { width: 1280, height: 720 },
		});
		const errors = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("response", (response) => {
			if (response.url().startsWith(url) && response.status() >= 400)
				errors.push(
					`HTTP ${response.status()}: ${new URL(response.url()).pathname}`,
				);
		});
		await page.route("**/*", (route) =>
			new URL(route.request().url()).origin === url
				? route.continue()
				: route.abort(),
		);
		await page.goto(url);
		await page.getByRole("button", { name: "PRESS START" }).click();
		const deck = page.locator(".flight-page");
		await expect(deck).toHaveAttribute("data-phase", "playing");
		await expect(deck).toHaveAttribute("data-status", "PLAYING");
		const y = await deck.getAttribute("data-y");
		await page.keyboard.down("ArrowUp");
		await expect(page.getByRole("button", { name: "Left engine" })).toHaveClass(
			/active/,
		);
		await expect(deck).not.toHaveAttribute("data-y", y ?? "");
		await page.keyboard.up("ArrowUp");
		await page.getByRole("button", { name: "Pause", exact: true }).click();
		await expect(
			page.getByRole("button", { name: "Resume", exact: true }),
		).toBeVisible();
		await page.screenshot({ path: resolve(evidenceDirectory, "flight.png") });
		await page.goto(`${url}/lab/fx/`);
		const scene = page.getByRole("region", { name: "Arcade FX instrument" });
		await expect
			.poll(async () => Number(await scene.getAttribute("data-ticks")))
			.toBeGreaterThan(0);
		await scene.getByRole("button", { name: "Pause", exact: true }).click();
		await expect(
			scene.getByRole("button", { name: "Run", exact: true }),
		).toBeVisible();
		await page.screenshot({ path: resolve(evidenceDirectory, "lab.png") });
		assert.deepEqual(errors, [], "Built site has page or asset errors");
		return {
			passed: true,
			browser: browser.version(),
			externalNetwork: "blocked",
			liveBackendVerified: false,
		};
	} finally {
		await browser?.close();
		await new Promise((done) => server.close(done));
	}
}
