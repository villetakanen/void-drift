<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

import { drawStar, drawSunFields } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildStats,
  defaultLoadout,
  drawBuild,
  gameSettings,
  Simulation,
  STEP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";
import RingSlider from "../inputs/RingSlider.svelte";

const loadout = defaultLoadout("wasp");
let sim = new Simulation({
  ...gameSettings("wasp"),
  loadout,
  encounters: false,
});
let canvas: HTMLCanvasElement;
let ready = $state(false);
let distance = $state(180),
  initialPower = $state(50),
  powered = $state(false),
  running = $state(false),
  zoom = $state(0.8);
let power = $state(50),
  hull = $state(100),
  collection = $state(0),
  damage = $state(0),
  status = $state("PLAYING");
const capacity = buildStats(loadout).capacity;
function reset() {
  sim = new Simulation({ ...gameSettings("wasp"), loadout, encounters: false });
  sim.planets.length = 0;
  sim.ship.pos.set(
    sim.star.pos.x + (Number.isFinite(distance) ? distance : 180),
    sim.star.pos.y,
  );
  sim.state.resources.power = Math.max(
    0,
    Math.min(capacity, Number.isFinite(initialPower) ? initialPower : 50),
  );
  sim.start();
  power = sim.state.resources.power;
  hull = 100;
  collection = 0;
  damage = 0;
  status = "PLAYING";
  running = false;
}
onMount(() => {
  ready = true;
  reset();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let frame = 0,
    last = 0,
    accumulated = 0;
  const draw = (now: number) => {
    if (running && last) {
      accumulated += Math.min(0.05, (now - last) / 1000);
      while (accumulated >= STEP) {
        sim.step({
          leftThruster: powered,
          rightThruster: powered,
          fire: false,
        });
        accumulated -= STEP;
      }
      power = sim.state.resources.power;
      hull = sim.state.resources.hull;
      collection = sim.solarCollectionRate;
      damage = sim.solarDamageRate;
      status = sim.state.status;
      if (status !== "PLAYING") running = false;
    } else accumulated = 0;
    last = now;
    const width = canvas.clientWidth,
      height = 560,
      dpr = window.devicePixelRatio || 1;
    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== height * dpr
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-sim.star.pos.x, -sim.star.pos.y);
    drawStar(ctx, {
      x: sim.star.pos.x,
      y: sim.star.pos.y,
      radius: sim.star.radius,
      color: sim.star.color,
      glowColor: sim.star.glowColor,
      time: sim.ticks * STEP * 1000,
    });
    drawSunFields(ctx, sim.star, {
      collecting: collection > 0,
      damaging: damage > 0,
    });
    drawBuild(
      ctx,
      loadout,
      sim.ship.pos.x,
      sim.ship.pos.y,
      sim.ship.rotation,
      BUILD_FLIGHT_SCALE,
    );
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
});
</script>
<div
  class="bench"
  data-ready={ready}
  data-collection={collection}
  data-damage={damage}
  data-power={power}
  data-hull={hull}
  data-status={status}
>
  <canvas
    bind:this={canvas}
    aria-label="Live standard Sun and Wasp simulation"
  ></canvas>
  <div class="controls">
    <label
      >Start distance (u)<input
        aria-label="Start distance"
        type="number"
        min="36"
        max="500"
        bind:value={distance}
      ></label
    >
    <label
      >Starting energy (E)<input
        aria-label="Starting energy"
        type="number"
        min="0"
        max={capacity}
        bind:value={initialPower}
      ></label
    >
    <div class="zoom">
      <RingSlider
        label="Sun zoom"
        bind:value={zoom}
        min={0.35}
        max={1.6}
        step={0.05}
        digits={2}
      />
    </div>
    <label><input type="checkbox" bind:checked={powered}> Both thrusters</label>
    <button class="btn btn-ghost" type="button" onclick={reset}>
      Reset flight
    </button>
    <button
      class="btn btn-ghost"
      type="button"
      onclick={() => (running = !running)}
    >
      {running ? "Pause flight" : "Run flight"}
    </button>
  </div>
  <p aria-live="off" data-sun-readout>
    Battery {power.toFixed(2)} / {capacity} E · Hull {hull.toFixed(2)} ·
    Collection {collection.toFixed(2)} E/s · Sun damage
    {damage.toFixed(2)}
    hull/s · {status}
  </p>
  <p>
    Live production simulation, with planets removed. Reset applies starting
    distance and energy. Gravity moves the Wasp; the field states follow actual
    collection and applied damage. Collection remains active at capacity and can
    coexist with battery drain.
    <a href="/">Fly with keyboard or landscape touch</a>.
  </p>
</div>
<style>
canvas {
  width: 100%;
  height: 560px;
  display: block;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding-block: 16px;
}
label {
  display: flex;
  gap: 8px;
  align-items: center;
}
input[type="number"] {
  width: 80px;
  padding: 8px;
  font: inherit;
  color: var(--color-text);
  background: var(--color-elev-1);
  border: 1px solid var(--color-border);
}
input[type="checkbox"] {
  accent-color: var(--color-action);
}
.zoom {
  width: 180px;
}
a {
  color: var(--color-text);
  text-underline-offset: 4px;
}
p {
  color: var(--color-text-muted);
}
</style>
