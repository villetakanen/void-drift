import { describe, expect, it } from "vitest";
import { MASS_WELL_G, massWellAcceleration, massWellReach } from "./Physics";

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
});
