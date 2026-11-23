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
  it("crosses every pair of paths", () => {
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
    ["plasma-rifle", "plasma-rifle"],
  ] as const) {
    it(`acquires for the whole ${slots.join(" / ")} fleet in one pass`, () => {
      const bench = new TargetingBench({
        slot1: slots[0],
        slot2: slots[1],
        mode: "sustained",
      });
      for (let i = 0; i < 180; i++) bench.step();
      const ships = bench.metrics.ships;
      expect(bench.metrics.bodyVisitsMean).toBeGreaterThan(0);
      expect(bench.metrics.bodyVisits).toBeLessThanOrEqual(ships);
      expect(bench.metrics.bodyVisitsMean).toBeLessThanOrEqual(ships);
      expect(bench.metrics.rosterBuildsMean).toBeLessThanOrEqual(1);
      expect(bench.metrics.adaptersMean).toBeLessThanOrEqual(ships);
    });
  }
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
