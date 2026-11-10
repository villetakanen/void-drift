import { FLIGHT_LAYERS } from "../../packages/mode-a/src/lib/flight-frame";
import { expect, test } from "../helpers/local-browser";

async function layerFingerprint(canvas: import("@playwright/test").Locator) {
  return canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Flight scene layer requires Canvas 2D");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const samples: number[] = [];
    let visiblePixels = 0;
    let coloredPixels = 0;
    for (let y = 0; y < canvas.height; y += 16) {
      for (let x = 0; x < canvas.width; x += 16) {
        const index = (y * canvas.width + x) * 4;
        samples.push(
          pixels[index],
          pixels[index + 1],
          pixels[index + 2],
          pixels[index + 3],
        );
        if (pixels[index + 3] > 0) visiblePixels++;
        if (
          pixels[index] !== pixels[0] ||
          pixels[index + 1] !== pixels[1] ||
          pixels[index + 2] !== pixels[2]
        )
          coloredPixels++;
      }
    }
    return { samples, visiblePixels, coloredPixels };
  });
}

test("flight scene replays through the shared layers at the Lab viewport", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/studies/flight-scene-instrument-2026-11-10#camera");
  // 02.2 is an older retained step, collapsed by default.
  await page.locator("details#camera > summary").click();
  const scenes = page.locator("details#camera").getByRole("figure", {
    name: "Flight scene: a burn in the game’s layers",
  });
  await scenes.first().scrollIntoViewIfNeeded();
  await expect(scenes.first()).toHaveAttribute("data-rendered", "true");
  const scene = scenes.last();
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-rendered", "true");
  const stackBloomIds = await page
    .locator("svg.filter-defs filter[id^='flight-layers-bloom-']")
    .evaluateAll((filters) => filters.map((filter) => filter.id));
  // One bloom filter per mounted layer stack, however many steps the page shows.
  expect(stackBloomIds).toHaveLength(
    await page.locator(".flight-layers").count(),
  );
  expect(new Set(stackBloomIds).size).toBe(stackBloomIds.length);
  const layerFilterRefs = await page
    .locator(".flight-layers")
    .evaluateAll((stacks) =>
      stacks.map((stack) => {
        const canvas = stack.querySelector('canvas[data-layer="fx"]');
        const match =
          canvas && getComputedStyle(canvas).filter.match(/#([^)'"]+)/);
        return Boolean(match && document.getElementById(match[1]));
      }),
    );
  expect(layerFilterRefs.length).toBeGreaterThanOrEqual(2);
  expect(layerFilterRefs.every(Boolean)).toBe(true);
  const layers = scene.locator("canvas[data-layer]");
  await expect(layers).toHaveCount(FLIGHT_LAYERS.length);
  expect(
    await layers.evaluateAll((items) =>
      items.map((canvas) => [
        canvas.getAttribute("data-layer"),
        (canvas as HTMLCanvasElement).width,
        (canvas as HTMLCanvasElement).height,
        getComputedStyle(canvas).mixBlendMode,
      ]),
    ),
  ).toEqual(
    FLIGHT_LAYERS.map((layer) => [
      layer.id,
      1920,
      1080,
      layer.id === "fx"
        ? "screen"
        : layer.id === "lfx"
          ? "hard-light"
          : layer.blend,
    ]),
  );
  const fxFilter = scene.locator('canvas[data-layer="fx"]');
  const lfxFilter = scene.locator('canvas[data-layer="lfx"]');
  await expect(fxFilter).toHaveCSS("filter", /url\(/);
  await expect(lfxFilter).toHaveCSS("filter", "none");
  const bloom = await fxFilter.evaluate((canvas) => {
    const match = getComputedStyle(canvas).filter.match(/#([^)'"]+)/);
    if (!match) throw new Error("FX filter URL is missing");
    const filter = document.getElementById(match[1]);
    if (!filter) throw new Error("FX filter definition is missing");
    return {
      glow: filter
        .querySelector("feGaussianBlur")
        ?.getAttribute("stdDeviation"),
      distortion: filter
        .querySelector("feDisplacementMap")
        ?.getAttribute("scale"),
      strength: filter.querySelector("feColorMatrix")?.getAttribute("values"),
    };
  });
  expect(bloom).toEqual({
    glow: "12",
    distortion: "16",
    strength: expect.stringMatching(/^0\.9 0 0 0 0/),
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(scene).toHaveAttribute("data-burn", "course");
  const time = scene.getByRole("slider", { name: "Time" });
  const seek = (seconds: number) =>
    time.evaluate((element: HTMLInputElement, value: number) => {
      element.value = String(value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, seconds);
  await seek(215 / 60);
  await expect(scene).toHaveAttribute("data-tick", "215");
  await expect(scene).toHaveAttribute("data-drawn-tick", "215");
  const worldLayer = scene.locator('canvas[data-layer="world"]');
  const fxLayer = scene.locator('canvas[data-layer="fx"]');
  const worldAt215 = await layerFingerprint(worldLayer);
  const fxAt215 = await layerFingerprint(fxLayer);
  expect(worldAt215.coloredPixels).toBeGreaterThan(0);
  expect(fxAt215.visiblePixels).toBeGreaterThan(0);

  // Backward and forward seeks reach the selected simulation ticks.
  await seek(100 / 60);
  await expect(scene).toHaveAttribute("data-tick", "100");
  await expect(scene).toHaveAttribute("data-drawn-tick", "100");
  await seek(215 / 60);
  await expect(scene).toHaveAttribute("data-tick", "215");
  await expect(scene).toHaveAttribute("data-drawn-tick", "215");
  expect((await layerFingerprint(worldLayer)).coloredPixels).toBeGreaterThan(0);
  expect((await layerFingerprint(fxLayer)).visiblePixels).toBeGreaterThan(0);

  // The normal Game view also carries the trial at both requested instants.
  expect((await layerFingerprint(fxLayer)).visiblePixels).toBeGreaterThan(0);
  await seek(100 / 60);
  await expect(scene).toHaveAttribute("data-drawn-tick", "100");
  expect((await layerFingerprint(fxLayer)).visiblePixels).toBeGreaterThan(0);
  await seek(215 / 60);
  await expect(scene).toHaveAttribute("data-drawn-tick", "215");

  // The study camera is a view over the same layers and preserves Follow 4×.
  await scene.getByRole("radio", { name: "Follow 4×" }).focus();
  await scene.getByRole("radio", { name: "Follow 4×" }).press("Space");
  await expect(scene).toHaveAttribute("data-tick", "215");
  await expect(scene).toHaveAttribute("data-drawn-view", "Follow 4×");
  const followWorldAt215 = await layerFingerprint(worldLayer);
  const followFxAt215 = await layerFingerprint(fxLayer);
  await seek(100 / 60);
  await expect(scene).toHaveAttribute("data-drawn-tick", "100");
  const followWorldAt100 = await layerFingerprint(worldLayer);
  await seek(215 / 60);
  await expect(scene).toHaveAttribute("data-drawn-tick", "215");
  expect(await layerFingerprint(worldLayer)).toEqual(followWorldAt215);
  const followFxReplayedAt215 = await layerFingerprint(fxLayer);
  const fxChangedSamples = followFxAt215.samples.reduce(
    (count, value, index) =>
      count + Number(value !== followFxReplayedAt215.samples[index]),
    0,
  );
  expect(fxChangedSamples).toBe(0);
  expect(followWorldAt100).not.toEqual(followWorldAt215);
  await scene.getByRole("radio", { name: "Game" }).focus();
  await scene.getByRole("radio", { name: "Game" }).press("Space");
  await expect(scene).toHaveAttribute("data-tick", "215");
  await expect(scene).toHaveAttribute("data-drawn-view", "Game");

  // A paused scene holds both its time and the rendered layer images.
  const held = await scene.getAttribute("data-tick");
  const heldWorld = await layerFingerprint(worldLayer);
  const heldFx = await layerFingerprint(fxLayer);
  await page.waitForTimeout(150);
  await expect(scene).toHaveAttribute("data-tick", held ?? "");
  expect(await layerFingerprint(worldLayer)).toEqual(heldWorld);
  expect(await layerFingerprint(fxLayer)).toEqual(heldFx);

  // Changing the burn replays to the selected time from the new program.
  await scene.getByRole("radio", { name: "B2" }).focus();
  await scene.getByRole("radio", { name: "B2" }).press("Space");
  await expect(scene).toHaveAttribute("data-burn", "turn");
  await expect(scene).toHaveAttribute("data-tick", "215");
  await expect(scene).toHaveAttribute("data-drawn-burn", "turn");
  await expect(scene).toHaveAttribute("data-drawn-tick", "215");

  await scene.getByRole("button", { name: "Play", exact: true }).click();
  await expect(scene).toHaveAttribute("data-playing", "true");
  await expect.poll(() => scene.getAttribute("data-tick")).not.toBe("215");
  await expect
    .poll(() => scene.getAttribute("data-drawn-tick"))
    .not.toBe("215");
  await scene.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(scene).toHaveAttribute("data-playing", "false");
  const pausedAt = await scene.getAttribute("data-tick");
  await page.waitForTimeout(150);
  await expect(scene).toHaveAttribute("data-tick", pausedAt ?? "");
});

test("02.1 flight scene also mounts the shared production layers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/studies/flight-scene-instrument-2026-11-10#time");
  // 02.1 is an older retained step, collapsed by default.
  await page.locator("details#time > summary").click();
  const scene = page.locator("details#time").getByRole("figure", {
    name: "Flight scene: a burn in the game’s layers",
  });
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-rendered", "true");
  const layers = scene.locator("canvas[data-layer]");
  await expect(layers).toHaveCount(FLIGHT_LAYERS.length);
  expect(
    await layers.evaluateAll((items) =>
      items.map((canvas) => [
        (canvas as HTMLCanvasElement).width,
        (canvas as HTMLCanvasElement).height,
      ]),
    ),
  ).toEqual(FLIGHT_LAYERS.map(() => [1920, 1080]));
});
