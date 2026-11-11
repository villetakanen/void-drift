import { GAME_MIN_RATIO } from "../../apps/web/src/lib/game-screen";
import { expect, test } from "../helpers/local-browser";

test("landing animation survives resize and hands off a fresh Wasp run", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-05T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-05T00:01:00Z"));
  await page.goto("/");
  const deck = page.locator(".flight-page");
  await expect(deck).toHaveAttribute("data-landing-sun", /[OBAFGKM]/);
  const sun = await deck.getAttribute("data-landing-sun");
  const canvas = page.locator('.flight-stage-layer canvas[data-layer="world"]');
  const before = await canvas.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  await page.clock.runFor(2000);
  expect(
    await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
  ).not.toBe(before);
  await page.keyboard.press("Digit1");
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  await page.setViewportSize({ width: 960, height: 540 });
  await expect(deck).toHaveAttribute("data-landing-sun", sun ?? "");
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await expect(deck).toHaveAttribute("data-phase", "starting");
  await page.clock.runFor(240);
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await expect(deck).not.toHaveAttribute("data-landing-sun");
  const position = [
    await deck.getAttribute("data-x"),
    await deck.getAttribute("data-y"),
  ];
  const power = await page
    .getByRole("progressbar", { name: "Power" })
    .getAttribute("value");
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(2500);
  expect([
    await deck.getAttribute("data-x"),
    await deck.getAttribute("data-y"),
  ]).toEqual(position);
  await expect(
    page.getByRole("progressbar", { name: "Power" }),
  ).toHaveAttribute("value", power ?? "");
  await expect(deck).toHaveAttribute("data-phase", "starting");
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await page.clock.runFor(700);
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  await expect(canvas).toHaveAttribute(
    "aria-label",
    "Ship, star and orbiting planets",
  );
  await page.clock.runFor(1000);
  expect(Number(await deck.getAttribute("data-ticks"))).toBeGreaterThan(0);
  await page.keyboard.up("ArrowUp");
});

test("reduced motion keeps the demo static and retains the three-second count", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const canvas = page.locator('.flight-stage-layer canvas[data-layer="world"]');
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-landing-sun",
    /[OBAFGKM]/,
  );
  await page.clock.runFor(100);
  const before = await canvas.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  await page.clock.runFor(2000);
  expect(
    await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
  ).toBe(before);
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3100);
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-phase",
    "playing",
    { timeout: 10_000 },
  );
});

test("title content uses a centred 16:9 region with native controls", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 2560, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "PRESS START" }),
    ).toBeFocused();
    await expect(
      page.getByRole("heading", { name: "VOID DRIFT" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("header")).toHaveCount(0);
    for (const action of await page.locator(".title-panel .btn").all()) {
      const box = await action.boundingBox();
      if (!box) throw new Error("Title action missing");
      expect(Math.round(box.height * 100) / 100).toBeGreaterThanOrEqual(44);
      expect(
        await action.evaluate((node) => getComputedStyle(node).fontSize),
      ).toBe("16px");
    }
    const slot = await page.locator(".title-slot").boundingBox();
    if (!slot) throw new Error("Title slot missing");
    const expectedWidth = Math.min(viewport.width, (viewport.height * 16) / 9);
    expect(slot.width).toBeCloseTo(expectedWidth, 0);
    expect(slot.height).toBeCloseTo((expectedWidth * 9) / 16, 0);
    expect(
      await page
        .locator(".title-slot")
        .evaluate((node) => getComputedStyle(node).transform),
    ).toBe("none");
    expect(slot.x).toBeCloseTo((viewport.width - slot.width) / 2, 0);
    expect(slot.y).toBeCloseTo((viewport.height - slot.height) / 2, 0);
    for (const selector of [".title-panel", ".hint", ".version"]) {
      const box = await page.locator(`.title-slot ${selector}`).boundingBox();
      if (!box) throw new Error(`${selector} missing`);
      expect(box.x).toBeGreaterThanOrEqual(slot.x);
      expect(box.y).toBeGreaterThanOrEqual(slot.y);
      expect(box.x + box.width).toBeLessThanOrEqual(slot.x + slot.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(slot.y + slot.height + 1);
    }
    for (const selector of [
      '.flight-stage-layer canvas[data-layer="world"]',
      ".dialog-scrim",
    ]) {
      const box = await page.locator(selector).boundingBox();
      if (!box) throw new Error(`${selector} missing`);
      expect(box.x).toBeCloseTo(0, 0);
      expect(box.y).toBeCloseTo(0, 0);
      expect(box.width).toBeCloseTo(viewport.width, 0);
      expect(box.height).toBeCloseTo(viewport.height, 0);
    }
  }
});

test("title menu order and all secondary destinations return to title", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "PRESS START" })).toBeFocused();
  for (const name of [/HANGAR/, /TOP SCORES/, /SETTINGS/, /CREDITS/]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name })).toBeFocused();
  }
  for (const name of [/HANGAR/, /TOP SCORES/, /SETTINGS/, /CREDITS/]) {
    await page.getByRole("link", { name }).click();
    await page
      .getByRole("link", {
        name:
          name.source === "HANGAR" ? "Void Drift" : /^Return to title screen$/i,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "PRESS START" }),
    ).toBeFocused();
  }
});

test("hints rotate without starting survival and reduced motion keeps one hint", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const hint = page.getByRole("complementary", { name: "Title-screen hints" });
  const initial = await hint.textContent();
  await page.clock.runFor(8500);
  await expect(hint).not.toHaveText(initial ?? "");
  await expect(page.locator(".flight-page")).toHaveAttribute("data-ticks", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await hint.textContent();
  await page.clock.runFor(17000);
  await expect(hint).toHaveText(reduced ?? "");
});

test("orientation warning follows the viewport without interrupting the menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  const warning = page
    .getByRole("status")
    .filter({ hasText: "Rotate your screen to landscape." });
  const deck = page.locator(".flight-page");
  const sun = await deck.getAttribute("data-landing-sun");
  const start = page.getByRole("button", { name: "PRESS START" });
  await expect(start).toBeFocused();
  await expect(warning).toHaveCount(0);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(warning).toBeVisible();
  await expect(start).toBeFocused();
  await page.keyboard.press("Tab");
  const hangar = page.getByRole("link", { name: /HANGAR/ });
  await expect(hangar).toBeFocused();
  await page.setViewportSize({ width: 768, height: 768 });
  await expect(warning).toBeVisible();
  await expect(hangar).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(warning).toHaveCount(0);
  await expect(hangar).toBeFocused();
  await expect(deck).toHaveAttribute("data-landing-sun", sun ?? "");
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /TOP SCORES/ })).toBeFocused();
});

test("orientation warning follows the 4:3 flight limit in landscape", async ({
  page,
}) => {
  const width = 1100;
  const minHeight = (width * GAME_MIN_RATIO.height) / GAME_MIN_RATIO.width;
  // Landscape, but narrower than 4:3.
  await page.setViewportSize({ width, height: minHeight + 100 });
  await page.goto("/");
  const warning = page
    .getByRole("status")
    .filter({ hasText: "Rotate your screen to landscape." });
  const start = page.getByRole("button", { name: "PRESS START" });
  await expect(warning).toBeVisible();
  await expect(start).toBeFocused();
  await page.setViewportSize({ width, height: Math.floor(minHeight) });
  await expect(warning).toHaveCount(0);
  await expect(start).toBeFocused();
  await page.setViewportSize({ width, height: Math.floor(minHeight) + 1 });
  await expect(warning).toBeVisible();
});
