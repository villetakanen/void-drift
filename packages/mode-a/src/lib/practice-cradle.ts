/**
 * Practice's outer world, derived from Earth's ratios to Mercury as Venus was.
 * Spec: docs/specs/game/world/planets/spec.md#practice-cradle.
 */
export const PRACTICE_CRADLE_RADIUS = 27 * (1 + (6371 / 2440 - 1) / 3);
export const PRACTICE_CRADLE_ORBIT = (258 * 149.6) / 57.9;
export const PRACTICE_CRADLE_TRAVEL_SPEED = (4 * 29.78) / 47.4;
/** The clouds' turn: Mercury's 31.3 s, a third slower. */
export const PRACTICE_CRADLE_CLOUD_SPIN_SECONDS = 31.3 * 1.5;
/** The ground turns at half the clouds' speed. */
export const PRACTICE_CRADLE_SPIN_SECONDS =
  2 * PRACTICE_CRADLE_CLOUD_SPIN_SECONDS;
/** The cloud surface sits at this fraction of the air depth above the ground. */
export const PRACTICE_CRADLE_CLOUD_HEIGHT = 2 / 5;
/** Shown on the stock disc when the maps cannot be prepared. */
export const PRACTICE_CRADLE_COLOR = "#4A90C2";
