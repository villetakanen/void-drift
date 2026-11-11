import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout, LoadoutSchema, type PartId } from "./schemas/loadout";
import { WEAPONS } from "./schemas/salvage";
import { CELL_SCORE, gameSettings, Simulation, STEP } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const SECOND = Math.round(1 / STEP);

/** A fighter with `part` in both hull mounts, over a bare salvage system. */
function fixture(part: PartId) {
  const loadout = defaultLoadout("fighter");
  loadout.hull.fill(part);
  const system = new SalvageSystem(LoadoutSchema.parse(loadout), 2026);
  system.nextPass = Infinity;
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const star = createStar("G", 1800, 1000);
  const resources = { power: 100, hull: 100 };
  const step = (count = 1) => {
    for (let i = 0; i < count; i++)
      system.step(
        STEP,
        ship,
        star,
        resources,
        100,
        ship.pos.x,
        ship.pos.y,
        false,
        [],
      );
  };
  const add = (
    kind: SalvageBody["kind"],
    x: number,
    hull: number,
    shardIndex?: number,
  ) => {
    const body: SalvageBody = {
      id: system.bodies.length + 101,
      group: 7,
      kind,
      x,
      y: 400,
      previousX: x,
      previousY: 400,
      vx: 0,
      vy: 0,
      radius: kind === "wreck" ? 18 : 5,
      hull,
      life: 100,
      rotation: 0,
      ...(kind === "fragment" ? { shardIndex: shardIndex ?? 0 } : {}),
    };
    system.bodies.push(body);
    return body;
  };
  return { system, ship, resources, step, add };
}

describe("survival score formula on a seeded run", () => {
  it("is whole seconds plus ion hits plus the cell score per cell, from the simulation's counters", () => {
    for (const seed of [2, 157, 158, 2026]) {
      const sim = new Simulation({
        ...gameSettings("wasp"),
        arrival: true,
        seed,
      });
      sim.start();
      for (let i = 0; i < 1500 && sim.state.status === "PLAYING"; i++)
        sim.step(idle);
      const salvage = sim.salvage;
      if (!salvage) throw new Error("Survival needs the encounter");
      expect(sim.survivalScore).toBe(
        Math.floor(sim.ticks / SECOND) +
          salvage.derelictIonHits +
          CELL_SCORE * salvage.cellsCollected,
      );
    }
  });
  it("counts only whole gameplay seconds", () => {
    const sim = new Simulation({ ...gameSettings("wasp"), seed: 2 });
    sim.start();
    const scores: number[] = [];
    // scores[i] is the score after i + 1 ticks.
    for (let i = 0; i <= 2 * SECOND; i++) {
      sim.step(idle);
      scores.push(sim.survivalScore);
    }
    expect(scores[SECOND - 2]).toBe(0);
    expect(scores[SECOND - 1]).toBe(1);
    expect(scores[2 * SECOND - 2]).toBe(1);
    expect(scores[2 * SECOND - 1]).toBe(2);
    expect(scores[2 * SECOND]).toBe(2);
  });
  it("is deterministic for one seed", () => {
    const run = () => {
      const sim = new Simulation({
        ...gameSettings("wasp"),
        arrival: true,
        seed: 158,
      });
      sim.start();
      for (let i = 0; i < 600 && sim.state.status === "PLAYING"; i++)
        sim.step(idle);
      return sim.survivalScore;
    };
    expect(run()).toBe(run());
  });
});

describe("survival score sources", () => {
  it("a Light Ion Cannon hit on a wreck scores one, each time", () => {
    const f = fixture("light-ion-cannon");
    f.add("wreck", 500, 1000);
    f.step(60);
    expect(f.system.ionDischarges).toBeGreaterThan(1);
    expect(f.system.derelictIonHits).toBe(f.system.ionDischarges);
  });
  it("a Point Defence hit on a derelict piece scores one, each time", () => {
    const f = fixture("ion-point-defence");
    f.add("fragment", 450, 1000);
    f.step(90);
    expect(f.system.pointDefenceDischarges).toBeGreaterThan(1);
    expect(f.system.derelictIonHits).toBe(f.system.pointDefenceDischarges);
  });
  it("rail and laser hits score nothing", () => {
    for (const part of ["rail", "laser"] as const) {
      const f = fixture(part);
      f.add("wreck", 500, 1000);
      f.step(120);
      expect(f.system.hits, part).toBeGreaterThan(0);
      expect(f.system.derelictIonHits, part).toBe(0);
    }
  });
  it("destroying a derelict adds nothing beyond its hit", () => {
    const rail = fixture("rail");
    // One round destroys it, however far it has to fly.
    rail.add("wreck", 500, WEAPONS.rail.damage);
    for (let i = 0; i < 600 && rail.system.destroyed < 1; i++) rail.step();
    expect(rail.system.destroyed).toBe(1);
    expect(rail.system.derelictIonHits).toBe(0);
    const cannon = fixture("light-ion-cannon");
    cannon.add("wreck", 500, 1);
    for (let i = 0; i < 60 && cannon.system.ionDischarges < 1; i++)
      cannon.step();
    // The kill is a hit like any other; the destruction itself adds nothing.
    expect(cannon.system.destroyed).toBe(1);
    expect(cannon.system.derelictIonHits).toBe(cannon.system.ionDischarges);
  });
  it("collecting a cell counts it once, whatever energy it restores", () => {
    const f = fixture("rail");
    f.resources.power = 100;
    f.add("cell", 400, 1);
    f.step(3);
    expect(f.system.cellsCollected).toBe(1);
    expect(f.system.energyCollected).toBe(0);
    f.step(3);
    expect(f.system.cellsCollected).toBe(1);
  });
});
