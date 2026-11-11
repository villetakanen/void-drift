import { SURVIVAL_CONFIG, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain, engineImpulse } from "./build-flight";
import {
  buildStats,
  defaultLoadout,
  LoadoutSchema,
  PARTS,
} from "./schemas/loadout";
import { Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
function ship() {
  return {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
}
function simulation(testFlight = false) {
  const loadout = defaultLoadout("fighter");
  loadout.hull[0] = "battery";
  const sim = new Simulation({
    ...stockSettings(),
    loadout,
    mode: testFlight ? "practice" : "survival",
  });
  sim.ship.pos.set(1900, 540);
  sim.start();
  return sim;
}
describe("ship builder contract", () => {
  it("validates fixed mounts and mandatory identical side engines", () => {
    const build = defaultLoadout("scout");
    expect(LoadoutSchema.safeParse({ ...build, hull: ["ion"] }).success).toBe(
      false,
    );
    expect(
      LoadoutSchema.safeParse({ ...build, aft: [null, null] }).success,
    ).toBe(false);
    expect(LoadoutSchema.safeParse({ ...build, side: null }).success).toBe(
      false,
    );
  });
  it("counts fitted mass, and more mass reduces acceleration and turning", () => {
    const light = defaultLoadout("fighter"),
      heavy = defaultLoadout("fighter");
    heavy.hull[0] = "battery";
    expect(buildStats(heavy).mass).toBe(
      buildStats(light).mass + PARTS.battery.mass,
    );
    expect(buildStats(heavy).acceleration).toBeLessThan(
      buildStats(light).acceleration,
    );
    expect(Math.abs(buildStats(heavy).turnRate)).toBeLessThan(
      Math.abs(buildStats(light).turnRate),
    );
  });
  it("Hangar estimates match the acceleration and turn rate flown", () => {
    const build = defaultLoadout("fighter");
    // Isolate main engines from optional stabilizer assist.
    build.stabilizers = false;
    build.aft.fill("ion");
    const stats = buildStats(build);
    const forward = ship();
    applyBuildEngines(forward, build, both, 1 / 60, true);
    expect(forward.vel.x * 60).toBeCloseTo(stats.acceleration);
    const turning = ship();
    applyBuildEngines(
      turning,
      build,
      { ...idle, leftThruster: true },
      1 / 60,
      true,
    );
    expect(turning.rotation * 60 * 60).toBeCloseTo(stats.turnRate);
  });
  it("preserves slingshot overspeed while steering and permits full braking", () => {
    const a = ship();
    a.vel.set(1100, 0);
    engineImpulse(a, Math.PI / 2, 200, 350, 1 / 60);
    expect(a.vel.mag()).toBeCloseTo(1100, 8);
    expect(a.vel.y).toBeGreaterThan(0);
    engineImpulse(a, 0, 200, 350, 1 / 60);
    expect(a.vel.mag()).toBeLessThanOrEqual(1100.000001);
    const b = ship();
    b.vel.set(1100, 0);
    engineImpulse(b, Math.PI, 200, 350, 1 / 60);
    expect(b.vel.x).toBeCloseTo(1100 - 200 / 60);
  });
  it("mixed engines and repeated sideways thrust cannot exceed the shared powered ceiling", () => {
    const build = defaultLoadout("fighter");
    build.aft = ["ion", "fusion"];
    const a = ship();
    for (let i = 0; i < 30000; i++) {
      a.rotation = Math.atan2(a.vel.y, a.vel.x) + Math.PI / 3;
      applyBuildEngines(a, build, both, 1 / 60, true);
    }
    expect(a.vel.mag()).toBeLessThanOrEqual(
      buildStats(build).poweredCruiseCeiling + 1e-6,
    );
  });
  it("ends survival at empty energy but keeps empty, damaged practice flying", () => {
    const a = simulation();
    a.state.resources.power = 0.01;
    a.step(idle);
    expect(a.state.deathCause).toBe("POWER");
    const b = simulation(true);
    b.state.resources.power = 0;
    b.state.resources.hull = 0;
    b.step(both);
    expect(b.state.status).toBe("PLAYING");
    expect(b.engineOutput.left).toBeGreaterThan(0);
    expect(b.state.resources.hull).toBe(SURVIVAL_CONFIG.INITIAL_HULL);
    const loadout = b.settings.loadout;
    if (!loadout) throw new Error("Practice flies an assembled ship");
    expect(b.state.resources.power).toBe(buildStats(loadout).capacity);
  });
  it("uses incoming charge with held controls and cannot thrust on unavailable energy", () => {
    const sim = simulation();
    sim.ship.pos.set(sim.star.pos.x + 280, sim.star.pos.y);
    sim.state.resources.power = 0;
    sim.step(both);
    expect(sim.engineOutput.left).toBeGreaterThan(0);
    expect(sim.state.resources.power).toBe(0);
    sim.ship.pos.set(1900, 540);
    sim.state.resources.power = 0;
    sim.state.status = "PLAYING";
    sim.step(both);
    expect(sim.engineOutput.left).toBe(0);
  });
});

it("defaults missing stabilizers without replacing engines and keeps built-in stabilizers on", () => {
  for (const chassis of ["wasp", "fighter"] as const) {
    const build = defaultLoadout(chassis);
    expect(build.stabilizers).toBe(true);
    expect(build.linkedEngines).toBe(false);
    const legacy = LoadoutSchema.parse({
      ...build,
      side: "plasma",
      stabilizers: undefined,
    });
    expect(legacy.stabilizers).toBe(true);
    expect(legacy.side).toBe("plasma");
    expect(
      LoadoutSchema.parse({ ...build, stabilizers: false }).stabilizers,
    ).toBe(chassis === "wasp");
  }
  const build = defaultLoadout("fighter");
  expect(
    LoadoutSchema.safeParse({ ...build, stabilizers: "yes" }).success,
  ).toBe(false);
  expect(
    LoadoutSchema.safeParse({ ...build, linkedEngines: "yes" }).success,
  ).toBe(false);
});

it("links every aft engine to either input with matching drain and power gating", () => {
  const build = defaultLoadout("fighter");
  build.stabilizers = false;
  build.aft = ["ion", "ion"];
  for (const linkedEngines of [false, true]) {
    build.linkedEngines = linkedEngines;
    for (const input of [
      idle,
      { ...idle, leftThruster: true },
      { ...idle, rightThruster: true },
      both,
    ]) {
      const active = linkedEngines
        ? input.leftThruster || input.rightThruster
        : input.leftThruster && input.rightThruster;
      const out = applyBuildEngines(ship(), build, input, 1 / 60, true);
      expect(out.aft.every((v) => v > 0)).toBe(active);
      const withoutAft = { ...build, aft: [null, null] };
      expect(
        buildDrain(build, input) - buildDrain(withoutAft, input),
      ).toBeCloseTo(active ? 2 * PARTS.ion.draw : 0);
      expect(
        applyBuildEngines(ship(), build, input, 1 / 60, false).aft,
      ).toEqual([0, 0]);
    }
  }
});

it("starts practice in the same system regardless of seed or arrival", () => {
  const a = new Simulation({
    ...stockSettings(),
    mode: "practice",
    seed: 1,
    arrival: true,
  });
  const b = new Simulation({ ...stockSettings(), mode: "practice", seed: 999 });
  expect(a.ship).toEqual(b.ship);
  expect(a.star).toEqual(b.star);
  expect(a.planets).toEqual(b.planets);
  expect(a.salvage).toBeUndefined();
});

it("keeps practice healthy and in normal motion through star contact", () => {
  const sim = simulation(true);
  sim.ship.pos.set(sim.star.pos.x + 1, sim.star.pos.y);
  sim.ship.vel.set(0, 100);
  const before = { x: sim.ship.pos.x, y: sim.ship.pos.y };
  for (let i = 0; i < 30; i++) sim.step(both);
  expect(sim.state.status).toBe("PLAYING");
  expect(sim.state.resources.hull).toBe(SURVIVAL_CONFIG.INITIAL_HULL);
  expect(
    Math.hypot(sim.ship.pos.x - before.x, sim.ship.pos.y - before.y),
  ).toBeLessThan(1200);
});
