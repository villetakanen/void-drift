export const CONFIG = {
	// Physics
	SHIP_DRAG: 0.5, // Damping factor per second (vel -= vel * DRAG * dt)
	ROTATION_SPEED: 3.0, // Radians per second
	THRUST_FORCE: 200.0, // Pixels per second squared
	MAX_SPEED: 500.0, // Max pixels per second

	// Game
	SHIP_RADIUS: 16,
	FIELD_OF_VIEW: 2.0, // Camera zoom level (1.0 = normal)
} as const;
