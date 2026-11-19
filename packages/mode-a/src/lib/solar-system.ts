import type { Planet, Star } from "@void-drift/core";
import {
  assignPlanetSystemPositions,
  initializePlanets,
  massWellReach,
  PLANET_TYPES,
  Vec2,
} from "@void-drift/core";
import { createStar } from "./game-loop";
import {
  applyMercurialGravity,
  MERCURIAL_ROCK_RADIUS,
  mercurialMass,
} from "./mercurial-rock";
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
const OUTER_MERCURIAL_ID = "outer-mercurial";

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

function outerMercurialRadius(seed: number): number {
  return mercurialRadius(seed ^ 0x4f1bbcdc);
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
  const planets = [moon];
  const outerRadius = outerMercurialRadius(seed);
  const outerMass = mercurialMass(outerRadius);
  const outerReach = massWellReach(
    outerMass,
    GRAVITY_TUNING.cutoff,
    GRAVITY_TUNING.falloff,
  );
  const innerMass = mercurialMass(moon.radius);
  const innerReach = massWellReach(
    innerMass,
    GRAVITY_TUNING.cutoff,
    GRAVITY_TUNING.falloff,
  );
  const separation =
    Math.max(moon.radius + outerReach, outerRadius + innerReach) + 1;
  // When the Sun contains both complete wells, place the pair at their nearest
  // safe radial spacing. Their fields overlap, while neither body enters the
  // other planet's well. The ordinary Sun danger/collection margins still hold.
  const pairInnerOrbit = (star.damageField?.reach ?? NaN) + moon.radius + 1;
  const outerOrbit = pairInnerOrbit + separation;
  const contained =
    Number.isFinite(star.influenceRadius) &&
    pairInnerOrbit + innerReach <= star.influenceRadius &&
    outerOrbit + outerReach <= star.influenceRadius &&
    separation < innerReach + outerReach &&
    outerOrbit + outerRadius + 1 <= (star.collectionField?.reach ?? NaN);
  let outer: Planet | undefined;
  if (contained) {
    moon.orbitRadius = pairInnerOrbit;
    moon.orbitSpeed = GENERATED_MERCURIAL_TRAVEL_SPEED / pairInnerOrbit;
    outer = {
      ...moon,
      id: OUTER_MERCURIAL_ID,
      pos: new Vec2(centerX, centerY),
      orbitCenter: new Vec2(centerX, centerY),
      radius: outerRadius,
      mass: outerMass,
      massWell: {
        mass: outerMass,
        cutoff: GRAVITY_TUNING.cutoff,
        falloff: GRAVITY_TUNING.falloff,
      },
      orbitRadius: outerOrbit,
      orbitSpeed: GENERATED_MERCURIAL_TRAVEL_SPEED / outerOrbit,
      color: PLANET_TYPES.outerMercurial.color,
      type: "outer-mercurial",
    };
    planets.push(outer);
  }
  for (const candidate of stock) {
    if (candidate === moon) continue;
    if (
      !orbitsConflict(candidate, moon) &&
      (!outer || !orbitsConflict(candidate, outer))
    )
      planets.push(candidate);
  }
  const phase = ((seed % 360) / 180) * Math.PI;

  for (const planet of planets) {
    planet.orbitAngle += phase;
    planet.pos.set(
      centerX + Math.cos(planet.orbitAngle) * planet.orbitRadius,
      centerY + Math.sin(planet.orbitAngle) * planet.orbitRadius,
    );
    if (planet === moon || planet === outer) {
      applyMercurialGravity(planet);
      continue;
    }
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
