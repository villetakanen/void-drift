import { describe, expect, it } from "vitest";
import { LandingSystem } from "./landing-system";

describe("landing system", () => {
  it("generates bounded, separated orbits across seeds with the standard G Sun", () => {
    for (let seed = 1; seed <= 100; seed++) {
      let state = seed * 98765;
      const scene = new LandingSystem(() => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      });
      expect(scene.star.type).toBe("G");
      expect(scene.planets).toHaveLength(3);
      for (const [index, planet] of scene.planets.entries()) {
        expect(planet.hasRing).toBe(false);
        expect(planet.orbitRadius - planet.radius).toBeGreaterThan(
          scene.star.radius,
        );
        expect((Math.PI * 2) / planet.orbitSpeed).toBeGreaterThanOrEqual(120);
        expect((Math.PI * 2) / planet.orbitSpeed).toBeLessThanOrEqual(240);
        if (index)
          expect(
            planet.orbitRadius - scene.planets[index - 1].orbitRadius,
          ).toBeGreaterThan(planet.radius + scene.planets[index - 1].radius);
      }
    }
  });
});
