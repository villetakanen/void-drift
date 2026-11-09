import { expect, it } from "vitest";
import { FxBench } from "./fx-bench";
import { Simulation } from "./simulation";

const both = { leftThruster: true, rightThruster: true, fire: false };
const idle = { leftThruster: false, rightThruster: false, fire: false };
it("arena wrap refreshes outlet state without altering inward momentum", () => {
  const sim = new Simulation();
  sim.start();
  sim.step(both);
  expect(sim.plume.activeCount).toBeGreaterThan(0);
  sim.ship.pos.set(2161, 540);
  sim.ship.vel.set(100, 0);
  sim.step(idle);
  expect(sim.wraps).toBe(1);
  expect(sim.plume.activeCount).toBe(0);
  expect(sim.ship.pos.x).toBeLessThan(960);
  expect(sim.ship.vel.x).toBeGreaterThan(0);
});

it("effect detail and burst overload leave the six simulations identical", () => {
  const a = new FxBench(),
    b = new FxBench();
  b.overload = true;
  b.enabled = false;
  for (let i = 0; i < 180; i++) {
    a.step();
    b.step();
  }
  for (let i = 0; i < 6; i++) {
    expect(a.ships[i].state).toEqual(b.ships[i].state);
    expect(a.ships[i].ship).toEqual(b.ships[i].ship);
  }
  expect(a.ships.some((sim) => sim.gravityCollectionRate > 0)).toBe(true);
  a.reset();
  expect(a.sparks.count).toBe(0);
  for (const sim of a.ships) expect(sim.plume.activeCount).toBe(0);
});

it("the armed mixed workload fires real weapons independently of effect settings", () => {
  const a = new FxBench(),
    b = new FxBench();
  a.weapons = b.weapons = true;
  a.reset();
  b.reset();
  b.enabled = false;
  b.overload = true;
  for (let i = 0; i < 470; i++) {
    a.step();
    b.step();
  }
  expect(
    a.ships.reduce(
      (sum, sim) =>
        sum + (sim.salvage?.shotsFired ?? 0) + (sim.salvage?.laserPulses ?? 0),
      0,
    ),
  ).toBeGreaterThan(0);
  // Point-defence turrets fire beside the twin cannons.
  const armed = a.ships.filter((sim) =>
    sim.salvage?.weapons.some((w) => w.kind === "ion-point-defence"),
  );
  expect(armed.length).toBeGreaterThan(0);
  for (const sim of armed)
    expect(
      sim.salvage?.weapons.some((w) => w.kind === "light-ion-cannon"),
    ).toBe(true);
  expect(
    armed.reduce(
      (sum, sim) => sum + (sim.salvage?.pointDefenceDischarges ?? 0),
      0,
    ),
  ).toBeGreaterThan(0);
  for (let i = 0; i < 6; i++) {
    expect(a.ships[i].salvage).toEqual(b.ships[i].salvage);
    expect(a.ships[i].state).toEqual(b.ships[i].state);
  }
});
