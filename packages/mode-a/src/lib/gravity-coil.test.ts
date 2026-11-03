import { describe, expect, it } from "vitest";
import {
	BuildStoreSchema,
	buildStats,
	defaultBuilds,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
} from "./schemas/loadout";

describe("Gravity coil fitting", () => {
	it("fits and round-trips on every hull without adding solar charging, storage or draw", () => {
		const builds = defaultBuilds();
		for (const chassis of ["wasp", "scout", "fighter", "corvette"] as const) {
			const build = builds[chassis];
			const before = buildStats(build);
			build.hull.fill("gravity-coil");
			build.aft.fill("gravity-coil");
			expect(LoadoutSchema.parse(build)).toEqual(build);
			const after = buildStats(build);
			expect(after.mass).toBe(
				before.mass + 10 * (build.hull.length + build.aft.length),
			);
			expect(after.capacity).toBe(before.capacity);
			expect(after.coils).toBe(before.coils);
			expect(after.engineDraw).toBe(before.engineDraw);
		}
		expect(BuildStoreSchema.parse(JSON.parse(JSON.stringify(builds)))).toEqual(
			builds,
		);
		const solar = defaultLoadout("fighter");
		solar.hull[0] = "coil";
		expect(buildStats(solar).coils).toBe(2);
		expect(PARTS.coil.name).toBe("Loading coil");
	});
});
