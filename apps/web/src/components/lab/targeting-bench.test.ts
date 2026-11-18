import { describe, expect, it } from "vitest";
import { TargetingBench, type TargetingConfig } from "./targeting-bench";

describe("targeting bench", () => {
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
