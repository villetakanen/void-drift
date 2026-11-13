<script lang="ts">
import { Camera, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  type FlightLayerId,
  resizeFlightLayers,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { createPracticeVenus } from "../../lib/assets/practice-venus";
import { loadPracticeMercury } from "../../lib/assets/rock-planets/authored-materials";
import FlightLayers from "../FlightLayers.svelte";

let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let zoom = $state(0.7);
let paused = $state(false);
let failure = $state("");
let frameCost = $state(0);
onMount(() => {
  let disposed = false,
    raf = 0;
  const world = canvases.world?.getContext("2d"),
    fx = canvases.fx?.getContext("2d"),
    lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) return;
  const layers: FlightLayerContexts = { world, fx, lfx };
  const renderer = new Renderer(world.canvas);
  resizeFlightLayers(layers, renderer, 1000, 600);
  const camera = new Camera({ viewportWidth: 1000, viewportHeight: 600 });
  const sim = new Simulation({ ...stockSettings("wasp"), mode: "practice" });
  sim.start();
  const venus = createPracticeVenus();
  const flightFx = new FlightFx();
  let mercury: Awaited<ReturnType<typeof loadPracticeMercury>> | undefined;
  void loadPracticeMercury()
    .then((asset) => {
      if (!disposed) mercury = asset;
    })
    .catch(() => {
      failure = "Mercury material unavailable; showing fallback.";
    });
  let previous = performance.now(),
    accumulator = 0,
    frames = 0,
    cost = 0;
  const frame = (now: number) => {
    if (disposed) return;
    if (!paused) accumulator += Math.min((now - previous) / 1000, 0.1);
    previous = now;
    while (accumulator >= STEP) {
      sim.step({ leftThruster: false, rightThruster: false, fire: false });
      accumulator -= STEP;
    }
    camera.zoom = zoom;
    const planet = sim.planets.find((p) => p.id === "venus");
    if (!planet) return;
    camera.pos.set(
      zoom > 1 ? planet.pos.x : sim.star.pos.x,
      zoom > 1 ? planet.pos.y : sim.star.pos.y,
    );
    const start = performance.now();
    drawFlightFrame(
      { layers, renderer, camera, sim, fx: flightFx, mercury, venus },
      {
        include: (pass) =>
          [
            "void",
            "starfield",
            "star",
            "sun-fields",
            "planets",
            "mercury-hud",
            "venus-hud",
            "mercury-light",
            "venus-light",
          ].includes(pass.id),
      },
    );
    cost += performance.now() - start;
    if (++frames === 60) {
      frameCost = cost / frames;
      cost = 0;
      frames = 0;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
  };
});
</script>
<div class="preview">
  <p>
    Practice's moving system, using the production simulation, body, light and
    World HUD passes.
  </p>
  <fieldset class="button-group" aria-label="View scale">
    {#each [0.4, 0.7, 3.2] as scale}
      <button
        type="button"
        class="btn btn-ghost"
        aria-pressed={zoom === scale}
        onclick={() => (zoom = scale)}
      >
        {scale}
        px/u
      </button>
    {/each}
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => (paused = !paused)}
    >
      {paused ? "Resume" : "Pause"}
    </button>
  </fieldset>
  <div class="stage">
    <FlightLayers
      bind:canvases
      label="Practice Sun, Mercury and Venus with moving orbits and Sun-facing light"
    />
  </div>
  <p class="caption">
    Frame drawing: {frameCost.toFixed(2)} ms · 1000 × 600 canvas ·
    {paused ? "paused" : "running"}
  </p>
  {#if failure}
    <p role="alert">{failure}</p>
  {/if}
</div>
<style>
.button-group {
  border: 0;
  padding: 0;
  display: flex;
  gap: var(--spacing-sm);
}
.preview {
  padding: var(--spacing-lg);
}
.stage {
  position: relative;
  width: 100%;
  max-width: 1000px;
  aspect-ratio: 1000 / 600;
  margin-block: var(--spacing-lg);
}
.caption {
  color: var(--color-text-muted);
}
</style>
