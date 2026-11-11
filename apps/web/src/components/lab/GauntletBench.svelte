<script lang="ts">
import { Camera, Renderer } from "@void-drift/core";
import {
  defaultLoadout,
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
import FlightLayers from "../FlightLayers.svelte";
import "@void-drift/core/styles/buttons.css";

const WIDTH = 1728;
const HEIGHT = 1080;
let _props: { "client:load"?: boolean } = $props();
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let hull = $state(100);
let pirateHull = $state(100);
let pirateTwoHull = $state(100);
let opponentCount = $state(0);
let elapsed = $state(0);
let result = $state("FIGHTING");
let pilotPlan = $state<Simulation["opponentPlan"]>(null);
let ticks = $state(0);
let rendered = $state(false);
let x = $state(0);
let y = $state(0);
let simStatus = $state("MENU");
let resetCount = $state(0);
let range = $state(0);
let left = $state(false);
let right = $state(false);
let sim: Simulation;
let resetEncounter = $state<() => void>(() => {});
onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fxContext = canvases.fx?.getContext("2d");
  const lfxContext = canvases.lfx?.getContext("2d");
  if (!world || !fxContext || !lfxContext)
    throw new Error("Gauntlet bench requires Canvas 2D");
  const layers: FlightLayerContexts = {
    world,
    fx: fxContext,
    lfx: lfxContext,
  };
  const renderer = new Renderer(world.canvas);
  const camera = new Camera({ viewportWidth: WIDTH, viewportHeight: HEIGHT });
  const fx = new FlightFx();
  function reset() {
    sim = new Simulation({
      ...stockSettings("scout"),
      mode: "gauntlet",
      arrival: true,
      seed: 248901,
      loadout: defaultLoadout("scout"),
    });
    sim.start();
    simStatus = sim.state.status;
    fx.clear();
    camera.frame(sim.ship.pos.x, sim.ship.pos.y, 960, 540, 220, 5, true);
    hull = sim.state.resources.hull;
    pirateHull = sim.opponent?.resources.hull ?? 100;
    pirateTwoHull = sim.opponents[1]?.resources.hull ?? 100;
    opponentCount = sim.opponents.length;
    elapsed = 0;
    result = "FIGHTING";
    pilotPlan = sim.opponentPlan;
    ticks = 0;
    x = sim.ship.pos.x;
    y = sim.ship.pos.y;
    range = sim.opponents.length
      ? Math.min(
          ...sim.opponents.map((actor) =>
            Math.hypot(
              sim.ship.pos.x - actor.ship.pos.x,
              sim.ship.pos.y - actor.ship.pos.y,
            ),
          ),
        )
      : 0;
    resetCount++;
    rendered = false;
  }
  resetEncounter = reset;
  resizeFlightLayers(layers, renderer, WIDTH, HEIGHT);
  reset();

  let previous = performance.now();
  let accumulated = 0;
  let frame = 0;
  let disposed = false;
  const keydown = (event: KeyboardEvent) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") right = true;
  };
  const keyup = (event: KeyboardEvent) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") right = false;
  };
  const clearKeys = () => {
    left = false;
    right = false;
  };
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", clearKeys);
  function draw(now: number) {
    const dt = Math.min(0.1, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (sim.state.status === "PLAYING" && !sim.gauntletResult) {
      accumulated += dt;
      while (accumulated >= STEP) {
        sim.step({ leftThruster: left, rightThruster: right, fire: false });
        accumulated -= STEP;
      }
    } else accumulated = 0;
    const ships = [sim.ship, ...sim.opponents.map((actor) => actor.ship)];
    const centerX =
      ships.reduce((sum, ship) => sum + ship.pos.x, 0) / ships.length;
    const centerY =
      ships.reduce((sum, ship) => sum + ship.pos.y, 0) / ships.length;
    const padding = Math.max(
      220,
      ...ships.map(
        (ship) => Math.hypot(ship.pos.x - centerX, ship.pos.y - centerY) + 280,
      ),
    );
    camera.frame(centerX, centerY, centerX, centerY, padding, 5, false);
    camera.update(dt);
    drawFlightFrame({ layers, renderer, camera, sim, fx });
    hull = sim.state.resources.hull;
    pirateHull = sim.opponent?.resources.hull ?? 0;
    pirateTwoHull = sim.opponents[1]?.resources.hull ?? 0;
    opponentCount = sim.opponents.length;
    elapsed = sim.ticks * STEP;
    result = sim.gauntletResult
      ? `${sim.gauntletResult.winner.toUpperCase()} · ${sim.gauntletResult.cause.toUpperCase()}`
      : "FIGHTING";
    simStatus = sim.state.status;
    pilotPlan = sim.opponentPlan;
    ticks = sim.ticks;
    x = sim.ship.pos.x;
    y = sim.ship.pos.y;
    range = sim.opponents.length
      ? Math.min(
          ...sim.opponents.map((actor) =>
            Math.hypot(
              sim.ship.pos.x - actor.ship.pos.x,
              sim.ship.pos.y - actor.ship.pos.y,
            ),
          ),
        )
      : 0;
    rendered = true;
    if (!disposed) frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("blur", clearKeys);
  };
});
</script>

<main
  class="gauntlet-bench"
  data-opponents={opponentCount}
  data-ticks={ticks}
  data-rendered={rendered}
  data-sim-status={simStatus}
  data-result={result}
  data-resets={resetCount}
  data-x={x.toFixed(3)}
  data-y={y.toFixed(3)}
  data-range={range.toFixed(1)}
  data-left={left}
  data-right={right}
>
  <header>
    <div>
      <p class="eyebrow">PRODUCTION SIMULATION · UNRANKED</p>
      <h1>Gauntlet · pirate Scout</h1>
      <p>Move with A/D or ←/→. Both pirates pilot and fire automatically.</p>
    </div>
    <button type="button" class="btn btn-normal" onclick={resetEncounter}>
      Reset encounter
    </button>
  </header>
  <div class="instrument">
    <section class="scene" aria-label="Gauntlet encounter">
      <FlightLayers
        bind:canvases
        label="Player Scout and hostile pirate Scout"
      />
    </section>
    <aside aria-label="Encounter status">
      <p><span>STATE</span><strong>{result}</strong></p>
      <p><span>TIME</span><strong>{elapsed.toFixed(1)} s</strong></p>
      <p><span>PLAYER HULL</span><strong>{hull.toFixed(0)}%</strong></p>
      <p><span>PIRATE HULL</span><strong>{pirateHull.toFixed(0)}%</strong></p>
      <p>
        <span>PIRATE 2 HULL</span><strong>{pirateTwoHull.toFixed(0)}%</strong>
      </p>
      {#if pilotPlan}
        <section class="pilot-plan" aria-label="Pirate pilot plan">
          <h2>PILOT COMMAND</h2>
          <strong>
            {pilotPlan.command.leftThruster && pilotPlan.command.rightThruster
              ? "BURN BOTH"
              : pilotPlan.command.leftThruster
                ? "LEFT THRUSTER"
                : pilotPlan.command.rightThruster
                  ? "RIGHT THRUSTER"
                  : "COAST"}
          </strong>
          <small>
            {pilotPlan.horizonSeconds.toFixed(1)}
            s · {pilotPlan.candidateCount} candidates · score
            {pilotPlan.score.toFixed(2)}
          </small>
          <p>Predicted path</p>
          <div class="path-points">
            {#each pilotPlan.path as point, index}
              <span
                >{index + 1}: {point.x.toFixed(0)}, {point.y.toFixed(0)}</span
              >
            {/each}
          </div>
        </section>
      {/if}
      <div class="controls">
        <button
          type="button"
          class="btn btn-normal"
          aria-pressed={left}
          onpointerdown={() => (left = true)}
          onpointerup={() => (left = false)}
          onpointerleave={() => (left = false)}
          onpointercancel={() => (left = false)}
        >
          Left thrust
        </button>
        <button
          type="button"
          class="btn btn-normal"
          aria-pressed={right}
          onpointerdown={() => (right = true)}
          onpointerup={() => (right = false)}
          onpointerleave={() => (right = false)}
          onpointercancel={() => (right = false)}
        >
          Right thrust
        </button>
      </div>
      <small
        >Ship-to-ship weapons use their production mounts and simulation
        rules.</small
      >
    </aside>
  </div>
</main>

<style>
.gauntlet-bench {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: 24px;
  color: var(--color-text);
  background: var(--color-void);
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}
h1 {
  margin: 0;
  font-size: 24px;
}
header p {
  margin: 4px 0 0;
  color: var(--color-muted);
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
}
.instrument {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 18px;
  min-height: 600px;
}
.scene {
  min-width: 0;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--color-line);
  background: #070710;
}
.scene :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}
aside p {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
}
aside span,
aside small {
  color: var(--color-muted);
}
.controls {
  display: grid;
  gap: 8px;
  margin-top: auto;
}
.pilot-plan {
  display: grid;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--color-line);
}
.pilot-plan h2 {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.1em;
}
.pilot-plan p,
.pilot-plan small {
  color: var(--color-muted);
}
.path-points {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 8px;
  font: 11px monospace;
}
</style>
