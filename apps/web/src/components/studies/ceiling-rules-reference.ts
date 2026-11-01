import { Vec2 } from "@void-drift/core";
import { CHASSIS, engineImpulse } from "@void-drift/mode-a";
import {
	BenchSettings,
	DT,
	type Sample,
	sequence,
	TOTAL_TICKS,
} from "./movement-bench";

export const ceilingVariants = [
	{ label: "Installed strength", color: "#5ce5e7" },
	{ label: "Active strength", color: "#ffbd69" },
	{ label: "Directional strength", color: "#c8fa64" },
];
// One Light establishes the base; unlimited strength approaches 1.4 times it.
export function ceilingFor(strength: number, base: number) {
	return strength <= 0
		? 0
		: base * (1 + 0.4 * (1 - Math.exp(-0.8 * (strength - 1))));
}
export function simulateCeilings(raw: unknown): Sample[][] {
	const { acceleration, maxSpeed } = BenchSettings.parse(raw);
	const chassis = CHASSIS.balanced;
	const angle = (chassis.angle * Math.PI) / 180;
	const turnRate =
		(acceleration *
			chassis.turnResponse *
			(Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
		chassis.length ** 2;
	return ceilingVariants.map((_, rule) => {
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 1,
		};
		let distance = 0;
		const limitAt = (tick: number) => {
			const { left, right } = sequence(Math.min(tick, TOTAL_TICKS - 1));
			const both = left && right;
			const active = Number(left) + Number(right) + (both ? 2 : 0);
			const directional = both ? 2 + 2 * Math.cos(angle) : active;
			return ceilingFor(
				rule === 0 ? 4 : rule === 1 ? active : directional,
				maxSpeed,
			);
		};
		const samples: Sample[] = [];
		const record = (tick: number) =>
			samples.push({
				x: ship.pos.x,
				y: ship.pos.y,
				heading: ship.rotation,
				speed: ship.vel.mag(),
				distance,
				ceiling: limitAt(tick),
			});
		record(0);
		for (let tick = 0; tick < TOTAL_TICKS; tick++) {
			const { left, right } = sequence(tick);
			const limit = limitAt(tick);
			for (let sub = 0; sub < 4; sub++) {
				const dt = DT / 4;
				ship.rotation += (Number(left) - Number(right)) * turnRate * dt;
				const push = (direction: number, strength: number) =>
					engineImpulse(ship, direction, acceleration * strength, limit, dt);
				if (left && right) {
					push(ship.rotation, 2 * Math.cos(angle));
					push(ship.rotation, 1);
					push(ship.rotation, 1);
				} else if (left) push(ship.rotation + angle, 1);
				else if (right) push(ship.rotation - angle, 1);
				ship.pos.x += ship.vel.x * dt;
				ship.pos.y += ship.vel.y * dt;
				distance += ship.vel.mag() * dt;
			}
			record(tick + 1);
		}
		return samples;
	});
}
