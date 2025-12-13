export class Vec2 {
	constructor(
		public x: number,
		public y: number,
	) { }

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

import { CONFIG } from "../config";
import type { InputState } from "./Input";

export function updateShip(
	ship: GameObject,
	input: InputState,
	dt: number,
	width: number,
	height: number,
) {
	// 1. Rotation & Variable Thrust (Differential)
	// Left Engine -> Rotate Right + 50% Thrust
	// Right Engine -> Rotate Left + 50% Thrust
	// Both -> 100% Thrust, No Rotate (impulses cancel out rotation)

	let thrustMultiplier = 0.0;

	if (input.leftThruster) {
		ship.rotation += CONFIG.ROTATION_SPEED * dt;
		thrustMultiplier += 0.5;
	}
	if (input.rightThruster) {
		ship.rotation -= CONFIG.ROTATION_SPEED * dt;
		thrustMultiplier += 0.5;
	}

	// Apply Thrust
	if (thrustMultiplier > 0) {
		const thrustX = Math.cos(ship.rotation) * CONFIG.THRUST_FORCE * thrustMultiplier;
		const thrustY = Math.sin(ship.rotation) * CONFIG.THRUST_FORCE * thrustMultiplier;
		ship.acc.x += thrustX;
		ship.acc.y += thrustY;
	}

	// 2. Integration
	// vel += acc * dt
	const dVel = ship.acc.clone().mult(dt);
	ship.vel.add(dVel);

	// 3. Inertia Damping (Drag)
	// Approx nonlinear drag: vel -= vel * DRAG * dt
	// Or VEL *= (1 - DRAG * dt)
	const dragFactor = 1 - CONFIG.SHIP_DRAG * dt;
	ship.vel.mult(Math.max(0, dragFactor)); // Prevent negative reversal if low FPS

	// 4. Max Speed Cap
	if (ship.vel.mag() > CONFIG.MAX_SPEED) {
		ship.vel.normalize().mult(CONFIG.MAX_SPEED);
	}

	// pos += vel * dt
	const dPos = ship.vel.clone().mult(dt);
	ship.pos.add(dPos);

	ship.acc.set(0, 0);

	// 4. Wrapping
	if (ship.pos.x > width) ship.pos.x = 0;
	else if (ship.pos.x < 0) ship.pos.x = width;

	if (ship.pos.y > height) ship.pos.y = 0;
	else if (ship.pos.y < 0) ship.pos.y = height;
}
