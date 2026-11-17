import { Vec2 } from "@void-drift/core";
import { describe, expect, it, vi } from "vitest";
import * as gauntlet from "./gauntlet";
import { pirateLoadout, planPirate } from "./gauntlet";
import { liveShipBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };

describe("Gauntlet flight and combat", () => {
  it("owns two independent identical pirates and keeps going after only one dies", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: true,
      seed: 73,
    });
    expect(sim.opponents).toHaveLength(2);
    expect(sim.opponents.map((actor) => actor.id)).toEqual([
      "pirate-1",
      "pirate-2",
    ]);
    expect(sim.opponents[0].loadout).toEqual(sim.opponents[1].loadout);
    expect(sim.opponents[0].ship).not.toBe(sim.opponents[1].ship);
    expect(sim.opponents[0].resources).not.toBe(sim.opponents[1].resources);
    expect(sim.opponents[0].combat).not.toBe(sim.opponents[1].combat);
    for (const pirate of sim.opponents)
      expect(
        Math.hypot(
          pirate.ship.pos.x - sim.ship.pos.x,
          pirate.ship.pos.y - sim.ship.pos.y,
        ),
      ).toBeGreaterThan(100);
    expect(
      Math.hypot(
        sim.opponents[0].ship.pos.x - sim.opponents[1].ship.pos.x,
        sim.opponents[0].ship.pos.y - sim.opponents[1].ship.pos.y,
      ),
    ).toBeGreaterThan(100);
    sim.start();
    sim.opponents[0].resources.hull = 0;
    sim.step(still);
    expect(sim.opponents[0].lifecycle).toBe("destroyed");
    expect(sim.opponents[1].lifecycle).not.toBe("destroyed");
    expect(sim.gauntletResult).toBeNull();
    sim.opponents[1].resources.hull = 0;
    sim.step(still);
    expect(sim.gauntletResult?.winner).toBe("player");
  });

  it("has both independent pilots choose plans against the same player", () => {
    const pilot = vi.spyOn(gauntlet, "planPirate");
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: true,
      seed: 74,
    });
    sim.start();
    for (let tick = 0; tick < 12; tick++) sim.step(still);
    const calls = pilot.mock.calls.filter(
      (args) => args[0] === sim.opponents[0] || args[0] === sim.opponents[1],
    );
    expect(calls).toHaveLength(2);
    expect(
      calls
        .map(([actor, target]) => [actor.id, target])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual([
      ["pirate-1", sim.ship],
      ["pirate-2", sim.ship],
    ]);
    pilot.mockRestore();
  });

  it("allows a lethal facing exchange to resolve as same-substep mutual destruction", () => {
    const sim = new Simulation({
      ...gameSettings("scout"),
      loadout: pirateLoadout(),
      mode: "gauntlet",
      arrival: false,
      seed: 75,
    });
    sim.start();
    sim.star.pos.set(10000, 10000);
    sim.planets.splice(0);
    const [alreadyDestroyed, pirate] = sim.opponents;
    alreadyDestroyed.resources.hull = 0;
    alreadyDestroyed.lifecycle = "destroyed";
    pirate.lifecycle = "active";
    sim.ship.pos.set(780, 700);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    sim.state.resources.hull = 1;
    pirate.ship.pos.set(900, 700);
    pirate.ship.vel.set(0, 0);
    pirate.ship.rotation = Math.PI;
    pirate.resources.hull = 1;
    for (const weapon of [
      ...(sim.salvage?.weapons ?? []),
      ...pirate.combat.weapons,
    ]) {
      weapon.readyAt = weapon.kind === "light-ion-cannon" ? 0 : Infinity;
      weapon.angle = 0;
    }
    sim.step(still);
    expect(sim.salvage?.ionDischarges).toBeGreaterThan(0);
    expect(pirate.combat.ionDischarges).toBeGreaterThan(0);
    expect(sim.gauntletResult?.winner).toBe("mutual");
    expect(sim.state.status).toBe("GAME_OVER");
    expect(sim.state.resources.hull).toBe(0);
    expect(pirate.resources.hull).toBe(0);
  });

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
    const actorsBefore = sim.opponents.map((pirate) => ({
      pos: { x: pirate.ship.pos.x, y: pirate.ship.pos.y },
      vel: { x: pirate.ship.vel.x, y: pirate.ship.vel.y },
      resources: { ...pirate.resources },
      timers: { ...pirate.engineTimers },
      angularMotion: { ...pirate.angularMotion },
      engineOutput: structuredClone(pirate.engineOutput),
      weapons: structuredClone(pirate.combat.weapons),
      weaponEvents: structuredClone(pirate.weaponEvents),
      emitters: pirate.emitters.map(({ output, thrustSeconds, charge }) => ({
        output,
        thrustSeconds,
        charge,
      })),
    }));
    const playerBefore = {
      x: sim.ship.pos.x,
      y: sim.ship.pos.y,
      vx: sim.ship.vel.x,
      vy: sim.ship.vel.y,
    };
    const planetsBefore = sim.planets.map((planet) => ({
      angle: planet.orbitAngle,
      x: planet.pos.x,
      y: planet.pos.y,
    }));
    const plans = sim.opponents.map((pirate) =>
      planPirate(pirate, sim.ship, sim.star, sim.planets, sim.settings.ion),
    );
    expect(
      sim.opponents.map((pirate) =>
        planPirate(pirate, sim.ship, sim.star, sim.planets, sim.settings.ion),
      ),
    ).toEqual(plans);
    expect(
      sim.opponents.map((pirate) => ({
        pos: { x: pirate.ship.pos.x, y: pirate.ship.pos.y },
        vel: { x: pirate.ship.vel.x, y: pirate.ship.vel.y },
        resources: pirate.resources,
        timers: pirate.engineTimers,
        angularMotion: pirate.angularMotion,
        engineOutput: pirate.engineOutput,
        weapons: pirate.combat.weapons,
        weaponEvents: pirate.weaponEvents,
        emitters: pirate.emitters.map(({ output, thrustSeconds, charge }) => ({
          output,
          thrustSeconds,
          charge,
        })),
      })),
    ).toEqual(actorsBefore);
    expect({
      x: sim.ship.pos.x,
      y: sim.ship.pos.y,
      vx: sim.ship.vel.x,
      vy: sim.ship.vel.y,
    }).toEqual(playerBefore);
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

  it("lets a pirate hit an allied blocker while aiming at the player", () => {
    const system = new SalvageSystem(pirateLoadout(), 191);
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const player = { ...ship, pos: new Vec2(150, 0), radius: 12 };
    const ally = { ...ship, pos: new Vec2(75, 0), radius: 12 };
    const star = { ...new Simulation().star, pos: new Vec2(10000, 10000) };
    let playerDamage = 0,
      allyDamage = 0;
    const playerTarget = liveShipBody(900000, player, 100, (amount) => {
      playerDamage += amount;
    });
    const allyTarget = liveShipBody(900001, ally, 100, (amount) => {
      allyDamage += amount;
    });
    for (let tick = 0; tick < 30; tick++)
      system.stepWeapons(
        1 / 240,
        ship,
        star,
        { hull: 100, power: 100 },
        100,
        [],
        [playerTarget, allyTarget],
        [playerTarget],
      );
    expect(allyDamage).toBeGreaterThan(0);
    expect(playerDamage).toBe(0);
  });

  it("keeps the pirate turret's target on the player while the ally is closer", () => {
    const system = new SalvageSystem(pirateLoadout(), 192);
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const player = { ...ship, pos: new Vec2(150, 0), radius: 12 };
    const ally = { ...ship, pos: new Vec2(75, 0), radius: 12 };
    const playerTarget = liveShipBody(900000, player, 100, () => {});
    const allyTarget = liveShipBody(900001, ally, 100, () => {});
    system.stepWeapons(
      1 / 240,
      ship,
      { ...new Simulation().star, pos: new Vec2(10000, 10000) },
      { hull: 100, power: 100 },
      100,
      [],
      [playerTarget, allyTarget],
      [playerTarget],
    );
    expect(
      system.weapons.find((weapon) => weapon.kind === "ion-point-defence")
        ?.target,
    ).toBe(900000);
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
