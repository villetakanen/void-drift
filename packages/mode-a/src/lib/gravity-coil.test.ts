import { describe, expect, it } from "vitest";
import {
  BuildStoreSchema,
  defaultBuilds,
  defaultLoadout,
} from "./schemas/loadout";

describe("Gravity coil fitting", () => {
  it("round-trips saved builds with coils on every hull", () => {
    const builds = defaultBuilds();
    builds.wasp = defaultLoadout("wasp");
    for (const chassis of ["wasp", "scout", "fighter", "corvette"] as const) {
      builds[chassis].hull.fill("gravity-coil");
      builds[chassis].aft.fill("gravity-coil");
    }
    expect(BuildStoreSchema.parse(JSON.parse(JSON.stringify(builds)))).toEqual({
      ...builds,
      activeChassis: "wasp",
    });
  });
});
