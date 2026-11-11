import {
  EnergyFieldSchema,
  fieldRate,
  massWellReach,
  STANDARD_SUN,
  SUN_CONFIG,
  solarField,
} from "@void-drift/core";
import {
  buildCollisionRadius,
  buildDrain,
  buildStats,
  createStar,
  defaultLoadout,
  GRAVITY_TUNING,
} from "@void-drift/mode-a";
import { z } from "astro/zod";

// Local hypotheses, not new production stellar definitions. Both fields reuse
// the production plateau/linear law; their extents are deliberately independent.
const EncounterSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    character: z.string(),
    color: z.string(),
    radius: z.number().positive(),
    collection: EnergyFieldSchema,
    exposure: EnergyFieldSchema,
  })
  .strict()
  .refine(
    (value) =>
      value.collection.shoulder >= value.radius &&
      value.exposure.shoulder >= value.radius,
    { message: "Field shoulders must be outside the luminous body" },
  );
export type Encounter = z.infer<typeof EncounterSchema>;

const sun = createStar("G", 0, 0);
sun.influenceRadius = massWellReach(
  GRAVITY_TUNING.sunMass,
  GRAVITY_TUNING.cutoff,
  GRAVITY_TUNING.falloff,
);
export const encounters = z.array(EncounterSchema).parse([
  {
    id: "sun",
    name: "G / Standard Sun",
    character: "The familiar reference",
    color: SUN_CONFIG.G.color,
    radius: STANDARD_SUN.radius,
    collection: solarField(sun),
    exposure: {
      reach: STANDARD_SUN.damageReach,
      shoulder: STANDARD_SUN.shoulder,
      peak: STANDARD_SUN.damagePeak,
      outerFraction: 0,
    },
  },
  {
    id: "dwarf",
    name: "K / Quiet orange dwarf",
    character: "Go close for a modest refill",
    color: SUN_CONFIG.K.color,
    radius: 25,
    collection: { reach: 180, shoulder: 45, peak: 4.5, outerFraction: 0.1 },
    exposure: { reach: 72, shoulder: 45, peak: 0.8, outerFraction: 0 },
  },
  {
    id: "giant",
    name: "Cool giant / Evolved star",
    character: "Harvest wide; leave room",
    color: SUN_CONFIG.K.color,
    radius: 110,
    collection: { reach: 520, shoulder: 130, peak: 12, outerFraction: 0.1 },
    exposure: { reach: 230, shoulder: 130, peak: 3, outerFraction: 0 },
  },
]);

export const loadout = defaultLoadout("wasp");
export const stats = buildStats(loadout);
export const shipRadius = buildCollisionRadius(loadout);
export function consumption(powered: boolean) {
  return buildDrain(loadout, {
    leftThruster: powered,
    rightThruster: powered,
    fire: false,
  });
}
export function readEncounter(
  encounter: Encounter,
  distance: number,
  powered: boolean,
) {
  const contact = distance <= encounter.radius + shipRadius;
  const collection = fieldRate(distance, encounter.collection) * stats.coils;
  const exposure = fieldRate(distance, encounter.exposure);
  return {
    contact,
    collection,
    exposure,
    net: collection - consumption(powered),
    clearance: distance - encounter.radius - shipRadius,
  };
}
