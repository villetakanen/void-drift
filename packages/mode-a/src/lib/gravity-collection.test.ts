import { getPlanetInfluenceRadius } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { buildDrain } from "./build-flight";
import { GRAVITY_COLLECTION, gravitySource } from "./gravity-collection";
import { buildStats, starterLoadout } from "./schemas/loadout";
import { Simulation, STEP, stockSettings } from "./simulation";

function loadoutOf(sim: Simulation) {
  if (!sim.settings.loadout) throw new Error("Fixture needs a fitted ship");
  return sim.settings.loadout;
}
const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
const fadeTicks = Math.ceil(GRAVITY_COLLECTION.fadeSeconds / STEP) + 1;
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
  for (const input of [idle, both])
    for (const count of [1, 2]) {
      it(`collects from ${count} coils with ${input.leftThruster ? "thrust" : "coasting"}`, () => {
        const sim = fixture(count);
        const build = loadoutOf(sim);
        sim.step(input);
        expect(sim.gravityCollectionRate).toBeCloseTo(
          count * GRAVITY_COLLECTION.energyPerSecond,
        );
        expect(sim.state.resources.power).toBeCloseTo(
          50 -
            (buildDrain(build, input) -
              count * GRAVITY_COLLECTION.energyPerSecond) *
              STEP,
        );
      });
    }
  it("does not collect outside a well or without coils; boundary is excluded", () => {
    const sim = fixture();
    const reach = getPlanetInfluenceRadius(sim.planets[0]);
    // At the reach (a hair outside, past rounding) the ship is out of the well.
    sim.ship.pos.set(1500 + reach + 1e-9, 540);
    expect(gravitySource(sim.ship, sim.planets)).toBeUndefined();
    sim.ship.pos.set(1500 + reach + 100, 540);
    sim.step(idle);
    expect(sim.gravityCollectionRate).toBe(0);
    const empty = fixture(0);
    empty.step(idle);
    expect(empty.gravityCollectionRate).toBe(0);
  });
  it("does not multiply energy when wells overlap", () => {
    const sim = fixture(2);
    const original = sim.planets[0];
    sim.planets.push({ ...original });
    sim.step(idle);
    expect(sim.gravityCollectionRate).toBeCloseTo(
      2 * GRAVITY_COLLECTION.energyPerSecond,
    );
  });
  it("caps storage and fades out when solar supply fills it", () => {
    const sim = fixture(2);
    for (let i = 0; i < fadeTicks; i++) sim.step(idle);
    expect(sim.gravityFoldOpacity).toBeCloseTo(1);
    // Supply already satisfies capacity: gravity must not claim collection.
    sim.star.pos.set(1620, 640);
    sim.star.powerMultiplier = 100;
    sim.state.resources.power = buildStats(loadoutOf(sim)).capacity;
    for (let i = 0; i < fadeTicks; i++) sim.step(idle);
    expect(sim.state.resources.power).toBe(buildStats(loadoutOf(sim)).capacity);
    expect(sim.gravityCollectionRate).toBe(0);
    expect(sim.gravityFoldOpacity).toBeCloseTo(0);
  });
  it("fades on leaving the field and keeps the last field direction", () => {
    const sim = fixture();
    for (let i = 0; i < fadeTicks; i++) sim.step(idle);
    const direction = sim.gravityFoldDirection;
    sim.planets.length = 0;
    sim.step(idle);
    expect(sim.gravityCollectionRate).toBe(0);
    expect(sim.gravityFoldOpacity).toBeGreaterThan(0);
    expect(sim.gravityFoldDirection).toBe(direction);
    for (let i = 0; i < fadeTicks; i++) sim.step(idle);
    expect(sim.gravityFoldOpacity).toBeCloseTo(0);
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
    expect(a.ship.rotation).toBe(b.ship.rotation);
    expect(a.state.resources.power - b.state.resources.power).toBeCloseTo(
      20 * STEP * GRAVITY_COLLECTION.energyPerSecond,
    );
  });
  it("nets collection against idle consumption before deciding survival", () => {
    const sim = fixture(2);
    sim.state.resources.power = 0.001;
    const expectedPower = Math.max(
      0,
      0.001 +
        (2 * GRAVITY_COLLECTION.energyPerSecond -
          buildDrain(loadoutOf(sim), idle)) *
          STEP,
    );
    sim.step(idle);
    expect(sim.state.resources.power).toBeCloseTo(expectedPower);
    expect(sim.state.status).toBe(expectedPower > 0 ? "PLAYING" : "GAME_OVER");
    if (expectedPower === 0) expect(sim.state.deathCause).toBe("POWER");
  });

  it("replays collection deterministically and never advances while stopped", () => {
    const a = fixture(2);
    const b = fixture(2);
    const replay = [
      { ...both, ticks: 20 },
      { ...idle, ticks: 10 },
    ];
    a.replay(replay);
    b.replay(replay);
    expect(a.state).toEqual(b.state);
    expect(a.gravityFoldOpacity).toBe(b.gravityFoldOpacity);
    a.state.status = "GAME_OVER";
    const power = a.state.resources.power;
    a.step(idle);
    expect(a.state.resources.power).toBe(power);
  });
});
