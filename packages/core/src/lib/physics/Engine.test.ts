import { expect, it } from "vitest";
import { engineEffectiveness, updateShip, Vec2 } from "./Physics";

const cutoff = 750; // Explicit input fixture, independent of the shipped cutoff.

function push(
  speed: number,
  rotation = 0,
  rightThruster = true,
  dt = 1 / 60,
  engineCutoff: number | null = cutoff,
) {
  const ship = {
    pos: new Vec2(960, 540),
    vel: new Vec2(speed, 0),
    acc: new Vec2(0, 0),
    rotation,
    radius: 16,
  };
  const output = updateShip(
    ship,
    { leftThruster: true, rightThruster, fire: false },
    dt,
    1920,
    1080,
    undefined,
    [],
    undefined,
    undefined,
    undefined,
    { drag: 0, speedLimit: null },
    "inverse-square",
    600,
    engineCutoff,
  );
  return { ship, output };
}

it("tapers only the component along the engine push", () => {
  const v = new Vec2(1200, 0);
  expect(engineEffectiveness(v, new Vec2(1, 0), 600)).toBeCloseTo(0.2);
  expect(engineEffectiveness(v, new Vec2(-1, 0), 600)).toBe(1);
  expect(engineEffectiveness(v, new Vec2(0, 1), 600)).toBe(1);
  expect(engineEffectiveness(new Vec2(600, 0), new Vec2(1, 0), 600)).toBe(0.5);
});
it("each engine supplies half the combined thrust and turns the ship", () => {
  const single = push(0, 0, false, 1 / 240, null).ship,
    dual = push(0, 0, true, 1 / 240, null).ship;
  expect(single.vel.mag()).toBeCloseTo(dual.vel.mag() / 2);
  expect(single.rotation).toBeGreaterThan(0);
  expect(dual.rotation).toBe(0);
});
it("stops forward engine output at the cutoff without clamping existing speed", () => {
  for (const speed of [750, 1200]) {
    const result = push(speed);
    expect(result.output).toBe(0);
    expect(result.ship.vel.x).toBe(speed);
  }
  expect(push(749, 0, true, 10).ship.vel.x).toBeLessThanOrEqual(cutoff);
});
it("keeps braking and sideways thrust above the cutoff", () => {
  expect(push(1200, Math.PI).ship.vel.x).toBeLessThan(1200);
  expect(push(1200, Math.PI / 2).ship.vel.y).toBeGreaterThan(0);
});
