import { z } from "zod";

/** Validated input for deterministic default gameplay-system generation. */
export const SolarSystemGenerationSchema = z
  .object({
    seed: z.number().int().min(1).max(2147483647),
    centerX: z.number().finite().default(960),
    centerY: z.number().finite().default(540),
  })
  .strict();
export type SolarSystemGeneration = z.infer<typeof SolarSystemGenerationSchema>;
