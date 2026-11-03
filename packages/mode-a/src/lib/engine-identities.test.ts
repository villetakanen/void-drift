import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
	applyBuildEngines,
	type EngineTimers,
	engineDuty,
} from "./build-flight";
import { defaultLoadout, LoadoutSchema, PARTS } from "./schemas/loadout";
import { Simulation, stockSettings } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };
const body = () => ({
	pos: new Vec2(0, 0),
	vel: new Vec2(0, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 16,
});

// Test-owned timings and ceilings: production balance remains freely tunable.
const parts = {
	...PARTS,
	plasma: {
		...PARTS.plasma,
		response: "delayed" as const,
		chargeSeconds: 0.6,
		thrust: 50000,
	},
	fusion: {
		...PARTS.fusion,
		response: "pulse" as const,
		thrust: 45000,
		pulsePeriod: 0.45,
		pulseOn: 0.18,
		limit: 550,
	},
};
const ion = {
	acceleration: 220,
	maxSpeed: 340,
	bonus: 0.4,
	falloff: 0.8,
	maxTurn: 180,
};

describe("four-engine player trial", () => {
	it("rejects obsolete saves and fission IDs", () => {
		const build = defaultLoadout("fighter");
		expect(LoadoutSchema.safeParse({ ...build, version: 1 }).success).toBe(
			false,
		);
		expect(LoadoutSchema.safeParse({ ...build, side: "fission" }).success).toBe(
			false,
		);
	});
	it("plasma has no thrust or steering until charged; release and power loss reset it", () => {
		const build = defaultLoadout("fighter");
		// Isolate main engines from optional stabilizer assist.
		build.stabilizers = false;
		build.side = "plasma";
		const timers: EngineTimers = {};
		const ship = body();
		const left = { ...idle, leftThruster: true };
		const step = (input: typeof idle, powered = true) =>
			applyBuildEngines(
				ship,
				build,
				input,
				1 / 60,
				powered,
				timers,
				1,
				undefined,
				ion,
				parts,
			);
		for (let i = 0; i < 36; i++) step(left);
		expect(ship.vel.mag()).toBe(0);
		expect(ship.rotation).toBe(0);
		step(left);
		expect(ship.vel.mag()).toBeGreaterThan(0);
		expect(ship.rotation).toBeGreaterThan(0);
		step(idle);
		expect(timers.left).toBe(0);
		for (let i = 0; i < 20; i++) step(left);
		step(left, false);
		expect(timers.left).toBe(0);
	});
	it("fusion alternates firing and recovery at 40% duty", () => {
		const timers: EngineTimers = {};
		const outputs = Array.from({ length: 108 }, () =>
			engineDuty(parts.fusion, true, 1 / 240, timers, "pulse"),
		);
		expect(outputs[0]).toBe(1);
		expect(outputs[60]).toBe(0);
		expect(outputs.reduce<number>((a, b) => a + b, 0) / 108).toBeCloseTo(
			0.4,
			1,
		);
	});
	it("releasing fusion cannot retrigger its pulse during recovery", () => {
		const timers: EngineTimers = { pulse: 0.25 };
		expect(engineDuty(parts.fusion, false, 1 / 60, timers, "pulse")).toBe(0);
		expect(engineDuty(parts.fusion, true, 1 / 60, timers, "pulse")).toBe(0);
	});
	it("mixed ion and fusion approaches the higher fusion ceiling without clipping overspeed", () => {
		const build = defaultLoadout("fighter");
		build.side = "heavy-ion";
		build.aft = ["ion", "fusion"];
		const ship = body();
		const timers: EngineTimers = {};
		const step = () =>
			applyBuildEngines(
				ship,
				build,
				both,
				1 / 60,
				true,
				timers,
				1,
				undefined,
				ion,
				parts,
			);
		for (let i = 0; i < 12000; i++) step();
		expect(ship.vel.mag()).toBeGreaterThan(549);
		expect(ship.vel.mag()).toBeLessThanOrEqual(550.000001);
		ship.vel.set(1000, 0);
		step();
		expect(ship.vel.mag()).toBeCloseTo(1000);
	});
	it("simulation owns independent timing, pauses without charging and replays deterministically", () => {
		const loadout = defaultLoadout("scout");
		loadout.side = "plasma";
		loadout.aft = ["fusion"];
		const sims = [
			new Simulation({ ...stockSettings("scout"), loadout, testFlight: true }),
			new Simulation({ ...stockSettings("scout"), loadout, testFlight: true }),
		];
		for (const sim of sims) {
			sim.step(both);
			expect(sim.engineFeedback).toBe("");
			sim.start();
			for (let i = 0; i < 150; i++) sim.step(i < 50 || i > 70 ? both : idle);
		}
		expect(sims[0].ship.vel).toEqual(sims[1].ship.vel);
		expect(sims[0].state.resources).toEqual(sims[1].state.resources);
		const fresh = new Simulation({
			...stockSettings("scout"),
			loadout,
			testFlight: true,
		});
		fresh.start();
		fresh.step(both);
		expect(fresh.engineOutput.left).toBe(0);
		expect(fresh.engineFeedback).toContain("charging");
	});
});
