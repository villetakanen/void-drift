import {
  type Camera,
  drawSunFields,
  drawWorldHud,
  type FxPass,
  type Planet,
  type Renderer,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  drawBuild,
  drawNonEngineFitting,
} from "./build-renderer";
import { DRONE_SEAT, drawDrone } from "./drone-art";
import type { FlightFx } from "./gravity-fold-fx";
import {
  drawPlasmaRifleCharge,
  plasmaChargeAppearance,
} from "./plasma-rifle-art";
import type { SalvageSystem } from "./salvage";
import { drawSalvage, drawSalvageApertures } from "./salvage-renderer";
import type { ShipProfileId } from "./schemas/ship-profile";
import { type Simulation, STEP } from "./simulation";

export type FlightLayerId = "world" | "fx" | "lfx";

export type FlightLayerCanvases = Partial<
  Record<FlightLayerId | "fxGlow", HTMLCanvasElement>
>;

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
> & {
  /** Optional derived presentation output, with no passes or history of its own. */
  fxGlow?: HTMLCanvasElement;
};

/** Inclusive axis-aligned bounds in world units. */
export interface BodyAppearanceBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Runtime appearance data for one simulation planet's ordered composition. */
export interface BodyAppearance {
  worldBounds(frame: FlightFrame, planet: Planet): BodyAppearanceBounds;
  drawWorld(
    frame: FlightFrame,
    ctx: CanvasRenderingContext2D,
    planet: Planet,
  ): void;
  light?: {
    bounds(frame: FlightFrame, planet: Planet): BodyAppearanceBounds;
    draw(
      frame: FlightFrame,
      ctx: CanvasRenderingContext2D,
      planet: Planet,
    ): void;
  };
}

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
  /** Prepared appearances keyed by validated full-system planet ordinal. */
  bodyAppearances?: ReadonlyMap<number, BodyAppearance>;
}

export interface FlightPass {
  id: string;
  name: string;
  layer: FlightLayerId;
  /** `screen` draws untransformed; `world` draws under the camera transform. */
  space: "screen" | "world";
  draws: string;
  /** Composition in which this pass is used, when not universal. */
  composition?: string;
  /** The file that owns this pass's drawing. */
  source: string;
  /** `ctx` is the pass's layer, already in the pass's space. */
  draw(frame: FlightFrame, ctx: CanvasRenderingContext2D): void;
}

/** Browser-composited layer beneath the Canvas stack. */
export const FLIGHT_SKY_LAYER = {
  name: "Distant sky",
  holds: "Prepared image composited by the browser below World",
  blend: "normal",
  memory: "fixed per sightline",
};

/** The in-flight frame's ordered passes. Each pass names its own layer context. */
export const FLIGHT_PASSES: readonly FlightPass[] = [
  {
    id: "void",
    composition: "Legacy frames without a prepared sky",
    name: "Void",
    layer: "world",
    space: "screen",
    draws: "The clear to the void colour",
    source: "packages/core/src/lib/entities/Renderer.ts",
    draw: ({ renderer }) => renderer.clear(),
  },
  {
    id: "starfield",
    composition:
      "Legacy frames without a prepared sky or an experimental sky painter",
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
    draws: "World HUD: the star's gravity, collection, damage and denomination",
    source: "packages/core/src/lib/assets/sun-fields.ts",
    draw: ({ sim }, ctx) =>
      drawSunFields(ctx, sim.star, {
        collecting: sim.solarCollectionRate > 0,
        damaging: sim.solarDamageRate > 0,
      }),
  },
  {
    id: "world-hud",
    name: "World HUD",
    layer: "world",
    space: "screen",
    draws: "Every planet's orbit, gravity boundary and name",
    source: "packages/core/src/lib/assets/world-hud.ts",
    draw: ({ sim, camera }, ctx) =>
      drawWorldHud(ctx, camera, sim.star, sim.planets),
  },
  {
    id: "planets",
    name: "Planets",
    layer: "world",
    space: "world",
    draws: "Each planet's prepared body composition, or its stock body",
    source: "packages/mode-a/src/lib/flight-frame.ts",
    draw: (frame, ctx) => {
      const { renderer, sim, bodyAppearances, camera } = frame;
      for (const planet of sim.planets) {
        const appearance = bodyAppearanceFor(bodyAppearances, planet);
        if (appearance) {
          const bounds = appearance.worldBounds(frame, planet);
          if (boundsInView(camera, bounds))
            appearance.drawWorld(frame, ctx, planet);
        } else if (
          planetBodyInView(camera, planet, stockPlanetOutlineHalfWidth(planet))
        )
          renderer.drawPlanet(planet);
      }
    },
  },
  {
    id: "body-light",
    name: "Body light",
    layer: "lfx",
    space: "world",
    draws: "Each prepared body's sun-facing light stamp",
    source: "packages/mode-a/src/lib/flight-frame.ts",
    draw: (frame, ctx) => {
      const { camera, sim, bodyAppearances } = frame;
      for (const planet of sim.planets) {
        const light = bodyAppearanceFor(bodyAppearances, planet)?.light;
        if (!light) continue;
        if (boundsInView(camera, light.bounds(frame, planet)))
          light.draw(frame, ctx, planet);
      }
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
    draw: ({ renderer, sim, stockShip, camera }, ctx) => {
      const view = camera.getViewRect();
      const fittingPainter = (
        combat: SalvageSystem | undefined,
        x: number,
        y: number,
        radius: number,
      ) => {
        if (
          x + radius + 30 < view.x ||
          x - radius - 30 > view.x + view.width ||
          y + radius + 30 < view.y ||
          y - radius - 30 > view.y + view.height ||
          !combat?.weapons.some(
            (weapon) =>
              weapon.kind === "drone-launcher" ||
              (weapon.kind === "plasma-rifle" &&
                weapon.plasma &&
                (weapon.plasma.phase === "charging" ||
                  weapon.plasma.phase === "venting") &&
                weapon.plasma.charge > 0),
          )
        )
          return undefined;
        return (context: CanvasRenderingContext2D, mount: BuildMount) => {
          if (mount.part === "drone-launcher") {
            const weapon = combat.weapons.find(
              (w) => w.mount.key === mount.key,
            );
            drawNonEngineFitting(context, mount);
            if (weapon && weapon.readyAt <= combat.time) {
              context.save();
              context.scale(1 / BUILD_FLIGHT_SCALE, 1 / BUILD_FLIGHT_SCALE);
              context.translate(DRONE_SEAT, 0);
              drawDrone(context);
              context.restore();
            }
            return true;
          }
          if (mount.part !== "plasma-rifle") return false;
          const weapon = combat.weapons.find(
            (item) =>
              item.mount.key === mount.key && item.kind === "plasma-rifle",
          );
          if (!weapon) return false;
          drawNonEngineFitting(context, mount);
          context.save();
          context.scale(1 / BUILD_FLIGHT_SCALE, 1 / BUILD_FLIGHT_SCALE);
          drawPlasmaRifleCharge(context, plasmaChargeAppearance(weapon.plasma));
          context.restore();
          return true;
        };
      };
      if (sim.settings.loadout) {
        const weaponAngles = sim.salvage?.angles;
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
          weaponAngles,
          true,
          fittingPainter(
            sim.salvage,
            sim.ship.pos.x,
            sim.ship.pos.y,
            sim.ship.radius,
          ),
        );
      } else if (stockShip)
        renderer.drawShip(sim.ship, sim.settings.profile.tint, stockShip);
      for (const opponent of sim.opponents)
        if (opponent.lifecycle !== "destroyed") {
          drawBuild(
            ctx,
            opponent.loadout,
            opponent.ship.pos.x,
            opponent.ship.pos.y,
            opponent.ship.rotation,
            BUILD_FLIGHT_SCALE,
            "",
            undefined,
            undefined,
            opponent.combat.angles,
            true,
            fittingPainter(
              opponent.combat,
              opponent.ship.pos.x,
              opponent.ship.pos.y,
              opponent.ship.radius,
            ),
            "charcoal",
          );
        }
      for (const drone of sim.droneFlight.drones) {
        if (
          drone.x + 4 < view.x ||
          drone.x - 4 > view.x + view.width ||
          drone.y + 4 < view.y ||
          drone.y - 4 > view.y + view.height
        )
          continue;
        ctx.save();
        ctx.translate(drone.x, drone.y);
        ctx.rotate(drone.rotation);
        drawDrone(ctx);
        ctx.restore();
      }
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
    draws:
      "Plasma charge, ion weapon beams, Fission exhaust and atmospheric heat, live",
    source: "packages/mode-a/src/lib/gravity-fold-fx.ts",
    draw: ({ sim, fx }, ctx) => fx.drawLfx(ctx, sim),
  },
];

function bodyAppearanceFor(
  appearances: ReadonlyMap<number, BodyAppearance> | undefined,
  planet: Planet,
) {
  const position = planet.systemPosition;
  return position === undefined ? undefined : appearances?.get(position);
}

function resolutionOf(id: FlightLayerId) {
  return FLIGHT_LAYERS.find((layer) => layer.id === id)?.resolution ?? 1;
}

export const FX_GLOW_BACKING_DIVISOR = 8;

function sizeFlightFxGlow(source: HTMLCanvasElement, glow: HTMLCanvasElement) {
  const width = Math.max(1, Math.round(source.width / FX_GLOW_BACKING_DIVISOR));
  const height = Math.max(
    1,
    Math.round(source.height / FX_GLOW_BACKING_DIVISOR),
  );
  if (glow.width !== width) glow.width = width;
  if (glow.height !== height) glow.height = height;
}

/** Copy finalized FX into its derived glow, after the last FX painter or cut. */
export function presentFlightFx(
  source: HTMLCanvasElement,
  glow: HTMLCanvasElement | undefined,
) {
  if (!glow) return;
  sizeFlightFxGlow(source, glow);
  const ctx = glow.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, glow.width, glow.height);
  ctx.drawImage(source, 0, 0, glow.width, glow.height);
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
      if (layer.id === "fx" && layers.fxGlow) {
        const glow = layers.fxGlow;
        sizeFlightFxGlow(canvas, glow);
        glow.getContext("2d")?.clearRect(0, 0, glow.width, glow.height);
      }
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
  /** Replace the opaque void and stock starfield with a prepared sky surface. */
  preparedSky?: boolean;
  /** A configured Lab scene may substitute painters while retaining layer/camera handling. */
  passes?: readonly FlightPass[];
  /** Which passes draw; every pass when omitted. */
  include?: (pass: FlightPass) => boolean;
  /** Skip derived presentation when drawing an intermediate history replay tick. */
  presentFx?: boolean;
  /** Receives each drawn pass and its draw time in milliseconds. */
  observe?: (pass: FlightPass, ms: number) => void;
}

/**
 * Draws one in-flight frame: every pass in order onto its own layer, world
 * passes under the camera. The browser composites the layers.
 */
export function drawFlightFrame(
  frame: FlightFrame,
  {
    include,
    observe,
    passes = FLIGHT_PASSES,
    presentFx = true,
    preparedSky = false,
  }: FlightFrameOptions = {},
) {
  // World clears itself with the Void pass; the layers above start empty.
  if (preparedSky) clearFlightLayer(frame.layers.world);
  clearFlightLayer(frame.layers.fx);
  clearFlightLayer(frame.layers.lfx);
  for (const pass of passes) {
    if (preparedSky && (pass.id === "void" || pass.id === "starfield"))
      continue;
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
  if (presentFx) presentFlightFx(frame.layers.fx.canvas, frame.layers.fxGlow);
}

/** Body bounds only: orbit/HUD drawing retains its independent visibility. */
function planetBodyInView(camera: Camera, planet: Planet, margin = 0) {
  const view = camera.getViewRect();
  const radius = planet.radius + margin;
  return (
    planet.pos.x + radius >= view.x &&
    planet.pos.x - radius <= view.x + view.width &&
    planet.pos.y + radius >= view.y &&
    planet.pos.y - radius <= view.y + view.height
  );
}

/** Validates inclusive custom world bounds and culls only wholly outside boxes. */
function boundsInView(camera: Camera, bounds: BodyAppearanceBounds) {
  if (
    !Number.isFinite(bounds.left) ||
    !Number.isFinite(bounds.top) ||
    !Number.isFinite(bounds.right) ||
    !Number.isFinite(bounds.bottom) ||
    bounds.left > bounds.right ||
    bounds.top > bounds.bottom
  )
    throw new RangeError("Body appearance bounds must be finite and ordered");
  const view = camera.getViewRect();
  return (
    bounds.right >= view.x &&
    bounds.left <= view.x + view.width &&
    bounds.bottom >= view.y &&
    bounds.top <= view.y + view.height
  );
}

/** Half-width of the stock disc outline, in world units. */
function stockPlanetOutlineHalfWidth(planet: Planet) {
  return Math.max(1, planet.radius * 0.06) / 2;
}
