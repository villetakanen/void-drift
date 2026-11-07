import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, EncounterConfigSchema, SALVAGE } from "./schemas/salvage";
import { Simulation, stockSettings } from "./simulation";

const idle = {
	leftThruster: false,
	rightThruster: false,
	fire: false as const,
};
function scene(seed = 2026) {
	const system = new SalvageSystem(defaultLoadout("fighter"), seed);
	const ship = {
		pos: new Vec2(-10000, -10000),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 1,
	};
	const star = createStar("G", 960, 540);
	star.radius = 0;
	const resources = { hull: 100, power: 100 };
	const advance = (dt: number) =>
		system.step(dt, ship, star, resources, 100, ship.pos.x, ship.pos.y, false);
	return { system, ship, advance };
}
function next(s: ReturnType<typeof scene>) {
	const deadline = s.system.nextPass;
	s.advance(deadline - s.system.time - 0.00001);
	s.advance(0.00001);
	return deadline;
}
function fixed(group: number): SalvageBody {
	return {
		id: group,
		group,
		kind: "cell",
		x: 100,
		y: 100,
		previousX: 100,
		previousY: 100,
		vx: 0,
		vy: 0,
		radius: 6,
		hull: 1,
		life: 100000,
		rotation: 0,
	};
}
describe("boundary encounters", () => {
	it("validates encounter ranges and strictly inward headings", () => {
		expect(SALVAGE.wreck.life).toBeGreaterThanOrEqual(
			(2 * ENCOUNTER.radius) / ENCOUNTER.speedMin,
		);
		expect(
			EncounterConfigSchema.safeParse({ ...ENCOUNTER, speedMin: 501 }).success,
		).toBe(false);
		expect(
			EncounterConfigSchema.safeParse({ ...ENCOUNTER, intervalMin: NaN })
				.success,
		).toBe(false);
		expect(
			EncounterConfigSchema.safeParse({
				...ENCOUNTER,
				headingSpread: Math.PI / 2,
			}).success,
		).toBe(false);
	});
	it("samples boundary chords and speeds across their range independently of the player", () => {
		const a = scene(),
			b = scene();
		b.ship.pos.set(5000, 4000);
		b.ship.vel.set(900, -800);
		b.ship.rotation = 2.4;
		const speeds: number[] = [];
		for (let i = 0; i < 300; i++) {
			a.system.bodies = [];
			b.system.bodies = [];
			const dt = 0.00001;
			next(a);
			next(b);
			const body = a.system.bodies[0],
				other = b.system.bodies[0];
			// Recover the boundary position before this step's motion.
			const x = body.x - body.vx * dt - ENCOUNTER.centerX;
			const y = body.y - body.vy * dt - ENCOUNTER.centerY;
			const speed = Math.hypot(body.vx, body.vy);
			speeds.push(speed);
			expect(Math.hypot(x, y)).toBeCloseTo(ENCOUNTER.radius, 7);
			expect(
				(x * body.vx + y * body.vy) / (ENCOUNTER.radius * speed),
			).toBeLessThanOrEqual(-0.5 + 1e-9);
			expect([body.x, body.y, body.vx, body.vy]).toEqual([
				other.x,
				other.y,
				other.vx,
				other.vy,
			]);
		}
		expect(Math.min(...speeds)).toBeLessThan(105);
		expect(Math.max(...speeds)).toBeGreaterThan(495);
	});
	it("schedules independent steady gaps, skips full groups without backlog, and preserves later paths", () => {
		const a = scene(),
			b = scene();
		let previous = 3;
		const gaps: number[] = [];
		b.system.bodies = Array.from({ length: 8 }, (_, i) => fixed(i + 10));
		for (let i = 0; i < 100; i++) {
			a.system.bodies = [];
			const deadline = next(a);
			next(b);
			if (i) gaps.push(deadline - previous);
			previous = deadline;
			expect(b.system.groups).toBe(8);
			expect(b.system.passes).toBe(0);
			expect(b.system.nextPass).toBe(a.system.nextPass);
		}
		expect(Math.min(...gaps)).toBeGreaterThanOrEqual(6);
		expect(Math.min(...gaps)).toBeLessThan(6.2);
		expect(Math.max(...gaps)).toBeLessThanOrEqual(12);
		expect(Math.max(...gaps)).toBeGreaterThan(11.8);
		expect(gaps.reduce((x, y) => x + y, 0) / gaps.length).toBeGreaterThan(8);
		expect(gaps.reduce((x, y) => x + y, 0) / gaps.length).toBeLessThan(10);
		a.system.bodies = [];
		b.system.bodies = [];
		next(a);
		next(b);
		expect(b.system.bodies).toHaveLength(1);
		expect([
			a.system.bodies[0].x,
			a.system.bodies[0].y,
			a.system.bodies[0].vx,
			a.system.bodies[0].vy,
		]).toEqual([
			b.system.bodies[0].x,
			b.system.bodies[0].y,
			b.system.bodies[0].vx,
			b.system.bodies[0].vy,
		]);
	});
	it("keeps a group occupied until its last fragment, cell or wreck expires", () => {
		const s = scene();
		s.system.nextPass = Infinity;
		s.system.bodies = [
			{ ...fixed(42), id: 1, kind: "fragment", life: SALVAGE.fragment.life },
			{ ...fixed(42), id: 2, life: SALVAGE.cell.life },
			{ ...fixed(42), id: 3, kind: "wreck", life: SALVAGE.wreck.life },
		];
		s.advance(12.001);
		expect(s.system.bodies.map((body) => body.kind)).toEqual(["cell", "wreck"]);
		expect(s.system.groups).toBe(1);
		s.advance(8);
		expect(s.system.bodies.map((body) => body.kind)).toEqual(["wreck"]);
		expect(s.system.groups).toBe(1);
		s.advance(10);
		expect(s.system.groups).toBe(0);
	});
	it("keeps later timing and paths unchanged after combat consumes breakup randomness", () => {
		const a = scene(),
			b = scene();
		a.ship.pos.set(400, 400);
		a.system.bodies.push({
			...fixed(42),
			id: 1000,
			kind: "wreck",
			x: 400,
			y: 400,
			previousX: 400,
			previousY: 400,
			radius: 18,
			hull: 85,
		});
		a.advance(0.001);
		b.advance(0.001);
		expect(a.system.destroyed).toBe(1);
		a.ship.pos.set(-10000, -10000);
		for (let i = 0; i < 20; i++) {
			a.system.bodies = [];
			b.system.bodies = [];
			expect(next(a)).toBe(next(b));
			const left = a.system.bodies[0],
				right = b.system.bodies[0];
			expect([left.x, left.y, left.vx, left.vy]).toEqual([
				right.x,
				right.y,
				right.vx,
				right.vy,
			]);
		}
	});
	it("keeps paused and terminal sessions frozen and ignores old send inputs", () => {
		const settings = {
			...stockSettings("fighter"),
			mode: "derelicts" as const,
			loadout: defaultLoadout("fighter"),
		};
		const a = new Simulation(settings),
			b = new Simulation(settings);
		a.ship.pos.set(-100, 540);
		b.ship.pos.set(-100, 540);
		expect(a.salvage).toBeDefined();
		a.start();
		b.start();
		for (let i = 0; i < 240; i++) {
			a.step({ ...idle, sendDerelict: true });
			b.step(idle);
			if (i === 178) expect(a.salvage?.passes).toBe(0);
		}
		expect(a.salvage?.passes).toBe(1);
		expect(a.salvage).toEqual(b.salvage);
		for (const status of ["MENU", "GAME_OVER"] as const) {
			a.state.status = status;
			const before = JSON.stringify(a.salvage);
			for (let i = 0; i < 300; i++) a.step(idle);
			expect(JSON.stringify(a.salvage)).toBe(before);
		}
		const reset = new Simulation(settings);
		reset.ship.pos.set(-100, 540);
		reset.start();
		for (let i = 0; i < 240; i++) reset.step(idle);
		expect(reset.salvage).toEqual(b.salvage);
	});
});
