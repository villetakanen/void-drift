import { Vec2 } from "@void-drift/core";
import { CHASSIS, engineImpulse } from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
	BenchSettings,
	DT,
	type Sample,
	sequence,
	TOTAL_TICKS,
} from "./movement-bench";

export const DirectionalSettings = BenchSettings.extend({
	bonus: z.number().finite().min(0).max(2).default(0.4),
	falloff: z.number().finite().min(0.05).max(4).default(0.8),
});
export const ceilingVariants = [
	{ label: "1 aft", sides: false, aft: 1, color: "#5ce5e7" },
	{ label: "2 aft", sides: false, aft: 2, color: "#ff83b5" },
	{ label: "2 side", sides: true, aft: 0, color: "#ffbd69" },
	{ label: "2 aft + 2 side", sides: true, aft: 2, color: "#c8fa64" },
	{
		label: "Artificial side pair · 50%",
		sides: false,
		aft: 0,
		color: "#c49bff",
	},
];
export function ceilingFor(
	strength: number,
	base: number,
	bonus = 0.4,
	falloff = 0.8,
) {
	if (strength > 0 && strength < 1) return base * strength;
	return strength <= 0
		? 0
		: base * (1 + bonus * (1 - Math.exp(-falloff * (strength - 1))));
}
export function simulateCeilings(raw: unknown): Sample[][] {
	const { acceleration, maxSpeed, bonus, falloff } =
		DirectionalSettings.parse(raw);
	const chassis = CHASSIS.balanced;
	const angle = (chassis.angle * Math.PI) / 180;
	const turnRate =
		(acceleration *
			chassis.turnResponse *
			(Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
		chassis.length ** 2;
	return ceilingVariants.map((variant, index) => {
		const reference = index === 4;
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 1,
		};
		let distance = 0;
		const forceAt = (tick: number) => {
			const { left, right } = sequence(Math.min(tick, TOTAL_TICKS - 1));
			const l = Number(variant.sides && left),
				r = Number(variant.sides && right);
			const x = (l + r) * Math.cos(angle) + (left && right ? variant.aft : 0);
			const y = (l - r) * Math.sin(angle);
			return { x, y, strength: Math.hypot(x, y), turn: l - r };
		};
		const samples: Sample[] = [];
		const record = (tick: number) =>
			samples.push({
				x: ship.pos.x,
				y: ship.pos.y,
				heading: ship.rotation,
				speed: ship.vel.mag(),
				distance,
				...(reference
					? {}
					: {
							ceiling: ceilingFor(
								forceAt(tick).strength,
								maxSpeed,
								bonus,
								falloff,
							),
						}),
			});
		record(0);
		for (let tick = 0; tick < TOTAL_TICKS; tick++) {
			const force = forceAt(tick);
			const limit = ceilingFor(force.strength, maxSpeed, bonus, falloff);
			for (let sub = 0; sub < 4; sub++) {
				const dt = DT / 4;
				if (reference) {
					const { left, right } = sequence(tick);
					ship.rotation += (Number(left) - Number(right)) * turnRate * 0.5 * dt;
					if (left || right) {
						const speed =
							0.5 * ceilingFor(2 * Math.cos(angle), maxSpeed, bonus, falloff);
						ship.vel.x = Math.cos(ship.rotation) * speed;
						ship.vel.y = Math.sin(ship.rotation) * speed;
					}
				}
				ship.rotation += force.turn * turnRate * dt;
				if (force.strength > 0)
					engineImpulse(
						ship,
						ship.rotation + Math.atan2(force.y, force.x),
						acceleration * force.strength,
						limit,
						dt,
					);
				ship.pos.x += ship.vel.x * dt;
				ship.pos.y += ship.vel.y * dt;
				distance += ship.vel.mag() * dt;
			}
			record(tick + 1);
		}
		return samples;
	});
}
