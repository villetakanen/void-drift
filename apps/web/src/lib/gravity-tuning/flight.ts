import { bounceOffSurface, massWellAcceleration } from "@void-drift/core";
import { buildCollisionRadius } from "@void-drift/mode-a";
import { calculate, type Sample, traces } from "../instrument/calculate";
import type { GravityTuningConfig, GravityWell } from "./config";
import { GRAVITY_TUNING_SHIPS } from "./fleet";

// The bench's flight (docs/specs/gravity-tuning.md, "The flight"): the
// instrument's calculation of each given ship on the chosen burn, from the
// origin along +x at the starting speed, with the well's pull and its body.

/** The well's pull at a point; none within contact distance of its body. */
export function wellPull(
	well: GravityWell,
	x: number,
	y: number,
	shipRadius: number,
) {
	const dx = well.x - x;
	const dy = well.y - y;
	const distance = Math.hypot(dx, dy);
	if (distance <= well.radius + shipRadius) return { x: 0, y: 0 };
	const a = massWellAcceleration(
		distance,
		well.strength,
		well.cutoff,
		well.falloff,
	);
	return { x: (dx / distance) * a, y: (dy / distance) * a };
}

export type BenchRun = {
	label: string;
	samples: Sample[];
	/** The same burn and start without the well. */
	unaffected: Sample[];
	/** Peak engine acceleration on the unaffected path, u/s². */
	thrust: number;
	/** Sample indices at which the ship touched the body. */
	contacts: number[];
	/** Per sample: the well's pull on the ship (u/s²) and the distance to its centre (u). */
	gravity: number[];
	distance: number[];
};

/** Flies every given ship under the document's settings, and without the well. */
export function flyBench(doc: GravityTuningConfig): BenchRun[] {
	return GRAVITY_TUNING_SHIPS.map(({ label, loadout }) => {
		const vehicle = { label, loadout, changes: {} };
		const radius = buildCollisionRadius(loadout);
		const contacts: number[] = [];
		const samples = calculate(vehicle, doc.burn, {
			startSpeed: doc.startSpeed,
			pull: (x, y) => wellPull(doc.well, x, y, radius),
			contact: (ship, tick) => {
				if (
					bounceOffSurface(ship, doc.well, doc.well.radius + radius) !== null &&
					contacts.at(-1) !== tick
				)
					contacts.push(tick);
			},
		});
		const unaffected = calculate(vehicle, doc.burn, {
			startSpeed: doc.startSpeed,
		});
		return {
			label,
			samples,
			unaffected,
			thrust: Math.max(...traces(unaffected).acceleration),
			contacts,
			gravity: samples.map((s) => {
				const g = wellPull(doc.well, s.x, s.y, radius);
				return Math.hypot(g.x, g.y);
			}),
			distance: samples.map((s) =>
				Math.hypot(s.x - doc.well.x, s.y - doc.well.y),
			),
		};
	});
}
