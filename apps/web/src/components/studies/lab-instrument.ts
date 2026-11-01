import { DT } from "./movement-bench";
import { type Derived, derive, PathSeries } from "./path-instrument";
import { simulateRotation } from "./rotation-bench";

// Fixture: four vehicles from two imagined studies, all calculated with the
// existing free-rotation bench ("2 aft + 2 side") on the shared input program.
export type Vehicle = {
	id: string;
	source: string;
	settings: { acceleration: number; maxSpeed: number };
	series: PathSeries;
};

const specs = [
	{
		source: "Thrust study",
		acceleration: 100,
		maxSpeed: 250,
		color: "#5ce5e7",
	},
	{
		source: "Thrust study",
		acceleration: 250,
		maxSpeed: 250,
		color: "#ffbd69",
	},
	{
		source: "Ceiling study",
		acceleration: 175,
		maxSpeed: 150,
		color: "#c8fa64",
	},
	{
		source: "Ceiling study",
		acceleration: 175,
		maxSpeed: 400,
		color: "#ff7aa8",
	},
];

export const fixtureVehicles: Vehicle[] = specs.map((s, i) => ({
	id: `v${i}`,
	source: s.source,
	settings: { acceleration: s.acceleration, maxSpeed: s.maxSpeed },
	series: PathSeries.parse({
		label: `Accel ${s.acceleration} · ceiling ${s.maxSpeed}`,
		color: s.color,
		samples: simulateRotation({
			acceleration: s.acceleration,
			maxSpeed: s.maxSpeed,
			rotationMode: "free",
		})[3].map((p) => ({
			x: p.x,
			y: p.y,
			vx: p.vx ?? 0,
			vy: p.vy ?? 0,
			spin: p.spin ?? 0,
		})),
	}),
}));

// Whole-run figures the instrument computes for every vehicle, so engine and
// hull comparisons read from the same calculation as the paths.
export type Summary = {
	peakSpeed: number;
	/** Seconds until speed first reaches 200 u/s; null when it never does. */
	to200: number | null;
	distance: number;
};

export function summarize(d: Derived): Summary {
	const speed = d.traces.speed;
	const first = speed.findIndex((v) => v >= 200);
	let distance = 0;
	for (let i = 1; i < d.path.length; i++)
		distance += Math.hypot(
			d.path[i][0] - d.path[i - 1][0],
			d.path[i][1] - d.path[i - 1][1],
		);
	return {
		peakSpeed: Math.max(...speed),
		to200: first < 0 ? null : first * DT,
		distance,
	};
}

export { derive };
