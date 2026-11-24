import {
  CAMERA_ARENA_RADIUS,
  initializePlanets,
  massWellReach,
} from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { mercurialMass } from "./mercurial-rock";
import { gameSettings, Simulation } from "./simulation";
import {
  generateSolarSystem,
  mercurialOrbit,
  orbitsConflict,
} from "./solar-system";
import { GRAVITY_TUNING } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

describe("generated mercurial planet", () => {
  it("places all nine Sun and body combinations within the actual fields", () => {
    for (const sunRadius of [36, 70, 140]) {
      const star = createStar("G", 0, 0);
      applyYellowFamilyProfile(star, sunRadius, GRAVITY_TUNING);
      if (!star.damageField || !star.collectionField)
        throw new Error("Missing fields");
      for (const radius of [16, 27, 36]) {
        const danger = star.damageField.reach;
        const collection = star.collectionField.reach;
        const orbit = mercurialOrbit(sunRadius, danger, collection, radius);
        expect(orbit - radius).toBeGreaterThanOrEqual(danger + 1 - 1e-10);
        expect(orbit + radius).toBeLessThanOrEqual(collection - 1 + 1e-10);
      }
    }
  });

  it("accepts a single-point interval and rejects invalid or impossible fields", () => {
    expect(mercurialOrbit(70, 100, 156, 27)).toBe(128);
    expect(() => mercurialOrbit(70, 100, 155, 27)).toThrow();
    for (const value of [NaN, Infinity, 0, -1]) {
      expect(() => mercurialOrbit(70, value, 300, 27)).toThrow();
    }
    expect(() => generateSolarSystem({ seed: 0 })).toThrow();
    expect(() => generateSolarSystem({ seed: 1, centerX: Infinity })).toThrow();
  });

  it("removes touching swept paths including the clearance boundary", () => {
    const moon = { orbitRadius: 200, radius: 27 };
    expect(orbitsConflict(moon, { orbitRadius: 258, radius: 30 })).toBe(true);
    expect(orbitsConflict(moon, { orbitRadius: 142, radius: 30 })).toBe(true);
    expect(orbitsConflict(moon, { orbitRadius: 258.001, radius: 30 })).toBe(
      false,
    );
  });

  it("is seeded, varied, centred and keeps retained stock bodies clear of mandatory worlds", () => {
    const radii = new Set<number>();
    let removed = false;
    for (let seed = 1; seed <= 300; seed++) {
      const system = generateSolarSystem({ seed, centerX: -50, centerY: 73 });
      expect(system).toEqual(
        generateSolarSystem({ seed, centerX: -50, centerY: 73 }),
      );
      const moon = system.planets.find((planet) => planet.id === "moon");
      if (!moon) throw new Error("Missing mercurial planet");
      expect(
        system.planets.filter((planet) => planet.id === "moon"),
      ).toHaveLength(1);
      expect(moon.radius).toBeGreaterThanOrEqual(16);
      expect(moon.radius).toBeLessThan(36);
      expect(moon.displayName).toBeUndefined();
      expect(moon.massWell?.mass).toBe(mercurialMass(moon.radius));
      expect(moon.mass).toBe(moon.massWell?.mass);
      expect(moon.orbitSpeed * moon.orbitRadius).toBeCloseTo(4);
      expect(moon.orbitCenter).toMatchObject({ x: -50, y: 73 });
      expect(moon.pos.clone().sub(moon.orbitCenter).mag()).toBeCloseTo(
        moon.orbitRadius,
      );
      radii.add(moon.radius);
      const habitable = system.planets.find((p) => p.id === "habitable");
      if (!habitable) throw new Error("Missing Habitable world");
      const mandatory = system.planets.filter(
        (p) =>
          p.id === "moon" || p.id === "outer-mercurial" || p.id === "habitable",
      );
      const stock = system.planets.filter((p) => !mandatory.includes(p));
      for (const retained of stock) {
        expect(retained.orbitRadius).toBeGreaterThan(habitable.orbitRadius);
        for (const p of mandatory)
          expect(
            Math.abs(retained.orbitRadius - p.orbitRadius),
          ).toBeGreaterThan(
            retained.radius + p.radius + (p.atmosphere?.depth ?? 0) + 1,
          );
      }
      if (stock.length < initializePlanets(-50, 73).length - 2) removed = true;
      const outward = [...system.planets].sort(
        (a, b) => a.orbitRadius - b.orbitRadius,
      );
      expect(outward.map((p) => p.systemPosition)).toEqual(
        outward.map((_, i) => i + 1),
      );
    }
    expect(radii.size).toBeGreaterThan(1);
    expect(removed).toBe(true);
  });

  it("adds an outermost third planet beside Habitable when the inner pair cannot fit", () => {
    let fallbackCount = 0;
    let innerPairCount = 0;
    const reach = (
      planet: ReturnType<typeof generateSolarSystem>["planets"][number],
    ) => {
      const well = planet.massWell;
      if (!well) throw new Error("Missing gravity well");
      return massWellReach(well.mass, well.cutoff, well.falloff);
    };
    for (let seed = 1; seed <= 1000; seed++) {
      const { star, planets } = generateSolarSystem({
        seed,
        centerX: -50,
        centerY: 73,
      });
      const inner = planets.find((p) => p.id === "moon");
      const outer = planets.find((p) => p.id === "outer-mercurial");
      const habitable = planets.find((p) => p.id === "habitable");
      expect(
        planets.filter((p) => p.id === "moon" || p.id === "outer-mercurial"),
      ).toHaveLength(2);
      if (!inner || !outer || !habitable || !star.collectionField)
        throw new Error("Missing generated body or charging field");
      const collection = star.collectionField.reach;
      expect(inner.orbitRadius + inner.radius + 1).toBeLessThanOrEqual(
        collection + 1e-9,
      );
      expect(outer.massWell?.mass).toBe(mercurialMass(outer.radius));
      expect(outer.orbitSpeed * outer.orbitRadius).toBeCloseTo(4);
      if (outer.orbitRadius < habitable.orbitRadius) {
        innerPairCount++;
        expect(outer.orbitRadius + outer.radius + 1).toBeLessThanOrEqual(
          collection + 1e-9,
        );
        expect(outer.orbitRadius + reach(outer)).toBeLessThanOrEqual(
          star.influenceRadius + 1e-9,
        );
        continue;
      }
      fallbackCount++;
      expect(outer.systemPosition).toBe(3);
      expect(outer.orbitRadius).toBe(
        Math.max(...planets.map((p) => p.orbitRadius)),
      );
      expect(outer.orbitRadius - outer.radius).toBeGreaterThan(collection);
      expect(outer.orbitRadius + outer.radius).toBeLessThan(
        CAMERA_ARENA_RADIUS,
      );
      const separation = outer.orbitRadius - habitable.orbitRadius;
      expect(reach(habitable) + reach(outer) - separation).toBeCloseTo(
        0.1 * Math.min(reach(habitable), reach(outer)),
        9,
      );
      expect(separation).toBeGreaterThan(
        habitable.radius +
          (habitable.atmosphere?.depth ?? 0) +
          outer.radius +
          1,
      );
      expect(outer.orbitAngle).toBe(habitable.orbitAngle);
      expect(
        Math.hypot(
          outer.pos.x - habitable.pos.x,
          outer.pos.y - habitable.pos.y,
        ),
      ).toBeCloseTo(separation);
    }
    expect(fallbackCount).toBeGreaterThan(0);
    expect(innerPairCount).toBeGreaterThan(0);
  });

  it("uses the same system in all generated modes", () => {
    const systems = (["survival", "derelicts", "gauntlet"] as const).map(
      (mode) => {
        const sim = new Simulation({
          ...gameSettings("wasp"),
          mode,
          seed: 12345,
        });
        return { star: sim.star, planets: sim.planets };
      },
    );
    expect(systems[1]).toEqual(systems[0]);
    expect(systems[2]).toEqual(systems[0]);
  });
});
