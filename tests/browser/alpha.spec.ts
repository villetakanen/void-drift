import {
	buildStats,
	starterLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";

test("title starts a stock Wasp and keyboard controls reach flight", async ({
	page,
}) => {
	await page.clock.install();
	await page.goto("/");
	const deck = page.locator(".flight-page");
	await expect(deck).toHaveAttribute("data-stabilizers", "true");
	await expect(
		page.locator(".flight-hud progress[aria-label='Power']"),
	).toHaveAttribute("max", String(buildStats(starterLoadout("wasp")).capacity));
	await page.getByRole("button", { name: "PRESS START" }).click();
	await expect(deck).toHaveAttribute("data-phase", "playing");
	const y = await deck.getAttribute("data-y");
	await page.keyboard.down("ArrowUp");
	await expect(page.getByRole("button", { name: "Left engine" })).toHaveClass(
		/active/,
	);
	await page.clock.runFor(120);
	await expect(deck).not.toHaveAttribute("data-y", y ?? "");
	await page.keyboard.up("ArrowUp");
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	const tick = await deck.getAttribute("data-ticks");
	await page.clock.runFor(1000);
	await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
	await page.getByRole("button", { name: "Resume", exact: true }).click();
});

test("retired Flight Lab redirects to Hangar", async ({ page }) => {
	await page.goto("/lab/flight?trial=old");
	await expect(page).toHaveURL(/\/builder$/);
	await expect(page.getByRole("heading", { name: "Hangar" })).toBeVisible();
});
test("landscape touch engines support simultaneous activation, cancellation and focus loss", async ({
	newLocalContext,
}) => {
	const context = await newLocalContext({
		viewport: { width: 844, height: 390 },
		hasTouch: true,
		isMobile: true,
	});
	const page = await context.newPage();
	await page.clock.install();
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).tap();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-phase",
		"playing",
	);
	const left = page.getByRole("button", { name: "Left engine" }),
		right = page.getByRole("button", { name: "Right engine" });
	const a = await left.boundingBox(),
		b = await right.boundingBox();
	if (!a || !b) throw new Error("Touch buttons missing");
	expect(a.height).toBeGreaterThanOrEqual(44);
	expect(b.height).toBeGreaterThanOrEqual(44);
	const deck = page.locator(".flight-page");
	const power = page.getByRole("progressbar", { name: "Power" });
	const beforePower = Number(await power.getAttribute("value"));
	const beforeTicks = Number(await deck.getAttribute("data-ticks"));
	const beforeY = await deck.getAttribute("data-y");
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
	await page.clock.runFor(500);
	await expect(deck).not.toHaveAttribute("data-y", beforeY ?? "");
	const elapsedTicks =
		Number(await deck.getAttribute("data-ticks")) - beforeTicks;
	const spent = beforePower - Number(await power.getAttribute("value"));
	// More than catalog idle drain proves the touch input reached propulsion.
	const stats = buildStats(starterLoadout("wasp"));
	const idleDrain = stats.capacity / stats.endurance;
	expect(spent).toBeGreaterThan((idleDrain * elapsedTicks) / 60 + 1e-6);
	await client.send("Input.dispatchTouchEvent", {
		type: "touchCancel",
		touchPoints: [],
	});
	await expect(left).not.toHaveClass(/active/);
	await expect(right).not.toHaveClass(/active/);
	await page.keyboard.down("ArrowUp");
	await page.evaluate(() => window.dispatchEvent(new Event("blur")));
	// Blur pauses: the pads are released and hide behind the Paused dialog.
	await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
	await expect(left).toBeHidden();
	await expect(
		page.getByRole("button", { name: "Resume", exact: true }),
	).toBeVisible();
	await context.close();
});
