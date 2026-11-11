import { expect, test } from "../helpers/local-browser";

test("a completed run returns to title and starts a fresh run", async ({
  page,
}) => {
  await page.clock.install();
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
