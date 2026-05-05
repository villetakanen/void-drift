import { z } from "zod";

export const ShipProfileIdSchema = z.enum(["scout", "balanced", "tank"]);

export const ShipProfileSchema = z.object({
  id: ShipProfileIdSchema,
  name: z.string().min(1),
  thrustMultiplier: z.number().positive(),
  turnMultiplier: z.number().positive(),
  hullMultiplier: z.number().positive(),
  powerDrainMultiplier: z.number().positive(),
  zoomDefault: z.number().positive(),
  tint: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const ShipProfilesSchema = z.array(ShipProfileSchema).length(3);

export type ShipProfileId = z.infer<typeof ShipProfileIdSchema>;
export type ShipProfile = z.infer<typeof ShipProfileSchema>;
