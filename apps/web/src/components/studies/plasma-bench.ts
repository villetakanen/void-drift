import { Vec2 } from "@void-drift/core";
import {
	applyBuildEngines,
	buildStats,
	CHASSIS,
	defaultLoadout,
	type EngineTimers,
	ION_DEFAULTS,
	ionCeiling,
	ionStrength,
	type Loadout,
	LoadoutSchema,
	PARTS,
	PartSchema,
	STABILIZER_STRENGTH,
	stabilizerBurn,
	stabilizerMount,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { DT, type Sample, sequence, TOTAL_TICKS } from "./movement-bench";

export const PlasmaDelaySettings = z.object({
	delay: z.number().finite().min(0.1).max(0.99).multipleOf(0.01).default(0.6),
});
// Small bounded cache: shared baseline and invariant ion runs avoid repeated work.
const runCache = new Map<number, Sample[][]>();
const ionCache = new Map<number, Sample[]>();

const configuration = (
	label: string,
	side: Loadout["side"],
	aft: Loadout["aft"],
	color: string,
) => ({
	label,
	color,
	build: LoadoutSchema.parse({
		...defaultLoadout("balanced"),
		side,
		aft,
		stabilizers: true,
	}),
});
export const plasmaVariants = [
	configuration("2 Light sides", "ion", [null, null], "#5ce5e7"),
	configuration("2 Heavy sides", "heavy-ion", [null, null], "#ffbd69"),
	configuration("2 Plasma sides", "plasma", [null, null], "#c8fa64"),
	configuration(
		"2 Light sides + 2 Light aft",
		"ion",
		["ion", "ion"],
		"#c49bff",
	),
	configuration(
		"2 Light sides + 2 Plasma aft",
		"ion",
		["plasma", "plasma"],
		"#ff7ba5",
	),
	configuration(
		"2 Plasma sides + 2 Plasma aft",
		"plasma",
		["plasma", "plasma"],
		"#83a9ff",
	),
];

// Display diagnostic only: highest currently available family ceiling.
// Mixed engines retain their separate production impulses, never a merged limit.
function availableCeiling(
	build: Loadout,
	timers: EngineTimers,
	tick: number,
	delay: number,
	spin: number,
) {
	const input = sequence(Math.min(tick, TOTAL_TICKS - 1));
	const angle = (CHASSIS.balanced.angle * Math.PI) / 180;
	let ix = 0,
		iy = 0,
		plasma = 0;
	const add = (
		id: Loadout["side"],
		held: boolean,
		key: string,
		direction: number,
	) => {
		if (!held) return;
		const strength = ionStrength(id);
		if (strength) {
			ix += Math.cos(direction) * strength;
			iy += Math.sin(direction) * strength;
		} else if ((timers[key] ?? 0) + 1e-9 >= delay) plasma = PARTS[id].limit;
	};
	add(build.side, input.left, "left", angle);
	add(build.side, input.right, "right", -angle);
	build.aft.forEach((id, index) => {
		if (id === "ion" || id === "heavy-ion" || id === "plasma")
			add(id, input.left && input.right, `aft-${index}`, 0);
	});
	const burn = stabilizerBurn(
		build,
		{ leftThruster: input.left, rightThruster: input.right, fire: false },
		spin,
		DT / 4,
	);
	const mount = stabilizerMount(build.chassis);
	const strength = burn.duty * STABILIZER_STRENGTH;
	ix += strength * mount.fx;
	iy -= burn.side * strength * mount.fy;
	return Math.max(ionCeiling(Math.hypot(ix, iy)), plasma);
}
export function simulatePlasma(raw: unknown = {}): Sample[][] {
	const { delay } = PlasmaDelaySettings.parse(raw);
	const cached = runCache.get(delay);
	if (cached) return cached;
	const parts = {
		...PARTS,
		plasma: PartSchema.parse({ ...PARTS.plasma, chargeSeconds: delay }),
	};
	const result = plasmaVariants.map(({ build }, index) => {
		const ionOnly = ![build.side, ...build.aft].includes("plasma");
		const ionRun = ionCache.get(index);
		if (ionOnly && ionRun) return ionRun;
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
		const timers: EngineTimers = {};
		const motion = { velocity: 0 };
		let distance = 0;
		const samples: Sample[] = [];
		const record = (tick: number) =>
			samples.push({
				x: ship.pos.x,
				y: ship.pos.y,
				heading: ship.rotation,
				speed: ship.vel.mag(),
				distance,
				spin: (motion.velocity * 180) / Math.PI,
				ceiling: availableCeiling(build, timers, tick, delay, motion.velocity),
			});
		record(0);
		for (let tick = 0; tick < TOTAL_TICKS; tick++) {
			const input = sequence(tick);
			for (let sub = 0; sub < 4; sub++) {
				applyBuildEngines(
					ship,
					build,
					{ leftThruster: input.left, rightThruster: input.right, fire: false },
					DT / 4,
					true,
					timers,
					1,
					motion,
					ION_DEFAULTS,
					parts,
				);
				ship.pos.x += (ship.vel.x * DT) / 4;
				ship.pos.y += (ship.vel.y * DT) / 4;
				distance += (ship.vel.mag() * DT) / 4;
			}
			record(tick + 1);
		}
		if (ionOnly) ionCache.set(index, samples);
		return samples;
	});
	if (runCache.size >= 4) {
		const oldest = runCache.keys().next().value;
		if (oldest !== undefined) runCache.delete(oldest);
	}
	runCache.set(delay, result);
	return result;
}
export const plasmaMasses = plasmaVariants.map(
	({ build }) => buildStats(build).mass,
);
