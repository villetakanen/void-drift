import { expect, it } from "vitest";
import {
  BuildStoreSchema,
  buildStats,
  CHASSIS,
  defaultBuilds,
  defaultLoadout,
  isScoredEligible,
  LoadoutSchema,
  PARTS,
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

it("makes a build ineligible for scored play when any unsanctioned hull or part is fitted", () => {
  expect(
    ShipProfileIdSchema.options.some((c) =>
      isScoredEligible(starterLoadout(c)),
    ),
  ).toBe(true);
  let checked = 0;
  for (const chassis of ShipProfileIdSchema.options) {
    const build = starterLoadout(chassis);
    if (CHASSIS[chassis].releaseClass !== "scored")
      expect(isScoredEligible(build), chassis).toBe(false);
    for (const part of PartIdSchema.options) {
      if (PARTS[part].releaseClass === "scored") continue;
      const fitted = { ...build, hull: [part, ...build.hull.slice(1)] };
      if (!LoadoutSchema.safeParse(fitted).success) continue;
      expect(isScoredEligible(fitted), `${chassis} ${part}`).toBe(false);
      checked++;
    }
  }
  expect(checked).toBeGreaterThan(0);
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
