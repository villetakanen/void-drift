import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { ENCOUNTER, SALVAGE, WEAPONS } from "./schemas/salvage";
import { Simulation, STEP, setStarMassWell, stockSettings } from "./simulation";

const idle = {
  leftThruster: false,
  rightThruster: false,
  fire: false as const,
};
function fixture(parts: ("rail" | "laser" | null)[] = []) {
  const loadout = defaultLoadout("fighter");
  loadout.hull = [parts[0] ?? null, parts[1] ?? null];
  const system = new SalvageSystem(loadout, 2026);
  system.nextPass = 1000;
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const star = createStar("G", 960, 540);
  const resources = { hull: 100, power: 100 };
  const energy = { capacity: 100 };
  const step = (count = 1) => {
    for (let i = 0; i < count; i++)
      system.step(
        STEP,
        ship,
        star,
        resources,
        energy.capacity,
        ship.pos.x,
        ship.pos.y,
        false,
      );
  };
  return { system, loadout, ship, star, resources, step };
}
function body(
  kind: SalvageBody["kind"],
  x: number,
  y: number,
  id = 1,
  vx = 0,
  vy = 0,
): SalvageBody {
  return {
    id,
    group: 1,
    kind,
    x,
    y,
    previousX: x,
    previousY: y,
    vx,
    vy,
    radius: kind === "wreck" ? 18 : kind === "fragment" ? 5 : 6,
    hull: kind === "cell" ? 1 : SALVAGE[kind].hull,
    life: 20,
    rotation: 0,
  };
}

function legacyEncounter(sim: Simulation) {
  sim.planets.length = 0;
  const well = sim.star.massWell;
  if (well)
    setStarMassWell(sim.star, {
      ...well,
      mass: well.mass * (12 / sim.star.radius) ** 2,
    });
  sim.star.radius = 12;
  sim.ship.pos.set(
    sim.star.pos.x - sim.star.influenceRadius - 85,
    sim.star.pos.y,
  );
  if (sim.salvage) sim.salvage.nextPass = Infinity;
}

describe("Derelicts weapons and salvage", () => {
  it("counts weapon and ram kills once with one cell each, and the environment none", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 550, 400));
    f.system.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    f.step();
    expect(f.system.playerKills).toBe(1);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
    f.system.bodies = [body("wreck", 400, 400, 2)];
    f.step();
    expect(f.system.playerKills).toBe(2);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
    // Damaged by the player, then lost to the star, expiry or exit.
    const damaged = body("wreck", f.star.pos.x, f.star.pos.y, 3);
    damaged.hull = WEAPONS.rail.damage;
    const expired = body("wreck", 550, 400, 4);
    expired.life = 0;
    expired.hull = WEAPONS.rail.damage;
    const exited = body("wreck", 10000, 400, 5);
    exited.hull = WEAPONS.rail.damage;
    f.system.bodies = [damaged, expired, exited];
    f.system.shots = [];
    f.step();
    expect(f.system.playerKills).toBe(2);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(0);
  });
  it("keeps a piece in the system across many edge wraps", () => {
    const { centerX, centerY, radius } = ENCOUNTER;
    const f = fixture();
    // A chord well clear of the star, so only the edge acts on it.
    const b = body(
      "fragment",
      centerX + Math.sqrt(radius ** 2 - 700 ** 2) - 5,
      centerY + 700,
      1,
      500,
      0,
    );
    b.life = undefined;
    f.system.bodies = [b];
    f.system.step(0.1, f.ship, f.star, f.resources, 100, 400, 400, false);
    expect(b.x).toBeLessThan(centerX);
    for (let i = 0; i < 50 * 60; i++)
      f.system.step(1 / 60, f.ship, f.star, f.resources, 100, 400, 400, false);
    expect(f.system.bodies).toEqual([b]);
    expect(Math.hypot(b.x - centerX, b.y - centerY)).toBeLessThanOrEqual(
      radius,
    );
  });
  it("freezes the run's time and kills at game over and gives other modes no result", () => {
    const loadout = defaultLoadout("fighter");
    const sim = new Simulation({
      ...stockSettings(),
      loadout,
      mode: "derelicts",
    });
    legacyEncounter(sim);
    sim.start();
    if (!sim.salvage) throw new Error("Missing salvage system");
    for (let i = 0; i < 3; i++) {
      sim.salvage.bodies = [body("wreck", 550, 400, i + 1)];
      sim.salvage.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
      sim.step(idle);
    }
    sim.ticks = 3599;
    sim.state.resources.hull = 0;
    sim.step(idle);
    const result = { seconds: 60, playerKills: 3 };
    expect(sim.derelictsResult).toMatchObject(result);
    sim.step(idle);
    expect(sim.derelictsResult).toMatchObject(result);
    const survival = new Simulation(stockSettings());
    survival.start();
    survival.state.resources.hull = 0;
    survival.step(idle);
    expect(survival.derelictsResult).toBeNull();
  });
  it("catches a fast round crossing a piece between ticks", () => {
    const f = fixture();
    f.system.bodies.push(body("fragment", 500, 400));
    f.system.shots.push({ x: 400, y: 400, vx: 12000, vy: 0, angle: 0 });
    f.step();
    expect(f.system.bodies).toHaveLength(0);
    expect(f.system.hits).toBe(1);
  });
  it("keeps the active release cue when impact traffic fills the bounded event ring", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 550, 400, 1000));
    f.system.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    f.step();
    // Each batch adds 64 impacts; a bounded ring stops growing.
    const lengths: number[] = [];
    for (let batch = 0; batch < 6; batch++) {
      for (let round = 0; round < 64; round++)
        f.system.shots.push({
          x: f.star.pos.x,
          y: f.star.pos.y,
          vx: 0,
          vy: 0,
          angle: 0,
        });
      f.step();
      lengths.push(f.system.events.length);
    }
    expect(lengths.at(-1)).toBe(lengths.at(-2));
    expect(lengths.at(-1)).toBeLessThan(6 * 64);
    expect(
      f.system.events.some((event) => event.kind === "energy-release"),
    ).toBe(true);
  });
  it("freezes released energy and its event during pause", () => {
    const settings = {
      ...stockSettings("fighter"),
      loadout: defaultLoadout("fighter"),
      mode: "derelicts",
    };
    const sim = new Simulation(settings);
    legacyEncounter(sim);
    sim.start();
    const salvage = sim.salvage;
    if (!salvage) throw new Error("Missing salvage");
    salvage.bodies.push(body("wreck", 550, 400, 1000));
    salvage.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    sim.step(idle);
    expect(salvage.bodies.some((body) => body.kind === "cell")).toBe(true);
    expect(
      salvage.events.some((event) => event.kind === "energy-release"),
    ).toBe(true);
    sim.state.status = "MENU";
    const before = JSON.stringify({
      bodies: salvage.bodies,
      events: salvage.events,
      time: salvage.time,
    });
    for (let tick = 0; tick < 60; tick++) sim.step(idle);
    expect(
      JSON.stringify({
        bodies: salvage.bodies,
        events: salvage.events,
        time: salvage.time,
      }),
    ).toBe(before);
  });
  it("sheds the selected pieces at damage thresholds and releases the rest only once", () => {
    const f = fixture(["laser"]);
    const wreck = body("wreck", 550, 400);
    f.system.bodies.push(wreck);
    const seen: number[] = [];
    let shed = 0;
    for (let i = 0; i < 360 && wreck.hull > 0; i++) {
      f.step();
      for (const piece of f.system.bodies.filter(
        (b) => b.kind === "fragment",
      )) {
        if (!seen.includes(piece.shardIndex ?? -1))
          seen.push(piece.shardIndex ?? -1);
      }
      if (wreck.hull > 0) {
        shed = seen.length;
        expect(f.system.bodies.some((b) => b.kind === "cell")).toBe(false);
      }
    }
    // Some pieces left before destruction released the rest.
    expect(shed).toBeGreaterThan(0);
    expect(shed).toBeLessThan(SALVAGE.fragment.count);
    expect(seen.slice().sort()).toEqual(
      Array.from({ length: SALVAGE.fragment.count }, (_, i) => i),
    );
    expect(f.system.playerKills).toBe(1);
  });
  it("destroys a wreck swept into the star with no kill, no cell and no duplicated pieces", () => {
    const f = fixture();
    const wreck = body(
      "wreck",
      f.star.pos.x - f.star.radius - 100,
      f.star.pos.y,
      1,
      500,
      0,
    );
    wreck.releasedMask = 1;
    f.system.bodies.push(wreck);
    f.system.step(0.3, f.ship, f.star, f.resources, 100, 400, 400, false);
    expect(f.system.bodies.filter((b) => b.kind === "fragment")).toHaveLength(
      SALVAGE.fragment.count - 1,
    );
    f.step();
    expect(f.system.playerKills).toBe(0);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(0);
  });
  it.each([
    { name: "rail before star", start: 620, kills: 1, cells: 1 },
    { name: "star before rail", start: 530, kills: 0, cells: 0 },
  ])("orders $name within the same step", ({ start, kills, cells }) => {
    const f = fixture();
    f.star.pos.set(800, 400);
    f.star.radius = 30;
    f.star.influenceRadius = 0; // Shot order, not motion in the well.
    const wreck = body("wreck", 700, 400, 1, 300, 0);
    f.system.bodies.push(wreck);
    f.system.shots.push({ x: start, y: 400, vx: 1000, vy: 0, angle: 0 });
    f.system.step(0.3, f.ship, f.star, f.resources, 100, 400, 400, false);
    expect(f.system.playerKills).toBe(kills);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(
      cells,
    );
  });
  it("spends no energy below the weapon floor", () => {
    const f = fixture(["rail", "laser"]);
    f.system.bodies.push(body("wreck", 550, 400));
    f.resources.power = 100 * WEAPONS.energyFloor - 0.1;
    f.step(60);
    expect(f.system.energySpent).toBe(0);
  });
  it("does not duplicate a wreck drop when multiple rounds hit together", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 550, 400));
    for (let i = 0; i < 3; i++)
      f.system.shots.push({
        x: 500,
        y: 400,
        vx: 6000,
        vy: 0,
        angle: 0,
      });
    f.step();
    expect(f.system.destroyed).toBe(1);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
    expect(
      f.system.bodies.filter((b) => b.kind === "fragment").length,
    ).toBeLessThanOrEqual(SALVAGE.fragment.count);
  });
  it("blocks laser and rail fire through the star and absorbs existing rounds", () => {
    const f = fixture(["rail", "laser"]);
    f.star.pos.set(470, 400);
    f.star.influenceRadius = 0; // Blocking, not motion in the well.
    f.system.bodies.push(body("wreck", 550, 400));
    f.step(60);
    expect(f.system.energySpent).toBe(0);
    f.system.shots.push({
      x: 420,
      y: 400,
      vx: 12000,
      vy: 0,
      angle: 0,
    });
    f.step();
    expect(f.system.shots).toHaveLength(0);
    expect(f.system.bodies[0].hull).toBe(SALVAGE.wreck.hull);
  });
  it("applies piece damage and capped collection once, with cells immune to weapons", () => {
    const f = fixture();
    // Room for half a cell, so collection is capped.
    const room = SALVAGE.cell.energy / 2;
    f.resources.power = 100 - room;
    f.system.bodies.push(body("fragment", 400, 400), body("cell", 400, 400, 2));
    f.step(2);
    expect(f.resources).toEqual({
      hull: 100 - SALVAGE.fragment.contact,
      power: 100,
    });
    expect(f.system.bodies).toHaveLength(0);
    const armed = fixture(["rail", "laser"]);
    armed.system.bodies.push(body("cell", 550, 400));
    armed.step(60);
    expect(armed.system.energySpent).toBe(0);
    expect(armed.system.bodies).toHaveLength(1);
  });
  it("deals wreck contact damage once, not again from the pieces it sheds", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 420, 400));
    f.step();
    expect(f.resources.hull).toBe(100 - SALVAGE.wreck.contact);
    f.step(5);
    expect(f.resources.hull).toBe(100 - SALVAGE.wreck.contact);
  });
  it("never sweeps across a player wrap", () => {
    const f = fixture();
    f.system.bodies.push(body("cell", 960, 450));
    f.resources.power = 40;
    f.ship.pos.set(2140, 450);
    f.system.step(STEP, f.ship, f.star, f.resources, 100, -220, 450, true);
    expect(f.system.energyCollected).toBe(0);
  });
});
