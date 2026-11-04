import { describe, expect, it } from "vitest";
import { calculate as studyCalculate } from "../../../../apps/web/src/components/studies/lab-instrument-config";
import {
	BURN_IDS,
	BURNS,
	calculate,
	calculateField,
	InstrumentConfig,
	inputAt,
	TOTAL_TICKS,
	traces,
	V2_BURN_IDS,
} from "../../../../apps/web/src/lib/instrument";
import { Simulation, stockSettings } from "./simulation";

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
		for (const id of V2_BURN_IDS)
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

// Field mode (lab-instrument.md, "Target: gravity field mode").
const well = {
	label: "W1",
	x: 1400,
	y: 300,
	reach: 260,
	strength: 900,
	curve: "inverse-square",
};
const fieldDocument = (field: object, start?: object, extra: object = {}) => ({
	version: 2,
	burn: "coast",
	field,
	vehicles: [
		{
			label: "Probe",
			loadout: fighter(["ion", "ion"]),
			...(start ? { start } : {}),
			...extra,
		},
	],
});
const issues = (doc: unknown) => {
	const result = InstrumentConfig.safeParse(doc);
	return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("version 2 documents", () => {
	it("calculate a document without a field exactly as version 1", () => {
		const v1 = InstrumentConfig.parse(document);
		const v2 = InstrumentConfig.parse({ ...document, version: 2 });
		for (const burn of BURN_IDS)
			v1.vehicles.forEach((vehicle, i) => {
				expect(calculate(v2.vehicles[i], burn)).toEqual(
					calculate(vehicle, burn),
				);
			});
	});
	it("keep coast out of version 1", () => {
		expect(issues({ ...document, burn: "coast" })).not.toEqual([]);
		expect(issues({ ...document, version: 2, burn: "coast" })).toEqual([]);
	});
	it("reject impossible fields, starts and changes", () => {
		const sun = { x: 960, y: 540, heading: 0, speed: 0 };
		const rejected = [
			fieldDocument({
				wells: Array.from({ length: 5 }, (_, i) => ({
					...well,
					label: `W${i}`,
				})),
			}),
			fieldDocument({ wells: [{ ...well, strength: -1 }] }),
			fieldDocument({ wells: [{ ...well, x: 960 + 1300 }] }),
			fieldDocument({ changes: { drag: 1 } }),
			fieldDocument({}, sun),
			fieldDocument({}, { ...sun, y: 540 + 1300 }),
			fieldDocument({}, undefined, { changes: { plasma: { thrust: 46000 } } }),
			{ ...fieldDocument({}, { ...sun, x: 300 }), field: undefined },
		];
		for (const doc of rejected) expect(issues(doc)).not.toEqual([]);
		expect(issues(fieldDocument({}, sun))).toContain("start is inside the sun");
		expect(
			issues(fieldDocument({ wells: [well] }, { ...sun, x: 300 })),
		).toEqual([]);
	});
});

describe("field calculation", () => {
	it("equals a Simulation built from the same field and start", () => {
		const start = { x: 300, y: 200, heading: 30, speed: 120 };
		const doc = InstrumentConfig.parse({
			...fieldDocument({ wells: [well] }, start),
			burn: "course",
		});
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		const run = calculateField(doc.vehicles[0], "course", doc.field);
		const sim = new Simulation(
			{ ...stockSettings("fighter"), loadout: doc.vehicles[0].loadout },
			{ field: { ...doc.field, start } },
		);
		sim.start();
		const path = [{ x: sim.ship.pos.x, y: sim.ship.pos.y }];
		for (
			let tick = 0;
			tick < TOTAL_TICKS && sim.state.status === "PLAYING";
			tick++
		) {
			const { left, right } = inputAt("course", tick);
			sim.step({ leftThruster: left, rightThruster: right, fire: false });
			path.push({ x: sim.ship.pos.x, y: sim.ship.pos.y });
		}
		expect(run.samples.map(({ x, y }) => ({ x, y }))).toEqual(path);
	});
	it("ends a coast into the sun with the star outcome", () => {
		const doc = InstrumentConfig.parse(
			fieldDocument(
				{ system: "game" },
				{ x: 960 - 200, y: 540, heading: 0, speed: 0 },
			),
		);
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		const run = calculateField(doc.vehicles[0], "coast", doc.field);
		expect(run.outcome).toBe("star");
		expect(run.samples.length).toBeLessThan(TOTAL_TICKS + 1);
	});
	it("bends a coast toward a frozen Lab well only inside its reach", () => {
		const start = {
			x: well.x - well.reach - 100,
			y: well.y + 120,
			heading: 0,
			speed: 200,
		};
		const doc = InstrumentConfig.parse(
			fieldDocument(
				{ system: "empty", orbits: "frozen", wells: [well] },
				start,
			),
		);
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		const run = calculateField(doc.vehicles[0], "coast", doc.field);
		const inReach = (s: { x: number; y: number }) =>
			Math.hypot(s.x - well.x, s.y - well.y) < well.reach;
		const firstIn = run.samples.findIndex(inReach);
		expect(firstIn).toBeGreaterThan(0);
		for (const s of run.samples.slice(0, firstIn)) {
			expect(s.vy).toBe(0);
			expect(Math.hypot(s.gx, s.gy)).toBe(0);
		}
		expect(run.samples.at(-1)?.vy).toBeLessThan(0);
	});
	it("records wraps and outcomes in an empty field", () => {
		const doc = InstrumentConfig.parse(
			fieldDocument(
				{ system: "empty" },
				{ x: 960, y: 540, heading: 0, speed: 300 },
			),
		);
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		const run = calculateField(doc.vehicles[0], "coast", doc.field);
		expect(run.events.some((e) => e.kind === "wrap")).toBe(true);
		expect(run.outcome).toBe("free");
		expect(
			run.samples.every((s) => s.surface === Number.POSITIVE_INFINITY),
		).toBe(true);
	});
	it("records a planet contact and keeps flying", () => {
		const planet = new Simulation(stockSettings("fighter")).planets[0];
		const start = {
			x: planet.pos.x - planet.radius - 60,
			y: planet.pos.y,
			heading: 0,
			speed: 200,
		};
		const doc = InstrumentConfig.parse(
			fieldDocument({ orbits: "frozen" }, start),
		);
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		const run = calculateField(doc.vehicles[0], "coast", doc.field);
		const contact = run.events.find((e) => e.kind === "contact");
		expect(contact).toBeDefined();
		expect(run.samples.length).toBeGreaterThan((contact?.tick ?? 0) + 1);
	});
	it("ends bound when still inside a reach after the burn", () => {
		const start = {
			x: well.x - well.reach / 2,
			y: well.y,
			heading: 90,
			speed: 0,
		};
		const doc = InstrumentConfig.parse(
			fieldDocument({ system: "empty", wells: [well] }, start),
		);
		if (doc.version !== 2 || !doc.field)
			throw new Error("expected a field document");
		expect(calculateField(doc.vehicles[0], "coast", doc.field).outcome).toBe(
			"bound",
		);
	});
});
