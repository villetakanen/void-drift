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
      expect(bench.metrics.rosterBuildsMean).toBeLessThanOrEqual(1);
      expect(bench.metrics.adaptersMean).toBeLessThanOrEqual(16);
      if (slots[0] === "light-ion-cannon" && slots[1] === "light-ion-cannon")
        expect(bench.metrics.rosterBuildsMean).toBeLessThan(1);
      if (slots[0] === "ion-point-defence" && slots[1] === "ion-point-defence")
        expect(bench.metrics.rosterBuildsMean).toBe(1);
    });
  }
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
