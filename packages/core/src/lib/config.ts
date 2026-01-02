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

    SCREEN_SHAKE: {
        maxOffset: 4, // pixels
        decay: 2.0, // trauma units per second
        frequency: 30, // Hz
    },

    TRAUMA_VALUES: {
        planetCollision: 0.6, // High impact
        sunProximity: 0.3, // Medium (when entering danger zone)
        boost: 0.1, // Low (subtle feedback on thrust)
    },
} as const;

export const SUN_CONFIG = {
    O: {
        type: 'O',
        size: 100,
        radius: 105,
        color: '#00ffff',
        glowColor: '#ffffff',
        mass: 3000,
        powerMultiplier: 4.5,
        burnMultiplier: 6.5,
        pulseSpeed: 4.5,
    },
    B: {
        type: 'B',
        size: 85,
        radius: 80,
        color: '#00ccff',
        glowColor: '#ffffff',
        mass: 2000,
        powerMultiplier: 3.2,
        burnMultiplier: 4.0,
        pulseSpeed: 3.2,
    },
    A: {
        type: 'A',
        size: 70,
        radius: 60,
        color: '#ffffff',
        glowColor: '#ccf0ff',
        mass: 1500,
        powerMultiplier: 2.2,
        burnMultiplier: 2.5,
        pulseSpeed: 2.2,
    },
    F: {
        type: 'F',
        size: 55,
        radius: 45,
        color: '#ffffcc',
        glowColor: '#ffff00',
        mass: 1000,
        powerMultiplier: 1.5,
        burnMultiplier: 1.5,
        pulseSpeed: 1.5,
    },
    G: {
        type: 'G',
        size: 40,
        radius: 35,
        color: '#ffaa00',
        glowColor: '#ffaa00',
        mass: 600,
        powerMultiplier: 1.0,
        burnMultiplier: 1.0,
        pulseSpeed: 1.0,
    },
    K: {
        type: 'K',
        size: 25,
        radius: 25,
        color: '#ff8800',
        glowColor: '#ff4400',
        mass: 300,
        powerMultiplier: 0.6,
        burnMultiplier: 0.5,
        pulseSpeed: 0.6,
    },
    M: {
        type: 'M',
        size: 1,
        radius: 15,
        color: '#ff4400',
        glowColor: '#ff0000',
        mass: 150,
        powerMultiplier: 0.4,
        burnMultiplier: 0.3,
        pulseSpeed: 0.3,
    },
} as const;
