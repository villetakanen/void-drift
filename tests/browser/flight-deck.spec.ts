import type { Locator, Page } from "@playwright/test";
import { PAD_ASSEMBLY_HEIGHT_PX } from "../../apps/web/src/components/inputs/thrust-pads";
import { GAME_GUTTER_PX } from "../../apps/web/src/lib/game-screen";
import type {
  InputAction,
  ThrustPad,
} from "../../packages/core/src/lib/entities/Input";
import { THRUST_PADS } from "../../packages/core/src/lib/entities/Input";
import { expect, test } from "../helpers/local-browser";
import { expectLit, padPoint } from "../helpers/thrust-pads";

type Box = { x: number; y: number; width: number; height: number };

/** Sub-pixel layout rounding. */
const EPSILON = 0.5;

function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width - EPSILON &&
    b.x < a.x + a.width - EPSILON &&
    a.y < b.y + b.height - EPSILON &&
    b.y < a.y + a.height - EPSILON
  );
}

function within(inner: Box, outer: Box) {
  return (
    inner.x >= outer.x - EPSILON &&
    inner.y >= outer.y - EPSILON &&
    inner.x + inner.width <= outer.x + outer.width + EPSILON &&
    inner.y + inner.height <= outer.y + outer.height + EPSILON
  );
}

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error("element has no box");
  return found;
}

/** Stage, active area and the four gutters in page pixels. */
async function screenRects(page: Page) {
  const stageLocator = page.locator(".flight-stage");
  const stage = await box(stageLocator);
  const width = Number(await stageLocator.getAttribute("data-active-width"));
  const height = Number(await stageLocator.getAttribute("data-active-height"));
  const active = {
    x: stage.x + (stage.width - width) / 2,
    y: stage.y + (stage.height - height) / 2,
    width,
    height,
  };
  const side = GAME_GUTTER_PX.side;
  const edge = GAME_GUTTER_PX.edge;
  return {
    stage,
    active,
    left: { x: stage.x, y: stage.y, width: side, height: stage.height },
    right: {
      x: stage.x + stage.width - side,
      y: stage.y,
      width: side,
      height: stage.height,
    },
    bottom: {
      x: stage.x + side,
      y: stage.y + stage.height - edge,
      width: stage.width - 2 * side,
      height: edge,
    },
  };
}

function gutterParts(page: Page, side: "left" | "right") {
  return {
    instruments: page.locator(`.deck-instruments.${side}`),
    button: page.locator(`.deck-button.${side}`),
    pads: page.locator(`.thrust-pads[data-side="${side}"]`),
  };
}

async function startSurvival(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
    { timeout: 10_000 },
  );
}

test("the deck sits in the gutters and never covers the active area", async ({
  page,
}) => {
  await startSurvival(page, 1440, 900);
  await expect(page.locator(".deck-info small").first()).toHaveText(
    "G CLASS / SHARED CHALLENGE",
  );
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [2560, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(100);
    const rects = await screenRects(page);
    await expect
      .poll(async () => (await box(page.locator(".flight-stage"))).width)
      .toBeCloseTo(width, 0);
    for (const side of ["left", "right"] as const) {
      const parts = gutterParts(page, side);
      for (const part of [parts.instruments, parts.button, parts.pads]) {
        const rect = await box(part);
        expect(within(rect, rects[side])).toBe(true);
        expect(overlaps(rect, rects.active)).toBe(false);
      }
      // Pads span the gutter and stand at its bottom.
      const pads = await box(parts.pads);
      expect(pads.width).toBeCloseTo(GAME_GUTTER_PX.side, 0);
      expect(pads.y + pads.height).toBeCloseTo(
        rects.stage.y + rects.stage.height,
        0,
      );
      // The deck button sits just above its pads.
      const button = await box(parts.button);
      expect(button.y + button.height).toBeLessThanOrEqual(pads.y + EPSILON);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
    const info = await box(page.locator(".deck-info"));
    expect(within(info, rects.bottom)).toBe(true);
    expect(overlaps(info, rects.active)).toBe(false);
  }
});

test("at the 700 px design floor the pads stand full height without overlap", async ({
  page,
}) => {
  await startSurvival(page, 1280, 700);
  for (const side of ["left", "right"] as const) {
    const parts = gutterParts(page, side);
    const instruments = await box(parts.instruments);
    const button = await box(parts.button);
    const pads = await box(parts.pads);
    expect(pads.height).toBeCloseTo(PAD_ASSEMBLY_HEIGHT_PX, 0);
    expect(overlaps(instruments, button)).toBe(false);
    expect(overlaps(instruments, pads)).toBe(false);
    expect(overlaps(button, pads)).toBe(false);
  }
});

test("pressing each pad lights the pads of its action; the active area gives none", async ({
  page,
}) => {
  await startSurvival(page, 1440, 900);
  const deck = page.locator(".flight-page");
  // invertControls defaults on, so each side's pads resolve to the other side.
  const expected: Record<ThrustPad, InputAction> = {
    leftUpper: "R",
    leftLower: "RF",
    rightUpper: "L",
    rightLower: "LF",
  };
  for (const pad of THRUST_PADS) {
    const point = await padPoint(page, pad);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expectLit(deck, expected[pad]);
    await page.mouse.up();
    await expectLit(deck, null);
  }
  const { active } = await screenRects(page);
  for (const [u, v] of [
    [0.5, 0.5],
    [0.02, 0.98],
    [0.98, 0.98],
  ]) {
    await page.mouse.move(
      active.x + active.width * u,
      active.y + active.height * v,
    );
    await page.mouse.down();
    await page.clock.runFor(100);
    await expectLit(deck, null);
    await page.mouse.up();
  }
});

test("cancellation and lost capture on a held pad clear the action", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  const point = await padPoint(page, "rightLower");
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...point, id: 1 }],
  });
  await expectLit(deck, "LF");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expectLit(deck, null);

  // A press whose capture is taken away releases too.
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expectLit(deck, "LF");
  await page
    .locator('[data-pad="rightLower"]')
    .evaluate((node) =>
      node.dispatchEvent(
        new PointerEvent("lostpointercapture", { bubbles: true, pointerId: 1 }),
      ),
    );
  await expectLit(deck, null);
  await page.mouse.up();
});

test("deck buttons: Pause pauses and hides the deck; Weapons is disabled", async ({
  page,
}) => {
  await startSurvival(page, 1440, 900);
  const weapons = page.getByRole("button", { name: "Weapons", exact: true });
  await expect(weapons).toBeDisabled();
  const opacity = (button: Locator) =>
    button.evaluate((node) => Number(getComputedStyle(node).opacity));
  // Disabled Weapons is drawn fainter than the live Pause.
  expect(await opacity(weapons)).toBeLessThan(
    await opacity(page.getByRole("button", { name: "Pause", exact: true })),
  );
  const deck = page.locator(".flight-page");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(deck).toHaveAttribute("data-paused", "true");
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  for (const part of await page.locator("[data-deck]").all())
    await expect(part).toBeHidden();
  const tick = await deck.getAttribute("data-ticks");
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  for (const part of await page.locator("[data-deck]").all())
    await expect(part).toBeVisible();
});

test("Practice labels itself GOD MODE in the bottom gutter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/hangar");
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
  await expect(page.locator(".deck-info small").first()).toHaveText("GOD MODE");
  // Practice shows no survival time.
  await expect(page.locator(".deck-instruments.right .timer")).toHaveCount(0);
});

test("both pad assemblies share one height that holds from countdown to play", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  const deck = page.locator(".flight-page");
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-phase", "starting");
  const heights = async () =>
    Promise.all(
      (["left", "right"] as const).map(
        async (side) => (await box(gutterParts(page, side).pads)).height,
      ),
    );
  const [countdownLeft, countdownRight] = await heights();
  expect(countdownLeft).toBeCloseTo(countdownRight, 0);
  await page.clock.runFor(3000);
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  const [playLeft, playRight] = await heights();
  expect(playLeft).toBeCloseTo(playRight, 0);
  expect(playLeft).toBeCloseTo(countdownLeft, 0);
});

test("an overlong info row keeps the mode label whole and inside the row", async ({
  page,
}) => {
  // The narrowest 4:3 stage at the 700 px floor leaves the row its least room.
  await startSurvival(page, 934, 700);
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(200);
  await expect(page.locator(".deck-info .engine-feedback")).toBeVisible();
  await expect(page.locator(".deck-info .mode-label")).toHaveText(
    "G CLASS / SHARED CHALLENGE",
  );
  // Overfill the status line and measure before the next frame redraws it.
  const layout = await page.locator(".deck-info").evaluate((row) => {
    const feedback = row.querySelector(".engine-feedback");
    const label = row.querySelector(".mode-label");
    if (!feedback || !label) throw new Error("info row parts missing");
    feedback.textContent = "engine feedback ".repeat(40);
    const rect = (node: Element) => node.getBoundingClientRect();
    return {
      row: { left: rect(row).left, right: rect(row).right },
      label: { left: rect(label).left, right: rect(label).right },
      labelWhole: label.scrollWidth <= label.clientWidth,
      overlong: row.scrollWidth > row.clientWidth,
      feedbackClipped: feedback.scrollWidth > feedback.clientWidth,
    };
  });
  expect(layout.labelWhole).toBe(true);
  expect(layout.label.left).toBeGreaterThanOrEqual(layout.row.left - EPSILON);
  expect(layout.label.right).toBeLessThanOrEqual(layout.row.right + EPSILON);
  // The status line gives way inside the row instead of pushing it wider.
  expect(layout.feedbackClipped).toBe(true);
  expect(layout.overlong).toBe(false);
  await page.keyboard.up("ArrowUp");
});
