import {
  type Camera,
  drawSunFields,
  type FxPass,
  type Renderer,
} from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, drawBuild } from "./build-renderer";
import type { FlightFx } from "./gravity-fold-fx";
import { drawSalvage, drawSalvageApertures } from "./salvage-renderer";
import type { ShipProfileId } from "./schemas/ship-profile";
import { type Simulation, STEP } from "./simulation";

/** What one in-flight frame is drawn from. */
export interface FlightFrame {
  ctx: CanvasRenderingContext2D;
  renderer: Renderer;
  camera: Camera;
  sim: Simulation;
  fx: FlightFx;
  /** The stock ship drawn when the simulation carries no loadout. */
  stockShip?: Exclude<ShipProfileId, "fiddler">;
  /** Game time the light surface decays by; the simulation's own by default. */
  lightTime?: number;
  /** Extra emission stamped into the light surface, such as the countdown. */
  lightOverlay?: (ctx: CanvasRenderingContext2D, pass: FxPass) => void;
}

export interface FlightPass {
  id: string;
  name: string;
  /** `screen` draws untransformed; `world` draws under the camera transform. */
  space: "screen" | "world";
  composite: GlobalCompositeOperation;
  draws: string;
  /** The file that owns this pass's drawing. */
  source: string;
  draw(frame: FlightFrame): void;
}

/** The in-flight frame's canvas passes. Array order is draw order. */
export const FLIGHT_PASSES: readonly FlightPass[] = [
  {
    id: "void",
    name: "Void",
    space: "screen",
    composite: "source-over",
    draws: "The clear to the void colour",
    source: "packages/core/src/lib/entities/Renderer.ts",
    draw: ({ renderer }) => renderer.clear(),
  },
  {
    id: "starfield",
    name: "Starfield",
    space: "world",
    composite: "source-over",
    draws: "Seeded background stars across the camera's view",
    source: "packages/core/src/lib/entities/starfield.ts",
    draw: ({ renderer, camera }) =>
      renderer.drawBackground(camera.getViewRect()),
  },
  {
    id: "arena-boundary",
    name: "Arena boundary",
    space: "world",
    composite: "source-over",
    draws: "The arena's ring",
    source: "packages/core/src/lib/entities/Renderer.ts",
    draw: ({ renderer }) => renderer.drawArenaBoundary(1200),
  },
  {
    id: "star",
    name: "Star",
    space: "world",
    composite: "source-over",
    draws: "The sun's body and glow",
    source: "packages/core/src/lib/assets/star.ts",
    draw: ({ renderer, sim }) =>
      renderer.drawStar(sim.star, sim.ticks * STEP * 1000),
  },
  {
    id: "sun-fields",
    name: "Sun fields",
    space: "world",
    composite: "source-over",
    draws: "World HUD: the sun's collection and damage rings",
    source: "packages/core/src/lib/assets/sun-fields.ts",
    draw: ({ ctx, sim }) =>
      drawSunFields(ctx, sim.star, {
        collecting: sim.solarCollectionRate > 0,
        damaging: sim.solarDamageRate > 0,
      }),
  },
  {
    id: "planets",
    name: "Planets",
    space: "world",
    composite: "source-over",
    draws: "Each planet with its orbit path and influence ring",
    source: "packages/core/src/lib/assets/planet.ts",
    draw: ({ renderer, sim }) => {
      for (const planet of sim.planets) renderer.drawPlanet(planet);
    },
  },
  {
    id: "derelicts",
    name: "Derelicts",
    space: "world",
    composite: "source-over",
    draws: "Wrecks, fragments and released energy squares",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ ctx, sim }) => {
      if (sim.salvage) drawSalvage(ctx, sim.salvage);
    },
  },
  {
    id: "ship",
    name: "Ship",
    space: "world",
    composite: "source-over",
    draws: "The fitted build, or the stock ship",
    source: "packages/mode-a/src/lib/build-renderer.ts",
    draw: ({ ctx, renderer, sim, stockShip }) => {
      if (sim.settings.loadout)
        drawBuild(
          ctx,
          sim.settings.loadout,
          sim.ship.pos.x,
          sim.ship.pos.y,
          sim.ship.rotation,
          BUILD_FLIGHT_SCALE,
          "",
          undefined,
          undefined,
          sim.salvage?.angles,
        );
      else if (stockShip)
        renderer.drawShip(sim.ship, sim.settings.profile.tint, stockShip);
    },
  },
  {
    id: "light-surface",
    name: "Light surface",
    space: "world",
    composite: "lighter",
    draws:
      "The persistent FX image: fresh emission stamped in, history decayed",
    source: "packages/core/src/lib/effects/fx-surface.ts",
    draw: ({ ctx, sim, fx, lightTime, lightOverlay }) =>
      fx.draw(ctx, sim, true, true, lightTime, lightOverlay),
  },
  {
    id: "derelict-apertures",
    name: "Derelict apertures",
    space: "world",
    composite: "source-over",
    draws: "Square apertures restored over the composited light",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ ctx, sim }) => {
      if (sim.salvage) drawSalvageApertures(ctx, sim.salvage);
    },
  },
  {
    id: "ion-beam",
    name: "Ion beams",
    space: "world",
    composite: "source-over",
    draws:
      "Ion cannon and point-defence beams, drawn directly, never accumulated",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ ctx, sim, fx }) => fx.drawLfx(ctx, sim),
  },
];

export interface FlightFrameOptions {
  /** Which passes draw; every pass when omitted. */
  include?: (pass: FlightPass) => boolean;
  /** Receives each drawn pass and its draw time in milliseconds. */
  observe?: (pass: FlightPass, ms: number) => void;
}

/** Draws one in-flight frame: every pass in order, world passes under the camera. */
export function drawFlightFrame(
  frame: FlightFrame,
  { include, observe }: FlightFrameOptions = {},
) {
  let world = false;
  for (const pass of FLIGHT_PASSES) {
    if (include && !include(pass)) continue;
    if ((pass.space === "world") !== world) {
      if (world) frame.renderer.endCamera();
      else frame.renderer.beginCamera(frame.camera);
      world = !world;
    }
    if (!observe) {
      pass.draw(frame);
      continue;
    }
    const start = performance.now();
    pass.draw(frame);
    observe(pass, performance.now() - start);
  }
  if (world) frame.renderer.endCamera();
}
