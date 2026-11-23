import { describe, expect, it } from "vitest";
import {
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  buildMounts,
} from "./build-renderer";
import { PLASMA_RIFLE_ENVELOPE } from "./plasma-rifle-art";
import { SalvageSystem } from "./salvage";
import {
  BuildStoreSchema,
  defaultBuilds,
  defaultLoadout,
  isScoredEligible,
  LoadoutSchema,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";

describe("Plasma rifle fitting", () => {
  it("round-trips saved fittings and stays ranked beside the plasma engine", () => {
    const build = defaultLoadout("wasp");
    build.hull[0] = "plasma-rifle";
    build.side = "plasma";
    expect(isScoredEligible(build)).toBe(true);
    const saved = defaultBuilds();
    saved.wasp = build;
    expect(
      BuildStoreSchema.parse(JSON.parse(JSON.stringify(saved))).wasp,
    ).toEqual(build);
    expect(
      LoadoutSchema.safeParse({ ...build, side: "plasma-rifle" }).success,
    ).toBe(false);
  });

  it("registers one rifle mount on every hull", () => {
    for (const chassis of ShipProfileIdSchema.options) {
      const build = defaultLoadout(chassis);
      build.hull[0] = "plasma-rifle";
      const weapons = new SalvageSystem(build, 2026).weapons;
      expect(weapons).toHaveLength(1);
      expect(weapons[0].kind).toBe("plasma-rifle");
    }
  });

  it("includes the full fitted silhouette in collision bounds on every hull", () => {
    for (const chassis of ShipProfileIdSchema.options) {
      const build = defaultLoadout(chassis);
      build.hull[0] = "plasma-rifle";
      const mount = buildMounts(build).find((m) => m.part === "plasma-rifle");
      if (!mount) throw new Error("Missing rifle mount");
      const radius = buildCollisionRadius(build);
      for (const [forward, across] of PLASMA_RIFLE_ENVELOPE) {
        const x =
          mount.x * BUILD_FLIGHT_SCALE +
          forward * Math.cos(mount.angle) -
          across * Math.sin(mount.angle);
        const y =
          mount.y * BUILD_FLIGHT_SCALE +
          forward * Math.sin(mount.angle) +
          across * Math.cos(mount.angle);
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(radius + 1e-9);
      }
    }
  });
});
