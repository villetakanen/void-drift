import { describe, expect, it } from "vitest";
import { airDensity, airSample, applyAtmosphericDrag } from "./atmosphere";

// Contract: docs/specs/game/world/planets/spec.md, "Atmosphere".
const planet = {
  pos: { x: 0, y: 0 },
  radius: 40,
  orbitAngle: 0.7,
  orbitRadius: 600,
  orbitSpeed: 0.004,
  atmosphere: { depth: 10, drag: 0.8 },
};
const airVelocity = {
  x: -Math.sin(planet.orbitAngle) * planet.orbitRadius * planet.orbitSpeed,
  y: Math.cos(planet.orbitAngle) * planet.orbitRadius * planet.orbitSpeed,
};
/** A ship whose collision circle reaches `clearance` units above the surface. */
function ship(clearance: number) {
  const radius = 6;
  return {
    pos: { x: planet.radius + radius + clearance, y: 0 },
    vel: { x: 30, y: 200 },
    radius,
  };
}
function relative(s: ReturnType<typeof ship>) {
  return { x: s.vel.x - airVelocity.x, y: s.vel.y - airVelocity.y };
}
function fly(clearance: number, seconds: number) {
  const s = ship(clearance);
  for (let t = 0; t < seconds * 60; t++)
    applyAtmosphericDrag(s, planet, 1 / 60);
  return s;
}

describe("atmosphere", () => {
  it("leaves motion unchanged outside the air", () => {
    const outside = fly(planet.atmosphere.depth + 0.5, 1);
    expect(outside.vel).toEqual(ship(0).vel);
    expect(airSample(outside, planet)).toBeNull();
  });

  it("leaves a planet without air alone", () => {
    const s = ship(1);
    applyAtmosphericDrag(s, { ...planet, atmosphere: undefined }, 1);
    expect(s.vel).toEqual(ship(1).vel);
  });

  it("slows without turning the velocity relative to the air", () => {
    const before = relative(ship(4));
    const after = relative(fly(4, 1));
    expect(Math.hypot(after.x, after.y)).toBeLessThan(
      Math.hypot(before.x, before.y),
    );
    const cross = before.x * after.y - before.y * after.x;
    expect(Math.abs(cross)).toBeLessThan(1e-6);
    expect(before.x * after.x + before.y * after.y).toBeGreaterThan(0);
  });

  it("slows more in deeper air over equal time", () => {
    const shallow = relative(fly(8, 1));
    const deep = relative(fly(2, 1));
    expect(Math.hypot(deep.x, deep.y)).toBeLessThan(
      Math.hypot(shallow.x, shallow.y),
    );
    expect(airDensity(ship(2), planet)).toBeGreaterThan(
      airDensity(ship(8), planet),
    );
  });

  it("gives equal results for equal simulated time", () => {
    const fine = ship(4);
    for (let t = 0; t < 120; t++) applyAtmosphericDrag(fine, planet, 1 / 120);
    const coarse = fly(4, 1);
    expect(fine.vel.x).toBeCloseTo(coarse.vel.x, 9);
    expect(fine.vel.y).toBeCloseTo(coarse.vel.y, 9);
  });

  it("points the sample toward the planet", () => {
    const sample = airSample(ship(3), planet);
    expect(sample?.towardPlanet.x).toBeCloseTo(-1);
    expect(sample?.density).toBeGreaterThan(0);
  });
});
