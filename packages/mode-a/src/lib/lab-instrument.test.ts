import { describe, expect, it } from "vitest";
import { calculate as studyCalculate } from "../../../../apps/web/src/components/studies/lab-instrument-config";
import {
	BURN_IDS,
	BURNS,
	calculate,
	InstrumentConfig,
	inputAt,
	TOTAL_TICKS,
	traces,
} from "../../../../apps/web/src/lib/instrument";

const fighter = (aft: [string | null, string | null]) => ({
	version: 2,
	chassis: "fighter",
	side: "ion",
	stabilizers: true,
	hull: [null, null],
	aft,
});
// The document accepted in the lab-instrument study (02.7).
const document = {
	version: 1,
	vehicles: [
		{ label: "Ion aft", loadout: fighter(["ion", "ion"]) },
		{ label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
		{
			label: "Plasma aft, more thrust",
			loadout: fighter(["plasma", "plasma"]),
			changes: { plasma: { thrust: 46000 } },
		},
	],
};

describe("burns", () => {
	it("are all exactly 14 seconds", () => {
		for (const id of BURN_IDS)
			expect(BURNS[id].segments.reduce((a, s) => a + s.ticks, 0)).toBe(
				TOTAL_TICKS,
			);
	});
	it("turn has its left-only step from 6 s to 8 s", () => {
		expect(inputAt("turn", 6 * 60)).toEqual({ left: true, right: false });
		expect(inputAt("turn", 8 * 60 + 30)).toEqual({ left: false, right: false });
	});
	it("weave grows each round by 0.3 s and ends on a cut LR", () => {
		const steps = BURNS.weave.segments;
		expect(steps.slice(0, 4).map((s) => s.ticks)).toEqual([18, 18, 18, 36]);
		expect(steps.at(-1)).toEqual({ input: "LR", ticks: 30 });
	});
});

describe("configuration document", () => {
	it("accepts the study's document and defaults the burn", () => {
		const parsed = InstrumentConfig.parse(document);
		expect(parsed.burn).toBe("course");
		expect(parsed.vehicles[0].changes).toEqual({});
	});
	it("rejects a loadout that does not fit its chassis", () => {
		const broken = structuredClone(document);
		broken.vehicles[0].loadout.aft = ["ion"] as never;
		expect(InstrumentConfig.safeParse(broken).success).toBe(false);
	});
	it("rejects an unknown change and an unknown burn", () => {
		expect(
			InstrumentConfig.safeParse({
				...document,
				vehicles: [
					{ ...document.vehicles[0], changes: { plasma: { mass: 1 } } },
				],
			}).success,
		).toBe(false);
		expect(
			InstrumentConfig.safeParse({ ...document, burn: "loop" }).success,
		).toBe(false);
	});
});

describe("calculation", () => {
	const config = InstrumentConfig.parse(document);
	it("is deterministic and finite over the whole burn", () => {
		for (const burn of BURN_IDS) {
			const a = calculate(config.vehicles[1], burn);
			const b = calculate(config.vehicles[1], burn);
			expect(a).toEqual(b);
			expect(a).toHaveLength(TOTAL_TICKS + 1);
			expect(a.every((s) => Number.isFinite(s.x) && Number.isFinite(s.y))).toBe(
				true,
			);
		}
	});
	it("matches the study's calculation exactly", () => {
		for (const vehicle of config.vehicles)
			for (const burn of BURN_IDS)
				expect(calculate(vehicle, burn)).toEqual(studyCalculate(vehicle, burn));
	});
	it("lets a change reach the result", () => {
		const stock = traces(calculate(config.vehicles[1], "course")).speed;
		const changed = traces(calculate(config.vehicles[2], "course")).speed;
		expect(Math.max(...changed)).toBeGreaterThan(Math.max(...stock));
	});
});
