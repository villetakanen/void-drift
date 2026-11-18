import { GAME_MIN_RATIO } from "../../apps/web/src/lib/game-screen";
import {
  buildStats,
  defaultLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { chooseShip } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("fit, persist, practise, pause and return to an assembled ship", async ({
  page,
}) => {
  const time = new Date("2026-11-03T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  const fitted = defaultLoadout("fighter");
  fitted.hull[0] = "heavy-well";
  const capacity = String(buildStats(fitted).capacity);
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Heavy Potential Well\b/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
    }),
  ).toBeVisible();
  // A 4:3 viewport: Practice fills it with no header, so flight is not gated.
  await page.setViewportSize({
    width: 1440,
    height: (1440 * GAME_MIN_RATIO.height) / GAME_MIN_RATIO.width,
  });
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("max", capacity);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
    }),
  ).toBeVisible();
});

test("corrupt browser storage recovers to flyable defaults", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("void-drift-builds-v3", '{"broken":true}'),
  );
  await page.goto("/hangar");
  await expect(page.getByRole("status")).toContainText(/restored/i);
  await expect(
    page.getByRole("tab", { name: "Wasp", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: "Practice", exact: true }),
  ).toBeEnabled();
});
