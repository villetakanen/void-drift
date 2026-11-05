import { describe, expect, it } from "vitest";
import { buildDrain } from "./build-flight";
import {
	buildStats,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
} from "./schemas/loadout";
import { labSettings, Simulation } from "./simulation";

describe("Potential Well fittings", () => {
	it("preserves saved battery IDs and combines both reserves without changing intrinsic capacity", () => {
		const build = defaultLoadout("fighter");
		const base = buildStats(build);
		build.hull = ["battery", "heavy-well"];
		const restored = LoadoutSchema.parse(JSON.parse(JSON.stringify(build)));
		expect(restored.hull).toEqual(["battery", "heavy-well"]);
		expect(buildStats(restored).capacity).toBe(
			base.capacity + PARTS.battery.capacity + PARTS["heavy-well"].capacity,
		);
		expect(buildStats(restored).mass - base.mass).toBe(
			PARTS.battery.mass + PARTS["heavy-well"].mass,
		);
		expect(
			LoadoutSchema.safeParse({ ...build, side: "heavy-well" }).success,
		).toBe(false);
	});
	it.each(["battery", "heavy-well"] as const)(
		"starts %s full without multiplying life support",
		(part) => {
			const idle = { leftThruster: false, rightThruster: false, fire: false };
			const loadout = defaultLoadout("fighter");
			const baselineDrain = buildDrain(loadout, idle);
			expect(baselineDrain).toBe(1.5);
			loadout.hull[0] = part;
			const capacity = buildStats(loadout).capacity;
			expect(buildDrain(loadout, idle)).toBe(baselineDrain);
			const sim = new Simulation({ ...labSettings("fighter"), loadout });
			sim.ship.pos.set(1900, 540);
			expect(sim.state.resources.power).toBe(capacity);
			expect(buildStats(loadout).endurance).toBeCloseTo(
				capacity / baselineDrain,
			);
			sim.start();
			for (let i = 0; i < 60; i++) sim.step(idle);
			expect(sim.state.resources.power).toBeCloseTo(
				capacity - baselineDrain,
				5,
			);
		},
	);
});
