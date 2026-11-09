import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
import { WEAPONS } from "./schemas/salvage";
import { Simulation, STEP, stockSettings } from "./simulation";

type Kind = "light-ion-cannon" | "ion-point-defence" | "rail" | "laser";
const KINDS: Kind[] = [
  "light-ion-cannon",
  "ion-point-defence",
  "rail",
  "laser",
];

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
  describe.each(KINDS)("%s", (kind) => {
    describe.each([50, 100, 400])(
      "on a ship with %s energy capacity",
      (capacity) => {
        const floor = capacity * WEAPONS.energyFloor;
        it("does not fire, draw power or start a cooldown just under the floor", () => {
          const f = fixture(kind, capacity);
          f.resources.power = floor - 0.01;
          f.step(WINDOW);
          expect(f.system.energySpent).toBe(0);
          expect(f.resources.power).toBe(floor - 0.01);
          expect(f.weapon.readyAt).toBe(0);
          expect(f.system.events).toHaveLength(0);
          expect(f.system.shotsFired).toBe(0);
        });
        it("fires at exactly the floor", () => {
          const f = fixture(kind, capacity);
          f.resources.power = floor;
          f.step(WINDOW);
          expect(f.system.energySpent).toBeGreaterThan(0);
          expect(f.weapon.readyAt).toBeGreaterThan(0);
          expect(f.resources.power).toBeLessThan(floor);
        });
        it("fires again once the ship is back at the floor", () => {
          const f = fixture(kind, capacity);
          f.resources.power = floor - 0.01;
          f.step(WINDOW);
          f.resources.power = floor;
          f.step(WINDOW);
          expect(f.system.energySpent).toBeGreaterThan(0);
        });
      },
    );
  });
  it("is a fraction of capacity, so a larger ship has a proportionally larger floor", () => {
    const small = fixture("light-ion-cannon", 50);
    const large = fixture("light-ion-cannon", 400);
    // Enough for the small ship, under the large ship's floor.
    const power = 50 * WEAPONS.energyFloor;
    small.resources.power = power;
    large.resources.power = power;
    small.step(WINDOW);
    large.step(WINDOW);
    expect(small.system.energySpent).toBeGreaterThan(0);
    expect(large.system.energySpent).toBe(0);
  });
  it("reads the real build capacity through the simulation", () => {
    const loadout = defaultLoadout("fighter");
    loadout.hull[0] = "light-ion-cannon";
    loadout.hull[1] = "battery";
    const capacity = buildStats(loadout).capacity;
    expect(capacity).not.toBe(100);
    const floor = capacity * WEAPONS.energyFloor;
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
