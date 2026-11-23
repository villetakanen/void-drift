import { SURVIVAL_CONFIG } from "@void-drift/core";
import { expect, it } from "vitest";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
it("keeps the Practice roster isolated, repeatable and clear over entire orbits", () => {
  const a = new Simulation({ ...stockSettings(), mode: "practice", seed: 1 });
  const b = new Simulation({ ...stockSettings(), mode: "practice", seed: 999 });
  for (const mode of ["survival", "derelicts", "gauntlet"] as const) {
    const other = new Simulation({ ...gameSettings("wasp"), mode });
    expect(other.planets.some((p) => p.id === "venus")).toBe(false);
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

it("bounces off Venus without hull damage in Practice", () => {
  const sim = new Simulation({ ...stockSettings(), mode: "practice" });
  const venus = sim.planets.find((p) => p.id === "venus");
  if (!venus) throw new Error("Practice Venus missing");
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
