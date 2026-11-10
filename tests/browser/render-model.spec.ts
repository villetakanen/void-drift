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
  const initialFx = await readPixel("fx", 1100, 540);
  expect(initialFx[3]).toBeGreaterThan(0);
  const initialWorld = await readPixel("world", 930, 540);
  const initialLfx = await readPixel("lfx", 950, 568);
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
        ? { x: 930, y: 540 }
        : layer.id === "fx"
          ? { x: 1100, y: 540 }
          : { x: 950, y: 568 };
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
  expect(await readPixel("fx")).toEqual(initialFx);
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
  expect((await readPixel("fx"))[3]).toBeGreaterThan(initialFx[3]);
  await model.getByRole("button", { name: "Run" }).click();
  await expect(model).toHaveAttribute("data-running", "true");
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .uncheck();
  await page.waitForTimeout(500);
  const faded = await readPixel("fx");
  expect(faded[3]).toBeLessThan(initialFx[3]);
  await model
    .locator('[data-layer-controls="fx"]')
    .getByRole("checkbox", { name: "Visible" })
    .check();
  expect(await readPixel("world", 930, 540)).toEqual(initialWorld);
  expect(await readPixel("lfx", 950, 568)).toEqual(initialLfx);
  await model.getByRole("button", { name: "Pause" }).click();
  const held = await readPixel("fx");
  await page.waitForTimeout(180);
  expect(await readPixel("fx")).toEqual(held);

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
  const freshFx = await readPixel("fx");
  await model.getByRole("button", { name: "Paint" }).click();
  const repaintedFx = await readPixel("fx");
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
  expect(repaintedFx).toEqual(initialFx);
  expect(freshFx[3]).toBe(0);
  await model
    .getByRole("combobox", { name: "Picture sample" })
    .selectOption("circles");
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
