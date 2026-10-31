export class Vec2 {
	constructor(
		public x: number,
		public y: number,
	) {}

	add(v: Vec2): Vec2 {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	sub(v: Vec2): Vec2 {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	mult(s: number): Vec2 {
		this.x *= s;
		this.y *= s;
		return this;
	}

	mag(): number {
		return Math.hypot(this.x, this.y);
	}

	normalize(): Vec2 {
		const m = this.mag();
		if (m > 0) {
			this.mult(1 / m);
		}
		return this;
	}

	clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	set(x: number, y: number): Vec2 {
		this.x = x;
		this.y = y;
		return this;
	}
}

export interface GameObject {
	pos: Vec2;
	vel: Vec2;
	acc: Vec2;
	rotation: number; // Radians
	radius: number;
}

export interface Star {
	pos: Vec2;
	radius: number; // Physical radius
	influenceRadius: number; // Gravity well radius
	mass: number; // Gravity strength factor
	color: string;
	glowColor: string;
	type: SunType;
	powerMultiplier: number;
	burnMultiplier: number;
	pulseSpeed: number;
}

export const PlanetWellSchema = z.object({
	reach: z.number().finite().positive(),
	strength: z.number().finite().positive(),
});

export interface Planet {
	well?: z.infer<typeof PlanetWellSchema>; // Explicit independent well parameters when integrated.
	pos: Vec2; // Current position (calculated from orbit)
	orbitCenter: Vec2; // Center of orbit (usually star)
	orbitRadius: number; // Distance from center
	orbitSpeed: number; // Radians per second
	orbitAngle: number; // Current angle
	initialAngle: number; // Starting angle for resets
	radius: number; // Physical size
	mass: number; // Gravity strength
	color: string; // Hex color
	type: string; // Visual type (rock, gas, ocean, etc.)
	hasRing: boolean; // Visual ring system
}

/** Shared circular motion for runtime bodies and design-study observations. */
export function updatePlanetOrbit(planet: Planet, dt: number): void {
	planet.orbitAngle += planet.orbitSpeed * dt;
	planet.pos.x =
		planet.orbitCenter.x + Math.cos(planet.orbitAngle) * planet.orbitRadius;
	planet.pos.y =
		planet.orbitCenter.y + Math.sin(planet.orbitAngle) * planet.orbitRadius;
}

export interface CollisionEventData {
	color?: string;
	x?: number;
	y?: number;
	impactSpeed?: number;
}

export function getPlanetInfluenceRadius(planet: {
	radius: number;
	mass: number;
	well?: { reach: number; strength: number };
}): number {
	if (planet.well) return planet.well.reach;
	const massInfluence = Math.sqrt(planet.mass) * 10;
	const maxInfluence = planet.radius * 8;
	const minInfluence = planet.radius * 2;
	return Math.max(minInfluence, Math.min(massInfluence, maxInfluence));
}

import { z } from "zod";
import { CONFIG, SURVIVAL_CONFIG } from "../config";

export const FlightResistanceSchema = z.object({
	drag: z.number().finite().nonnegative(),
	speedLimit: z.number().finite().positive().nullable(),
});
export type FlightResistance = z.infer<typeof FlightResistanceSchema>;
export const GravityFlightSchema = z.object({
	engineSpeedScale: z.number().finite().positive(),
	sunMultiplier: z.number().min(4).max(10),
	planetStrength: z.number().finite().positive(),
});
/** Along-motion thrust fades; braking and transverse thrust retain full effectiveness. */
export function engineEffectiveness(
	velocity: Vec2,
	direction: Vec2,
	speedScale: number,
): number {
	const along = Math.max(
		0,
		velocity.x * direction.x + velocity.y * direction.y,
	);
	return 1 / (1 + (along / speedScale) ** 2);
}

export const WellCurveSchema = z.enum(["linear", "inverse-square"]);
export type WellCurve = z.infer<typeof WellCurveSchema>;

/** Study comparison: both curves have acceleration strength / 2 at reach / 2. */
export function wellAcceleration(
	distance: number,
	reach: number,
	strength: number,
	curve: WellCurve,
): number {
	if (distance <= 0 || distance >= reach) return 0;
	return curve === "inverse-square"
		? (strength / 6) * ((reach / distance) ** 2 - 1)
		: strength * (1 - distance / reach);
}

import type { InputState } from "../entities/Input";
import type { Resources } from "../schemas/common";
import type { SunType } from "../schemas/sun";

export function updatePower(
	resources: Resources,
	distanceToSun: number,
	sun: Star,
	deltaTime: number,
	thrustState: { left: boolean; right: boolean } = {
		left: false,
		right: false,
	},
	drainMultiplier = 1,
): void {
	const dt = deltaTime; // Already in seconds

	// Consumption - varies based on thrust
	let consumptionRate: number = SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE;
	if (thrustState.left && thrustState.right) {
		consumptionRate = SURVIVAL_CONFIG.POWER_CONSUMPTION_DUAL_THRUST;
	} else if (thrustState.left || thrustState.right) {
		consumptionRate = SURVIVAL_CONFIG.POWER_CONSUMPTION_SINGLE_THRUST;
	}
	resources.power -= consumptionRate * drainMultiplier * dt;

	// Regeneration (sun proximity)
	const radiusScale = sun.radius / 40; // 40 = baseline (yellow dwarf)
	let regenRate = 0;
	if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * radiusScale) {
		regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_1;
	} else if (
		distanceToSun <
		SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS * radiusScale
	) {
		regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_2;
	} else if (
		distanceToSun <
		SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * radiusScale
	) {
		regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_3;
	}

	resources.power += regenRate * sun.powerMultiplier * dt;

	// Clamp
	resources.power = Math.max(0, Math.min(100, resources.power));
}

export function updateHull(
	resources: Resources,
	distanceToSun: number,
	sun: Star,
	deltaTime: number,
	hullMultiplier = 1,
): void {
	const dt = deltaTime;

	// Star contact = instant death
	if (distanceToSun < sun.radius) {
		resources.hull = 0;
		return;
	}

	// Sun proximity burn
	const radiusScale = sun.radius / 40; // 40 = baseline (yellow dwarf)
	let burnRate = 0;
	if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * radiusScale) {
		burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_1;
	} else if (
		distanceToSun <
		SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS * radiusScale
	) {
		burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_2;
	} else if (
		distanceToSun <
		SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * radiusScale
	) {
		burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_3;
	}

	resources.hull -= (burnRate * sun.burnMultiplier * dt) / hullMultiplier;

	// Clamp
	resources.hull = Math.max(0, Math.min(100, resources.hull));
}

export function applyPlanetCollisionDamage(resources: Resources): void {
	resources.hull -= SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE;
	resources.hull = Math.max(0, resources.hull);
}

export function updateShip(
	ship: GameObject,
	input: InputState,
	dt: number,
	width: number,
	height: number,
	star?: Star,
	planets: Planet[] = [],
	resources?: Resources,
	onCollision?: (
		type: "planet" | "star",
		magnitude: number,
		data?: CollisionEventData,
	) => void,
	tuning = { thrustMultiplier: 1, turnMultiplier: 1, hullMultiplier: 1 },
	resistance: FlightResistance = {
		drag: CONFIG.SHIP_DRAG,
		speedLimit: CONFIG.MAX_SPEED,
	},
	wellCurve: WellCurve = "linear",
	engineSpeedScale: number | null = null,
	engineCutoff: number | null = null,
) {
	// 1. Rotation & Variable Thrust (Differential)
	// Left Engine -> Rotate Right + 50% Thrust
	// Right Engine -> Rotate Left + 50% Thrust
	// Both -> 100% Thrust, No Rotate (impulses cancel out rotation)

	let thrustMultiplier = 0.0;

	if (input.leftThruster && input.rightThruster) {
		// Both active: Standard thrust, no rotation
		thrustMultiplier = 1.0;
	} else if (input.leftThruster) {
		// Left only: Rotate + Double Thrust (was 0.5)
		ship.rotation += CONFIG.ROTATION_SPEED * tuning.turnMultiplier * dt;
		thrustMultiplier = 1.0;
	} else if (input.rightThruster) {
		// Right only: Rotate + Double Thrust (was 0.5)
		ship.rotation -= CONFIG.ROTATION_SPEED * tuning.turnMultiplier * dt;
		thrustMultiplier = 1.0;
	}

	let deliveredFraction = thrustMultiplier;
	if (engineCutoff !== null && thrustMultiplier > 0) {
		const along =
			ship.vel.x * Math.cos(ship.rotation) +
			ship.vel.y * Math.sin(ship.rotation);
		const active = Number(input.leftThruster) + Number(input.rightThruster);
		const full = (CONFIG.THRUST_FORCE * tuning.thrustMultiplier * active) / 2;
		const taper = Math.max(0, 1 - Math.max(0, along) / engineCutoff);
		deliveredFraction =
			full > 0
				? Math.min(taper, Math.max(0, engineCutoff - along) / (full * dt))
				: 0;
		thrustMultiplier = (active / 2) * deliveredFraction;
	} else if (engineSpeedScale !== null && thrustMultiplier > 0) {
		deliveredFraction = engineEffectiveness(
			ship.vel,
			new Vec2(Math.cos(ship.rotation), Math.sin(ship.rotation)),
			engineSpeedScale,
		);
		thrustMultiplier *= deliveredFraction;
		if (!(input.leftThruster && input.rightThruster)) thrustMultiplier *= 0.5;
	}
	// Apply Thrust
	if (thrustMultiplier > 0) {
		const thrustX =
			Math.cos(ship.rotation) *
			CONFIG.THRUST_FORCE *
			thrustMultiplier *
			tuning.thrustMultiplier;
		const thrustY =
			Math.sin(ship.rotation) *
			CONFIG.THRUST_FORCE *
			thrustMultiplier *
			tuning.thrustMultiplier;
		ship.acc.x += thrustX;
		ship.acc.y += thrustY;
	}

	// 2. Gravity Well (Star)
	// Apply force if within influence radius
	if (star) {
		const distVec = star.pos.clone().sub(ship.pos);
		const dist = distVec.mag();

		if (dist < star.influenceRadius && dist > star.radius) {
			// Normalize direction
			distVec.normalize();

			const strength = wellAcceleration(
				dist,
				star.influenceRadius,
				star.mass,
				wellCurve,
			);

			ship.acc.add(distVec.mult(strength));
		}
	}

	// 3. Planet Interaction (Gravity + Collision)
	for (const planet of planets) {
		// Update Planet Position (Orbit)
		updatePlanetOrbit(planet, dt);

		const dx = planet.pos.x - ship.pos.x;
		const dy = planet.pos.y - ship.pos.y;
		const distSq = dx * dx + dy * dy;
		const dist = Math.sqrt(distSq);

		// Gravity influence is mass-based, capped at radius * 8
		const influenceRadius = getPlanetInfluenceRadius(planet);

		if (dist < influenceRadius && dist > planet.radius + ship.radius) {
			const strength = planet.well
				? wellAcceleration(
						dist,
						planet.well.reach,
						planet.well.strength,
						"inverse-square",
					)
				: (planet.mass / distSq) * 1000;
			const gravityX = (dx / dist) * strength;
			const gravityY = (dy / dist) * strength;
			ship.acc.x += gravityX;
			ship.acc.y += gravityY;
		}

		// Collision (Elastic Bounce)
		const minDist = planet.radius + ship.radius;
		if (dist < minDist) {
			const impactSpeed = Math.hypot(ship.vel.x, ship.vel.y);
			const impactMagnitude = Math.max(0.1, Math.min(1, impactSpeed / 550));

			// Resolve overlap
			const overlap = minDist - dist;
			const nx = dist > 0 ? dx / dist : 1; // Vector pointing towards planet
			const ny = dist > 0 ? dy / dist : 0;

			// Push ship out
			ship.pos.x -= nx * overlap;
			ship.pos.y -= ny * overlap;

			// Reflect Velocity
			// V' = V - 2(V . N)N
			// We want N to be the normal of the reflection surface (pointing OUT from planet)
			// So normal = -n
			const normalX = -nx;
			const normalY = -ny;

			const dot = ship.vel.x * normalX + ship.vel.y * normalY;

			// Restitution (bounciness)
			const restitution = 0.8;

			ship.vel.x = (ship.vel.x - 2 * dot * normalX) * restitution;
			ship.vel.y = (ship.vel.y - 2 * dot * normalY) * restitution;

			if (resources) {
				resources.hull = Math.max(
					0,
					resources.hull -
						SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE / tuning.hullMultiplier,
				);
			}

			if (onCollision) {
				onCollision("planet", impactMagnitude, {
					color: planet.color,
					x: ship.pos.x,
					y: ship.pos.y,
					impactSpeed,
				});
			}
		}
	}

	// 4. Integration
	// vel += acc * dt

	ship.vel.x += ship.acc.x * dt;
	ship.vel.y += ship.acc.y * dt;

	// 5. Inertia Damping (Drag)
	// Approx nonlinear drag: vel -= vel * DRAG * dt
	// Or VEL *= (1 - DRAG * dt)
	const dragFactor = 1 - resistance.drag * dt;
	ship.vel.mult(Math.max(0, dragFactor)); // Prevent negative reversal if low FPS

	// 6. Max Speed Cap
	if (
		resistance.speedLimit !== null &&
		ship.vel.mag() > resistance.speedLimit
	) {
		ship.vel.normalize().mult(resistance.speedLimit);
	}

	// pos += vel * dt
	ship.pos.x += ship.vel.x * dt;
	ship.pos.y += ship.vel.y * dt;

	ship.acc.set(0, 0);

	// 7. Wrapping (Circular Arena - R=1200)
	const centerX = width / 2;
	const centerY = height / 2;
	const dx = ship.pos.x - centerX;
	const dy = ship.pos.y - centerY;
	const distSq = dx * dx + dy * dy;
	const radiusSq = 1200 * 1200;

	if (distSq > radiusSq) {
		// Antipodal Wrap: Teleport to opposite side
		// Preserve velocity (so it points inward from the other side)

		// To prevent getting stuck in a loop due to floating point precision,
		// wrap slightly inside the circle (0.99)
		const distance = Math.hypot(dx, dy);
		ship.pos.x = centerX - (dx / distance) * 1190;
		ship.pos.y = centerY - (dy / distance) * 1190;
	}
	return deliveredFraction;
}
