import {
  getPlanetInfluenceRadius,
  planetPull,
  SURVIVAL_CONFIG,
} from "@void-drift/core";
import { expect, it } from "vitest";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
it("keeps the Practice roster isolated, repeatable and clear over entire orbits", () => {
  const a = new Simulation({ ...stockSettings(), mode: "practice", seed: 1 });
  const b = new Simulation({ ...stockSettings(), mode: "practice", seed: 999 });
  const mercury = a.planets.find((p) => p.id === "moon");
  if (!mercury?.massWell) throw new Error("Practice Mercury well missing");
  for (const mode of ["survival", "derelicts", "gauntlet"] as const) {
    const other = new Simulation({ ...gameSettings("wasp"), mode });
    expect(other.planets.some((p) => p.id === "venus")).toBe(false);
    expect(other.planets.some((p) => p.id === "gas")).toBe(true);
    const moon = other.planets.find((p) => p.id === "moon");
    if (!moon?.massWell) throw new Error("Stock moon well missing");
    // The deliberately lighter Practice Mercury must not retune stock modes.
    expect(moon.massWell.mass).toBeGreaterThan(mercury.massWell.mass);
  }
  for (const p of a.planets) {
    expect(p.orbitRadius - p.radius).toBeGreaterThan(a.star.radius);
    expect(
      Math.hypot(p.pos.x - a.ship.pos.x, p.pos.y - a.ship.pos.y),
    ).toBeGreaterThan(p.radius + a.ship.radius);
    for (const q of a.planets)
      if (p !== q)
        expect(Math.abs(p.orbitRadius - q.orbitRadius)).toBeGreaterThan(
          p.radius + q.radius,
        );
  }
  a.start();
  b.start();
  for (let i = 0; i < 600; i++) {
    a.step(idle);
    b.step(idle);
  }
  expect(a.planets).toEqual(b.planets);
  expect(a.ship).toEqual(b.ship);
});

it("applies the Venus well only inside its boundary and preserves Practice contact", () => {
  const sim = new Simulation({ ...stockSettings(), mode: "practice" });
  const venus = sim.planets.find((p) => p.id === "venus");
  if (!venus) throw new Error("Practice Venus missing");
  const reach = getPlanetInfluenceRadius(venus);
  expect(
    planetPull(
      { x: venus.pos.x + reach + 1, y: venus.pos.y },
      sim.ship.radius,
      venus,
    ),
  ).toEqual({ x: 0, y: 0 });
  const pull = planetPull(
    { x: venus.pos.x + reach - 1, y: venus.pos.y },
    sim.ship.radius,
    venus,
  );
  expect(pull.x).toBeLessThan(0);
  expect(pull.y).toBeCloseTo(0);
  sim.ship.pos.set(
    venus.pos.x + venus.radius + sim.ship.radius - 1,
    venus.pos.y,
  );
  sim.ship.vel.set(-100, 0);
  sim.start();
  sim.step(idle);
  expect(sim.ship.vel.x).toBeGreaterThan(0);
  expect(
    Math.hypot(sim.ship.pos.x - venus.pos.x, sim.ship.pos.y - venus.pos.y),
  ).toBeGreaterThanOrEqual(venus.radius + sim.ship.radius);
  expect(sim.state.resources.hull).toBe(SURVIVAL_CONFIG.INITIAL_HULL);
  expect(sim.state.status).toBe("PLAYING");
});
