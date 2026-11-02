import { expect, it } from "vitest";
import { CHALLENGE } from "../schemas/highscore";
import { buildStats, fittedParts, starterLoadout } from "./schemas/loadout";
import { gameSettings, labSettings, Simulation } from "./simulation";

it("main-game fleet uses every engine mount and the selected energy packs", () => {
	for (const [id, aft, packs, capacity] of [
		["scout", 1, 0, 100],
		["fighter", 2, 1, 185],
		["corvette", 3, 2, 270],
	] as const) {
		const build = starterLoadout(id);
		expect(build.side).toBe("ion");
		expect(build.aft).toEqual(Array(aft).fill("ion"));
		expect(build.hull.filter((part) => part === "battery")).toHaveLength(packs);
		expect(build.stabilizers).toBe(true);
		expect(labSettings(id).loadout?.stabilizers).toBe(false);
		expect(buildStats(build).capacity).toBe(capacity);
		const sim = new Simulation(gameSettings(id));
		expect(sim.settings.loadout).toEqual(build);
		expect(sim.state.resources.power).toBe(capacity);
		sim.start();
		sim.step({ leftThruster: true, rightThruster: true, fire: false });
		expect(sim.engineOutput.aft).toHaveLength(aft);
		expect(sim.engineOutput.aft.every((output) => output > 0)).toBe(true);
		expect(labSettings(id).loadout?.aft.every((part) => part === null)).toBe(
			true,
		);
	}
	expect(CHALLENGE).toBe("ion-1");
});

it("fitted parts list every mounted part once per mount", () => {
	const count = (id: Parameters<typeof starterLoadout>[0]) => {
		const counts: Record<string, number> = {};
		for (const part of fittedParts(starterLoadout(id)))
			counts[part] = (counts[part] ?? 0) + 1;
		return counts;
	};
	expect(count("scout")).toEqual({ ion: 3 });
	expect(count("fighter")).toEqual({ ion: 4, battery: 1 });
	expect(count("corvette")).toEqual({ ion: 5, battery: 2 });
	expect(count("wasp")).toEqual({ ion: 1 });
});
