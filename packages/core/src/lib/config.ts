export const CONFIG = {
    // Physics
    SHIP_DRAG: 0.25, // Damping factor per second (vel -= vel * DRAG * dt)
    ROTATION_SPEED: 2.25, // Radians per second
    THRUST_FORCE: 400.0, // Pixels per second squared
    MAX_SPEED: 1000.0, // Max pixels per second

    // Game
    SHIP_RADIUS: 16,
    FIELD_OF_VIEW: 2.0, // Camera zoom level (1.0 = normal)
} as const;

export const SURVIVAL_CONFIG = {
    INITIAL_HULL: 100,
    INITIAL_POWER: 100,
    POWER_CONSUMPTION_RATE: 1.0,
    POWER_CONSUMPTION_SINGLE_THRUST: 2.0,
    POWER_CONSUMPTION_DUAL_THRUST: 2.75,

    POWER_ZONE_1_RADIUS: 100,
    POWER_ZONE_2_RADIUS: 170,
    POWER_ZONE_3_RADIUS: 240,

    POWER_REGEN_ZONE_1: 4.0,
    POWER_REGEN_ZONE_2: 2.0,
    POWER_REGEN_ZONE_3: 0.5,

    HULL_BURN_ZONE_1: 1.5,
    HULL_BURN_ZONE_2: 0.5,
    HULL_BURN_ZONE_3: 0.1,

    PLANET_COLLISION_DAMAGE: 7,
} as const;
