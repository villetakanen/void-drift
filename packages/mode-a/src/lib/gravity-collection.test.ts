import { describe, expect, it } from "vitest";
import { buildStats, starterLoadout } from "./schemas/loadout";
import { Simulation, stockSettings } from "./simulation";

function loadoutOf(sim: Simulation) {
  if (!sim.settings.loadout) throw new Error("Fixture needs a fitted ship");
  return sim.settings.loadout;
}
const idle = { leftThruster: false, rightThruster: false, fire: false };
function fixture(count = 1) {
  const loadout = starterLoadout("fighter");
  loadout.hull.fill(null);
  for (let i = 0; i < count; i++) loadout.hull[i] = "gravity-coil";
  const sim = new Simulation({ ...stockSettings("fighter"), loadout });
  sim.star.powerMultiplier = 0;
  sim.planets.splice(1);
  const p = sim.planets[0];
  p.orbitCenter.set(1500, 540);
  p.orbitRadius = 0;
  p.orbitSpeed = 0;
  p.pos.set(1500, 540);
  sim.ship.pos.set(1620, 540);
  sim.ship.vel.set(0, 0);
  sim.ship.rotation = 0;
  sim.state.resources.power = 50;
  sim.start();
  return sim;
}
describe("gravity collection", () => {
  it("does not multiply energy when wells overlap", () => {
    const single = fixture(2);
    single.step(idle);
    const overlapping = fixture(2);
    overlapping.planets.push({ ...overlapping.planets[0] });
    overlapping.step(idle);
    expect(single.gravityCollectionRate).toBeGreaterThan(0);
    expect(overlapping.gravityCollectionRate).toBeCloseTo(
      single.gravityCollectionRate,
    );
  });
  it("never collects above capacity", () => {
    const sim = fixture(2);
    sim.star.pos.set(1620, 640);
    sim.star.powerMultiplier = 100;
    sim.state.resources.power = buildStats(loadoutOf(sim)).capacity;
    for (let i = 0; i < 60; i++) sim.step(idle);
    expect(sim.state.resources.power).toBe(buildStats(loadoutOf(sim)).capacity);
    expect(sim.gravityCollectionRate).toBe(0);
  });
  it("adds no force: solar and gravity fittings coast identically", () => {
    const a = fixture();
    const b = fixture();
    loadoutOf(b).hull[0] = "coil";
    for (let i = 0; i < 20; i++) {
      a.step(idle);
      b.step(idle);
    }
    expect(a.ship.pos).toEqual(b.ship.pos);
    expect(a.ship.vel).toEqual(b.ship.vel);
  });
});
