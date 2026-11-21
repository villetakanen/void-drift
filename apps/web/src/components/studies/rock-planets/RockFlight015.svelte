<script lang="ts">
import {
  Camera,
  COLOR,
  canvasFont,
  Input,
  litPads,
  Renderer,
  RockBodyPainter,
  type ThrustPad,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  drawFlightFrame,
  FLIGHT_PASSES,
  FlightFx,
  type FlightLayerCanvases,
  type FlightLayerContexts,
  type FlightPass,
  resizeFlightLayers,
  Simulation,
  STEP,
  starterLoadout,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import ThrustPads from "../../controls/ThrustPads.svelte";
import FlightLayers from "../../FlightLayers.svelte";
import { loadAuthoredRockMaterials } from "./authored-materials";
import "@void-drift/core/styles/buttons.css";

let { label = "Rock worlds: playable candidate" }: { label?: string } =
  $props();
let canvases = $state<FlightLayerCanvases>({});
let running = $state(false),
  ready = $state(false),
  failed = $state("");
let view = $state<"system" | "follow">("system");
let lit = $state<readonly ThrustPad[]>([]);
let power = $state(100),
  hull = $state(100),
  elapsed = $state(0),
  status = $state("Ready");
let shipX = $state(0),
  shipY = $state(0);
let action = () => {},
  reset = () => {};
let visit = (_index: number) => {};
let press = $state((_id: number, _pad: ThrustPad | null) => {});

onMount(() => {
  let disposed = false,
    raf = 0;
  let input: Input | null = null;
  const stop = () => {
    running = false;
    input?.destroy();
    input = null;
    lit = [];
  };
  const blur = () => stop();
  const handleEscape = (event: KeyboardEvent) => {
    if (event.code === "Escape") stop();
  };
  window.addEventListener("blur", blur);
  window.addEventListener("keydown", handleEscape);
  loadAuthoredRockMaterials()
    .then((materials) => {
      if (disposed) return;
      const world = canvases.world?.getContext("2d"),
        fxContext = canvases.fx?.getContext("2d"),
        lfx = canvases.lfx?.getContext("2d");
      if (!world || !fxContext || !lfx)
        throw new Error("Flight layers unavailable");
      const layers: FlightLayerContexts = {
        world,
        fx: fxContext,
        lfx,
        fxGlow: canvases.fxGlow,
      };
      const renderer = new Renderer(world.canvas);
      resizeFlightLayers(layers, renderer, 1728, 1080);
      const camera = new Camera({ viewportWidth: 1728, viewportHeight: 1080 });
      const fx = new FlightFx();
      const painter = new RockBodyPainter(materials);
      const names = ["Mineral rock", "Mercury · highlands", "Iron rock"];
      let sim: Simulation;
      const setup = () => {
        stop();
        sim = new Simulation({
          ...stockSettings("wasp"),
          loadout: starterLoadout("wasp"),
          mode: "practice",
          seed: 71,
        });
        const stock = [...sim.planets];
        sim.planets.splice(
          0,
          sim.planets.length,
          ...[
            { radius: 28, distance: 170, angle: 2.1 },
            { radius: 45, distance: 250, angle: 0 },
            { radius: 60, distance: 360, angle: 4.2 },
          ].map((body, index) => {
            const base = stock[index % stock.length];
            const planet = {
              ...base,
              id: `study-rock-${index}`,
              pos: base.pos.clone(),
              orbitCenter: sim.star.pos.clone(),
              radius: body.radius,
              orbitRadius: body.distance,
              orbitAngle: body.angle,
              initialAngle: body.angle,
              orbitSpeed: 0.025 + index * 0.007,
            };
            updatePlanetOrbit(planet, 0);
            return planet;
          }),
        );
        sim.ship.pos.set(sim.star.pos.x + 390, sim.star.pos.y + 80);
        sim.ship.rotation = -Math.PI / 2;
        sim.start();
        fx.clear();
        elapsed = 0;
        power = hull = 100;
        status = "Ready";
      };
      setup();
      reset = setup;
      visit = (index) => {
        setup();
        const planet = sim.planets[index];
        const angle = Math.atan2(
          planet.pos.y - sim.star.pos.y,
          planet.pos.x - sim.star.pos.x,
        );
        sim.ship.pos.set(
          planet.pos.x + Math.cos(angle) * (planet.radius + 75),
          planet.pos.y + Math.sin(angle) * (planet.radius + 75),
        );
        sim.ship.rotation = angle + Math.PI / 2;
        view = "follow";
      };
      action = () => {
        if (running) {
          stop();
          return;
        }
        if (sim.state.status !== "PLAYING") setup();
        input = new Input();
        running = true;
      };
      press = (id, pad) => {
        input?.setPointer(id, pad);
      };
      const passes: readonly FlightPass[] = [
        ...FLIGHT_PASSES.map((pass) =>
          pass.id !== "planets"
            ? pass
            : {
                ...pass,
                source: "packages/core/src/lib/assets/rock-body.ts",
                draw: (
                  _frame: Parameters<FlightPass["draw"]>[0],
                  ctx: CanvasRenderingContext2D,
                ) => {
                  sim.planets.forEach((planet, index) => {
                    ctx.strokeStyle = COLOR.border;
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.arc(
                      sim.star.pos.x,
                      sim.star.pos.y,
                      planet.orbitRadius,
                      0,
                      Math.PI * 2,
                    );
                    ctx.stroke();
                    painter.body(
                      ctx,
                      index,
                      planet.pos.x,
                      planet.pos.y,
                      planet.radius,
                    );
                    ctx.fillStyle = COLOR.textMuted;
                    ctx.font = canvasFont(12 / camera.zoom);
                    ctx.textAlign = "center";
                    ctx.fillText(
                      names[index],
                      planet.pos.x,
                      planet.pos.y + planet.radius + 20 / camera.zoom,
                    );
                  });
                },
              },
        ),
        {
          id: "study-rock-light",
          name: "Rock reflected light",
          layer: "lfx",
          space: "world",
          source: "packages/core/src/lib/assets/rock-body.ts",
          draws: "Sun-facing hard-light clipped to solid rock discs",
          draw: (
            _frame: Parameters<FlightPass["draw"]>[0],
            ctx: CanvasRenderingContext2D,
          ) => {
            for (const planet of sim.planets)
              painter.light(
                ctx,
                planet.pos.x,
                planet.pos.y,
                planet.radius,
                sim.star.pos.x,
                sim.star.pos.y,
              );
          },
        },
      ];
      let previous = performance.now(),
        accumulator = 0;
      const frame = (now: number) => {
        const dt = Math.min(0.1, (now - previous) / 1000);
        previous = now;
        if (running && sim.state.status === "PLAYING") {
          accumulator += dt;
          while (accumulator >= STEP) {
            sim.step(
              input?.getEffectiveState() ?? {
                leftThruster: false,
                rightThruster: false,
                fire: false,
              },
            );
            accumulator -= STEP;
          }
          lit = litPads(input?.getAction() ?? null);
        } else accumulator = 0;
        if (sim.state.status !== "PLAYING") {
          status = `Lost · ${sim.state.deathCause ?? "contact"} · Reset to fly again`;
          stop();
        } else status = running ? "Flying" : "Paused";
        shipX = sim.ship.pos.x;
        shipY = sim.ship.pos.y;
        elapsed = sim.ticks * STEP;
        power = sim.state.resources.power;
        hull = sim.state.resources.hull;
        if (view === "follow") {
          camera.pos.set(sim.ship.pos.x, sim.ship.pos.y);
          camera.zoom = 1.6;
        } else {
          camera.pos.set(sim.star.pos.x, sim.star.pos.y);
          camera.zoom = 1.25;
        }
        drawFlightFrame({ layers, renderer, camera, sim, fx }, { passes });
        raf = requestAnimationFrame(frame);
      };
      ready = true;
      raf = requestAnimationFrame(frame);
    })
    .catch((error) => {
      failed =
        error instanceof Error ? error.message : "Candidate could not load";
    });
  return () => {
    disposed = true;
    stop();
    cancelAnimationFrame(raf);
    window.removeEventListener("blur", blur);
    window.removeEventListener("keydown", handleEscape);
  };
});
</script>
<div
  class="candidate"
  data-ready={ready}
  data-playing={running}
  data-seconds={elapsed.toFixed(2)}
  data-ship-x={shipX.toFixed(2)}
  data-ship-y={shipY.toFixed(2)}
>
  <div class="controls">
    <button
      type="button"
      class="btn btn-filled"
      disabled={!ready}
      onclick={() => action()}
    >
      {running ? "Pause flight" : "Fly"}
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      disabled={!ready}
      onclick={() => reset()}
    >
      Reset flight
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={view === "system"}
      onclick={() => (view = "system")}
    >
      System view
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      aria-pressed={view === "follow"}
      onclick={() => (view = "follow")}
    >
      Follow ship
    </button>
    <span
      >{status}
      · {elapsed.toFixed(1)} s · Hull {Math.round(hull)} · Power
      {Math.round(power)}</span
    >
  </div>
  <div class="visits">
    <span>Approach:</span>
    {#each ["Mineral rock", "Mercury", "Iron rock"] as name, index}
      <button
        type="button"
        class="btn btn-ghost"
        disabled={!ready}
        onclick={() => visit(index)}
      >
        {name}
      </button>
    {/each}
  </div>
  {#if failed}
    <p role="alert">{failed}</p>
  {/if}
  <div class="stage">
    <FlightLayers bind:canvases {label} />
    {#if running}
      <div class="pad left">
        <ThrustPads side="left" {lit} onpress={press} />
      </div>
      <div class="pad right">
        <ThrustPads side="right" {lit} onpress={press} />
      </div>
    {/if}
  </div>
  <p class="instructions">
    Fly: A/D or ←/→ turn; W or ↑ burns both engines. Touch pads work while
    flying. Escape pauses and releases the controls. Reset restores the same
    three worlds.
  </p>
</div>
<style>
.candidate {
  width: 1040px;
  max-width: 100%;
  margin-block: var(--spacing-xl);
}
.controls,
.visits {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  padding-block: var(--spacing-md);
}
.controls span,
.visits span,
.instructions {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.stage {
  position: relative;
  aspect-ratio: 1728 / 1080;
  border: 1px solid var(--color-border);
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
.pad {
  position: absolute;
  width: 96px;
  height: 200px;
  bottom: var(--spacing-lg);
}
.pad.left {
  left: var(--spacing-sm);
}
.pad.right {
  right: var(--spacing-sm);
}
</style>
