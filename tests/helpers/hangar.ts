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

/** Prepare unranked Survival so gameplay guards do not depend on a live challenge. */
export async function usePlaygroundForSurvival(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("void-drift:experimental", "On");
  });
}
