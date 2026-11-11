import {
  EnergyFieldSchema,
  STANDARD_SUN,
  type Star,
  SURVIVAL_CONFIG,
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
function flight(distance: (star: Star) => number, assembled = true) {
  const sim = new Simulation(
    assembled ? gameSettings("wasp") : stockSettings("wasp"),
  );
  sim.planets.length = 0;
  sim.ship.pos.set(sim.star.pos.x + distance(sim.star), sim.star.pos.y);
  sim.start();
  return sim;
}
const { shoulder, damageReach, collectionPeak, damagePeak } = STANDARD_SUN;
describe("accepted standard Sun", () => {
  it("has explicit validated linear profiles at surface, shoulder and boundaries", () => {
    const star = new Simulation(gameSettings()).star;
    expect(star.type).toBe("G");
    expect(star.radius).toBeLessThan(shoulder);
    for (const distance of [
      star.radius,
      (star.radius + shoulder) / 2,
      shoulder,
    ]) {
      expect(solarCharge(distance, star, 1)).toBe(collectionPeak);
      expect(solarDamageRate(distance)).toBe(damagePeak);
    }
    const edge = collectionPeak * STANDARD_SUN.outerFraction;
    expect(solarCharge(star.influenceRadius, star, 1)).toBeCloseTo(edge);
    expect(
      solarCharge((shoulder + star.influenceRadius) / 2, star, 1),
    ).toBeCloseTo((collectionPeak + edge) / 2);
    expect(solarCharge(star.influenceRadius + 0.001, star, 1)).toBe(0);
    expect(solarDamageRate((shoulder + damageReach) / 2)).toBeCloseTo(
      damagePeak / 2,
    );
    expect(solarDamageRate(damageReach)).toBe(0);
    expect(solarDamageRate(damageReach + 1)).toBe(0);
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
        expect(solarCharge(shoulder, star, buildStats(build).coils)).toBe(
          collectionPeak,
        );
        build.hull[0] = "coil";
        expect(buildStats(build).coils).toBe(2);
        expect(solarCharge(shoulder, star, buildStats(build).coils)).toBe(
          2 * collectionPeak,
        );
      }
      const resources = { power: 50, hull: 100 };
      const stock = new Simulation(stockSettings(id));
      updatePower(
        resources,
        shoulder,
        stock.star,
        1,
        { left: false, right: false },
        stock.settings.profile.powerDrainMultiplier,
      );
      // Legacy stock flight collects as one collector-equivalent.
      expect(resources.power).toBeCloseTo(
        50 + collectionPeak - SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE,
      );
    }
  });
  it("drains life support at idle and adds the light ion draw when the Wasp burns", () => {
    const wasp = defaultLoadout("wasp");
    expect(buildDrain(wasp, idle)).toBe(LIFE_SUPPORT_DRAIN);
    expect(buildDrain(wasp, both)).toBe(LIFE_SUPPORT_DRAIN + PARTS.ion.draw);
  });
  it("keeps actual capacities, collection at capacity and net-draining collection", () => {
    for (const assembled of [true, false]) {
      const full = flight(
        (star) => (damageReach + star.influenceRadius) / 2,
        assembled,
      );
      const capacity = full.state.resources.power;
      full.step(idle);
      expect(full.state.resources.power).toBeLessThanOrEqual(capacity);
      expect(full.solarCollectionRate).toBeGreaterThan(0);
      // The outer edge collects less than a burning ship draws.
      const drain = flight((star) => star.influenceRadius - 1, assembled);
      drain.state.resources.power = 10;
      drain.step(both);
      expect(drain.solarCollectionRate).toBeGreaterThan(0);
      expect(drain.state.resources.power).toBeLessThan(10);
      expect(drain.solarDamageRate).toBe(0);
    }
  });
  it("depletes without negative storage, and retains lethal contact", () => {
    for (const assembled of [true, false]) {
      const empty = flight((star) => star.influenceRadius + 100, assembled);
      empty.state.resources.power = 0.001;
      empty.step(both);
      expect(empty.state.resources.power).toBe(0);
      expect(empty.state.deathCause).toBe("POWER");
      const contact = flight((star) => star.radius - 1, assembled);
      contact.step(idle);
      expect(contact.state.deathCause).toBe("STAR");
    }
  });
  it("applies exact exposure with clamps and publishes real damage state", () => {
    const star = createStar("G", 0, 0),
      resources = { power: 50, hull: 100 };
    updateHull(resources, shoulder, star, 1);
    expect(resources.hull).toBe(100 - damagePeak);
    updateHull(resources, damageReach, star, 1);
    expect(resources.hull).toBe(100 - damagePeak);
    updateHull(resources, star.radius - 1, star, 1);
    expect(resources.hull).toBe(0);
    const sim = flight(() => (shoulder + damageReach) / 2);
    const before = sim.state.resources.hull;
    sim.step(idle);
    expect(sim.solarDamageRate).toBeGreaterThan(0);
    expect(sim.solarDamageRate * STEP).toBeCloseTo(
      before - sim.state.resources.hull,
    );
    expect(sim.solarCollectionRate).toBeGreaterThan(0);
  });
});
