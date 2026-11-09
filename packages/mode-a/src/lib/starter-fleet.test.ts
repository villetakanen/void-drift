import { expect, it } from "vitest";
import {
  BuildStoreSchema,
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

it("fits the starter Wasp with a cannon, a point defence and a light ion engine, in a fresh store too", () => {
  const wasp = starterLoadout("wasp");
  expect(wasp.hull).toContain("light-ion-cannon");
  expect(wasp.hull).toContain("ion-point-defence");
  expect(wasp.side).toBe("ion");
  expect(wasp.stabilizers).toBe(true);
  const fresh = BuildStoreSchema.parse({
    scout: defaultLoadout("scout"),
    fighter: defaultLoadout("fighter"),
    corvette: defaultLoadout("corvette"),
  });
  expect(fresh.wasp).toEqual(wasp);
  const saved = defaultLoadout("wasp");
  saved.hull[0] = "laser";
  const kept = BuildStoreSchema.parse({ ...fresh, wasp: saved });
  expect(kept.wasp).toEqual(saved);
});

it("flies the starter Wasp loadout from the game settings", () => {
  const sim = new Simulation(gameSettings("wasp"));
  expect(sim.settings.loadout).toEqual(starterLoadout("wasp"));
});
