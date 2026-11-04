import { Vec2 } from "@void-drift/core";
import {
	applyBuildEngines,
	type EngineTimers,
	ION_DEFAULTS,
	IonSettingsSchema,
	PARTS,
	PartSchema,
} from "@void-drift/mode-a";
import { type BurnId, DT, inputAt, TOTAL_TICKS } from "./burns";
import type { InstrumentVehicle } from "./config";
import type { FieldRun } from "./field";

/** One calculated moment: position, velocity, and turn rate in °/s. */
export type Sample = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	spin: number;
};

/**
 * Calculates one vehicle on a burn with the production engine function and the
 * vehicle's own part and ion values. Not included: gravity, power limits, and
 * changes to part mass or chassis values.
 */
export function calculate(vehicle: InstrumentVehicle, burn: BurnId): Sample[] {
	const { loadout, changes } = vehicle;
	const parts = {
		...PARTS,
		fusion: PartSchema.parse({ ...PARTS.fusion, ...changes.fusion }),
		plasma: PartSchema.parse({ ...PARTS.plasma, ...changes.plasma }),
	};
	const ion = IonSettingsSchema.parse({ ...ION_DEFAULTS, ...changes.ion });
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const timers: EngineTimers = {};
	const motion = { velocity: 0 };
	const samples: Sample[] = [];
	const record = () =>
		samples.push({
			x: ship.pos.x,
			y: ship.pos.y,
			vx: ship.vel.x,
			vy: ship.vel.y,
			spin: (motion.velocity * 180) / Math.PI,
		});
	record();
	for (let tick = 0; tick < TOTAL_TICKS; tick++) {
		const input = inputAt(burn, tick);
		for (let sub = 0; sub < 4; sub++) {
			applyBuildEngines(
				ship,
				loadout,
				{ leftThruster: input.left, rightThruster: input.right, fire: false },
				DT / 4,
				true,
				timers,
				1,
				motion,
				ion,
				parts,
			);
			ship.pos.x += (ship.vel.x * DT) / 4;
			ship.pos.y += (ship.vel.y * DT) / 4;
		}
		record();
	}
	return samples;
}

export type Measure = "speed" | "acceleration" | "turn" | "gravity" | "surface";
/** signed: the measure can go negative, so its axis is symmetric about zero. */
export const MEASURES: Record<
	Measure,
	{ label: string; unit: string; signed: boolean }
> = {
	speed: { label: "Speed", unit: "u/s", signed: false },
	acceleration: { label: "Acceleration", unit: "u/s²", signed: false },
	turn: { label: "Turn acceleration", unit: "°/s²", signed: true },
	gravity: { label: "Gravity", unit: "u/s²", signed: false },
	surface: { label: "Nearest surface", unit: "u", signed: false },
};
/** The graphs a document shows: field documents swap acceleration and turn for gravity and surface. */
export const FLIGHT_MEASURES = ["speed", "acceleration", "turn"] as const;
export const FIELD_MEASURES = ["speed", "gravity", "surface"] as const;
/** Ticks over which acceleration is differenced. */
const WINDOW = 6;

/** Every measure for every sample; gravity and surface only from field samples (NaN without). */
export function traces(
	samples: (Sample & { gx?: number; gy?: number; surface?: number })[],
): Record<Measure, number[]> {
	const span = WINDOW * DT;
	const at = (i: number) =>
		samples[Math.max(0, Math.min(i, samples.length - 1))];
	return {
		speed: samples.map((s) => Math.hypot(s.vx, s.vy)),
		acceleration: samples.map((_, i) => {
			const a = at(i - WINDOW),
				b = at(i);
			return Math.hypot(b.vx - a.vx, b.vy - a.vy) / span;
		}),
		turn: samples.map((_, i) => (at(i).spin - at(i - WINDOW).spin) / span),
		gravity: samples.map((s) =>
			s.gx === undefined || s.gy === undefined
				? Number.NaN
				: Math.hypot(s.gx, s.gy),
		),
		// No body at all leaves no surface to measure.
		surface: samples.map((s) =>
			s.surface !== undefined && Number.isFinite(s.surface)
				? s.surface
				: Number.NaN,
		),
	};
}

/** The smallest of 1, 2, 2.5, 5 or 10 × a power of ten at or above value. */
export function niceCeil(value: number) {
	if (value <= 0) return 1;
	const base = 10 ** Math.floor(Math.log10(value));
	for (const step of [1, 2, 2.5, 5, 10])
		if (value <= step * base) return step * base;
	return 10 * base;
}

/** A calculated vehicle as the views draw it; `run` is present in field mode. */
export type Track = {
	label: string;
	color: string;
	samples: Sample[];
	traces: Record<Measure, number[]>;
	run?: FieldRun;
};
/** A sample index within a track, holding the last sample once a run has ended. */
export function sampleIndex(track: Track, tick: number) {
	return Math.max(0, Math.min(tick, track.samples.length - 1));
}
/** Six distinct vehicle colours, in order; a configuration holds at most six. */
export const TRACK_COLORS = [
	"#5ce5e7",
	"#ffbd69",
	"#ff7aa8",
	"#c8fa64",
	"#c49bff",
	"#83a9ff",
];
