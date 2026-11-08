import { expect, it } from "vitest";
import {
  buildStats,
  defaultLoadout,
  fittedParts,
  LoadoutSchema,
  starterLoadout,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";
import { gameSettings, labSettings, Simulation } from "./simulation";

it("wires each configured starter loadout and capacity into the game independently of the Lab", () => {
  for (const id of ShipProfileIdSchema.options) {
    const build = structuredClone(starterLoadout(id));
    expect(LoadoutSchema.parse(build)).toEqual(build);
    const sim = new Simulation(gameSettings(id));
    expect(sim.settings.loadout).toEqual(build);
    expect(sim.state.resources.power).toBe(buildStats(build).capacity);
    expect(labSettings(id).loadout).toEqual(defaultLoadout(id));
    const edited = starterLoadout(id);
    edited.hull[0] = "rail";
    expect(gameSettings(id).loadout).toEqual(build);
  }
});

it("lists each installed part once per mount, including the Wasp's single engine", () => {
  const fighter = LoadoutSchema.parse({
    ...defaultLoadout("fighter"),
    side: "fusion",
    hull: ["battery", null],
    aft: ["fusion", "laser"],
  });
  expect(fittedParts(fighter)).toEqual([
    "fusion",
    "fusion",
    "battery",
    "fusion",
    "laser",
  ]);
  const wasp = LoadoutSchema.parse({
    ...defaultLoadout("wasp"),
    side: "plasma",
    hull: ["laser", "battery"],
    aft: [],
  });
  expect(fittedParts(wasp)).toEqual(["plasma", "laser", "battery"]);
});
