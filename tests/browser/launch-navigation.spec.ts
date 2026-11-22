import { chooseShip, enablePreviewContent } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("title arrow navigation neither activates early nor traps keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Title screen" });
  const start = menu.getByRole("button", { name: "PRESS START" });
  const hangar = menu.getByRole("link", { name: "HANGAR", exact: true });
  const credits = menu.getByRole("link", { name: "CREDITS" });
  await expect(start).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(hangar).toBeFocused();
  await expect(page).toHaveURL("/");
  await page.keyboard.press("Home");
  await expect(start).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(credits).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(start).toBeFocused();
  await page.keyboard.press("End");
  await expect(credits).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(credits).not.toBeFocused();
  expect(
    await menu.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(false);
  await hangar.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/hangar$/);
});

test("game-over Return restores the title menu", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        // Seed 26 crosses the star on an idle title launch.
        array[0] = 25;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/");
  const start = page.getByRole("button", { name: "PRESS START" });
  await start.click();
  const result = page.getByRole("dialog", { name: "Run complete" });
  for (let i = 0; i < 29 && !(await result.isVisible()); i++) {
    await page.clock.runFor(1000);
  }
  await expect(result).toBeVisible();
  await expect(result.getByText("Top Scores", { exact: true })).toHaveCount(0);
  await result.getByRole("button", { name: "Return", exact: true }).click();
  await expect(start).toBeVisible();
});

test("Retry starts a fresh arrival with the fitted Playground build and still returns to Hangar", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        // Seed 13 ends an idle Scout run. Repeat the same entropy on Retry
        // so picking a distinct seed cannot pass just by chance.
        array[0] = 12;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await chooseShip(page, "Scout");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.getByRole("button", { name: "Survival", exact: true }).click();
  const flight = page.locator(".flight-page");
  const power = page.getByRole("progressbar", { name: "Power" });
  await expect(flight).toHaveAttribute("data-seed", "13");
  const capacity = String(
    await power.evaluate((meter: HTMLProgressElement) => meter.max),
  );
  await page.clock.runFor(3400);
  await expect(flight).toHaveAttribute("data-phase", "playing");
  for (let i = 0; i < 25; i++) {
    if ((await flight.getAttribute("data-status")) === "GAME_OVER") break;
    await page.clock.runFor(1000);
  }
  const result = page.getByRole("dialog", { name: "Run complete" });
  await expect(result).toBeVisible();
  await result.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(result).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeFocused();
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await expect(flight).toHaveAttribute("data-seed", /^\d+$/);
  await expect(flight).not.toHaveAttribute("data-seed", "13");
  await expect(flight).toHaveAttribute("data-mode", "survival");
  await expect(flight).toHaveAttribute("data-chassis", "scout");
  await expect(flight).toHaveAttribute("data-experimental", "On");
  await expect(power).toHaveAttribute("max", capacity);
  await expect(power).toHaveAttribute("value", capacity);
  await page.clock.runFor(1000);
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await expect(flight).toHaveAttribute("data-ticks", "0");
  await page.clock.runFor(2400);
  await expect(flight).toHaveAttribute("data-phase", "playing");
  await page.keyboard.press("Escape");
  await page
    .getByRole("dialog", { name: "Paused" })
    .getByRole("button", { name: "Abort", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Potential Well" }),
  ).toBeVisible();
});
