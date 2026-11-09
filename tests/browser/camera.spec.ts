import { expect, test } from "../helpers/local-browser";

test("the camera fits the active area as the stage resizes", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.getByRole("button", { name: "PRESS START" }).click();
  await page.clock.runFor(3500);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const deck = page.locator(".flight-page");
  const stage = page.locator(".flight-stage");
  const seed = await deck.getAttribute("data-seed");
  const ticks = await deck.getAttribute("data-ticks");
  const widths: number[] = [];
  for (const [width, height] of [
    [1920, 1080],
    [1440, 1080],
    [2560, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(100);
    // Wait for the stage to follow this viewport before reading its geometry;
    // the previous step's attributes are still equal until then.
    await expect
      .poll(async () => (await stage.boundingBox())?.width)
      .toBeCloseTo(width, 0);
    await expect
      .poll(async () => (await stage.boundingBox())?.height)
      .toBeCloseTo(height, 0);
    const previous = widths[widths.length - 1];
    await expect
      .poll(async () =>
        Number(await stage.getAttribute("data-active-logical-width")),
      )
      .not.toBe(previous);
    await expect
      .poll(async () => {
        const active = Number(
          await stage.getAttribute("data-active-logical-width"),
        );
        const fit = Number(await deck.getAttribute("data-camera-fit-width"));
        return Math.abs(active - fit);
      })
      .toBeLessThan(1e-6);
    const fitHeight = Number(await deck.getAttribute("data-camera-fit-height"));
    const activeHeight = Number(
      await stage.getAttribute("data-active-logical-height"),
    );
    expect(fitHeight).toBeCloseTo(activeHeight, 6);
    widths.push(Number(await deck.getAttribute("data-camera-fit-width")));
    // Resizing while paused leaves the run untouched.
    await expect(deck).toHaveAttribute("data-seed", seed ?? "");
    await expect(deck).toHaveAttribute("data-ticks", ticks ?? "");
  }
  // A wider stage of the same height gives the camera a wider fitting box.
  expect(widths[2]).toBeGreaterThan(widths[0]);
  expect(widths[0]).toBeGreaterThan(widths[1]);
});
