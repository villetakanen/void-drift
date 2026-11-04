import { describe, expect, it } from "vitest";
import {
	bounceOffSurface,
	MASS_WELL_G,
	MASS_WELL_G_2D,
	massWellAcceleration,
	massWellReach,
	Vec2,
} from "./Physics";

// Contract: docs/specs/gravity-tuning.md, "The well".
describe("mass well law", () => {
	const mass = 600;
	const size = 0.5;
	const reach = massWellReach(mass, size);

	it("pulls G × mass / distance² inside reach and nothing at or beyond it", () => {
		for (const d of [reach / 10, reach / 2, reach * 0.99])
			expect(massWellAcceleration(d, mass, size)).toBeCloseTo(
				(MASS_WELL_G * mass) / d ** 2,
				9,
			);
		expect(massWellAcceleration(reach, mass, size)).toBe(0);
		expect(massWellAcceleration(reach * 2, mass, size)).toBe(0);
	});

	it("moves only the cut-off when the size changes", () => {
		expect(massWellReach(mass, size * 2)).toBe(reach * 2);
		for (const d of [reach / 4, reach / 2, reach * 0.9])
			expect(massWellAcceleration(d, mass, size * 2)).toBe(
				massWellAcceleration(d, mass, size),
			);
		expect(massWellAcceleration(reach * 1.5, mass, size * 2)).toBeGreaterThan(
			0,
		);
	});

	it("pulls twice as hard at every distance with twice the mass", () => {
		for (const d of [reach / 4, reach / 2])
			expect(massWellAcceleration(d, mass * 2, size)).toBeCloseTo(
				2 * massWellAcceleration(d, mass, size),
				9,
			);
	});

	it("falls off as G₂ × mass / distance in a flat world, agreeing at 100 u", () => {
		for (const d of [reach / 10, reach / 2])
			expect(massWellAcceleration(d, mass, size, "inverse")).toBeCloseTo(
				(MASS_WELL_G_2D * mass) / d,
				9,
			);
		expect(massWellAcceleration(100, mass, size, "inverse")).toBeCloseTo(
			massWellAcceleration(100, mass, size, "inverse-square"),
			9,
		);
		expect(massWellAcceleration(reach, mass, size, "inverse")).toBe(0);
	});
});

describe("surface bounce", () => {
	it("places the ship on the surface and reflects its velocity, scaled by 0.8", () => {
		const ship = { pos: new Vec2(-30, 0), vel: new Vec2(100, 20) };
		const speed = bounceOffSurface(ship, { x: 0, y: 0 }, 50);
		expect(speed).toBeCloseTo(Math.hypot(100, 20), 9);
		expect(Math.hypot(ship.pos.x, ship.pos.y)).toBeCloseTo(50, 9);
		expect(ship.vel.x).toBeCloseTo(-80, 9);
		expect(ship.vel.y).toBeCloseTo(16, 9);
	});
	it("leaves a ship outside contact distance alone", () => {
		const ship = { pos: new Vec2(-60, 0), vel: new Vec2(100, 0) };
		expect(bounceOffSurface(ship, { x: 0, y: 0 }, 50)).toBeNull();
		expect(ship.vel.x).toBe(100);
	});
});
