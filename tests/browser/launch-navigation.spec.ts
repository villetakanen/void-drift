import type { Page } from "@playwright/test";
import {
  buildStats,
  starterLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";

async function setup(page: Page) {
  await page.clock.install();
  // A reproducible arrival system lets both survival paths end without a test-only UI.
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 157;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
}

async function launch(page: Page, source: "title" | "hangar") {
  await page.goto(source === "title" ? "/" : "/hangar?chassis=wasp");
  await page
    .getByRole("button", {
      name: source === "title" ? "PRESS START" : "Start survival",
    })
    .click();
  await page.clock.runFor(3400);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
  );
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-launch-source",
    source,
  );
}

async function finish(page: Page) {
  // Seed 158 coasts into the star without steering.
  for (let i = 0; i < 25; i++) {
    if (
      (await page.locator(".flight-page").getAttribute("data-status")) ===
      "GAME_OVER"
    )
      break;
    await page.clock.runFor(1000);
  }
  await expect(
    page.getByRole("dialog", { name: "Run complete" }),
  ).toBeVisible();
}

for (const source of ["title", "hangar"] as const) {
  test(`${source} flight abort returns to its launch source`, async ({
    page,
  }) => {
    await setup(page);
    await launch(page, source);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.getByRole("button", { name: "Abort" }).click();
    if (source === "title")
      await expect(
        page.getByRole("button", { name: "PRESS START" }),
      ).toBeVisible();
    else
      await expect(page.getByRole("heading", { name: "Hangar" })).toBeVisible();
  });

  test(`${source} game over returns to its launch source`, async ({ page }) => {
    await setup(page);
    await launch(page, source);
    await finish(page);
    await page
      .getByRole("button", {
        name:
          source === "title" ? "Return to title screen" : "Return to Hangar",
      })
      .click();
    if (source === "title")
      await expect(
        page.getByRole("button", { name: "PRESS START" }),
      ).toBeVisible();
    else
      await expect(page.getByRole("heading", { name: "Hangar" })).toBeVisible();
  });
}

test("scores from a Hangar run return to title", async ({ page }) => {
  await setup(page);
  await launch(page, "hangar");
  await finish(page);
  await page
    .getByRole("dialog", { name: "Run complete" })
    .getByRole("link", { name: "Top Scores" })
    .click();
  await page.getByRole("link", { name: "Return to title screen" }).click();
  await expect(page.getByRole("button", { name: "PRESS START" })).toBeFocused();
});

test("a Hangar choice does not change the Wasp launched from title", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/hangar");
  await page
    .getByRole("radiogroup", { name: "Choose chassis" })
    .getByText("Corvette", { exact: true })
    .click();
  await page.getByRole("link", { name: "Return to title screen" }).click();
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3400);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-launch-source",
    "title",
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("max", String(buildStats(starterLoadout("wasp")).capacity));
});
