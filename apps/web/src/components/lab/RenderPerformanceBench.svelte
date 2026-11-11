<script lang="ts">
import { type FxPass, FxSurface } from "@void-drift/core";
import { FLIGHT_LAYERS, type FlightLayerId } from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";
import { TURBULENT_BLOOM_DEFAULTS } from "../turbulent-bloom";
import {
  advanceRenderModelHeading,
  createRenderModelFixture,
  isIonBeamPulseActive,
} from "./render-model-fixture";
import {
  addStamps,
  type BenchMetrics,
  emptyMetrics,
  pushSample,
  summarize,
} from "./render-performance-metrics";

let { label = "Render performance" }: { label?: string } = $props();
const WIDTH = 1920;
const HEIGHT = 1080;
const instanceId = $props.id();
const DISTORT_FILTER_ID = `render-performance-distort-${instanceId}`;
const baseline = createRenderModelFixture({ x: WIDTH / 2, y: HEIGHT / 2 });
const fixtures = Array.from({ length: 25 }, (_, index) =>
  createRenderModelFixture(
    {
      x: ((index % 5) + 0.5) * (WIDTH / 5),
      y: (Math.floor(index / 5) + 0.5) * (HEIGHT / 5),
    },
    index % 2 ? "plasma" : "ion",
  ),
);
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let workload = $state<1 | 25>(25);
let running = $state(false);
let fxFilter = $state<"none" | "blur" | "distort" | "turbulent-bloom">(
  "turbulent-bloom",
);
let filters = $derived<Partial<Record<FlightLayerId, string>>>({
  ...(fxFilter === "turbulent-bloom"
    ? {}
    : {
        fx:
          fxFilter === "blur"
            ? "blur(2px)"
            : fxFilter === "distort"
              ? `url(#${DISTORT_FILTER_ID})`
              : "none",
      }),
});
let hardware = $state("");
let copied = $state("");
let measurements = $state<BenchMetrics>(emptyMetrics());
let visibleStats = $state(summarize(emptyMetrics()));
let displayed = $state({
  elapsed: 0,
  samples: 0,
  attempted: 0,
  accepted: 0,
  dropped: 0,
  phase: "Paused",
});
let frameSnapshot = $state({ time: 0, heading: 0 });
let time = 0;
let heading = 0;
let surface: FxSurface | undefined;
let frame = 0;
let last: number | undefined;
let active = false;
let stageElement: HTMLDivElement;
let resizeObserver: ResizeObserver | undefined;
let uiTimer = 0;

function resolution(id: FlightLayerId) {
  return FLIGHT_LAYERS.find((layer) => layer.id === id)?.resolution ?? 1;
}
function context(id: FlightLayerId) {
  return canvases[id]?.getContext("2d") ?? undefined;
}
function scenario(index: number) {
  return workload === 1 ? baseline : fixtures[index];
}
function clearLayer(ctx: CanvasRenderingContext2D) {
  ctx.resetTransform();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const scale = resolution(ctx.canvas.dataset.layer as FlightLayerId);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
function transformCell(ctx: CanvasRenderingContext2D, fixtureIndex: number) {
  const fixture = scenario(fixtureIndex);
  const scale = workload === 1 ? 7.5 : 1.5;
  ctx.translate(fixture.ship.pos.x, fixture.ship.pos.y);
  ctx.scale(scale, scale);
  ctx.translate(-fixture.ship.pos.x, -fixture.ship.pos.y);
}
function drawWorld(ctx: CanvasRenderingContext2D) {
  clearLayer(ctx);
  ctx.globalCompositeOperation = "source-over";
  for (let index = 0; index < workload; index++) {
    ctx.save();
    transformCell(ctx, index);
    scenario(index).drawWorld(ctx, heading);
    ctx.restore();
  }
}
function drawLfx(ctx: CanvasRenderingContext2D, pulse: boolean) {
  clearLayer(ctx);
  for (let index = 0; index < workload; index++) {
    ctx.save();
    transformCell(ctx, index);
    scenario(index).drawLfx(ctx, pulse);
    ctx.restore();
  }
}
function emitFx(ctx: CanvasRenderingContext2D, pass: FxPass, pulse: boolean) {
  for (let index = 0; index < workload; index++) {
    ctx.save();
    transformCell(ctx, index);
    scenario(index).stampFx(ctx, pass, pulse, workload === 1 ? 7.5 : 1.5);
    ctx.restore();
  }
}
function paintFx() {
  const fx = context("fx");
  if (!fx || !surface) return { accepted: 0, dropped: 0 };
  clearLayer(fx);
  surface.draw(
    fx,
    time,
    (ctx, pass) => emitFx(ctx, pass, isIonBeamPulseActive(time)),
    false,
  );
  return {
    accepted: surface.pass.budget.decoration + surface.pass.budget.essential,
    dropped: surface.pass.budget.dropped,
  };
}
function paintScene() {
  const pulse = isIonBeamPulseActive(time);
  const world = context("world");
  const lfx = context("lfx");
  if (!world || !lfx) return { accepted: 0, dropped: 0 };
  drawWorld(world);
  drawLfx(lfx, pulse);
  return paintFx();
}
function restartClock(clearWindow = true) {
  last = undefined;
  measurements.warmup = 0;
  if (clearWindow) measurements.samples = [];
  publish();
}
function publish() {
  visibleStats = summarize(measurements);
  frameSnapshot = { time, heading };
  displayed = {
    elapsed: measurements.elapsed,
    samples: measurements.samples.length,
    phase: running
      ? measurements.warmup < 2
        ? "Warm-up · 2 s"
        : "Measuring"
      : "Paused",
    ...measurements.stamps,
  };
}
function resetScene() {
  time = 1 / 60;
  heading = 0;
  for (const fixture of [...fixtures, baseline]) {
    fixture.advance(0, 0);
    fixture.plume.clear();
  }
  for (let index = 0; index < workload; index++)
    scenario(index).advance(1 / 60, 0);
  surface?.clear();
  measurements = emptyMetrics();
  publish();
  paintScene();
  if (active) restartClock();
}
function setRunning(next: boolean) {
  if (next === active) return;
  active = next;
  running = next;
  if (next) {
    restartClock(true);
    frame = requestAnimationFrame(tick);
  } else {
    last = undefined;
    cancelAnimationFrame(frame);
    publish();
  }
}
function tick(now: number) {
  if (!active || document.hidden) return;
  const interval = last === undefined ? 0 : Math.max(0, (now - last) / 1000);
  last = now;
  if (interval > 0) {
    const world = context("world");
    const lfx = context("lfx");
    if (!world || !lfx) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const start = performance.now();
    time += interval;
    heading = advanceRenderModelHeading(heading, interval);
    for (let index = 0; index < workload; index++)
      scenario(index).advance(interval, heading);
    const counts = paintFx();
    drawWorld(world);
    drawLfx(lfx, isIonBeamPulseActive(time));
    const js = performance.now() - start;
    if (pushSample(measurements, interval, js))
      addStamps(measurements, counts.accepted, counts.dropped);
  }
  frame = requestAnimationFrame(tick);
}
function handleVisibility() {
  if (document.hidden) {
    if (active) cancelAnimationFrame(frame);
    last = undefined;
    return;
  }
  if (active) {
    restartClock(true);
    frame = requestAnimationFrame(tick);
  }
}
function copyResults() {
  const stats = summarize(measurements);
  const sampledWindow = measurements.samples.reduce(
    (sum, sample) => sum + sample.interval,
    0,
  );
  const stage = stageElement
    ? `${stageElement.clientWidth}×${stageElement.clientHeight}`
    : "unknown";
  const backings = FLIGHT_LAYERS.map(
    (layer) =>
      `${layer.id} ${WIDTH * layer.resolution}×${HEIGHT * layer.resolution}`,
  ).join(", ");
  copied = [
    `Render performance bench · ${workload} scenario${workload === 1 ? "" : "s"} · ${workload === 1 ? "ion" : "alternating ion and plasma"} main engines`,
    `Measured active time: ${measurements.elapsed.toFixed(2)} s; rolling sampled interval span: ${sampledWindow.toFixed(2)} s; samples: ${measurements.samples.length}`,
    `Viewport: ${innerWidth}×${innerHeight}; stage CSS: ${stage}; backings: ${backings}; DPR: ${devicePixelRatio}`,
    `Browser: ${navigator.userAgent}; hardware label: ${hardware.trim() || "unspecified"}`,
    `FX blend: Screen; filter: ${fxFilter === "blur" ? "blur(2px)" : fxFilter === "distort" ? "Distort · 2px" : fxFilter === "turbulent-bloom" ? `Turbulent Bloom · ${TURBULENT_BLOOM_DEFAULTS.glowSize}px glow, ${TURBULENT_BLOOM_DEFAULTS.distortion}px distortion, ${TURBULENT_BLOOM_DEFAULTS.strength}% strength` : "none"}; LFX: Hard light; no filter`,
    `FPS: ${stats.fps.toFixed(1)}; frame interval median/p95: ${(stats.intervalMedian * 1000).toFixed(2)}/${(stats.intervalP95 * 1000).toFixed(2)} ms; JS update + Canvas submission median/p95: ${stats.jsMedian.toFixed(2)}/${stats.jsP95.toFixed(2)} ms`,
    `Stamp totals: attempted ${measurements.stamps.attempted}; accepted ${measurements.stamps.accepted}; dropped ${measurements.stamps.dropped}`,
    "Timing measures visible requestAnimationFrame callbacks and synchronous JS/Canvas submission, not GPU completion. Use a visible ordinary browser on target hardware; automated/headless runs establish correctness only.",
  ].join("\n");
}
async function copy() {
  copyResults();
  try {
    await navigator.clipboard.writeText(copied);
  } catch {
    /* selectable fallback remains visible */
  }
}
function setWorkload(value: string) {
  workload = value === "1" ? 1 : 25;
  resetScene();
}
function setFxFilter(value: string) {
  if (
    value === "none" ||
    value === "blur" ||
    value === "distort" ||
    value === "turbulent-bloom"
  )
    fxFilter = value;
  measurements = emptyMetrics();
  publish();
  if (active) restartClock(false);
}

onMount(() => {
  let handleResize = () => {};
  const initializeFrame = requestAnimationFrame(() => {
    for (const { id, resolution: scale } of FLIGHT_LAYERS) {
      const canvas = canvases[id];
      if (!canvas) throw new Error(`Missing ${id} FlightLayers canvas binding`);
      canvas.width = WIDTH * scale;
      canvas.height = HEIGHT * scale;
    }
    surface = new FxSurface();
    resetScene();
    document.addEventListener("visibilitychange", handleVisibility);
    uiTimer = window.setInterval(publish, 250);
    resizeObserver = new ResizeObserver(() => {
      measurements = emptyMetrics();
      publish();
      if (active) restartClock();
      paintScene();
    });
    if (stageElement) resizeObserver.observe(stageElement);
    handleResize = () => {
      measurements = emptyMetrics();
      publish();
      if (active) restartClock();
    };
    window.addEventListener("resize", handleResize);
  });
  return () => {
    active = false;
    running = false;
    cancelAnimationFrame(initializeFrame);
    cancelAnimationFrame(frame);
    clearInterval(uiTimer);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    surface?.clear();
  };
});
</script>

<section
  class="bench"
  aria-label={`${label} bench`}
  data-running={running}
  data-workload={workload}
  data-time={frameSnapshot.time}
  data-heading={frameSnapshot.heading}
  data-attempted={displayed.attempted}
  data-accepted={displayed.accepted}
  data-dropped={displayed.dropped}
>
  <header>
    <div>
      <p class="eyebrow">Rendering instrument</p>
      <h1>{label}</h1>
      <p>
        Rotating production Wasps with ion and plasma main plumes, stabilizer
        plumes and three pulsed ion beams per scenario. The single scenario uses
        ion.
      </p>
    </div>
    <div class="controls">
      <label
        >Scenarios
        <select
          aria-label="Scenario count"
          value={String(workload)}
          onchange={(event) => setWorkload(event.currentTarget.value)}
        >
          <option value="1">1</option>
          <option value="25">25</option>
        </select></label
      ><button
        type="button"
        class="btn btn-primary"
        onclick={() => setRunning(true)}
        disabled={running}
      >
        Run
      </button><button
        type="button"
        class="btn btn-ghost"
        onclick={() => setRunning(false)}
        disabled={!running}
      >
        Pause
      </button><button type="button" class="btn btn-ghost" onclick={resetScene}>
        Reset
      </button>
    </div>
  </header>
  <p class="scale-note">
    1 scenario uses 7.5× scale at stage centre. 25 scenarios use 1.5× scale in a
    5×5 grid. Stage and canvas backings stay fixed at 1920×1080 × production
    layer resolution.
  </p>
  <div class="layout">
    <div class="stage" bind:this={stageElement}>
      <FlightLayers
        bind:canvases
        label="Shared scene rendering performance workload"
        blends={{ world: "normal", fx: "screen", lfx: "hard-light" }}
        {filters}
      />
    </div>
    <aside>
      <fieldset>
        <legend>Presentation</legend>
        <label
          >FX presentation filter
          <select
            aria-label="FX presentation filter"
            value={fxFilter}
            onchange={(event) => setFxFilter(event.currentTarget.value)}
          >
            <option value="none">None</option>
            <option value="blur">Blur · 2px</option>
            <option value="distort">Distort · 2px</option>
            <option value="turbulent-bloom">
              Turbulent Bloom · 12px / 16px / 90%
            </option>
          </select></label
        ><label
          >Hardware label
          <input
            bind:value={hardware}
            placeholder="Optional device label"
          ></label
        >
      </fieldset>
      <section aria-live="polite">
        <h2>Measurements</h2>
        <dl>
          <dt>Measurement phase</dt>
          <dd>{displayed.phase}</dd>
          <dt>FPS · rolling</dt>
          <dd>{visibleStats.fps.toFixed(1)}</dd>
          <dt>Frame interval median / p95</dt>
          <dd>
            {(visibleStats.intervalMedian * 1000).toFixed(2)}
            / {(visibleStats.intervalP95 * 1000).toFixed(2)} ms
          </dd>
          <dt>JS + Canvas submit median / p95</dt>
          <dd>
            {visibleStats.jsMedian.toFixed(2)}
            / {visibleStats.jsP95.toFixed(2)} ms
          </dd>
          <dt>Measured active time</dt>
          <dd>{displayed.elapsed.toFixed(1)} s</dd>
          <dt>Samples in rolling window</dt>
          <dd>{displayed.samples}</dd>
          <dt>Stamp attempted / accepted / dropped</dt>
          <dd>
            {displayed.attempted}
            / {displayed.accepted} / {displayed.dropped}
          </dd>
        </dl>
      </section>
      <button type="button" class="btn btn-ghost" onclick={copy}>
        Copy results
      </button><textarea
        aria-label="Selectable results text"
        readonly
        value={copied}
      ></textarea>
      <p>
        Measurements exclude the first two seconds after Run or resume. FPS is
        callback timing, not GPU completion. Collect evidence in a visible
        ordinary browser on the target hardware.
      </p>
      <a href="/lab/render-model">Open the Render Model reference</a>
    </aside>
  </div>
  <svg
    class="filter-defs"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter
      id={DISTORT_FILTER_ID}
      x="-35%"
      y="-35%"
      width="170%"
      height="170%"
      color-interpolation-filters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.035"
        numOctaves="2"
        seed="7"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="2"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
</section>
<style>
.bench {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-lg);
}
.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}
h1 {
  margin: 0;
  font-size: var(--font-size-heading);
}
header p {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
}
.eyebrow {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
.scale-note {
  margin: 0 0 var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.controls {
  display: flex;
  align-items: end;
  gap: var(--spacing-sm);
  min-width: 0;
}
aside label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-label);
}
.controls label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-label);
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: var(--spacing-lg);
  align-items: start;
}
.stage {
  position: sticky;
  top: var(--spacing-lg);
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-void);
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
aside {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 0;
}
fieldset,
aside section {
  border: 1px solid var(--color-border-subtle);
  padding: var(--spacing-md);
}
fieldset {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
}
legend,
h2 {
  font-size: var(--font-size-label);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
h2 {
  margin: 0;
}
dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-xs);
  font-size: var(--font-size-caption);
}
dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
dt {
  color: var(--color-text-muted);
}
input,
select,
textarea {
  font: inherit;
  color: var(--color-text);
  background: var(--color-void);
  border: 1px solid var(--color-border);
  padding: var(--spacing-xs);
}
textarea {
  min-height: 140px;
  resize: vertical;
  font-family: monospace;
  font-size: var(--font-size-caption);
}
aside input,
aside select,
aside textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}
.controls select {
  box-sizing: border-box;
  min-width: 4rem;
}
aside p,
aside a {
  font-size: var(--font-size-caption);
  line-height: 1.5;
  color: var(--color-text-muted);
}
@media (max-width: 1000px) {
  header {
    align-items: start;
    flex-direction: column;
  }
  .layout {
    grid-template-columns: 1fr;
  }
  .stage {
    position: relative;
    top: auto;
  }
}
</style>
