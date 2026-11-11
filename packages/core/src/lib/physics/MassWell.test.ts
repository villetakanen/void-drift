import { describe, expect, it } from "vitest";
import {
  bounceOffSurface,
  massWellAcceleration,
  massWellPull,
  massWellReach,
  Vec2,
} from "./Physics";

// Contract: docs/specs/game/world/gravity-field/spec.md.
describe("mass well law", () => {
  const mass = 2400;
  const cutoff = 50;
  const FALLOFFS = ["inverse-square", "inverse"] as const;

  it("pulls by the law inside reach and nothing at or beyond it", () => {
    for (const falloff of FALLOFFS) {
      const reach = massWellReach(mass, cutoff, falloff);
      for (const d of [reach / 10, reach / 2, reach * 0.99])
        expect(massWellAcceleration(d, mass, cutoff, falloff)).toBeCloseTo(
          massWellPull(d, mass, falloff),
          9,
        );
      expect(massWellAcceleration(reach, mass, cutoff, falloff)).toBe(0);
      expect(massWellAcceleration(reach * 2, mass, cutoff, falloff)).toBe(0);
    }
  });

  it("ends the reach where the pull falls to the cut-off", () => {
    for (const falloff of FALLOFFS) {
      const reach = massWellReach(mass, cutoff, falloff);
      expect(massWellPull(reach, mass, falloff)).toBeCloseTo(cutoff, 9);
    }
  });

  it("a lower cut-off extends the reach and leaves the pull inside unchanged", () => {
    for (const falloff of FALLOFFS) {
      const reach = massWellReach(mass, cutoff, falloff);
      expect(massWellReach(mass, cutoff / 2, falloff)).toBeGreaterThan(reach);
      for (const d of [reach / 4, reach / 2, reach * 0.9])
        expect(massWellAcceleration(d, mass, cutoff / 2, falloff)).toBe(
          massWellAcceleration(d, mass, cutoff, falloff),
        );
    }
  });

  it("pulls twice as hard at every distance with twice the mass", () => {
    for (const falloff of FALLOFFS) {
      const reach = massWellReach(mass, cutoff, falloff);
      for (const d of [reach / 4, reach / 2])
        expect(massWellAcceleration(d, mass * 2, cutoff, falloff)).toBeCloseTo(
          2 * massWellAcceleration(d, mass, cutoff, falloff),
          9,
        );
    }
  });
});

describe("surface bounce", () => {
  it("places the ship on the surface and reflects its velocity, losing speed", () => {
    const ship = { pos: new Vec2(-30, 0), vel: new Vec2(100, 20) };
    const speed = bounceOffSurface(ship, { x: 0, y: 0 }, 50);
    expect(speed).toBeCloseTo(Math.hypot(100, 20), 9);
    expect(Math.hypot(ship.pos.x, ship.pos.y)).toBeCloseTo(50, 9);
    // The surface normal is the x axis here: the normal component reverses,
    // and the whole velocity keeps one share of its speed below 1.
    const restitution = ship.vel.mag() / Math.hypot(100, 20);
    expect(restitution).toBeGreaterThan(0);
    expect(restitution).toBeLessThan(1);
    expect(ship.vel.x).toBeCloseTo(-100 * restitution, 9);
    expect(ship.vel.y).toBeCloseTo(20 * restitution, 9);
  });
});
