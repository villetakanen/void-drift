import { FLIGHT_LAYERS } from "../../packages/mode-a/src/lib/flight-frame";
import { expect, test } from "../helpers/local-browser";

test("render performance bench uses the production shared scene and lifecycle", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lab/render-performance");
  const bench = page.getByRole("region", { name: "Render performance bench" });
  const canvases = bench.locator("canvas[data-layer]");
  await expect(canvases).toHaveCount(FLIGHT_LAYERS.length);
  await expect(bench.locator('canvas[data-layer="fx"]')).toHaveCSS(
    "filter",
    /url\(/,
  );
  await expect(bench.getByLabel("Scenario count")).toHaveValue("25");
  await expect
    .poll(() =>
      canvases.evaluateAll((nodes) =>
        nodes.map((node) => {
          const canvas = node as HTMLCanvasElement;
          return [canvas.dataset.layer, canvas.width, canvas.height];
        }),
      ),
    )
    .toEqual(
      FLIGHT_LAYERS.map((layer) => [
        layer.id,
        1920 * layer.resolution,
        1080 * layer.resolution,
      ]),
    );

  const world = bench.locator('canvas[data-layer="world"]');
  const lfx = bench.locator('canvas[data-layer="lfx"]');
  const countHullCells = () =>
    world.evaluate((node) => {
      const context = (node as HTMLCanvasElement).getContext("2d");
      if (!context) throw new Error("World Canvas 2D unavailable");
      const pixels = context.getImageData(0, 0, 1920, 1080).data;
      const counts: number[] = [];
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 5; column++) {
          let count = 0;
          for (let y = row * 216; y < (row + 1) * 216; y++) {
            for (let x = column * 384; x < (column + 1) * 384; x++) {
              if (pixels[(y * 1920 + x) * 4 + 3] > 0) count++;
            }
          }
          counts.push(count);
        }
      }
      return counts;
    });
  const countBeamBands = () =>
    lfx.evaluate((node) => {
      const context = (node as HTMLCanvasElement).getContext("2d");
      if (!context) throw new Error("LFX Canvas 2D unavailable");
      const pixels = context.getImageData(0, 0, 1920, 1080).data;
      const counts: number[] = [];
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 5; column++) {
          let count = 0;
          let insideBand = false;
          for (let y = row * 216; y < (row + 1) * 216; y++) {
            let hasLight = false;
            for (let x = column * 384; x < (column + 1) * 384; x++) {
              if (pixels[(y * 1920 + x) * 4 + 3] > 0) {
                hasLight = true;
                break;
              }
            }
            if (hasLight && !insideBand) count++;
            insideBand = hasLight;
          }
          counts.push(count);
        }
      }
      return counts;
    });
  expect((await countHullCells()).every((count) => count > 0)).toBe(true);
  expect(await countBeamBands()).toEqual(Array(25).fill(3));

  const heldTime = await bench.getAttribute("data-time");
  const fx = bench.locator('canvas[data-layer="fx"]');
  const pixel = () =>
    fx.evaluate((node) => {
      const context = (node as HTMLCanvasElement).getContext("2d");
      if (!context) throw new Error("FX Canvas 2D unavailable");
      return [...context.getImageData(960, 540, 1, 1).data];
    });
  const heldPixel = await pixel();
  const filter = bench.getByLabel("FX presentation filter");
  await filter.selectOption("none");
  await expect(fx).toHaveCSS("filter", "none");
  await expect(bench).toHaveAttribute("data-attempted", "0");
  await page.waitForTimeout(300);
  await expect(bench).toHaveAttribute("data-time", heldTime ?? "");
  expect(await pixel()).toEqual(heldPixel);
  await filter.selectOption("distort");
  await expect(fx).toHaveCSS("filter", /url\(/);
  expect(await pixel()).toEqual(heldPixel);
  const distort = bench.locator(
    'svg.filter-defs filter[id^="render-performance-distort-"]',
  );
  await expect(distort.locator("feDisplacementMap")).toHaveAttribute(
    "scale",
    "2",
  );
  await filter.selectOption("turbulent-bloom");
  await expect(fx).toHaveCSS("filter", /url\(/);
  const bloom = bench.locator(
    'svg.filter-defs filter[id^="flight-layers-bloom-"]',
  );
  await expect(bloom.locator("feGaussianBlur")).toHaveAttribute(
    "stdDeviation",
    "12",
  );
  await expect(bloom.locator("feDisplacementMap")).toHaveAttribute(
    "scale",
    "16",
  );
  await expect(bloom.locator("feColorMatrix")).toHaveAttribute(
    "values",
    /^0\.9 0 0 0 0/,
  );
  expect(await bench.locator("svg.filter-defs filter").count()).toBe(2);
  expect(await pixel()).toEqual(heldPixel);
  await filter.selectOption("blur");
  await expect(fx).toHaveCSS("filter", "blur(2px)");

  await bench.getByLabel("Scenario count").selectOption("1");
  await expect(bench).toHaveAttribute("data-workload", "1");
  await expect(bench.getByText(/1 scenario uses 7.5× scale/)).toBeVisible();
  const centerOnly = await world.evaluate((node) => {
    const context = (node as HTMLCanvasElement).getContext("2d");
    if (!context) throw new Error("World Canvas 2D unavailable");
    const pixels = context.getImageData(0, 0, 1920, 1080).data;
    let center = 0;
    let corner = 0;
    for (let y = 0; y < 1080; y++) {
      for (let x = 0; x < 1920; x++) {
        if (pixels[(y * 1920 + x) * 4 + 3] === 0) continue;
        if (x >= 860 && x < 1060 && y >= 440 && y < 640) center++;
        if (x < 100 && y < 100) corner++;
      }
    }
    return { center, corner };
  });
  expect(centerOnly.center).toBeGreaterThan(0);
  expect(centerOnly.corner).toBe(0);
  await bench.getByLabel("Scenario count").selectOption("25");
  await expect(bench).toHaveAttribute("data-workload", "25");
  await filter.selectOption("turbulent-bloom");

  await bench.getByRole("button", { name: "Run" }).click();
  await page.waitForTimeout(6000);
  await bench.getByRole("button", { name: "Pause" }).click();
  const pausedTime = await bench.getAttribute("data-time");
  await page.waitForTimeout(500);
  await expect(bench).toHaveAttribute("data-time", pausedTime ?? "");
  await bench.getByRole("button", { name: "Copy results" }).click();
  const results = await bench
    .getByLabel("Selectable results text")
    .inputValue();
  console.log(
    `Mixed plasma bench (headless correctness evidence):\n${results}`,
  );
  expect(results).toContain("alternating ion and plasma");
  expect(results).toContain("Measured active time:");
  expect(results).toContain(
    "Turbulent Bloom · 12px glow, 16px distortion, 90% strength",
  );
  expect(results).toMatch(/Stamp totals: attempted [1-9]\d*/);
  const attempted = Number(await bench.getAttribute("data-attempted"));
  const accepted = Number(await bench.getAttribute("data-accepted"));
  const dropped = Number(await bench.getAttribute("data-dropped"));
  expect(dropped).toBeGreaterThan(0);
  expect(attempted).toBe(accepted + dropped);

  await bench.getByRole("button", { name: "Run" }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(300);
  const hiddenTime = await bench.getAttribute("data-time");
  await page.waitForTimeout(400);
  await expect(bench).toHaveAttribute("data-time", hiddenTime ?? "");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(350);
  await expect(bench).not.toHaveAttribute("data-time", hiddenTime ?? "");
  await bench.getByRole("button", { name: "Pause" }).click();

  await bench.getByRole("button", { name: "Reset" }).click();
  await expect(bench).toHaveAttribute("data-workload", "25");
  await expect(bench).toHaveAttribute("data-attempted", "0");
  await expect(bench.locator('canvas[data-layer="lfx"]')).toHaveCSS(
    "filter",
    "none",
  );
});
