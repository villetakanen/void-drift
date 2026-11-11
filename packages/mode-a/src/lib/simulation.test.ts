import { STANDARD_SUN, SURVIVAL_CONFIG } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { Simulation, stockSettings } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };

describe("flight contract", () => {
  it("reproduces validated replay exactly", () => {
    const a = new Simulation(),
      b = new Simulation();
    a.start();
    b.start();
    const inputs = [
      { ...both, ticks: 180 },
      { ...idle, leftThruster: true, ticks: 90 },
      { ...both, ticks: 180 },
    ];
    a.replay(inputs);
    b.replay(inputs);
    expect(a.ship).toEqual(b.ship);
    expect(a.state).toEqual(b.state);
    expect(() => a.replay([{ ...both, ticks: Infinity }])).toThrow();
  });
  it("changes the system with the seed", () => {
    const settings = stockSettings();
    settings.seed = 50;
    expect(new Simulation(settings).planets[0].pos).not.toEqual(
      new Simulation().planets[0].pos,
    );
  });
  it.each([
    { inStar: true, hull: 0, power: 0, cause: "STAR" },
    { inStar: false, hull: 0, power: 0, cause: "HULL" },
    { inStar: false, hull: 0, power: 50, cause: "HULL" },
  ])(
    "ends a run on the first cause that applies: star, then hull, then energy (%o)",
    ({ inStar, hull, power, cause }) => {
      const s = new Simulation();
      s.planets.length = 0;
      s.ship.pos.set(inStar ? s.star.pos.x : 2000, s.star.pos.y);
      s.start();
      s.state.resources.hull = hull;
      s.state.resources.power = power;
      s.step(idle);
      expect(s.state.status).toBe("GAME_OVER");
      expect(s.state.deathCause).toBe(cause);
    },
  );
  it("dies from depletion and freezes time", () => {
    const s = new Simulation();
    s.ship.pos.set(2000, 540);
    s.start();
    s.replay([{ ...idle, ticks: 10000 }]);
    expect(s.state.status).toBe("GAME_OVER");
    expect(s.state.deathCause).toBe("POWER");
    const ticks = s.ticks;
    s.step(both);
    expect(s.ticks).toBe(ticks);
  });
  it("standard Sun exposure applies the same hull rate to stock profiles", () => {
    const settings = stockSettings();
    const runs = [1, 2].map(
      (hullMultiplier) =>
        new Simulation({
          ...settings,
          profile: { ...settings.profile, hullMultiplier },
        }),
    );
    for (const sim of runs) {
      sim.start();
      sim.ship.pos.set(
        sim.star.pos.x + (STANDARD_SUN.shoulder + STANDARD_SUN.damageReach) / 2,
        sim.star.pos.y,
      );
      sim.step(idle);
    }
    expect(runs[0].state.resources.hull).toBeCloseTo(
      runs[1].state.resources.hull,
    );
  });
});

describe("integrated gravity flight", () => {
  it("coasts without drag or a speed cap", () => {
    const s = new Simulation(stockSettings("scout"));
    s.planets.length = 0;
    s.ship.pos.set(1500, 540);
    s.ship.vel.set(1500, 0);
    s.start();
    s.step(idle);
    expect(s.ship.vel.x).toBe(1500);
  });
  it("planet contact damages the hull", () => {
    const s = new Simulation();
    s.start();
    const planet = s.planets[0];
    s.planets.splice(1);
    planet.orbitCenter.set(1500, 540);
    planet.orbitRadius = 0;
    planet.orbitSpeed = 0;
    s.ship.pos.set(1500 - planet.radius - 15, 540);
    s.ship.vel.set(100, 0);
    s.step(idle);
    expect(s.state.resources.hull).toBeLessThan(SURVIVAL_CONFIG.INITIAL_HULL);
  });
});

describe("elapsedSeconds", () => {
  it("keeps millisecond precision and stays within a second of the whole seconds", () => {
    const simulation = new Simulation(stockSettings("wasp"));
    for (let tick = 0; tick < 1500; tick++) {
      const { elapsedSeconds, wholeSeconds } = simulation;
      expect(
        Math.abs(elapsedSeconds * 1000 - Math.round(elapsedSeconds * 1000)),
      ).toBeLessThan(1e-6);
      expect(elapsedSeconds - wholeSeconds).toBeGreaterThanOrEqual(0);
      expect(elapsedSeconds - wholeSeconds).toBeLessThan(1);
      simulation.ticks++;
    }
  });
});
