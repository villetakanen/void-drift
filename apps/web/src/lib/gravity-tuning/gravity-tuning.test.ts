import { massWellAcceleration, massWellReach } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { BURN_IDS, TOTAL_TICKS } from "../instrument/burns";
import { calculate, traces } from "../instrument/calculate";
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
				well: { ...DEFAULT_DOCUMENT.well, cutoff: 0 },
			},
			{ ...DEFAULT_DOCUMENT, burn: "coast" },
			{
				...DEFAULT_DOCUMENT,
				well: { ...DEFAULT_DOCUMENT.well, falloff: "linear" },
			},
			{
				...DEFAULT_DOCUMENT,
				well: {
					...DEFAULT_DOCUMENT.well,
					radius: massWellReach(
						DEFAULT_DOCUMENT.well.strength,
						DEFAULT_DOCUMENT.well.cutoff,
					),
				},
			},
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
				expect(runs[i].samples).toEqual(calculate({ label, loadout }, burn));
				expect(runs[i].unaffected).toEqual(runs[i].samples);
				expect(runs[i].gravity.every((g) => g === 0)).toBe(true);
			});
		}
	});

	it("bends paths that enter the well's reach", () => {
		const runs = flyBench(DEFAULT_DOCUMENT);
		const reach = massWellReach(
			DEFAULT_DOCUMENT.well.strength,
			DEFAULT_DOCUMENT.well.cutoff,
		);
		const entered = runs.filter((r) => r.distance.some((d) => d < reach));
		expect(entered.length).toBeGreaterThan(0);
		for (const run of entered) {
			const i = GRAVITY_TUNING_SHIPS.findIndex((s) => s.label === run.label);
			const { label, loadout } = GRAVITY_TUNING_SHIPS[i];
			expect(run.samples).not.toEqual(
				calculate({ label, loadout }, DEFAULT_DOCUMENT.burn),
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

	it("pulls by the chosen falloff toward the centre, never within contact distance", () => {
		for (const falloff of ["inverse-square", "inverse"] as const) {
			const well = { ...DEFAULT_DOCUMENT.well, falloff };
			const reach = massWellReach(well.strength, well.cutoff, falloff);
			const d = reach / 2;
			const g = wellPull(well, well.x - d, well.y, 16);
			expect(g.x).toBeCloseTo(
				massWellAcceleration(d, well.strength, well.cutoff, falloff),
				9,
			);
			expect(g.y).toBeCloseTo(0, 12);
			expect(wellPull(well, well.x - reach, well.y, 16)).toEqual({
				x: 0,
				y: 0,
			});
			expect(wellPull(well, well.x - (well.radius + 15), well.y, 16)).toEqual({
				x: 0,
				y: 0,
			});
		}
	});

	it("bounces a ship off the body, records the contact and keeps flying", () => {
		const doc = GravityTuningConfig.parse({
			...DEFAULT_DOCUMENT,
			well: { ...DEFAULT_DOCUMENT.well, x: 600, y: 0 },
		});
		const hit = flyBench(doc).filter((r) => r.contacts.length > 0);
		expect(hit.length).toBeGreaterThan(0);
		for (const run of hit) {
			expect(run.samples).toHaveLength(TOTAL_TICKS + 1);
			expect(Math.min(...run.distance)).toBeGreaterThan(doc.well.radius);
		}
	});

	it("takes each ship's thrust from its unaffected path", () => {
		for (const run of flyBench(DEFAULT_DOCUMENT))
			expect(run.thrust).toBe(Math.max(...traces(run.unaffected).acceleration));
	});
});
