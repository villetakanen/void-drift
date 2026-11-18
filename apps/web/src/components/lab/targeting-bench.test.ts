import { buildCollisionRadius, defaultLoadout } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  FORMATION_PERIOD,
  FORMATION_SCALE,
  TARGETING_CENTER,
  TARGETING_LOOPS,
  TargetingBench,
  type TargetingConfig,
  targetingPose,
} from "./targeting-bench";

describe("targeting bench", () => {
  it("turns only the inner ships 60 degrees outward from their flight path", () => {
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

  it("crosses every pair of paths in the 6/6/4 elliptical formation", () => {
    const [left, right, circle] = TARGETING_LOOPS;
    expect(TARGETING_LOOPS.map((loop) => loop.count)).toEqual([6, 6, 4]);
    expect(left.rx).toBeGreaterThan(left.ry);
    expect(left.tilt).toBeGreaterThan(0);
    expect(right.rx).toBeGreaterThan(right.ry);
    expect(right.tilt).toBe(0);
    expect(circle.rx).toBe(circle.ry);
    for (let first = 0; first < TARGETING_LOOPS.length; first++) {
      for (const second of TARGETING_LOOPS.slice(first + 1)) {
        const loop = TARGETING_LOOPS[first];
        const samples = Array.from({ length: 256 }, (_, i) => {
          const { x, y } = targetingPose(
            loop,
            0,
            (i * 2 * Math.PI) / (256 * Math.abs(loop.speed)),
          );
          const dx =
            (x - TARGETING_CENTER.x) / FORMATION_SCALE +
            TARGETING_CENTER.x -
            second.x;
          const dy =
            (y - TARGETING_CENTER.y) / FORMATION_SCALE +
            TARGETING_CENTER.y -
            second.y;
          const u =
            (dx * Math.cos(second.tilt) + dy * Math.sin(second.tilt)) /
            second.rx;
          const v =
            (-dx * Math.sin(second.tilt) + dy * Math.cos(second.tilt)) /
            second.ry;
          return u * u + v * v;
        });
        // A continuous closed path with both an interior and exterior point crosses the ellipse.
        expect(Math.min(...samples)).toBeLessThan(1);
        expect(Math.max(...samples)).toBeGreaterThan(1);
      }
    }
  });

  it("keeps every fitted hull clear between samples over the repeating schedule", () => {
    const weapons = [
      "light-ion-cannon",
      "ion-point-defence",
      "laser",
      "plasma-rifle",
    ] as const;
    let maxDiameter = 0;
    for (const chassis of ["wasp", "fighter"] as const) {
      const build = defaultLoadout(chassis);
      for (const slot1 of weapons) {
        for (const slot2 of weapons) {
          build[chassis === "fighter" ? "aft" : "hull"] = [slot1, slot2];
          maxDiameter = Math.max(maxDiameter, 2 * buildCollisionRadius(build));
        }
      }
    }
    const ships = TARGETING_LOOPS.flatMap((loop) => {
      // The set of occupied positions repeats even if individual ships change places.
      const spaces =
        (FORMATION_PERIOD * loop.speed * loop.count) / (2 * Math.PI);
      expect(spaces).toBeCloseTo(Math.round(spaces), 9);
      const speedBound =
        Math.abs(loop.speed) * Math.max(loop.rx, loop.ry) * FORMATION_SCALE;
      return Array.from({ length: loop.count }, (_, index) => ({
        loop,
        index,
        speedBound,
      }));
    });
    const steps = Math.ceil(FORMATION_PERIOD / 0.02);
    const interval = FORMATION_PERIOD / steps;
    let minimumBound = Infinity;
    for (let sample = 0; sample < steps; sample++) {
      const positions = ships.map(({ loop, index }) =>
        targetingPose(loop, index, sample * interval),
      );
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const distance = Math.hypot(
            positions[i].x - positions[j].x,
            positions[i].y - positions[j].y,
          );
          // Every instant is within half an interval of a sample (including the periodic boundary).
          const maxApproach =
            ((ships[i].speedBound + ships[j].speedBound) * interval) / 2;
          minimumBound = Math.min(minimumBound, distance - maxApproach);
        }
      }
    }
    expect(minimumBound).toBeGreaterThan(maxDiameter);
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

  it("measures rifle observations independently of discharges and the rolling timing window", () => {
    const config = {
      slot1: "plasma-rifle",
      slot2: "plasma-rifle",
      mode: "sustained",
    } as const;
    const bench = new TargetingBench(config);
    const empty = { short: 0, sustained: 0, initial: 0, ongoing: 0 };
    expect(bench.metrics.plasmaIntervals).toEqual(empty);
    bench.step();
    expect(bench.traces).toHaveLength(bench.metrics.plasmaIntervals.ongoing);
    for (let tick = 1; tick < 3600; tick++) bench.step();
    const metrics = bench.metrics;
    expect(metrics.plasmaIntervals.short).toBeGreaterThan(0);

    expect(metrics.plasmaIntervals.sustained).toBeGreaterThan(0);
    expect(metrics.plasmaIntervals.ongoing).toBe(bench.traces.length);
    expect(metrics.activeRequestsMean).toBe(32);
    expect(metrics.bodyVisitsMean).toBe(16);
    expect(metrics.plasmaReleases).toBeGreaterThan(0);
    expect(metrics.discharges).toBe(metrics.plasmaReleases);
    expect(metrics.plasmaVents).toBeGreaterThan(0);
    expect(new TargetingBench(config).metrics.plasmaIntervals).toEqual(empty);
  });

  it("funds repeated releases in a moving held approach", () => {
    const bench = new TargetingBench({
      slot1: "plasma-rifle",
      slot2: "plasma-rifle",
      mode: "sustained",
      formation: "held-approach",
    });
    const [trailer, leader] = bench.sim.opponents;
    expect(trailer.loadout.chassis).toBe("fighter");
    expect(leader.loadout.chassis).toBe("wasp");
    const firstX = leader.ship.pos.x;
    for (let tick = 0; tick < 3600; tick++) bench.step();
    const metrics = bench.metrics;
    expect(leader.ship.pos.x).not.toBe(firstX);
    expect(metrics.ships).toBe(2);
    expect(metrics.mounts).toBe(4);
    expect(metrics.bodyVisitsMean).toBe(2);
    expect(metrics.plasmaIntervals.sustained).toBeGreaterThan(0);
    expect(trailer.combat.plasmaReleases).toBeGreaterThan(2);
    expect(leader.combat.plasmaReleases).toBe(0);
    expect(metrics.discharges).toBe(metrics.plasmaReleases);
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
    const fighter = bench.sim.opponents[1];
    expect(fighter.plume.activeCount).toBe(2);
    expect(bench.metrics.fighters).toBe(8);
    for (const [i, ship] of bench.sim.opponents.entries()) {
      expect(ship.loadout.chassis).toBe(i % 2 ? "fighter" : "wasp");
      expect(ship.weapons.map((w) => [w.mount.group, w.kind])).toEqual(
        [config.slot1, config.slot2].map((kind) => [
          i % 2 ? "aft" : "hull",
          kind,
        ]),
      );
    }
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
