import { massWellAcceleration } from "@void-drift/core";
import { buildCollisionRadius } from "@void-drift/mode-a";
import { calculate, type Sample } from "../instrument/calculate";
import type { GravityTuningConfig, GravityWell } from "./config";
import { GRAVITY_TUNING_SHIPS } from "./fleet";

// The bench's flight (docs/specs/gravity-tuning.md, "The flight"): the
// instrument's calculation of each given ship on the chosen burn, from the
// origin along +x at the starting speed, with the well's pull added.

/** The well's pull at a point; none within the ship's own radius of its centre. */
export function wellPull(
	well: GravityWell,
	x: number,
	y: number,
	shipRadius: number,
) {
	const dx = well.x - x;
	const dy = well.y - y;
	const distance = Math.hypot(dx, dy);
	if (distance <= shipRadius) return { x: 0, y: 0 };
	const a = massWellAcceleration(distance, well.strength, well.sizeMultiplier);
	return { x: (dx / distance) * a, y: (dy / distance) * a };
}

export type BenchRun = {
	label: string;
	samples: Sample[];
	/** Per sample: the well's pull on the ship (u/s²) and the distance to its centre (u). */
	gravity: number[];
	distance: number[];
};

/** Flies every given ship under the document's settings. */
export function flyBench(doc: GravityTuningConfig): BenchRun[] {
	return GRAVITY_TUNING_SHIPS.map(({ label, loadout }) => {
		const radius = buildCollisionRadius(loadout);
		const samples = calculate({ label, loadout, changes: {} }, doc.burn, {
			startSpeed: doc.startSpeed,
			pull: (x, y) => wellPull(doc.well, x, y, radius),
		});
		return {
			label,
			samples,
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
