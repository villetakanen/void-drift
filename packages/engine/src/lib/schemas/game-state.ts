import { z } from 'zod';

export const ResourcesSchema = z.object({
    hull: z.number().min(0).max(100),
    fuel: z.number().min(0).max(100),
});

export type Resources = z.infer<typeof ResourcesSchema>;

export const GameStateSchema = z.object({
    resources: ResourcesSchema,
    // Other game state fields added in PBI-017
});

export type GameState = z.infer<typeof GameStateSchema>;
