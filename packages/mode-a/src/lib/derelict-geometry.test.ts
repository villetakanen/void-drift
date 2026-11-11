import { expect, it } from "vitest";
import { DERELICT_SHARDS } from "./derelict-geometry";
import { SALVAGE } from "./schemas/salvage";

it("partitions the hull into one region per piece without losing or duplicating material", () => {
  expect(DERELICT_SHARDS).toHaveLength(SALVAGE.fragment.count);
  const all = DERELICT_SHARDS.flatMap(({ points }) => points);
  const minX = Math.min(...all.map((p) => p.x)),
    maxX = Math.max(...all.map((p) => p.x)),
    minY = Math.min(...all.map((p) => p.y)),
    maxY = Math.max(...all.map((p) => p.y));
  // Off-grid samples, so none lands on a shared edge.
  for (let x = minX + 0.13; x < maxX; x += 2)
    for (let y = minY + 0.27; y < maxY; y += 2) {
      const containing = DERELICT_SHARDS.filter(({ points }) => {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const a = points[i],
            b = points[j];
          if (
            a.y > y !== b.y > y &&
            x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
          )
            inside = !inside;
        }
        return inside;
      });
      expect(containing).toHaveLength(1);
    }
});
