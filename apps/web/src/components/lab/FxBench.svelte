<script lang="ts">
import {
  clearFlightLayer,
  FLIGHT_LAYERS,
  type FlightLayerCanvases,
  FX_WORKLOADS,
  FxBench,
  type FxWorkload,
  presentFlightFx,
  STEP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";
import SegmentedControl from "../inputs/SegmentedControl.svelte";
import Switch from "../inputs/Switch.svelte";

let { label = "Arcade FX instrument" }: { label?: string } = $props();
const WIDTH = 1920;
const HEIGHT = 1080;
let canvases = $state<FlightLayerCanvases>({});
const workloads = Object.keys(FX_WORKLOADS) as FxWorkload[];
let workload = $state<FxWorkload>("baseline");
let running = $state(true),
  enabled = $state(true),
  overload = $state(false),
  movingCamera = $state(false);
let ticks = $state(0),
  marks = $state(0),
  essential = $state(0),
  dropped = $state(0),
  particles = $state(0);
let p50 = $state(0),
  p95 = $state(0),
  max = $state(0),
  frame50 = $state(0),
  frame95 = $state(0),
  frameMax = $state(0),
  frameStalls = $state(0),
  samples = $state(0);
let ignitions = $state(0),
  ignitionSamples = $state(0),
  ignitionP95 = $state(0),
  ignitionFrame95 = $state(0);
let reset = () => {},
  burst = () => {},
  setWorkload = (_label: string) => {};
onMount(() => {
  const params = new URL(location.href).searchParams;
  movingCamera = params.get("camera") === "moving";
  workload =
    workloads.find((key) => key === params.get("workload")) ??
    (params.get("weapons") === "1" ? "weapons" : "baseline");
  const world = canvases.world?.getContext("2d");
  const fx = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) return;
  for (const layer of FLIGHT_LAYERS) {
    const canvas = canvases[layer.id];
    if (!canvas) return;
    canvas.width = WIDTH * layer.resolution;
    canvas.height = HEIGHT * layer.resolution;
  }
  const bench = new FxBench(workload);
  let last = performance.now(),
    carry = 0,
    frame = 0,
    previousIgnition = false;
  const window: {
    cost: number;
    interval: number;
    ignition: boolean;
    afterIgnition: boolean;
  }[] = [];
  const quantile = (values: number[], q: number) =>
    values[Math.min(values.length - 1, Math.floor(values.length * q))] ?? 0;
  reset = () => {
    bench.reset(workload);
    last = performance.now();
    carry = 0;
    previousIgnition = false;
    window.length = 0;
    samples = p50 = p95 = max = frame50 = frame95 = frameMax = frameStalls = 0;
    ignitions = ignitionSamples = ignitionP95 = ignitionFrame95 = 0;
  };
  burst = () => bench.burst();
  setWorkload = (label) => {
    const next = workloads.find((key) => FX_WORKLOADS[key] === label);
    if (!next || next === workload) return;
    workload = next;
    reset();
  };
  const draw = (now: number) => {
    const elapsed = now - last;
    last = now;
    bench.overload = overload;
    bench.enabled = enabled;
    let fired = 0;
    const start = performance.now();
    if (running) {
      carry += Math.min(0.1, elapsed / 1000);
      while (carry >= STEP) {
        bench.step();
        fired += bench.ignitionCount;
        carry -= STEP;
      }
    } else carry = 0;
    const update = performance.now() - start;
    const time = bench.ticks * STEP;
    const zoom = 1.03 + 0.03 * Math.sin(time * 0.7);
    for (const ctx of [world, fx, lfx]) {
      clearFlightLayer(ctx);
      ctx.save();
      if (movingCamera) {
        ctx.translate(WIDTH / 2, HEIGHT / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(
          -WIDTH / 2 + 40 * Math.sin(time * 0.9),
          -HEIGHT / 2 + 25 * Math.sin(time * 0.7),
        );
      }
    }
    bench.drawWorld(world);
    const before = performance.now();
    bench.drawFx(fx);
    presentFlightFx(fx.canvas, canvases.fxGlow);
    bench.drawLfx(lfx);
    const after = performance.now();
    world.restore();
    fx.restore();
    lfx.restore();
    if (running) {
      window.push({
        cost: update + after - before,
        interval: elapsed,
        ignition: fired > 0,
        afterIgnition: previousIgnition,
      });
      ignitions += fired;
      samples++;
      if (window.length > 600) window.shift();
      if (samples % 30 === 0) {
        const costs = window.map(({ cost }) => cost).sort((a, b) => a - b);
        const frames = window
          .map(({ interval }) => interval)
          .sort((a, b) => a - b);
        const ignitionFrames = window.filter(({ ignition }) => ignition);
        p50 = quantile(costs, 0.5);
        p95 = quantile(costs, 0.95);
        max = quantile(costs, 1);
        frame50 = quantile(frames, 0.5);
        frame95 = quantile(frames, 0.95);
        frameMax = quantile(frames, 1);
        frameStalls = frames.filter((interval) => interval > 33.34).length;
        ignitionSamples = ignitionFrames.length;
        ignitionP95 = quantile(
          ignitionFrames.map(({ cost }) => cost).sort((a, b) => a - b),
          0.95,
        );
        ignitionFrame95 = quantile(
          window
            .filter(({ afterIgnition }) => afterIgnition)
            .map(({ interval }) => interval)
            .sort((a, b) => a - b),
          0.95,
        );
      }
    }
    previousIgnition = fired > 0;
    ticks = bench.ticks;
    marks = bench.fx.pass.budget.decoration;
    essential = bench.fx.pass.budget.essential;
    dropped = bench.fx.pass.budget.dropped;
    particles = bench.sparks.count;
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
});
const controlId = $props.id();
</script>
<section
  class="fx-bench"
  aria-label={label}
  data-ticks={ticks}
  data-workload={workload}
  data-weapons={workload === "weapons"}
  data-ignitions={ignitions}
  data-ignition-samples={ignitionSamples}
  data-ignition-p95={ignitionP95}
  data-ignition-frame-p95={ignitionFrame95}
  data-camera={movingCamera ? "moving" : "fixed"}
  data-marks={marks}
  data-essential={essential}
  data-dropped={dropped}
  data-particles={particles}
  data-samples={samples}
  data-p50={p50}
  data-p95={p95}
  data-max={max}
  data-frame-p50={frame50}
  data-frame-max={frameMax}
  data-frame-p95={frame95}
  data-frame-stalls={frameStalls}
>
  <div class="controls">
    <SegmentedControl
      label="FX workload"
      options={Object.values(FX_WORKLOADS)}
      bind:value={() => FX_WORKLOADS[workload], (value) => setWorkload(value)}
    />
    <button
      type="button"
      class="btn btn-primary"
      onclick={() => (running = !running)}
    >
      {running ? "Pause" : "Run"}
    </button>
    <button type="button" class="btn btn-ghost" onclick={() => reset()}>
      Reset scene
    </button>
    <button type="button" class="btn btn-ghost" onclick={() => burst()}>
      Burst
    </button>
    <label for={`${controlId}-1`} class="setting"
      >FX <Switch id={`${controlId}-1`} bind:checked={enabled} /></label
    >
    <label for={`${controlId}-2`} class="setting"
      >Moving camera
      <Switch id={`${controlId}-2`} bind:checked={movingCamera} /></label
    >
    <label for={`${controlId}-3`} class="setting"
      >Overload <Switch id={`${controlId}-3`} bind:checked={overload} /></label
    >
  </div>
  <div class="stage">
    <FlightLayers
      bind:canvases
      label="Six ships with engine and gravity effects, station arcs, missile trails and fire sparks"
    />
  </div>
  <p>
    6 ships ·
    {workload === "weapons"
      ? "16 main engines · 8 aft cannon mounts · 8 collectors"
      : "24 main engines · 12 collectors"}
    · 2 stations · 16 missiles · 12 fires
  </p>
  <p>
    {#if workload === "baseline"}
      Ion and Plasma with no weapons.
    {:else if workload === "mixed"}
      Each hull burns Ion and Plasma alongside one Fission nozzle.
    {:else if workload === "fission-heavy"}
      Four hulls synchronize up to 16 Fission nozzles beside Ion and Plasma.
    {:else}
      Alternating lasers and twin cannons, with point-defence turrets and
      collectors.
    {/if}
  </p>
  <p>
    Update + FX submission: {p50.toFixed(2)} ms median · {p95.toFixed(2)} ms p95
    · {max.toFixed(2)} ms max. Frame interval: {frame50.toFixed(2)} ms median ·
    {frame95.toFixed(2)}
    ms p95 · {frameMax.toFixed(2)} ms max · {frameStalls} over 33.34 ms.
  </p>
  {#if workload === "mixed" || workload === "fission-heavy"}
    <p>
      Ignition frames: {ignitionSamples} in the rolling window ·
      {ignitionP95.toFixed(2)}
      ms update + submission p95 ·
      {ignitionFrame95.toFixed(2)}
      ms following frame interval p95.
    </p>
  {/if}
  <p>
    {essential}
    activation cues · {marks}/1024 decorative marks · {particles}/256 sparks ·
    {dropped}
    dropped requests.
  </p>
  <p class="note">
    Six independent flight simulations, repeating every eight seconds with local
    lane wraps to keep every ship in view. This fixture isolates planetary
    collection from the central star. Station, missile and fire activity adds
    shared effects without adding combat gameplay. Weapons is a separate run
    with alternating fragment targets and refreshed ship resources to sustain
    firing. Timing summarizes up to 600 frames and includes simulation updates
    and FX submission, not browser raster or compositing. An ignition frame
    advanced at least one paid ignition; the interval ends at the next callback.
  </p>
</section>
<style>
.fx-bench {
  width: 100%;
  padding: var(--spacing-lg);
  box-sizing: border-box;
}
.setting {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.stage {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.stage :global(.flight-layers) {
  height: 100%;
}
p {
  font: var(--font-small) var(--font-flight);
  margin-top: var(--spacing-md);
}
.note {
  color: var(--color-text-muted);
  max-width: 85ch;
}
</style>
