import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { HighScoreSubmissionSchema } from "../schemas/highscore";
import { applyBuildEngines, buildDrain } from "./build-flight";
import {
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  buildMounts,
  buildPlumeEmitters,
} from "./build-renderer";
import { FIDDLER, FIDDLER_WINDOW_OUTLINE } from "./fiddler";
import { newMountPlan, previewMounts } from "./mount-planner";
import {
  BuildStoreSchema,
  buildStats,
  defaultBuilds,
  defaultLoadout,
  LoadoutSchema,
  PARTS,
  starterLoadout,
} from "./schemas/loadout";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const left = { ...idle, leftThruster: true };
const right = { ...idle, rightThruster: true };
const both = { ...left, rightThruster: true };
function burn(input = left, linkedEngines = false, spin = 0, power = 1) {
  const build = { ...defaultLoadout("fiddler"), linkedEngines };
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
  const motion = { velocity: spin };
  const output = applyBuildEngines(
    ship,
    build,
    input,
    1 / 60,
    power > 0,
    {},
    power,
    motion,
  );
  return {
    ship,
    motion,
    output,
    drain: buildDrain(build, input, spin, 1 / 60),
  };
}
describe("LHI Fiddler flight trial", () => {
  it("validates both required engine pairs and independent + / S fittings", () => {
    const build = defaultLoadout("fiddler");
    expect(
      LoadoutSchema.parse({ ...build, stabilizers: false }).stabilizers,
    ).toBe(true);
    for (const aft of [
      [null, "ion"],
      ["ion", "fusion"],
      ["battery", "battery"],
    ])
      expect(LoadoutSchema.safeParse({ ...build, aft }).success).toBe(false);
    for (const index of [0, 1, 2, 3, 4]) {
      for (const part of ["ion", "rail", "battery"] as const) {
        const hull = [...build.hull];
        hull[index] = part;
        expect(LoadoutSchema.safeParse({ ...build, hull }).success).toBe(
          part === "battery" || (part === "rail" && ![2, 3].includes(index)),
        );
      }
    }
    expect(
      LoadoutSchema.parse({
        ...build,
        aft: ["fusion", "fusion"],
        linkedEngines: true,
      }).linkedEngines,
    ).toBe(true);
  });
  it("adds Fiddler to old saves without replacing other builds", () => {
    const { fiddler: _, ...old } = defaultBuilds();
    old.fighter.side = "plasma";
    const restored = BuildStoreSchema.parse(old);
    expect(restored.fighter).toEqual(old.fighter);
    expect(restored.fiddler).toEqual(starterLoadout("fiddler"));
  });
  it("carries the accepted nine mounts, Wasp-size glass and four stabilizers into production", () => {
    const build = defaultLoadout("fiddler");
    const mounts = buildMounts(build);
    expect(mounts).toHaveLength(9);
    expect(mounts.slice(0, 4).map((m) => [m.x, m.y, m.underHull])).toEqual([
      [-1, -23.5, true],
      [-1, 23.5, true],
      [-39, -8, false],
      [-39, 8, false],
    ]);
    expect(mounts.slice(4).map((m) => [m.x, m.y, m.type, m.underHull])).toEqual(
      [
        [52, -15.5, "equipment", true],
        [52, 15.5, "equipment", true],
        [29, -15.5, "support", true],
        [29, 15.5, "support", true],
        [-20, 0, "equipment", true],
      ],
    );
    expect(mounts.filter((m) => m.linkedTo).map((m) => m.linkedTo)).toEqual([
      "left",
      "aft-0",
    ]);
    expect(buildPlumeEmitters(build)).toHaveLength(8);
    expect(FIDDLER.stabilizers.front).toMatchObject({
      x: 43,
      y: 24,
      angle: 8.5,
    });
    expect(FIDDLER.stabilizers.rear).toMatchObject({
      x: -33,
      y: 14.5,
      angle: -16.5,
    });
    expect(
      Math.max(...FIDDLER_WINDOW_OUTLINE.map((p) => p[1])) -
        Math.min(...FIDDLER_WINDOW_OUTLINE.map((p) => p[1])),
    ).toBeCloseTo(19.5);
    expect(previewMounts(newMountPlan("fiddler"))).toEqual(mounts);
    for (const face of FIDDLER.facets)
      for (const [x, y] of face.points)
        expect(Math.hypot(x, y) * BUILD_FLIGHT_SCALE).toBeLessThanOrEqual(
          buildCollisionRadius(build),
        );
    expect(buildStats(build).mass).toBe(187 + 4 * PARTS.ion.mass);
  });
  it("pushes on four mains and turns on diagonal stabilizers with linking off", () => {
    const push = burn(both),
      turn = burn(left);
    expect(
      [push.output.left, push.output.right, ...push.output.aft].every(
        (n) => n > 0,
      ),
    ).toBe(true);
    expect(push.motion.velocity).toBe(0);
    expect(push.ship.vel.x).toBeGreaterThan(0);
    expect(push.ship.vel.y).toBe(0);
    expect([turn.output.left, turn.output.right, ...turn.output.aft]).toEqual([
      0, 0, 0, 0,
    ]);
    expect(turn.output.stabilizers.map((n) => n > 0)).toEqual([
      true,
      false,
      false,
      true,
    ]);
    expect(turn.motion.velocity).toBeGreaterThan(0);
    expect(burn(right).motion.velocity).toBeCloseTo(-turn.motion.velocity);
  });
  it("links only the matching side's two mains, changing speed and draw but not turn", () => {
    for (const input of [left, right]) {
      const linked = burn(input, true),
        separate = burn(input);
      const expected = input.leftThruster
        ? [true, false, true, false]
        : [false, true, false, true];
      expect(
        [linked.output.left, linked.output.right, ...linked.output.aft].map(
          (n) => n > 0,
        ),
      ).toEqual(expected);
      expect(linked.motion.velocity).toBe(separate.motion.velocity);
      expect(linked.ship.vel.x).toBeGreaterThan(separate.ship.vel.x);
      expect(linked.drain - separate.drain).toBeCloseTo(2 * PARTS.ion.draw);
    }
    expect(burn(both, true)).toEqual(burn(both, false));
  });
  it("links spin braking proportionally and stops safely when energy is exhausted", () => {
    const braking = burn(idle, true, 0.00001);
    expect(braking.motion.velocity).toBe(0);
    expect(braking.output.left).toBe(0);
    expect(braking.output.right).toBeGreaterThan(0);
    expect(braking.output.aft[0]).toBe(0);
    expect(braking.output.aft[1]).toBeGreaterThan(0);
    expect(braking.drain).toBeLessThan(burn(right, true).drain);
    const empty = burn(left, true, 0, 0);
    expect(empty.ship.vel.mag()).toBe(0);
    expect(empty.motion.velocity).toBe(0);
    expect([
      empty.output.left,
      empty.output.right,
      ...empty.output.aft,
      ...empty.output.stabilizers,
    ]).toEqual(Array(8).fill(0));
  });
  it("runs deterministically through the game with correct capacity, while remaining unranked", () => {
    expect(starterLoadout("fiddler").hull).toEqual([
      null,
      null,
      "battery",
      "battery",
      "gravity-coil",
    ]);
    expect(buildStats(starterLoadout("fiddler"))).toMatchObject({
      mass: 273,
      capacity: 270,
    });
    expect(new Simulation(stockSettings("fiddler")).settings.loadout).toEqual(
      defaultLoadout("fiddler"),
    );
    const settings = gameSettings("fiddler");
    const a = new Simulation(settings),
      b = new Simulation(settings);
    expect(a.state.resources.power).toBe(
      buildStats(starterLoadout("fiddler")).capacity,
    );
    for (const sim of [a, b]) {
      sim.start();
      sim.replay([
        { ...both, ticks: 90 },
        { ...left, ticks: 60 },
        { ...idle, ticks: 60 },
      ]);
    }
    expect(a.ship).toEqual(b.ship);
    expect(a.state).toEqual(b.state);
    expect(
      HighScoreSubmissionSchema.safeParse({
        initials: "AAA",
        seconds: 10,
        deathCause: "POWER",
        shipId: "fiddler",
        challenge: "ion-1",
      }).success,
    ).toBe(false);
  });
});
