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

/** One calculated moment: position, velocity, and turn rate in °/s. */
export type Sample = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	spin: number;
};

/**
 * How a flight starts and what else acts on it. The instrument flies from rest
 * with nothing else; the Gravity tuning bench (docs/specs/gravity-tuning.md)
 * adds a starting speed along +x and its well's pull.
 */
export type Flight = {
	startSpeed?: number;
	/** Acceleration at a point, added to the velocity each substep before the move. */
	pull?: (x: number, y: number) => { x: number; y: number };
	/** Resolves contact with a body after the pull and before the move; `tick` is the sample about to be recorded. */
	contact?: (ship: { pos: Vec2; vel: Vec2 }, tick: number) => void;
};

/**
 * Calculates one vehicle on a burn with the production engine function and the
 * vehicle's own part and ion values. Not included: gravity, power limits, and
 * changes to part mass or chassis values.
 */
export function calculate(
	vehicle: InstrumentVehicle,
	burn: BurnId,
	flight: Flight = {},
): Sample[] {
	const { loadout, changes } = vehicle;
	const parts = {
		...PARTS,
		fusion: PartSchema.parse({ ...PARTS.fusion, ...changes.fusion }),
		plasma: PartSchema.parse({ ...PARTS.plasma, ...changes.plasma }),
	};
	const ion = IonSettingsSchema.parse({ ...ION_DEFAULTS, ...changes.ion });
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(flight.startSpeed ?? 0, 0),
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
			if (flight.pull) {
				const g = flight.pull(ship.pos.x, ship.pos.y);
				ship.vel.x += (g.x * DT) / 4;
				ship.vel.y += (g.y * DT) / 4;
			}
			flight.contact?.(ship, tick + 1);
			ship.pos.x += (ship.vel.x * DT) / 4;
			ship.pos.y += (ship.vel.y * DT) / 4;
		}
		record();
	}
	return samples;
}

export type Measure =
	| "speed"
	| "acceleration"
	| "turn"
	| "gravity"
	| "distance";
/** signed: the measure can go negative, so its axis is symmetric about zero. */
export const MEASURES: Record<
	Measure,
	{ label: string; unit: string; signed: boolean }
> = {
	speed: { label: "Speed", unit: "u/s", signed: false },
	acceleration: { label: "Acceleration", unit: "u/s²", signed: false },
	turn: { label: "Turn acceleration", unit: "°/s²", signed: true },
	// Gravity tuning bench (docs/specs/gravity-tuning.md).
	gravity: { label: "Gravity", unit: "u/s²", signed: false },
	distance: { label: "Distance to well", unit: "u", signed: false },
};
/** The instrument's graphs. */
export const FLIGHT_MEASURES = ["speed", "acceleration", "turn"] as const;
/** Ticks over which acceleration is differenced. */
const WINDOW = 6;

/** The instrument's three measures for every sample. */
export function traces(
	samples: Sample[],
): Record<(typeof FLIGHT_MEASURES)[number], number[]> {
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

/** A calculated vehicle as the views draw it. */
export type Track = {
	label: string;
	color: string;
	samples: Sample[];
	/** The measures this track has values for; a graph needs its measure here. */
	traces: Partial<Record<Measure, number[]>>;
	/** The same flight without outside forces, drawn dotted (Gravity tuning). */
	unaffected?: Sample[];
	/** Sample indices of contacts with a body, marked on the path. */
	contacts?: number[];
	/** A reference value per measure, drawn as a dashed line in the track's colour. */
	references?: Partial<Record<Measure, number>>;
};
/** Six distinct vehicle colours, in order; a configuration holds at most six. */
export const TRACK_COLORS = [
	"#5ce5e7",
	"#ffbd69",
	"#ff7aa8",
	"#c8fa64",
	"#c49bff",
	"#83a9ff",
];
