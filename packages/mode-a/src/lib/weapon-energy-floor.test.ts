import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
import { ION_CANNON, POINT_DEFENCE, WEAPONS } from "./schemas/salvage";
import { Simulation, STEP, stockSettings } from "./simulation";
import { PLAYER_BODY_ID } from "./targeting";

type Kind = "light-ion-cannon" | "ion-point-defence" | "laser";
const KINDS: Kind[] = ["light-ion-cannon", "ion-point-defence", "laser"];

function fixture(kind: Kind, capacity: number) {
  const loadout = defaultLoadout("fighter");
  loadout.hull[0] = kind;
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
  const resources = { power: capacity, hull: 100 };
  // Ahead of the ship, in reach and in line of every weapon's fixed or tracked aim.
  const target: SalvageBody = {
    id: 1,
    group: 1,
    kind: "wreck",
    x: 450,
    y: 400,
    previousX: 450,
    previousY: 400,
    vx: 0,
    vy: 0,
    radius: 18,
    hull: 100000,
    life: 1000,
    rotation: 0,
  };
  system.bodies.push(target);
  const weapon = system.weapons[0];
  const step = (n: number) => {
    for (let i = 0; i < n; i++)
      system.step(
        STEP,
        ship,
        star,
        resources,
        capacity,
        ship.pos.x,
        ship.pos.y,
        false,
        [],
      );
  };
  return { system, resources, weapon, step };
}

// Long enough for a tracking weapon to turn onto the target.
const WINDOW = 40;

describe("Weapon energy floor", () => {
  it.each(KINDS)(
    "%s stays silent just under the floor and at the exact debit threshold",
    (kind) => {
      const capacity = 100;
      const floor =
        WEAPONS.reserve +
        {
          "light-ion-cannon": ION_CANNON,
          "ion-point-defence": POINT_DEFENCE,
          laser: WEAPONS.laser,
        }[kind].energy;
      const under = fixture(kind, capacity);
      under.resources.power = floor - 0.01;
      under.step(WINDOW);
      expect(under.system.energySpent).toBe(0);
      expect(under.resources.power).toBe(floor - 0.01);
      expect(under.weapon.readyAt).toBe(0);
      const at = fixture(kind, capacity);
      at.resources.power = floor;
      at.step(WINDOW);
      expect(at.system.energySpent).toBe(0);
    },
  );
  it("uses the same debit threshold on ships of every capacity", () => {
    const small = fixture("light-ion-cannon", 50);
    const large = fixture("light-ion-cannon", 400);
    // Only enough to fund one shot on either ship.
    const power = 10.21;
    small.resources.power = power;
    large.resources.power = power;
    small.step(WINDOW);
    large.step(WINDOW);
    expect(small.system.energySpent).toBeGreaterThan(0);
    expect(large.system.energySpent).toBe(ION_CANNON.energy);
    expect(large.resources.power).toBeCloseTo(10.01);
  });
  it("holds every launcher at equality and charges only mounts the carrier can release", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull.fill("drone-launcher");
    loadout.aft.fill("drone-launcher");
    const system = new SalvageSystem(LoadoutSchema.parse(loadout), 21);
    const ship = {
      pos: new Vec2(400, 400),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 20,
    };
    const star = createStar("G", 1800, 1000);
    const enemy = liveShipBody(
      2,
      { ...ship, pos: new Vec2(650, 400) },
      100,
      () => {},
    );
    let airborne = 0;
    system.launchDrone = (_ship, _mount, targetId) => {
      expect(targetId).toBe(enemy.id);
      if (airborne === 3) return false;
      airborne++;
      return true;
    };
    const resources = { power: 12, hull: 100 };
    const step = (allowFire = true) =>
      system.stepWeapons(
        STEP / 4,
        ship,
        star,
        resources,
        200,
        [],
        [enemy],
        undefined,
        { shooterId: PLAYER_BODY_ID },
        undefined,
        undefined,
        allowFire,
      );
    expect(system.weaponsEnergyEmergency(11.99)).toBe(true);
    expect(system.weaponsEnergyEmergency(12)).toBe(false);
    step();
    expect(airborne).toBe(0);
    resources.power = 100;
    step(false);
    expect(airborne).toBe(0);
    step();
    expect(airborne).toBe(3);
    expect(resources.power).toBe(94);
    expect(system.weapons.map((mount) => mount.readyAt)).toEqual([
      system.time + 3,
      system.time + 3,
      system.time + 3,
      0,
    ]);
    airborne--;
    step();
    expect(airborne).toBe(3);
    expect(resources.power).toBe(92);
    expect(system.weapons[3].readyAt).toBe(system.time + 3);
    airborne = 0;
    // One substep has elapsed since the first three mounts fired.
    for (let i = 1; i < 3 / (STEP / 4) - 1; i++) step();
    expect(airborne).toBe(0);
    step();
    expect(airborne).toBe(3);
    expect(resources.power).toBe(86);
  });
  it("reads the real build capacity through the simulation", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "light-ion-cannon";
    loadout.hull[1] = "battery";
    const capacity = buildStats(loadout).capacity;
    expect(capacity).not.toBe(100);
    const floor = WEAPONS.reserve + ION_CANNON.energy;
    const run = (power: number) => {
      const sim = new Simulation({
        ...stockSettings(),
        loadout,
        mode: "derelicts",
      });
      const salvage = sim.salvage;
      if (!salvage) throw new Error("Missing salvage system");
      salvage.nextPass = Infinity;
      sim.start();
      const { pos, rotation } = sim.ship;
      salvage.bodies.push({
        id: 1,
        group: 1,
        kind: "wreck",
        x: pos.x + Math.cos(rotation) * 100,
        y: pos.y + Math.sin(rotation) * 100,
        previousX: pos.x,
        previousY: pos.y,
        vx: 0,
        vy: 0,
        radius: 18,
        hull: 100000,
        life: 1000,
        rotation: 0,
      });
      // Engines and life support still draw below the floor, so keep clear margins.
      sim.state.resources.power = power;
      sim.step({ leftThruster: false, rightThruster: false, fire: false });
      return salvage;
    };
    expect(run(floor - 0.5).energySpent).toBe(0);
    expect(run(floor + 0.5).energySpent).toBeGreaterThan(0);
  });
});
