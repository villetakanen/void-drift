import {
  CAMERA_ARENA_RADIUS,
  HabitableAppearanceSchema,
  type Planet,
  type Star,
} from "@void-drift/core";
import { GRAVITY_TUNING } from "./tuning";

export const HABITABLE_RADIUS = {
  reference: 27 * (1 + (6371 / 2440 - 1) / 3),
  min: 0.8 * 27 * (1 + (6371 / 2440 - 1) / 3),
  max: 1.2 * 27 * (1 + (6371 / 2440 - 1) / 3),
} as const;
export const HABITABLE_SPIN_SECONDS = 93.9;
export const HABITABLE_CLOUD_SPIN_SECONDS = 46.95;
export const HABITABLE_CLOUD_HEIGHT = 2 / 5;
export const HABITABLE_TRAVEL_SPEED = (4 * 29.78) / 47.4;

/** Dedicated streams keep new radius/material choices off existing random state. */
function sample(seed: number, salt: number) {
  let value = (seed ^ salt) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
export function habitableRadius(seed: number) {
  return (
    HABITABLE_RADIUS.min +
    sample(seed, 0x2a8d61f3) * (HABITABLE_RADIUS.max - HABITABLE_RADIUS.min)
  );
}
export function habitableAppearance(seed: number) {
  return HabitableAppearanceSchema.parse({
    ground: ["archipelago", "violet"][Math.floor(sample(seed, 0x716c4b29) * 2)],
    clouds: ["fronts", "cover-20", "cover-40"][
      Math.floor(sample(seed, 0x3d95ae17) * 3)
    ],
  });
}
export function habitableMass(
  radius: number,
  profile = GRAVITY_TUNING.habitable,
) {
  if (
    !Number.isFinite(radius) ||
    radius < HABITABLE_RADIUS.min ||
    radius > HABITABLE_RADIUS.max
  )
    throw new Error("Habitable radius must lie within ±20% of Earth");
  return (
    profile.referenceMass *
    (profile.coreFraction +
      ((1 - profile.coreFraction) * radius) / profile.referenceRadius)
  );
}
export function applyHabitableGravity(planet: Planet) {
  const mass = habitableMass(planet.radius);
  planet.mass = mass;
  planet.massWell = {
    mass,
    cutoff: GRAVITY_TUNING.cutoff,
    falloff: GRAVITY_TUNING.falloff,
  };
}

/** Entire air envelope stays outside charging and all preceding bodies. */
export function habitableOrbit(
  star: Star,
  radius: number,
  depth: number,
  inner: readonly Planet[] = [],
) {
  habitableMass(radius);
  const collection = star.collectionField?.reach;
  if (
    !collection ||
    !Number.isFinite(collection) ||
    !Number.isFinite(depth) ||
    depth < 0
  )
    throw new Error("Invalid Habitable placement fields");
  const extent = radius + depth;
  const orbit = Math.max(
    (258 * 149.6) / 57.9,
    collection + extent + 1,
    ...inner.map(
      (p) => p.orbitRadius + p.radius + (p.atmosphere?.depth ?? 0) + extent + 1,
    ),
  );
  if (orbit + extent >= CAMERA_ARENA_RADIUS)
    throw new Error("No room for Habitable world inside the warp boundary");
  return orbit;
}
