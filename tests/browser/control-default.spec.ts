import { expect, test } from "@playwright/test";

test("inversion defaults on and an explicit opt-out persists", async ({
	page,
}) => {
	await page.goto("/settings");
	const toggle = page.getByRole("checkbox");
	await expect(toggle).toBeChecked();
	await toggle.uncheck();
	await page.reload();
	await expect(toggle).not.toBeChecked();
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	await page.keyboard.down("ArrowLeft");
	await expect(page.locator(".engine.left")).toHaveClass(/active/);
	await expect(page.locator(".engine.right")).not.toHaveClass(/active/);
	await page.keyboard.up("ArrowLeft");
});
