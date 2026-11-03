import { CONFIG, SURVIVAL_CONFIG, updateShip, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { Simulation, stockSettings } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };
function fly(
	overrides: Partial<ReturnType<typeof stockSettings>["profile"]>,
	input = both,
	ticks = 30,
) {
	const settings = stockSettings();
	settings.profile = {
		...settings.profile,
		thrustMultiplier: 1,
		turnMultiplier: 1,
		powerDrainMultiplier: 1,
		...overrides,
	};
	const sim = new Simulation(settings);
	sim.planets.length = 0;
	sim.ship.pos.set(1900, 540);
	sim.start();
	for (let i = 0; i < ticks; i++) sim.step(input);
	return sim;
}
describe("flight contract", () => {
	it("applies supplied thrust and power-drain multipliers", () => {
		const reference = fly({});
		const stronger = fly({ thrustMultiplier: 2, powerDrainMultiplier: 2 });
		expect(stronger.ship.pos.y).toBeLessThan(reference.ship.pos.y);
		expect(stronger.state.resources.power).toBeLessThan(
			reference.state.resources.power,
		);
	});
	it("applies supplied turn multipliers", () => {
		const input = { ...idle, leftThruster: true };
		const reference = fly({}, input);
		const faster = fly({ turnMultiplier: 2 }, input);
		expect(faster.ship.rotation + Math.PI / 2).toBeCloseTo(
			2 * (reference.ship.rotation + Math.PI / 2),
		);
	});
	it("reproduces validated replay exactly", () => {
		const a = new Simulation(),
			b = new Simulation();
		a.start();
		b.start();
		const inputs = [
			{ ...both, ticks: 180 },
			{ ...idle, leftThruster: true, ticks: 90 },
			{ ...both, ticks: 180 },
		];
		a.replay(inputs);
		b.replay(inputs);
		expect(a.ship).toEqual(b.ship);
		expect(a.state).toEqual(b.state);
		expect(a.ticks).toBe(450);
		expect(() => a.replay([{ ...both, ticks: Infinity }])).toThrow();
	});
	it("changes orbit phase with seed and rejects invalid tuning", () => {
		const settings = stockSettings();
		settings.seed = 50;
		expect(new Simulation(settings).planets[0].pos).not.toEqual(
			new Simulation().planets[0].pos,
		);
		expect(() => new Simulation({ ...settings, seed: NaN })).toThrow();
	});
	it("dies from depletion and freezes time until a fresh run", () => {
		const s = new Simulation();
		s.ship.pos.set(2000, 540);
		s.start();
		s.replay([{ ...idle, ticks: 10000 }]);
		expect(s.state.status).toBe("GAME_OVER");
		expect(s.state.deathCause).toBe("POWER");
		const ticks = s.ticks;
		s.step(both);
		expect(s.ticks).toBe(ticks);
		expect(new Simulation().state.resources.power).toBe(
			SURVIVAL_CONFIG.INITIAL_POWER,
		);
	});
	it("wraps antipodally with preserved inward momentum", () => {
		const s = new Simulation();
		s.start();
		s.ship.pos.set(2161, 540);
		s.ship.vel.set(100, 0);
		s.step(idle);
		expect(s.wraps).toBe(1);
		expect(s.ship.pos.x).toBeLessThan(960);
		expect(s.ship.vel.x).toBeGreaterThan(0);
		s.step(idle);
		expect(s.wraps).toBe(1);
	});
	it("a supplied stronger hull reduces equal star damage", () => {
		const settings = stockSettings();
		const runs = [1, 2].map(
			(hullMultiplier) =>
				new Simulation({
					...settings,
					profile: { ...settings.profile, hullMultiplier },
				}),
		);
		for (const sim of runs) {
			sim.start();
			sim.ship.pos.set(1040, 540);
			sim.step(idle);
		}
		expect(runs[0].state.resources.hull).toBeLessThan(
			runs[1].state.resources.hull,
		);
	});
});

describe("integrated gravity flight", () => {
	for (const id of ["scout", "fighter", "corvette"] as const) {
		it(`${id} coasts above the old cap and brakes with full thrust`, () => {
			const s = new Simulation(stockSettings(id));
			s.planets.length = 0;
			s.ship.pos.set(1500, 540);
			s.ship.vel.set(1500, 0);
			s.start();
			s.step(idle);
			expect(s.ship.vel.x).toBe(1500);
			s.ship.rotation = Math.PI;
			s.step(both);
			expect(s.ship.vel.x).toBeCloseTo(
				1500 - (CONFIG.THRUST_FORCE * s.settings.profile.thrustMultiplier) / 60,
				6,
			);
		});
	}
	it("escapes a supplied solar well under power while coasting falls inward", () => {
		const star = {
			...new Simulation().star,
			mass: 60,
			influenceRadius: 300,
			radius: 20,
		};
		const run = (input: typeof idle) => {
			const ship = {
				pos: new Vec2(star.pos.x + 250, star.pos.y),
				vel: new Vec2(0, 0),
				acc: new Vec2(0, 0),
				rotation: 0,
				radius: 1,
			};
			// Explicit fixture: 50 units to escape, 400 thrust, 600 cutoff.
			// Initial gravity is 4.4 and decreases outward. Even at 400 speed,
			// net acceleration exceeds 128, covering 50 units within one second.
			for (let tick = 0; tick < 240; tick++)
				updateShip(
					ship,
					input,
					1 / 240,
					1920,
					1080,
					star,
					[],
					undefined,
					undefined,
					{
						thrustMultiplier: 400 / CONFIG.THRUST_FORCE,
						turnMultiplier: 1,
						hullMultiplier: 1,
					},
					{ drag: 0, speedLimit: null },
					"inverse-square",
					null,
					600,
				);
			return ship;
		};
		expect(run(both).pos.x - star.pos.x).toBeGreaterThan(star.influenceRadius);
		expect(run(idle).pos.x - star.pos.x).toBeLessThan(250);
	});
	it("ends solar contact and resolves planetary contact with damage", () => {
		const sun = new Simulation();
		sun.start();
		sun.ship.pos.set(1000, 540);
		sun.step(idle);
		expect(sun.state.deathCause).toBe("STAR");
		const s = new Simulation();
		s.start();
		const planet = s.planets[0];
		s.planets.splice(1);
		planet.orbitCenter.set(1500, 540);
		planet.orbitRadius = 0;
		planet.orbitSpeed = 0;
		s.ship.pos.set(1500 - planet.radius - 15, 540);
		s.ship.vel.set(100, 0);
		s.step(idle);
		expect(s.ship.vel.x).toBeLessThan(0);
		expect(s.state.resources.hull).toBeLessThan(100);
		expect(s.ship.pos.x).toBeLessThanOrEqual(
			1500 - planet.radius - s.ship.radius,
		);
	});
	it("uses the fixed well reach after changing a planet's physical size", () => {
		const runs = [30, 1].map((radius) => {
			const sim = new Simulation();
			const planet = sim.planets[0];
			sim.planets.splice(1);
			planet.radius = radius;
			planet.orbitCenter.set(1500, 540);
			planet.orbitRadius = 0;
			planet.orbitSpeed = 0;
			sim.ship.pos.set(1650, 540);
			sim.start();
			sim.step(idle);
			return sim;
		});
		expect(runs[0].ship.vel.x).toBeLessThan(0);
		expect(runs[1].ship.vel).toEqual(runs[0].ship.vel);
	});
});
