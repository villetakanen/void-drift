import { expect, it } from "vitest";
import {
  DERELICT_PLANE_PALETTE,
  DERELICT_SHARDS,
  DERELICT_SOURCE_PLANES,
} from "./derelict-geometry";
import { SALVAGE } from "./schemas/salvage";

it("partitions the source hull envelope into one unequal region per fragment without losing material", () => {
  expect(DERELICT_SHARDS).toHaveLength(SALVAGE.fragment.count);
  const all = DERELICT_SHARDS.flatMap(({ points }) => points);
  const minX = Math.min(...all.map((p) => p.x)),
    maxX = Math.max(...all.map((p) => p.x)),
    minY = Math.min(...all.map((p) => p.y)),
    maxY = Math.max(...all.map((p) => p.y));
  const areas = DERELICT_SHARDS.map(
    ({ points }) =>
      Math.abs(
        points.reduce((sum, p, i) => {
          const q = points[(i + 1) % points.length];
          return sum + p.x * q.y - p.y * q.x;
        }, 0),
      ) / 2,
  );
  expect(areas.every((area) => area > 0)).toBe(true);
  expect(areas.reduce((a, b) => a + b, 0)).toBeCloseTo(
    (maxX - minX) * (maxY - minY),
    6,
  );
  expect(new Set(areas.map((area) => area.toFixed(2))).size).toBeGreaterThan(4);
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
it("gives every source plane a flat production colour", () => {
  expect(DERELICT_PLANE_PALETTE).toHaveLength(DERELICT_SOURCE_PLANES.length);
  expect(
    DERELICT_PLANE_PALETTE.every((fill) => /^#[0-9a-f]{6}$/.test(fill)),
  ).toBe(true);
});
