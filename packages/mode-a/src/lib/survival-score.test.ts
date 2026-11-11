import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout, LoadoutSchema } from "./schemas/loadout";
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
  it("counts a collected cell once", () => {
    const loadout = defaultLoadout("fighter");
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
    expect(system.cellsCollected).toBe(1);
  });
});
