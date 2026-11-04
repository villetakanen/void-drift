import { describe, expect, it } from "vitest";
import {
	bounceOffSurface,
	MASS_WELL_G,
	MASS_WELL_G_2D,
	massWellAcceleration,
	massWellPull,
	massWellReach,
	Vec2,
} from "./Physics";

// Contract: docs/specs/gravity-tuning.md, "The well".
describe("mass well law", () => {
	const mass = 2400;
	const cutoff = 50;

	for (const falloff of ["inverse-square", "inverse"] as const) {
		const reach = massWellReach(mass, cutoff, falloff);

		it(`${falloff}: pulls by the law inside reach and nothing at or beyond it`, () => {
			for (const d of [reach / 10, reach / 2, reach * 0.99])
				expect(massWellAcceleration(d, mass, cutoff, falloff)).toBeCloseTo(
					massWellPull(d, mass, falloff),
					9,
				);
			expect(massWellAcceleration(reach, mass, cutoff, falloff)).toBe(0);
			expect(massWellAcceleration(reach * 2, mass, cutoff, falloff)).toBe(0);
		});

		it(`${falloff}: ends the reach where the pull falls to the cut-off`, () => {
			expect(massWellPull(reach, mass, falloff)).toBeCloseTo(cutoff, 9);
		});

		it(`${falloff}: a lower cut-off extends the reach and leaves the pull inside unchanged`, () => {
			expect(massWellReach(mass, cutoff / 2, falloff)).toBeGreaterThan(reach);
			for (const d of [reach / 4, reach / 2, reach * 0.9])
				expect(massWellAcceleration(d, mass, cutoff / 2, falloff)).toBe(
					massWellAcceleration(d, mass, cutoff, falloff),
				);
		});

		it(`${falloff}: pulls twice as hard at every distance with twice the mass`, () => {
			for (const d of [reach / 4, reach / 2])
				expect(massWellAcceleration(d, mass * 2, cutoff, falloff)).toBeCloseTo(
					2 * massWellAcceleration(d, mass, cutoff, falloff),
					9,
				);
		});
	}

	it("uses G for 1/d² and G₂ for 1/d, equal at G / G₂ u", () => {
		expect(massWellPull(200, mass)).toBeCloseTo(
			(MASS_WELL_G * mass) / 200 ** 2,
			9,
		);
		expect(massWellPull(200, mass, "inverse")).toBeCloseTo(
			(MASS_WELL_G_2D * mass) / 200,
			9,
		);
		const equal = MASS_WELL_G / MASS_WELL_G_2D;
		expect(massWellPull(equal, mass, "inverse")).toBeCloseTo(
			massWellPull(equal, mass),
			9,
		);
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
