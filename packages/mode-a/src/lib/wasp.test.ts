import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import {
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
		expect(mounts.map((m) => [m.key, m.type, m.x, m.y])).toEqual([
			["hull-0", "equipment", 1.5, -12],
			["hull-1", "equipment", 1.5, 12],
			["left", "engine", -17.5, 0],
		]);

		const emitters = buildPlumeEmitters(build);
		expect(emitters).toHaveLength(5);
		expect(buildCollisionRadius(build)).toBeGreaterThan(WASP.length * 0.65);
	});

	it("computes single-engine mass, forward acceleration, and 4-slit turn rate", () => {
		const build = defaultLoadout("wasp");
		const stats = buildStats(build);
		expect(stats.mass).toBe(WASP.mass + PARTS.ion.mass);
		expect(stats.acceleration).toBeCloseTo(PARTS.ion.thrust / 70, 5);
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
