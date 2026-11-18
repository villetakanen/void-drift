<script lang="ts">
import { Camera, COLOR, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerId,
  type FlightPass,
  PARTS,
  resizeFlightLayers,
  STEP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";
import Switch from "../inputs/Switch.svelte";
import { percentile } from "./render-performance-metrics";
import {
  TARGETING_VIEW,
  TargetingBench,
  type TargetingConfig,
  type TargetingSummary,
  type TargetingWeapon,
} from "./targeting-bench";

let _props: { "client:load"?: boolean } = $props();
const WIDTH = 1024;
const HEIGHT = 768;
const weapons: TargetingWeapon[] = [
  "light-ion-cannon",
  "ion-point-defence",
  "laser",
  "plasma-rifle",
];
let slot1 = $state<TargetingWeapon>("light-ion-cannon");
let slot2 = $state<TargetingWeapon>("ion-point-defence");
let formation =
  $state<NonNullable<TargetingConfig["formation"]>>("three-loops");
let mode = $state<TargetingConfig["mode"]>("sustained");
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let ready = $state(false);
let running = $state(true);
let trace = $state(false);
let metrics = $state<TargetingSummary>();
let elapsed = $state(0);
type BrowserSample = {
  tick: number;
  interval: number;
  simulation: number;
  render: number;
  fx: number;
  steps: number;
};
let frameP50 = $state(0);
let frameP95 = $state(0);
let simulationP95 = $state(0);
let renderP95 = $state(0);
let fxP95 = $state(0);
let stepsMean = $state(0);
let frameCount = $state(0);
let reset = $state<() => void>(() => {});
let changePlayback = $state<() => void>(() => {});
let resetFrameTiming = $state<() => void>(() => {});

function ms(value: number) {
  return value === 0 ? "0" : value.toFixed(3);
}

onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fxLayer = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!world || !fxLayer || !lfx)
    throw new Error("Targeting bench needs Canvas 2D.");
  const layers = { world, fx: fxLayer, lfx };
  const renderer = new Renderer(world.canvas);
  const camera = new Camera({ viewportWidth: WIDTH, viewportHeight: HEIGHT });
  camera.pos.set(TARGETING_VIEW.x, TARGETING_VIEW.y);
  camera.zoom = Math.min(
    WIDTH / TARGETING_VIEW.width,
    HEIGHT / TARGETING_VIEW.height,
  );
  const fx = new FlightFx();
  resizeFlightLayers(layers, renderer, WIDTH, HEIGHT);
  let encounter: TargetingBench;
  let frame = 0;
  let last: number | undefined;
  let carry = 0;
  let lastPublished = 0;
  let frameSamples: BrowserSample[] = [];
  let fxSubmission = 0;
  const observePass = (pass: FlightPass, duration: number) => {
    if (pass.layer === "fx") fxSubmission += duration;
  };

  function publish() {
    metrics = encounter.metrics;
    elapsed = encounter.sim.ticks * STEP;
    frameCount = frameSamples.length;
    const intervals = frameSamples.map((sample) => sample.interval);
    frameP50 = percentile(intervals, 0.5);
    frameP95 = percentile(intervals, 0.95);
    simulationP95 = percentile(
      frameSamples.map((sample) => sample.simulation),
      0.95,
    );
    renderP95 = percentile(
      frameSamples.map((sample) => sample.render),
      0.95,
    );
    fxP95 = percentile(
      frameSamples.map((sample) => sample.fx),
      0.95,
    );
    stepsMean = frameCount
      ? frameSamples.reduce((sum, sample) => sum + sample.steps, 0) / frameCount
      : 0;
  }
  function paint() {
    fxSubmission = 0;
    drawFlightFrame(
      { layers, renderer, camera, sim: encounter.sim, fx },
      { observe: observePass },
    );
    if (trace) {
      const world = layers.world;
      world.save();
      camera.applyTransform(world);
      world.strokeStyle = COLOR.resourceHull;
      world.globalAlpha = 0.75;
      world.lineWidth = 1 / camera.zoom;
      world.setLineDash([4 / camera.zoom, 5 / camera.zoom]);
      world.beginPath();
      for (const link of encounter.traces) {
        world.moveTo(link.x, link.y);
        world.lineTo(link.endX, link.endY);
      }
      world.stroke();
      world.restore();
    }
  }
  reset = () => {
    encounter = new TargetingBench({ slot1, slot2, mode, formation });
    fx.clear();
    carry = 0;
    last = undefined;
    frameSamples = [];
    publish();
    paint();
  };
  changePlayback = () => {
    running = !running;
    last = undefined;
    publish();
  };
  resetFrameTiming = () => {
    frameSamples = [];
    last = undefined;
    publish();
    paint();
  };
  reset();
  ready = true;
  function draw(now: number) {
    if (running && !document.hidden) {
      const interval = last === undefined ? 0 : now - last;
      last = now;
      carry += Math.min(interval / 1000, 0.1);
      const tickBefore = encounter.sim.ticks;
      const simStart = performance.now();
      while (carry >= STEP) {
        encounter.step();
        carry -= STEP;
      }
      const renderStart = performance.now();
      paint();
      const renderEnd = performance.now();
      if (interval > 0 && metrics && encounter.sim.ticks * 4 > metrics.warmup) {
        const tick = encounter.sim.ticks;
        frameSamples.push({
          tick,
          interval,
          steps: tick - tickBefore,
          simulation: renderStart - simStart,
          render: renderEnd - renderStart,
          fx: fxSubmission,
        });
        while (
          frameSamples.length &&
          (tick - frameSamples[0].tick) * 4 >= metrics.window
        )
          frameSamples.shift();
      }
      if (now - lastPublished >= 350) {
        publish();
        lastPublished = now;
      }
    }
    frame = requestAnimationFrame(draw);
  }
  const visibility = () => {
    last = undefined;
    carry = 0;
  };
  document.addEventListener("visibilitychange", visibility);
  frame = requestAnimationFrame(draw);
  return () => {
    document.removeEventListener("visibilitychange", visibility);
    cancelAnimationFrame(frame);
  };
});
</script>

<section class="bench" aria-label="Targeting bench" data-running={running}>
  <div class="controls">
    <label
      >Slot 1
      <select
        disabled={!ready}
        bind:value={
          () => slot1,
          (value) => {
  slot1 = value;
  reset();
}
        }
      >
        {#each weapons as id}
          <option value={id}>
            {PARTS[id].name}
          </option>
        {/each}
      </select>
    </label>
    <label
      >Slot 2
      <select
        disabled={!ready}
        bind:value={
          () => slot2,
          (value) => {
  slot2 = value;
  reset();
}
        }
      >
        {#each weapons as id}
          <option value={id}>
            {PARTS[id].name}
          </option>
        {/each}
      </select>
    </label>
    <label
      >Workload
      <select
        disabled={!ready}
        bind:value={
          () => mode,
          (value) => {
  mode = value;
  reset();
}
        }
      >
        <option value="sustained">Sustained fire</option>
        <option value="live">Live damage</option>
      </select>
    </label>
    <label>
      Formation
      <select
        disabled={!ready}
        bind:value={
          () => formation,
          (value) => {
            formation = value;
            reset();
          }
        }
      >
        <option value="three-loops">Three loops</option>
        <option value="held-approach">Held approach</option>
      </select>
    </label>
    <div class="playback">
      <button
        class="btn btn-normal"
        disabled={!ready}
        type="button"
        onclick={changePlayback}
      >
        {running ? "Pause" : "Resume"}
      </button>
      <button
        class="btn btn-ghost"
        disabled={!ready}
        type="button"
        onclick={reset}
      >
        Reset
      </button>
    </div>
  </div>

  <section class="body" aria-label="Targeting measurements">
    <div>
      <figure>
        <div class="stage">
          <FlightLayers
            bind:canvases
            label={formation === "held-approach"
              ? "Two moving Wasps on a held firing approach"
              : "Sixteen fitted Wasps flying on three neighboring loops"}
          />
        </div>
        <figcaption>
          <span
            >{mode === "sustained"
              ? "Hulls protected · power replenished"
              : "Live hull damage · finite power"}</span
          >
          <label for="target-traces"
            >Target traces
            <Switch
              id="target-traces"
              disabled={!ready}
              bind:checked={
                () => trace,
                (value) => {
  trace = value;
  resetFrameTiming();
}
              }
            />
          </label>
        </figcaption>
      </figure>
      <dl class="fleet" aria-label="Encounter">
        <div>
          <dt>Active Wasps</dt>
          <dd>{metrics?.ships ?? "—"}</dd>
        </div>
        <div>
          <dt>Active mounts</dt>
          <dd>{metrics?.mounts ?? "—"}</dd>
        </div>
        <div>
          <dt>Total discharges</dt>
          <dd>{metrics?.discharges ?? "—"}</dd>
        </div>
        <div>
          <dt>Flight time</dt>
          <dd>{elapsed.toFixed(1)} s</dd>
        </div>
      </dl>
      {#if slot1 === "plasma-rifle" || slot2 === "plasma-rifle"}
        <section class="roster" aria-label="Plasma lock intervals">
          <header>
            <h2>Plasma rifle</h2>
            <p>Per mount since reset · same target</p>
          </header>
          <dl>
            <div>
              <dt>Funded releases</dt>
              <dd>{metrics?.plasmaReleases ?? 0}</dd>
            </div>
            <div>
              <dt>Target-loss vents</dt>
              <dd>{metrics?.plasmaVents ?? 0}</dd>
            </div>
            <div>
              <dt>Completed &lt; 0.7 s</dt>
              <dd>{metrics?.plasmaIntervals.short ?? 0}</dd>
            </div>
            <div>
              <dt>Completed ≥ 0.7 s</dt>
              <dd>{metrics?.plasmaIntervals.sustained ?? 0}</dd>
            </div>
            <div>
              <dt>Already locked at start, since ended</dt>
              <dd>{metrics?.plasmaIntervals.initial ?? 0}</dd>
            </div>
            <div>
              <dt>Still locked</dt>
              <dd>{metrics?.plasmaIntervals.ongoing ?? 0}</dd>
            </div>
          </dl>
        </section>
      {/if}
      <section class="roster" aria-label="Shared roster construction">
        <header>
          <h2>Shared roster</h2>
          <p>Per fleet substep</p>
        </header>
        <dl>
          <div>
            <dt>Mean builds</dt>
            <dd>
              {metrics?.samples ? metrics.rosterBuildsMean.toFixed(2) : "—"}
            </dd>
          </div>
          <div>
            <dt>Mean ship adapters</dt>
            <dd>{metrics?.samples ? metrics.adaptersMean.toFixed(2) : "—"}</dd>
          </div>
          <div>
            <dt>Build p95 (ms)</dt>
            <dd>{metrics?.samples ? ms(metrics.rosterMs) : "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
    <aside aria-label="Performance timings">
      <h2>Acquisition work</h2>
      <p>Mean per fleet substep</p>
      <dl>
        <div>
          <dt>Body visits</dt>
          <dd>{metrics?.samples ? metrics.bodyVisitsMean.toFixed(2) : "—"}</dd>
        </div>
        <div>
          <dt>Comparisons</dt>
          <dd>{metrics?.samples ? metrics.comparisonsMean.toFixed(2) : "—"}</dd>
        </div>
      </dl>
      <details>
        <summary>Selection detail</summary>
        <dl>
          <div>
            <dt>Active requests</dt>
            <dd>
              {metrics?.samples ? metrics.activeRequestsMean.toFixed(2) : "—"}
            </dd>
          </div>
          <div>
            <dt>Material tests</dt>
            <dd>
              {metrics?.samples ? metrics.materialTestsMean.toFixed(2) : "—"}
            </dd>
          </div>
          <div>
            <dt>Visibility tests</dt>
            <dd>
              {metrics?.samples ? metrics.visibilityTestsMean.toFixed(2) : "—"}
            </dd>
          </div>
        </dl>
      </details>
      <h2>Combat substep</h2>
      <p>Fleet time · milliseconds</p>
      <dl>
        <div>
          <dt>Acquisition p95</dt>
          <dd>{metrics?.samples ? ms(metrics.acquisitionMs) : "—"}</dd>
        </div>
        <div>
          <dt>Acquisition mean</dt>
          <dd>{metrics?.samples ? ms(metrics.acquisitionMsMean) : "—"}</dd>
        </div>
        <div>
          <dt>Contact p95</dt>
          <dd>{metrics?.samples ? ms(metrics.contactMs) : "—"}</dd>
        </div>
        <div>
          <dt>Contact mean</dt>
          <dd>{metrics?.samples ? ms(metrics.contactMsMean) : "—"}</dd>
        </div>
        <div>
          <dt>Combat p95</dt>
          <dd>{metrics?.samples ? ms(metrics.combatMs) : "—"}</dd>
        </div>
      </dl>
      <h2>Simulation tick</h2>
      <p>p95 · milliseconds per tick</p>
      <dl>
        <div>
          <dt>Encounter preparation</dt>
          <dd>{metrics?.samples ? ms(metrics.adapterMs) : "—"}</dd>
        </div>
        <div>
          <dt>Engine plumes</dt>
          <dd>{metrics?.samples ? ms(metrics.plumeMs) : "—"}</dd>
        </div>
      </dl>
      <h2>Browser frame</h2>
      <p>p95 · milliseconds per callback</p>
      <dl>
        <div>
          <dt>Full simulation</dt>
          <dd>{frameCount ? ms(simulationP95) : "—"}</dd>
        </div>
        <div>
          <dt>Canvas submission</dt>
          <dd>{frameCount ? ms(renderP95) : "—"}</dd>
        </div>
        <div>
          <dt>↳ Persistent FX passes</dt>
          <dd>{frameCount ? ms(fxP95) : "—"}</dd>
        </div>
        <div>
          <dt>Frame interval p50</dt>
          <dd>{frameCount ? ms(frameP50) : "—"}</dd>
        </div>
        <div>
          <dt>Frame interval p95</dt>
          <dd>{frameCount ? ms(frameP95) : "—"}</dd>
        </div>
        <div>
          <dt>Ticks / frame (mean)</dt>
          <dd>{frameCount ? stepsMean.toFixed(2) : "—"}</dd>
        </div>
      </dl>
      {#if metrics}
        <p class="sample">
          {metrics.samples}/{metrics.window}
          substeps · {frameCount} frames<br>
          {metrics.warmup}
          warm-up substeps. Zero can indicate idle work or browser timer
          precision.
        </p>
        <details>
          <summary>Timing scopes</summary>
          <p>
            Each tick advances four combat substeps. Full simulation includes
            all ticks processed in the callback and the encounter setup for
            each. Encounter preparation includes scripted motion, power, the
            shared roster build and sampling overhead. Body visits count how
            often selectors examine candidates after roster construction.
            Persistent FX passes are part of Canvas submission. Frame intervals
            include browser scheduling; Canvas submission times end before
            asynchronous raster and compositing finish. FX passes include plume
            and weapon light.
          </p>
        </details>
      {/if}
    </aside>
  </section>
</section>

<style>
.bench {
  padding: var(--spacing-lg);
  display: grid;
  gap: var(--spacing-md);
}
.controls,
.playback,
figcaption,
figcaption label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.controls {
  flex-wrap: wrap;
  align-items: end;
  gap: var(--spacing-md);
}
.controls label {
  display: grid;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
select {
  font: inherit;
  font-size: var(--font-size-label);
  color: var(--color-text);
  background: var(--color-elev-2);
  border: 1px solid var(--color-border);
  padding: var(--spacing-xs) var(--spacing-sm);
  min-height: var(--button-min-height);
}
.playback {
  margin-left: auto;
}
.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16.2rem;
  align-items: start;
  gap: var(--spacing-md);
}
figure {
  margin: 0;
}
.stage {
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border);
}
.stage :global(.flight-layers) {
  height: 100%;
  width: 100%;
}
figcaption {
  flex-wrap: wrap;
  justify-content: space-between;
  padding-top: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
summary {
  cursor: pointer;
}
aside {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  background: var(--color-elev-1);
  font-size: var(--font-size-caption);
}
h2 {
  margin: 0;
  font-size: var(--font-size-label);
  color: var(--color-text);
}
aside p {
  color: var(--color-text-muted);
  margin: var(--spacing-xs) 0;
}
dl {
  margin: var(--spacing-sm) 0 0;
}
dl + h2,
.sample {
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-xs);
  padding: 0.07rem 0;
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.fleet {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
}
.fleet div {
  justify-content: start;
  align-items: baseline;
  gap: var(--spacing-xs);
}
.fleet dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.fleet dd {
  font-size: var(--font-size-label);
}
.roster {
  display: grid;
  grid-template-columns: 1fr 3fr;
  align-items: start;
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
}
.roster dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}
.roster dl div {
  justify-content: start;
  align-items: baseline;
  gap: var(--spacing-xs);
}
.roster p,
.roster dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  margin: 0;
}
.roster dd {
  font-size: var(--font-size-label);
}
</style>
