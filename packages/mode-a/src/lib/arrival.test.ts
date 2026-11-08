import { describe, expect, it } from "vitest";
import { gameSettings, Simulation } from "./simulation";

describe("interstellar arrival", () => {
  it("reproduces a seeded rim position and oblique 600-speed entry", () => {
    for (const seed of [1, 2026, 2147483647]) {
      const settings = { ...gameSettings(), arrival: true, seed };
      const a = new Simulation(settings),
        b = new Simulation(settings);
      const dx = a.ship.pos.x - 960,
        dy = a.ship.pos.y - 540;
      expect(Math.hypot(dx, dy)).toBeCloseTo(1180);
      expect(Math.hypot(a.ship.vel.x, a.ship.vel.y)).toBeCloseTo(600);
      expect(
        -(dx * a.ship.vel.x + dy * a.ship.vel.y) / (1180 * 600),
      ).toBeCloseTo(Math.cos((37 * Math.PI) / 180));
      expect(a.ship.pos).toEqual(b.ship.pos);
      expect(a.ticks).toBe(0);
    }
  });
  it("varies the entry with seed and preserves ordinary trials", () => {
    expect(
      new Simulation({ ...gameSettings(), arrival: true, seed: 1 }).ship.pos,
    ).not.toEqual(
      new Simulation({ ...gameSettings(), arrival: true, seed: 2 }).ship.pos,
    );
    expect(new Simulation(gameSettings()).ship.vel.x).toBe(0);
  });
});
