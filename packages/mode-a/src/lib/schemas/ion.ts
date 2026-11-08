import { z } from "zod";

/** Trial values, not final flight balance. Acceleration is at 115 reference mass. */
export const IonSettingsSchema = z.object({
  acceleration: z.number().finite().min(1).max(2000).default(220),
  maxSpeed: z.number().finite().min(1).max(2000).default(340),
  bonus: z.number().finite().min(0).max(2).default(0.4),
  falloff: z.number().finite().min(0.01).max(5).default(0.8),
  maxTurn: z.number().finite().min(1).max(720).default(180),
});
export type IonSettings = z.infer<typeof IonSettingsSchema>;
export const ION_DEFAULTS = IonSettingsSchema.parse({});
export const AssembledIonSettingsSchema = z
  .object({
    acceleration: z.number().finite().min(1).max(2000).default(220),
    maxTurn: z.number().finite().min(1).max(720).default(180),
  })
  .strict();
export type AssembledIonSettings = z.infer<typeof AssembledIonSettingsSchema>;
export const ASSEMBLED_ION_DEFAULTS = AssembledIonSettingsSchema.parse({});
export const ION_REFERENCE_MASS = 115;
export const STABILIZER_STRENGTH = 0.22;
export const STABILIZER_ENERGY = 0.25;
export function ionStrength(id: string) {
  return id === "ion" ? 1 : id === "heavy-ion" ? 1.75 : 0;
}
export function ionCeiling(
  strength: number,
  settings: IonSettings = ION_DEFAULTS,
) {
  return (
    settings.maxSpeed *
    (strength <= 1
      ? Math.max(0, strength)
      : 1 + settings.bonus * (1 - Math.exp(-settings.falloff * (strength - 1))))
  );
}
