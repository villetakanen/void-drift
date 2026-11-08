<script lang="ts">
import { FxBench, STEP } from "@void-drift/mode-a";
import { onMount } from "svelte";

let { label = "Arcade FX instrument" }: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let weapons = $state(false);
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
  samples = $state(0);
let reset = () => {},
  burst = () => {};
let toggleWeapons = () => {};
onMount(() => {
  movingCamera = new URL(location.href).searchParams.get("camera") === "moving";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const bench = new FxBench();
  weapons = new URL(location.href).searchParams.get("weapons") === "1";
  bench.weapons = weapons;
  bench.reset();
  let last = performance.now(),
    carry = 0,
    frame = 0;
  const costs: number[] = [],
    intervals: number[] = [];
  reset = () => {
    bench.reset();
    carry = 0;
    costs.length = intervals.length = 0;
    samples = 0;
  };
  burst = () => bench.burst();
  toggleWeapons = () => {
    weapons = !weapons;
    bench.weapons = weapons;
    reset();
  };
  const draw = (now: number) => {
    const elapsed = now - last;
    last = now;
    bench.overload = overload;
    bench.enabled = enabled;
    const start = performance.now();
    if (running) {
      carry += Math.min(0.1, elapsed / 1000);
      while (carry >= STEP) {
        bench.step();
        carry -= STEP;
      }
    } else carry = 0;
    const update = performance.now() - start;
    ctx.save();
    if (movingCamera) {
      const time = bench.ticks * STEP;
      const zoom = 1.03 + 0.03 * Math.sin(time * 0.7);
      ctx.translate(960, 540);
      ctx.scale(zoom, zoom);
      ctx.translate(
        -960 + 40 * Math.sin(time * 0.9),
        -540 + 25 * Math.sin(time * 0.7),
      );
    }
    bench.drawWorld(ctx);
    const before = performance.now();
    bench.drawFx(ctx);
    const after = performance.now();
    ctx.restore();
    if (running) {
      costs.push(update + after - before);
      intervals.push(elapsed);
      samples++;
      if (costs.length > 600) {
        costs.shift();
        intervals.shift();
      }
      if (samples % 30 === 0) {
        const sorted = costs.toSorted((a, b) => a - b),
          frames = intervals.toSorted((a, b) => a - b);
        p50 = sorted[Math.floor(sorted.length * 0.5)];
        p95 = sorted[Math.floor(sorted.length * 0.95)];
        max = sorted[sorted.length - 1];
        frame50 = frames[Math.floor(frames.length * 0.5)];
        frame95 = frames[Math.floor(frames.length * 0.95)];
        frameMax = frames[frames.length - 1];
      }
    }
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
</script>
<section
  class="fx-bench"
  aria-label={label}
  data-ticks={ticks}
  data-weapons={weapons}
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
>
  <div class="controls">
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={weapons}
      onclick={() => toggleWeapons()}
    >
      Weapons {weapons ? "on" : "off"}
    </button>
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
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={enabled}
      onclick={() => (enabled = !enabled)}
    >
      FX {enabled ? "on" : "off"}
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={movingCamera}
      onclick={() => (movingCamera = !movingCamera)}
    >
      Camera {movingCamera ? "moving" : "fixed"}
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={overload}
      onclick={() => (overload = !overload)}
    >
      Overload {overload ? "on" : "off"}
    </button>
  </div>
  <canvas
    bind:this={canvas}
    width="1920"
    height="1080"
    aria-label="Six ships with engine and gravity effects, station arcs, missile trails and fire sparks"
  ></canvas>
  <p>
    6 ships · 24 main engines · 12 collectors · 2 stations · 16 missiles · 12
    fires
  </p>
  <p>
    Update + FX submission: {p50.toFixed(2)} ms median · {p95.toFixed(2)} ms p95
    · {max.toFixed(2)} ms max. Frame p95: {frame95.toFixed(2)} ms.
  </p>
  <p>
    {essential}
    activation cues · {marks}/1024 decorative marks · {particles}/256 sparks ·
    {dropped}
    dropped requests.
  </p>
  <p class="note">
    Six independent flight simulations, repeating every eight seconds with local
    lane wraps to keep every ship in view. This fixture isolates planetary
    collection from the central star. Station, missile and fire activity
    demonstrates shared effects; it does not add combat gameplay. Timing
    includes simulation updates and FX submission; browser raster/compositing
    needs separate profiling.
  </p>
</section>
<style>
.fx-bench {
  width: 100%;
  padding: var(--spacing-lg);
  box-sizing: border-box;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
canvas {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--color-border);
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
