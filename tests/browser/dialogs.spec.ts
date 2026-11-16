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
  const dialog = page.getByRole("dialog", { name: "Paused" });
  await expect(
    dialog.getByRole("button", { name: "Resume", exact: true }),
  ).toBeFocused();
  await expectModal(page, "Paused");
  // Pause is actions/navigation only; preferences belong on the separate page.
  await expect(
    dialog.locator(
      "input, select, textarea, [role=switch], [role=slider], [role=combobox]",
    ),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("link", { name: "Settings", exact: true }),
  ).toHaveAttribute("href", "/settings");
  await expect(page.locator("header")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeHidden();
  await expect(page.locator("[data-stage]")).not.toHaveAttribute("inert");
  await expect(pause).toBeFocused();
  await pause.click();
  await dialog.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/?$/);
  await expect(
    page.getByRole("checkbox", { name: "Speed camera", exact: true }),
  ).toBeVisible();
});
