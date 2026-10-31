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

describe("four-engine player trial", () => {
	it("rejects obsolete saves and fission IDs", () => {
		const build = defaultLoadout("balanced");
		expect(LoadoutSchema.safeParse({ ...build, version: 1 }).success).toBe(
			false,
		);
		expect(LoadoutSchema.safeParse({ ...build, side: "fission" }).success).toBe(
			false,
		);
	});
	it("plasma has no thrust or steering until charged; release and power loss reset it", () => {
		const build = defaultLoadout("balanced");
		build.side = "plasma";
		const timers: EngineTimers = {};
		const ship = body();
		const left = { ...idle, leftThruster: true };
		for (let i = 0; i < 36; i++)
			applyBuildEngines(ship, build, left, 1 / 60, true, timers);
		expect(ship.vel.mag()).toBe(0);
		expect(ship.rotation).toBe(0);
		applyBuildEngines(ship, build, left, 1 / 60, true, timers);
		expect(ship.vel.mag()).toBeGreaterThan(0);
		expect(ship.rotation).toBeGreaterThan(0);
		applyBuildEngines(ship, build, idle, 1 / 60, true, timers);
		expect(timers.left).toBe(0);
		for (let i = 0; i < 20; i++)
			applyBuildEngines(ship, build, left, 1 / 60, true, timers);
		applyBuildEngines(ship, build, left, 1 / 60, false, timers);
		expect(timers.left).toBe(0);
	});
	it("fusion alternates firing and recovery at 40% duty", () => {
		const timers: EngineTimers = {};
		const outputs = Array.from({ length: 108 }, () =>
			engineDuty(PARTS.fusion, true, 1 / 240, timers, "pulse"),
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
		expect(engineDuty(PARTS.fusion, false, 1 / 60, timers, "pulse")).toBe(0);
		expect(engineDuty(PARTS.fusion, true, 1 / 60, timers, "pulse")).toBe(0);
	});
	it("heavy ion approaches 750, mixed low-ceiling engines do not brake it", () => {
		const build = defaultLoadout("balanced");
		build.side = "heavy-ion";
		build.aft = ["ion", "fusion"];
		const ship = body();
		const timers: EngineTimers = {};
		for (let i = 0; i < 12000; i++)
			applyBuildEngines(ship, build, both, 1 / 60, true, timers);
		expect(ship.vel.mag()).toBeGreaterThan(749);
		expect(ship.vel.mag()).toBeLessThanOrEqual(750.000001);
		ship.vel.set(1000, 0);
		applyBuildEngines(ship, build, both, 1 / 60, true, timers);
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
