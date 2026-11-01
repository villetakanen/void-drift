import { expect, it } from "vitest";
import { CHALLENGE } from "../schemas/highscore";
import { buildStats, starterLoadout } from "./schemas/loadout";
import { gameSettings, labSettings, Simulation } from "./simulation";

it("main-game fleet uses every engine mount and the selected energy packs", () => {
	for (const [id, aft, packs, capacity] of [
		["scout", 1, 0, 100],
		["balanced", 2, 1, 200],
		["tank", 3, 2, 300],
	] as const) {
		const build = starterLoadout(id);
		expect(build.side).toBe("ion");
		expect(build.aft).toEqual(Array(aft).fill("ion"));
		expect(build.hull.filter((part) => part === "battery")).toHaveLength(packs);
		expect(build.stabilizers).toBe(false);
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
