import { z } from 'zod';

export const SunTypeSchema = z.enum(['O', 'B', 'A', 'F', 'G', 'K', 'M']);
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
