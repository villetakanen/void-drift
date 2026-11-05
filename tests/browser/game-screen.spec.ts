import { expect, test } from "../helpers/local-browser";

test("Survival fits the adaptive stage without navigation or page overflow", async ({
	page,
}) => {
	await page.clock.install();
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await page.clock.runFor(3500);
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	const deck = page.locator(".flight-page");
	const seed = await deck.getAttribute("data-seed");
	const ticks = await deck.getAttribute("data-ticks");
	for (const [width, height, logicalWidth] of [
		[1920, 1080, 1920],
		[1024, 768, 1440],
		[1200, 800, 1620],
		[844, 390, 1920],
		[2560, 1080, 1920],
	]) {
		await page.setViewportSize({ width, height });
		await page.clock.runFor(100);
		const stage = page.locator(".flight-stage");
		await expect(stage).toHaveAttribute(
			"data-active-width",
			String(logicalWidth - 360),
		);
		const box = await stage.boundingBox();
		if (!box) throw new Error("Stage missing");
		expect(box.width / box.height).toBeCloseTo(logicalWidth / 1080, 2);
		expect(box.x).toBeCloseTo((width - box.width) / 2, 0);
		expect(box.y).toBeCloseTo((height - box.height) / 2, 0);
		const gutter = await stage.evaluate((node) =>
			parseFloat(getComputedStyle(node).getPropertyValue("--game-gutter")),
		);
		expect(gutter).toBeCloseTo(box.height / 6, 1);
		await expect(stage.locator("canvas")).toHaveAttribute(
			"width",
			String(logicalWidth),
		);
		await expect(deck).toHaveAttribute("data-seed", seed ?? "");
		await expect(deck).toHaveAttribute("data-ticks", ticks ?? "");
		expect(
			await page.evaluate(
				() =>
					document.documentElement.scrollWidth <= innerWidth &&
					document.documentElement.scrollHeight <= innerHeight,
			),
		).toBe(true);
	}
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await expect(page.locator("header")).toHaveCount(0);
	await expect(page.getByRole("link")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Left engine" })).toBeVisible();
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	await expect(page.getByRole("link", { name: "Top Scores" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("portrait freezes the countdown and requires fresh input after Resume", async ({
	page,
}) => {
	await page.clock.install();
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await page.clock.runFor(400);
	await page.keyboard.down("ArrowUp");
	await page.setViewportSize({ width: 768, height: 1024 });
	const deck = page.locator(".flight-page");
	await expect(
		page.getByRole("dialog", { name: "Rotate to landscape" }),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await page.clock.runFor(5000);
	await expect(deck).toHaveAttribute("data-ticks", "0");
	await expect(deck).toHaveAttribute("data-phase", "starting");
	await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
	await page.setViewportSize({ width: 1024, height: 768 });
	await expect(
		page.getByRole("dialog", { name: "Paused", exact: true }),
	).toBeVisible();
	await page.clock.runFor(4000);
	await expect(deck).toHaveAttribute("data-ticks", "0");
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await page.clock.runFor(1000);
	await expect(deck).toHaveAttribute("data-phase", "starting");
	await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
	await page.clock.runFor(2300);
	await expect(deck).toHaveAttribute("data-phase", "playing");
	await page.keyboard.up("ArrowUp");
	await page.keyboard.down("ArrowUp");
	await expect(page.locator(".engine.left")).toHaveClass(/active/);
});

test("portrait launch is blocked and backgrounding requires deliberate Resume", async ({
	page,
}) => {
	await page.clock.install();
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await expect(
		page.getByRole("dialog", { name: "Rotate to landscape" }),
	).toBeVisible();
	await page.clock.runFor(5000);
	await expect(page.locator(".flight-page")).toHaveAttribute("data-ticks", "0");
	await page.setViewportSize({ width: 1024, height: 768 });
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await page.clock.runFor(3500);
	await page.evaluate(() => {
		Object.defineProperty(document, "hidden", {
			configurable: true,
			value: true,
		});
		document.dispatchEvent(new Event("visibilitychange"));
	});
	const deck = page.locator(".flight-page");
	const tick = await deck.getAttribute("data-ticks");
	await page.clock.runFor(10000);
	await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
	await page.evaluate(() => {
		Object.defineProperty(document, "hidden", {
			configurable: true,
			value: false,
		});
		document.dispatchEvent(new Event("visibilitychange"));
	});
	await page.clock.runFor(1000);
	await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await page.clock.runFor(100);
	const advanced = Number(await deck.getAttribute("data-ticks")) - Number(tick);
	expect(advanced).toBeGreaterThan(0);
	expect(advanced).toBeLessThanOrEqual(7);
});

test("live surface contains selection and context menus", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-phase",
		"playing",
	);
	const surface = page.locator("[data-stage]");
	expect(
		await surface.evaluate((node) => ({
			selection: getComputedStyle(node).userSelect,
			touch: getComputedStyle(node).touchAction,
			menuAllowed: node.dispatchEvent(
				new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
			),
		})),
	).toEqual({ selection: "none", touch: "none", menuAllowed: false });
});

for (const key of ["ArrowLeft", "ArrowRight"]) {
	test(`${key} turns the launched Wasp and release brakes its spin`, async ({
		page,
	}) => {
		await page.clock.install();
		await page.goto("/");
		await page.getByRole("button", { name: "PRESS START" }).click();
		await page.clock.runFor(3500);
		const deck = page.locator(".flight-page");
		await page.keyboard.down(key);
		await page.clock.runFor(400);
		const spin = Math.abs(Number(await deck.getAttribute("data-spin")));
		expect(spin).toBeGreaterThan(1);
		await page.keyboard.up(key);
		await page.clock.runFor(500);
		expect(Math.abs(Number(await deck.getAttribute("data-spin")))).toBeLessThan(
			spin,
		);
	});
}
