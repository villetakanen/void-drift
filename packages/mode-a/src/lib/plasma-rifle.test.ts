import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  buildMounts,
} from "./build-renderer";
import { createStar } from "./game-loop";
import { partFigures } from "./part-figures";
import { PLASMA_RIFLE_ENVELOPE } from "./plasma-rifle-art";
import { SalvageSystem } from "./salvage";
import {
  BuildStoreSchema,
  buildStats,
  defaultBuilds,
  defaultLoadout,
  isScoredEligible,
  LoadoutSchema,
  PARTS,
  slotAccepts,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";

describe("Plasma rifle fitting", () => {
  it("adds weight through ordinary statistics and round-trips saved fittings", () => {
    const build = defaultLoadout("wasp");
    const mass = buildStats(build).mass;
    build.hull[0] = "plasma-rifle";
    expect(LoadoutSchema.parse(JSON.parse(JSON.stringify(build)))).toEqual(
      build,
    );
    expect(buildStats(build).mass - mass).toBeCloseTo(
      PARTS["light-ion-cannon"].mass * 2.7,
    );
    expect(partFigures("plasma-rifle")).toEqual([
      { icon: "mass", value: "24.3", label: "mass" },
    ]);
    expect(isScoredEligible(build)).toBe(false);
    const saved = defaultBuilds();
    saved.wasp = build;
    expect(
      BuildStoreSchema.parse(JSON.parse(JSON.stringify(saved))).wasp,
    ).toEqual(build);
    expect(slotAccepts("weapon", "G")).toBe(true);
    expect(slotAccepts("support", "G")).toBe(false);
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
      expect(weapons[0].target).toBeNull();
    }
  });

  it("charges and releases without applying target damage or ship forces", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", null];
    const system = new SalvageSystem(build, 2026);
    system.nextPass = 1000;
    const ship = {
      pos: new Vec2(400, 400),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const target = {
      id: 1,
      group: 1,
      kind: "wreck" as const,
      x: 500,
      y: 400,
      previousX: 500,
      previousY: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      hull: 100,
      life: 20,
      rotation: 0,
    };
    system.bodies.push(target);
    const resources = { hull: 100, power: 100 };
    const star = createStar("G", 960, 540);
    for (let i = 0; i < 240; i++)
      system.step(1 / 120, ship, star, resources, 100, 400, 400, false);
    expect(system.weapons[0].target).toBe(target.id);
    expect(target.hull).toBe(100);
    expect(resources.power).toBeCloseTo(93);
    expect(system.plasmaReleases).toBe(1);
    expect(ship.vel).toEqual(new Vec2(0, 0));
    expect(system.events).toEqual([]);
    expect(system.shotsFired).toBe(0);
    expect(system.energySpent).toBeCloseTo(7);
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
