import { MassWellFalloffSchema } from "@void-drift/core";
import { z } from "zod";

/**
 * Gravity values in play: the mass well law's falloff and cut-off pull, the
 * play sun's mass and each configured planet's mass, by planet id. Spec:
 * docs/specs/gravity-field.md; reasoning: docs/gravity-model.md.
 */
export const GravityTuningSchema = z
  .object({
    falloff: MassWellFalloffSchema,
    cutoff: z.number().finite().positive(),
    sunMass: z.number().finite().positive(),
    planetMass: z.record(z.string(), z.number().finite().positive()),
  })
  .strict();
export type GravityTuning = z.infer<typeof GravityTuningSchema>;
