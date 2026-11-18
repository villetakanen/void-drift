import { buildCollisionRadius, defaultLoadout } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  FORMATION_SCALE,
  TARGETING_CENTER,
  TARGETING_LOOPS,
  TargetingBench,
  type TargetingConfig,
} from "./targeting-bench";

describe("targeting bench", () => {
  it("turns only the inner Wasps 60 degrees outward from their flight path", () => {
    const bench = new TargetingBench({
      slot1: "light-ion-cannon",
      slot2: "light-ion-cannon",
      mode: "sustained",
    });
    const [left, outer, inner] = TARGETING_LOOPS;
    const innerStart = left.count + outer.count;
    const centerX =
      TARGETING_CENTER.x + (inner.x - TARGETING_CENTER.x) * FORMATION_SCALE;
    const centerY =
      TARGETING_CENTER.y + (inner.y - TARGETING_CENTER.y) * FORMATION_SCALE;
    for (const advance of [0, 120]) {
      for (let tick = 0; tick < advance; tick++) bench.step();
      for (const [index, { ship }] of bench.sim.opponents.entries()) {
        const tangent = Math.atan2(ship.vel.y, ship.vel.x);
        const offset = ship.rotation - tangent;
        if (index < innerStart) {
          expect(Math.cos(offset)).toBeCloseTo(1);
          continue;
        }
        const radial = Math.atan2(ship.pos.y - centerY, ship.pos.x - centerX);
        expect(Math.cos(offset)).toBeCloseTo(0.5);
        expect(Math.cos(ship.rotation - radial)).toBeCloseTo(Math.sqrt(3) / 2);
      }
    }
  });

  it("keeps fitted hull collision circles disjoint over every loop phase", () => {
    const weapons = ["light-ion-cannon", "ion-point-defence", "laser"] as const;
    const build = defaultLoadout("wasp");
    let maxDiameter = 0;
    for (const slot1 of weapons) {
      for (const slot2 of weapons) {
        build.hull = [slot1, slot2];
        maxDiameter = Math.max(maxDiameter, 2 * buildCollisionRadius(build));
      }
    }
    const [left, outer, inner] = TARGETING_LOOPS;
    for (const loop of TARGETING_LOOPS) {
      // An ellipse stretches a unit-circle chord by at least its minor radius.
      const closestChord = 2 * Math.sin(Math.PI / loop.count);
      expect(
        closestChord * Math.min(loop.rx, loop.ry) * FORMATION_SCALE,
      ).toBeGreaterThan(maxDiameter);
    }
    const horizontalExtent = (loop: (typeof TARGETING_LOOPS)[number]) =>
      Math.hypot(loop.rx * Math.cos(loop.tilt), loop.ry * Math.sin(loop.tilt));
    for (const right of [outer, inner]) {
      const xGap =
        right.x - horizontalExtent(right) - left.x - horizontalExtent(left);
      expect(xGap * FORMATION_SCALE).toBeGreaterThan(maxDiameter);
    }
    // Every outer point is at least its minor radius from the outer centre.
    const centreOffset = Math.hypot(inner.x - outer.x, inner.y - outer.y);
    const radialGap =
      Math.min(outer.rx, outer.ry) -
      centreOffset -
      Math.max(inner.rx, inner.ry);
    expect(radialGap * FORMATION_SCALE).toBeGreaterThan(maxDiameter);
  });
  for (const slots of [
    ["light-ion-cannon", "light-ion-cannon"],
    ["laser", "laser"],
    ["light-ion-cannon", "ion-point-defence"],
    ["ion-point-defence", "ion-point-defence"],
  ] as const) {
    it(`runs the ${slots.join(" / ")} fleet`, () => {
      const config: TargetingConfig = {
        slot1: slots[0],
        slot2: slots[1],
        mode: "sustained",
      };
      const bench = new TargetingBench(config);
      for (let i = 0; i < 180; i++) bench.step();
      expect(bench.metrics.ships).toBe(16);
      expect(bench.metrics.mounts).toBe(32);
      expect(bench.metrics.discharges).toBeGreaterThan(0);
      expect(bench.metrics.bodyVisitsMean).toBeGreaterThan(0);
      expect(bench.metrics.bodyVisits).toBeLessThanOrEqual(16);
      expect(bench.metrics.bodyVisitsMean).toBeLessThanOrEqual(16);
      expect(bench.metrics.rosterBuildsMean).toBeLessThanOrEqual(1);
      expect(bench.metrics.adaptersMean).toBeLessThanOrEqual(16);
      if (
        slots[0] === "ion-point-defence" &&
        slots[1] === "ion-point-defence"
      ) {
        expect(bench.metrics.rosterBuildsMean).toBe(1);
        expect(bench.metrics.bodyVisitsMean).toBe(16);
        expect(bench.metrics.comparisonsMean).toBeGreaterThan(16);
      }
    });
  }
  it("produces target changes and intervals without a lock in sustained flight", () => {
    const bench = new TargetingBench({
      slot1: "laser",
      slot2: "ion-point-defence",
      mode: "sustained",
    });
    const previous = new Map<object, number>();
    const unlockedTicks = new Map<object, number>();
    let switched = false;
    let gap = false;
    let independentLocks = false;
    for (
      let tick = 0;
      tick < 1800 && !(switched && gap && independentLocks);
      tick++
    ) {
      bench.step();
      for (const actor of bench.sim.opponents) {
        const [laser, turret] = actor.weapons;
        if (
          laser.target !== null &&
          turret.target !== null &&
          laser.target !== turret.target
        )
          independentLocks = true;
        for (const mount of actor.weapons) {
          if (mount.target === null) continue;
          const last = previous.get(mount);
          if (last !== undefined && last !== mount.target) switched = true;
          previous.set(mount, mount.target);
        }
        const duration =
          laser.target === null && turret.target !== null
            ? (unlockedTicks.get(laser) ?? 0) + 1
            : 0;
        unlockedTicks.set(laser, duration);
        if (duration >= 12) gap = true;
      }
    }
    expect(switched).toBe(true);
    expect(gap).toBe(true);
    expect(independentLocks).toBe(true);
  });

  it("steps the fitted Wasp plume and clears it when destroyed or reset", () => {
    const config: TargetingConfig = {
      slot1: "light-ion-cannon",
      slot2: "ion-point-defence",
      mode: "sustained",
    };
    const bench = new TargetingBench(config);
    const actor = bench.sim.opponents[0];
    expect(actor.plume.activeCount).toBe(0);
    bench.step();
    expect(actor.emitters[0].output).toBeGreaterThan(0);
    expect(actor.plume.activeCount).toBe(1);
    let outletX = 0;
    actor.plume.inspect((outlet) => {
      outletX = outlet.x;
    });
    bench.step();
    actor.plume.inspect((outlet) => {
      expect(outlet.x).not.toBe(outletX);
    });
    actor.lifecycle = "destroyed";
    bench.step();
    expect(actor.plume.activeCount).toBe(0);
    expect(actor.emitters[0].output).toBe(0);
    expect(new TargetingBench(config).sim.opponents[0].plume.activeCount).toBe(
      0,
    );
  });
  it("funds the scripted engine burn in live mode and replenishes sustained power", () => {
    const fit = { slot1: "laser", slot2: "laser" } as const;
    const live = new TargetingBench({ ...fit, mode: "live" });
    const sustained = new TargetingBench({ ...fit, mode: "sustained" });
    live.sim.opponents[0].resources.power = 0;
    sustained.sim.opponents[0].resources.power = 0;
    live.step();
    sustained.step();
    expect(live.sim.opponents[0].plume.activeCount).toBe(0);
    expect(sustained.sim.opponents[0].plume.activeCount).toBe(1);
    expect(sustained.sim.opponents[0].resources.power).toBeGreaterThan(0);
  });
  it("reproduces live damage and removes destroyed ships", () => {
    const config: TargetingConfig = {
      slot1: "light-ion-cannon",
      slot2: "light-ion-cannon",
      mode: "live",
    };
    const a = new TargetingBench(config);
    const b = new TargetingBench(config);
    for (let i = 0; i < 1800; i++) {
      a.step();
      b.step();
    }
    expect(a.metrics.ships).toBeLessThan(16);
    expect(a.sim.opponents.map((actor) => actor.resources.hull)).toEqual(
      b.sim.opponents.map((actor) => actor.resources.hull),
    );
  });
});
