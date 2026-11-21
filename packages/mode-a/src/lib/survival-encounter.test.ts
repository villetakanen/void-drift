import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { pirateLoadout } from "./gauntlet";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { RANKED_SURVIVAL_ENCOUNTER } from "./schemas/salvage";
import { gameSettings, Simulation, STEP } from "./simulation";

function scene(seed = 2026) {
  const system = new SalvageSystem(
    defaultLoadout("wasp"),
    seed,
    undefined,
    RANKED_SURVIVAL_ENCOUNTER,
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

describe("survival encounter", () => {
  it("selects the ranked schedule for an eligible Survival launch", () => {
    const settings = gameSettings("wasp");
    const ranked = new Simulation(settings);
    const playground = new Simulation({ ...settings, experimental: "On" });
    expect(ranked.salvage?.nextPass).toBe(scene(settings.seed).system.nextPass);
    expect(playground.salvage?.nextPass).not.toBe(ranked.salvage?.nextPass);
  });
  it("schedules the first and every subsequent attempt in 5–40 gameplay seconds", () => {
    const deadlines = arrivals(100).map((run) => run.deadline);
    const intervals = deadlines.map(
      (deadline, i) => deadline - (deadlines[i - 1] ?? 0),
    );
    expect(Math.min(...intervals)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...intervals)).toBeLessThanOrEqual(40);
  });
  it("is deterministic for a seed and varies across seeds", () => {
    const shape = (list: ReturnType<typeof arrivals>) =>
      list.map(({ deadline, wreck }) => [
        deadline,
        wreck.x,
        wreck.y,
        wreck.vx,
        wreck.vy,
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
    // Keep the wreck in play, held still, until the next arrival is due.
    const wreck = s.system.bodies[0] as SalvageBody;
    const next = s.system.nextPass;
    while (s.system.time < next) {
      wreck.x = wreck.previousX = RANKED_SURVIVAL_ENCOUNTER.centerX + 400;
      wreck.y = wreck.previousY = RANKED_SURVIVAL_ENCOUNTER.centerY;
      wreck.vx = wreck.vy = 0;
      wreck.life = 100000;
      s.advance(Math.min(1, next - s.system.time + 0.00001));
    }
    expect(s.system.passes).toBe(1);
    expect(s.system.groups).toBe(1);
    s.system.applyDamage(wreck, wreck.hull);
    expect(s.system.bodies.some((body) => body.kind === "fragment")).toBe(true);
    expect(s.system.bodies.some((body) => body.kind === "cell")).toBe(true);
    s.advance(STEP);
    expect(s.system.passes).toBe(1);
    s.advance(s.system.nextPass - s.system.time);
    expect(s.system.passes).toBe(2);
  });
});

describe("ranked pirate encounters", () => {
  const idle = { leftThruster: false, rightThruster: false, fire: false };
  const first = Math.round(45 / STEP);

  it("starts the seeded repeat wait only after destruction", () => {
    const sim = new Simulation(gameSettings("wasp"));
    sim.start();
    sim.ticks = first - 2;
    sim.step(idle);
    expect(sim.opponent).toBeNull();
    sim.step(idle);
    const pirate = sim.opponent;
    if (!pirate) throw new Error("Expected first ranked Scout");
    expect(pirate.loadout).toEqual(pirateLoadout());
    sim.ticks += Math.round(65 / STEP);
    sim.step(idle);
    expect(sim.opponents).toEqual([pirate]);
    pirate.resources.hull = 0;
    sim.step(idle);
    expect(sim.opponent).toBeNull();
    expect(sim.gauntletResult).toBeNull();
    const destroyed = sim.ticks;
    sim.ticks = destroyed + first - 2;
    sim.step(idle);
    expect(sim.opponent).toBeNull();
    while (!sim.opponent && sim.ticks < destroyed + Math.round(60 / STEP)) {
      sim.ship.pos.set(500, 540);
      sim.ship.vel.set(0, 0);
      sim.state.resources.power = 100;
      sim.step(idle);
      expect(sim.state.status).toBe("PLAYING");
    }
    expect(sim.opponents).toHaveLength(1);
    expect(sim.opponent).not.toBe(pirate);
    expect(sim.ticks - destroyed).toBeGreaterThanOrEqual(first);
    expect(sim.ticks - destroyed).toBeLessThanOrEqual(Math.round(60 / STEP));
  });

  it("keeps the same live Scout after wrapping without starting a replacement wait", () => {
    const sim = new Simulation(gameSettings("wasp"));
    sim.start();
    sim.ticks = first - 1;
    sim.step(idle);
    const pirate = sim.opponent;
    if (!pirate) throw new Error("Expected first ranked Scout");
    pirate.lifecycle = "active";
    pirate.ship.pos.set(960, 1739);
    pirate.ship.vel.set(0, 600);
    sim.step(idle);
    expect(pirate.ship.pos.y).toBeLessThan(540);
    expect(pirate.lifecycle).toBe("active");
    expect(sim.opponents).toEqual([pirate]);
    const wrapped = sim.ticks;
    for (const seconds of [45, 60, 61]) {
      sim.ticks = wrapped + Math.round(seconds / STEP) - 1;
      sim.step(idle);
      expect(sim.state.status).toBe("PLAYING");
      expect(sim.opponents).toEqual([pirate]);
      expect(pirate.lifecycle).toBe("active");
    }
  });

  it("resolves player weapons against the Scout while salvage advances once", () => {
    const sim = new Simulation(gameSettings("wasp"));
    sim.start();
    sim.ticks = first - 1;
    sim.step(idle);
    const pirate = sim.opponent;
    if (!pirate || !sim.salvage) throw new Error("Expected ranked encounter");
    pirate.ship.pos.set(sim.ship.pos.x + 45, sim.ship.pos.y);
    pirate.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    const time = sim.salvage.time;
    for (const weapon of sim.salvage.weapons) weapon.readyAt = 0;
    const hull = pirate.resources.hull;
    sim.step(idle);
    expect(pirate.resources.hull).toBeLessThan(hull);
    expect(sim.salvage.time - time).toBeCloseTo(STEP);
    expect(sim.salvage.bodies.every((body) => body.kind !== "ship")).toBe(true);
  });

  it("leaves Playground Survival pirate-free", () => {
    const sim = new Simulation({ ...gameSettings("wasp"), experimental: "On" });
    sim.start();
    sim.ticks = first - 1;
    sim.step(idle);
    expect(sim.opponent).toBeNull();
  });
});
