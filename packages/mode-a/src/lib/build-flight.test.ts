import { SURVIVAL_CONFIG, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain, engineImpulse } from "./build-flight";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
import { Simulation, stockSettings } from "./simulation";
import { lhiStabilizers } from "./stabilizers";
import { GRAVITY_TUNING } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

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
    expect(buildStats(heavy).mass).toBeGreaterThan(buildStats(light).mass);
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
    expect(b.vel.x).toBeLessThan(1100);
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
    applyYellowFamilyProfile(sim.star, 70, GRAVITY_TUNING);
    sim.planets.length = 0;
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
    const legacy = LoadoutSchema.parse({
      ...build,
      side: "plasma",
      stabilizers: undefined,
    });
    expect(legacy.stabilizers).toBe(true);
    expect(legacy.side).toBe("plasma");
    expect(
      LoadoutSchema.parse({ ...build, stabilizers: false }).stabilizers,
    ).toBe(Boolean(lhiStabilizers(chassis)));
  }
  const build = defaultLoadout("fighter");
  expect(
    LoadoutSchema.safeParse({ ...build, stabilizers: "yes" }).success,
  ).toBe(false);
  expect(
    LoadoutSchema.safeParse({ ...build, linkedEngines: "yes" }).success,
  ).toBe(false);
});

it("linked engines fire every aft engine on one input at the draw of both inputs unlinked", () => {
  const build = defaultLoadout("fighter");
  build.stabilizers = false;
  build.aft = ["ion", "ion"];
  const left = { ...idle, leftThruster: true };
  const aftDrain = (linkedEngines: boolean, input: typeof idle) => {
    const fitted = { ...build, linkedEngines };
    return (
      buildDrain(fitted, input) -
      buildDrain({ ...fitted, aft: [null, null] }, input)
    );
  };
  const fire = (linkedEngines: boolean, input: typeof idle, powered = true) =>
    applyBuildEngines(
      ship(),
      { ...build, linkedEngines },
      input,
      1 / 60,
      powered,
    ).aft;
  expect(fire(false, left)).toEqual([0, 0]);
  expect(aftDrain(false, left)).toBeCloseTo(0);
  expect(fire(true, left).every((v) => v > 0)).toBe(true);
  expect(aftDrain(true, left)).toBeGreaterThan(0);
  expect(aftDrain(true, left)).toBeCloseTo(aftDrain(false, both));
  expect(fire(true, idle)).toEqual([0, 0]);
  expect(fire(true, left, false)).toEqual([0, 0]);
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
