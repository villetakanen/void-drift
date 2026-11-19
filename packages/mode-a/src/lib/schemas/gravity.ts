import { MassWellFalloffSchema } from "@void-drift/core";
import { z } from "zod";

/**
 * Gravity values in play: the mass well law's falloff and cut-off pull, the
 * Sun mass, fixed planet masses and the shared mercurial family profile. Spec:
 * docs/specs/game/world/gravity-field/spec.md; reasoning: docs/gravity-model.md.
 */
export const GravityTuningSchema = z
  .object({
    falloff: MassWellFalloffSchema,
    cutoff: z.number().finite().positive(),
    sunMass: z.number().finite().positive(),
    mercurial: z
      .object({
        referenceRadius: z.literal(27),
        referenceMass: z.number().finite().positive(),
        coreFraction: z.number().finite().min(0).max(1),
      })
      .strict(),
    planetMass: z
      .record(z.string(), z.number().finite().positive())
      .refine(
        (masses) => !("moon" in masses),
        "Mercurial mass belongs to the family profile",
      ),
    /** Practice-only overrides for non-family planets. */
    practicePlanetMass: z
      .record(z.string(), z.number().finite().positive())
      .refine(
        (masses) => !("moon" in masses),
        "Mercury uses the shared family profile",
      )
      .optional(),
  })
  .strict();
export type GravityTuning = z.infer<typeof GravityTuningSchema>;
