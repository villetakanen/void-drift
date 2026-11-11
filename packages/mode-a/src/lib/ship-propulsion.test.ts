import { massWellAcceleration, massWellReach, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, type EngineTimers } from "./build-flight";
import { buildMounts } from "./build-renderer";
import {
  buildStats,
  CHASSIS,
  ChassisSchema,
  defaultLoadout,
  PARTS,
  PartSchema,
} from "./schemas/loadout";

import { gameSettings, Simulation } from "./simulation";
import { GRAVITY_TUNING } from "./tuning";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { leftThruster: true, rightThruster: true, fire: false };
const ship = () => ({
  pos: new Vec2(0, 0),
  vel: new Vec2(0, 0),
  acc: new Vec2(0, 0),
  rotation: 0,
  radius: 16,
});

function fullComplement(
  chassis: keyof typeof CHASSIS,
  engine: "ion" | "fusion",
) {
  const build = defaultLoadout(chassis);
  build.side = engine;
  build.aft = build.aft.map(() => engine);
  return build;
}

describe("ship propulsion contract", () => {
  it("strictly validates hull base speeds and engine speed contributions", () => {
    expect(
      ChassisSchema.safeParse({ ...CHASSIS.scout, baseSpeed: Infinity })
        .success,
    ).toBe(false);
    expect(
      ChassisSchema.safeParse({ ...CHASSIS.scout, baseSpeed: 0 }).success,
    ).toBe(false);
    expect(
      PartSchema.safeParse({ ...PARTS.ion, speedContribution: -1 }).success,
    ).toBe(false);
    expect(
      PartSchema.safeParse({ ...PARTS.ion, speedContribution: Infinity })
        .success,
    ).toBe(false);
  });

  it("counts physical main engines, including Wasp centre and Fiddler aft pair", () => {
    for (const hull of [
      "scout",
      "wasp",
      "fighter",
      "corvette",
      "fiddler",
    ] as const) {
      for (const engine of ["ion", "fusion"] as const) {
        const build = fullComplement(hull, engine);
        const engineMounts = buildMounts(build).filter(
          (mount) => mount.group !== "hull",
        ).length;
        const stats = buildStats(build);
        expect(stats.engineBreakdown, hull).toEqual([
          expect.objectContaining({ id: engine, count: engineMounts }),
        ]);
        expect(stats.poweredCruiseCeiling, hull).toBe(
          CHASSIS[hull].baseSpeed +
            engineMounts * PARTS[engine].speedContribution,
        );
      }
    }
  });

  it("equipment and stabilizers contribute nothing; every fitted engine counts while inactive", () => {
    const build = defaultLoadout("fighter");
    const initial = buildStats(build).poweredCruiseCeiling;
    build.hull[0] = "heavy-well";
    build.stabilizers = !build.stabilizers;
    expect(buildStats(build).poweredCruiseCeiling).toBe(initial);
    build.aft[0] = "plasma";
    expect(buildStats(build).poweredCruiseCeiling).toBe(
      initial + PARTS.plasma.speedContribution,
    );
    const craft = ship();
    applyBuildEngines(craft, build, idle, 1 / 60, false);
    expect(buildStats(build).poweredCruiseCeiling).toBe(
      initial + PARTS.plasma.speedContribution,
    );
  });

  it.each(["plasma", "fusion"] as const)(
    "inactive %s raises the ceiling used by firing ions",
    (engine) => {
      const build = defaultLoadout("fighter");
      build.stabilizers = false;
      const oldCeiling = buildStats(build).poweredCruiseCeiling;
      build.aft[0] = engine;
      const craft = ship();
      craft.vel.set(oldCeiling, 0);
      // Plasma is initially charging; fission is in its recovery interval.
      const timers: EngineTimers = engine === "fusion" ? { "aft-0": 0.25 } : {};
      const output = applyBuildEngines(
        craft,
        build,
        both,
        1 / 240,
        true,
        timers,
      );
      expect(output.aft[0]).toBe(0);
      expect(output.left).toBeGreaterThan(0);
      expect(craft.vel.x).toBeGreaterThan(oldCeiling);
      expect(craft.vel.mag()).toBeLessThan(
        buildStats(build).poweredCruiseCeiling,
      );
    },
  );

  it.each(["ion", "heavy-ion", "fusion", "plasma"] as const)(
    "uses one shared ceiling for %s on every hull with production response timing",
    (engine) => {
      const parts = PARTS;
      for (const chassis of [
        "scout",
        "wasp",
        "fighter",
        "corvette",
        "fiddler",
      ] as const) {
        const build = defaultLoadout(chassis);
        build.side = engine;
        build.stabilizers = false;
        const craft = ship();
        const timers = {};
        for (let tick = 0; tick < 12000; tick++)
          applyBuildEngines(
            craft,
            build,
            both,
            1 / 240,
            true,
            timers,
            1,
            undefined,
            undefined,
            parts,
          );
        expect(craft.vel.mag()).toBeCloseTo(
          buildStats(build, parts).poweredCruiseCeiling,
          4,
        );
      }
    },
  );

  it("tracks the continuous straight-burn reference within fixed-step tolerance", () => {
    const build = defaultLoadout("fighter");
    build.stabilizers = false;
    const craft = ship();
    const dt = 1 / 240;
    for (let tick = 0; tick < 240; tick++)
      applyBuildEngines(craft, build, both, dt, true);
    const stats = buildStats(build);
    const a0 = stats.acceleration;
    const analytical =
      stats.poweredCruiseCeiling *
      (1 - Math.exp(-(a0 * 1) / stats.poweredCruiseCeiling));
    // Semi-implicit fixed-step integration accumulates a small finite-step error.
    expect(Math.abs(craft.vel.x - analytical)).toBeLessThan(0.7);
    expect(craft.vel.y).toBeCloseTo(0, 10);
  });
});

it("powered starter ships move outward in the current sun well while coasting falls inward", () => {
  for (const hull of [
    "scout",
    "wasp",
    "fighter",
    "corvette",
    "fiddler",
  ] as const) {
    const settings = gameSettings(hull);
    const sun = new Simulation(settings).star;
    const loadout = settings.loadout;
    if (!loadout) throw new Error("Starter ship requires an assembled loadout");
    const start =
      massWellReach(sun.mass, GRAVITY_TUNING.cutoff, GRAVITY_TUNING.falloff) *
      0.8;
    const run = (powered: boolean) => {
      const craft = ship();
      craft.pos.set(start, 0);
      const timers = {};
      for (let tick = 0; tick < 240; tick++) {
        applyBuildEngines(
          craft,
          loadout,
          powered ? both : idle,
          1 / 240,
          powered,
          timers,
        );
        craft.vel.x -=
          massWellAcceleration(
            craft.pos.x,
            sun.mass,
            GRAVITY_TUNING.cutoff,
            GRAVITY_TUNING.falloff,
          ) / 240;
        craft.pos.x += craft.vel.x / 240;
      }
      return craft.pos.x;
    };
    expect(run(true), hull).toBeGreaterThan(start);
    expect(run(false), hull).toBeLessThan(start);
  }
});
