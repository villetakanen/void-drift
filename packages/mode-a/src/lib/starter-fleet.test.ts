import { expect, it } from "vitest";
import {
  BuildStoreSchema,
  buildStats,
  CHASSIS,
  ChassisSchema,
  defaultLoadout,
  fittedParts,
  isScoredEligible,
  LoadoutSchema,
  PARTS,
  type PartId,
  PartIdSchema,
  PartSchema,
  ReleaseClassSchema,
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

it("gives a fresh store the starter Wasp and keeps a saved Wasp", () => {
  const wasp = starterLoadout("wasp");
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

it("requires one catalog release class and derives scored eligibility from fitted content", () => {
  for (const entry of [...Object.values(CHASSIS), ...Object.values(PARTS)])
    expect(ReleaseClassSchema.safeParse(entry.releaseClass).success).toBe(true);
  expect(() => ReleaseClassSchema.parse(undefined)).toThrow();
  expect(() =>
    ChassisSchema.parse({ ...CHASSIS.wasp, releaseClass: undefined }),
  ).toThrow();
  expect(() =>
    PartSchema.parse({ ...PARTS.ion, releaseClass: undefined }),
  ).toThrow();

  const scored = (id: PartId) => PARTS[id].releaseClass === "scored";
  for (const chassis of ShipProfileIdSchema.options) {
    const build = starterLoadout(chassis);
    expect(isScoredEligible(build), chassis).toBe(
      CHASSIS[chassis].releaseClass === "scored" &&
        fittedParts(build).every(scored),
    );
    const without = { ...build, hull: [null, ...build.hull.slice(1)] };
    for (const part of PartIdSchema.options) {
      const fitted = { ...without, hull: [part, ...without.hull.slice(1)] };
      if (!LoadoutSchema.safeParse(fitted).success) continue;
      expect(isScoredEligible(fitted), `${chassis} ${part}`).toBe(
        isScoredEligible(without) && scored(part),
      );
    }
  }
});

it("migrates a v3 build store with Wasp active and preserves the fittings", () => {
  const wasp = starterLoadout("wasp");
  wasp.hull[0] = "laser";
  const migrated = BuildStoreSchema.parse({
    wasp,
    scout: defaultLoadout("scout"),
    fighter: defaultLoadout("fighter"),
    corvette: defaultLoadout("corvette"),
  });
  expect(migrated.activeChassis).toBe("wasp");
  expect(migrated.wasp).toEqual(wasp);
});
