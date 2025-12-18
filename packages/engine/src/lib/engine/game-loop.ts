import type { GameState, DeathCause } from '../schemas/game-state';
import type { GameObject, Star } from './Physics';

export function checkDeath(
    state: GameState,
    ship: GameObject,
    star: Star
): DeathCause | null {
    // Priority: STAR > HULL > POWER

    // 1. Star contact (instant death)
    const distanceToStar = Math.hypot(
        ship.pos.x - star.pos.x,
        ship.pos.y - star.pos.y
    );

    if (distanceToStar < star.radius) {
        return 'STAR';
    }

    // 2. Hull depletion
    if (state.resources.hull <= 0) {
        return 'HULL';
    }

    // 3. Power depletion
    if (state.resources.power <= 0) {
        return 'POWER';
    }

    return null;
}

export function handleDeath(state: GameState, cause: DeathCause, ship: GameObject): void {
    state.status = 'GAME_OVER';
    state.deathCause = cause;

    // Freeze ship momentum
    ship.vel.x = 0;
    ship.vel.y = 0;
}

export function updateTimer(state: GameState, inputActive: boolean): void {
    // Start timer on first input
    if (state.status === 'MENU' && inputActive) {
        state.status = 'PLAYING';
        state.startTime = Date.now();
    }

    // Update elapsed time during gameplay
    if (state.status === 'PLAYING' && state.startTime !== null) {
        state.elapsedTime = (Date.now() - state.startTime) / 1000;
    }
}
