import {
	buildStats,
	starterLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";

const LAUNCHER: Record<string, string> = {
	scout: "01",
	wasp: "02",
	fighter: "03",
	corvette: "04",
};

test("standard flights start with Fighter and all ships have stabilizers", async ({
	page,
}) => {
	await page.clock.install();
	for (const id of ["scout", "wasp", "fighter", "corvette"] as const) {
		await page.goto("/");
		await expect(page.getByRole("radio", { name: "03" })).toBeChecked();
		await page
			.getByRole("radiogroup", { name: "SELECT YOUR SHIP" })
			.getByText(LAUNCHER[id], { exact: true })
			.click();
		if (id === "scout") {
			await page.reload();
			await expect(page.getByRole("radio", { name: "03" })).toBeChecked();
			await page
				.getByRole("radiogroup", { name: "SELECT YOUR SHIP" })
				.getByText(LAUNCHER[id], { exact: true })
				.click();
		}
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-stabilizers",
			"true",
		);
		// The HUD sits in the stage, which the menu makes inert.
		await expect(
			page.locator(".flight-hud progress[aria-label='Power']"),
		).toHaveAttribute("max", String(buildStats(starterLoadout(id)).capacity));
		await page.getByRole("button", { name: "PRESS START" }).click();
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-phase",
			"playing",
		);
		await expect(page.getByRole("dialog", { name: "Game menu" })).toBeHidden();
		const deck = page.locator(".flight-page");
		const y = await deck.getAttribute("data-y");
		await page.keyboard.down("ArrowUp");
		await expect(page.getByRole("button", { name: "Left engine" })).toHaveClass(
			/active/,
		);
		await page.clock.runFor(120);
		await expect(deck).not.toHaveAttribute("data-y", y ?? "");
		await expect(page.locator(".timer .time")).not.toHaveText("0.0s");
		await page.keyboard.up("ArrowUp");
		await expect(
			page.getByRole("button", { name: "Left engine" }),
		).not.toHaveClass(/active/);
		if (id !== "fighter") continue;
		await page.keyboard.down("ArrowLeft");
		await expect(
			page.getByRole("button", { name: "Right engine" }),
		).toHaveClass(/active/);
		await page.keyboard.up("ArrowLeft");
		await expect(
			page.getByRole("button", { name: "Right engine" }),
		).not.toHaveClass(/active/);
		await page.getByRole("button", { name: "Pause", exact: true }).click();
		const tick = await deck.getAttribute("data-ticks");
		await page.clock.runFor(1000);
		await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
		await page.getByRole("button", { name: "Resume", exact: true }).click();
	}
});
test("flight Lab replays exactly, imports safely, and restarts after death", async ({
	page,
}) => {
	await page.goto("/lab/flight");
	const initialSeed = await page.getByLabel("Scenario seed").inputValue();
	await page.getByRole("checkbox", { name: "Ion stabilizers" }).uncheck();
	await page
		.getByLabel("Light ion acceleration at 115 mass", { exact: true })
		.fill("360");
	await page.getByRole("button", { name: "Apply & reset" }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-stabilizers",
		"false",
	);
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	const deck = page.locator(".flight-page");
	const x = await deck.getAttribute("data-x");
	const y = await deck.getAttribute("data-y");
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	await expect(deck).toHaveAttribute("data-x", x ?? "");
	await expect(deck).toHaveAttribute("data-y", y ?? "");
	await expect(
		page.getByLabel("Ship, star and orbiting planets"),
	).toBeVisible();
	await page.getByRole("button", { name: "Export JSON" }).click();
	const json = await page.getByLabel("Trial configuration").inputValue();
	const exported = JSON.parse(json);
	expect(exported.seed).toBe(Number(initialSeed));
	expect(exported.loadout.side).toBe("ion");
	expect(exported.loadout.aft.every((part: unknown) => part === null)).toBe(
		true,
	);
	expect(exported.loadout.stabilizers).toBe(false);
	expect(exported.ion.acceleration).toBe(360);
	await page.getByLabel("Trial configuration").fill("{bad json}");
	await page.getByRole("button", { name: "Import JSON" }).click();
	await expect(page.locator(".flight-message")).toContainText("Invalid trial");
	await expect(deck).toHaveAttribute("data-x", x ?? "");
	await page.getByLabel("Trial configuration").fill(json);
	await page.getByRole("button", { name: "Import JSON" }).click();
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	await expect(deck).toHaveAttribute("data-x", x ?? "");
	await expect(deck).toHaveAttribute("data-y", y ?? "");
	await page.getByRole("button", { name: "Coast to end" }).click();
	await expect(
		page.getByRole("dialog", { name: "Run complete" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Play Again" }).click();
	await expect(page.getByRole("dialog", { name: "Game menu" })).toBeVisible();
	// The HUD sits in the stage, which the menu makes inert.
	const hull = page.locator(".flight-hud progress[aria-label='Hull']");
	await expect(hull).toHaveAttribute(
		"value",
		(await hull.getAttribute("max")) ?? "",
	);
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
	const stats = buildStats(starterLoadout("fighter"));
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

test("Lab configures, previews and shares stepped zoom at a fixed Full HD resolution", async ({
	page,
}) => {
	await page.goto("/lab/flight");
	const deck = page.locator(".flight-page");
	await expect(
		page.getByLabel("Ship, star and orbiting planets"),
	).toHaveAttribute("width", "1920");
	await expect(
		page.getByLabel("Ship, star and orbiting planets"),
	).toHaveAttribute("height", "1080");
	for (const count of [4, 11]) {
		await page.getByLabel("Zoom levels:").fill(String(count));
		await page.getByRole("button", { name: "Apply & reset" }).click();
		await expect(deck).toHaveAttribute("data-zoom-steps", String(count));
		await page
			.getByRole("button", { name: "Replay trial", exact: true })
			.click();
		const tick = await deck.getAttribute("data-ticks");
		const position = await deck.getAttribute("data-x");
		for (const i of [0, Math.floor(count / 2), count - 1]) {
			await page.getByLabel("Preview zoom").selectOption(String(i));
			await expect(deck).toHaveAttribute("data-zoom-level", String(i));
			await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
			await expect(deck).toHaveAttribute("data-x", position ?? "");
		}
		await page.getByRole("button", { name: "Export JSON" }).click();
		expect(
			JSON.parse(await page.getByLabel("Trial configuration").inputValue())
				.camera.zoomSteps,
		).toBe(count);
		await page.getByRole("link", { name: "Open shareable trial" }).click();
		await expect(deck).toHaveAttribute("data-zoom-steps", String(count));
	}
});
