import type { Page } from "@playwright/test";

/** Exercise the actual chooser; URL queries never choose the active ship. */
export async function chooseShip(page: Page, name: string) {
  await page
    .getByRole("tablist", { name: "Choose chassis" })
    .getByRole("tab", { name, exact: true })
    .click();
}

export async function enablePreviewContent(page: Page) {
  await page.getByRole("checkbox", { name: "Playground", exact: true }).check();
}
