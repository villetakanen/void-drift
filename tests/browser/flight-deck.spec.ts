import { expect, test } from "../helpers/local-browser";
import { expectLit, padPoint } from "../helpers/thrust-pads";

// A captured pointer can disappear without an up event. Propulsion must not stick.
test("losing pointer capture clears a held flight action", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-phase", "playing");
  const point = await padPoint(page, "rightLower");
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expectLit(deck, "LF");
  await page
    .locator('[data-pad="rightLower"]')
    .evaluate((node) => node.releasePointerCapture(1));
  await page.mouse.move(point.x + 1, point.y);
  await expectLit(deck, null);
  await page.mouse.up();
});
