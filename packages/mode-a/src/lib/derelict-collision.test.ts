import { describe, expect, it } from "vitest";
import {
  castDerelict,
  DERELICT_COLLISION_PIECES,
  getDerelictRadius,
  getDerelictWorldPolygons,
} from "./derelict-collision";
import {
  DERELICT_ORIGIN,
  DERELICT_SCALE,
  DERELICT_SHARDS,
} from "./derelict-geometry";

type Point = { x: number; y: number };
const world = ({ x, y }: Point) => ({
  x: (x - DERELICT_ORIGIN.x) * DERELICT_SCALE,
  y: (y - DERELICT_ORIGIN.y) * DERELICT_SCALE,
});
const centroid = (poly: readonly Point[]) => ({
  x: poly.reduce((sum, p) => sum + p.x, 0) / poly.length,
  y: poly.reduce((sum, p) => sum + p.y, 0) / poly.length,
});
const area = (poly: readonly Point[]) =>
  Math.abs(
    poly.reduce((sum, p, i) => {
      const q = poly[(i + 1) % poly.length];
      return sum + p.x * q.y - p.y * q.x;
    }, 0),
  ) / 2;
/** Source-space centroids of a shard's convex material pieces, largest first. */
const solids = (shard: number) =>
  [...DERELICT_COLLISION_PIECES[shard]]
    .sort((a, b) => area(b) - area(a))
    .map(centroid);
/** A source-space point inside a shard's own material. */
const solid = (shard: number) => solids(shard)[0];
const wreck = { kind: "wreck" as const, x: 0, y: 0, rotation: 0 };
const bounds = () => {
  const all = getDerelictWorldPolygons(wreck).flat();
  return {
    minX: Math.min(...all.map((p) => p.x)),
    maxX: Math.max(...all.map((p) => p.x)),
    minY: Math.min(...all.map((p) => p.y)),
    maxY: Math.max(...all.map((p) => p.y)),
  };
};
/** Just left of the wreck, level with solid material in the first shard. */
const leftOf = () => ({ x: bounds().minX - 2, y: world(solid(0)).y });
describe("fitted derelict collision", () => {
  it("retains material for every shard and removes released material", () => {
    expect(DERELICT_COLLISION_PIECES.every((p) => p.length > 0)).toBe(true);
    expect(
      getDerelictWorldPolygons({ ...wreck, releasedMask: 255 }),
    ).toHaveLength(0);
    const p = world(solid(0));
    expect(castDerelict(wreck, p, { x: 0, y: 0 }, 0, 0)).not.toBeNull();
    expect(
      castDerelict({ ...wreck, releasedMask: 255 }, p, { x: 0, y: 0 }, 0, 0),
    ).toBeNull();
  });
  it("casts through a gap inside the hull's bounds but hits solid material at high speed", () => {
    const { minX, maxX, minY, maxY } = bounds();
    let gap: Point | undefined;
    for (let x = minX + 0.5; x < maxX && !gap; x += 1)
      for (let y = minY + 0.5; y < maxY; y += 1)
        if (!castDerelict(wreck, { x, y }, { x: 0, y: 0 }, 0, 0)) {
          gap = { x, y };
          break;
        }
    expect(gap).toBeDefined();
    expect(
      castDerelict(wreck, leftOf(), { x: 1000, y: 0 }, 0, 1),
    ).not.toBeNull();
  });
  it("rotates fragments around their sites and supports circle contact", () => {
    const shard = DERELICT_SHARDS[0];
    const fragment = {
      kind: "fragment" as const,
      x: 30,
      y: 40,
      rotation: Math.PI / 2,
      shardIndex: 0,
    };
    const material = solid(0);
    const x = (material.x - shard.x) * DERELICT_SCALE,
      y = (material.y - shard.y) * DERELICT_SCALE;
    expect(
      castDerelict(fragment, { x: 30 - y, y: 40 + x }, { x: 0, y: 0 }, 0, 0),
    ).not.toBeNull();
    expect(
      castDerelict(wreck, leftOf(), { x: 100, y: 0 }, 2, 1)?.time,
    ).toBeLessThan(
      castDerelict(wreck, leftOf(), { x: 100, y: 0 }, 0, 1)?.time ?? Infinity,
    );
  });
});

describe("cast bounds and rotation", () => {
  it("removes a single released shard while keeping other material", () => {
    const released = world(solid(0));
    const intact = world(solid(DERELICT_SHARDS.length - 1));
    expect(castDerelict(wreck, released, { x: 0, y: 0 }, 0, 0)).not.toBeNull();
    expect(
      castDerelict(
        { ...wreck, releasedMask: 1 },
        released,
        { x: 0, y: 0 },
        0,
        0,
      ),
    ).toBeNull();
    expect(
      castDerelict({ ...wreck, releasedMask: 1 }, intact, { x: 0, y: 0 }, 0, 0),
    ).not.toBeNull();
  });
  it("rejects moving away and handles stationary probes", () => {
    const outside = { x: getDerelictRadius(wreck) + 10, y: 0 };
    expect(
      castDerelict(wreck, outside, { x: 100, y: 0 }, 0, Infinity),
    ).toBeNull();
    expect(
      castDerelict(wreck, outside, { x: 0, y: 0 }, 3, Infinity),
    ).toBeNull();
  });
  it("detects a stationary point swept by rotation", () => {
    const fragment = {
      kind: "fragment" as const,
      x: 0,
      y: 0,
      rotation: 0,
      shardIndex: 0,
    };
    const shard = DERELICT_SHARDS[0];
    // Where a piece of material will be a quarter turn later, but none is yet.
    const p = solids(0)
      .map((m) => {
        const x = (m.x - shard.x) * DERELICT_SCALE,
          y = (m.y - shard.y) * DERELICT_SCALE;
        return { x: -y, y: x };
      })
      .find((q) => !castDerelict(fragment, q, { x: 0, y: 0 }, 0, 0));
    if (!p) throw new Error("No empty point a quarter turn ahead of material");
    const hit = castDerelict(fragment, p, { x: 0, y: 0 }, 0, Math.PI, 1);
    expect(hit).not.toBeNull();
    expect(hit?.time).toBeLessThan(Math.PI);
  });
  it("detects a circle tangent at the extreme vertex", () => {
    const polys = getDerelictWorldPolygons(wreck);
    const vertex = polys.flat().reduce((a, b) => (a.x > b.x ? a : b));
    const hit = castDerelict(
      wreck,
      { x: vertex.x + 2, y: vertex.y - 30 },
      { x: 0, y: 10 },
      2,
      6,
    );
    expect(hit).not.toBeNull();
  });
});

it("bounds a high-speed grazing cast while rotating", () => {
  const vertex = getDerelictWorldPolygons(wreck)
    .flat()
    .reduce((a, b) => (a.x > b.x ? a : b));
  const hit = castDerelict(
    wreck,
    { x: vertex.x + 0.9, y: vertex.y - 10 },
    { x: 0, y: 10000 },
    1,
    0.002,
    0.8,
  );
  expect(hit).not.toBeNull();
  expect(hit?.time).toBeLessThan(0.002);
});
