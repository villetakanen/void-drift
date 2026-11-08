import type { Page } from "@playwright/test";
import {
  GAME_GUTTER_PX,
  GAME_HEIGHT,
  GAME_MIN_RATIO,
} from "../../apps/web/src/lib/game-screen";
import { expect, test } from "../helpers/local-browser";

/** The stage fills the (safe-area-free) viewport with Survival's gutters. */
async function expectStageFills(page: Page, width: number, height: number) {
  const stage = page.locator(".flight-stage");
  // Resize callbacks land asynchronously; wait for the stage to follow.
  await expect
    .poll(async () => (await stage.boundingBox())?.width)
    .toBeCloseTo(width, 0);
  await expect
    .poll(async () => (await stage.boundingBox())?.height)
    .toBeCloseTo(height, 0);
  const box = await stage.boundingBox();
  if (!box) throw new Error("Stage missing");
  const geometry = await stage.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      side: parseFloat(style.getPropertyValue("--game-gutter")),
      edge: parseFloat(style.getPropertyValue("--game-gutter-edge")),
      width: Number(node.getAttribute("data-active-width")),
      height: Number(node.getAttribute("data-active-height")),
      logicalWidth: Number(node.getAttribute("data-active-logical-width")),
      logicalHeight: Number(node.getAttribute("data-active-logical-height")),
    };
  });
  expect(geometry.side).toBe(GAME_GUTTER_PX.side);
  expect(geometry.edge).toBe(GAME_GUTTER_PX.edge);
  expect(geometry.width).toBeCloseTo(box.width - 2 * GAME_GUTTER_PX.side, 0);
  expect(geometry.height).toBeCloseTo(box.height - 2 * GAME_GUTTER_PX.edge, 0);
  const scale = box.height / GAME_HEIGHT;
  expect(geometry.logicalWidth * scale).toBeCloseTo(geometry.width, 1);
  expect(geometry.logicalHeight * scale).toBeCloseTo(geometry.height, 1);
  await expect(stage.locator("canvas")).toHaveAttribute(
    "width",
    String(Math.round((GAME_HEIGHT * width) / height)),
  );
  await expect(stage.locator("canvas")).toHaveAttribute(
    "height",
    String(GAME_HEIGHT),
  );
}

test("Survival fits the adaptive stage without navigation or page overflow", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const deck = page.locator(".flight-page");
  const seed = await deck.getAttribute("data-seed");
  const ticks = await deck.getAttribute("data-ticks");
  for (const [width, height] of [
    [1920, 1080],
    [1024, 768],
    [1200, 800],
    [844, 390],
    [2560, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(100);
    await expectStageFills(page, width, height);
    await expect(deck).toHaveAttribute("data-seed", seed ?? "");
    await expect(deck).toHaveAttribute("data-ticks", ticks ?? "");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Left engine" })).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("link", { name: "Top Scores" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("Practice fills the viewport with no header and leaves through Pause and Abort", async ({
  page,
}) => {
  const width = 1440;
  const height = (width * GAME_MIN_RATIO.height) / GAME_MIN_RATIO.width;
  await page.clock.install();
  await page.setViewportSize({ width, height });
  await page.goto("/hangar");
  await page.getByRole("button", { name: "Test flight", exact: true }).click();
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-status", "PLAYING");
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  // With no header, the stage fills the viewport at 4:3 and ultra-wide.
  for (const [w, h] of [
    [width, height],
    [2560, 1080],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.clock.runFor(100);
    await expectStageFills(page, w, h);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width, height });
  await expect(deck).toHaveAttribute("data-narrow", "false");
  // One pixel taller than 4:3 is gated, so the full viewport is measured.
  await page.setViewportSize({ width, height: height + 1 });
  await expect(deck).toHaveAttribute("data-narrow", "true");
  await expect(
    page.getByRole("dialog", { name: "Rotate to continue" }),
  ).toBeVisible();
  await page.setViewportSize({ width, height });
  await expect(deck).toHaveAttribute("data-narrow", "false");
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(deck).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Test flight", exact: true }),
  ).toBeVisible();
});

test("a viewport narrower than 4:3 freezes the countdown and requires fresh input after Resume", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(400);
  await page.keyboard.down("ArrowUp");
  await page.setViewportSize({ width: 768, height: 1024 });
  const deck = page.locator(".flight-page");
  await expect(
    page.getByRole("dialog", { name: "Rotate to continue" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.runFor(5000);
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await expect(deck).toHaveAttribute("data-phase", "starting");
  await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(4000);
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-phase", "starting");
  await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
  await page.clock.runFor(2300);
  await expect(deck).toHaveAttribute("data-phase", "playing");
  await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".engine.left")).toHaveClass(/active/);
});

test("launch narrower than 4:3 is blocked and backgrounding requires deliberate Resume", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(
    page.getByRole("dialog", { name: "Rotate to continue" }),
  ).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.locator(".flight-page")).toHaveAttribute("data-ticks", "0");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(3500);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const deck = page.locator(".flight-page");
  const tick = await deck.getAttribute("data-ticks");
  await page.clock.runFor(10000);
  await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(100);
  const advanced = Number(await deck.getAttribute("data-ticks")) - Number(tick);
  expect(advanced).toBeGreaterThan(0);
  expect(advanced).toBeLessThanOrEqual(7);
});

test("the aspect gate flips exactly at 4:3, landscape included", async ({
  page,
}) => {
  const height = 768;
  const boundary = (height * 4) / 3;
  await page.clock.install();
  await page.setViewportSize({ width: boundary, height });
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-phase", "playing");
  await expect(deck).toHaveAttribute("data-narrow", "false");
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(".engine.left")).toHaveClass(/active/);
  await page.setViewportSize({ width: boundary - 1, height });
  await expect(deck).toHaveAttribute("data-narrow", "true");
  await expect(
    page.getByRole("dialog", { name: "Rotate to continue" }),
  ).toBeVisible();
  await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
  const tick = await deck.getAttribute("data-ticks");
  await page.clock.runFor(2000);
  await expect(deck).toHaveAttribute("data-ticks", tick ?? "");
  await page.setViewportSize({ width: boundary, height });
  await expect(deck).toHaveAttribute("data-narrow", "false");
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  await page.keyboard.up("ArrowUp");
});

test("live surface contains selection and context menus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
  );
  const surface = page.locator("[data-stage]");
  expect(
    await surface.evaluate((node) => ({
      selection: getComputedStyle(node).userSelect,
      touch: getComputedStyle(node).touchAction,
      menuAllowed: node.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      ),
    })),
  ).toEqual({ selection: "none", touch: "none", menuAllowed: false });
});

for (const key of ["ArrowLeft", "ArrowRight"]) {
  test(`${key} turns the launched Wasp and release brakes its spin`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    await page.getByRole("button", { name: "PRESS START" }).click();
    await page.clock.runFor(3500);
    const deck = page.locator(".flight-page");
    await page.keyboard.down(key);
    await page.clock.runFor(400);
    const spin = Math.abs(Number(await deck.getAttribute("data-spin")));
    expect(spin).toBeGreaterThan(1);
    await page.keyboard.up(key);
    await page.clock.runFor(500);
    expect(Math.abs(Number(await deck.getAttribute("data-spin")))).toBeLessThan(
      spin,
    );
  });
}
