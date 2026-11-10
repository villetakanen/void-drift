import { FLIGHT_LAYERS } from "../../packages/mode-a/src/lib/flight-frame";
import { expect, test } from "../helpers/local-browser";

test("render model compares held production layers and persistent FX", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/render-model");
  const model = page.getByRole("region", { name: "Render model" });
  await expect(model).toHaveAttribute("data-ready", "true");
  await expect(model.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await expect(model.locator("canvas[data-layer]")).toHaveCount(
    FLIGHT_LAYERS.length,
  );

  const layers = model.locator("canvas[data-layer]");
  expect(
    await layers.evaluateAll((items) =>
      items.map((element) => {
        const canvas = element as HTMLCanvasElement;
        return [
          canvas.getAttribute("data-layer"),
          getComputedStyle(canvas).mixBlendMode,
          canvas.width,
          canvas.height,
        ];
      }),
    ),
  ).toEqual(
    FLIGHT_LAYERS.map((layer) => [
      layer.id,
      layer.blend,
      Math.round(1920 * layer.resolution),
      Math.round(1080 * layer.resolution),
    ]),
  );
  expect(
    await model
      .locator(".flight-layers")
      .evaluate((stack) => getComputedStyle(stack).isolation),
  ).toBe("isolate");

  const readPixel = (id: string, x = 1100, y = 540): Promise<number[]> =>
    model.locator(`canvas[data-layer="${id}"]`).evaluate(
      (canvas, point) => {
        const context = (canvas as HTMLCanvasElement).getContext("2d");
        if (!context) throw new Error("Canvas 2D unavailable");
        return [...context.getImageData(point.x, point.y, 1, 1).data];
      },
      { x, y },
    );
  const initialFxPoint = await model
    .locator('canvas[data-layer="fx"]')
    .evaluate((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext("2d");
      if (!context) throw new Error("Canvas 2D unavailable");
      const pixels = context.getImageData(0, 0, 1920, 1080).data;
      let best = { x: 0, y: 0, alpha: 0 };
      for (let y = 0; y < 1080; y++) {
        for (let x = 0; x < 1920; x++) {
          const alpha = pixels[(y * 1920 + x) * 4 + 3];
          if (alpha > best.alpha) best = { x, y, alpha };
        }
      }
      return { x: best.x, y: best.y };
    });
  const initialFx = await readPixel("fx", initialFxPoint.x, initialFxPoint.y);
  expect(initialFx[3]).toBeGreaterThan(0);
  const initialWorld = await readPixel("world", 960, 540);
  const initialLfx = await readPixel("lfx", 950, 540);
  expect(initialWorld[3]).toBe(255);
  expect(initialLfx[3]).toBeGreaterThan(0);

  // CSS presentation edits leave every held canvas pixel alone while paused.
  const modes = ["normal", "plus-lighter", "screen", "multiply", "hard-light"];
  for (const layer of FLIGHT_LAYERS) {
    const sample =
      layer.id === "world"
        ? initialWorld
        : layer.id === "fx"
          ? initialFx
          : initialLfx;
    const point =
      layer.id === "world"
        ? { x: 960, y: 540 }
        : layer.id === "fx"
          ? initialFxPoint
          : { x: 950, y: 540 };
    const control = model.locator(`[data-layer-controls="${layer.id}"]`);
    for (const mode of modes) {
      await control
        .getByRole("combobox", { name: `${layer.name} blend mode` })
        .selectOption(mode);
      await expect(model.locator(`canvas[data-layer="${layer.id}"]`)).toHaveCSS(
        "mix-blend-mode",
        mode,
      );
      expect(await readPixel(layer.id, point.x, point.y)).toEqual(sample);
    }
  }
  await model
    .getByRole("combobox", { name: "LFX blend mode", exact: true })
    .selectOption("hard-light");
  const layerPixels = async (id: string) =>
    model.locator(`canvas[data-layer="${id}"]`).evaluate((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext("2d");
      if (!context) throw new Error("Canvas 2D unavailable");
      const pixels = context.getImageData(0, 0, 1920, 1080).data;
      let hash = 2166136261;
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
      return hash >>> 0;
    });
  const artworkFxPixels = await layerPixels("fx");
  const heldFxPixels = await layerPixels("fx");
  const heldLfxPixels = await layerPixels("lfx");
  for (const kind of [
    "none",
    "blur",
    "brightness",
    "noise",
    "offset",
    "spread",
    "expand",
  ]) {
    await model
      .getByRole("combobox", { name: "FX filter", exact: true })
      .selectOption(kind);
    const expected =
      kind === "none"
        ? "none"
        : kind === "blur"
          ? "blur(10px)"
          : kind === "brightness"
            ? "brightness(1.4)"
            : /url\(/;
    await expect(model.locator('canvas[data-layer="fx"]')).toHaveCSS(
      "filter",
      expected,
    );
    await expect(model.locator('canvas[data-layer="lfx"]')).toHaveCSS(
      "filter",
      "none",
    );
    expect(await layerPixels("fx")).toBe(heldFxPixels);
    expect(await layerPixels("lfx")).toBe(heldLfxPixels);
  }
  await model
    .getByRole("combobox", { name: "FX filter", exact: true })
    .selectOption("blur");
  await expect(model.locator('canvas[data-layer="fx"]')).toHaveCSS(
    "filter",
    "blur(10px)",
  );
  await model
    .getByRole("combobox", { name: "FX filter", exact: true })
    .selectOption("none");
  for (const kind of [
    "none",
    "blur",
    "brightness",
    "noise",
    "offset",
    "spread",
    "expand",
  ]) {
    await model
      .getByRole("combobox", { name: "LFX filter", exact: true })
      .selectOption(kind);
    const expected =
      kind === "none"
        ? "none"
        : kind === "blur"
          ? "blur(10px)"
          : kind === "brightness"
            ? "brightness(1.4)"
            : /url\(/;
    await expect(model.locator('canvas[data-layer="lfx"]')).toHaveCSS(
      "filter",
      expected,
    );
    await expect(model.locator('canvas[data-layer="fx"]')).toHaveCSS(
      "filter",
      "none",
    );
    expect(await layerPixels("fx")).toBe(heldFxPixels);
    expect(await layerPixels("lfx")).toBe(heldLfxPixels);
  }
  await model
    .getByRole("combobox", { name: "FX filter", exact: true })
    .selectOption("blur");
  await model
    .getByRole("combobox", { name: "LFX filter", exact: true })
    .selectOption("expand");
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .uncheck();
  expect(await readPixel("fx", initialFxPoint.x, initialFxPoint.y)).toEqual(
    initialFx,
  );
  await expect(model.locator('canvas[data-layer="fx"]')).toHaveCSS(
    "visibility",
    "hidden",
  );
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .check();
  await model
    .getByRole("combobox", { name: "LFX blend mode", exact: true })
    .selectOption("plus-lighter");

  await model.getByRole("button", { name: "Paint" }).click();
  expect(
    (await readPixel("fx", initialFxPoint.x, initialFxPoint.y))[3],
  ).toBeGreaterThan(initialFx[3]);
  await model
    .getByRole("combobox", { name: "Picture sample" })
    .selectOption("circles");
  const circleFx = await readPixel("fx", 825, 540);
  const heldWorldPixels = await layerPixels("world");
  const heldCircleLfxPixels = await layerPixels("lfx");
  await model.getByRole("button", { name: "Run" }).click();
  await expect(model).toHaveAttribute("data-running", "true");
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .uncheck();
  await page.waitForTimeout(500);
  const faded = await readPixel("fx", 825, 540);
  expect(faded[3]).toBeLessThan(circleFx[3]);
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .check();
  expect(await layerPixels("world")).toBe(heldWorldPixels);
  expect(await layerPixels("lfx")).toBe(heldCircleLfxPixels);
  await model.getByRole("button", { name: "Pause" }).click();
  const held = await readPixel("fx", 825, 540);
  await page.waitForTimeout(180);
  expect(await readPixel("fx", 825, 540)).toEqual(held);

  await model.getByRole("button", { name: "Run" }).click();
  await model.getByRole("button", { name: "Clear" }).click();
  for (const id of ["world", "fx", "lfx"])
    expect((await readPixel(id))[3]).toBe(0);
  await page.waitForTimeout(120);
  for (const id of ["world", "fx", "lfx"])
    expect((await readPixel(id))[3]).toBe(0);
  await model.getByRole("button", { name: "Pause" }).click();
  await model
    .locator('[data-layer-controls="world"]')
    .getByRole("combobox", { name: "World blend mode" })
    .selectOption("multiply");
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("combobox", { name: "FX blend mode", exact: true })
    .selectOption("normal");
  await model
    .locator('[data-layer-controls="lfx"]')
    .getByRole("combobox", { name: "LFX blend mode", exact: true })
    .selectOption("screen");
  const freshFx = await readPixel("fx", 825, 540);
  await model.getByRole("button", { name: "Paint" }).click();
  const repaintedFx = await readPixel("fx", 825, 540);
  expect(repaintedFx[3]).toBeGreaterThan(0);
  await expect(
    model.locator('[data-layer-controls="world"] select'),
  ).toHaveValue("multiply");
  await expect(
    model.getByRole("combobox", { name: "FX blend mode", exact: true }),
  ).toHaveValue("normal");
  await expect(
    model.getByRole("combobox", { name: "LFX blend mode", exact: true }),
  ).toHaveValue("screen");
  expect(repaintedFx[3]).toBe(circleFx[3]);
  expect(freshFx[3]).toBe(0);
  expect((await readPixel("fx", 825, 540))[3]).toBeGreaterThan(0);
  await expect(model).toHaveAttribute("data-running", "false");
  await expect(
    model.getByRole("combobox", { name: "FX blend mode", exact: true }),
  ).toHaveValue("normal");
  await expect(
    model.getByRole("combobox", { name: "FX filter", exact: true }),
  ).toHaveValue("blur");
  await model
    .getByRole("combobox", { name: "Picture sample" })
    .selectOption("artwork");
  expect(await layerPixels("fx")).toBe(artworkFxPixels);
});

test("rotating Wasp accumulates mounted plumes while fixed horizontal beams hold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/render-model");
  const model = page.getByRole("region", { name: "Render model" });
  await expect(model).toHaveAttribute("data-ready", "true");
  await expect(
    model.getByRole("combobox", { name: "Picture sample" }),
  ).toHaveValue("artwork");
  await expect(model.locator(".sample-controls")).toContainText("2 s per turn");

  const pixels = (layer: string) =>
    model.locator(`canvas[data-layer="${layer}"]`).evaluate((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (!ctx) throw new Error("Canvas 2D unavailable");
      const { width, height } = canvas as HTMLCanvasElement;
      const image = ctx.getImageData(0, 0, width, height).data;
      let hash = 2166136261;
      for (const value of image) hash = Math.imul(hash ^ value, 16777619);
      return hash >>> 0;
    });
  const initialFx = await pixels("fx");
  const beamBands = async () =>
    model.locator('canvas[data-layer="lfx"]').evaluate((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (!ctx) throw new Error("Canvas 2D unavailable");
      const image = ctx.getImageData(400, 0, 1, 1080).data;
      const bands: number[] = [];
      let inside = false;
      for (let y = 0; y < 1080; y++) {
        const on = image[y * 4 + 3] > 0;
        if (on && !inside) bands.push(y);
        inside = on;
      }
      return bands;
    });
  const initialBeamBands = await beamBands();
  expect(initialBeamBands).toHaveLength(3);

  await model.getByRole("button", { name: "Run" }).click();
  await page.waitForTimeout(2200);
  const wrappedHeading = Number(await model.getAttribute("data-heading"));
  expect(wrappedHeading).toBeGreaterThan(0);
  expect(wrappedHeading).toBeLessThan(2 * Math.PI);
  expect(await pixels("fx")).not.toBe(initialFx);
  await expect(model).toHaveAttribute("data-ion-pulse", "false");
  expect(await beamBands()).toHaveLength(0);
  await expect(model).toHaveAttribute("data-ion-pulse", "true");
  expect(await beamBands()).toEqual(initialBeamBands);

  await model.getByRole("button", { name: "Pause" }).click();
  const pausedHeading = await model.getAttribute("data-heading");
  const pausedPulse = await model.getAttribute("data-ion-pulse");
  const pausedFx = await pixels("fx");
  const pausedBeamBands = await beamBands();
  await page.waitForTimeout(180);
  expect(await model.getAttribute("data-heading")).toBe(pausedHeading);
  expect(await model.getAttribute("data-ion-pulse")).toBe(pausedPulse);
  expect(await pixels("fx")).toBe(pausedFx);
  expect(await beamBands()).toEqual(pausedBeamBands);
});
