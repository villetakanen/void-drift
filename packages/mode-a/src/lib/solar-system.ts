import type { Planet, Star } from "@void-drift/core";
import {
  assignPlanetSystemPositions,
  initializePlanets,
} from "@void-drift/core";
import { createStar } from "./game-loop";
import { MERCURIAL_ROCK_RADIUS } from "./mercurial-rock";
import { SolarSystemGenerationSchema } from "./schemas/solar-system";
import { GRAVITY_TUNING } from "./tuning";
import {
  applyYellowFamilyProfile,
  yellowFamilyRadius,
} from "./yellow-star-family";

export interface SolarSystem {
  star: Star;
  planets: Planet[];
}

// Generated-world tuning is independent of the fixed Practice orbit.
const GENERATED_MERCURIAL_REFERENCE_ORBIT = 258;
const GENERATED_MERCURIAL_TRAVEL_SPEED = 4;

/** Independent seeded stream for the generated mineral-rock radius. */
export function mercurialRadius(seed: number): number {
  let value = (seed ^ 0x6d2b79f5) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return (
    MERCURIAL_ROCK_RADIUS.min +
    (value / 4294967296) *
      (MERCURIAL_ROCK_RADIUS.max - MERCURIAL_ROCK_RADIUS.min)
  );
}

/** Orbit containing the whole body between the actual fields, with 1u clearance. */
export function mercurialOrbit(
  starRadius: number,
  danger: number,
  collection: number,
  radius: number,
): number {
  if (
    ![starRadius, danger, collection, radius].every(Number.isFinite) ||
    starRadius <= 0 ||
    danger <= 0 ||
    collection <= 0 ||
    radius <= 0
  ) {
    throw new Error("Invalid mercurial placement fields or radius");
  }
  const min = danger + radius + 1;
  const max = collection - radius - 1;
  if (min > max)
    throw new Error("No room for mercurial orbit between Sun fields");
  return Math.max(
    min,
    Math.min(max, (GENERATED_MERCURIAL_REFERENCE_ORBIT * starRadius) / 70),
  );
}

export function orbitsConflict(
  a: { orbitRadius: number; radius: number },
  b: { orbitRadius: number; radius: number },
): boolean {
  return Math.abs(a.orbitRadius - b.orbitRadius) <= a.radius + b.radius + 1;
}

/** Builds the shared seeded system for Survival, Derelicts and Gauntlet. */
export function generateSolarSystem(input: unknown): SolarSystem {
  const { seed, centerX, centerY } = SolarSystemGenerationSchema.parse(input);
  const star = createStar("G", centerX, centerY);
  applyYellowFamilyProfile(star, yellowFamilyRadius(seed), GRAVITY_TUNING);
  const stock = initializePlanets(centerX, centerY);
  const moon = stock.find((planet) => planet.id === "moon");
  if (!moon) throw new Error("No moon in configured planet roster");
  moon.radius = mercurialRadius(seed);
  moon.orbitRadius = mercurialOrbit(
    star.radius,
    star.damageField?.reach ?? NaN,
    star.collectionField?.reach ?? NaN,
    moon.radius,
  );
  moon.orbitSpeed = GENERATED_MERCURIAL_TRAVEL_SPEED / moon.orbitRadius;
  delete moon.displayName;
  const planets = stock.filter(
    (planet) => planet === moon || !orbitsConflict(planet, moon),
  );
  const phase = ((seed % 360) / 180) * Math.PI;

  for (const planet of planets) {
    planet.orbitAngle += phase;
    planet.pos.set(
      centerX + Math.cos(planet.orbitAngle) * planet.orbitRadius,
      centerY + Math.sin(planet.orbitAngle) * planet.orbitRadius,
    );
    const mass = GRAVITY_TUNING.planetMass[planet.id ?? ""];
    if (mass === undefined)
      throw new Error(`No mass for planet ${planet.id ?? "(no id)"}`);
    planet.massWell = {
      mass,
      cutoff: GRAVITY_TUNING.cutoff,
      falloff: GRAVITY_TUNING.falloff,
    };
  }

  assignPlanetSystemPositions(planets);
  return { star, planets };
}
