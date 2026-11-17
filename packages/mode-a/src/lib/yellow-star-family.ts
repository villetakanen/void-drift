import { EnergyFieldSchema, massWellReach, type Star } from "@void-drift/core";
import type { GravityTuning } from "./schemas/gravity";

export const YELLOW_FAMILY_RADIUS = {
  min: 36,
  reference: 70,
  max: 140,
} as const;

/** The radius denomination: 70 u is G7 and the 140 u extreme is G14. */
export function yellowFamilyNumber(radius: number): number {
  return Math.round(radius / 10);
}

/** A separate deterministic stream: stellar size cannot shift encounter paths. */
export function yellowFamilyRadius(seed: number): number {
  let value = (seed ^ 0x9e3779b9) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return (
    YELLOW_FAMILY_RADIUS.min +
    (value / 4294967296) * (YELLOW_FAMILY_RADIUS.max - YELLOW_FAMILY_RADIUS.min)
  );
}

/** Applies the accepted yellow-family field relationships to one run's star. */
export function applyYellowFamilyProfile(
  star: Star,
  radius: number,
  tuning: GravityTuning,
): void {
  const scale = radius / YELLOW_FAMILY_RADIUS.reference;
  const mass = tuning.sunMass * scale ** 2.9;
  const referenceGravityReach = massWellReach(
    tuning.sunMass,
    tuning.cutoff,
    tuning.falloff,
  );

  star.radius = radius;
  star.mass = mass;
  star.massWell = { mass, cutoff: tuning.cutoff, falloff: tuning.falloff };
  star.influenceRadius = massWellReach(mass, tuning.cutoff, tuning.falloff);
  star.appearance = "yellow-family";
  star.designation = `G${yellowFamilyNumber(radius)}`;
  star.collectionField = EnergyFieldSchema.parse({
    reach: referenceGravityReach * scale,
    shoulder: 55 * scale,
    peak: 7.5,
    outerFraction: 0.1,
  });
  star.damageField = EnergyFieldSchema.parse({
    reach: 100 * scale,
    shoulder: 55 * scale,
    peak: 1.5,
    outerFraction: 0,
  });
}
