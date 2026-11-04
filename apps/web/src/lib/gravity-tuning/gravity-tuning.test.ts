import { massWellAcceleration, massWellReach } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { BURN_IDS } from "../instrument/burns";
import { calculate } from "../instrument/calculate";
import {
	DEFAULT_DOCUMENT,
	flyBench,
	GRAVITY_TUNING_SHIPS,
	GravityTuningConfig,
	wellPull,
} from ".";

// Contract: docs/specs/gravity-tuning.md.
describe("document", () => {
	it("accepts the default document and refuses impossible settings", () => {
		expect(GravityTuningConfig.parse(DEFAULT_DOCUMENT)).toEqual(
			DEFAULT_DOCUMENT,
		);
		const refused = [
			{ ...DEFAULT_DOCUMENT, ships: [] },
			{ ...DEFAULT_DOCUMENT, startSpeed: -1 },
			{ ...DEFAULT_DOCUMENT, well: { ...DEFAULT_DOCUMENT.well, strength: 0 } },
			{
				...DEFAULT_DOCUMENT,
				well: { ...DEFAULT_DOCUMENT.well, sizeMultiplier: 5.01 },
			},
			{ ...DEFAULT_DOCUMENT, burn: "coast" },
		];
		for (const doc of refused)
			expect(GravityTuningConfig.safeParse(doc).success).toBe(false);
	});
});

describe("flight", () => {
	it("equals the instrument's flight when the well is out of reach", () => {
		for (const burn of BURN_IDS) {
			const doc = GravityTuningConfig.parse({
				...DEFAULT_DOCUMENT,
				burn,
				well: { ...DEFAULT_DOCUMENT.well, y: 10000 },
			});
			const runs = flyBench(doc);
			GRAVITY_TUNING_SHIPS.forEach(({ label, loadout }, i) => {
				expect(runs[i].samples).toEqual(
					calculate({ label, loadout, changes: {} }, burn),
				);
				expect(runs[i].gravity.every((g) => g === 0)).toBe(true);
			});
		}
	});

	it("bends paths that enter the well's reach", () => {
		const runs = flyBench(DEFAULT_DOCUMENT);
		const reach = massWellReach(
			DEFAULT_DOCUMENT.well.strength,
			DEFAULT_DOCUMENT.well.sizeMultiplier,
		);
		const entered = runs.filter((r) => r.distance.some((d) => d < reach));
		expect(entered.length).toBeGreaterThan(0);
		for (const run of entered) {
			const i = GRAVITY_TUNING_SHIPS.findIndex((s) => s.label === run.label);
			const { label, loadout } = GRAVITY_TUNING_SHIPS[i];
			expect(run.samples).not.toEqual(
				calculate({ label, loadout, changes: {} }, DEFAULT_DOCUMENT.burn),
			);
		}
	});

	it("starts every ship along +x at the starting speed", () => {
		const doc = GravityTuningConfig.parse({
			...DEFAULT_DOCUMENT,
			startSpeed: 250,
		});
		for (const run of flyBench(doc))
			expect(run.samples[0]).toMatchObject({ x: 0, y: 0, vx: 250, vy: 0 });
	});

	it("pulls by the mass well law toward the centre, not within the ship", () => {
		const well = DEFAULT_DOCUMENT.well;
		const reach = massWellReach(well.strength, well.sizeMultiplier);
		const d = reach / 2;
		const g = wellPull(well, well.x - d, well.y, 16);
		expect(g.x).toBeCloseTo(
			massWellAcceleration(d, well.strength, well.sizeMultiplier),
			9,
		);
		expect(g.y).toBeCloseTo(0, 12);
		expect(wellPull(well, well.x - reach, well.y, 16)).toEqual({ x: 0, y: 0 });
		expect(wellPull(well, well.x - 10, well.y, 16)).toEqual({ x: 0, y: 0 });
	});
});
