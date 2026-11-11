import { describe, expect, it } from "vitest";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
import { labSettings, Simulation } from "./simulation";

describe("Potential Well fittings", () => {
  it("preserves saved battery IDs", () => {
    const build = defaultLoadout("fighter");
    build.hull = ["battery", "heavy-well"];
    const restored = LoadoutSchema.parse(JSON.parse(JSON.stringify(build)));
    expect(restored.hull).toEqual(["battery", "heavy-well"]);
  });
  it("starts a run with a fitted battery full", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "battery";
    const sim = new Simulation({ ...labSettings("fighter"), loadout });
    expect(sim.state.resources.power).toBe(buildStats(loadout).capacity);
  });
});
