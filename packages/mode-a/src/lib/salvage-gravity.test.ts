import { initializePlanets, updateShip, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, SALVAGE } from "./schemas/salvage";
import { applyGravityTuning, STEP } from "./simulation";

const DT = STEP / 4;
const KINDS = ["wreck", "fragment", "cell"] as const;
const idle = { leftThruster: false, rightThruster: false, fire: false };

function scene(seed = 2026) {
  const system = new SalvageSystem(defaultLoadout("fighter"), seed);
  system.nextPass = Infinity;
  const star = createStar("G", ENCOUNTER.centerX, ENCOUNTER.centerY);
  const planets = initializePlanets(ENCOUNTER.centerX, ENCOUNTER.centerY);
  applyGravityTuning(star, planets);
  const ship = {
    pos: new Vec2(-10000, -10000),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const resources = { hull: 100, power: 100 };
  const step = (withPlanets = true) =>
    system.step(
      DT,
      ship,
      star,
      resources,
      100,
      ship.pos.x,
      ship.pos.y,
      false,
      withPlanets ? planets : [],
    );
  return { system, star, planets, ship, step };
}
function body(
  kind: Exclude<SalvageBody["kind"], "ship">,
  x: number,
  y: number,
  vx = 0,
  vy = 0,
  id = 1,
): SalvageBody {
  return {
    id,
    group: id,
    kind,
    x,
    y,
    previousX: x,
    previousY: y,
    vx,
    vy,
    radius: kind === "wreck" ? 18 : kind === "fragment" ? 5 : 6,
    hull: kind === "cell" ? 1 : SALVAGE[kind].hull,
    life: kind === "fragment" ? undefined : 1000,
    rotation: 0,
  };
}
/** What the ship's own flight step does to a velocity at a point, no input and no drag. */
function shipDeltaAt(
  x: number,
  y: number,
  star: ReturnType<typeof createStar>,
  planets: ReturnType<typeof initializePlanets>,
) {
  const ship = {
    pos: new Vec2(x, y),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  updateShip(
    ship,
    idle,
    DT,
    1920,
    1080,
    star,
    planets,
    undefined,
    undefined,
    undefined,
    { drag: 0, speedLimit: null },
    "inverse-square",
  );
  return { x: ship.vel.x, y: ship.vel.y };
}

describe("salvage gravity", () => {
  it("pulls a body towards the sun exactly as it pulls the ship", () => {
    const s = scene();
    const at = {
      x: ENCOUNTER.centerX + s.star.radius + 120,
      y: ENCOUNTER.centerY + 40,
    };
    const b = body("wreck", at.x, at.y);
    s.system.bodies = [b];
    const expected = shipDeltaAt(at.x, at.y, s.star, []);
    s.step(false);
    expect(expected.x).not.toBe(0);
    expect(b.vx).toBeCloseTo(expected.x, 12);
    expect(b.vy).toBeCloseTo(expected.y, 12);
  });
  it("does not depend on mass or kind", () => {
    const s = scene();
    const at = { x: ENCOUNTER.centerX + 300, y: ENCOUNTER.centerY };
    s.system.bodies = KINDS.map((kind, i) =>
      body(kind, at.x, at.y, 0, 0, i + 1),
    );
    s.step(false);
    const [a, ...rest] = s.system.bodies;
    for (const other of rest) expect(other.vx).toBe(a.vx);
  });
  it("bends a passing path into the sun, which gives no kill and no cell", () => {
    const s = scene();
    const { x: cx, y: cy } = s.star.pos;
    const miss = s.star.radius + 40;
    const b = body("wreck", cx + 700, cy + miss, -150, 0);
    s.system.bodies = [b];
    // A straight line clears the sun; only gravity can bring it down.
    expect(Math.abs(b.y - cy)).toBeGreaterThan(s.star.radius + b.radius);
    for (let i = 0; i < 60 * 4 * 12 && b.hull > 0; i++) s.step(false);
    expect(b.hull).toBe(0);
    s.step(false);
    expect(s.system.playerKills).toBe(0);
    expect(s.system.bodies.filter((x) => x.kind === "cell")).toHaveLength(0);
  });
  it("destroys a wreck that falls onto a planet with no kill and no cell", () => {
    const s = scene();
    const planet = s.planets[0];
    const b = body(
      "wreck",
      planet.pos.x + planet.radius + 60,
      planet.pos.y,
      -50,
      0,
    );
    s.system.bodies = [b];
    for (let i = 0; i < 60 * 4 * 6 && b.hull > 0; i++) s.step();
    expect(b.hull).toBe(0);
    s.step();
    expect(s.system.playerKills).toBe(0);
    expect(s.system.bodies.filter((x) => x.kind === "cell")).toHaveLength(0);
  });
  it("is deterministic for a seed, gravity included", () => {
    const run = () => {
      const s = scene(7);
      s.system.nextPass = 0;
      for (let i = 0; i < 60 * 4 * 20; i++) s.step();
      return JSON.stringify(s.system);
    };
    expect(run()).toBe(run());
  });
});

describe("Derelicts-mode occupancy", () => {
  it("accepts the last free group and skips an arrival when all are occupied", () => {
    const s = scene();
    const occupy = (n: number) => {
      s.system.bodies = Array.from({ length: n }, (_, i) => {
        const cell = body("cell", 100, 100, 0, 0, i + 101);
        cell.life = 100000;
        return cell;
      });
    };
    occupy(ENCOUNTER.groups - 1);
    s.system.nextPass = s.system.time + DT / 2;
    s.step(false);
    expect(s.system.passes).toBe(1);
    expect(s.system.groups).toBe(ENCOUNTER.groups);
    occupy(ENCOUNTER.groups);
    s.system.passes = 0;
    s.system.nextPass = s.system.time + DT / 2;
    const before = s.system.nextPass;
    s.step(false);
    expect(s.system.passes).toBe(0);
    expect(s.system.groups).toBe(ENCOUNTER.groups);
    expect(s.system.nextPass).toBeGreaterThan(before);
  });
});
