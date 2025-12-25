import { z } from 'zod';
import { ResourcesSchema, DeathCauseSchema } from '@void-drift/core';

export const GameStateSchema = z.object({
    status: z.enum(['MENU', 'PLAYING', 'GAME_OVER', 'SETTINGS']),
    startTime: z.number().nullable(), // Unix timestamp (ms)
    elapsedTime: z.number(),          // Seconds (float)
    resources: ResourcesSchema,
    deathCause: DeathCauseSchema.nullable(),
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
