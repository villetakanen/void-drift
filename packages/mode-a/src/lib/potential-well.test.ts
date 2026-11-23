import { describe, expect, it } from "vitest";
import { buildStats, defaultLoadout } from "./schemas/loadout";
import { labSettings, Simulation } from "./simulation";

describe("Potential Well fittings", () => {
  it("starts a run with a fitted battery full", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "battery";
    const sim = new Simulation({ ...labSettings("fighter"), loadout });
    expect(sim.state.resources.power).toBe(buildStats(loadout).capacity);
  });
});
