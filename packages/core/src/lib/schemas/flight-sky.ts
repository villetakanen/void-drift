import { z } from "zod";

export const SkySeedSchema = z.number().int().min(1).max(2147483647);
export const SkyMaterialSchema = z
  .object({
    reach: z.number().min(0).max(1),
    dustSeed: SkySeedSchema,
  })
  .strict();
export type SkyMaterial = z.infer<typeof SkyMaterialSchema>;
