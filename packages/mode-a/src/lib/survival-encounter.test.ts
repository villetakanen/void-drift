import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, SURVIVAL_ENCOUNTER } from "./schemas/salvage";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const TOLERANCE = 1e-3;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function scene(seed = 2026, config = SURVIVAL_ENCOUNTER) {
  const system = new SalvageSystem(
    defaultLoadout("wasp"),
    seed,
    undefined,
    config,
  );
  const ship = {
    pos: new Vec2(-10000, -10000),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const star = createStar("G", 960, 540);
  star.radius = 0;
  const resources = { hull: 100, power: 100 };
  const advance = (dt: number) =>
    system.step(dt, ship, star, resources, 100, ship.pos.x, ship.pos.y, false);
  // Runs to the next scheduled arrival and returns its deadline and the wreck.
  const arrival = () => {
    const deadline = system.nextPass;
    system.bodies = [];
    advance(deadline - system.time - 0.00001);
    advance(0.00001);
    return { deadline, wreck: system.bodies[0] as SalvageBody };
  };
  return { system, ship, advance, arrival };
}
function arrivals(count: number, seed?: number) {
  const s = scene(seed);
  return Array.from({ length: count }, () => s.arrival());
}
/** Entry state: heading of travel and its offset from the inward radial. */
function entry(wreck: SalvageBody) {
  const heading = Math.atan2(wreck.vy, wreck.vx);
  const inward = Math.atan2(
    SURVIVAL_ENCOUNTER.centerY - wreck.y,
    SURVIVAL_ENCOUNTER.centerX - wreck.x,
  );
  return { heading, offset: wrapAngle(heading - inward) };
}

describe("survival encounter", () => {
  const runs = arrivals(200);
  const band = SURVIVAL_ENCOUNTER.entryAngle;

  it("schedules the first arrival at three seconds and then every five to ten", () => {
    const deadlines = runs.map((run) => run.deadline);
    expect(deadlines[0]).toBe(SURVIVAL_ENCOUNTER.firstPass);
    expect(SURVIVAL_ENCOUNTER.firstPass).toBe(3);
    const gaps = deadlines.slice(1).map((time, i) => time - deadlines[i]);
    for (const gap of gaps) {
      expect(gap).toBeGreaterThanOrEqual(5 - 1e-9);
      expect(gap).toBeLessThanOrEqual(10 + 1e-9);
    }
    expect(Math.min(...gaps)).toBeLessThan(5.5);
    expect(Math.max(...gaps)).toBeGreaterThan(9.5);
  });
  it("enters at 50 to 150 u/s", () => {
    const speeds = runs.map((run) => Math.hypot(run.wreck.vx, run.wreck.vy));
    expect(Math.min(...speeds)).toBeGreaterThanOrEqual(50 - 0.01);
    expect(Math.max(...speeds)).toBeLessThanOrEqual(150 + 0.01);
    expect(Math.min(...speeds)).toBeLessThan(60);
    expect(Math.max(...speeds)).toBeGreaterThan(140);
  });
  it("enters 40 to 50 degrees off the inward radial, to either side", () => {
    if (!band) throw new Error("Survival needs an entry-angle band");
    const offsets = runs.map((run) => entry(run.wreck).offset);
    for (const offset of offsets) {
      expect(Math.abs(offset)).toBeGreaterThanOrEqual(
        toRadians(40) - TOLERANCE,
      );
      expect(Math.abs(offset)).toBeLessThanOrEqual(toRadians(50) + TOLERANCE);
    }
    expect(offsets.some((offset) => offset > 0)).toBe(true);
    expect(offsets.some((offset) => offset < 0)).toBe(true);
    expect(Math.min(...offsets.map(Math.abs))).toBeLessThan(toRadians(42));
    expect(Math.max(...offsets.map(Math.abs))).toBeGreaterThan(toRadians(48));
  });
  it("enters narrow tip first: the art's forward tip faces the velocity", () => {
    for (const { wreck } of runs) {
      // The wreck art's tip is local up (-y), at rotation - 90 degrees.
      const tip = wreck.rotation - Math.PI / 2;
      expect(Math.abs(wrapAngle(tip - entry(wreck).heading))).toBeLessThan(
        TOLERANCE,
      );
    }
  });
  it("spins at one degree per second, left or right per derelict", () => {
    const signs = new Set<number>();
    for (const { wreck } of runs) {
      expect(Math.abs(wreck.spin ?? 0)).toBeCloseTo(toRadians(1), 12);
      signs.add(Math.sign(wreck.spin ?? 0));
    }
    expect(signs).toEqual(new Set([-1, 1]));
  });
  it("turns a wreck by its own spin as it flies", () => {
    const s = scene();
    for (let i = 0; i < 6; i++) {
      const { wreck } = s.arrival();
      const before = wreck.rotation;
      s.advance(2);
      expect(wreck.rotation - before).toBeCloseTo((wreck.spin ?? 0) * 2, 9);
    }
  });
  it("is deterministic for a seed and varies across seeds", () => {
    const shape = (list: ReturnType<typeof arrivals>) =>
      list.map(({ deadline, wreck }) => [
        deadline,
        wreck.x,
        wreck.y,
        wreck.vx,
        wreck.vy,
        wreck.rotation,
        wreck.spin,
      ]);
    expect(shape(arrivals(20, 7))).toEqual(shape(arrivals(20, 7)));
    expect(shape(arrivals(20, 7))).not.toEqual(shape(arrivals(20, 8)));
  });
  it("does not depend on where the player is or how it moves", () => {
    const a = scene(),
      b = scene();
    b.ship.pos.set(5000, 4000);
    b.ship.vel.set(900, -800);
    b.ship.rotation = 2.4;
    for (let i = 0; i < 40; i++) {
      const first = a.arrival(),
        second = b.arrival();
      expect(second.deadline).toBe(first.deadline);
      expect(second.wreck).toEqual(first.wreck);
    }
  });
  it("takes no ninth group and skips that arrival", () => {
    const s = scene();
    const occupied = (count: number): SalvageBody[] =>
      Array.from({ length: count }, (_, i) => ({
        id: 100 + i,
        group: 100 + i,
        kind: "cell",
        x: 100,
        y: 100,
        previousX: 100,
        previousY: 100,
        vx: 0,
        vy: 0,
        radius: 6,
        hull: 1,
        life: 100000,
        rotation: 0,
      }));
    s.system.bodies = occupied(SURVIVAL_ENCOUNTER.groups - 1);
    const deadline = s.system.nextPass;
    s.advance(deadline - s.system.time + 0.00001);
    expect(s.system.groups).toBe(SURVIVAL_ENCOUNTER.groups);
    s.system.bodies.push(...occupied(1).map((c) => ({ ...c, group: 999 })));
    const passes = s.system.passes;
    const next = s.system.nextPass;
    s.advance(next - s.system.time + 0.00001);
    expect(s.system.passes).toBe(passes);
    expect(s.system.groups).toBe(SURVIVAL_ENCOUNTER.groups);
    expect(SURVIVAL_ENCOUNTER.groups).toBe(8);
  });
});

describe("encounter configs", () => {
  it("keeps Derelicts mode on its own, separate rules", () => {
    expect(ENCOUNTER).not.toBe(SURVIVAL_ENCOUNTER);
    expect(ENCOUNTER.headingSpread).toBeDefined();
    expect(ENCOUNTER.entryAngle).toBeUndefined();
    expect(ENCOUNTER.groups).toBeGreaterThan(SURVIVAL_ENCOUNTER.groups);
    expect(ENCOUNTER.speedMax).toBeGreaterThan(SURVIVAL_ENCOUNTER.speedMax);
    expect(ENCOUNTER.wreckSpin).not.toEqual(SURVIVAL_ENCOUNTER.wreckSpin);
    // Derelicts mode's own values drive its system, not survival's.
    const s = scene(2026, ENCOUNTER);
    expect(s.system.nextPass).toBe(ENCOUNTER.firstPass);
    const speeds = Array.from({ length: 50 }, () => {
      const { wreck } = s.arrival();
      return Math.hypot(wreck.vx, wreck.vy);
    });
    expect(Math.max(...speeds)).toBeGreaterThan(SURVIVAL_ENCOUNTER.speedMax);
  });
  it("gives a default system the Derelicts mode config", () => {
    const run = (config?: typeof ENCOUNTER) => {
      const system = new SalvageSystem(
        defaultLoadout("wasp"),
        2026,
        undefined,
        config,
      );
      const star = createStar("G", 960, 540);
      star.radius = 0;
      const ship = {
        pos: new Vec2(-10000, -10000),
        vel: new Vec2(0, 0),
        acc: new Vec2(0, 0),
        rotation: 0,
        radius: 1,
      };
      for (let i = 0; i < 6; i++)
        system.step(
          system.nextPass - system.time + 0.00001,
          ship,
          star,
          { hull: 100, power: 100 },
          100,
          ship.pos.x,
          ship.pos.y,
          false,
        );
      return system.bodies.map((b) => [b.x, b.y, b.vx, b.vy, b.rotation]);
    };
    expect(run()).toEqual(run(ENCOUNTER));
  });
  it("runs each mode on its own config", () => {
    const flight = (mode: "survival" | "derelicts" | "practice") =>
      new Simulation({ ...gameSettings("wasp"), mode });
    expect(flight("survival").salvage?.nextPass).toBe(
      SURVIVAL_ENCOUNTER.firstPass,
    );
    expect(flight("derelicts").salvage?.nextPass).toBe(ENCOUNTER.firstPass);
    expect(flight("practice").salvage).toBeUndefined();
    expect(
      new Simulation({ ...stockSettings("wasp"), mode: "survival" }).salvage,
    ).toBeUndefined();
    for (const mode of ["survival", "derelicts"] as const)
      expect(
        new Simulation({ ...gameSettings("wasp"), mode, encounters: false })
          .salvage,
      ).toBeUndefined();
  });
  it("turns a Derelicts mode wreck at the shared default rate, one way", () => {
    const s = scene(2026, ENCOUNTER);
    const { wreck } = s.arrival();
    const before = wreck.rotation;
    s.advance(1);
    expect(wreck.rotation - before).toBeCloseTo(ENCOUNTER.wreckSpin.rate, 9);
  });
});
