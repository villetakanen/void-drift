<script lang="ts">
import { Camera, COLOR, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerId,
  PARTS,
  resizeFlightLayers,
  STEP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";
import Switch from "../inputs/Switch.svelte";
import { percentile } from "./render-performance-metrics";
import {
  TARGETING_CENTER,
  TARGETING_RADIUS,
  TargetingBench,
  type TargetingConfig,
  type TargetingSummary,
  type TargetingWeapon,
} from "./targeting-bench";

const WIDTH = 1024;
const HEIGHT = 768;
const weapons: TargetingWeapon[] = [
  "light-ion-cannon",
  "ion-point-defence",
  "laser",
];
let slot1 = $state<TargetingWeapon>("light-ion-cannon");
let slot2 = $state<TargetingWeapon>("ion-point-defence");
let mode = $state<TargetingConfig["mode"]>("sustained");
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let ready = $state(false);
let running = $state(true);
let trace = $state(false);
let metrics = $state<TargetingSummary>();
let elapsed = $state(0);
let frameP95 = $state(0);
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
  camera.pos.set(TARGETING_CENTER.x, TARGETING_CENTER.y);
  camera.zoom = HEIGHT / (2 * (TARGETING_RADIUS + 54));
  const fx = new FlightFx();
  resizeFlightLayers(layers, renderer, WIDTH, HEIGHT);
  let encounter: TargetingBench;
  let frame = 0;
  let last: number | undefined;
  let carry = 0;
  let lastPublished = 0;
  let frameSamples: { tick: number; interval: number }[] = [];

  function publish() {
    metrics = encounter.metrics;
    elapsed = encounter.sim.ticks * STEP;
    frameCount = frameSamples.length;
    frameP95 = percentile(
      frameSamples.map((sample) => sample.interval),
      0.95,
    );
  }
  function paint() {
    drawFlightFrame({ layers, renderer, camera, sim: encounter.sim, fx });
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
    encounter = new TargetingBench({ slot1, slot2, mode });
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
      while (carry >= STEP) {
        encounter.step();
        carry -= STEP;
      }
      paint();
      if (interval > 0 && metrics && encounter.sim.ticks * 4 > metrics.warmup) {
        const tick = encounter.sim.ticks;
        frameSamples.push({ tick, interval });
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
          <option value={id}>{PARTS[id].name}</option>
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
          <option value={id}>{PARTS[id].name}</option>
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

  <div class="body">
    <figure>
      <div class="stage">
        <FlightLayers
          bind:canvases
          label="Sixteen fitted Wasps flying in a circle"
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
    <aside aria-label="Targeting measurements">
      <h2>Encounter</h2>
      <dl>
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
      <h2>Acquisition work</h2>
      <p>Fleet mean per combat substep</p>
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
      <h2>Timing</h2>
      <p>p95 · milliseconds</p>
      <dl>
        <div>
          <dt>Acquisition / substep</dt>
          <dd>{metrics?.samples ? ms(metrics.acquisitionMs) : "—"}</dd>
        </div>
        <div>
          <dt>Contact / substep</dt>
          <dd>{metrics?.samples ? ms(metrics.contactMs) : "—"}</dd>
        </div>
        <div>
          <dt>Combat / substep</dt>
          <dd>{metrics?.samples ? ms(metrics.combatMs) : "—"}</dd>
        </div>
        <div>
          <dt>Frame interval</dt>
          <dd>{frameCount ? ms(frameP95) : "—"}</dd>
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
      {/if}
    </aside>
  </div>
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
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-subtle);
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-xs);
  padding: 0.14rem 0;
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
</style>
