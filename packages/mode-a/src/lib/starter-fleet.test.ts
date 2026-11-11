import { expect, it } from "vitest";
import {
  BuildStoreSchema,
  buildStats,
  CHASSIS,
  defaultBuilds,
  defaultLoadout,
  fittedParts,
  isScoredEligible,
  LoadoutSchema,
  PARTS,
  type PartId,
  PartIdSchema,
  starterLoadout,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";
import { gameSettings, Simulation } from "./simulation";

it("starts each starter ship with full energy, unaffected by edits to a returned loadout", () => {
  for (const id of ShipProfileIdSchema.options) {
    const build = structuredClone(starterLoadout(id));
    const sim = new Simulation(gameSettings(id));
    expect(sim.state.resources.power).toBe(buildStats(build).capacity);
    const edited = starterLoadout(id);
    edited.hull[0] = "rail";
    expect(gameSettings(id).loadout).toEqual(build);
  }
});

it("lists each installed part once per mount", () => {
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
});

it("derives scored eligibility from the hull and every fitted part", () => {
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

it("adds a ship missing from an old store without replacing saved fittings", () => {
  const { fiddler: _, ...old } = defaultBuilds();
  old.fighter.side = "plasma";
  const restored = BuildStoreSchema.parse(old);
  expect(restored.fighter).toEqual(old.fighter);
  expect(restored.fiddler).toEqual(starterLoadout("fiddler"));
});
