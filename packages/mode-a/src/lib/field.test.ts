import { describe, expect, it } from "vitest";
import { GravityFieldSchema } from "./schemas/gravity";
import {
	gameSettings,
	labWellPull,
	Simulation,
	stockSettings,
} from "./simulation";
import { GRAVITY_TUNING } from "./tuning";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { leftThruster: true, rightThruster: true, fire: false };
const well = {
	label: "W1",
	x: 1400,
	y: 300,
	reach: 260,
	strength: 900,
	curve: "inverse-square" as const,
};
function fly(sim: Simulation, ticks: number, input = idle) {
	sim.start();
	const path = [];
	for (let tick = 0; tick < ticks && sim.state.status === "PLAYING"; tick++) {
		sim.step(input);
		path.push({
			x: sim.ship.pos.x,
			y: sim.ship.pos.y,
			vx: sim.ship.vel.x,
			vy: sim.ship.vel.y,
		});
	}
	return path;
}

describe("gravity field", () => {
	it("flies as play when given the default field", () => {
		for (const input of [idle, both]) {
			const a = fly(new Simulation(gameSettings()), 600, input);
			const b = fly(new Simulation(gameSettings(), { field: {} }), 600, input);
			expect(b).toEqual(a);
		}
	});

	it("has no sun pull, heat or planets in an empty system", () => {
		const sim = new Simulation(gameSettings(), {
			field: {
				system: "empty",
				start: { x: 960, y: 900, heading: -90, speed: 60 },
			},
		});
		const start = { ...sim.ship.vel };
		const path = fly(sim, 600);
		expect(sim.planets).toHaveLength(0);
		expect(sim.hasSun).toBe(false);
		for (const sample of path)
			expect({ x: sample.vx, y: sample.vy }).toEqual(start);
		expect(sim.state.resources.hull).toBe(100);
	});

	it("pulls toward a Lab well inside its reach only, with no surface", () => {
		const at = (x: number, speed = 0) =>
			new Simulation(gameSettings(), {
				field: {
					system: "empty",
					orbits: "frozen",
					wells: [well],
					start: { x, y: well.y, heading: 0, speed },
				},
			});
		const outside = at(well.x - well.reach - 1);
		fly(outside, 1);
		expect(outside.ship.vel.x).toBe(0);
		const inside = at(well.x - well.reach / 2);
		fly(inside, 1);
		expect(inside.ship.vel.x).toBeGreaterThan(0);
		const through = at(well.x - well.reach + 1, 400);
		const path = fly(through, 120);
		expect(Math.max(...path.map((p) => p.x))).toBeGreaterThan(well.x + 50);
	});

	it("sums overlapping Lab wells", () => {
		const second = { ...well, label: "W2", x: well.x + 100 };
		const at = { x: well.x + 50, y: well.y + 80 };
		const one = labWellPull([well], at, 16);
		const two = labWellPull([second], at, 16);
		const sum = labWellPull([well, second], at, 16);
		expect(sum.x).toBeCloseTo(one.x + two.x, 9);
		expect(sum.y).toBeCloseTo(one.y + two.y, 9);
	});

	it("holds planets still when orbits are frozen", () => {
		const sim = new Simulation(gameSettings(), { field: { orbits: "frozen" } });
		const before = sim.planets.map((p) => ({ x: p.pos.x, y: p.pos.y }));
		fly(sim, 120);
		expect(sim.planets.map((p) => ({ x: p.pos.x, y: p.pos.y }))).toEqual(
			before,
		);
	});

	it("starts the ship at the given position, heading and speed", () => {
		const sim = new Simulation(gameSettings(), {
			field: { start: { x: 300, y: 200, heading: 90, speed: 50 } },
		});
		expect(sim.ship.pos).toMatchObject({ x: 300, y: 200 });
		expect(sim.ship.rotation).toBeCloseTo(Math.PI / 2, 12);
		expect(sim.ship.vel.x).toBeCloseTo(0, 9);
		expect(sim.ship.vel.y).toBeCloseTo(50, 9);
	});

	it("applies gravity changes over the game's tuning", () => {
		const planetStrength = GRAVITY_TUNING.planetStrength * 2;
		const sim = new Simulation(gameSettings(), {
			field: { changes: { planetStrength } },
		});
		expect(sim.gravity).toEqual({ ...GRAVITY_TUNING, planetStrength });
		for (const planet of sim.planets)
			expect(planet.well?.strength).toBe(planetStrength);
	});

	it("rejects impossible fields", () => {
		const inside = (start: object) => () =>
			new Simulation(gameSettings(), {
				field: { start: { heading: 0, speed: 0, ...start } },
			});
		expect(inside({ x: 960, y: 540 })).toThrow(/sun/);
		const planet = new Simulation(gameSettings()).planets[0];
		expect(inside({ x: planet.pos.x, y: planet.pos.y })).toThrow(/planet/);
		expect(
			() =>
				new Simulation({ ...stockSettings(), testFlight: true }, { field: {} }),
		).toThrow();
		const invalid = [
			{
				wells: Array.from({ length: 5 }, (_, i) => ({
					...well,
					label: `W${i}`,
				})),
			},
			{ wells: [{ ...well, x: 960 + 1300 }] },
			{ wells: [{ ...well, strength: -1 }] },
			{ start: { x: 960, y: 540 + 1300, heading: 0, speed: 0 } },
			{ changes: { sunMultiplier: 1 } },
			{ changes: { drag: 1 } },
			{ planets: [] },
		];
		for (const field of invalid)
			expect(GravityFieldSchema.safeParse(field).success).toBe(false);
	});
});

describe("game sun scenarios (gravity-field.md)", () => {
	function sunFlight(start: {
		x: number;
		y: number;
		heading: number;
		speed: number;
	}) {
		const sim = new Simulation(gameSettings(), { field: { start } });
		sim.planets.length = 0;
		return sim;
	}

	it("ends the run with STAR when going too deep", () => {
		const reach = new Simulation(gameSettings()).star.influenceRadius;
		const sim = sunFlight({
			x: 960 - 0.9 * reach,
			y: 540,
			heading: 0,
			speed: 0,
		});
		fly(sim, 840);
		expect(sim.state.deathCause).toBe("STAR");
	});

	it("bends a fast close pass and lets it escape", () => {
		const { star } = new Simulation(gameSettings());
		const reach = star.influenceRadius;
		const offset = 0.45 * reach;
		const sim = sunFlight({
			x: 960 - reach - 20,
			y: 540 + offset,
			heading: 0,
			speed: 500,
		});
		const path = fly(sim, 840);
		const distances = path.map((p) => Math.hypot(p.x - 960, p.y - 540));
		const closest = Math.min(...distances);
		expect(closest).toBeLessThan(reach / 2);
		expect(closest).toBeGreaterThan(star.radius + sim.ship.radius);
		expect(path.at(-1)?.vy).toBeLessThan(0);
		expect(
			distances.findIndex(
				(d, i) => i > distances.indexOf(closest) && d > reach,
			),
		).toBeGreaterThan(-1);
		expect(sim.state.deathCause).toBeNull();
	});
});
