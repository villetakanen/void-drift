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

export type FlightLayerId = "world" | "fx" | "lfx";

export interface FlightLayer {
  id: FlightLayerId;
  name: string;
  holds: string;
  /** The CSS blend mode the browser composites this layer with. */
  blend: "normal" | "plus-lighter" | "screen" | "hard-light";
  /** `immediate` is redrawn from state every frame; `persistent` keeps an image. */
  memory: "immediate" | "persistent";
  /** Canvas size as a fraction of the stage; the browser scales it up. */
  resolution: number;
}

/** The in-flight stack, bottom to top. Each layer is one canvas in the stage. */
export const FLIGHT_LAYERS: readonly FlightLayer[] = [
  {
    id: "world",
    name: "World",
    holds: "Everything solid, and the World HUD",
    blend: "normal",
    memory: "immediate",
    resolution: 1,
  },
  {
    id: "fx",
    name: "FX",
    holds: "Accumulated light that fades",
    blend: "screen",
    memory: "persistent",
    resolution: 1,
  },
  {
    id: "lfx",
    name: "LFX",
    holds: "Live light, fresh every frame",
    blend: "hard-light",
    memory: "immediate",
    resolution: 1,
  },
];

export type FlightLayerContexts = Record<
  FlightLayerId,
  CanvasRenderingContext2D
>;

/** What one in-flight frame is drawn from. */
export interface FlightFrame {
  /** One context per layer; `world` is the renderer's own canvas. */
  layers: FlightLayerContexts;
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
  layer: FlightLayerId;
  /** `screen` draws untransformed; `world` draws under the camera transform. */
  space: "screen" | "world";
  draws: string;
  /** The file that owns this pass's drawing. */
  source: string;
  /** `ctx` is the pass's layer, already in the pass's space. */
  draw(frame: FlightFrame, ctx: CanvasRenderingContext2D): void;
}

/** The in-flight frame's passes, grouped by layer in stack order. Array order is draw order. */
export const FLIGHT_PASSES: readonly FlightPass[] = [
  {
    id: "void",
    name: "Void",
    layer: "world",
    space: "screen",
    draws: "The clear to the void colour",
    source: "packages/core/src/lib/entities/Renderer.ts",
    draw: ({ renderer }) => renderer.clear(),
  },
  {
    id: "starfield",
    name: "Starfield",
    layer: "world",
    space: "world",
    draws: "Seeded background stars across the camera's view",
    source: "packages/core/src/lib/entities/starfield.ts",
    draw: ({ renderer, camera }) =>
      renderer.drawBackground(camera.getViewRect()),
  },
  {
    id: "arena-boundary",
    name: "Arena boundary",
    layer: "world",
    space: "world",
    draws: "The arena's ring",
    source: "packages/core/src/lib/entities/Renderer.ts",
    draw: ({ renderer }) => renderer.drawArenaBoundary(1200),
  },
  {
    id: "star",
    name: "Star",
    layer: "world",
    space: "world",
    draws: "The sun's body and glow",
    source: "packages/core/src/lib/assets/star.ts",
    draw: ({ renderer, sim }) =>
      renderer.drawStar(sim.star, sim.ticks * STEP * 1000),
  },
  {
    id: "sun-fields",
    name: "Sun fields",
    layer: "world",
    space: "world",
    draws: "World HUD: the sun's collection and damage rings",
    source: "packages/core/src/lib/assets/sun-fields.ts",
    draw: ({ sim }, ctx) =>
      drawSunFields(ctx, sim.star, {
        collecting: sim.solarCollectionRate > 0,
        damaging: sim.solarDamageRate > 0,
      }),
  },
  {
    id: "planets",
    name: "Planets",
    layer: "world",
    space: "world",
    draws: "Each planet with its orbit path and influence ring",
    source: "packages/core/src/lib/assets/planet.ts",
    draw: ({ renderer, sim }) => {
      for (const planet of sim.planets) renderer.drawPlanet(planet);
    },
  },
  {
    id: "derelicts",
    name: "Derelicts",
    layer: "world",
    space: "world",
    draws: "Wrecks, fragments and released energy squares",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ sim }, ctx) => {
      if (sim.salvage) drawSalvage(ctx, sim.salvage);
    },
  },
  {
    id: "ship",
    name: "Ship",
    layer: "world",
    space: "world",
    draws: "The fitted build, or the stock ship",
    source: "packages/mode-a/src/lib/build-renderer.ts",
    draw: ({ renderer, sim, stockShip }, ctx) => {
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
    id: "derelict-apertures",
    name: "Derelict apertures",
    layer: "world",
    space: "world",
    draws: "The hollow centre of each wreck and energy cell",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ sim }, ctx) => {
      if (sim.salvage) drawSalvageApertures(ctx, sim.salvage);
    },
  },
  {
    id: "accumulated-light",
    name: "Accumulated light",
    layer: "fx",
    space: "world",
    draws: "Fresh emission added, history faded",
    source: "packages/core/src/lib/effects/fx-surface.ts",
    draw: ({ sim, fx, lightTime, lightOverlay }, ctx) =>
      fx.draw(ctx, sim, true, true, lightTime, lightOverlay),
  },
  {
    id: "aperture-cut",
    name: "Aperture cut",
    layer: "fx",
    space: "world",
    draws: "Light removed over derelict apertures",
    source: "packages/mode-a/src/lib/salvage-renderer.ts",
    draw: ({ sim }, ctx) => {
      if (!sim.salvage) return;
      // Erasing with the aperture's own shape lets World show through.
      ctx.globalCompositeOperation = "destination-out";
      drawSalvageApertures(ctx, sim.salvage);
    },
  },
  {
    id: "ion-beams",
    name: "Ion beams",
    layer: "lfx",
    space: "world",
    draws: "Plasma charge light and ion weapon beams, live",
    source: "packages/mode-a/src/lib/gravity-fold-fx.ts",
    draw: ({ sim, fx }, ctx) => fx.drawLfx(ctx, sim),
  },
];

function resolutionOf(id: FlightLayerId) {
  return FLIGHT_LAYERS.find((layer) => layer.id === id)?.resolution ?? 1;
}

/** Sizes every layer's canvas for a stage of `width` by `height` logical pixels. */
export function resizeFlightLayers(
  layers: FlightLayerContexts,
  renderer: Renderer,
  width: number,
  height: number,
) {
  for (const layer of FLIGHT_LAYERS) {
    const w = Math.round(width * layer.resolution),
      h = Math.round(height * layer.resolution);
    const { canvas } = layers[layer.id];
    if (canvas.width === w && canvas.height === h) continue;
    if (layer.id === "world") renderer.resize(w, h);
    else {
      canvas.width = w;
      canvas.height = h;
    }
  }
}

/** Empties a layer above World, which has no opaque clear of its own. */
export function clearFlightLayer(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.resetTransform();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

export interface FlightFrameOptions {
  /** Which passes draw; every pass when omitted. */
  include?: (pass: FlightPass) => boolean;
  /** Receives each drawn pass and its draw time in milliseconds. */
  observe?: (pass: FlightPass, ms: number) => void;
}

/**
 * Draws one in-flight frame: every pass in order onto its own layer, world
 * passes under the camera. The browser composites the layers.
 */
export function drawFlightFrame(
  frame: FlightFrame,
  { include, observe }: FlightFrameOptions = {},
) {
  // World clears itself with the Void pass; the layers above start empty.
  clearFlightLayer(frame.layers.fx);
  clearFlightLayer(frame.layers.lfx);
  for (const pass of FLIGHT_PASSES) {
    if (include && !include(pass)) continue;
    const ctx = frame.layers[pass.layer];
    const resolution = resolutionOf(pass.layer);
    const start = observe ? performance.now() : 0;
    ctx.save();
    if (resolution !== 1) ctx.scale(resolution, resolution);
    if (pass.space === "world") frame.camera.applyTransform(ctx);
    pass.draw(frame, ctx);
    ctx.restore();
    observe?.(pass, performance.now() - start);
  }
}
