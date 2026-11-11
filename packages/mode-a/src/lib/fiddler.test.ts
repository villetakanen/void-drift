import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
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
import { WASP } from "./wasp";

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
    expect(mounts).toHaveLength(2 + build.aft.length + build.hull.length);
    const mount = (key: string) => {
      const found = mounts.find((m) => m.key === key);
      if (!found) throw new Error(`Missing mount ${key}`);
      return found;
    };
    for (const [a, b] of [
      ["left", "right"],
      ["aft-0", "aft-1"],
      ["hull-0", "hull-1"],
      ["hull-2", "hull-3"],
    ])
      expect(mount(b)).toMatchObject({ x: mount(a).x, y: -mount(a).y });
    expect(mount("hull-4").y).toBe(0);
    expect(mount("left").x).toBeGreaterThan(mount("aft-0").x);
    expect(mounts.filter((m) => m.linkedTo).map((m) => m.linkedTo)).toEqual([
      "left",
      "aft-0",
    ]);
    expect(buildPlumeEmitters(build)).toHaveLength(
      2 + build.aft.length + burn(idle).output.stabilizers.length,
    );
    const span = (values: number[]) =>
      Math.max(...values) - Math.min(...values);
    const waspGlass = WASP.facets
      .filter((facet) => facet.color === "#000000")
      .flatMap((facet) => facet.points);
    expect(span(FIDDLER_WINDOW_OUTLINE.map((p) => p[1]))).toBeCloseTo(
      span(waspGlass.map((p) => p[0])),
    );
    expect(previewMounts(newMountPlan("fiddler"))).toEqual(mounts);
    for (const face of FIDDLER.facets)
      for (const [x, y] of face.points)
        expect(Math.hypot(x, y) * BUILD_FLIGHT_SCALE).toBeLessThanOrEqual(
          buildCollisionRadius(build),
        );
    // Two blade-root and two rear ion engines.
    expect(buildStats(build).mass).toBe(FIDDLER.mass + 4 * PARTS.ion.mass);
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
  it("runs deterministically through the game with correct capacity", () => {
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
  });
});
