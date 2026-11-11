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

it("requires one catalog release class and derives scored eligibility from fitted content", () => {
  const expectedChassisClasses = {
    wasp: "scored",
    scout: "scored",
    fighter: "scored",
    corvette: "preview",
    fiddler: "preview",
  } as const;
  const expectedPartClasses = {
    "light-ion-cannon": "scored",
    "ion-point-defence": "scored",
    rail: "preview",
    laser: "preview",
    battery: "scored",
    "heavy-well": "scored",
    coil: "preview",
    "gravity-coil": "scored",
    ion: "scored",
    "heavy-ion": "scored",
    fusion: "preview",
    plasma: "preview",
  } as const;
  for (const [id, releaseClass] of Object.entries(expectedChassisClasses))
    expect(
      ReleaseClassSchema.parse(
        CHASSIS[id as keyof typeof CHASSIS].releaseClass,
      ),
    ).toBe(releaseClass);
  for (const [id, releaseClass] of Object.entries(expectedPartClasses))
    expect(
      ReleaseClassSchema.parse(PARTS[id as keyof typeof PARTS].releaseClass),
    ).toBe(releaseClass);
  expect(() => ReleaseClassSchema.parse(undefined)).toThrow();
  expect(() =>
    ChassisSchema.parse({ ...CHASSIS.wasp, releaseClass: undefined }),
  ).toThrow();
  expect(() =>
    PartSchema.parse({ ...PARTS.ion, releaseClass: undefined }),
  ).toThrow();

  expect(isScoredEligible(starterLoadout("wasp"))).toBe(true);
  expect(
    isScoredEligible(
      LoadoutSchema.parse({
        ...defaultLoadout("wasp"),
        hull: ["rail", null],
      }),
    ),
  ).toBe(false);
  expect(isScoredEligible(defaultLoadout("fiddler"))).toBe(false);
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
