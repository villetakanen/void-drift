import { expect, it } from "vitest";
import {
  DERELICT_PLANE_PALETTE,
  DERELICT_SHARDS,
  DERELICT_SOURCE_PLANES,
} from "./derelict-geometry";

it("partitions the source hull envelope into eight unequal regions without losing material", () => {
  expect(DERELICT_SHARDS).toHaveLength(8);
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
  expect(areas.reduce((a, b) => a + b, 0)).toBeCloseTo(60 * 150, 6);
  expect(new Set(areas.map((area) => area.toFixed(2))).size).toBeGreaterThan(4);
  for (let x = 72.13; x < 132; x += 2)
    for (let y = 75.27; y < 225; y += 2) {
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
it("gives every source plane a flat production colour and retains B release ordering", () => {
  expect(DERELICT_PLANE_PALETTE).toHaveLength(DERELICT_SOURCE_PLANES.length);
  expect(
    DERELICT_PLANE_PALETTE.every((fill) => /^#[0-9a-f]{6}$/.test(fill)),
  ).toBe(true);
  expect(
    DERELICT_SHARDS.map((piece, index) => ({ piece, index }))
      .filter(({ piece }) => piece.release < 1)
      .sort((a, b) => a.piece.release - b.piece.release)
      .map(({ index }) => index),
  ).toEqual([0, 6, 3]);
});
