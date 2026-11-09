import {
  EnergyFieldSchema,
  solarDamageRate,
  updateHull,
  updatePower,
} from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { buildDrain, solarCharge } from "./build-flight";
import { createStar } from "./game-loop";
import {
  buildStats,
  CHASSIS,
  defaultLoadout,
  LIFE_SUPPORT_DRAIN,
  PARTS,
  starterLoadout,
} from "./schemas/loadout";
import { gameSettings, Simulation, STEP, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
function flight(distance: number, assembled = true) {
  const sim = new Simulation(
    assembled ? gameSettings("wasp") : stockSettings("wasp"),
  );
  sim.planets.length = 0;
  sim.ship.pos.set(sim.star.pos.x + distance, sim.star.pos.y);
  sim.start();
  return sim;
}
describe("accepted standard Sun", () => {
  it("has explicit validated linear profiles at surface, shoulder and boundaries", () => {
    const star = new Simulation(gameSettings()).star;
    expect(star.type).toBe("G");
    expect(star.radius).toBe(35);
    for (const distance of [35, 45, 55]) {
      expect(solarCharge(distance, star, 1)).toBe(7.5);
      expect(solarDamageRate(distance)).toBe(1.5);
    }
    expect(solarCharge((55 + star.influenceRadius) / 2, star, 1)).toBeCloseTo(
      4.125,
    );
    expect(solarCharge(star.influenceRadius, star, 1)).toBeCloseTo(0.75);
    expect(solarCharge(star.influenceRadius + 0.001, star, 1)).toBe(0);
    expect(solarDamageRate(77.5)).toBeCloseTo(0.75);
    expect(solarDamageRate(100)).toBe(0);
    expect(solarDamageRate(101)).toBe(0);
    expect(
      EnergyFieldSchema.safeParse({
        reach: 55,
        shoulder: 55,
        peak: 7.5,
        outerFraction: 0.1,
      }).success,
    ).toBe(false);
  });
  it("gives every empty, default and starter assembly one collector plus fitted collectors", () => {
    const star = createStar("G", 0, 0);
    for (const id of Object.keys(CHASSIS) as (keyof typeof CHASSIS)[]) {
      for (const build of [defaultLoadout(id), starterLoadout(id)]) {
        build.hull = build.hull.map(() => null);
        expect(buildStats(build).coils).toBe(1);
        expect(solarCharge(55, star, buildStats(build).coils)).toBe(7.5);
        build.hull[0] = "coil";
        expect(buildStats(build).coils).toBe(2);
        expect(solarCharge(55, star, buildStats(build).coils)).toBe(15);
      }
      const resources = { power: 50, hull: 100 };
      const stock = new Simulation(stockSettings(id));
      updatePower(
        resources,
        55,
        stock.star,
        1,
        { left: false, right: false },
        stock.settings.profile.powerDrainMultiplier,
      );
      expect(resources.power).toBeCloseTo(50 + 7.5 - 0.8);
    }
  });
  it("uses the accepted Wasp draw without changing other engine family draws", () => {
    expect(LIFE_SUPPORT_DRAIN).toBe(0.8);
    expect(PARTS["heavy-ion"].draw).toBe(2 * PARTS.ion.draw);
    const wasp = defaultLoadout("wasp");
    expect(buildDrain(wasp, idle)).toBe(LIFE_SUPPORT_DRAIN);
    expect(buildDrain(wasp, both)).toBe(LIFE_SUPPORT_DRAIN + PARTS.ion.draw);
  });
  it("keeps actual capacities, collection at capacity and net-draining collection", () => {
    for (const assembled of [true, false]) {
      const full = flight(120, assembled);
      const capacity = full.state.resources.power;
      full.step(idle);
      expect(full.state.resources.power).toBeLessThanOrEqual(capacity);
      expect(full.solarCollectionRate).toBeGreaterThan(0);
      const drain = flight(320, assembled);
      drain.state.resources.power = 10;
      drain.step(both);
      expect(drain.solarCollectionRate).toBeGreaterThan(0);
      expect(drain.state.resources.power).toBeLessThan(10);
      expect(drain.solarDamageRate).toBe(0);
    }
  });
  it("depletes without negative storage, and retains lethal contact", () => {
    for (const assembled of [true, false]) {
      const empty = flight(500, assembled);
      empty.state.resources.power = 0.001;
      empty.step(both);
      expect(empty.state.resources.power).toBe(0);
      expect(empty.state.deathCause).toBe("POWER");
      const contact = flight(34, assembled);
      contact.step(idle);
      expect(contact.state.deathCause).toBe("STAR");
    }
  });
  it("applies exact exposure with clamps and publishes real damage state", () => {
    const star = createStar("G", 0, 0),
      resources = { power: 50, hull: 100 };
    updateHull(resources, 55, star, 1);
    expect(resources.hull).toBe(98.5);
    updateHull(resources, 100, star, 1);
    expect(resources.hull).toBe(98.5);
    updateHull(resources, 34, star, 1);
    expect(resources.hull).toBe(0);
    const sim = flight(80);
    const before = sim.state.resources.hull;
    sim.step(idle);
    expect(sim.solarDamageRate).toBeGreaterThan(0);
    expect(sim.solarDamageRate * STEP).toBeCloseTo(
      before - sim.state.resources.hull,
    );
    expect(sim.solarCollectionRate).toBeGreaterThan(0);
  });
});
