import { expect, test } from "@playwright/test";

test("Gravity coil fits, persists and flies separately from solar Loading coil", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto("/builder");
	await expect(page.getByRole("button", { name: /^Gravity coil/ })).toHaveCount(
		0,
	);
	await page
		.getByRole("button", { name: "Hull 1 · Equipment: Empty", exact: true })
		.click();
	const part = page.getByRole("button", { name: /^Gravity coil/ });
	await expect(part).toContainText("Generates 1 energy/s");
	await expect(part.locator("svg path")).not.toHaveCount(0);
	await part.click();
	await page
		.getByRole("button", { name: "Aft 1 · Universal: Empty", exact: true })
		.click();
	await page.getByRole("button", { name: /^Loading coil/ }).click();
	await page.reload();
	await expect(
		page.getByRole("button", {
			name: "Hull 1 · Equipment: Gravity coil",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Aft 1 · Universal: Loading coil",
			exact: true,
		}),
	).toBeVisible();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-status",
		"PLAYING",
	);
	await expect(
		page.getByRole("progressbar", { name: "Power" }),
	).toHaveAttribute("max", "100");
	await page.keyboard.down("a");
	await expect
		.poll(async () =>
			Number(await page.locator(".flight-page").getAttribute("data-ticks")),
		)
		.toBeGreaterThan(30);
	await page.keyboard.up("a");
	await page
		.getByRole("button", { name: "Return to builder", exact: true })
		.click();
	await page
		.getByRole("button", {
			name: "Hull 1 · Equipment: Gravity coil",
			exact: true,
		})
		.click();
	await page
		.getByRole("button", { name: "Remove fitting", exact: true })
		.click();
	await expect(
		page.getByRole("button", {
			name: "Hull 1 · Equipment: Empty",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Aft 1 · Universal: Loading coil",
			exact: true,
		}),
	).toBeVisible();
	expect(errors).toEqual([]);
});
