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
	await page.getByRole("button", { name: /Ion engine.*10 mass/ }).click();
	await expect(
		page.getByRole("button", { name: "Right side · mirrored E: Ion engine" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Hull 1 · G/U: Empty" }).click();
	await expect(
		page.getByRole("button", { name: /Ion engine.*10 mass/ }),
	).toHaveCount(0);
	await page.getByRole("button", { name: /Energy storage.*18 mass/ }).click();
	await expect(
		page
			.getByRole("region", { name: "Ship assembly" })
			.getByRole("button", { name: /Hull 1.*Energy storage/ }),
	).toBeVisible();
	await page.getByRole("button", { name: /Scout.*4 SLOTS/ }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · G/U: Empty" }),
	).toBeVisible();
	await page.getByRole("button", { name: /Fighter.*6 SLOTS/ }).click();
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Hull 1 · G/U: Energy storage" }),
	).toBeVisible();
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
		page.getByRole("button", { name: "Hull 1 · G/U: Energy storage" }),
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
		localStorage.setItem("void-drift-builds-v1", '{"broken":true}'),
	);
	await page.goto("/builder");
	await expect(page.getByRole("status")).toContainText("Restored flyable");
	await expect(
		page.getByRole("button", {
			name: "Left side · mirrored E: Fission engine",
		}),
	).toBeVisible();
});
