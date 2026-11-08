import { describe, expect, it } from "vitest";
import { LandingSystem } from "./landing-system";
import { CHALLENGE_SEED, gameSettings, Simulation } from "./simulation";

describe("landing system", () => {
  it("generates bounded, separated orbits across seeds with the standard G Sun", () => {
    const classes = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      let state = seed * 98765;
      const scene = new LandingSystem(() => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      });
      classes.add(scene.star.type);
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
    expect([...classes]).toEqual(["G"]);
  });

  it("places the sun in the lower-right and extends toward the upper-left", () => {
    for (const random of [0, 0.5, 0.999]) {
      const scene = new LandingSystem(() => random);
      for (const [width, height] of [
        [1920, 1080],
        [1024, 768],
      ]) {
        const frame = scene.layout(width, height);
        expect(frame.star.x).toBe(width * 0.75);
        expect(frame.star.y).toBe(height * 0.75);
        const outer = frame.planets[2];
        expect(outer.x).toBeLessThan(width * 0.15);
        expect(outer.y).toBeLessThan(height * 0.2);
        expect(frame.planets.every((body) => body.radius > 0)).toBe(true);
      }
    }
  });

  it("moves visibly and independently of frame rate or survival state", () => {
    const a = new LandingSystem(() => 0.5);
    const b = new LandingSystem(() => 0.5);
    const initial = a.planets[0].pos.clone();
    for (let frame = 0; frame < 120; frame++) a.step(1 / 60);
    for (let frame = 0; frame < 60; frame++) b.step(1 / 30);
    expect(a.planets[0].pos.x).toBeCloseTo(b.planets[0].pos.x, 8);
    expect(a.planets[0].pos.y).toBeCloseTo(b.planets[0].pos.y, 8);
    expect(
      Math.hypot(
        a.planets[0].pos.x - initial.x,
        a.planets[0].pos.y - initial.y,
      ),
    ).toBeGreaterThan(5);
    const run = new Simulation(gameSettings());
    expect(run.star.type).toBe("G");
    expect(run.settings.seed).toBe(CHALLENGE_SEED);
    expect(run.ticks).toBe(0);
  });

  it("keeps each visible orbit circular and centered on the sun throughout motion", () => {
    const scene = new LandingSystem(() => 0.5);
    for (let step = 0; step < 16; step++) {
      scene.step(10);
      const frame = scene.layout(1920, 1080);
      for (const body of frame.planets) {
        expect(body.orbitY).toBeCloseTo(body.orbitX);
        expect(
          Math.hypot(body.x - frame.star.x, body.y - frame.star.y),
        ).toBeCloseTo(body.orbitX);
      }
    }
  });
});
