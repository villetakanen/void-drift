import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import type { SalvageBody } from "./salvage";
import { gameSettings, Simulation, STEP } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const SECOND = Math.round(1 / STEP);

describe("survival score", () => {
  it("counts only whole gameplay seconds", () => {
    const sim = new Simulation({ ...gameSettings("wasp"), seed: 2 });
    sim.start();
    const scores: number[] = [];
    // scores[i] is the score after i + 1 ticks.
    for (let i = 0; i < SECOND; i++) {
      sim.step(idle);
      scores.push(sim.survivalScore);
    }
    expect(scores[SECOND - 2]).toBe(0);
    expect(scores[SECOND - 1]).toBe(1);
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
  it("scores a wreck and each destroyed shard once, including already detached shards", () => {
    const sim = new Simulation(gameSettings("wasp"));
    const salvage = sim.salvage;
    if (!salvage) throw new Error("Expected salvage");
    salvage.nextPass = 0;
    sim.start();
    sim.step(idle);
    const wreck = salvage.bodies.find((body) => body.kind === "wreck");
    if (!wreck) throw new Error("Expected wreck");
    salvage.applyDamage(wreck, wreck.hull / 2);
    expect(sim.survivalScore).toBe(0);
    salvage.applyDamage(wreck, wreck.hull);
    expect(sim.survivalScore).toBe(10);
    const shards = salvage.bodies.filter((body) => body.kind === "fragment");
    expect(shards.length).toBeGreaterThan(0);
    for (const shard of shards) {
      salvage.applyDamage(shard, shard.hull);
      salvage.applyDamage(shard, 1);
    }
    expect(sim.survivalScore).toBe(10 + 2 * shards.length);
  });

  it("credits no wreck, shard or energy cell to an enemy blast", () => {
    const sim = new Simulation(gameSettings("wasp"));
    const salvage = sim.salvage;
    if (!salvage) throw new Error("Expected salvage");
    salvage.nextPass = 0;
    sim.start();
    sim.step(idle);
    const wreck = salvage.bodies.find((body) => body.kind === "wreck");
    if (!wreck) throw new Error("Expected wreck");
    salvage.applyDamage(wreck, wreck.hull, false);
    const shards = salvage.bodies.filter((body) => body.kind === "fragment");
    expect(shards.length).toBeGreaterThan(0);
    salvage.applyDamage(shards[0], shards[0].hull, false);
    expect(sim.survivalScore).toBe(0);
    expect(salvage.bodies.some((body) => body.kind === "cell")).toBe(false);
  });

  it.each(["weapon", "ram", "power loss"])(
    "credits a pirate finish by %s",
    (cause) => {
      const sim = new Simulation(gameSettings("wasp"));
      sim.start();
      sim.ticks = 45 * SECOND - 1;
      sim.step(idle);
      const pirate = sim.opponent;
      if (!pirate) throw new Error("Expected a ranked pirate");
      const baseline = sim.survivalScore;
      pirate.resources.hull = 1;
      if (cause === "power loss") pirate.resources.power = 0;
      else {
        pirate.ship.pos.set(
          sim.ship.pos.x + (cause === "ram" ? 2 : 45),
          sim.ship.pos.y,
        );
        pirate.ship.vel.set(0, 0);
        sim.ship.rotation = 0;
        for (const weapon of sim.playerWeapons)
          weapon.readyAt = cause === "ram" ? Infinity : 0;
      }
      sim.step(idle);
      expect(sim.opponent).toBeNull();
      sim.step(idle);
      expect(sim.survivalScore - baseline).toBe(
        cause === "ram" || cause === "weapon" ? 50 : 0,
      );
    },
  );

  it("keeps a wrapped pirate alive without awarding destruction points", () => {
    const sim = new Simulation(gameSettings("wasp"));
    sim.start();
    sim.ticks = 45 * SECOND - 1;
    sim.step(idle);
    const pirate = sim.opponent;
    if (!pirate) throw new Error("Expected a ranked pirate");
    const baseline = sim.survivalScore;
    pirate.lifecycle = "active";
    pirate.ship.pos.set(960, 1739);
    pirate.ship.vel.set(0, 600);
    sim.step(idle);
    sim.step(idle);
    expect(pirate.ship.pos.y).toBeLessThan(540);
    expect(sim.opponent).toBe(pirate);
    expect(pirate.lifecycle).toBe("active");
    expect(sim.survivalScore).toBe(baseline);
  });

  it("counts a collected cell once", () => {
    const sim = new Simulation(gameSettings("fighter"));
    const system = sim.salvage;
    if (!system) throw new Error("Expected a salvage encounter");
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
    const cell: SalvageBody = {
      id: 101,
      group: 7,
      kind: "cell",
      x: 400,
      y: 400,
      previousX: 400,
      previousY: 400,
      vx: 0,
      vy: 0,
      radius: 5,
      hull: 1,
      life: 100,
      rotation: 0,
    };
    system.bodies.push(cell);
    for (let i = 0; i < 6; i++)
      system.step(STEP, ship, star, resources, 100, 400, 400, false, []);
    expect(sim.survivalScore).toBe(20);
  });
});
