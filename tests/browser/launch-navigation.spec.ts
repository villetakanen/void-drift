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

test("a completed run returns to title and starts a fresh run", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      if (array instanceof Uint32Array && array.length === 1) {
        // Seed 26 crosses the star during an idle arrival in the generated system.
        array[0] = 25;
        return array;
      }
      return random(array);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/");
  const start = page.getByRole("button", { name: "PRESS START" });
  await start.click();
  await page.clock.runFor(3400);
  const flight = page.locator(".flight-page");
  await expect(flight).toHaveAttribute("data-phase", "playing");
  for (let i = 0; i < 25; i++) {
    if ((await flight.getAttribute("data-status")) === "GAME_OVER") break;
    await page.clock.runFor(1000);
  }
  const result = page.getByRole("dialog", { name: "Run complete" });
  await expect(result).toBeVisible();
  await result.getByRole("button", { name: "Return to title screen" }).click();
  await start.click();
  await expect(result).toHaveCount(0);
  await expect(flight).toHaveAttribute("data-phase", "starting");
  await expect(flight).toHaveAttribute("data-ticks", "0");
  await page.clock.runFor(3400);
  await expect(flight).toHaveAttribute("data-phase", "playing");
});
