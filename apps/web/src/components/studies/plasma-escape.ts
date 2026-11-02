import { Vec2 } from "@void-drift/core";
import {
	applyBuildEngines,
	buildStats,
	CHASSIS,
	defaultLoadout,
	engineDuty,
	engineImpulse,
	ION_DEFAULTS,
	ION_REFERENCE_MASS,
	ionCeiling,
	LoadoutSchema,
	PARTS,
	PartSchema,
	STABILIZER_STRENGTH,
	stabilizerBurn,
	stabilizerMount,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { sequence, TOTAL_TICKS } from "./movement-bench";

export const EscapeSettings = z.object({
	strength: z.number().finite().min(1).max(10).default(2),
});
export const ESCAPE_SECONDS = 6;
export const ESCAPE_HZ = 240;
export const LIGHT_FORCE = ION_DEFAULTS.acceleration * ION_REFERENCE_MASS;
export const SIDE_STRENGTH =
	2 * Math.cos((CHASSIS.fighter.angle * Math.PI) / 180);
export const START_SPEED = ionCeiling(SIDE_STRENGTH);
export const escapeVariants = [
	{ label: "1 Light aft", aft: "ion", color: "#5ce5e7" },
	{ label: "1 Heavy aft", aft: "heavy-ion", color: "#ffbd69" },
	{ label: "1 Plasma aft · current force", aft: "plasma", color: "#c8fa64" },
	{ label: "1 Plasma aft · adjustable", aft: "plasma", color: "#c49bff" },
] as const;
export type EscapeSample = {
	speed: number;
	acceleration: number;
	distance: number;
	ceiling: number;
};
export type EscapeRun = {
	samples: EscapeSample[];
	mass: number;
	strength: number;
	force: number;
};
const references = new Map<number, EscapeRun>();
const adjustableCache = new Map<number, EscapeRun>();
export function simulateEscape(raw: unknown = {}): EscapeRun[] {
	const settings = EscapeSettings.parse(raw);
	return escapeVariants.map((variant, index) => {
		const cached =
			index === 3
				? adjustableCache.get(settings.strength)
				: references.get(index);
		if (cached) return cached;
		const strength =
			index === 0
				? 1
				: index === 1
					? 1.75
					: index === 2
						? PARTS.plasma.thrust / LIGHT_FORCE
						: settings.strength;
		const build = LoadoutSchema.parse({
			...defaultLoadout("fighter"),
			stabilizers: true,
			aft: [variant.aft, null],
		});
		const mass = buildStats(build).mass;
		const part = PartSchema.parse({
			...PARTS[variant.aft],
			chargeSeconds: variant.aft === "plasma" ? 0.1 : 0,
		});
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(START_SPEED, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
		const timers: Record<string, number> = {};
		const initialStrength =
			SIDE_STRENGTH + (variant.aft === "plasma" ? 0 : strength);
		const samples: EscapeSample[] = [
			{
				speed: START_SPEED,
				acceleration:
					((LIGHT_FORCE * initialStrength) / mass) *
					Math.max(0, 1 - START_SPEED / ionCeiling(initialStrength)),
				distance: 0,
				ceiling: ionCeiling(initialStrength),
			},
		];
		for (let tick = 0; tick < ESCAPE_SECONDS * ESCAPE_HZ; tick++) {
			const duty = engineDuty(part, true, 1 / ESCAPE_HZ, timers, "aft");
			// Study-only composition: combine all ready forward force under the agreed
			// generic curve; production timing, mass and impulse are reused unchanged.
			const total = SIDE_STRENGTH + strength * duty;
			const ceiling = ionCeiling(total);
			const before = ship.vel.x;
			engineImpulse(
				ship,
				0,
				(LIGHT_FORCE * total) / mass,
				ceiling,
				1 / ESCAPE_HZ,
			);
			ship.pos.x += ship.vel.x / ESCAPE_HZ;
			samples.push({
				speed: ship.vel.x,
				acceleration: (ship.vel.x - before) * ESCAPE_HZ,
				distance: ship.pos.x,
				ceiling,
			});
		}
		const run = { samples, mass, strength, force: strength * LIGHT_FORCE };
		if (index === 3) {
			if (adjustableCache.size >= 4) {
				const oldest = adjustableCache.keys().next().value;
				if (oldest !== undefined) adjustableCache.delete(oldest);
			}
			adjustableCache.set(settings.strength, run);
		} else references.set(index, run);
		return run;
	});
}

type SequenceRun = Omit<EscapeRun, "samples"> & {
	samples: (EscapeSample & {
		x: number;
		y: number;
		heading: number;
		spin: number;
	})[];
};
const sequenceCache = new Map<string, SequenceRun>();
// Same input fixture as 02.1/02.2; only mixed-family speed composition is local.
export function simulateEscapeSequence(raw: unknown = {}): SequenceRun[] {
	const settings = EscapeSettings.parse(raw);
	return escapeVariants.map((variant, index) => {
		const key =
			index === 3 ? `adjustable-${settings.strength}` : `reference-${index}`;
		const cached = sequenceCache.get(key);
		if (cached) return cached;
		const reference = simulateEscape(settings)[index];
		const build = LoadoutSchema.parse({
			...defaultLoadout("fighter"),
			stabilizers: true,
			aft: [variant.aft, null],
		});
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
		const motion = { velocity: 0 };
		const timers: Record<string, number> = {};
		const parts = {
			...PARTS,
			plasma: PartSchema.parse({ ...PARTS.plasma, chargeSeconds: 0.1 }),
		};
		const angle = (CHASSIS.fighter.angle * Math.PI) / 180;
		const mount = stabilizerMount(build.chassis);
		let distance = 0;
		const samples = [
			{
				x: 0,
				y: 0,
				heading: 0,
				spin: 0,
				speed: 0,
				acceleration: 0,
				distance: 0,
				ceiling: 0,
			},
		];
		for (let tick = 0; tick < TOTAL_TICKS * 4; tick++) {
			const command = sequence(Math.floor(tick / 4));
			const input = {
				leftThruster: command.left,
				rightThruster: command.right,
				fire: false,
			};
			const dt = 1 / ESCAPE_HZ;
			const burn = stabilizerBurn(build, input, motion.velocity, dt);
			const bx = ship.vel.x,
				by = ship.vel.y;
			// Reuse production angular integration, stabilizer braking and engine timers.
			applyBuildEngines(
				ship,
				build,
				input,
				dt,
				true,
				timers,
				1,
				motion,
				ION_DEFAULTS,
				parts,
			);
			ship.vel.x = bx;
			ship.vel.y = by;
			const aftDuty =
				command.left &&
				command.right &&
				(variant.aft !== "plasma" || (timers["aft-0"] ?? 0) - dt + 1e-9 >= 0.1)
					? 1
					: 0;
			const ix =
				(Number(command.left) + Number(command.right)) * Math.cos(angle) +
				reference.strength * aftDuty +
				burn.duty * STABILIZER_STRENGTH * mount.fx;
			const iy =
				(Number(command.left) - Number(command.right)) * Math.sin(angle) -
				burn.side * burn.duty * STABILIZER_STRENGTH * mount.fy;
			const total = Math.hypot(ix, iy);
			const ceiling = ionCeiling(total);
			if (total > 1e-10)
				engineImpulse(
					ship,
					ship.rotation + Math.atan2(iy, ix),
					(LIGHT_FORCE * total) / reference.mass,
					ceiling,
					dt,
				);
			ship.pos.x += ship.vel.x * dt;
			ship.pos.y += ship.vel.y * dt;
			distance += ship.vel.mag() * dt;
			samples.push({
				x: ship.pos.x,
				y: ship.pos.y,
				heading: ship.rotation,
				spin: (motion.velocity * 180) / Math.PI,
				speed: ship.vel.mag(),
				acceleration: Math.hypot(ship.vel.x - bx, ship.vel.y - by) / dt,
				distance,
				ceiling,
			});
		}
		const result = { ...reference, samples };
		if (index === 3 && sequenceCache.size >= 7) {
			const oldest = [...sequenceCache.keys()].find((key) =>
				key.startsWith("adjustable-"),
			);
			if (oldest) sequenceCache.delete(oldest);
		}
		sequenceCache.set(key, result);
		return result;
	});
}
