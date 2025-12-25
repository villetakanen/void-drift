import type { GameState, DeathCause } from "../schemas/game-state";
import { SURVIVAL_CONFIG } from "@void-drift/core";
import type { GameObject, Star } from "@void-drift/core";

export function checkDeath(
  state: GameState,
  ship: GameObject,
  star: Star,
): DeathCause | null {
  // Priority: STAR > HULL > POWER

  // 1. Star contact (instant death)
  const distanceToStar = Math.hypot(
    ship.pos.x - star.pos.x,
    ship.pos.y - star.pos.y,
  );

  if (distanceToStar < star.radius) {
    return "STAR";
  }

  // 2. Hull depletion
  if (state.resources.hull <= 0) {
    return "HULL";
  }

  // 3. Power depletion
  if (state.resources.power <= 0) {
    return "POWER";
  }

  return null;
}

export function handleDeath(
  state: GameState,
  cause: DeathCause,
  ship: GameObject,
): void {
  state.status = "GAME_OVER";
  state.deathCause = cause;

  // Freeze ship momentum
  ship.vel.x = 0;
  ship.vel.y = 0;
}

export function updateTimer(state: GameState): void {
  // Update elapsed time during gameplay
  if (state.status === "PLAYING" && state.startTime !== null) {
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
  }
}

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private callback: (dt: number) => void;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
  }

  private loop(time: number) {
    if (!this.running) return;

    // Calculate Delta Time in Seconds
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap dt to prevent huge jumps (e.g. if tab was backgrounded)
    const safeDt = Math.min(dt, 0.1);

    this.callback(safeDt);

    requestAnimationFrame(this.loop.bind(this));
  }
}
