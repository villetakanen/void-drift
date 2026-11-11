import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, SURVIVAL_ENCOUNTER } from "./schemas/salvage";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const TOLERANCE = 1e-3;
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

  it("schedules a seeded first arrival in its window, then rare later ones", () => {
    const window = SURVIVAL_ENCOUNTER.firstPass;
    const firsts = Array.from(
      { length: 40 },
      (_, seed) => scene(seed).system.nextPass,
    );
    for (const first of firsts) {
      expect(first).toBeGreaterThanOrEqual(window.min);
      expect(first).toBeLessThanOrEqual(window.max);
    }
    expect(new Set(firsts).size).toBeGreaterThan(1);
    const deadlines = runs.map((run) => run.deadline);
    const gaps = deadlines.slice(1).map((time, i) => time - deadlines[i]);
    for (const gap of gaps) {
      expect(gap).toBeGreaterThanOrEqual(SURVIVAL_ENCOUNTER.intervalMin - 1e-9);
      expect(gap).toBeLessThanOrEqual(SURVIVAL_ENCOUNTER.intervalMax + 1e-9);
    }
    // Later derelicts come further apart than any first one comes.
    expect(Math.min(...gaps)).toBeGreaterThan(Math.max(...firsts));
  });
  it("enters across the configured speed range", () => {
    const { speedMin, speedMax } = SURVIVAL_ENCOUNTER;
    const edge = (speedMax - speedMin) / 10;
    const speeds = runs.map((run) => Math.hypot(run.wreck.vx, run.wreck.vy));
    expect(Math.min(...speeds)).toBeGreaterThanOrEqual(speedMin - 0.01);
    expect(Math.max(...speeds)).toBeLessThanOrEqual(speedMax + 0.01);
    expect(Math.min(...speeds)).toBeLessThan(speedMin + edge);
    expect(Math.max(...speeds)).toBeGreaterThan(speedMax - edge);
  });
  it("enters across the configured band off the inward radial, to either side", () => {
    if (!band) throw new Error("Survival needs an entry-angle band");
    const edge = (band.max - band.min) / 5;
    const offsets = runs.map((run) => entry(run.wreck).offset);
    for (const offset of offsets) {
      expect(Math.abs(offset)).toBeGreaterThanOrEqual(band.min - TOLERANCE);
      expect(Math.abs(offset)).toBeLessThanOrEqual(band.max + TOLERANCE);
    }
    expect(offsets.some((offset) => offset > 0)).toBe(true);
    expect(offsets.some((offset) => offset < 0)).toBe(true);
    expect(Math.min(...offsets.map(Math.abs))).toBeLessThan(band.min + edge);
    expect(Math.max(...offsets.map(Math.abs))).toBeGreaterThan(band.max - edge);
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
  it("spins at the configured rate, left or right per derelict", () => {
    const signs = new Set<number>();
    for (const { wreck } of runs) {
      expect(Math.abs(wreck.spin ?? 0)).toBeCloseTo(
        SURVIVAL_ENCOUNTER.wreckSpin.rate,
        12,
      );
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
  it("keeps one derelict in play and skips an arrival while it lasts", () => {
    const s = scene();
    s.arrival();
    expect(s.system.passes).toBe(1);
    expect(s.system.groups).toBe(1);
    // Keep the wreck in play, held still, until the next arrival is due.
    const wreck = s.system.bodies[0] as SalvageBody;
    const next = s.system.nextPass;
    while (s.system.time < next) {
      wreck.x = wreck.previousX = SURVIVAL_ENCOUNTER.centerX + 400;
      wreck.y = wreck.previousY = SURVIVAL_ENCOUNTER.centerY;
      wreck.vx = wreck.vy = 0;
      wreck.life = 100000;
      s.advance(Math.min(1, next - s.system.time + 0.00001));
    }
    expect(s.system.passes).toBe(1);
    expect(s.system.groups).toBe(1);
    expect(s.system.nextPass).toBeGreaterThan(next);
  });
});

describe("encounter configs", () => {
  it("keeps Derelicts mode on its own, separate rules", () => {
    // Derelicts mode's own values drive its system, not survival's.
    const s = scene(2026, ENCOUNTER);
    expect(s.system.nextPass).toBe(ENCOUNTER.firstPass.min);
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
    const survivalFirst = flight("survival").salvage?.nextPass ?? -1;
    expect(survivalFirst).toBeGreaterThanOrEqual(
      SURVIVAL_ENCOUNTER.firstPass.min,
    );
    expect(survivalFirst).toBeLessThanOrEqual(SURVIVAL_ENCOUNTER.firstPass.max);
    expect(flight("derelicts").salvage?.nextPass).toBe(ENCOUNTER.firstPass.min);
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
