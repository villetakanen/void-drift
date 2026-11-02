import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import { buildPlumeEmitters } from "./build-renderer";
import { ION_DEFAULTS, ionCeiling } from "./schemas/ion";
import {
	buildStats,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
} from "./schemas/loadout";
import { labSettings, Simulation, STEP } from "./simulation";
import { stabilizerMount } from "./stabilizers";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const left = { ...idle, leftThruster: true };
const both = { ...left, rightThruster: true };
const body = () => ({
	pos: new Vec2(0, 0),
	vel: new Vec2(0, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 1,
});

describe("accepted ion flight", () => {
	it("migrates absent stabilizer flags without replacing fitted engines", () => {
		const build = {
			...defaultLoadout("fighter"),
			side: "plasma",
			stabilizers: undefined,
		};
		expect(LoadoutSchema.parse(build).stabilizers).toBe(false);
		expect(LoadoutSchema.parse(build).side).toBe("plasma");
		expect(
			LoadoutSchema.safeParse({ ...build, stabilizers: "yes" }).success,
		).toBe(false);
	});
	it("Heavy gives 1.75 times Light force after accounting for installed mass", () => {
		const light = defaultLoadout("fighter"),
			heavy = { ...light, side: "heavy-ion" as const };
		expect(PARTS["heavy-ion"].draw / PARTS.ion.draw).toBe(1.75);
		const a = body(),
			b = body();
		applyBuildEngines(a, light, both, STEP, true);
		applyBuildEngines(b, heavy, both, STEP, true);
		expect(
			(b.vel.x * buildStats(heavy).mass) / (a.vel.x * buildStats(light).mass),
		).toBeCloseTo(1.75, 12);
	});
	it("counts directional force rather than installed engines for speed", () => {
		const build = defaultLoadout("fighter");
		const a = body();
		for (let i = 0; i < 12000; i++)
			applyBuildEngines(a, build, both, STEP, true);
		const ceiling = ionCeiling(2 * Math.cos((26 * Math.PI) / 180));
		expect(a.vel.mag()).toBeCloseTo(ceiling, 5);
		expect(ceiling).toBeLessThan(ionCeiling(2));
		expect(ionCeiling(1000)).toBeCloseTo(476);
		a.vel.set(1000, 0);
		for (let i = 0; i < 200; i++) applyBuildEngines(a, build, left, STEP, true);
		expect(a.vel.mag()).toBeLessThanOrEqual(1000.000001);
	});
	for (const chassis of ["fighter", "scout", "corvette"] as const) {
		it(`${chassis}: free fall persists, optional stabilizers assist crosswise and stop without reversing`, () => {
			const build = defaultLoadout(chassis),
				ship = body(),
				spin = { velocity: 0 };
			for (let i = 0; i < 30; i++)
				applyBuildEngines(ship, build, left, STEP / 4, true, {}, 1, spin);
			const free = spin.velocity;
			const heading = ship.rotation;
			applyBuildEngines(ship, build, idle, STEP, false, {}, 0, spin);
			expect(spin.velocity).toBe(free);
			expect(ship.rotation).toBeCloseTo(heading + free * STEP);
			build.stabilizers = true;
			const assist = applyBuildEngines(
				ship,
				build,
				left,
				STEP / 4,
				true,
				{},
				1,
				spin,
			);
			expect(assist.stabilizers).toEqual([0, 0.22]);
			expect(spin.velocity).toBeGreaterThan(free);
			const brake = applyBuildEngines(
				ship,
				build,
				both,
				STEP / 4,
				true,
				{},
				1,
				spin,
			);
			expect(brake.stabilizers[0]).toBeGreaterThan(0);
			for (let i = 0; i < 20000; i++) {
				applyBuildEngines(ship, build, idle, STEP / 4, true, {}, 1, spin);
				expect(spin.velocity).toBeGreaterThanOrEqual(0);
			}
			expect(spin.velocity).toBe(0);
			expect(
				applyBuildEngines(ship, build, idle, STEP / 4, true, {}, 1, spin)
					.stabilizers,
			).toEqual([0, 0]);
			const nozzles = buildPlumeEmitters(build).slice(-2);
			const m = stabilizerMount(chassis);
			expect(nozzles[0].y).toBeCloseTo(-nozzles[1].y);
			expect(Math.sin(nozzles[0].angle)).toBeGreaterThan(0);
			expect(m.lever).toBeLessThan(0);
		});
	}
	it("charges 0.25 Light-ion energy for assist and automatic braking with any main family", () => {
		const build = { ...defaultLoadout("fighter"), stabilizers: true };
		for (const side of ["ion", "heavy-ion", "fusion", "plasma"] as const) {
			build.side = side;
			expect(buildDrain(build, left)).toBe(
				3 + PARTS[side].draw + PARTS.ion.draw * 0.25,
			);
			expect(buildDrain(build, idle, 1)).toBe(3.5);
			expect(buildDrain(build, idle, 0)).toBe(3);
		}
		const sim = new Simulation({
			...labSettings(),
			loadout: build,
			testFlight: true,
		});
		sim.ship.pos.set(1900, 540);
		sim.start();
		sim.angularMotion.velocity = 1;
		const before = sim.state.resources.power;
		sim.step(idle);
		expect(before - sim.state.resources.power).toBeCloseTo(3.5 * STEP, 10);
		sim.state.resources.power = 0;
		const spin = sim.angularMotion.velocity;
		sim.step(idle);
		expect(sim.angularMotion.velocity).toBe(spin);
		expect(sim.engineOutput.stabilizers).toEqual([0, 0]);
	});
	it("replays the accepted sequence with spin and energy deterministically, then resets at rest", () => {
		const settings = labSettings();
		if (settings.loadout) settings.loadout.stabilizers = true;
		settings.testFlight = true;
		const sims = [new Simulation(settings), new Simulation(settings)];
		for (const sim of sims) {
			sim.start();
			for (const phase of [
				both,
				both,
				idle,
				left,
				idle,
				both,
				idle,
				{ ...idle, rightThruster: true },
				idle,
				{ ...idle, rightThruster: true },
				idle,
				both,
				both,
				both,
			])
				for (let i = 0; i < 60; i++) sim.step(phase);
		}
		expect(sims[0].ship).toEqual(sims[1].ship);
		expect(sims[0].angularMotion).toEqual(sims[1].angularMotion);
		expect(sims[0].state).toEqual(sims[1].state);
		expect(Math.abs(sims[0].angularMotion.velocity)).toBeLessThanOrEqual(
			(ION_DEFAULTS.maxTurn * Math.PI) / 180,
		);
		expect(new Simulation(settings).angularMotion.velocity).toBe(0);
	});
});
