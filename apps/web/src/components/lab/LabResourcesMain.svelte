<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
  $props();

import {
  COLOR,
  canvasFont,
  drawDeathIcon,
  drawResourceBar,
} from "@void-drift/core";
import Canvas from "../Canvas.svelte";
import { resourcesParams } from "./resources-state.svelte";

function drawHullBar(ctx: CanvasRenderingContext2D) {
  drawResourceBar(ctx, 0, 0, 200, 24, {
    value: resourcesParams.hullValue,
    maxValue: 100,
    label: "HULL",
    colorNormal: COLOR.resourceHull,
    colorWarning: COLOR.resourceWarning,
    colorDanger: COLOR.resourceDanger,
  });
}

function drawFuelBar(ctx: CanvasRenderingContext2D) {
  drawResourceBar(ctx, 0, 0, 200, 24, {
    value: resourcesParams.fuelValue,
    maxValue: 100,
    label: "FUEL",
    colorNormal: COLOR.resourcePower,
    colorWarning: COLOR.resourceWarning,
    colorDanger: COLOR.resourceDanger,
  });
}

function drawIcons(ctx: CanvasRenderingContext2D) {
  const spacing = 50;
  const startX = 30;
  drawDeathIcon(ctx, startX, 40, 32, "STAR");
  drawDeathIcon(ctx, startX + spacing, 40, 32, "HULL");
  drawDeathIcon(ctx, startX + spacing * 2, 40, 32, "POWER");

  ctx.fillStyle = COLOR.textMuted;
  ctx.font = canvasFont(10);
  ctx.textAlign = "center";
  ctx.fillText("STAR", startX, 70);
  ctx.fillText("HULL", startX + spacing, 70);
  ctx.fillText("POWER", startX + spacing * 2, 70);
}
</script>

<div class="stage-content">
  <div class="hud-preview">
    <section>
      <h3>Resource Bars</h3>
      <div class="row">
        <Canvas width={200} height={24} draw={drawHullBar} />
        <div class="meta">{resourcesParams.hullValue}%</div>
      </div>
      <div class="row">
        <Canvas width={200} height={24} draw={drawFuelBar} />
        <div class="meta">{resourcesParams.fuelValue}%</div>
      </div>
    </section>

    <section>
      <h3>Death Icons</h3>
      <Canvas width={200} height={80} draw={drawIcons} />
    </section>

    <section>
      <h3>Timer Display</h3>
      <div class="timer-examples">
        <span class="timer">0.0s</span>
        <span class="timer">42.3s</span>
        <span class="timer">142.3s</span>
      </div>
    </section>
  </div>
</div>

<style>
.stage-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: 1;
  background-image:
    linear-gradient(var(--color-border-faint) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border-faint) 1px, transparent 1px);
  background-size: 20px 20px;
}

.hud-preview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: var(--color-glass);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

h3 {
  margin: 0 0 1rem 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-faint);
  padding-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.meta {
  font-family: var(--font-family-ui);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.timer-examples {
  display: flex;
  gap: 1rem;
}

.timer {
  font-size: 1rem;
  color: var(--color-text);
  font-family: var(--font-family-ui);
  padding: 0.25rem 0.5rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
</style>
