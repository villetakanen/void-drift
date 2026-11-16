import { z } from "zod";

export const RockBodyLightingSchema = z
  .object({
    incomingIntensity: z.number().finite().min(0).max(2).default(1.35),
    shadowIntensity: z.number().finite().min(0).max(2).default(1.35),
    temperatureK: z.number().finite().min(3500).max(10000).default(5800),
  })
  .strict();

export type RockBodyLighting = z.infer<typeof RockBodyLightingSchema>;

export const DEFAULT_ROCK_BODY_LIGHTING: Readonly<RockBodyLighting> =
  Object.freeze(RockBodyLightingSchema.parse({}));
