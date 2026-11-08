import { expect, it } from "vitest";
import { updateShip, Vec2 } from "../physics/Physics";
import { EnginePlume } from "./engine-plume";

const cutoff = 750; // Explicit input fixture, independent of the shipped cutoff.

function ship(speed = 0) {
  return {
    pos: new Vec2(960, 540),
    vel: new Vec2(speed, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
}
function push(speed: number, rotation = 0, right = true, dt = 1 / 60) {
  const body = ship(speed);
  body.rotation = rotation;
  const output = updateShip(
    body,
    { leftThruster: true, rightThruster: right, fire: false },
    dt,
    1920,
    1080,
    undefined,
    [],
    undefined,
    undefined,
    { thrustMultiplier: 1, turnMultiplier: 0, hullMultiplier: 1 },
    { drag: 0, speedLimit: null },
    "inverse-square",
    600,
    cutoff,
  );
  return { body, output };
}
it("stops forward engine output at the cutoff without clamping existing speed", () => {
  for (const speed of [750, 1200]) {
    const result = push(speed);
    expect(result.output).toBe(0);
    expect(result.body.vel.x).toBe(speed);
  }
  expect(push(749, 0, true, 10).body.vel.x).toBeLessThanOrEqual(750);
});
it("retains braking, sideways thrust, and half contribution per engine", () => {
  expect(push(1200, Math.PI).body.vel.x).toBeLessThan(1200);
  expect(push(1200, Math.PI / 2).body.vel.y).toBeGreaterThan(0);
  expect(push(0, 0, false).body.vel.x).toBeCloseTo(push(0).body.vel.x / 2);
});
it("legacy outlets pause, release, reject invalid output and reset without accumulating", () => {
  const plume = new EnginePlume(),
    body = ship();
  plume.step(1 / 60, body, 1, 0);
  plume.step(0, body, 0, 1);
  expect(plume.activeCount).toBe(1);
  plume.step(1 / 60, body, Number.NaN, Infinity);
  expect(plume.activeCount).toBe(0);
  for (let i = 0; i < 1000; i++) plume.step(1 / 60, body, 1, 1);
  expect(plume.activeCount).toBe(2);
  plume.step(1 / 60, body, 0, 0);
  expect(plume.activeCount).toBe(0);
  plume.step(0.65, body, 0, 0);
  expect(plume.activeCount).toBe(0);
  plume.step(1 / 60, body, 1, 1);
  plume.clear();
  expect(plume.activeCount).toBe(0);
});

it("mounted emission stays bounded independently of elapsed time or source overload", () => {
  const plume = new EnginePlume(),
    body = ship();
  const emitters = Array.from({ length: 5 }, (_, i) => ({
    x: -10,
    y: i * 5,
    angle: i * 0.1,
    output: 1,
  }));
  for (let i = 0; i < 1000; i++) plume.stepMounted(1 / 60, body, emitters);
  expect(plume.activeCount).toBe(5);
  plume.stepMounted(
    1 / 60,
    body,
    Array.from({ length: 1000 }, () => emitters[0]),
  );
  const saturated = plume.activeCount;
  expect(saturated).toBeGreaterThan(0);
  expect(saturated).toBeLessThan(1000);
  plume.stepMounted(
    1 / 60,
    body,
    Array.from({ length: 2000 }, () => emitters[0]),
  );
  expect(plume.activeCount).toBe(saturated);
  for (const emitter of emitters) emitter.output = 0;
  const count = plume.activeCount;
  plume.stepMounted(0, body, emitters);
  expect(plume.activeCount).toBe(count);
  plume.stepMounted(0.65, body, emitters);
  expect(plume.activeCount).toBe(0);
});
