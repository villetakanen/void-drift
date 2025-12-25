import { z } from 'zod';

export const DeathCauseSchema = z.enum(['STAR', 'HULL', 'POWER']);
export type DeathCause = z.infer<typeof DeathCauseSchema>;

export const ResourcesSchema = z.object({
    hull: z.number().min(0).max(100),
    power: z.number().min(0).max(100),
});

export type Resources = z.infer<typeof ResourcesSchema>;
