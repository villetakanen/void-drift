import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	buildCollisionRadius,
	buildMounts,
	buildPlumeEmitters,
} from "./build-renderer";
import {
	BuildStoreSchema,
	buildStats,
	defaultBuilds,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
	starterLoadout,
} from "./schemas/loadout";
import { gameSettings, Simulation } from "./simulation";
import { WASP } from "./wasp";

describe("LHI Wasp integration", () => {
	it("forces stabilizers on and validates 2 equipment + 0 aft slots", () => {
		const build = LoadoutSchema.parse({
			version: 2,
			chassis: "wasp",
			side: "ion",
			stabilizers: false,
			hull: ["laser", "battery"],
			aft: [],
		});
		expect(build.stabilizers).toBe(true);
		expect(defaultLoadout("wasp").stabilizers).toBe(true);
		expect(starterLoadout("wasp").stabilizers).toBe(true);

		expect(() =>
			LoadoutSchema.parse({
				version: 2,
				chassis: "wasp",
				side: "ion",
				hull: ["ion", null],
				aft: [],
			}),
		).toThrow();
	});

	it("migrates legacy BuildStore saves without a wasp entry", () => {
		const legacy = {
			scout: defaultLoadout("scout"),
			fighter: defaultLoadout("fighter"),
			corvette: defaultLoadout("corvette"),
		};
		const parsed = BuildStoreSchema.parse(legacy);
		expect(parsed.wasp.chassis).toBe("wasp");
		expect(parsed.wasp.stabilizers).toBe(true);
		expect(defaultBuilds().wasp.chassis).toBe("wasp");
	});

	it("exposes three unlinked mounts and five plume emitters", () => {
		const build = defaultLoadout("wasp");
		const mounts = buildMounts(build);
		expect(mounts).toHaveLength(3);
		expect(mounts.every((m) => !m.linkedTo)).toBe(true);
		const [left, right, engine] = mounts;
		expect(left.type).toBe("equipment");
		expect(right).toMatchObject({ type: "equipment", x: left.x, y: -left.y });
		expect(engine.type).toBe("engine");
		expect(engine.x).toBeLessThan(left.x);
		expect(engine.y).toBe(0);

		const emitters = buildPlumeEmitters(build);
		expect(emitters).toHaveLength(5);
		for (const facet of WASP.facets)
			for (const [x, y] of facet.points)
				expect(Math.hypot(x, y) * BUILD_FLIGHT_SCALE).toBeLessThanOrEqual(
					buildCollisionRadius(build),
				);
	});

	it("computes single-engine mass, forward acceleration, and 4-slit turn rate", () => {
		const build = defaultLoadout("wasp");
		const stats = buildStats(build);
		expect(stats.mass).toBe(WASP.mass + PARTS[build.side].mass);
		expect(stats.acceleration).toBeCloseTo(
			PARTS[build.side].thrust / stats.mass,
			5,
		);
		expect(stats.turnRate).toBeGreaterThan(0);
	});

	it("fires rear engine only on LR and diagonal stabilizer pairs on L or R", () => {
		const build = defaultLoadout("wasp");
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
		const motion = { velocity: 0 };

		const leftOut = applyBuildEngines(
			ship,
			build,
			{ leftThruster: true, rightThruster: false, fire: false },
			1 / 60,
			true,
			{},
			1,
			motion,
		);
		expect(leftOut.left).toBe(0);
		expect(leftOut.stabilizers[0]).toBe(0);
		expect(leftOut.stabilizers[1]).toBeGreaterThan(0);
		expect(leftOut.stabilizers[2]).toBeGreaterThan(0);
		expect(leftOut.stabilizers[3]).toBe(0);
		expect(motion.velocity).toBeGreaterThan(0);

		const bothOut = applyBuildEngines(
			ship,
			build,
			{ leftThruster: true, rightThruster: true, fire: false },
			1 / 60,
			true,
			{},
			1,
			motion,
		);
		expect(bothOut.left).toBeGreaterThan(0);
		expect(
			buildDrain(build, {
				leftThruster: true,
				rightThruster: false,
				fire: false,
			}),
		).toBeLessThan(
			buildDrain(build, {
				leftThruster: true,
				rightThruster: true,
				fire: false,
			}),
		);
	});
});

for (const side of ["leftThruster", "rightThruster"] as const) {
	it(`powers Wasp ${side} steering through the simulation energy budget`, () => {
		const sim = new Simulation(gameSettings("wasp"));
		sim.start();
		const rotation = sim.ship.rotation;
		for (let i = 0; i < 30; i++)
			sim.step({
				leftThruster: false,
				rightThruster: false,
				fire: false,
				[side]: true,
			});
		expect(Math.abs(sim.ship.rotation - rotation)).toBeGreaterThan(0.01);
		expect(sim.engineOutput.stabilizers.some((value) => value > 0)).toBe(true);
	});
}
