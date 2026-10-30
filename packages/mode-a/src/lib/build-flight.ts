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
export function applyBuildEngines(
	ship: GameObject,
	build: Loadout,
	input: InputState,
	dt: number,
	powered: boolean,
) {
	if (!powered) return { left: 0, right: 0 };
	const stats = buildStats(build),
		chassis = CHASSIS[build.chassis],
		engine = PARTS[build.side];
	const angle = (chassis.angle * Math.PI) / 180;
	const active = Number(input.leftThruster) + Number(input.rightThruster);
	// Direct angular response retains the existing two-button handling model.
	ship.rotation +=
		(Number(input.leftThruster) - Number(input.rightThruster)) *
		stats.turnRate *
		dt;
	const output = { left: 0, right: 0 };
	// Simultaneous mirrored engines are combined to avoid sequential impulse bias.
	if (active === 2) {
		const fraction = engineImpulse(
			ship,
			ship.rotation,
			(2 * engine.thrust * Math.cos(angle)) / stats.mass,
			engine.limit,
			dt,
		);
		output.left = fraction;
		output.right = fraction;
		for (const id of build.aft) {
			if (id && PARTS[id].category === "E")
				engineImpulse(
					ship,
					ship.rotation,
					PARTS[id].thrust / stats.mass,
					PARTS[id].limit,
					dt,
				);
		}
	} else if (active === 1) {
		const side = input.leftThruster ? "left" : "right";
		output[side] = engineImpulse(
			ship,
			ship.rotation + (input.leftThruster ? angle : -angle),
			engine.thrust / stats.mass,
			engine.limit,
			dt,
		);
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
