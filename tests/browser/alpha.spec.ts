import {
  buildStats,
  starterLoadout,
} from "../../packages/mode-a/src/lib/schemas/loadout";
import { expect, test } from "../helpers/local-browser";
import { expectLit, padPoint } from "../helpers/thrust-pads";

test("title starts a stock Wasp and keyboard controls reach flight", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const deck = page.locator(".flight-page");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  const y = await deck.getAttribute("data-y");
  await page.keyboard.down("ArrowUp");
  await expectLit(deck, "LR");
  await page.clock.runFor(120);
  await expect(deck).not.toHaveAttribute("data-y", y ?? "");
  await page.keyboard.up("ArrowUp");
  await expectLit(deck, null);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const tick = await deck.getAttribute("data-ticks");
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
});

test("landscape thrust pads support simultaneous activation, cancellation and focus loss", async ({
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
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
    { timeout: 10_000 },
  );
  const left = page.locator('.thrust-pads[data-side="left"]');
  const a = await padPoint(page, "leftUpper"),
    b = await padPoint(page, "rightUpper");
  const deck = page.locator(".flight-page");
  const power = page.getByRole("progressbar", { name: "Power" });
  const beforePower = Number(await power.getAttribute("value"));
  const beforeTicks = Number(await deck.getAttribute("data-ticks"));
  const beforeY = await deck.getAttribute("data-y");
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { ...a, id: 1 },
      { ...b, id: 2 },
    ],
  });
  // Both upper pads resolve to forward.
  await expectLit(deck, "LR");
  await page.clock.runFor(500);
  await expect(deck).not.toHaveAttribute("data-y", beforeY ?? "");
  const elapsedTicks =
    Number(await deck.getAttribute("data-ticks")) - beforeTicks;
  const spent = beforePower - Number(await power.getAttribute("value"));
  // More than catalog idle drain proves the touch input reached propulsion.
  const stats = buildStats(starterLoadout("wasp"));
  const idleDrain = stats.capacity / stats.endurance;
  expect(spent).toBeGreaterThan((idleDrain * elapsedTicks) / 60 + 1e-6);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expectLit(deck, null);
  await page.keyboard.down("ArrowUp");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  // Blur pauses: the pads are released and hide behind the Paused dialog.
  await expectLit(deck, null);
  await expect(left).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await context.close();
});
