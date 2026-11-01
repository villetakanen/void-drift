import { z } from "astro/zod";
import { DT, INPUT_SEQUENCE, TOTAL_TICKS } from "./movement-bench";

// What a path source must provide. The instrument derives everything else.
export const PathSample = z.object({
	x: z.number().finite(),
	y: z.number().finite(),
	vx: z.number().finite(),
	vy: z.number().finite(),
	/** Turn rate in degrees per second. */
	spin: z.number().finite(),
});
export const PathSeries = z.object({
	label: z.string().min(1),
	color: z.string().min(1),
	samples: z.array(PathSample).length(TOTAL_TICKS + 1),
});
export type PathSeries = z.infer<typeof PathSeries>;

export type Scale = "fixed" | "fit";
export type TraceKey = "speed" | "acceleration" | "turn";

// Measurement choices owned by the instrument, not by any study.
export const INSTRUMENT = {
	seconds: TOTAL_TICKS * DT,
	input: INPUT_SEQUENCE,
	/** Window over which acceleration is differenced, in ticks. */
	window: 6,
	path: { x0: -200, y0: -2000, size: 4400 },
	traces: {
		speed: { label: "Speed", unit: "u/s", max: 600, min: 0 },
		acceleration: { label: "Acceleration", unit: "u/s²", max: 1000, min: 0 },
		turn: {
			label: "Turn acceleration",
			unit: "°/s²",
			max: 200,
			min: -200,
		},
	},
} as const;

export type Derived = {
	label: string;
	color: string;
	path: [number, number][];
	traces: Record<TraceKey, number[]>;
};

export function derive(series: PathSeries): Derived {
	const { samples } = series;
	const span = INSTRUMENT.window * DT;
	const at = (i: number) => samples[Math.max(0, Math.min(i, TOTAL_TICKS))];
	const ticks = samples.map((_, i) => i);
	return {
		label: series.label,
		color: series.color,
		path: samples.map((s) => [s.x, s.y]),
		traces: {
			speed: samples.map((s) => Math.hypot(s.vx, s.vy)),
			acceleration: ticks.map((i) => {
				const a = at(i - INSTRUMENT.window),
					b = at(i);
				return Math.hypot(b.vx - a.vx, b.vy - a.vy) / span;
			}),
			turn: ticks.map(
				(i) => (at(i).spin - at(i - INSTRUMENT.window).spin) / span,
			),
		},
	};
}

export function niceCeil(value: number) {
	if (value <= 0) return 1;
	const base = 10 ** Math.floor(Math.log10(value));
	for (const step of [1, 2, 2.5, 5, 10])
		if (value <= step * base) return step * base;
	return 10 * base;
}
