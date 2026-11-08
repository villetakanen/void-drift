<script lang="ts">
import { drawBuild, drawScoutGlass, starterLoadout } from "@void-drift/mode-a";

let { label = "Scout approved dome" }: { label?: string } = $props();
let canvas = $state<HTMLCanvasElement>();
let angle = $state(-70);
let reflection = $state(true);
let reflectionAngle = $state(-30);
let gold = $state(true);
$effect(() => {
  const target = canvas;
  const gradientAngle = angle;
  const useGold = gold;
  const useReflection = reflection;
  const edgeAngle = reflectionAngle;
  if (!target) return;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  target.width = 420 * dpr;
  target.height = 470 * dpr;
  ctx.scale(dpr, dpr);
  const build = starterLoadout("scout");
  for (const [x, y, scale] of [
    [210, 200, 4],
    [210, 400, 0.65],
  ] as const) {
    drawBuild(
      ctx,
      build,
      x,
      y,
      -Math.PI / 2,
      scale,
      "",
      undefined,
      undefined,
      undefined,
      false,
    );
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(scale, scale);
    drawScoutGlass(ctx, gradientAngle, edgeAngle, useGold, useReflection);
    ctx.restore();
  }
});
</script>
<div class="controls">
  <label for="glass-angle">Gradient direction · {angle}°</label>
  <input
    id="glass-angle"
    type="range"
    min="-180"
    max="180"
    step="1"
    bind:value={angle}
  >
  <label><input type="checkbox" bind:checked={gold}> Gold cockpit border</label>
  <label
    ><input type="checkbox" bind:checked={reflection}>
    Crisp reflection over glass and border</label
  >
  <label for="reflection-angle"
    >Reflection edge direction · {reflectionAngle}°</label
  >
  <input
    id="reflection-angle"
    type="range"
    min="-180"
    max="180"
    step="1"
    bind:value={reflectionAngle}
  >
  <button
    type="button"
    onclick={() => {
      angle = -70;
      reflectionAngle = -30;
      reflection = true;
      gold = true;
    }}
  >
    Reset treatment
  </button>
</div>
<canvas bind:this={canvas} aria-label={label}></canvas>
<p class="caption">
  Top: 4× inspection. Bottom: 0.65 flight scale. The controls independently
  rotate the gradient and reflection edge around the cockpit centre; the ship
  stays still. Gold uses the existing collar width.
</p>
<style>
.controls {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 420px;
}
input[type="range"] {
  width: 100%;
  accent-color: var(--color-action);
}
button {
  padding: var(--spacing-sm);
  color: var(--color-text);
  background: var(--color-void);
  border: 1px solid var(--color-border);
  cursor: pointer;
}
canvas {
  display: block;
  width: 420px;
  height: 470px;
  max-width: 100%;
  object-fit: contain;
}
.caption {
  color: var(--color-text-muted);
}
</style>
