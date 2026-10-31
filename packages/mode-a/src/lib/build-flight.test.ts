import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain, engineImpulse } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	buildMounts,
	buildPlumeEmitters,
} from "./build-renderer";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
import { Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
function ship() {
	return {
		pos: new Vec2(0, 0),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
}
function simulation(testFlight = false) {
	const loadout = defaultLoadout("balanced");
	loadout.hull[0] = "battery";
	const sim = new Simulation({ ...stockSettings(), loadout, testFlight });
	sim.ship.pos.set(1900, 540);
	sim.start();
	return sim;
}
describe("ship builder contract", () => {
	it("validates fixed mounts and mandatory identical side engines", () => {
		const build = defaultLoadout("scout");
		expect(LoadoutSchema.safeParse({ ...build, hull: ["ion"] }).success).toBe(
			false,
		);
		expect(
			LoadoutSchema.safeParse({ ...build, aft: [null, null] }).success,
		).toBe(false);
		expect(LoadoutSchema.safeParse({ ...build, side: null }).success).toBe(
			false,
		);
		expect(buildStats(build).mass).toBe(92);
	});
	it("adds capacity without multiplying life support and begins full", () => {
		const sim = simulation();
		expect(sim.state.resources.power).toBe(200);
		for (let i = 0; i < 60; i++) sim.step(idle);
		expect(sim.state.resources.power).toBeCloseTo(197, 5);
		expect(
			buildStats(LoadoutSchema.parse(sim.settings.loadout)).endurance,
		).toBeCloseTo(200 / 3);
	});
	it("uses both controls for aft engines and cancels mirrored torque", () => {
		const build = defaultLoadout("balanced");
		build.aft[0] = "ion";
		expect(buildDrain(build, idle)).toBe(3);
		expect(buildDrain(build, { ...idle, leftThruster: true })).toBe(6);
		expect(buildDrain(build, both)).toBe(11);
		const a = ship();
		applyBuildEngines(a, build, both, 1 / 60, true);
		expect(a.rotation).toBe(0);
		const b = ship();
		applyBuildEngines(b, build, { ...idle, leftThruster: true }, 1 / 60, true);
		expect(b.rotation).toBeGreaterThan(0);
		expect(b.vel.y).toBeGreaterThan(0);
	});
	it("more mass reduces acceleration and turning", () => {
		const light = defaultLoadout("balanced"),
			heavy = defaultLoadout("balanced");
		heavy.hull[0] = "battery";
		expect(buildStats(heavy).acceleration).toBeLessThan(
			buildStats(light).acceleration,
		);
		expect(Math.abs(buildStats(heavy).turnRate)).toBeLessThan(
			Math.abs(buildStats(light).turnRate),
		);
	});
	it("preserves slingshot overspeed while steering and permits full braking", () => {
		const a = ship();
		a.vel.set(1100, 0);
		engineImpulse(a, Math.PI / 2, 200, 350, 1 / 60);
		expect(a.vel.mag()).toBeCloseTo(1100, 8);
		expect(a.vel.y).toBeGreaterThan(0);
		engineImpulse(a, 0, 200, 350, 1 / 60);
		expect(a.vel.mag()).toBeLessThanOrEqual(1100.000001);
		const b = ship();
		b.vel.set(1100, 0);
		engineImpulse(b, Math.PI, 200, 350, 1 / 60);
		expect(b.vel.x).toBeCloseTo(1100 - 200 / 60);
	});
	it("mixed engines and repeated sideways thrust cannot exceed the fastest powered limit", () => {
		const build = defaultLoadout("balanced");
		build.aft = ["ion", "fusion"];
		const a = ship();
		for (let i = 0; i < 30000; i++) {
			a.rotation = Math.atan2(a.vel.y, a.vel.x) + Math.PI / 3;
			applyBuildEngines(a, build, both, 1 / 60, true);
		}
		expect(a.vel.mag()).toBeLessThanOrEqual(550.000001);
	});
	it("ends survival at empty energy but keeps damaged/empty test flights running", () => {
		const a = simulation();
		a.state.resources.power = 0.01;
		a.step(idle);
		expect(a.state.deathCause).toBe("POWER");
		const b = simulation(true);
		b.state.resources.power = 0;
		b.state.resources.hull = 0;
		b.step(both);
		expect(b.state.status).toBe("PLAYING");
		expect(b.engineOutput.left).toBe(0);
		b.ship.pos.set(980, 540);
		b.step(idle);
		expect(b.state.resources.power).toBeGreaterThan(0);
	});
	it("uses incoming charge with held controls and cannot thrust on unavailable energy", () => {
		const sim = simulation(true);
		sim.ship.pos.set(980, 540);
		sim.state.resources.power = 0;
		sim.step(both);
		expect(sim.engineOutput.left).toBeGreaterThan(0);
		expect(sim.state.resources.power).toBe(0);
		expect(sim.state.status).toBe("PLAYING");
		sim.ship.pos.set(1900, 540);
		sim.step(both);
		expect(sim.engineOutput.left).toBe(0);
	});

	it("replays assembled flight deterministically", () => {
		const a = simulation(true),
			b = simulation(true);
		for (let i = 0; i < 300; i++) {
			a.step(both);
			b.step(both);
		}
		expect(a.ship).toEqual(b.ship);
		expect(a.state).toEqual(b.state);
	});
});

it("preserves established gravity and overspeed coasting for assembled ships", () => {
	const stock = new Simulation(stockSettings());
	const assembled = new Simulation({
		...stockSettings(),
		loadout: defaultLoadout("balanced"),
	});
	expect(assembled.star).toEqual(stock.star);
	expect(assembled.planets).toEqual(stock.planets);
	for (const sim of [stock, assembled]) {
		sim.ship.pos.set(600, 300);
		sim.ship.vel.set(0, 1100);
		sim.start();
	}
	for (let tick = 0; tick < 60; tick++) {
		stock.step(idle);
		assembled.step(idle);
		expect(assembled.ship.pos).toEqual(stock.ship.pos);
		expect(assembled.ship.vel).toEqual(stock.ship.vel);
	}
	expect(assembled.ship.vel.mag()).toBeGreaterThan(500);
});

it("emits shared fading surfaces for every active installed engine", () => {
	const loadout = defaultLoadout("tank");
	loadout.aft = ["ion", "rail", "fusion"];
	const sim = new Simulation({
		...stockSettings("tank"),
		loadout,
		testFlight: true,
	});
	sim.ship.pos.set(1800, 540);
	sim.start();
	sim.step(both);
	expect(sim.plume.count).toBe(4);
	sim.step(idle);
	expect(sim.plume.count).toBe(4);
	for (let i = 0; i < 40; i++) sim.step(idle);
	expect(sim.plume.count).toBe(0);
	sim.step({ ...idle, leftThruster: true });
	expect(sim.plume.count).toBe(1);
});

it("uses accepted mount geometry for propulsion, estimates, nozzles and collision", () => {
	const build = defaultLoadout("balanced");
	const mounts = buildMounts(build);
	expect(mounts.map(({ x, y }) => [x, y])).toEqual([
		[-12, -15],
		[-12, 15],
		[2, 0],
		[-10, 0],
		[-17, -5],
		[-17, 5],
	]);
	const emitters = buildPlumeEmitters(build);
	for (const [i, emitter] of emitters.entries()) {
		const mount = mounts[i];
		expect(emitter.angle).toBeCloseTo(
			((26 * Math.PI) / 180) * (i === 0 ? 1 : -1),
		);
		expect(emitter.x / BUILD_FLIGHT_SCALE).toBeCloseTo(
			mount.x - 12 * Math.cos(mount.angle),
		);
		expect(emitter.y / BUILD_FLIGHT_SCALE).toBeCloseTo(
			mount.y - 12 * Math.sin(mount.angle),
		);
	}
	const stats = buildStats(build);
	expect((stats.turnRate * 180) / Math.PI).toBeCloseTo(193.18192, 3);
	expect(stats.acceleration).toBeCloseTo(679.40338, 3);
	const forward = ship();
	applyBuildEngines(forward, build, both, 1 / 60, true);
	expect(forward.vel.x * 60).toBeCloseTo(stats.acceleration);
	expect(forward.vel.y).toBe(0);
	const left = ship(),
		right = ship();
	applyBuildEngines(left, build, { ...idle, leftThruster: true }, 1 / 60, true);
	applyBuildEngines(
		right,
		build,
		{ ...idle, rightThruster: true },
		1 / 60,
		true,
	);
	expect(left.rotation * 60).toBeCloseTo(stats.turnRate);
	expect(left.rotation).toBeCloseTo(-right.rotation);
	expect(left.vel.x).toBeCloseTo(right.vel.x);
	expect(left.vel.y).toBeCloseTo(-right.vel.y);
	expect(
		new Simulation({ ...stockSettings(), loadout: build }).ship.radius,
	).toBeCloseTo(31.2);
});
