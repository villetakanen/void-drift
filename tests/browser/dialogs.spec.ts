import type { Page } from "@playwright/test";
import { expect, test } from "../helpers/local-browser";

async function expectModal(page: Page, name: string) {
	const dialog = page.getByRole("dialog", { name });
	await expect(dialog).toBeVisible();
	await expect(dialog).toHaveAttribute("aria-modal", "true");
	const controls = dialog.locator(
		"button:visible:not([disabled]), a:visible[href], input:visible:not([disabled])",
	);
	await controls.last().focus();
	await page.keyboard.press("Tab");
	await expect(controls.first()).toBeFocused();
	await controls.first().focus();
	await page.keyboard.press("Shift+Tab");
	await expect(controls.last()).toBeFocused();
	await expect(page.locator("[data-stage]")).toHaveAttribute("inert", "");
}

test("pause is modal and restores focus to the game", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	const pause = page.getByRole("button", { name: "Pause", exact: true });
	await pause.focus();
	await page.keyboard.press("Escape");
	await expectModal(page, "Paused");
	const header = page.locator("header").first();
	await expect(header).toHaveJSProperty("inert", true);
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog", { name: "Paused" })).toBeHidden();
	await expect(page.locator("[data-stage]")).not.toHaveAttribute("inert");
	await expect(pause).toBeFocused();
});

test("Lab dialog traps focus, respects Escape and restores its opener", async ({
	page,
}) => {
	await page.goto("/lab/surfaces");
	const opener = page.getByRole("button", { name: "Open dialog" });
	await opener.click();
	await expect(
		page.getByRole("button", { name: "Close", exact: true }),
	).toBeFocused();
	await expectModal(page, "Demo dialog");
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog", { name: "Demo dialog" })).toBeHidden();
	await expect(opener).toBeFocused();
	await page.getByLabel("Escape closes it", { exact: false }).uncheck();
	await opener.click();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog", { name: "Demo dialog" })).toBeVisible();
	await page.getByRole("button", { name: "Close", exact: true }).click();
	await expect(opener).toBeFocused();
});
