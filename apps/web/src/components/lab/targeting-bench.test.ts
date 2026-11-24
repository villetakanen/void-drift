import { expect, it } from "vitest";
import { TargetingBench } from "./targeting-bench";

it("bounds roster and body visits for a fleet with mixed weapons", () => {
  const bench = new TargetingBench({
    slot1: "light-ion-cannon",
    slot2: "ion-point-defence",
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
