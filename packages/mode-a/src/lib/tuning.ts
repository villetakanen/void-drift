import { AtmosphereSchema } from "@void-drift/core";
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
    /** Each atmosphere's depth (4–22u) and drag rate, by planet id. */
    atmosphere: z.record(
      z.string(),
      AtmosphereSchema.refine((air) => air.depth >= 4 && air.depth <= 22, {
        message: "Atmosphere depth must lie within 4–22u",
      }),
    ),
  })
  .strict();
export type Tuning = z.infer<typeof TuningSchema>;
export const TUNING = TuningSchema.parse(data);
export const GRAVITY_TUNING = TUNING.gravity;
export const ATMOSPHERE_TUNING = TUNING.atmosphere;
