import type { Planet } from "@void-drift/core";
import type { GravityTuning } from "./schemas/gravity";
import { GRAVITY_TUNING } from "./tuning";

/** Accepted airless mineral-rock family; radii in world units, not diameters. */
export const MERCURIAL_ROCK_RADIUS = {
  min: 16,
  practice: 27,
  max: 36,
} as const;

/** Centre-to-centre orbit distance chosen for Practice Mercury. */
export const PRACTICE_MERCURY_ORBIT = 258;
export const PRACTICE_MERCURY_TRAVEL_SPEED = 4;
/** Shared surface turn for the mercurial family, independent of orbit. */
export const MERCURIAL_ROCK_SPIN_SECONDS = 31.3;
export const PRACTICE_MERCURY_SPIN_SECONDS = MERCURIAL_ROCK_SPIN_SECONDS;

/** Fixed core plus a smaller radius-dependent outer contribution. */
export function mercurialMass(
  radius: number,
  profile: GravityTuning["mercurial"] = GRAVITY_TUNING.mercurial,
): number {
  if (
    !Number.isFinite(radius) ||
    radius < MERCURIAL_ROCK_RADIUS.min ||
    radius > MERCURIAL_ROCK_RADIUS.max
  )
    throw new Error("Mercurial radius must lie within 16–36u");
  return (
    profile.referenceMass *
    (profile.coreFraction +
      (1 - profile.coreFraction) * (radius / profile.referenceRadius) ** 2)
  );
}

/** Body, physics and gravity HUD share the same radius-calibrated mass. */
export function applyMercurialGravity(
  planet: Planet,
  tuning: GravityTuning = GRAVITY_TUNING,
): void {
  const mass = mercurialMass(planet.radius, tuning.mercurial);
  planet.mass = mass;
  planet.massWell = { mass, cutoff: tuning.cutoff, falloff: tuning.falloff };
}
