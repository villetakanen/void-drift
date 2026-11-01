import { expect, it } from "vitest";
import {
	plasmaVariants,
	simulatePlasma,
} from "../../../../apps/web/src/components/studies/plasma-bench";

it("includes immediate stabilizer assistance and coast braking in all six configurations", () => {
	const runs = simulatePlasma();
	expect(runs).toHaveLength(6);
	expect(plasmaVariants.every((v) => v.build.stabilizers)).toBe(true);
	for (const index of [2, 5]) {
		expect(runs[index][36].distance).toBe(0);
		expect(runs[index][37].speed).toBeGreaterThan(0);
		// Stabilizers respond during the main engine's recharge.
		expect(runs[index][181].spin).toBeGreaterThan(0);
		expect(Math.abs(runs[index][270].spin ?? 0)).toBeLessThan(
			Math.abs(runs[index][240].spin ?? 0),
		);
	}
	for (const run of runs) {
		expect(run).toHaveLength(841);
		expect(run.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(
			true,
		);
	}
});
it("isolates delay, reuses invariant ion runs and validates slider bounds", () => {
	const baseline = simulatePlasma();
	const short = simulatePlasma({ delay: 0.1 });
	const long = simulatePlasma({ delay: 0.99 });
	for (const i of [0, 1, 3]) {
		expect(short[i]).toBe(baseline[i]);
		expect(long[i]).toBe(baseline[i]);
	}
	expect(short[2][6].speed).toBe(0);
	expect(short[2][7].speed).toBeGreaterThan(0);
	expect(long[2][59].speed).toBe(0);
	expect(long[2][60].speed).toBeGreaterThan(0);
	expect(simulatePlasma()).toEqual(baseline);
	for (const delay of [0, 1, 0.105, Number.NaN])
		expect(() => simulatePlasma({ delay })).toThrow();
});
