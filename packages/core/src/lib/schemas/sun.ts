import { z } from "zod";

export const SunTypeSchema = z.enum(["O", "B", "A", "F", "G", "K", "M"]);
export type SunType = z.infer<typeof SunTypeSchema>;

export const SunConfigSchema = z.object({
  type: SunTypeSchema,
  size: z.number().int().min(1).max(100),
  radius: z.number().positive(),
  color: z.string(),
  glowColor: z.string(),
  mass: z.number().positive(),
  powerMultiplier: z.number().positive(),
  burnMultiplier: z.number().positive(),
  pulseSpeed: z.number().positive(),
});
export type SunConfig = z.infer<typeof SunConfigSchema>;

/** A centre-distance field: plateau through shoulder, then linear to its edge. */
export const EnergyFieldShape = z
  .object({
    reach: z.number().finite().positive(),
    shoulder: z.number().finite().nonnegative(),
    peak: z.number().finite().nonnegative(),
    outerFraction: z.number().finite().min(0).max(1),
  })
  .strict();
export const validFieldReach = (field: { shoulder: number; reach: number }) =>
  field.shoulder < field.reach;
export const EnergyFieldSchema = EnergyFieldShape.refine(validFieldReach, {
  message: "Shoulder must end inside field reach",
  path: ["shoulder"],
});
export type EnergyField = z.infer<typeof EnergyFieldSchema>;

export const PositionedEnergyFieldSchema = EnergyFieldShape.extend({
  x: z.number().finite(),
  y: z.number().finite(),
})
  .strict()
  .refine(validFieldReach, {
    path: ["shoulder"],
    message: "Shoulder must end inside field reach",
  });
