<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { createDraftPainter } from "./renderer";

let {
  label = "Derelict draft two",
  comparison = false,
}: { label?: string; comparison?: boolean } = $props();
let canvas: HTMLCanvasElement;
let paused = $state(false);
let emitting = $state(true);
let reset = () => {};
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const painter = createDraftPainter();
  const surface = new FxSurface();
  let time = 0;
  let previous = performance.now();
  let frame = 0;
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  reset = () => {
    time = 0;
    surface.clear();
  };
  const ship = starterLoadout("wasp");
  const views = comparison
    ? [
        { x: 150, y: 295, length: 120 },
        { x: 450, y: 295, length: 240 },
        { x: 750, y: 295, length: 420 },
      ]
    : [
        { x: 255, y: 295, length: 520 },
        { x: 620, y: 185, length: 180 },
        { x: 620, y: 385, length: 72 },
        { x: 790, y: 385, length: 36 },
      ];
  function transform(
    target: CanvasRenderingContext2D,
    view: (typeof views)[number],
  ) {
    target.translate(view.x, view.y);
    target.scale(view.length / 140, view.length / 140);
    target.translate(-101, -150);
  }
  function draw(now: number) {
    if (!ctx) return;
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!paused && !document.hidden) time += dt;
    const dpr = Math.min(devicePixelRatio, 2);
    if (canvas.width !== Math.round(960 * dpr)) {
      canvas.width = Math.round(960 * dpr);
      canvas.height = Math.round(600 * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 960, 600);
    for (const view of views) {
      ctx.save();
      transform(ctx, view);
      painter.hull(ctx);
      painter.core(ctx, time);
      ctx.restore();
    }
    if (comparison) {
      for (const view of views) {
        drawBuild(
          ctx,
          ship,
          view.x + view.length * 0.19 + 38,
          view.y,
          -Math.PI / 2,
          BUILD_FLIGHT_SCALE,
        );
      }
    }
    surface.draw(ctx, time, (light, pass) => {
      if (!emitting) return;
      for (const view of views) {
        light.save();
        transform(light, view);
        painter.light(light, pass, time);
        light.restore();
      }
    });
    for (const view of views) {
      ctx.save();
      transform(ctx, view);
      painter.aperture(ctx, time);
      ctx.restore();
    }
    ctx.fillStyle = "#aaa";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    for (const view of views)
      ctx.fillText(`${view.length} px`, view.x, view.y + view.length / 2 + 28);
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
});
</script>

<div class="controls">
  <button class="btn" type="button" onclick={() => (paused = !paused)}>
    {paused ? "Resume" : "Pause"}
  </button>
  <button
    class="btn"
    type="button"
    aria-pressed={emitting}
    onclick={() => (emitting = !emitting)}
  >
    Glow {emitting ? "on" : "off"}
  </button>
  <button class="btn" type="button" onclick={() => reset()}>Reset</button>
</div>
<canvas
  bind:this={canvas}
  aria-label={comparison
    ? "Three derelicts, 120, 240 and 420 pixels long, each beside the same production Wasp at flight scale"
    : `${label}: Canvas translation at 520, 180, 72 and 36 pixels long, with an independently rotating luminous square`}
></canvas>
<style>
.controls {
  display: flex;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
canvas {
  display: block;
  width: 960px;
  max-width: 100%;
  height: auto;
}
</style>
