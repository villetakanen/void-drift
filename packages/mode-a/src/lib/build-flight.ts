import type { GameObject, InputState, Star } from "@void-drift/core";
import { SURVIVAL_CONFIG } from "@void-drift/core";
import { buildStats, CHASSIS, type Loadout, PARTS } from "./schemas/loadout";

/** One engine impulse: transverse steering may rotate, never inflate overspeed. */
export function engineImpulse(
	ship: GameObject,
	direction: number,
	acceleration: number,
	limit: number,
	dt: number,
) {
	const speed = ship.vel.mag();
	const dx = Math.cos(direction),
		dy = Math.sin(direction);
	const along = speed > 0 ? (ship.vel.x * dx + ship.vel.y * dy) / speed : 0;
	const taper = Math.max(0, 1 - speed / limit);
	const radial = acceleration * along;
	let ax = acceleration * dx,
		ay = acceleration * dy;
	if (speed > 0 && radial > 0) {
		ax -= (ship.vel.x / speed) * radial * (1 - taper);
		ay -= (ship.vel.y / speed) * radial * (1 - taper);
	}
	ship.vel.x += ax * dt;
	ship.vel.y += ay * dt;
	const next = ship.vel.mag();
	// Even a perpendicular finite impulse adds energy unless normalized.
	const allowed = Math.max(speed, limit);
	if (next > allowed) ship.vel.mult(allowed / next);
	return Math.hypot(ax, ay) / acceleration;
}
export type EngineTimers = Record<string, number>;
/** Actual elapsed time, independent of fractional energy delivery. */
export function engineDuty(
	part: (typeof PARTS)[keyof typeof PARTS],
	held: boolean,
	dt: number,
	timers: EngineTimers,
	key: string,
) {
	const start = timers[key] ?? 0;
	if (!held) {
		// Releasing cuts thrust immediately but cannot bypass fusion recovery.
		timers[key] =
			part.response === "pulse" && start > 0 && start + dt < part.pulsePeriod
				? start + dt
				: 0;
		return 0;
	}
	timers[key] =
		part.response === "pulse" ? (start + dt) % part.pulsePeriod : start + dt;
	if (part.response === "delayed")
		return start + 1e-9 >= part.chargeSeconds ? 1 : 0;
	if (part.response === "pulse")
		return start % part.pulsePeriod < part.pulseOn ? 1 : 0;
	return 1;
}
export function applyBuildEngines(
	ship: GameObject,
	build: Loadout,
	input: InputState,
	dt: number,
	powered: boolean,
	timers: EngineTimers = {},
	powerFraction = 1,
) {
	const output = { left: 0, right: 0, aft: build.aft.map(() => 0) };
	const stats = buildStats(build),
		chassis = CHASSIS[build.chassis],
		engine = PARTS[build.side];
	const angle = (chassis.angle * Math.PI) / 180;
	const left = engineDuty(
		engine,
		powered && input.leftThruster,
		dt,
		timers,
		"left",
	);
	const right = engineDuty(
		engine,
		powered && input.rightThruster,
		dt,
		timers,
		"right",
	);
	const impulse = (direction: number, thrust: number, limit: number) =>
		thrust > 0
			? engineImpulse(
					ship,
					direction,
					thrust / stats.mass,
					limit,
					dt * powerFraction,
				)
			: 0;
	ship.rotation += (left - right) * stats.turnRate * dt * powerFraction;
	if (left === right && left > 0) {
		output.left = output.right =
			impulse(
				ship.rotation,
				2 * engine.thrust * Math.cos(angle) * left,
				engine.limit,
			) * left;
	} else {
		if (left)
			output.left =
				impulse(ship.rotation + angle, engine.thrust * left, engine.limit) *
				left;
		if (right)
			output.right =
				impulse(ship.rotation - angle, engine.thrust * right, engine.limit) *
				right;
	}
	for (const [index, id] of build.aft.entries()) {
		if (!id || PARTS[id].category !== "E") continue;
		const part = PARTS[id];
		const duty = engineDuty(
			part,
			powered && input.leftThruster && input.rightThruster,
			dt,
			timers,
			`aft-${index}`,
		);
		output.aft[index] =
			impulse(ship.rotation, part.thrust * duty, part.limit) * duty;
	}
	return output;
}
export function solarCharge(distance: number, star: Star, coils: number) {
	const scale = star.radius / 40;
	const rate =
		distance < SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * scale
			? SURVIVAL_CONFIG.POWER_REGEN_ZONE_1
			: distance < SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS * scale
				? SURVIVAL_CONFIG.POWER_REGEN_ZONE_2
				: distance < SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * scale
					? SURVIVAL_CONFIG.POWER_REGEN_ZONE_3
					: 0;
	return rate * star.powerMultiplier * coils;
}
export function buildDrain(build: Loadout, input: InputState) {
	const count = Number(input.leftThruster) + Number(input.rightThruster);
	return (
		3 +
		count * PARTS[build.side].draw +
		(count === 2
			? build.aft.reduce((sum, id) => sum + (id ? PARTS[id].draw : 0), 0)
			: 0)
	);
}
