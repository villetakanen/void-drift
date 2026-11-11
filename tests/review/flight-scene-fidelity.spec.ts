import type { Locator, Page } from "@playwright/test";
import { inputAt } from "../../apps/web/src/lib/instrument/burns";
import { expect, test } from "../helpers/local-browser";
import { writeReport } from "../helpers/write-report.mjs";

// Measurement, not a gate: how faithful the Flight scene instrument is to play,
// and what it costs. It asserts no design values; it measures and reports, to
// the console and to test-results/flight-scene-fidelity.json. Run it with
//
//   npx playwright test -c playwright.capture.config.ts \
//     tests/review/flight-scene-fidelity.spec.ts
//
// Contract: docs/specs/lab/flight-scene-instrument/spec.md. A step that fails
// is recorded as an error in the report; the other steps still run.

const LABEL = "Flight scene: a burn in the game’s layers";
const STUDY = "/lab/studies/flight-scene-instrument-2026-11-10";
const OUTPUT = "test-results/flight-scene-fidelity.json";

type Store = Record<string, Record<string, Uint8ClampedArray>>;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const percentile = (values: number[], share: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))];
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
const drawnAt = async (scene: Locator, tick: number) => {
  await expect(scene).toHaveAttribute("data-tick", String(tick));
  await expect(scene).toHaveAttribute("data-drawn-tick", String(tick));
};

/** Keeps every layer's pixels in the page under `key`, for a later comparison. */
const capture = (scene: Locator, key: string) =>
  scene.evaluate((figure, name) => {
    const w = window as unknown as { __frames?: Store };
    w.__frames ??= {};
    const store = w.__frames;
    const layers: Record<string, Uint8ClampedArray> = {};
    for (const canvas of figure.querySelectorAll<HTMLCanvasElement>(
      "canvas[data-layer]",
    )) {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("A flight layer needs Canvas 2D");
      layers[canvas.dataset.layer ?? "?"] = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
    }
    store[name] = layers;
  }, key);

/** Per layer: pixels, pixels that differ in any channel, the largest channel difference. */
const compare = (page: Page, first: string, second: string) =>
  page.evaluate(
    ({ a, b }) => {
      const store = (window as unknown as { __frames?: Store }).__frames ?? {};
      const out: Record<
        string,
        { pixels: number; differing: number; maxChannelDiff: number }
      > = {};
      for (const id of Object.keys(store[a])) {
        const x = store[a][id];
        const y = store[b][id];
        let differing = 0;
        let largest = 0;
        for (let i = 0; i < x.length; i += 4) {
          let pixel = 0;
          for (let c = 0; c < 4; c++) {
            const d = Math.abs(x[i + c] - y[i + c]);
            if (d > pixel) pixel = d;
          }
          if (pixel > 0) differing++;
          if (pixel > largest) largest = pixel;
        }
        out[id] = {
          pixels: x.length / 4,
          differing,
          maxChannelDiff: largest,
        };
      }
      delete store[a];
      delete store[b];
      return out;
    },
    { a: first, b: second },
  );

/** The FX canvas and its bloom filter, as laid out in this page right now. */
const bloomSize = (fx: Locator) =>
  fx.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const match = getComputedStyle(canvas).filter.match(/#([^)'"]+)/);
    const filter = match && document.getElementById(match[1]);
    if (!filter) throw new Error("The FX layer has no resolvable bloom filter");
    const stdDeviation = Number(
      filter.querySelector("feGaussianBlur")?.getAttribute("stdDeviation"),
    );
    const displacement = Number(
      filter.querySelector("feDisplacementMap")?.getAttribute("scale"),
    );
    const rect = canvas.getBoundingClientRect();
    const screen = canvas.closest(".screen");
    const fitted = screen
      ? new DOMMatrixReadOnly(getComputedStyle(screen).transform).a
      : null;
    // A CSS filter works in the element's own layout pixels, before any
    // ancestor transform scales the result.
    const backingPerLayout = canvas.width / canvas.offsetWidth;
    const screenPerLayout = rect.width / canvas.offsetWidth;
    return {
      cssWidth: canvas.offsetWidth,
      cssHeight: canvas.offsetHeight,
      onScreenWidth: rect.width,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      screenTransformScale: fitted,
      ancestorScale: screenPerLayout,
      stdDeviation,
      displacementScale: displacement,
      blurRadiusBackingPx: stdDeviation * backingPerLayout,
      blurRadiusOnScreenPx: stdDeviation * screenPerLayout,
      displacementBackingPx: displacement * backingPerLayout,
    };
  });

const frameTimes = (page: Page, milliseconds: number) =>
  page.evaluate(
    (span) =>
      new Promise<number[]>((resolve) => {
        const deltas: number[] = [];
        let last = performance.now();
        const start = last;
        const step = (now: number) => {
          deltas.push(now - last);
          last = now;
          if (now - start < span) requestAnimationFrame(step);
          else resolve(deltas);
        };
        requestAnimationFrame(step);
      }),
    milliseconds,
  );
const summarise = (deltas: number[]) => ({
  frames: deltas.length,
  medianMs: median(deltas),
  p95Ms: percentile(deltas, 0.95),
  maxMs: Math.max(...deltas),
});

// Instants of B1 (14 s, 60 ticks a second): engines lit at 90, 215, 330, 560
// and 800; 150 is a coast. The instrument's starter flies a Light Ion Cannon.
const INSTANTS = [90, 150, 215, 330, 560, 800];
const VIEWS = [
  ["Follow", "follow"],
  ["Game", "game"],
] as const;

test("flight scene fidelity and cost", async ({ page }) => {
  test.setTimeout(1_200_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const report: Record<string, unknown> = {
    viewport: { width: 1440, height: 900 },
    measuredAt: new Date().toISOString(),
    notes: {
      bloom:
        "A CSS filter's units are the element's layout pixels, so the blur radius in backing pixels is stdDeviation x (backing width / CSS width); the on-screen radius also carries the ancestors' transforms.",
      frameTimes:
        "requestAnimationFrame deltas in one headless Chromium page; they include everything the page draws, and may be capped at the display rate.",
    },
  };
  const step = async (name: string, run: () => Promise<unknown>) => {
    try {
      report[name] = await run();
    } catch (error) {
      report[name] = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const open = async () => {
    await page.goto("/lab/flight-scene");
    const scene = page.getByRole("figure", { name: LABEL });
    await expect(scene).toHaveAttribute("data-rendered", "true");
    return scene;
  };

  // a. Jump versus play: the frame a jump reaches against the frame continuous
  // play reaches, at the same drawn tick.
  await step("jumpVersusPlay", async () => {
    const scene = await open();
    const time = scene.getByRole("slider", { name: "Time" });
    const rows: unknown[] = [];
    for (const [name, id] of VIEWS) {
      await choose(scene, name);
      await expect(scene).toHaveAttribute("data-drawn-view", id);
      for (const requested of INSTANTS) {
        await seek(time, 0);
        await drawnAt(scene, 0);
        await scene.getByRole("button", { name: "Play", exact: true }).click();
        // Pause in the frame that first reaches the instant; the click is
        // synchronous with the check, so at most the frame's own ticks overshoot.
        await scene.evaluate(
          (figure, target) =>
            new Promise<void>((resolve) => {
              const check = () => {
                if (Number(figure.getAttribute("data-drawn-tick")) >= target) {
                  figure
                    .querySelector<HTMLButtonElement>(".time .btn")
                    ?.click();
                  resolve();
                } else requestAnimationFrame(check);
              };
              requestAnimationFrame(check);
            }),
          requested,
        );
        await expect(scene).toHaveAttribute("data-playing", "false");
        const reached = Number(await scene.getAttribute("data-tick"));
        await drawnAt(scene, reached);
        await capture(scene, "play");
        await seek(time, 0);
        await drawnAt(scene, 0);
        await seek(time, reached / 60);
        await drawnAt(scene, reached);
        await capture(scene, "jump");
        rows.push({
          view: id,
          requestedTick: requested,
          reachedTick: reached,
          engines: inputAt("course", reached),
          layers: await compare(page, "play", "jump"),
        });
      }
    }
    return rows;
  });

  // b. Bloom size against the picture: the instrument, then the game.
  await step("bloomInstrument", async () => {
    const scene = await open();
    return bloomSize(scene.locator('canvas[data-layer="fx"]'));
  });
  await step("bloomGame", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "PRESS START" }).click();
    await expect(page.locator(".flight-page")).toHaveAttribute(
      "data-phase",
      "playing",
      { timeout: 60_000 },
    );
    const stage = page.locator(".flight-stage");
    return {
      measured: "the game's flight screen in play (Survival), real time",
      stageActiveWidth: await stage.getAttribute("data-active-width"),
      stageActiveHeight: await stage.getAttribute("data-active-height"),
      ...(await bloomSize(page.locator('canvas[data-layer="fx"]'))),
    };
  });

  // c. Cost: a jump from the start to the end of the burn, then frame times on
  // the study page with all four examples mounted.
  await step("jumpCost", async () => {
    const scene = await open();
    const time = scene.getByRole("slider", { name: "Time" });
    const runs: number[] = [];
    let last = 0;
    for (let run = 0; run < 5; run++) {
      await seek(time, 0);
      await drawnAt(scene, 0);
      const result = await time.evaluate(
        (element: HTMLInputElement) =>
          new Promise<{ ms: number; last: number }>((resolve) => {
            const figure = element.closest("figure");
            if (!figure) throw new Error("The slider is not inside the scene");
            const end = Math.round(Number(element.max) * 60);
            const started = performance.now();
            const watch = new MutationObserver(() => {
              if (figure.getAttribute("data-drawn-tick") === String(end)) {
                watch.disconnect();
                resolve({ ms: performance.now() - started, last: end });
              }
            });
            watch.observe(figure, {
              attributes: true,
              attributeFilter: ["data-drawn-tick"],
            });
            element.value = element.max;
            element.dispatchEvent(new Event("input", { bubbles: true }));
          }),
      );
      runs.push(result.ms);
      last = result.last;
    }
    return {
      toTick: last,
      runsMs: runs,
      medianMs: median(runs),
      note: "includes waiting for the next animation frame, up to one frame time",
    };
  });
  await step("studyFrameTimes", async () => {
    await page.goto(STUDY);
    for (const id of ["time", "camera", "scene"])
      await page.locator(`details#${id} > summary`).click();
    const figures = page.getByRole("figure", { name: LABEL });
    await expect(figures).toHaveCount(4);
    for (const figure of await figures.all()) {
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toHaveAttribute("data-rendered", "true");
    }
    const playing = figures.last();
    await playing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const idle = summarise(await frameTimes(page, 5000));
    await playing.getByRole("button", { name: "Play", exact: true }).click();
    await expect(playing).toHaveAttribute("data-playing", "true");
    const during = summarise(await frameTimes(page, 5000));
    const stillPlaying = await playing.getAttribute("data-playing");
    await playing.getByRole("button", { name: "Pause", exact: true }).click();
    return {
      examplesMounted: 4,
      allIdle: idle,
      oneOfFourPlaying: { ...during, stillPlayingAtEnd: stillPlaying },
    };
  });

  writeReport(OUTPUT, report);
  console.log(JSON.stringify(report, null, 2));
});
