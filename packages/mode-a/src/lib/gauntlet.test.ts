import { Vec2 } from "@void-drift/core";
import { describe, expect, it, vi } from "vitest";
import * as gauntlet from "./gauntlet";
import { pirateLoadout, planPirate } from "./gauntlet";
import { liveShipBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };

function ionCombatLoadout() {
  const loadout = defaultLoadout("scout");
  loadout.hull[0] = "ion-point-defence";
  loadout.aft[0] = "light-ion-cannon";
  return loadout;
}

describe("Gauntlet flight and combat", () => {
  it("issues seven independent enemies on the seeded ten-second schedule", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: true,
      seed: 73,
    });
    expect(sim.opponents).toHaveLength(1);
    expect(sim.opponents.map((actor) => actor.id)).toEqual(["pirate-1"]);
    sim.start();
    sim.opponents[0].resources.hull = 0;
    sim.step(still);
    expect(sim.opponents[0].lifecycle).toBe("destroyed");
    expect(sim.gauntletResult).toBeNull();
    for (let wave = 2; wave <= 7; wave++) {
      sim.ticks = (wave - 1) * 600 - 2;
      sim.step(still);
      expect(sim.opponents).toHaveLength(wave - 1);
      sim.step(still);
      expect(sim.opponents).toHaveLength(wave);
      expect(sim.opponents[wave - 1].id).toBe(`pirate-${wave}`);
      sim.opponents[wave - 1].resources.hull = 0;
    }
    expect(new Set(sim.opponents.map((actor) => actor.combat)).size).toBe(7);
    sim.opponents.slice(1).forEach((actor) => {
      actor.resources.hull = 0;
    });
    sim.step(still);
    expect(sim.gauntletResult?.winner).toBe("player");
  });

  it("freezes the schedule while stopped and reproduces cleared arrivals", () => {
    const make = () =>
      new Simulation({
        ...gameSettings("fighter"),
        mode: "gauntlet",
        arrival: false,
        seed: 231,
      });
    const a = make(),
      b = make();
    for (const sim of [a, b]) {
      sim.ticks = 599;
      sim.step(still);
      expect(sim.opponents).toHaveLength(1);
      sim.start();
      sim.step(still);
      expect(sim.opponents).toHaveLength(2);
      const spawn = sim.opponents[1].ship;
      expect(
        Math.hypot(spawn.pos.x - sim.ship.pos.x, spawn.pos.y - sim.ship.pos.y),
      ).toBeGreaterThan(spawn.radius + sim.ship.radius);
    }
    expect(a.opponents[1].ship.pos).toEqual(b.opponents[1].ship.pos);
  });

  it("lets an approaching pirate fire during the player opening lock", () => {
    const sim = new Simulation({
      ...gameSettings("scout"),
      loadout: ionCombatLoadout(),
      mode: "gauntlet",
      arrival: true,
      seed: 75,
    });
    sim.star.pos.set(10000, 10000);
    sim.planets.splice(0);
    sim.ship.pos.set(2140, 540);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = Math.PI;
    const pirate = sim.opponents[0];
    pirate.ship.pos.set(2020, 540);
    pirate.ship.vel.set(0, 0);
    pirate.ship.rotation = 0;
    pirate.lifecycle = "arriving";
    pirate.loadout = ionCombatLoadout();
    pirate.combat = new SalvageSystem(pirate.loadout, 75);
    pirate.weapons = pirate.combat.weapons;
    const playerWeapons = sim.salvage;
    if (!playerWeapons) throw new Error("Expected a fitted player");
    for (const weapon of [...playerWeapons.weapons, ...pirate.weapons]) {
      weapon.readyAt = weapon.kind === "light-ion-cannon" ? 0 : Infinity;
      weapon.angle = 0;
    }
    sim.start();
    sim.step(still);
    expect(playerWeapons.ionDischarges).toBe(0);
    expect(pirate.combat.ionDischarges).toBeGreaterThan(0);
    expect(sim.state.resources.hull).toBeLessThan(100);
    sim.ship.pos.set(2000, 540);
    pirate.ship.pos.set(1880, 540);
    sim.step(still);
    expect(playerWeapons.ionDischarges).toBeGreaterThan(0);
  });

  it("suppresses recovery fire while advancing emitted plasma", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      arrival: false,
    });
    sim.star.pos.set(10000, 10000);
    sim.planets.length = 0;
    const pirate = sim.opponents[0];
    pirate.resources.power = 1;
    const fire = vi.spyOn(pirate.combat, "stepWeapons");
    const streams = vi.spyOn(pirate.combat, "stepPlasmaStreams");
    sim.start();
    sim.step(still);
    expect(pirate.objective).toBe("recover");
    expect(fire).not.toHaveBeenCalled();
    expect(streams).toHaveBeenCalledTimes(4);
    expect(pirate.combat.time).toBeCloseTo(STEP);
  });

  it("assigns every active pilot a distinct planning tick", () => {
    const pilot = vi.spyOn(gauntlet, "planPirate").mockReturnValue({
      command: gauntlet.NO_PILOT_COMMAND,
      horizonSeconds: 0,
      candidateCount: 0,
      score: 0,
      path: [],
    });
    try {
      const sim = new Simulation({
        ...gameSettings("fighter"),
        mode: "gauntlet",
        arrival: false,
      });
      sim.star.pos.set(10000, 10000);
      sim.planets.length = 0;
      sim.start();
      for (let wave = 2; wave <= 7; wave++) {
        sim.ticks = (wave - 1) * 600 - 1;
        sim.step(still);
      }
      sim.opponents.forEach((actor, index) => {
        actor.lifecycle = "active";
        actor.ship.pos.set(300 + index * 150, 400);
        actor.ship.vel.set(0, 0);
      });
      sim.ship.pos.set(1500, 800);
      pilot.mockClear();
      sim.ticks = 0;
      for (let tick = 0; tick < 8; tick++) {
        const before = pilot.mock.calls.length;
        sim.step(still);
        expect(pilot.mock.calls.length - before).toBeLessThanOrEqual(1);
      }
      expect(new Set(pilot.mock.calls.map(([actor]) => actor.id)).size).toBe(7);
    } finally {
      pilot.mockRestore();
    }
  });

  it("has the opening pilot choose a plan against the player", () => {
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
      (args) => args[0] === sim.opponents[0],
    );
    expect(calls).toHaveLength(1);
    expect(
      calls
        .map(([actor, target]) => [actor.id, target])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual([["pirate-1", sim.ship]]);
    pilot.mockRestore();
  });

  it("allows a lethal facing exchange to resolve as same-substep mutual destruction", () => {
    const sim = new Simulation({
      ...gameSettings("scout"),
      loadout: ionCombatLoadout(),
      mode: "gauntlet",
      arrival: false,
      seed: 75,
    });
    sim.start();
    sim.star.pos.set(10000, 10000);
    sim.planets.splice(0);
    for (let wave = 2; wave <= 7; wave++) {
      sim.opponents[wave - 2].resources.hull = 0;
      sim.opponents[wave - 2].lifecycle = "destroyed";
      sim.ticks = (wave - 1) * 600 - 1;
      sim.step(still);
    }
    const pirate = sim.opponents[6];
    pirate.lifecycle = "active";
    sim.ship.pos.set(780, 700);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    sim.state.resources.hull = 1;
    pirate.ship.pos.set(900, 700);
    pirate.ship.vel.set(0, 0);
    pirate.ship.rotation = Math.PI;
    pirate.resources.hull = 1;
    pirate.loadout = ionCombatLoadout();
    pirate.combat = new SalvageSystem(pirate.loadout, 75);
    pirate.weapons = pirate.combat.weapons;
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
    expect(loadout.hull).toEqual(["plasma-rifle"]);
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

  it("predicts the remaining sideways flight after an arena wrap", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      seed: 812,
    });
    const actor = sim.opponents[0];
    actor.ship.pos.set(960 + 1180, 540);
    actor.ship.vel.set(475, 365);
    actor.ship.rotation = Math.atan2(365, 475) + Math.PI / 2;
    const plan = planPirate(actor, sim.ship, sim.star, [], sim.settings.ion);
    for (let step = 0; step < 48; step++) {
      gauntlet.stepGauntletActor(
        actor,
        plan.command,
        1 / 240,
        sim.star,
        [],
        sim.settings.ion,
      );
    }
    const predicted = plan.path[1]; // First 0.2-second waypoint
    expect(actor.ship.pos.x).toBeLessThan(960);
    expect(
      Math.hypot(
        actor.ship.pos.x - predicted.x,
        actor.ship.pos.y - predicted.y,
      ),
    ).toBeLessThan(actor.ship.radius);
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
    const loadout = ionCombatLoadout();
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
    const system = new SalvageSystem(ionCombatLoadout(), 191);
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
    const selfTarget = liveShipBody(900002, ship, 100, () => {
      throw new Error("shooter hit itself");
    });
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
        [selfTarget, playerTarget, allyTarget],
        undefined,
        { shooterId: 900002, aimId: 900000 },
      );
    expect(allyDamage).toBeGreaterThan(0);
    expect(playerDamage).toBe(0);
  });

  it("keeps the pirate turret's target on the player while the ally is closer", () => {
    const system = new SalvageSystem(ionCombatLoadout(), 192);
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const player = { ...ship, pos: new Vec2(150, 0), radius: 12 };
    const ally = { ...ship, pos: new Vec2(75, 0), radius: 12 };
    const selfTarget = liveShipBody(900002, ship, 100, () => {
      throw new Error("shooter hit itself");
    });
    const playerTarget = liveShipBody(900000, player, 100, () => {});
    const allyTarget = liveShipBody(900001, ally, 100, () => {});
    system.stepWeapons(
      1 / 240,
      ship,
      { ...new Simulation().star, pos: new Vec2(10000, 10000) },
      { hull: 100, power: 100 },
      100,
      [],
      [selfTarget, playerTarget, allyTarget],
      undefined,
      { shooterId: 900002, aimId: 900000 },
    );
    expect(
      system.weapons.find((weapon) => weapon.kind === "ion-point-defence")
        ?.target,
    ).toBe(900000);
    system.stepWeapons(
      1 / 240,
      ship,
      { ...new Simulation().star, pos: new Vec2(10000, 10000) },
      { hull: 100, power: 100 },
      100,
      [],
      [allyTarget],
    );
    expect(
      system.weapons.find((weapon) => weapon.kind === "ion-point-defence")
        ?.target,
    ).toBe(900001);
  });

  it("keeps saved rail fittings inert against a live ship", () => {
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
    expect(system.weapons).toHaveLength(0);
    expect(system.shotsFired).toBe(0);
    expect(damage).toBe(0);
    expect(ship.vel.x).toBe(0);
  });

  it("collects both existing weapon passes before applying same-substep damage", () => {
    const loadout = ionCombatLoadout();
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
