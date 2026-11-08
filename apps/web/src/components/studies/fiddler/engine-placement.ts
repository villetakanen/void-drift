import { EngineIdSchema, PARTS } from "@void-drift/mode-a";
import { z } from "astro/zod";
import { TRIAL_ITEMS } from "./connected-form";

export const EnginePlacementSchema = z
  .object({
    version: z.literal(1),
    halfSpan: z.number().finite().min(6).max(28),
    y: z.number().finite().min(-12).max(50),
  })
  .strict();
export type EnginePlacement = z.infer<typeof EnginePlacementSchema>;
export const REAR_PAIR: EnginePlacement = { version: 1, halfSpan: 9.1, y: 32 };
export const ROOT_PAIR: EnginePlacement = { version: 1, halfSpan: 23, y: 10 };
export const TRIAL_EQUIPMENT_MASS = TRIAL_ITEMS.filter(
  (item) => item.area !== "engine",
).reduce((mass, item) => mass + PARTS[item.part].mass, 0);
export const ENGINE_PAIR_MASS = 2 * PARTS["heavy-ion"].mass;
export const ENGINE_PAIR_THRUST = 2 * PARTS["heavy-ion"].thrust;
export const TRIAL_HULL_MASS = 187;
export const TRIAL_LOADED_MASS =
  TRIAL_HULL_MASS + TRIAL_EQUIPMENT_MASS + ENGINE_PAIR_MASS;

// Designer's 02.12 arrangement, upright coordinates: +y aft, spacing is
// centre-to-centre across each mirrored pair. The root pair is below the wings.
export const FOUR_ENGINE_LAYOUT = {
  roots: { spacing: 47, y: 1 },
  rear: { spacing: 16, y: 39 },
} as const;
export function pairMounts(pair: { spacing: number; y: number }) {
  return [
    [-pair.spacing / 2, pair.y],
    [pair.spacing / 2, pair.y],
  ] as const;
}
export const FOUR_ENGINE_MASS = 4 * PARTS["heavy-ion"].mass;
export const FOUR_ENGINE_THRUST = 4 * PARTS["heavy-ion"].thrust;
export const FOUR_ENGINE_LOADED_MASS =
  TRIAL_HULL_MASS + TRIAL_EQUIPMENT_MASS + FOUR_ENGINE_MASS;

// One engine choice per linked pair makes asymmetric fits unrepresentable.
// Only production engine IDs are allowed; equipment cannot enter these slots.
export const FourEngineFitSchema = z
  .object({
    version: z.literal(1),
    roots: z.enum(EngineIdSchema.options),
    rear: z.enum(EngineIdSchema.options),
  })
  .strict();
export type FourEngineFit = z.infer<typeof FourEngineFitSchema>;
export const FOUR_ENGINE_FIT: FourEngineFit = {
  version: 1,
  roots: "heavy-ion",
  rear: "heavy-ion",
};
