import { describe, expect, it } from "vitest";
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
		expect(base.capacity).toBe(100);
		build.hull = ["battery", "heavy-well"];
		const restored = LoadoutSchema.parse(JSON.parse(JSON.stringify(build)));
		expect(restored.hull).toEqual(["battery", "heavy-well"]);
		expect(buildStats(restored).capacity).toBe(325);
		expect(buildStats(restored).mass - base.mass).toBe(54);
		expect(PARTS["heavy-well"].mass).toBe(2 * PARTS.battery.mass);
		expect(
			LoadoutSchema.safeParse({ ...build, side: "heavy-well" }).success,
		).toBe(false);
	});
	it("starts a heavy fitting full and leaves idle consumption unchanged", () => {
		const loadout = defaultLoadout("fighter");
		loadout.hull[0] = "heavy-well";
		const sim = new Simulation({ ...labSettings("fighter"), loadout });
		expect(sim.state.resources.power).toBe(240);
		sim.start();
		for (let i = 0; i < 60; i++)
			sim.step({ leftThruster: false, rightThruster: false, fire: false });
		expect(sim.state.resources.power).toBeCloseTo(237, 5);
	});
});
