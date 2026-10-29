import { describe, expect, it } from "vitest";
import { Simulation, stockSettings } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };
function fly(id: "scout" | "balanced" | "tank", ticks = 120) {
	const s = new Simulation(stockSettings(id));
	s.start();
	for (let i = 0; i < ticks; i++) s.step(both);
	return s;
}
describe("flight contract", () => {
	it("applies ship thrust and power drain", () => {
		const scout = fly("scout"),
			balanced = fly("balanced"),
			tank = fly("tank");
		expect(scout.ship.pos.y).toBeLessThan(balanced.ship.pos.y);
		expect(balanced.ship.pos.y).toBeLessThan(tank.ship.pos.y);
		expect(scout.state.resources.power).toBeLessThan(
			tank.state.resources.power,
		);
	});
	it("applies turn multipliers", () => {
		const a = new Simulation(stockSettings("scout")),
			b = new Simulation(stockSettings("tank"));
		a.start();
		b.start();
		for (let i = 0; i < 30; i++) {
			a.step({ ...idle, leftThruster: true });
			b.step({ ...idle, leftThruster: true });
		}
		expect(a.ship.rotation).toBeGreaterThan(b.ship.rotation);
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
		expect(new Simulation().state.resources.power).toBe(100);
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
	it("tank hull absorbs more equal star damage", () => {
		const a = new Simulation(stockSettings("scout")),
			b = new Simulation(stockSettings("tank"));
		a.start();
		b.start();
		a.ship.pos.set(1040, 540);
		b.ship.pos.set(1040, 540);
		a.step(idle);
		b.step(idle);
		expect(a.state.resources.hull).toBeLessThan(b.state.resources.hull);
	});
});

describe("integrated gravity flight", () => {
	for (const id of ["scout", "balanced", "tank"] as const) {
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
				1500 - (400 * s.settings.profile.thrustMultiplier) / 60,
				6,
			);
		});
		it(`${id} can power outward from the outer solar well`, () => {
			const s = new Simulation(stockSettings(id));
			s.planets.length = 0;
			s.ship.pos.set(1210, 540);
			s.ship.rotation = 0;
			s.start();
			for (let tick = 0; tick < 120; tick++) s.step(both);
			expect(s.state.status).toBe("PLAYING");
			expect(s.ship.pos.x - 960).toBeGreaterThan(s.star.influenceRadius);
			expect(s.ship.vel.x).toBeGreaterThan(0);
		});
	}
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
	it("retains planet reaches independently of physical size", () => {
		const s = new Simulation();
		for (const p of s.planets) {
			const reach = p.well?.reach;
			p.radius *= 2;
			expect(p.well?.reach).toBe(reach);
			expect(p.well?.strength).toBe(600);
		}
	});
});
