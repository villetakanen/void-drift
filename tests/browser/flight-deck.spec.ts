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
  const svg = page.locator('.thrust-pads[data-side="right"] svg');
  await svg.evaluate((node) => {
    node.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !(event instanceof PointerEvent) ||
          !(event.target instanceof Element)
        )
          throw new Error("Thrust press has no capture target");
        event.target.setAttribute(
          "data-test-captured-pointer",
          String(event.pointerId),
        );
      },
      { capture: true, once: true },
    );
  });
  const point = await padPoint(page, "rightLower");
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expectLit(deck, "LF");
  await svg.evaluate((node) => {
    const target = node.querySelector("[data-test-captured-pointer]");
    if (!target) throw new Error("Thrust press did not capture its pointer");
    const pointerId = Number(target.getAttribute("data-test-captured-pointer"));
    target.dispatchEvent(
      new PointerEvent("lostpointercapture", { pointerId, bubbles: true }),
    );
    target.removeAttribute("data-test-captured-pointer");
  });
  await expectLit(deck, null);
  await page.mouse.up();
});
