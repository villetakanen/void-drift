import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.route("**/*", (route) =>
		new URL(route.request().url()).hostname === "127.0.0.1"
			? route.continue()
			: route.abort(),
	);
});
test("all ships move, pause, release controls and persist selection", async ({
	page,
}) => {
	await page.clock.install();
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	for (const id of ["scout", "balanced", "tank"]) {
		await page.goto("/");
		await page.getByLabel("Ship Chassis").selectOption(id);
		await page.reload();
		await expect(page.getByLabel("Ship Chassis")).toHaveValue(id);
		await page.getByRole("button", { name: "TAP TO START" }).click();
		const deck = page.locator(".flight-page");
		const y = await deck.getAttribute("data-y");
		await page.keyboard.down("ArrowUp");
		await expect(page.getByRole("button", { name: "Left engine" })).toHaveClass(
			/active/,
		);
		await expect(deck).not.toHaveAttribute("data-y", y ?? "");
		await page.keyboard.up("ArrowUp");
		await expect(
			page.getByRole("button", { name: "Left engine" }),
		).not.toHaveClass(/active/);
		await page.getByRole("button", { name: "Pause", exact: true }).click();
		const tick = await deck.getAttribute("data-ticks");
		await page.clock.runFor(1000);
		await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
		await page.getByRole("button", { name: "Resume", exact: true }).click();
	}
	expect(errors).toEqual([]);
});
test("flight Lab replays exactly, imports safely, and restarts after death", async ({
	page,
}, testInfo) => {
	await page.goto("/lab/flight");
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	const deck = page.locator(".flight-page");
	const x = await deck.getAttribute("data-x");
	const y = await deck.getAttribute("data-y");
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	await expect(deck).toHaveAttribute("data-x", x ?? "");
	await expect(deck).toHaveAttribute("data-y", y ?? "");
	await expect(page.locator("canvas")).toHaveScreenshot("flight-trial.png", {
		maxDiffPixelRatio: 0.005,
		style:
			".flight-hud, .flight-controls, .pause-banner { visibility: hidden !important; }",
	});
	await testInfo.attach("flight-trial", {
		body: await page.screenshot(),
		contentType: "image/png",
	});
	await page.getByRole("button", { name: "Export JSON" }).click();
	const json = await page.getByLabel("Trial configuration").inputValue();
	expect(JSON.parse(json).seed).toBe(2026);
	await page.getByLabel("Trial configuration").fill("{bad json}");
	await page.getByRole("button", { name: "Import JSON" }).click();
	await expect(page.locator(".flight-message")).toContainText("Invalid trial");
	await expect(deck).toHaveAttribute("data-x", x ?? "");
	await page.getByLabel("Trial configuration").fill(json);
	await page.getByRole("button", { name: "Import JSON" }).click();
	await page.getByRole("button", { name: "Coast to end" }).click();
	await expect(
		page.getByRole("dialog", { name: "Run complete" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Try Again" }).click();
	await expect(page.getByRole("dialog", { name: "Game menu" })).toBeVisible();
	await expect(page.getByRole("progressbar", { name: "Hull" })).toHaveAttribute(
		"value",
		"100",
	);
});
test("landscape touch engines support simultaneous activation, cancellation and focus loss", async ({
	browser,
}) => {
	const context = await browser.newContext({
		viewport: { width: 844, height: 390 },
		hasTouch: true,
		isMobile: true,
	});
	const page = await context.newPage();
	await page.route("**/*", (route) =>
		new URL(route.request().url()).hostname === "127.0.0.1"
			? route.continue()
			: route.abort(),
	);
	await page.goto("/");
	await page.getByRole("button", { name: "TAP TO START" }).tap();
	const left = page.getByRole("button", { name: "Left engine" }),
		right = page.getByRole("button", { name: "Right engine" });
	const a = await left.boundingBox(),
		b = await right.boundingBox();
	if (!a || !b) throw new Error("Touch buttons missing");
	expect(a.height).toBeGreaterThanOrEqual(44);
	const client = await context.newCDPSession(page);
	await client.send("Input.dispatchTouchEvent", {
		type: "touchStart",
		touchPoints: [
			{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 },
			{ x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 },
		],
	});
	await expect(left).toHaveClass(/active/);
	await expect(right).toHaveClass(/active/);
	await client.send("Input.dispatchTouchEvent", {
		type: "touchCancel",
		touchPoints: [],
	});
	await expect(left).not.toHaveClass(/active/);
	await expect(right).not.toHaveClass(/active/);
	await page.keyboard.down("ArrowUp");
	await page.evaluate(() => window.dispatchEvent(new Event("blur")));
	await expect(left).not.toHaveClass(/active/);
	await expect(
		page.getByRole("button", { name: "Resume", exact: true }),
	).toBeVisible();
	await context.close();
});
