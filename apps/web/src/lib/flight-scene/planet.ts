import type { GameObject, Planet, Star } from "@void-drift/core";
import type { DeepReadonly } from "./read-only";

/** A presentation snapshot: painters cannot mutate the simulation. */
export interface PlanetSceneState {
  planet: DeepReadonly<Planet>;
  ship: DeepReadonly<GameObject>;
  sun: DeepReadonly<Star>;
  seconds: number;
}

export interface PlanetAppearance {
  label: string;
  world(ctx: CanvasRenderingContext2D, state: PlanetSceneState): void;
  lfx?(ctx: CanvasRenderingContext2D, state: PlanetSceneState): void;
}

/** Linear overlap density; atmosphere moves with the body's orbital velocity. */
export function atmosphereSample(
  ship: Pick<DeepReadonly<GameObject>, "pos" | "radius">,
  planet: DeepReadonly<Planet>,
  depth: number,
) {
  const clearance =
    Math.hypot(ship.pos.x - planet.pos.x, ship.pos.y - planet.pos.y) -
    ship.radius -
    planet.radius;
  return {
    clearance,
    density: Math.max(0, Math.min(1, 1 - clearance / depth)),
    vx: -Math.sin(planet.orbitAngle) * planet.orbitRadius * planet.orbitSpeed,
    vy: Math.cos(planet.orbitAngle) * planet.orbitRadius * planet.orbitSpeed,
  };
}
