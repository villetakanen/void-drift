import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { pirateLoadout, planPirate } from "./gauntlet";
import { liveShipBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };

describe("Gauntlet flight and combat", () => {
  it("uses a valid Scout fit and advances shared planet time once per world substep", () => {
    const loadout = pirateLoadout();
    expect(loadout.chassis).toBe("scout");
    expect(loadout.side).toBe("ion");
    expect(loadout.hull).toEqual(["ion-point-defence"]);
    expect(loadout.aft).toEqual(["light-ion-cannon"]);

    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: true,
      seed: 812,
    });
    sim.start();
    const before = sim.planets.map((planet) => planet.orbitAngle);
    sim.step(still);
    for (const [index, planet] of sim.planets.entries())
      expect(planet.orbitAngle - before[index]).toBeCloseTo(
        planet.orbitSpeed * STEP,
        8,
      );
  });

  it("keeps prediction deterministic and isolated from the live actor and world", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: true,
      seed: 913,
    });
    const pirate = sim.opponent;
    if (!pirate) throw new Error("Gauntlet must create its opponent");
    const actorBefore = {
      x: pirate.ship.pos.x,
      y: pirate.ship.pos.y,
      vx: pirate.ship.vel.x,
      vy: pirate.ship.vel.y,
      power: pirate.resources.power,
      timers: { ...pirate.engineTimers },
    };
    const planetsBefore = sim.planets.map((planet) => ({
      angle: planet.orbitAngle,
      x: planet.pos.x,
      y: planet.pos.y,
    }));
    const first = planPirate(
      pirate,
      sim.ship,
      sim.star,
      sim.planets,
      sim.settings.ion,
    );
    const second = planPirate(
      pirate,
      sim.ship,
      sim.star,
      sim.planets,
      sim.settings.ion,
    );
    expect(first).toEqual(second);
    expect(pirate.ship.pos.x).toBe(actorBefore.x);
    expect(pirate.ship.pos.y).toBe(actorBefore.y);
    expect(pirate.ship.vel.x).toBe(actorBefore.vx);
    expect(pirate.ship.vel.y).toBe(actorBefore.vy);
    expect(pirate.resources.power).toBe(actorBefore.power);
    expect(pirate.engineTimers).toEqual(actorBefore.timers);
    expect(
      sim.planets.map((planet) => ({
        angle: planet.orbitAngle,
        x: planet.pos.x,
        y: planet.pos.y,
      })),
    ).toEqual(planetsBefore);
  });

  it("uses the existing ion turret and cannon rules, and respects a world blocker", () => {
    const loadout = pirateLoadout();
    const system = new SalvageSystem(loadout, 19);
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const target = { ...ship, pos: new Vec2(150, 0), radius: 12 };
    const star = {
      ...new Simulation().star,
      pos: new Vec2(10000, 10000),
    };
    let damage = 0;
    const contact = () =>
      liveShipBody(900001, target, 100, (amount) => (damage += amount));
    for (let i = 0; i < 30; i++)
      system.stepWeapons(
        1 / 240,
        ship,
        star,
        { hull: 100, power: 100 },
        100,
        [],
        contact(),
      );
    expect(system.ionDischarges).toBeGreaterThan(0);
    expect(system.pointDefenceDischarges).toBeGreaterThan(0);
    expect(damage).toBeGreaterThan(0);

    const blocked = new SalvageSystem(loadout, 19);
    const blocker = { ...star, pos: new Vec2(75, 0), radius: 25 };
    let blockedDamage = 0;
    for (let i = 0; i < 30; i++)
      blocked.stepWeapons(
        1 / 240,
        ship,
        blocker,
        { hull: 100, power: 100 },
        100,
        [],
        liveShipBody(
          900001,
          target,
          100,
          (amount) => (blockedDamage += amount),
        ),
      );
    expect(blockedDamage).toBe(0);
    expect(blocked.ionDischarges).toBe(0);
  });

  it("keeps rail shots moving until their relative-motion contact", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "rail";
    const system = new SalvageSystem(loadout, 22);
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const target = {
      ...ship,
      pos: new Vec2(120, 0),
      vel: new Vec2(-300, 0),
      radius: 12,
    };
    const star = { ...new Simulation().star, pos: new Vec2(10000, 10000) };
    let damage = 0;
    for (let i = 0; i < 60; i++) {
      const previous = { x: target.pos.x, y: target.pos.y };
      target.pos.x += target.vel.x / 240;
      system.stepWeapons(
        1 / 240,
        ship,
        star,
        { hull: 100, power: 100 },
        100,
        [],
        liveShipBody(
          900001,
          target,
          100,
          (amount) => (damage += amount),
          previous,
        ),
      );
    }
    expect(system.shotsFired).toBeGreaterThan(0);
    expect(damage).toBe(100);
  });

  it("collects both existing weapon passes before applying same-substep damage", () => {
    const loadout = pirateLoadout();
    const playerWeapons = new SalvageSystem(loadout, 31);
    const pirateWeapons = new SalvageSystem(loadout, 32);
    const player = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const pirate = { ...player, pos: new Vec2(150, 0), rotation: Math.PI };
    const star = { ...new Simulation().star, pos: new Vec2(10000, 10000) };
    let playerDamage = 0;
    let pirateDamage = 0;
    const playerHull = 1;
    const pirateHull = 1;
    playerWeapons.stepWeapons(
      1 / 60,
      player,
      star,
      { hull: 100, power: 100 },
      100,
      [],
      liveShipBody(
        900001,
        pirate,
        pirateHull,
        (amount) => (pirateDamage += amount),
      ),
    );
    pirateWeapons.stepWeapons(
      1 / 60,
      pirate,
      star,
      { hull: 100, power: 100 },
      100,
      [],
      liveShipBody(
        900000,
        player,
        playerHull,
        (amount) => (playerDamage += amount),
      ),
    );
    expect(playerHull - playerDamage).toBeLessThanOrEqual(0);
    expect(pirateHull - pirateDamage).toBeLessThanOrEqual(0);
  });
});
