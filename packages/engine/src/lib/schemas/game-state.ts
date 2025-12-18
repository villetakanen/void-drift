import { z } from 'zod';

export const ResourcesSchema = z.object({
    hull: z.number().min(0).max(100),
    power: z.number().min(0).max(100),
});

export type Resources = z.infer<typeof ResourcesSchema>;

export const GameStateSchema = z.object({
    status: z.enum(['MENU', 'PLAYING', 'GAME_OVER', 'SETTINGS']),
    startTime: z.number().nullable(), // Unix timestamp (ms)
    elapsedTime: z.number(),          // Seconds (float)
    resources: ResourcesSchema,
    deathCause: z.enum(['STAR', 'HULL', 'POWER']).nullable(),
});

export type GameState = z.infer<typeof GameStateSchema>;
export type GameStatus = GameState['status'];
export type DeathCause = NonNullable<GameState['deathCause']>;

export function createInitialGameState(): GameState {
    return {
        status: 'MENU',
        startTime: null,
        elapsedTime: 0,
        resources: {
            hull: 100,
            power: 100,
        },
        deathCause: null,
    };
}
