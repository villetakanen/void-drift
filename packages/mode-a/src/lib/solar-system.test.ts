import { initializePlanets } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { mercurialMass } from "./mercurial-rock";
import { gameSettings, Simulation } from "./simulation";
import {
  generateSolarSystem,
  mercurialOrbit,
  mercurialRadius,
  orbitsConflict,
} from "./solar-system";
import { GRAVITY_TUNING } from "./tuning";
import {
  applyYellowFamilyProfile,
  yellowFamilyRadius,
} from "./yellow-star-family";

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
        expect(orbit).toBeCloseTo(
          Math.max(
            danger + radius + 1,
            Math.min(collection - radius - 1, (258 * sunRadius) / 70),
          ),
        );
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

  it("is seeded, varied, independent of Sun size and preserves center and other bodies", () => {
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
      expect(moon.radius).toBe(mercurialRadius(seed));
      expect(moon.radius).toBeGreaterThanOrEqual(16);
      expect(moon.radius).toBeLessThan(36);
      expect(moon.displayName).toBeUndefined();
      expect(moon.massWell?.mass).toBe(mercurialMass(moon.radius));
      expect(moon.mass).toBe(moon.massWell?.mass);
      expect(moon.orbitSpeed * moon.orbitRadius).toBeCloseTo(4);
      expect(moon.orbitCenter).toMatchObject({ x: -50, y: 73 });
      expect(moon.pos.x).toBeCloseTo(
        -50 + Math.cos(moon.orbitAngle) * moon.orbitRadius,
      );
      expect(moon.pos.y).toBeCloseTo(
        73 + Math.sin(moon.orbitAngle) * moon.orbitRadius,
      );
      expect(system.star.radius).toBe(yellowFamilyRadius(seed));
      radii.add(moon.radius);
      const source = initializePlanets(-50, 73);
      for (const other of source.filter((planet) => planet.id !== "moon")) {
        const retained = system.planets.find(
          (planet) => planet.id === other.id,
        );
        const clear =
          Math.abs(other.orbitRadius - moon.orbitRadius) >
          other.radius + moon.radius + 1;
        expect(Boolean(retained)).toBe(clear);
        if (retained) {
          expect(retained.radius).toBe(other.radius);
          expect(retained.orbitRadius).toBe(other.orbitRadius);
          expect(retained.orbitSpeed).toBe(other.orbitSpeed);
          expect(retained.orbitAngle).toBeCloseTo(
            other.orbitAngle + ((seed % 360) / 180) * Math.PI,
          );
        } else removed = true;
      }
      const outward = [...system.planets].sort(
        (a, b) => a.orbitRadius - b.orbitRadius,
      );
      expect(outward.map((p) => p.systemPosition)).toEqual(
        outward.map((_, i) => i + 1),
      );
    }
    expect(radii.size).toBe(300);
    expect(removed).toBe(true);
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
