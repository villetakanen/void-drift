import { expect, test } from "../helpers/local-browser";
import { expectLit } from "../helpers/thrust-pads";

test("a touch on the central fly area fires no thruster", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).tap();
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  const stage = await page.locator("[data-stage]").boundingBox();
  if (!stage) throw new Error("Stage missing");
  const client = await context.newCDPSession(page);
  // Hold one touch left and one right of centre, where the old half-split fired.
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: stage.x + stage.width * 0.4, y: stage.y + stage.height / 2, id: 1 },
      { x: stage.x + stage.width * 0.6, y: stage.y + stage.height / 2, id: 2 },
    ],
  });
  const ticks = Number(await deck.getAttribute("data-ticks"));
  await page.clock.runFor(300);
  await expect(deck).not.toHaveAttribute("data-ticks", String(ticks));
  await expectLit(deck, null);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await context.close();
});

test("keyboard forward with a turn resolves to forward-turn and fires both thrusters", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
    { timeout: 10_000 },
  );
  const deck = page.locator(".flight-page");
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyA");
  // invertControls defaults on, so left input with forward resolves to RF.
  await expectLit(deck, "RF");
  await page.keyboard.up("KeyA");
  await expectLit(deck, "LR");
  await page.keyboard.up("KeyW");
  await expectLit(deck, null);
});
