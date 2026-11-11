import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, SALVAGE } from "./schemas/salvage";

function scene(seed = 2026) {
  const system = new SalvageSystem(defaultLoadout("fighter"), seed);
  const ship = {
    pos: new Vec2(-10000, -10000),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const star = createStar("G", 960, 540);
  star.radius = 0;
  const resources = { hull: 100, power: 100 };
  const advance = (dt: number) =>
    system.step(dt, ship, star, resources, 100, ship.pos.x, ship.pos.y, false);
  return { system, ship, advance };
}
function next(s: ReturnType<typeof scene>) {
  const deadline = s.system.nextPass;
  s.advance(deadline - s.system.time - 0.00001);
  s.advance(0.00001);
  return deadline;
}
function fixed(group: number): SalvageBody {
  return {
    id: group,
    group,
    kind: "cell",
    x: 100,
    y: 100,
    previousX: 100,
    previousY: 100,
    vx: 0,
    vy: 0,
    radius: 6,
    hull: 1,
    life: 100000,
    rotation: 0,
  };
}
describe("boundary encounters", () => {
  it("skips arrivals while full, with no backlog and later paths unchanged", () => {
    const a = scene(),
      b = scene();
    b.system.bodies = Array.from({ length: ENCOUNTER.groups }, (_, i) =>
      fixed(i + 10),
    );
    for (let i = 0; i < 10; i++) {
      a.system.bodies = [];
      next(a);
      next(b);
      expect(b.system.passes).toBe(0);
    }
    a.system.bodies = [];
    b.system.bodies = [];
    next(a);
    next(b);
    expect(b.system.bodies).toHaveLength(1);
    const [left, right] = [a.system.bodies[0], b.system.bodies[0]];
    expect([right.x, right.y, right.vx, right.vy]).toEqual([
      left.x,
      left.y,
      left.vx,
      left.vy,
    ]);
  });
  it("keeps a group occupied until its last cell or wreck expires and its last shard is destroyed", () => {
    const s = scene();
    s.system.nextPass = Infinity;
    s.system.bodies = [
      { ...fixed(42), id: 1, kind: "fragment", life: undefined },
      { ...fixed(42), id: 2, life: SALVAGE.cell.life },
      { ...fixed(42), id: 3, kind: "wreck", life: SALVAGE.wreck.life },
    ];
    s.advance(Math.max(SALVAGE.cell.life, SALVAGE.wreck.life) + 0.001);
    expect(s.system.bodies.map((body) => body.kind)).toEqual(["fragment"]);
    expect(s.system.groups).toBe(1);
    s.system.bodies[0].hull = 0;
    s.advance(0.1);
    expect(s.system.groups).toBe(0);
  });
  it("keeps later timing and paths unchanged after combat consumes breakup randomness", () => {
    const a = scene(),
      b = scene();
    a.ship.pos.set(400, 400);
    a.system.bodies.push({
      ...fixed(42),
      id: 1000,
      kind: "wreck",
      x: 400,
      y: 400,
      previousX: 400,
      previousY: 400,
      radius: 18,
      hull: 85,
    });
    a.advance(0.001);
    b.advance(0.001);
    expect(a.system.destroyed).toBe(1);
    a.ship.pos.set(-10000, -10000);
    for (let i = 0; i < 20; i++) {
      a.system.bodies = [];
      b.system.bodies = [];
      expect(next(a)).toBe(next(b));
      const left = a.system.bodies[0],
        right = b.system.bodies[0];
      expect([left.x, left.y, left.vx, left.vy]).toEqual([
        right.x,
        right.y,
        right.vx,
        right.vy,
      ]);
    }
  });
});
