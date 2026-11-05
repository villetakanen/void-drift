import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain, engineImpulse } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	buildCollisionRadius,
	buildMounts,
	buildPlumeEmitters,
	engineOffset,
	nozzleOffset,
} from "./build-renderer";
import {
	buildStats,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
} from "./schemas/loadout";
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
	const loadout = defaultLoadout("fighter");
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
	});
	it("uses both controls for aft engines and cancels mirrored torque", () => {
		const build = defaultLoadout("fighter");
		// Isolate main engines from optional stabilizer assist.
		build.stabilizers = false;
		build.aft[0] = "ion";
		const baselineDrain = buildDrain(build, idle);
		expect(
			buildDrain(build, { ...idle, leftThruster: true }) - baselineDrain,
		).toBe(PARTS[build.side].draw);
		expect(buildDrain(build, both) - baselineDrain).toBe(
			2 * PARTS[build.side].draw + PARTS.ion.draw,
		);
		const a = ship();
		applyBuildEngines(a, build, both, 1 / 60, true);
		expect(a.rotation).toBe(0);
		const b = ship();
		applyBuildEngines(b, build, { ...idle, leftThruster: true }, 1 / 60, true);
		expect(b.rotation).toBeGreaterThan(0);
		expect(b.vel.y).toBeGreaterThan(0);
	});
	it("more mass reduces acceleration and turning", () => {
		const light = defaultLoadout("fighter"),
			heavy = defaultLoadout("fighter");
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
	it("mixed engines and repeated sideways thrust cannot exceed the shared powered ceiling", () => {
		const build = defaultLoadout("fighter");
		build.aft = ["ion", "fusion"];
		const a = ship();
		for (let i = 0; i < 30000; i++) {
			a.rotation = Math.atan2(a.vel.y, a.vel.x) + Math.PI / 3;
			applyBuildEngines(a, build, both, 1 / 60, true);
		}
		expect(a.vel.mag()).toBeLessThanOrEqual(
			buildStats(build).poweredCruiseCeiling + 1e-6,
		);
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
		loadout: defaultLoadout("fighter"),
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

it("supplies current outlets for every engine delivering output", () => {
	const loadout = defaultLoadout("corvette");
	// Isolate main engines from optional stabilizer assist.
	loadout.stabilizers = false;
	loadout.aft = ["ion", "rail", "fusion"];
	const sim = new Simulation({
		...stockSettings("corvette"),
		loadout,
		testFlight: true,
	});
	sim.ship.pos.set(1800, 540);
	sim.start();
	sim.step(both);
	expect(sim.plume.activeCount).toBe(4);
	sim.step(idle);
	expect(sim.plume.activeCount).toBe(0);
	for (let i = 0; i < 40; i++) sim.step(idle);
	expect(sim.plume.activeCount).toBe(0);
	sim.step({ ...idle, leftThruster: true });
	expect(sim.plume.activeCount).toBe(1);
});

it.each(["scout", "fighter", "corvette"] as const)(
	"%s shares mount geometry across propulsion, estimates, nozzles and collision",
	(chassis) => {
		const build = defaultLoadout(chassis);
		// Isolate main engines from optional stabilizer assist.
		build.stabilizers = false;
		build.aft.fill("ion");
		const mounts = buildMounts(build);
		expect(mounts[1]).toMatchObject({
			x: mounts[0].x,
			y: -mounts[0].y,
			angle: -mounts[0].angle,
		});
		const emitters = buildPlumeEmitters(build);
		const engines = mounts.filter((mount) => mount.group !== "hull");
		expect(emitters).toHaveLength(engines.length);
		for (const [i, emitter] of emitters.entries()) {
			const mount = engines[i];
			expect(emitter.angle).toBeCloseTo(mount.angle);
			expect(emitter.x / BUILD_FLIGHT_SCALE).toBeCloseTo(
				mount.x +
					(engineOffset(build, mount) - nozzleOffset(mount)) *
						Math.cos(mount.angle),
			);
			expect(emitter.y / BUILD_FLIGHT_SCALE).toBeCloseTo(
				mount.y +
					(engineOffset(build, mount) - nozzleOffset(mount)) *
						Math.sin(mount.angle),
			);
		}
		expect(emitters[0].y).toBeLessThan(mounts[0].y * BUILD_FLIGHT_SCALE);
		expect(emitters[1].y).toBeGreaterThan(mounts[1].y * BUILD_FLIGHT_SCALE);
		const stats = buildStats(build);
		expect(stats.turnRate).toBeGreaterThan(0);
		expect(stats.acceleration).toBeGreaterThan(0);
		const forward = ship();
		applyBuildEngines(forward, build, both, 1 / 60, true);
		expect(forward.vel.x * 60).toBeCloseTo(stats.acceleration);
		expect(forward.vel.y).toBe(0);
		expect(forward.rotation).toBe(0);
		const left = ship(),
			right = ship();
		applyBuildEngines(
			left,
			build,
			{ ...idle, leftThruster: true },
			1 / 60,
			true,
		);
		applyBuildEngines(
			right,
			build,
			{ ...idle, rightThruster: true },
			1 / 60,
			true,
		);
		expect(left.rotation * 60 * 60).toBeCloseTo(stats.turnRate);
		expect(left.rotation).toBeCloseTo(-right.rotation);
		expect(left.vel.x).toBeCloseTo(right.vel.x);
		expect(left.vel.y).toBeCloseTo(-right.vel.y);
		expect(
			new Simulation({ ...stockSettings(chassis), loadout: build }).ship.radius,
		).toBe(buildCollisionRadius(build));
	},
);

it("defaults missing stabilizers without replacing engines and preserves explicit choices", () => {
	for (const chassis of ["wasp", "scout", "fighter", "corvette"] as const) {
		const build = defaultLoadout(chassis);
		expect(build.stabilizers).toBe(true);
		expect(build.linkedEngines).toBe(false);
		const legacy = LoadoutSchema.parse({
			...build,
			side: "plasma",
			stabilizers: undefined,
		});
		expect(legacy.stabilizers).toBe(true);
		expect(legacy.side).toBe("plasma");
		expect(
			LoadoutSchema.parse({ ...build, stabilizers: false }).stabilizers,
		).toBe(chassis === "wasp");
	}
	const build = defaultLoadout("fighter");
	expect(
		LoadoutSchema.safeParse({ ...build, stabilizers: "yes" }).success,
	).toBe(false);
	expect(
		LoadoutSchema.safeParse({ ...build, linkedEngines: "yes" }).success,
	).toBe(false);
});

it("links every aft engine to either input with matching drain and power gating", () => {
	const build = defaultLoadout("fighter");
	build.stabilizers = false;
	build.aft = ["ion", "ion"];
	for (const linkedEngines of [false, true]) {
		build.linkedEngines = linkedEngines;
		for (const input of [
			idle,
			{ ...idle, leftThruster: true },
			{ ...idle, rightThruster: true },
			both,
		]) {
			const active = linkedEngines
				? input.leftThruster || input.rightThruster
				: input.leftThruster && input.rightThruster;
			const out = applyBuildEngines(ship(), build, input, 1 / 60, true);
			expect(out.aft.every((v) => v > 0)).toBe(active);
			const withoutAft = { ...build, aft: [null, null] };
			expect(buildDrain(build, input) - buildDrain(withoutAft, input)).toBe(
				active ? 2 * PARTS.ion.draw : 0,
			);
			expect(
				applyBuildEngines(ship(), build, input, 1 / 60, false).aft,
			).toEqual([0, 0]);
		}
	}
});
