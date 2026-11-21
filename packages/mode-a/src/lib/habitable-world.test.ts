import { CAMERA_ARENA_RADIUS } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import {
  HABITABLE_RADIUS,
  habitableAppearance,
  habitableMass,
  habitableOrbit,
  habitableRadius,
} from "./habitable-world";
import { generateSolarSystem } from "./solar-system";
import { GRAVITY_TUNING } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

describe("Habitable generated worlds", () => {
  it("uses direct radius mass and keeps the complete atmosphere safe at Sun/radius endpoints", () => {
    for (const [radius, ratio] of [
      [HABITABLE_RADIUS.min, 0.94],
      [HABITABLE_RADIUS.reference, 1],
      [HABITABLE_RADIUS.max, 1.06],
    ]) {
      expect(habitableMass(radius)).toBeCloseTo(
        GRAVITY_TUNING.habitable.referenceMass * ratio,
        9,
      );
      for (const sunRadius of [36, 70, 140]) {
        const star = createStar("G", 0, 0);
        applyYellowFamilyProfile(star, sunRadius, GRAVITY_TUNING);
        const orbit = habitableOrbit(star, radius, 10);
        expect(orbit - radius - 10).toBeGreaterThanOrEqual(
          (star.collectionField?.reach ?? Infinity) + 1 - 1e-9,
        );
        expect(orbit + radius + 10).toBeLessThan(CAMERA_ARENA_RADIUS);
      }
    }
    for (const radius of [
      0,
      NaN,
      Infinity,
      HABITABLE_RADIUS.min - 0.01,
      HABITABLE_RADIUS.max + 0.01,
    ])
      expect(() => habitableMass(radius)).toThrow();
    const impossible = createStar("G", 0, 0);
    impossible.collectionField = {
      reach: 1200,
      shoulder: 1,
      peak: 1,
      outerFraction: 0,
    };
    expect(() =>
      habitableOrbit(impossible, HABITABLE_RADIUS.reference, 10),
    ).toThrow();
  });

  it("reproduces all six combinations, both inner-roster layouts and collision/energy clearance across seeded systems", () => {
    const combinations = new Set<string>(),
      ordinals = new Set<number>();
    for (let seed = 1; seed <= 1000; seed++) {
      const system = generateSolarSystem({ seed });
      const worlds = system.planets.filter((p) => p.id === "habitable");
      expect(worlds).toHaveLength(1);
      const world = worlds[0],
        extent = world.radius + (world.atmosphere?.depth ?? NaN);
      expect(world.radius).toBe(habitableRadius(seed));
      expect(world.habitable).toEqual(habitableAppearance(seed));
      expect(world.mass).toBe(habitableMass(world.radius));
      expect(world.massWell?.mass).toBe(world.mass);
      const mercurials = system.planets.filter(
        (p) => p.id === "moon" || p.id === "outer-mercurial",
      );
      expect(world.systemPosition).toBe(
        mercurials.filter((p) => p.orbitRadius < world.orbitRadius).length + 1,
      );
      expect(world.orbitRadius - extent).toBeGreaterThanOrEqual(
        (system.star.collectionField?.reach ?? Infinity) + 1 - 1e-9,
      );
      expect(world.orbitRadius + extent).toBeLessThan(CAMERA_ARENA_RADIUS);
      for (const p of mercurials.filter(
        (p) => p.orbitRadius < world.orbitRadius,
      ))
        expect(world.orbitRadius - p.orbitRadius).toBeGreaterThanOrEqual(
          extent + p.radius + 1 - 1e-9,
        );
      expect(system.planets.some((p) => p.id === "gas")).toBe(false);
      for (const p of system.planets.filter((p) => p.id === "rock"))
        expect(p.orbitRadius - world.orbitRadius).toBeGreaterThan(
          extent + p.radius + 1,
        );
      combinations.add(`${world.habitable?.ground}/${world.habitable?.clouds}`);
      ordinals.add(world.systemPosition ?? 0);
    }
    expect(combinations.size).toBe(6);
    expect([...ordinals].sort()).toEqual([2, 3]);
  });
});
