import { expect, test } from "../helpers/local-browser";

test("landing animation survives selection and hands off a fresh run", async ({
	page,
}) => {
	await page.clock.install({ time: new Date("2026-11-05T00:00:00Z") });
	await page.clock.pauseAt(new Date("2026-11-05T00:01:00Z"));
	await page.goto("/");
	const deck = page.locator(".flight-page");
	await expect(deck).toHaveAttribute("data-landing-sun", /[OBAFGKM]/);
	const sun = await deck.getAttribute("data-landing-sun");
	const canvas = page.locator(".flight-stage-layer > canvas");
	const before = await canvas.evaluate((node: HTMLCanvasElement) =>
		node.toDataURL(),
	);
	await page.clock.runFor(2000);
	expect(
		await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
	).not.toBe(before);
	await page.keyboard.press("Digit1");
	await page.setViewportSize({ width: 960, height: 540 });
	await expect(deck).toHaveAttribute("data-landing-sun", sun ?? "");
	await expect(deck).toHaveAttribute("data-ticks", "0");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await expect(deck).toHaveAttribute("data-phase", "starting");
	await page.clock.runFor(240);
	await expect(deck).toHaveAttribute("data-ticks", "0");
	await expect(deck).not.toHaveAttribute("data-landing-sun");
	const position = [
		await deck.getAttribute("data-x"),
		await deck.getAttribute("data-y"),
	];
	const power = await page
		.getByRole("progressbar", { name: "Power" })
		.getAttribute("value");
	await page.keyboard.down("ArrowUp");
	await page.clock.runFor(2500);
	expect([
		await deck.getAttribute("data-x"),
		await deck.getAttribute("data-y"),
	]).toEqual(position);
	await expect(
		page.getByRole("progressbar", { name: "Power" }),
	).toHaveAttribute("value", power ?? "");
	await expect(deck).toHaveAttribute("data-phase", "starting");
	await expect(deck).toHaveAttribute("data-ticks", "0");
	await page.clock.runFor(700);
	await expect(deck).toHaveAttribute("data-phase", "playing");
	await expect(canvas).toHaveAttribute(
		"aria-label",
		"Ship, star and orbiting planets",
	);
	await page.clock.runFor(1000);
	expect(Number(await deck.getAttribute("data-ticks"))).toBeGreaterThan(0);
	await page.keyboard.up("ArrowUp");
});

test("reduced motion keeps the demo static and retains the three-second count", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.clock.install();
	await page.goto("/");
	const canvas = page.locator(".flight-stage-layer > canvas");
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-landing-sun",
		/[OBAFGKM]/,
	);
	await page.clock.runFor(100);
	const before = await canvas.evaluate((node: HTMLCanvasElement) =>
		node.toDataURL(),
	);
	await page.clock.runFor(2000);
	expect(
		await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
	).toBe(before);
	await page.getByRole("button", { name: "PRESS START" }).click();
	await page.clock.runFor(3100);
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-phase",
		"playing",
	);
});
