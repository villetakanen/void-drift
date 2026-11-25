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

test("weapons toggles once per tap even while a thumb holds thrust", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/hangar");
  await page.getByRole("button", { name: "Practice", exact: true }).tap();
  const deck = page.locator(".flight-page");
  const weapons = page.getByRole("button", { name: "Automatic weapons" });
  await expect(weapons).toHaveAttribute("aria-pressed", "true");
  await weapons.tap();
  await expect(weapons).toHaveAttribute("aria-pressed", "false");

  const box = await weapons.boundingBox();
  if (!box) throw new Error("Weapons flap missing");
  const thumb = { ...(await padPoint(page, "rightLower")), id: 1 };
  const tap = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 };
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [thumb],
  });
  await expect(deck).toHaveAttribute("data-action", "LF");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [tap],
  });
  await expect(weapons).toHaveAttribute("aria-pressed", "false");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [tap],
  });
  await expect(weapons).toHaveAttribute("aria-pressed", "true");
  await expect(deck).toHaveAttribute("data-action", "LF");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(deck).toHaveAttribute("data-action", "none");

  await weapons.click();
  await expect(weapons).toHaveAttribute("aria-pressed", "false");
  await weapons.press("Space");
  await expect(weapons).toHaveAttribute("aria-pressed", "true");
});
