import { describe, expect, it } from "vitest";
import {
  castDerelict,
  DERELICT_COLLISION_PIECES,
  getDerelictWorldPolygons,
} from "./derelict-collision";
import {
  DERELICT_ORIGIN,
  DERELICT_SCALE,
  DERELICT_SHARDS,
} from "./derelict-geometry";

const world = (x: number, y: number) => ({
  x: (x - DERELICT_ORIGIN.x) * DERELICT_SCALE,
  y: (y - DERELICT_ORIGIN.y) * DERELICT_SCALE,
});
const wreck = { kind: "wreck" as const, x: 0, y: 0, rotation: 0 };
describe("fitted derelict collision", () => {
  it("retains material for every shard and removes released material", () => {
    expect(DERELICT_COLLISION_PIECES.every((p) => p.length > 0)).toBe(true);
    expect(
      getDerelictWorldPolygons({ ...wreck, releasedMask: 255 }),
    ).toHaveLength(0);
    const p = world(89, 105);
    expect(castDerelict(wreck, p, { x: 0, y: 0 }, 0, 0)).not.toBeNull();
    expect(
      castDerelict({ ...wreck, releasedMask: 255 }, p, { x: 0, y: 0 }, 0, 0),
    ).toBeNull();
  });
  it("casts through a fork gap but hits solid material at high speed", () => {
    expect(castDerelict(wreck, world(99, 95), { x: 0, y: 0 }, 0, 0)).toBeNull();
    expect(
      castDerelict(wreck, world(70, 105), { x: 1000, y: 0 }, 0, 1),
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
    const source = world(89, 105);
    const x = (89 - shard.x) * DERELICT_SCALE,
      y = (105 - shard.y) * DERELICT_SCALE;
    expect(source).toBeDefined();
    expect(
      castDerelict(fragment, { x: 30 - y, y: 40 + x }, { x: 0, y: 0 }, 0, 0),
    ).not.toBeNull();
    expect(
      castDerelict(wreck, world(70, 105), { x: 100, y: 0 }, 2, 1)?.time,
    ).toBeLessThan(
      castDerelict(wreck, world(70, 105), { x: 100, y: 0 }, 0, 1)?.time ??
        Infinity,
    );
  });
});

describe("cast bounds and rotation", () => {
  it("removes a single released shard while keeping other material", () => {
    const released = world(89, 105);
    const intact = world(89, 200);
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
    expect(
      castDerelict(wreck, { x: 200, y: 0 }, { x: 100, y: 0 }, 0, Infinity),
    ).toBeNull();
    expect(
      castDerelict(wreck, { x: 200, y: 0 }, { x: 0, y: 0 }, 3, Infinity),
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
    const y = (105 - DERELICT_SHARDS[0].y) * DERELICT_SCALE;
    const p = { x: -y, y: 0 };
    expect(castDerelict(fragment, p, { x: 0, y: 0 }, 0, 0)).toBeNull();
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
