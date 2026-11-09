import { expect, test } from "../helpers/local-browser";

test("a touch on the central fly area fires no thruster", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).tap();
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-phase", "playing");
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
  await expect(deck).toHaveAttribute("data-action", "none");
  await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
  await expect(page.locator(".engine.right")).not.toHaveClass(/active/);
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
  );
  const deck = page.locator(".flight-page");
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyA");
  // invertControls defaults on, so left input with forward resolves to RF.
  await expect(deck).toHaveAttribute("data-action", "RF");
  await expect(page.locator(".engine.left")).toHaveClass(/active/);
  await expect(page.locator(".engine.right")).toHaveClass(/active/);
  await page.keyboard.up("KeyA");
  await expect(deck).toHaveAttribute("data-action", "LR");
  await page.keyboard.up("KeyW");
  await expect(deck).toHaveAttribute("data-action", "none");
  await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
});
