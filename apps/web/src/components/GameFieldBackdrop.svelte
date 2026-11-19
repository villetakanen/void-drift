<script lang="ts">
import {
  Camera,
  createRockMaterial,
  drawWorldOrbit,
  PLANET_MAPS,
  Renderer,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  FLIGHT_PASSES,
  FlightFx,
  type FlightLayerContexts,
  type FlightLayerId,
  resizeFlightLayers,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount, tick } from "svelte";
import { HabitableMaterials } from "../lib/assets/habitable-materials";
import { planetAppearances } from "../lib/assets/planet-appearances";
import { createOuterMercurialMaterial } from "../lib/assets/rock-planets/authored-materials";
import {
  drawGameField,
  type FieldBackground,
  systemBackground,
} from "../lib/game-field";
import GameField from "./GameField.svelte";

export const GAME_FIELD_BACKDROP_OUTER_ORBIT = 885;

let {
  canvases = $bindable({}),
  decorative = true,
  standalone = false,
  background: suppliedBackground,
  seed,
  label = "Decorative star and orbiting planets",
  cameraX = 480,
  cameraY = 270,
  width = 1920,
}: {
  canvases?: Partial<Record<FlightLayerId, HTMLCanvasElement>>;
  decorative?: boolean;
  standalone?: boolean;
  background?: FieldBackground;
  seed?: number;
  label?: string;
  cameraX?: number;
  cameraY?: number;
  width?: number;
} = $props();
let motionReduced = false;
let localSeed = $state(1);
const background = $derived(suppliedBackground ?? systemBackground(localSeed));
let refreshSystem: ((seed: number) => void) | undefined;
$effect(() => {
  if (seed !== undefined) refreshSystem?.(seed);
});

onMount(() => {
  let disposed = false;
  let disposeScene = () => {};
  void tick().then(() => {
    if (disposed) return;
    const world = canvases.world?.getContext("2d");
    const fx = canvases.fx?.getContext("2d");
    const lfx = canvases.lfx?.getContext("2d");
    if (!world || !fx || !lfx) return;
    const layers: FlightLayerContexts = { world, fx, lfx };
    const currentSeed =
      seed ?? (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646) + 1;
    localSeed = currentSeed;
    let sim = new Simulation({
      ...stockSettings("wasp"),
      mode: "survival",
      seed: currentSeed,
    });
    const overrideOutermostOrbit = () => {
      const outermost = sim.planets.reduce((outer, planet) =>
        planet.orbitRadius > outer.orbitRadius ? planet : outer,
      );
      outermost.orbitRadius = Math.max(
        GAME_FIELD_BACKDROP_OUTER_ORBIT,
        outermost.orbitRadius,
      );
      updatePlanetOrbit(outermost, 0);
    };
    overrideOutermostOrbit();
    const renderer = new Renderer(world.canvas);
    resizeFlightLayers(layers, renderer, 1920, 1080);
    const camera = new Camera();
    camera.viewportWidth = 1920;
    camera.viewportHeight = 1080;
    camera.pos.x = 480;
    camera.pos.y = 270;
    const fxState = new FlightFx();
    let frameId = 0;
    let last = performance.now();
    let elapsed = 0;
    let mercury: Awaited<ReturnType<typeof createRockMaterial>> | undefined;
    let outerMercurial:
      | Awaited<ReturnType<typeof createOuterMercurialMaterial>>
      | undefined;
    const habitable = new HabitableMaterials();
    let appearances = planetAppearances(sim.planets, {});
    const refreshAppearances = () => {
      appearances = planetAppearances(sim.planets, {
        mercury,
        outerMercurial,
        habitable: habitable.materials,
      });
    };
    refreshSystem = (nextSeed) => {
      if (sim.settings.seed === nextSeed) return;
      sim = new Simulation({
        ...stockSettings("wasp"),
        mode: "survival",
        seed: nextSeed,
      });
      overrideOutermostOrbit();
      elapsed = 0;
      refreshAppearances();
      void habitable
        .prepare(sim.planets)
        .then(() => {
          if (!disposed) refreshAppearances();
        })
        .catch(() => {});
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => (motionReduced = motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    void Promise.allSettled([
      createRockMaterial(PLANET_MAPS.mercuryGround),
      createOuterMercurialMaterial(),
      habitable.prepare(sim.planets),
    ]).then(([inner, outer]) => {
      if (disposed) {
        if (inner.status === "fulfilled") inner.value.painter.dispose();
        if (outer.status === "fulfilled") outer.value.painter.dispose();
        return;
      }
      if (inner.status === "fulfilled") mercury = inner.value;
      if (outer.status === "fulfilled") outerMercurial = outer.value;
      refreshAppearances();
    });

    const orbitPass = {
      id: "decorative-orbits",
      name: "Decorative orbit paths",
      layer: "world" as const,
      space: "world" as const,
      draws: "Circular paths of the generated planets",
      source: "packages/core/src/lib/assets/world-hud.ts",
      draw: (_frame: unknown, ctx: CanvasRenderingContext2D) => {
        for (const planet of sim.planets) {
          drawWorldOrbit(
            ctx,
            planet.orbitCenter.x,
            planet.orbitCenter.y,
            planet.orbitRadius,
            1 / camera.zoom,
          );
        }
      },
    };
    const passes = [
      ...FLIGHT_PASSES.filter((pass) => pass.id === "star"),
      orbitPass,
      ...FLIGHT_PASSES.filter((pass) =>
        ["planets", "body-light"].includes(pass.id),
      ),
    ];
    const draw = (time: number) => {
      frameId = requestAnimationFrame(draw);
      if (!decorative) return;
      const dt = Math.min(0.1, Math.max(0, (time - last) / 1000));
      last = time;
      if (!document.hidden && !motionReduced) {
        elapsed += dt;
        for (const planet of sim.planets) updatePlanetOrbit(planet, dt);
        sim.ticks = Math.floor(elapsed / STEP);
      }
      const frame = {
        layers,
        renderer,
        camera,
        sim,
        fx: fxState,
        bodyAppearances: appearances,
      };
      drawGameField(frame, background, { passes, preparedSky: true });
    };
    frameId = requestAnimationFrame(draw);
    disposeScene = () => {
      refreshSystem = undefined;
      cancelAnimationFrame(frameId);
      motion.removeEventListener("change", updateMotion);
      habitable.dispose();
      mercury?.painter.dispose();
      outerMercurial?.painter.dispose();
    };
  });
  return () => {
    disposed = true;
    disposeScene();
  };
});
</script>

<div
  class="field-backdrop"
  class:standalone
  aria-hidden={decorative ? "true" : undefined}
>
  <GameField bind:canvases {background} {cameraX} {cameraY} {width} {label} />
  {#if decorative}
    <div class="dialog-scrim"></div>
  {/if}
</div>

<style>
.field-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.field-backdrop.standalone {
  position: fixed;
}
.field-backdrop > :global(.dialog-scrim) {
  z-index: 3;
}
</style>
