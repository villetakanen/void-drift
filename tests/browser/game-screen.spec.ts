import { expect, test } from "../helpers/local-browser";
import { expectLit } from "../helpers/thrust-pads";

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
  await expectLit(deck, null);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(
    page.getByRole("dialog", { name: "Paused", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(4000);
  await expect(deck).toHaveAttribute("data-ticks", "0");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(deck).toHaveAttribute("data-phase", "starting");
  await expectLit(deck, null);
  await page.clock.runFor(2300);
  await expect(deck).toHaveAttribute("data-phase", "playing", {
    timeout: 10_000,
  });
  await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowUp");
  await expectLit(deck, "LR");
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
