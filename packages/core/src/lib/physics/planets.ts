/**
 * Planet factory and management functions
 */

import { SURVIVAL_CONFIG } from "../config";
import { type Planet, PlanetWorldHudIdentitySchema, Vec2 } from "./Physics";

/**
 * Creates deterministic Planet runtime state for Mode A (PBI-032)
 * @param centerX - Center X coordinate (typically star position)
 * @param centerY - Center Y coordinate (typically star position)
 */
export function initializePlanets(centerX: number, centerY: number): Planet[] {
  const planets = SURVIVAL_CONFIG.PLANETS.map((config) => ({
    pos: new Vec2(
      centerX + Math.cos(config.orbitPhase) * config.orbitRadius,
      centerY + Math.sin(config.orbitPhase) * config.orbitRadius,
    ),
    id: config.id,
    displayName: config.name,
    orbitCenter: new Vec2(centerX, centerY),
    orbitRadius: config.orbitRadius,
    orbitSpeed: config.orbitSpeed,
    orbitAngle: config.orbitPhase,
    initialAngle: config.orbitPhase,
    radius: config.radius,
    mass: config.mass,
    color: config.color,
    type: config.type,
  }));
  return assignPlanetSystemPositions(planets);
}

/** Assign outward ordinals without changing the full system's draw order. */
export function assignPlanetSystemPositions(planets: Planet[]) {
  const outward = planets
    .map((planet, sourceIndex) => ({ planet, sourceIndex }))
    .sort(
      (a, b) =>
        a.planet.orbitRadius - b.planet.orbitRadius ||
        a.sourceIndex - b.sourceIndex,
    );
  outward.forEach(({ planet }, index) => {
    const identity = PlanetWorldHudIdentitySchema.parse({
      ...(planet.displayName !== undefined
        ? { displayName: planet.displayName }
        : {}),
      systemPosition: index + 1,
    });
    Object.assign(planet, identity);
  });
  return planets;
}
