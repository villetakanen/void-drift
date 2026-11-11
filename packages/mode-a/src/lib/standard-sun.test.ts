import { STANDARD_SUN, type Star } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { solarCharge } from "./build-flight";
import { createStar } from "./game-loop";
import {
  buildStats,
  CHASSIS,
  defaultLoadout,
  starterLoadout,
} from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
function flight(distance: (star: Star) => number) {
  const sim = new Simulation(gameSettings("wasp"));
  sim.planets.length = 0;
  sim.ship.pos.set(sim.star.pos.x + distance(sim.star), sim.star.pos.y);
  sim.start();
  return sim;
}
const { shoulder, damageReach } = STANDARD_SUN;
describe("accepted standard Sun", () => {
  it("gives every chassis one built-in collector, and fitted collectors add to it", () => {
    const star = createStar("G", 0, 0);
    for (const id of Object.keys(CHASSIS) as (keyof typeof CHASSIS)[]) {
      for (const build of [defaultLoadout(id), starterLoadout(id)]) {
        build.hull = build.hull.map(() => null);
        const base = solarCharge(shoulder, star, buildStats(build).coils);
        expect(buildStats(build).coils).toBe(1);
        build.hull[0] = "coil";
        expect(solarCharge(shoulder, star, buildStats(build).coils)).toBe(
          2 * base,
        );
      }
    }
  });
  it("never collects above capacity", () => {
    const full = flight((star) => (damageReach + star.influenceRadius) / 2);
    const capacity = full.state.resources.power;
    full.step(idle);
    expect(full.solarCollectionRate).toBeGreaterThan(0);
    expect(full.state.resources.power).toBeLessThanOrEqual(capacity);
  });
  it("depletes to zero, never below, and ends the run", () => {
    const empty = flight((star) => star.influenceRadius + 100);
    empty.state.resources.power = 0.001;
    empty.step(both);
    expect(empty.state.resources.power).toBe(0);
    expect(empty.state.deathCause).toBe("POWER");
  });
  it("publishes the damage rate it actually applies", () => {
    const sim = flight(() => (shoulder + damageReach) / 2);
    const before = sim.state.resources.hull;
    sim.step(idle);
    expect(sim.solarDamageRate).toBeGreaterThan(0);
    expect(sim.solarDamageRate * STEP).toBeCloseTo(
      before - sim.state.resources.hull,
    );
  });
});
