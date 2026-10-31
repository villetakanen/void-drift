import { expect, test } from "@playwright/test";

test("fit, persist, fly, reset and return to an assembled ship", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto("/builder");
	await expect(
		page.getByRole("heading", { name: "Your ship. Your compromise." }),
	).toBeVisible();
	await page.getByRole("button", { name: /Small ion.*10 mass/ }).click();
	await expect(
		page.getByRole("button", { name: "Right side · mirrored E: Small ion" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
	await expect(
		page.getByRole("button", { name: /Small ion.*10 mass/ }),
	).toHaveCount(0);
	await page.getByRole("button", { name: /Energy storage.*18 mass/ }).click();
	await expect(
		page
			.getByRole("region", { name: "Ship assembly" })
			.getByRole("button", { name: /Hull 1.*Energy storage/ }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Scout.*4 SLOTS/ }),
	).toBeEnabled();
	await expect(
		page.getByRole("button", { name: /Heavy Corvette.*8 SLOTS/ }),
	).toBeEnabled();
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Energy storage" }),
	).toBeVisible();
	await page.setViewportSize({ width: 1440, height: 1100 });
	await page.screenshot({
		path: "artifacts/builder-desktop.png",
		fullPage: true,
	});
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-status",
		"PLAYING",
	);
	await expect(
		page.getByRole("progressbar", { name: "Power" }),
	).toHaveAttribute("max", "200");
	await page.keyboard.down("a");
	await page.keyboard.down("d");
	await expect
		.poll(async () =>
			Number(await page.locator(".flight-page").getAttribute("data-ticks")),
		)
		.toBeGreaterThan(30);
	await page.keyboard.up("a");
	await page.keyboard.up("d");
	await page.screenshot({ path: "artifacts/builder-flight.png" });
	await page.getByRole("button", { name: "Reset flight" }).click();
	await expect(
		page.getByRole("progressbar", { name: "Power" }),
	).toHaveAttribute("value", /19[89]|200/);
	await page.getByRole("button", { name: "Return to builder" }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Energy storage" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Start survival" }).click();
	await expect(page.locator(".edition")).toHaveText(
		"CUSTOM SURVIVAL / UNRANKED",
	);
	expect(errors).toEqual([]);
});

test("corrupt browser storage recovers to flyable defaults", async ({
	page,
}) => {
	await page.addInitScript(() =>
		localStorage.setItem("void-drift-builds-v2", '{"broken":true}'),
	);
	await page.goto("/builder");
	await expect(page.getByRole("status")).toContainText("Restored flyable");
	await expect(
		page.getByRole("button", {
			name: "Left side · mirrored E: Fusion",
		}),
	).toBeVisible();
});

test("preserves other chassis saves and independently selects tight aft mounts", async ({
	page,
}) => {
	const saved = {
		scout: {
			version: 2,
			chassis: "scout",
			side: "ion",
			hull: ["battery"],
			aft: ["rail"],
		},
		balanced: {
			version: 2,
			chassis: "balanced",
			side: "fusion",
			hull: [null, null],
			aft: [null, null],
		},
		tank: {
			version: 2,
			chassis: "tank",
			side: "ion",
			hull: ["coil", null, "laser"],
			aft: ["ion", null, "fusion"],
		},
	};
	await page.goto("/lab/builder");
	await page.evaluate(
		(value) =>
			localStorage.setItem("void-drift-builds-v2", JSON.stringify(value)),
		saved,
	);
	await page.reload();
	await expect(
		page.getByRole("button", { name: /Fighter 6 SLOTS/ }),
	).toHaveAttribute("aria-pressed", "true");
	await page.getByRole("button", { name: "Aft 1 · Universal: Empty" }).click();
	await page.getByRole("button", { name: /Rail gun.*15 mass/ }).click();
	await page.getByRole("button", { name: "Aft 2 · Universal: Empty" }).focus();
	await page.keyboard.press("Enter");
	await page.getByRole("button", { name: /Small ion.*10 mass/ }).click();
	await page.reload();
	const restored = await page.evaluate(() =>
		JSON.parse(localStorage.getItem("void-drift-builds-v2") ?? "null"),
	);
	expect(restored.scout).toEqual(saved.scout);
	expect(restored.tank).toEqual(saved.tank);
	expect(restored.balanced.aft).toEqual(["rail", "ion"]);
	await page.getByRole("button", { name: "Start survival" }).click();
	await page.keyboard.down("a");
	await page.keyboard.down("d");
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-status",
		"GAME_OVER",
		{ timeout: 20000 },
	);
	await page.keyboard.up("a");
	await page.keyboard.up("d");
	await expect(page.getByRole("button", { name: "Submit Score" })).toHaveCount(
		0,
	);
	await page
		.getByRole("dialog", { name: "Run complete" })
		.getByRole("button", { name: "Return to builder" })
		.click();
	await expect(
		page.getByRole("button", { name: "Aft 1 · Universal: Rail gun" }),
	).toBeVisible();
});

test("cruiser fits eight mounts, preserves Fighter and flies", async ({
	page,
}) => {
	await page.goto("/lab/builder");
	await page.getByRole("button", { name: /Heavy Corvette.*8 SLOTS/ }).click();
	await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
	await page.getByRole("button", { name: /Rail gun.*15 mass/ }).click();
	await page.getByRole("button", { name: "Aft 2 · Universal: Empty" }).click();
	await page.getByRole("button", { name: /Small ion.*10 mass/ }).click();
	await page.getByRole("button", { name: /Fighter.*6 SLOTS/ }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }),
	).toBeVisible();
	await page.reload();
	await page.getByRole("button", { name: /Heavy Corvette.*8 SLOTS/ }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Aft 2 · Universal: Small ion" }),
	).toBeVisible();
	await page.setViewportSize({ width: 1440, height: 1100 });
	await page.screenshot({
		path: "artifacts/cruiser-builder.png",
		fullPage: true,
	});
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await page.keyboard.down("a");
	await page.keyboard.down("d");
	await expect
		.poll(async () =>
			Number(await page.locator(".flight-page").getAttribute("data-ticks")),
		)
		.toBeGreaterThan(45);
	await page.keyboard.up("a");
	await page.keyboard.up("d");
	await page.screenshot({ path: "artifacts/cruiser-flight.png" });
	await page.getByRole("button", { name: "Return to builder" }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
	).toBeVisible();
});

test("new engine catalog resets old saves and exposes plasma charging in flight", async ({
	page,
}) => {
	await page.addInitScript(() =>
		localStorage.setItem("void-drift-builds-v1", JSON.stringify({ old: true })),
	);
	await page.goto("/builder");
	await expect
		.poll(() =>
			page.evaluate(() => localStorage.getItem("void-drift-builds-v1")),
		)
		.toBeNull();
	await expect(
		page.getByRole("button", { name: /Heavy ion.*750 powered ceiling/ }),
	).toBeVisible();
	await page.getByRole("button", { name: /Plasma.*24 mass/ }).click();
	await expect(
		page.getByRole("button", { name: "Right side · mirrored E: Plasma" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await page.keyboard.down("a");
	await expect(page.locator(".engine-feedback")).toContainText("charging");
	await expect(page.locator(".engine-feedback")).toContainText("firing");
	await page.keyboard.up("a");
	await expect(page.locator(".engine-feedback")).toHaveCount(0);
	await page.keyboard.down("a");
	await expect(page.locator(".engine-feedback")).toContainText("charging");
	await page.keyboard.up("a");
});
