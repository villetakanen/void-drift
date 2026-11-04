import { initializePlanets } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type GravityTuning, GravityTuningSchema } from "./schemas/gravity";
import { applyGravityTuning, Simulation } from "./simulation";
import { GRAVITY_TUNING } from "./tuning";

function bodies(tuning: GravityTuning) {
	const star = createStar("G", 960, 540);
	const planets = initializePlanets(960, 540);
	applyGravityTuning(star, planets, tuning);
	return { star, planets };
}

describe("gravity tuning", () => {
	it("is what the simulation flies", () => {
		const sim = new Simulation();
		const tuned = bodies(GRAVITY_TUNING);
		expect(sim.gravity).toEqual(GRAVITY_TUNING);
		expect(sim.star.mass).toBe(tuned.star.mass);
		expect(sim.star.influenceRadius).toBe(tuned.star.influenceRadius);
		expect(sim.planets.map((p) => p.well)).toEqual(
			tuned.planets.map((p) => p.well),
		);
	});

	it.each([
		["sunMultiplier", { sunMultiplier: GRAVITY_TUNING.sunMultiplier + 1 }],
		["planetStrength", { planetStrength: GRAVITY_TUNING.planetStrength * 2 }],
		["sunReachFactor", { sunReachFactor: GRAVITY_TUNING.sunReachFactor * 2 }],
		[
			"planetReach",
			{
				planetReach: {
					...GRAVITY_TUNING.planetReach,
					massScale: GRAVITY_TUNING.planetReach.massScale / 2,
				},
			},
		],
		[
			"curve",
			{
				curve:
					GRAVITY_TUNING.curve === "linear"
						? ("inverse-square" as const)
						: ("linear" as const),
			},
		],
	])("changing %s changes the bodies", (_, change) => {
		const stock = bodies(GRAVITY_TUNING);
		const changed = bodies(
			GravityTuningSchema.parse({ ...GRAVITY_TUNING, ...change }),
		);
		expect(changed).not.toEqual(stock);
	});

	it("scales sun strength and reach by its values", () => {
		const base = createStar("G", 960, 540);
		const { star } = bodies(GRAVITY_TUNING);
		expect(star.mass).toBe(base.mass * GRAVITY_TUNING.sunMultiplier);
		expect(star.influenceRadius).toBe(
			base.radius * GRAVITY_TUNING.sunReachFactor,
		);
	});

	it("rejects inverted reach bounds and unknown values", () => {
		const reach = GRAVITY_TUNING.planetReach;
		expect(
			GravityTuningSchema.safeParse({
				...GRAVITY_TUNING,
				planetReach: { ...reach, minRadii: reach.maxRadii + 1 },
			}).success,
		).toBe(false);
		expect(
			GravityTuningSchema.safeParse({ ...GRAVITY_TUNING, drag: 1 }).success,
		).toBe(false);
	});
});
