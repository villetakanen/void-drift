import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { SURVIVAL_ENCOUNTER } from "./schemas/salvage";

function scene(seed = 2026) {
  const system = new SalvageSystem(
    defaultLoadout("wasp"),
    seed,
    undefined,
    SURVIVAL_ENCOUNTER,
  );
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
  // Runs to the next scheduled arrival and returns its deadline and the wreck.
  const arrival = () => {
    const deadline = system.nextPass;
    system.bodies = [];
    advance(deadline - system.time - 0.00001);
    advance(0.00001);
    return { deadline, wreck: system.bodies[0] as SalvageBody };
  };
  return { system, ship, advance, arrival };
}
function arrivals(count: number, seed?: number) {
  const s = scene(seed);
  return Array.from({ length: count }, () => s.arrival());
}

describe("survival encounter", () => {
  it("spaces every later arrival further apart than the first window", () => {
    const deadlines = arrivals(100).map((run) => run.deadline);
    const gaps = deadlines.slice(1).map((time, i) => time - deadlines[i]);
    expect(Math.min(...gaps)).toBeGreaterThan(SURVIVAL_ENCOUNTER.firstPass.max);
  });
  it("is deterministic for a seed and varies across seeds", () => {
    const shape = (list: ReturnType<typeof arrivals>) =>
      list.map(({ deadline, wreck }) => [
        deadline,
        wreck.x,
        wreck.y,
        wreck.vx,
        wreck.vy,
      ]);
    expect(shape(arrivals(20, 7))).toEqual(shape(arrivals(20, 7)));
    expect(shape(arrivals(20, 7))).not.toEqual(shape(arrivals(20, 8)));
  });
  it("does not depend on where the player is or how it moves", () => {
    const a = scene(),
      b = scene();
    b.ship.pos.set(5000, 4000);
    b.ship.vel.set(900, -800);
    b.ship.rotation = 2.4;
    for (let i = 0; i < 40; i++) {
      const first = a.arrival(),
        second = b.arrival();
      expect(second.deadline).toBe(first.deadline);
      expect(second.wreck).toEqual(first.wreck);
    }
  });
  it("keeps one derelict in play and skips an arrival while it lasts", () => {
    const s = scene();
    s.arrival();
    // Keep the wreck in play, held still, until the next arrival is due.
    const wreck = s.system.bodies[0] as SalvageBody;
    const next = s.system.nextPass;
    while (s.system.time < next) {
      wreck.x = wreck.previousX = SURVIVAL_ENCOUNTER.centerX + 400;
      wreck.y = wreck.previousY = SURVIVAL_ENCOUNTER.centerY;
      wreck.vx = wreck.vy = 0;
      wreck.life = 100000;
      s.advance(Math.min(1, next - s.system.time + 0.00001));
    }
    expect(s.system.passes).toBe(1);
    expect(s.system.groups).toBe(1);
  });
});
