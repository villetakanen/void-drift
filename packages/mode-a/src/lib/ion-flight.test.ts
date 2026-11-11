import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import { ION_DEFAULTS } from "./schemas/ion";
import { defaultLoadout } from "./schemas/loadout";
import { labSettings, Simulation, STEP } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const left = { ...idle, leftThruster: true };
const body = () => ({
  pos: new Vec2(0, 0),
  vel: new Vec2(0, 0),
  acc: new Vec2(0, 0),
  rotation: 0,
  radius: 1,
});

describe("stabilizers", () => {
  it("brake spin to rest without reversing it", () => {
    const build = { ...defaultLoadout("fighter"), stabilizers: true };
    const ship = body(),
      spin = { velocity: 0 };
    for (let i = 0; i < 30; i++)
      applyBuildEngines(ship, build, left, STEP / 4, true, {}, 1, spin);
    expect(spin.velocity).toBeGreaterThan(0);
    let minimumSpin = spin.velocity;
    for (let i = 0; i < 20000; i++) {
      applyBuildEngines(ship, build, idle, STEP / 4, true, {}, 1, spin);
      minimumSpin = Math.min(minimumSpin, spin.velocity);
    }
    expect(minimumSpin).toBeGreaterThanOrEqual(0);
    expect(spin.velocity).toBe(0);
  });

  it("draw energy in proportion to use, and none without energy", () => {
    const build = { ...defaultLoadout("fighter"), stabilizers: true };
    expect(buildDrain(build, idle, 1)).toBeGreaterThan(
      buildDrain(build, idle, 0),
    );
    const off = { ...build, stabilizers: false };
    expect(buildDrain(off, idle, 1)).toBe(buildDrain(off, idle, 0));
    const sim = new Simulation({
      ...labSettings(),
      loadout: build,
      mode: "survival",
    });
    sim.ship.pos.set(1900, 540);
    sim.start();
    sim.angularMotion.velocity = 1;
    const before = sim.state.resources.power;
    sim.step(idle);
    expect(before - sim.state.resources.power).toBeCloseTo(
      buildDrain(build, idle, 1) * STEP,
      10,
    );
    sim.state.resources.power = 0;
    const spin = sim.angularMotion.velocity;
    sim.step(idle);
    expect(sim.angularMotion.velocity).toBe(spin);
    expect(sim.engineOutput.stabilizers).toEqual([0, 0]);
  });

  it("never spin a ship past the turn limit under held input", () => {
    const settings = labSettings();
    if (settings.loadout) settings.loadout.stabilizers = true;
    settings.mode = "practice";
    const sim = new Simulation(settings);
    sim.start();
    let peak = 0;
    for (let i = 0; i < 600; i++) {
      sim.step(left);
      peak = Math.max(peak, Math.abs(sim.angularMotion.velocity));
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual((ION_DEFAULTS.maxTurn * Math.PI) / 180);
  });
});
