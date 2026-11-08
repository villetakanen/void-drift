import { z } from "zod";
import { GravityTuningSchema } from "./schemas/gravity";
import data from "./tuning.json";

/**
 * Versioned gameplay tuning, one section per area. Spec: docs/specs/gravity-field.md.
 */
export const TuningSchema = z
  .object({
    version: z.literal(1),
    gravity: GravityTuningSchema,
  })
  .strict();
export type Tuning = z.infer<typeof TuningSchema>;
export const TUNING = TuningSchema.parse(data);
export const GRAVITY_TUNING = TUNING.gravity;
