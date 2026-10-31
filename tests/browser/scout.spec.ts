import { expect, test } from "@playwright/test";
import { BuildStoreSchema } from "../../packages/mode-a/src/lib/schemas/loadout";

test("Scout restores its four-slot save, fits every part and flies from the canonical Lab", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto("/builder");
	await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
	await page.getByRole("button", { name: /Energy storage.*18 mass/ }).click();
	await page.getByRole("button", { name: /Heavy Corvette.*8 SLOTS/ }).click();
	await page.getByRole("button", { name: "Hull 2 · Equipment: Empty" }).click();
	await page.getByRole("button", { name: /Loading coil.*10 mass/ }).click();
	const before = await page.evaluate(() =>
		localStorage.getItem("void-drift-builds-v2"),
	);
	if (!before) throw new Error("Initial chassis builds not saved");
	await page.goto("/lab/builder?chassis=scout");
	await expect(
		page.getByRole("button", { name: /Scout.*4 SLOTS/ }),
	).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator(".mount")).toHaveCount(4);
	await expect(
		page.getByText("Scout design is pending.", { exact: false }),
	).toHaveCount(0);
	await expect(
		page.getByRole("button", {
			name: "Right side · mirrored E: Fusion",
		}),
	).toBeDisabled();
	await page
		.getByRole("button", { name: "Left side · mirrored E: Fusion" })
		.focus();
	await page.keyboard.press("Enter");
	await page.getByRole("button", { name: /Small ion.*10 mass/ }).click();
	await expect(
		page.getByRole("button", { name: "Left side · mirrored E: Small ion" }),
	).toBeVisible();

	for (const [part, label] of [
		["Rail gun", "Rail gun"],
		["Laser", "Laser"],
		["Energy storage", "Energy storage"],
		["Loading coil", "Loading coil"],
	]) {
		await page.locator(".mount").nth(2).click();
		await expect(
			page.getByRole("button", { name: /Small ion.*10 mass/ }),
		).toHaveCount(0);
		await page
			.getByRole("button", { name: new RegExp(`${part}.*mass`) })
			.click();
		await expect(
			page.getByRole("button", { name: `Hull 1 · Equipment: ${label}` }),
		).toBeVisible();
	}
	for (const part of [
		"Rail gun",
		"Laser",
		"Energy storage",
		"Loading coil",
		"Fusion",
		"Small ion",
	]) {
		await page.locator(".mount").nth(3).click();
		await page
			.getByRole("button", { name: new RegExp(`${part}.*mass`) })
			.click();
		await expect(
			page.getByRole("button", { name: `Aft 1 · Universal: ${part}` }),
		).toBeVisible();
	}
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Loading coil" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Aft 1 · Universal: Small ion" }),
	).toBeVisible();
	const after = await page.evaluate(() =>
		localStorage.getItem("void-drift-builds-v2"),
	);
	if (!after) throw new Error("Scout build not saved");
	const savedBefore = BuildStoreSchema.parse(JSON.parse(before));
	const savedAfter = BuildStoreSchema.parse(JSON.parse(after));
	// Compare unrelated version-1 builds, not just their presence.
	for (const chassis of ["balanced", "tank"] as const) {
		expect(savedAfter[chassis]).toEqual(savedBefore[chassis]);
	}
	await page.setViewportSize({ width: 1440, height: 1100 });
	await page.screenshot({
		path: "artifacts/scout-builder.png",
		fullPage: true,
	});
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	const deck = page.locator(".flight-page");
	await expect(deck).toHaveAttribute("data-status", "PLAYING");
	const x = await deck.getAttribute("data-x");
	const tick = Number(await deck.getAttribute("data-ticks"));
	await page.keyboard.down("a");
	await expect(
		page.getByRole("button", { name: "Left engine", exact: true }),
	).toHaveClass(/active/);
	await page.keyboard.down("d");
	await expect(
		page.getByRole("button", { name: "Right engine", exact: true }),
	).toHaveClass(/active/);
	await expect
		.poll(async () => Number(await deck.getAttribute("data-ticks")))
		.toBeGreaterThan(tick + 45);
	await page.screenshot({ path: "artifacts/scout-flight.png" });
	await page.keyboard.up("a");
	await page.keyboard.up("d");
	await expect.poll(() => deck.getAttribute("data-x")).not.toBe(x);
	await page.getByRole("button", { name: "Reset flight" }).click();
	await expect(
		page.getByRole("progressbar", { name: "Power" }),
	).toHaveAttribute("value", /9[89]|100/);
	await page.getByRole("button", { name: "Return to builder" }).click();
	await expect(
		page.getByRole("button", { name: "Aft 1 · Universal: Small ion" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Start survival" }).click();
	await expect(page.locator(".edition")).toHaveText(
		"CUSTOM SURVIVAL / UNRANKED",
	);
	expect(errors).toEqual([]);
});

test("Scout preserves landscape two-touch input, cancellation and blur safety", async ({
	browser,
}) => {
	const context = await browser.newContext({
		viewport: { width: 844, height: 390 },
		hasTouch: true,
		isMobile: true,
	});
	const page = await context.newPage();
	await page.goto("/builder?chassis=scout");
	await page.getByRole("button", { name: "Test flight", exact: true }).tap();
	const left = page.getByRole("button", { name: "Left engine", exact: true });
	const right = page.getByRole("button", { name: "Right engine", exact: true });
	const a = await left.boundingBox(),
		b = await right.boundingBox();
	if (!a || !b) throw new Error("Scout touch controls missing");
	expect(a.height).toBeGreaterThanOrEqual(44);
	expect(b.height).toBeGreaterThanOrEqual(44);
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
	await page.keyboard.down("a");
	await page.evaluate(() => window.dispatchEvent(new Event("blur")));
	await expect(left).not.toHaveClass(/active/);
	await expect(
		page.getByRole("button", { name: "Resume", exact: true }),
	).toBeVisible();
	await context.close();
});

test("invalid chassis deep links recover to the normal Fighter selection", async ({
	page,
}) => {
	await page.goto("/builder?chassis=not-a-chassis");
	await expect(
		page.getByRole("button", { name: /Fighter.*6 SLOTS/ }),
	).toHaveAttribute("aria-pressed", "true");
});
