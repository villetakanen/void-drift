import type { Locator } from "@playwright/test";
import { FLIGHT_LAYERS } from "../../packages/mode-a/src/lib/flight-frame";
import { expect, test } from "../helpers/local-browser";

// Contract: docs/specs/lab/flight-scene-instrument/spec.md.
// The Lab targets 1280 px and up; the instrument is checked at both ends.
const LABEL = "Flight scene: a burn in the game’s layers";

for (const width of [1280, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    const open = async (page: import("@playwright/test").Page) => {
      await page.goto("/lab/flight-scene");
      const scene = page.getByRole("figure", { name: LABEL });
      await expect(scene).toHaveAttribute("data-rendered", "true");
      return scene;
    };
    const seek = (time: Locator, seconds: number) =>
      time.evaluate((element: HTMLInputElement, value: number) => {
        element.value = String(value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }, seconds);
    const choose = async (scene: Locator, name: string) => {
      const radio = scene.getByRole("radio", { name, exact: true });
      await radio.focus();
      await radio.press("Space");
    };
    // What a layer holds, as relations and not values: how many of its pixels
    // differ from its first pixel, and a hash of every pixel, so that two
    // instants can be told equal or different without printing images.
    const image = (canvas: Locator) =>
      canvas.evaluate((element) => {
        const layer = element as HTMLCanvasElement;
        const ctx = layer.getContext("2d");
        if (!ctx) throw new Error("A flight layer needs Canvas 2D");
        const pixels = new Uint32Array(
          ctx.getImageData(0, 0, layer.width, layer.height).data.buffer,
        );
        let differing = 0;
        let hash = 2166136261;
        for (let i = 0; i < pixels.length; i++) {
          if (pixels[i] !== pixels[0]) differing++;
          hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
        }
        return { differing, hash };
      });
    const layer = (scene: Locator, id: "world" | "fx" | "lfx") =>
      scene.locator(`canvas[data-layer="${id}"]`);
    const drawnAt = async (scene: Locator, tick: number) => {
      await expect(scene).toHaveAttribute("data-tick", String(tick));
      await expect(scene).toHaveAttribute("data-drawn-tick", String(tick));
    };
    const frames = async (scene: Locator) => ({
      world: await image(layer(scene, "world")),
      fx: await image(layer(scene, "fx")),
    });

    test("mounts the layers with their own blend modes and a real bloom filter", async ({
      page,
    }) => {
      const scene = await open(page);
      const layers = scene.locator("canvas[data-layer]");
      await expect(layers).toHaveCount(FLIGHT_LAYERS.length);
      const mounted = await layers.evaluateAll((items) =>
        items.map((canvas) => ({
          id: canvas.getAttribute("data-layer"),
          width: (canvas as HTMLCanvasElement).width,
          height: (canvas as HTMLCanvasElement).height,
          blend: getComputedStyle(canvas).mixBlendMode,
        })),
      );
      expect(mounted.map((layer) => layer.id)).toEqual(
        FLIGHT_LAYERS.map((layer) => layer.id),
      );
      expect(mounted.map((layer) => layer.blend)).toEqual(
        FLIGHT_LAYERS.map((layer) => layer.blend),
      );
      // Each layer is the scene at its own resolution, and nothing is
      // stretched: the canvas has the proportions the scene has on screen.
      const world = mounted[0];
      const slot = await scene.locator(".slot.scene").boundingBox();
      if (!slot) throw new Error("The scene slot is not laid out");
      expect(world.width / world.height).toBeCloseTo(
        slot.width / slot.height,
        1,
      );
      for (const [index, layer] of FLIGHT_LAYERS.entries())
        expect(mounted[index].width).toBe(
          Math.round(world.width * layer.resolution),
        );

      const fx = scene.locator('canvas[data-layer="fx"]');
      await expect(fx).toHaveCSS("filter", /url\(/);
      const filter = await fx.evaluate((canvas) => {
        const match = getComputedStyle(canvas).filter.match(/#([^)'"]+)/);
        const element = match && document.getElementById(match[1]);
        return {
          resolves: Boolean(element),
          tag: element?.tagName.toLowerCase(),
          blurs: Boolean(element?.querySelector("feGaussianBlur")),
        };
      });
      expect(filter).toEqual({ resolves: true, tag: "filter", blurs: true });
      await expect(scene.locator('canvas[data-layer="world"]')).toHaveCSS(
        "filter",
        "none",
      );
    });

    test("renders the scene, jumps to an instant, plays and pauses", async ({
      page,
    }) => {
      const scene = await open(page);
      await expect(scene).toHaveAttribute("data-burn", "course");
      const opening = Number(await scene.getAttribute("data-tick"));
      await drawnAt(scene, opening);
      expect((await image(layer(scene, "world"))).differing).toBeGreaterThan(0);
      await expect(layer(scene, "lfx")).toHaveCSS("filter", "none");

      const time = scene.getByRole("slider", { name: "Time" });
      const lit = 215;
      await seek(time, lit / 60);
      await drawnAt(scene, lit);
      const first = await frames(scene);
      expect(first.fx.differing).toBeGreaterThan(0);

      // Another instant differs; coming back to this one repeats it exactly.
      await seek(time, 100 / 60);
      await drawnAt(scene, 100);
      const earlier = await frames(scene);
      expect(earlier.world.hash).not.toBe(first.world.hash);
      expect(earlier.fx.hash).not.toBe(first.fx.hash);
      await seek(time, lit / 60);
      await drawnAt(scene, lit);
      expect(await frames(scene)).toEqual(first);

      await scene.getByRole("button", { name: "Play", exact: true }).click();
      await expect(scene).toHaveAttribute("data-playing", "true");
      await expect
        .poll(() => scene.getAttribute("data-tick"))
        .not.toBe(String(lit));
      await expect
        .poll(() => scene.getAttribute("data-drawn-tick"))
        .not.toBe(String(lit));
      await scene.getByRole("button", { name: "Pause", exact: true }).click();
      await expect(scene).toHaveAttribute("data-playing", "false");
      const held = (await scene.getAttribute("data-tick")) ?? "";
      await expect(scene).toHaveAttribute("data-drawn-tick", held);
      const paused = await frames(scene);
      await page.waitForTimeout(250);
      await expect(scene).toHaveAttribute("data-tick", held);
      expect(await frames(scene)).toEqual(paused);
    });

    test("draws every view and keeps the instant", async ({ page }) => {
      const scene = await open(page);
      await expect(scene).toHaveAttribute("data-drawn-view", "follow");
      const lit = 215;
      await seek(scene.getByRole("slider", { name: "Time" }), lit / 60);
      await drawnAt(scene, lit);
      const worlds = new Map<string, number>();
      for (const [name, id] of [
        ["Follow", "follow"],
        ["Game", "game"],
        ["Follow 4×", "follow-far"],
      ] as const) {
        await choose(scene, name);
        await expect(scene).toHaveAttribute("data-drawn-view", id);
        await drawnAt(scene, lit);
        const world = await image(layer(scene, "world"));
        expect(world.differing).toBeGreaterThan(0);
        worlds.set(id, world.hash);
      }
      // A far view is another picture of the same instant.
      expect(worlds.get("follow-far")).not.toBe(worlds.get("follow"));
      await choose(scene, "Follow");
      await expect(scene).toHaveAttribute("data-drawn-view", "follow");
      await drawnAt(scene, lit);
      expect((await image(layer(scene, "world"))).hash).toBe(
        worlds.get("follow"),
      );
    });

    test("another burn flies the same instant from its own program", async ({
      page,
    }) => {
      const scene = await open(page);
      const opening = await scene.getAttribute("data-tick");
      expect(opening).not.toBeNull();
      await choose(scene, "B2");
      await expect(scene).toHaveAttribute("data-drawn-burn", "turn");
      await expect(scene).toHaveAttribute("data-drawn-tick", opening ?? "");
    });

    test("keeps its controls inside the window at this width", async ({
      page,
    }) => {
      const scene = await open(page);
      const figure = await scene.boundingBox();
      if (!figure) throw new Error("The scene is not laid out");
      for (const control of [
        scene.locator(".burns"),
        scene.getByRole("button", { name: /^Open/ }),
      ]) {
        const box = await control.boundingBox();
        if (!box) throw new Error("A control is not laid out");
        expect(box.x).toBeGreaterThanOrEqual(figure.x - 0.5);
        expect(box.y).toBeGreaterThanOrEqual(figure.y - 0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(
          figure.x + figure.width + 0.5,
        );
        expect(box.y + box.height).toBeLessThanOrEqual(
          figure.y + figure.height + 0.5,
        );
      }
    });

    test("the Lab page's study light shows its caption and keeps the instant", async ({
      page,
    }) => {
      const scene = await open(page);
      const opening = (await scene.getAttribute("data-tick")) ?? "";
      await expect(scene).not.toHaveAttribute("data-study-light");
      await page.getByRole("button", { name: /^Open/ }).click();
      await scene.getByLabel("Example marker", { exact: true }).check();
      await expect(scene).toHaveAttribute("data-study-light", "true");
      await expect(scene.getByText(/^Study light:/)).toBeVisible();
      await drawnAt(scene, Number(opening));
      await scene.getByLabel("Example marker", { exact: true }).uncheck();
      await expect(scene).not.toHaveAttribute("data-study-light");
      await drawnAt(scene, Number(opening));
    });

    test("the Lab page's menu offers the starter's targets and hides each layer", async ({
      page,
    }) => {
      const scene = await open(page);
      await page.getByRole("button", { name: /^Open/ }).click();
      const targets = scene.getByRole("radiogroup", { name: "Targets" });
      await expect(targets.getByRole("radio")).toHaveCount(3);
      await expect(
        targets.getByRole("radio", { name: "None", exact: true }),
      ).toBeAttached();
      await expect(
        targets.getByRole("radio", { name: "Placed", exact: true }),
      ).toBeChecked();
      await expect(
        targets.getByRole("radio", { name: "Held ahead", exact: true }),
      ).toBeAttached();

      for (const [name, id] of [
        ["World", "world"],
        ["FX", "fx"],
        ["LFX", "lfx"],
      ] as const) {
        const canvas = scene.locator(`canvas[data-layer="${id}"]`);
        const toggle = scene.getByLabel(name, { exact: true });
        await expect(canvas).toHaveCSS("visibility", "visible");
        await toggle.uncheck();
        await expect(canvas).toHaveCSS("visibility", "hidden");
        // Hiding keeps the scene flying; the other layers stay shown.
        await expect(scene).toHaveAttribute("data-rendered", "true");
        await toggle.check();
        await expect(canvas).toHaveCSS("visibility", "visible");
      }
    });
  });
}

test("the study's four examples render on the shared engine", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/studies/flight-scene-instrument-2026-11-10");
  // 02.1 to 02.3 are older retained steps, collapsed by default.
  for (const id of ["time", "camera", "scene"])
    await page.locator(`details#${id} > summary`).click();
  const figures = page.getByRole("figure", { name: LABEL });
  await expect(figures).toHaveCount(4);
  for (const figure of await figures.all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute("data-rendered", "true");
  }
  // One bloom filter per layer stack, however many examples the page shows.
  const ids = await page
    .locator("svg.filter-defs filter[id^='flight-layers-bloom-']")
    .evaluateAll((filters) => filters.map((filter) => filter.id));
  expect(ids).toHaveLength(await page.locator(".flight-layers").count());
  expect(new Set(ids).size).toBe(ids.length);
});
