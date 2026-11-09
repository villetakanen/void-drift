<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { createDraftPainter } from "../derelict-draft-two/renderer";
import { studyStarterWasp } from "../starter-wasp-fixture";

let { label = "Controlled derelict comparison" }: { label?: string } = $props();
let canvas: HTMLCanvasElement;
const sizes = [100, 110, 120] as const;
let phase = $state(0);
let glow = $state(true);
let paint = () => {};
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const painter = createDraftPainter();
  const wasp = studyStarterWasp();
  const fiddler = starterLoadout("fiddler");
  const fx = new FxSurface();
  const scratch = document.createElement("canvas");
  scratch.width = 1080;
  scratch.height = 360;
  const light = scratch.getContext("2d");
  paint = () => {
    if (!light) return;
    canvas.width = 1080;
    canvas.height = 360;
    ctx.clearRect(0, 0, 1080, 360);

    const at = (target: CanvasRenderingContext2D, i: number) => {
      target.translate(i * 360 + 265, 180);
      target.scale((1.6 * sizes[i]) / 140, (1.6 * sizes[i]) / 140);
      target.translate(-101, -150);
    };
    for (let i = 0; i < sizes.length; i++) {
      drawBuild(
        ctx,
        wasp,
        i * 360 + 55,
        180,
        -Math.PI / 2,
        BUILD_FLIGHT_SCALE * 1.6,
      );
      drawBuild(
        ctx,
        fiddler,
        i * 360 + 145,
        180,
        -Math.PI / 2,
        BUILD_FLIGHT_SCALE * 1.6,
      );
      ctx.save();
      at(ctx, i);
      painter.hull(ctx);
      painter.core(ctx, phase);
      ctx.restore();
    }
    fx.clear();
    const emit = (
      target: CanvasRenderingContext2D,
      pass: import("@void-drift/core").FxPass,
    ) => {
      if (!glow) return;
      for (let i = 0; i < sizes.length; i++) {
        target.save();
        at(target, i);
        painter.light(target, pass, phase);
        target.restore();
      }
    };
    for (let tick = 1; tick <= 30; tick++) fx.draw(light, tick / 60, emit);
    fx.draw(ctx, 0.5, emit);
    for (let i = 0; i < sizes.length; i++) {
      ctx.save();
      at(ctx, i);
      painter.aperture(ctx, phase);
      ctx.restore();
    }
  };
  paint();
});
$effect(() => {
  void phase;
  void glow;
  paint();
});
</script>
<div class="controls">
  <label
    >Energy phase
    <input
      aria-label="Energy phase"
      type="range"
      min="0"
      max="12"
      step="0.1"
      bind:value={phase}
    ></label
  >
  <button
    class="btn"
    type="button"
    aria-pressed={glow}
    onclick={() => (glow = !glow)}
  >
    Outer glow {glow ? "on" : "off"}
  </button>
</div>
<div class="headings">
  {#each sizes as size}
    <strong>{size} world units</strong>
  {/each}
</div>
<div class="plate"><canvas bind:this={canvas} aria-label={label}></canvas></div>
<div class="headings">
  {#each sizes as _size}
    <span>Wasp · Fiddler · Derelict</span>
  {/each}
</div>
<p>
  All three: identical fitted Wasp and Fiddler, viewing scale ×1.60, heading,
  material colours and energy phase. Only derelict extent changes.
</p>
<style>
.controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
label {
  display: grid;
  gap: var(--spacing-sm);
}
input {
  accent-color: var(--color-action);
  width: 240px;
}
.headings {
  display: grid;
  grid-template-columns: repeat(3, 360px);
  font-family: var(--font-family-ui);
  padding-block: var(--spacing-md);
}
.plate {
  width: 1080px;
  background: var(--color-void);
}
canvas {
  display: block;
  width: 1080px;
  height: 360px;
  max-width: none;
}
</style>
