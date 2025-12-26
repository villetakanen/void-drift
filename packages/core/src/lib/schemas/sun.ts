import { z } from 'zod';

export const SunTypeSchema = z.enum(['RED_GIANT', 'YELLOW_DWARF', 'BLUE_DWARF']);
export type SunType = z.infer<typeof SunTypeSchema>;

export const SunConfigSchema = z.object({
    type: SunTypeSchema,
    radius: z.number().positive(),
    color: z.string(),
    glowColor: z.string(),
    mass: z.number().positive(),
    powerMultiplier: z.number().positive(),
    burnMultiplier: z.number().positive(),
    pulseSpeed: z.number().positive(),
});
export type SunConfig = z.infer<typeof SunConfigSchema>;
