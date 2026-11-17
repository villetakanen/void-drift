import { z } from "zod";

/**
 * A planet's air: a shell from its surface out to `depth` world units, moving
 * with the planet's orbit. `drag` is the rate `k` in `exp(−k × density × dt)`.
 * Spec: docs/specs/game/world/planets/spec.md#atmosphere.
 */
export const AtmosphereSchema = z
  .object({
    depth: z.number().finite().positive(),
    drag: z.number().finite().nonnegative(),
  })
  .strict();
export type Atmosphere = z.infer<typeof AtmosphereSchema>;

/**
 * One ship's contact with one planet's air. Density is 0 at the outer edge and
 * 1 at the surface; the direction points from the ship to the planet centre;
 * the velocity is the ship's, relative to the air.
 */
export const AirSampleSchema = z
  .object({
    density: z.number().min(0).max(1),
    towardPlanet: z.object({ x: z.number().finite(), y: z.number().finite() }),
    relativeVelocity: z.object({
      x: z.number().finite(),
      y: z.number().finite(),
    }),
  })
  .strict();
export type AirSample = z.infer<typeof AirSampleSchema>;

interface Point {
  readonly x: number;
  readonly y: number;
}
interface AirShip {
  readonly pos: Point;
  readonly vel: Point;
  readonly radius: number;
}
interface AirPlanet {
  readonly pos: Point;
  readonly radius: number;
  readonly orbitAngle: number;
  readonly orbitRadius: number;
  readonly orbitSpeed: number;
  readonly atmosphere?: Atmosphere;
}

/** The air's velocity: the planet's orbital velocity, with no wind. */
function airVelocity(planet: AirPlanet) {
  const speed = planet.orbitRadius * planet.orbitSpeed;
  return {
    x: -Math.sin(planet.orbitAngle) * speed,
    y: Math.cos(planet.orbitAngle) * speed,
  };
}

/** Density from collision-circle overlap with the shell; 0 when outside it. */
export function airDensity(ship: AirShip, planet: AirPlanet): number {
  const air = planet.atmosphere;
  if (!air) return 0;
  const clearance =
    Math.hypot(ship.pos.x - planet.pos.x, ship.pos.y - planet.pos.y) -
    ship.radius -
    planet.radius;
  return Math.max(0, Math.min(1, 1 - clearance / air.depth));
}

/** The ship's contact with this planet's air, or null outside it. */
export function airSample(ship: AirShip, planet: AirPlanet): AirSample | null {
  const density = airDensity(ship, planet);
  if (density <= 0) return null;
  const dx = planet.pos.x - ship.pos.x;
  const dy = planet.pos.y - ship.pos.y;
  const distance = Math.hypot(dx, dy) || 1;
  const air = airVelocity(planet);
  return {
    density,
    towardPlanet: { x: dx / distance, y: dy / distance },
    relativeVelocity: { x: ship.vel.x - air.x, y: ship.vel.y - air.y },
  };
}

/**
 * Scales the ship's velocity relative to the air by `exp(−k × density × dt)`.
 * It slows and never turns that relative velocity.
 */
export function applyAtmosphericDrag(
  ship: { readonly pos: Point; vel: { x: number; y: number }; radius: number },
  planet: AirPlanet,
  dt: number,
): void {
  const air = planet.atmosphere;
  if (!air) return;
  const density = airDensity(ship, planet);
  if (density <= 0) return;
  const retain = Math.exp(-air.drag * density * dt);
  const v = airVelocity(planet);
  ship.vel.x = v.x + (ship.vel.x - v.x) * retain;
  ship.vel.y = v.y + (ship.vel.y - v.y) * retain;
}
