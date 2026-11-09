import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { castDerelict } from "./derelict-collision";
import {
  DERELICT_ENERGY_SOURCE,
  DERELICT_ORIGIN,
  DERELICT_SCALE,
  DERELICT_SHARDS,
} from "./derelict-geometry";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { buildStats, defaultLoadout } from "./schemas/loadout";
import {
  DerelictsResultSchema,
  ENCOUNTER,
  SALVAGE,
  SalvageBodySchema,
  WEAPONS,
} from "./schemas/salvage";
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

function injectLegacyPass(sim: Simulation) {
  const ship = sim.ship;
  const cos = Math.cos(ship.rotation),
    sin = Math.sin(ship.rotation);
  sim.salvage?.bodies.push(
    body(
      "wreck",
      ship.pos.x + cos * 150 - sin * 220,
      ship.pos.y + sin * 150 + cos * 220,
      1,
      ship.vel.x + sin * 40,
      ship.vel.y - cos * 40,
    ),
  );
}

describe("Derelicts weapons and salvage", () => {
  it("blocks fitted weapons and flying rounds at a planet without rewarding its impact", () => {
    const f = fixture(["rail", "laser"]);
    const planet = new Simulation(stockSettings()).planets[0];
    planet.pos.set(470, 400);
    planet.radius = 10;
    f.system.bodies.push(body("wreck", 550, 400));
    f.system.shots.push({ x: 420, y: 400, vx: 12000, vy: 0, angle: 0 });
    f.system.step(STEP, f.ship, f.star, f.resources, 100, 400, 400, false, [
      planet,
    ]);
    expect(f.system.energySpent).toBe(0);
    expect(f.system.shots).toHaveLength(0);
    expect(f.system.bodies[0].hull).toBe(85);
    expect(f.system.playerKills).toBe(0);
  });

  it("rejects inconsistent run results and fractional kill counts", () => {
    expect(
      DerelictsResultSchema.safeParse({
        seconds: 60,
        playerKills: 3,
        score: 60,
      }).success,
    ).toBe(false);
    expect(
      DerelictsResultSchema.safeParse({
        seconds: 60,
        playerKills: 0.5,
        score: 65,
      }).success,
    ).toBe(false);
  });
  it("counts weapon and ram wreck kills once, excluding other removals and fragments", () => {
    const f = fixture();
    const wreck = body("wreck", 550, 400);
    f.system.bodies.push(wreck);
    f.system.shots.push(
      ...[1, 2].map(() => ({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 })),
    );
    f.step();
    expect(f.system.playerKills).toBe(1);
    expect(
      f.system.events.filter((e) => e.kind === "energy-release"),
    ).toHaveLength(1);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
    f.system.events = [];
    f.system.bodies = [body("wreck", 400, 400, 2)];
    f.step();
    expect(f.system.playerKills).toBe(2);
    expect(
      f.system.events.filter((e) => e.kind === "energy-release"),
    ).toHaveLength(1);
    f.system.events = [];
    const damaged = body("wreck", 550, 400, 3);
    damaged.hull = 200;
    f.system.bodies = [damaged];
    f.system.shots = [];
    f.system.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    f.step();
    expect(damaged.hull).toBe(100);
    damaged.x = f.star.pos.x;
    damaged.y = f.star.pos.y;
    const expired = body("wreck", 550, 400, 4);
    expired.life = 0;
    const exited = body("wreck", 10000, 400, 5);
    const fragment = body("fragment", 400, 400, 6);
    f.system.bodies = [damaged, expired, exited, fragment];
    f.step();
    expect(f.system.playerKills).toBe(2);
    expect(
      f.system.events.filter((e) => e.kind === "energy-release"),
    ).toHaveLength(0);
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(0);
  });

  describe("system edge", () => {
    const { centerX, centerY, radius } = ENCOUNTER;
    function crossing(kind: SalvageBody["kind"], vx = 300, vy = 120) {
      const f = fixture();
      const length = Math.hypot(vx, vy);
      // Just inside the edge on the line towards the heading, so one step crosses.
      const b = body(
        kind,
        centerX + (vx / length) * (radius - 5),
        centerY + (vy / length) * (radius - 5),
        1,
        vx,
        vy,
      );
      if (kind === "fragment") b.life = undefined;
      f.system.bodies = [b];
      return { f, b, vx, vy };
    }
    it("wraps a shard to the opposite side with velocity and heading kept", () => {
      const { f, b, vx, vy } = crossing("fragment");
      const entry = { x: b.x - centerX, y: b.y - centerY };
      const rotation = b.rotation;
      f.system.step(0.1, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.bodies).toEqual([b]);
      expect(b.hull).toBeGreaterThan(0);
      expect([b.vx, b.vy]).toEqual([vx, vy]);
      expect(b.rotation).toBeGreaterThan(rotation);
      const exit = { x: b.x - centerX, y: b.y - centerY };
      // Opposite the crossing point, back inside the system.
      expect(exit.x * entry.x + exit.y * entry.y).toBeLessThan(0);
      expect(exit.x * entry.y - exit.y * entry.x).toBeCloseTo(0, 6);
      expect(Math.hypot(exit.x, exit.y)).toBeLessThan(radius);
      // The pose it will interpolate from continues the motion, not the jump.
      expect(Math.hypot(b.x - b.previousX, b.y - b.previousY)).toBeCloseTo(
        Math.hypot(vx, vy) * 0.1,
        6,
      );
    });
    it("keeps a shard far beyond the old fragment life and across many wraps", () => {
      const { f, b } = crossing("fragment", 500, 0);
      // A chord well clear of the star, so only the edge acts on it.
      b.y = centerY + 700;
      b.x = centerX + Math.sqrt(radius ** 2 - 700 ** 2) - 5;
      b.previousX = b.x;
      b.previousY = b.y;
      f.system.step(0.1, f.ship, f.star, f.resources, 100, 400, 400, false);
      const wrapped = b.x;
      for (let i = 0; i < 50 * 60; i++)
        f.system.step(
          1 / 60,
          f.ship,
          f.star,
          f.resources,
          100,
          400,
          400,
          false,
        );
      expect(f.system.bodies).toEqual([b]);
      expect(f.system.time).toBeGreaterThan(50);
      expect(b.hull).toBeGreaterThan(0);
      expect(Math.hypot(b.x - centerX, b.y - centerY)).toBeLessThanOrEqual(
        radius,
      );
      expect(b.vx).toBe(500);
      expect(wrapped).toBeLessThan(centerX);
    });
    it("removes an intact derelict at the edge with no score, drop or release", () => {
      for (const damage of [0, 40]) {
        const { f, b } = crossing("wreck");
        b.hull -= damage;
        f.system.step(0.1, f.ship, f.star, f.resources, 100, 400, 400, false);
        expect(f.system.bodies).toHaveLength(0);
        expect(f.system.playerKills).toBe(0);
        expect(f.system.destroyed).toBe(0);
        expect(f.resources.power).toBe(100);
        expect(f.system.events).toHaveLength(0);
      }
    });
    it("removes a freed energy cell at the edge with no energy", () => {
      const { f } = crossing("cell");
      f.resources.power = 10;
      f.system.step(0.1, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.bodies).toHaveLength(0);
      expect(f.resources.power).toBe(10);
      expect(f.system.energyCollected).toBe(0);
    });
    it("requires a life for a wreck and a cell but not for a shard", () => {
      const noLife = (kind: SalvageBody["kind"]) => {
        const { life: _life, ...rest } = body(kind, 0, 0);
        return SalvageBodySchema.safeParse(rest).success;
      };
      expect(noLife("wreck")).toBe(false);
      expect(noLife("cell")).toBe(false);
      expect(noLife("fragment")).toBe(true);
      expect(SalvageBodySchema.safeParse(body("wreck", 0, 0)).success).toBe(
        true,
      );
    });
    it("still expires a derelict and a cell on their timers", () => {
      const f = fixture();
      const wreck = body("wreck", 700, 700, 1);
      const cell = body("cell", 800, 700, 2);
      wreck.life = 0.5;
      cell.life = 0.5;
      f.system.bodies = [wreck, cell];
      f.system.step(0.4, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.bodies).toHaveLength(2);
      f.system.step(0.2, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.bodies).toHaveLength(0);
      expect(f.system.playerKills).toBe(0);
    });
    it("destroys a wrapped shard that meets the star", () => {
      const { f, b } = crossing("fragment", 500, 0);
      b.x = f.star.pos.x - f.star.radius - 30;
      b.y = f.star.pos.y;
      b.previousX = b.x;
      b.previousY = b.y;
      f.system.step(0.2, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.bodies).toHaveLength(0);
    });
  });

  it("freezes the final Derelicts score and keeps other runs result-free", () => {
    const loadout = defaultLoadout("fighter");
    const sim = new Simulation({
      ...stockSettings(),
      loadout,
      mode: "derelicts",
    });
    legacyEncounter(sim);
    sim.start();
    expect(sim.derelictsResult).toBeNull();
    if (!sim.salvage) throw new Error("Missing salvage system");
    for (let i = 0; i < 2; i++) {
      sim.salvage.bodies = [];
      sim.salvage.bodies.push(body("wreck", 550, 400, i + 1));
      sim.salvage.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
      sim.step(idle);
    }
    sim.salvage.bodies = [];
    sim.salvage.bodies.push(body("wreck", 550, 400, 3));
    sim.salvage.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    sim.step(idle);
    sim.ticks = 3599;
    sim.state.resources.hull = 0;
    sim.step(idle);
    expect(sim.derelictsResult).toEqual({
      seconds: 60,
      playerKills: 3,
      score: 90,
    });
    sim.step(idle);
    expect(sim.derelictsResult).toEqual({
      seconds: 60,
      playerKills: 3,
      score: 90,
    });
    expect(
      new Simulation({ ...stockSettings(), loadout, mode: "derelicts" })
        .derelictsResult,
    ).toBeNull();
    const survival = new Simulation(stockSettings());
    survival.start();
    survival.state.resources.hull = 0;
    survival.step(idle);
    expect(survival.derelictsResult).toBeNull();
  });
  it("completes a real rail salvage and collection pass using flight controls", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "rail";
    const sim = new Simulation({
      ...stockSettings("fighter"),
      loadout,
      mode: "derelicts",
    });
    legacyEncounter(sim);
    sim.start();
    sim.replay([{ ...idle, ticks: 180 }]);
    injectLegacyPass(sim);
    if (!sim.salvage) throw new Error("Missing salvage");
    sim.salvage.bodies[0].rotation = (20 * Math.PI) / 180;
    sim.replay([
      { ...idle, ticks: 220 },
      { ...idle, leftThruster: true, rightThruster: true, ticks: 150 },
    ]);
    expect(sim.salvage?.destroyed).toBe(1);
    expect(sim.salvage?.energyCollected).toBeGreaterThan(0);
  });
  it.each(["wasp", "scout", "fighter", "corvette", "fiddler"] as const)(
    "%s can engage the opening pass with either weapon",
    (chassis) => {
      for (const gun of ["rail", "laser"] as const) {
        const loadout = defaultLoadout(chassis);
        loadout.hull[0] = gun;
        const sim = new Simulation({
          ...stockSettings(chassis),
          loadout,
          mode: "derelicts",
        });
        legacyEncounter(sim);
        sim.start();
        for (let i = 0; i < 180; i++) sim.step(idle);
        injectLegacyPass(sim);
        for (let i = 0; i < 720; i++) sim.step(idle);
        expect(sim.salvage?.hits, `${chassis} ${gun}`).toBeGreaterThan(0);
        if (gun === "rail") expect(sim.salvage?.destroyed).toBe(1);
      }
    },
  );
  it("fires from the rotated slot muzzle with inherited velocity, without steering", () => {
    const f = fixture(["rail"]);
    Object.assign(f.system.weapons[0].mount, {
      x: 12,
      y: -8,
      angle: Math.PI / 2,
    });
    f.ship.vel.x = 45;
    f.system.bodies.push(body("wreck", 412, 550, 1, 45));
    f.step();
    const shot = f.system.shots[0];
    expect(shot).toBeDefined();
    expect(shot.vx).toBeCloseTo(45);
    expect(shot.vy).toBeCloseTo(600);
    expect(shot.x - shot.vx * STEP).toBeCloseTo(407.8);
    // x=400 + 12*0.65; y=400 - 8*0.65 + (11/2+1)*0.65.
    expect(shot.y - shot.vy * STEP).toBeCloseTo(399.025);
    f.system.bodies[0].y += 100;
    f.step();
    expect(shot.vx).toBeCloseTo(45);
    expect(shot.vy).toBeCloseTo(600);
  });
  it("waits for an intercept and catches fast relative crossings between ticks", () => {
    const f = fixture(["rail"]);
    f.system.bodies.push(body("fragment", 500, 450));
    f.step();
    expect(f.system.shotsFired).toBe(0);
    f.system.bodies[0] = body("fragment", 500, 400);
    f.system.shots.push({
      x: 400,
      y: 400,
      vx: 12000,
      vy: 0,
      angle: 0,
    });
    f.step();
    expect(f.system.bodies).toHaveLength(0);
    expect(f.system.hits).toBe(1);
  });
  it("predicts target motion without a target lock or aim cone steering", () => {
    const f = fixture(["rail"]);
    const pose = weaponPose(f.ship, f.system.weapons[0].mount);
    f.system.bodies.push(
      body("fragment", pose.muzzleX + 60, pose.muzzleY + 20, 1, 0, -200),
    );
    f.step();
    expect(f.system.shotsFired).toBe(1);
    f.step(8);
    expect(f.system.bodies).toHaveLength(0);
  });
  it.each([-9, -7, 7, 9])(
    "uses the firing arc at %s degrees without steering the barrel",
    (degrees) => {
      const f = fixture(["rail"]);
      f.ship.rotation = 0.4;
      f.system.weapons[0].mount.angle = 0.3;
      const pose = weaponPose(f.ship, f.system.weapons[0].mount);
      const bearing = pose.angle + (degrees * Math.PI) / 180;
      f.system.bodies.push(
        body(
          "fragment",
          pose.muzzleX + Math.cos(bearing) * 300,
          pose.muzzleY + Math.sin(bearing) * 300,
        ),
      );
      f.step();
      expect(f.system.shotsFired).toBe(Math.abs(degrees) < 8 ? 1 : 0);
      if (f.system.shots[0]) {
        expect(f.system.shots[0].angle).toBeCloseTo(pose.angle);
        expect(f.system.shots[0].vx).toBeCloseTo(Math.cos(pose.angle) * 600);
        expect(f.system.shots[0].vy).toBeCloseTo(Math.sin(pose.angle) * 600);
      }
    },
  );
  it("keeps a missed slug beyond acquisition range until it exits the system", () => {
    const f = fixture(["rail"]);
    const pose = weaponPose(f.ship, f.system.weapons[0].mount);
    f.system.bodies.push(
      body("fragment", pose.muzzleX + 300, pose.muzzleY + 30),
    );
    f.step();
    expect(f.system.shots).toHaveLength(1);
    f.resources.power = 5; // below the energy floor: no further shots
    f.step(60);
    expect(f.system.hits).toBe(0);
    expect(f.system.events.some((event) => event.kind === "collision")).toBe(
      false,
    );
    expect(f.system.shots).toHaveLength(1);
    expect(f.system.shots[0].x - pose.muzzleX).toBeGreaterThan(600);
    f.step(120);
    expect(f.system.shots).toHaveLength(0);
  });
  it("hits beyond acquisition range and emits its plume at the swept contact point", () => {
    const f = fixture(["rail"]);
    const pose = weaponPose(f.ship, f.system.weapons[0].mount);
    f.system.bodies.push(
      body("fragment", pose.muzzleX + 300, pose.muzzleY + 30),
    );
    f.step();
    f.resources.power = 5; // below the energy floor: no further shots
    const distant = body("wreck", pose.muzzleX + 900, pose.muzzleY, 2);
    distant.hull = 105;
    f.system.bodies.push(distant);
    for (let i = 0; i < 100 && f.system.hits === 0; i++) f.step();
    expect(distant.hull).toBe(5);
    expect(f.system.shots).toHaveLength(0);
    const impacts = f.system.events.filter(
      (event) => event.kind === "collision",
    );
    expect(impacts).toHaveLength(1);
    expect(impacts[0].x).toBeLessThan(distant.x);
    expect(impacts[0].x).toBeGreaterThan(distant.x - 60);
    expect(impacts[0].y).toBeCloseTo(distant.y);
  });
  it("deals 100 rail damage to an 85-hull wreck and 5 laser damage to a 12-hull shard", () => {
    const rail = fixture(["rail"]);
    rail.system.bodies.push(body("wreck", 550, 400));
    rail.step(12);
    expect(rail.system.shotsFired).toBe(1);
    expect(rail.system.destroyed).toBe(1);
    expect(rail.system.energySpent).toBe(3);
    const laser = fixture(["laser"]);
    const pose = weaponPose(laser.ship, laser.system.weapons[0].mount);
    const shard = body("fragment", pose.x + 100, pose.y);
    laser.system.bodies.push(shard);
    laser.step();
    expect(shard.hull).toBe(7);
    laser.step(15);
    expect(shard.hull).toBe(2);
    laser.step(15);
    expect(laser.system.bodies).toHaveLength(0);
    expect(laser.system.laserPulses).toBe(3);
  });
  it("limits laser acquisition to 160 units", () => {
    const f = fixture(["laser"]);
    const pose = weaponPose(f.ship, f.system.weapons[0].mount);
    const wreck = body("wreck", pose.x + 161, pose.y);
    f.system.bodies.push(wreck);
    f.step(30);
    expect(f.system.laserPulses).toBe(0);
    wreck.x = pose.x + 159;
    f.step();
    expect(f.system.laserPulses).toBe(1);
  });
  it("applies a mass-scaled 0.34-ion recoil for exactly 0.22 seconds in the shot direction", () => {
    const f = fixture(["rail"]);
    f.system.bodies.push(body("wreck", 550, 400));
    f.step();
    const acceleration = (220 * 115 * 0.34) / buildStats(f.loadout).mass;
    expect(f.ship.vel.x).toBeCloseTo(-acceleration * STEP);
    const shot = f.system.shots[0];
    expect(shot.vx).toBe(600);
    f.resources.power = 10;
    f.ship.rotation = Math.PI / 2;
    f.step(13);
    expect(f.ship.vel.x).toBeCloseTo(-acceleration * 0.22);
    expect(f.ship.vel.y).toBeCloseTo(0);
    expect(f.system.weapons[0].recoil).toBeNull();
    f.step(30);
    expect(f.ship.vel.x).toBeCloseTo(-acceleration * 0.22);
    expect(f.system.energySpent).toBe(3);
  });
  it("tracks at a finite rate and gives an incoming fragment priority over a wreck", () => {
    const f = fixture(["laser"]);
    f.system.bodies.push(
      body("wreck", 550, 400),
      body("fragment", 400, 500, 2, 0, -50),
    );
    f.step();
    expect(f.system.weapons[0].target).toBe(2);
    expect(f.system.weapons[0].angle).toBeCloseTo(Math.PI / 30);
    expect(f.system.laserPulses).toBe(0);
    f.step(50);
    expect(f.system.bodies.some((b) => b.id === 2)).toBe(false);
    expect(f.resources.hull).toBe(100);
  });
  it("allows laser-only salvage and releases a single complete drop", () => {
    const f = fixture(["laser"]);
    f.system.bodies.push(body("wreck", 550, 400));
    for (let i = 0; i < 360 && f.system.destroyed === 0; i++) f.step();
    expect(f.system.destroyed).toBe(1);
    expect(f.system.laserPulses).toBe(17);
    expect(f.system.bodies.filter((b) => b.kind === "fragment")).toHaveLength(
      8,
    );
    expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(1);
    expect(f.system.energySpent).toBe(8.5);
  });
  it("releases a moving wreck's fragment from its swept rail contact pose", () => {
    const f = fixture();
    const wreck = body("wreck", 550, 400, 1, 100, 0);
    wreck.hull = 150;
    const impact = castDerelict(
      { kind: "wreck", x: wreck.x, y: wreck.y, rotation: 0 },
      { x: 500, y: 400 },
      { x: 5900, y: 0 },
      0,
      STEP,
      0.3,
    );
    expect(impact).not.toBeNull();
    if (!impact) throw new Error("Missing impact");
    f.system.bodies.push(wreck);
    f.system.shots.push({ x: 500, y: 400, vx: 6000, vy: 0, angle: 0 });
    f.step();
    const fragment = f.system.bodies.find(
      (b) => b.kind === "fragment" && b.shardIndex === 0,
    );
    expect(fragment).toBeDefined();
    if (!fragment) throw new Error("Missing fragment");
    const site = DERELICT_SHARDS[0],
      angle = impact.time * 0.3;
    const dx = (site.x - DERELICT_ORIGIN.x) * DERELICT_SCALE;
    const dy = (site.y - DERELICT_ORIGIN.y) * DERELICT_SCALE;
    expect(fragment.x).toBeCloseTo(
      550 + 100 * impact.time + dx * Math.cos(angle) - dy * Math.sin(angle),
      7,
    );
    expect(fragment.y).toBeCloseTo(
      400 + dx * Math.sin(angle) + dy * Math.cos(angle),
      7,
    );
    expect(fragment.rotation).toBeCloseTo(angle, 7);
    expect(wreck.x).toBeCloseTo(550 + 100 * STEP, 7);
    expect(wreck.initialHull).toBe(150);
  });
  it("releases the moving energy source at swept weapon contact and keeps the pulse fixed", () => {
    const f = fixture();
    const wreck = body("wreck", 550, 400, 1, 100, 0);
    wreck.rotation = 0.7;
    const impact = castDerelict(
      { kind: "wreck", x: wreck.x, y: wreck.y, rotation: wreck.rotation },
      { x: 500, y: 400 },
      { x: 5900, y: 0 },
      0,
      STEP,
      0.3,
    );
    if (!impact) throw new Error("Missing impact");
    f.system.bodies.push(wreck);
    f.system.shots.push({ x: 500, y: 400, vx: 6000, vy: 0, angle: 0 });
    f.step();
    const cells = f.system.bodies.filter((b) => b.kind === "cell");
    const releases = f.system.events.filter((e) => e.kind === "energy-release");
    expect(cells).toHaveLength(1);
    expect(releases).toHaveLength(1);
    const cell = cells[0],
      event = releases[0],
      angle = 0.7 + impact.time * 0.3;
    const dx = (DERELICT_ENERGY_SOURCE.x - DERELICT_ORIGIN.x) * DERELICT_SCALE;
    const dy = (DERELICT_ENERGY_SOURCE.y - DERELICT_ORIGIN.y) * DERELICT_SCALE;
    expect(cell.x).toBeCloseTo(
      550 + 100 * impact.time + dx * Math.cos(angle) - dy * Math.sin(angle),
    );
    expect(cell.y).toBeCloseTo(
      400 + dx * Math.sin(angle) + dy * Math.cos(angle),
    );
    expect(cell.vx).toBeCloseTo(100 + 45 * Math.sin(angle));
    expect(cell.vy).toBeCloseTo(-45 * Math.cos(angle));
    expect(cell.rotation).toBeCloseTo(angle);
    expect(event.x).toBe(cell.x);
    expect(event.y).toBe(cell.y);
    f.step(10);
    expect(cell.rotation).toBeCloseTo(angle);
    expect(cell.x).not.toBe(event.x);
    expect(f.system.events).toContain(event);
    f.step(8);
    expect(f.system.events).not.toContain(event);
  });
  it("keeps the active release cue when impact traffic fills the bounded event ring", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 550, 400, 1000));
    f.system.shots.push({ x: 550, y: 400, vx: 0, vy: 0, angle: 0 });
    f.step();
    for (let batch = 0; batch < 2; batch++) {
      for (let round = 0; round < 64; round++)
        f.system.shots.push({
          x: f.star.pos.x,
          y: f.star.pos.y,
          vx: 0,
          vy: 0,
          angle: 0,
        });
      f.step();
    }
    expect(f.system.events).toHaveLength(128);
    expect(
      f.system.events.some((event) => event.kind === "energy-release"),
    ).toBe(true);
  });
  it("freezes released energy and its event during pause and resets both on a fresh run", () => {
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
    sim.state.status = "PLAYING";
    sim.step(idle);
    expect(
      JSON.stringify({
        bodies: salvage.bodies,
        events: salvage.events,
        time: salvage.time,
      }),
    ).not.toBe(before);
    const fresh = new Simulation(settings);
    expect(fresh.salvage?.bodies).toHaveLength(0);
    expect(fresh.salvage?.events).toHaveLength(0);
  });
  it("sheds the selected pieces at damage thresholds and releases the rest only once", () => {
    const f = fixture(["laser"]);
    const wreck = body("wreck", 550, 400);
    f.system.bodies.push(wreck);
    const seen: number[] = [];
    for (let i = 0; i < 360 && wreck.hull > 0; i++) {
      f.step();
      for (const piece of f.system.bodies.filter(
        (b) => b.kind === "fragment",
      )) {
        if (!seen.includes(piece.shardIndex ?? -1))
          seen.push(piece.shardIndex ?? -1);
      }
      if (wreck.hull > 0)
        expect(f.system.bodies.some((b) => b.kind === "cell")).toBe(false);
    }
    expect(seen.slice(0, 3)).toEqual([0, 6, 3]);
    expect(seen.slice().sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(f.system.playerKills).toBe(1);
  });
  it.each(["star", "planet"] as const)(
    "destroys contained energy at a swept %s impact without scoring",
    (kind) => {
      const f = fixture();
      const planet = new Simulation(stockSettings()).planets[0];
      planet.pos.set(750, 650);
      planet.radius = 35;
      const hazard = kind === "star" ? f.star : planet;
      const wreck = body(
        "wreck",
        hazard.pos.x - hazard.radius - 100,
        hazard.pos.y,
        1,
        500,
        0,
      );
      wreck.releasedMask = 1;
      f.system.bodies.push(wreck);
      f.system.step(
        0.3,
        f.ship,
        f.star,
        f.resources,
        100,
        f.ship.pos.x,
        f.ship.pos.y,
        false,
        kind === "planet" ? [planet] : [],
      );
      expect(f.system.playerKills).toBe(0);
      expect(f.system.destroyed).toBe(0);
      expect(
        f.system.events.filter((e) => e.kind === "energy-release"),
      ).toHaveLength(0);
      expect(f.system.bodies.filter((b) => b.kind === "fragment")).toHaveLength(
        7,
      );
      expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(0);
      expect(wreck.x).toBeLessThan(hazard.pos.x - hazard.radius);
      f.system.step(
        STEP,
        f.ship,
        f.star,
        f.resources,
        100,
        f.ship.pos.x,
        f.ship.pos.y,
        false,
        kind === "planet" ? [planet] : [],
      );
      expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(0);
      expect(f.system.playerKills).toBe(0);
    },
  );
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
  it.each([
    { name: "rail before ram", start: 550, damage: 0 },
    { name: "ram before rail", start: 680, damage: 30 },
  ])("orders $name within the same step", ({ start, damage }) => {
    const f = fixture();
    const wreck = body("wreck", 500, 400, 1, -300, 0);
    f.system.bodies.push(wreck);
    f.system.shots.push({ x: start, y: 400, vx: -1000, vy: 0, angle: Math.PI });
    f.system.step(0.3, f.ship, f.star, f.resources, 100, 400, 400, false);
    expect(f.system.playerKills).toBe(1);
    expect(f.resources.hull).toBe(100 - damage);
  });
  it.each([
    { kind: "expiry", before: true },
    { kind: "expiry", before: false },
    { kind: "exit", before: true },
    { kind: "exit", before: false },
  ] as const)(
    "orders rail contact relative to $kind (before: $before)",
    ({ kind, before }) => {
      const f = fixture();
      const exit = kind === "exit";
      const wreck = body("wreck", exit ? 2100 : 700, 400, 1, 300, 0);
      wreck.life = exit ? 10 : 0.2;
      const shotX = (exit ? 2100 : 700) - (before ? 80 : 170);
      f.system.bodies.push(wreck);
      f.system.shots.push({ x: shotX, y: 400, vx: 1000, vy: 0, angle: 0 });
      f.system.step(0.3, f.ship, f.star, f.resources, 100, 400, 400, false);
      expect(f.system.playerKills).toBe(before ? 1 : 0);
      expect(f.system.bodies.filter((b) => b.kind === "cell")).toHaveLength(
        before ? 1 : 0,
      );
    },
  );
  it("charges for actual shots only, gates on the energy floor, and budgets defence first", () => {
    const f = fixture(["rail", "laser"]);
    f.system.bodies.push(body("wreck", 550, 400));
    const floor = 100 * WEAPONS.energyFloor;
    f.resources.power = floor - 0.1;
    f.step();
    expect(f.system.energySpent).toBe(0);
    // The laser draws first and leaves the rail under the floor.
    f.resources.power = floor + WEAPONS.laser.energy - 0.1;
    f.step();
    expect(f.system.laserPulses).toBe(1);
    expect(f.system.shotsFired).toBe(0);
    expect(f.resources.power).toBeCloseTo(floor - 0.1);
    f.step(10);
    expect(f.resources.power).toBeCloseTo(floor - 0.1);
    f.resources.power = 0;
    f.step(60);
    expect(f.resources.power).toBe(0);
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
    ).toBeLessThanOrEqual(8);
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
    expect(f.system.bodies[0].hull).toBe(85);
  });
  it("applies fragment damage and capped collection once, with cells immune to weapons", () => {
    const f = fixture();
    f.resources.power = 90;
    f.system.bodies.push(body("fragment", 400, 400), body("cell", 400, 400, 2));
    f.step(2);
    expect(f.resources).toEqual({ hull: 95, power: 100 });
    expect(f.system.events.some((event) => event.kind === "collision")).toBe(
      false,
    );
    expect(f.system.energyCollected).toBe(10);
    expect(f.system.bodies).toHaveLength(0);
    const armed = fixture(["rail", "laser"]);
    armed.system.bodies.push(body("cell", 550, 400));
    armed.step(60);
    expect(armed.system.energySpent).toBe(0);
    expect(armed.system.bodies).toHaveLength(1);
  });
  it("deals 30 on wreck contact with one shared impact plume, and never sweeps across a player wrap", () => {
    const f = fixture();
    f.system.bodies.push(body("wreck", 420, 400));
    f.step();
    expect(f.resources.hull).toBe(70);
    expect(f.system.destroyed).toBe(1);
    const plumes = f.system.events.filter(
      (event) => event.kind === "collision",
    );
    expect(plumes).toHaveLength(1);
    expect(plumes[0].x).toBeCloseTo(402.772, 2);
    expect(plumes[0].y).toBeCloseTo(397.743, 2);
    expect(
      f.system.bodies.filter((body) => body.kind === "fragment"),
    ).toHaveLength(8);
    expect(f.system.bodies.filter((body) => body.kind === "cell")).toHaveLength(
      1,
    );
    f.step();
    expect(f.system.destroyed).toBe(1);
    expect(
      f.system.events.filter((event) => event.kind === "collision"),
    ).toHaveLength(1);
    const wrapped = fixture();
    wrapped.system.bodies.push(body("cell", 960, 450));
    wrapped.resources.power = 40;
    wrapped.ship.pos.set(2140, 450);
    wrapped.system.step(
      STEP,
      wrapped.ship,
      wrapped.star,
      wrapped.resources,
      100,
      -220,
      450,
      true,
    );
    expect(wrapped.system.energyCollected).toBe(0);
  });
  it("ignores legacy sends in replay and isolates ordinary survival", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull = ["rail", "laser"];
    const settings = {
      ...stockSettings("fighter"),
      loadout,
      mode: "derelicts",
    };
    const a = new Simulation(settings),
      b = new Simulation(settings);
    a.start();
    b.start();
    const replay = [
      { ...idle, ticks: 180, sendDerelict: true },
      { ...idle, ticks: 180 },
    ];
    a.replay(replay);
    b.replay(replay);
    expect(a.salvage?.passes).toBe(1);
    expect(a.salvage).toEqual(b.salvage);
    expect(a.state).toEqual(b.state);
    const snapshot = JSON.stringify(a.salvage);
    a.state.status = "MENU";
    a.step({ ...idle, sendDerelict: true });
    expect(JSON.stringify(a.salvage)).toBe(snapshot);
    const reset = new Simulation(settings);
    expect(reset.salvage?.bodies).toHaveLength(0);
    expect(reset.salvage?.shotsFired).toBe(0);
    const survival = new Simulation({ ...settings, mode: "survival" });
    survival.start();
    survival.replay(replay);
    // Survival runs the encounter too, on its own schedule: one arrival so far.
    expect(survival.salvage?.passes).toBe(1);
    expect(survival.salvage?.nextPass).toBeGreaterThan(
      (survival.salvage?.time ?? 0) + 1,
    );
  });
});
