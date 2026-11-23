import { Vec2 } from "@void-drift/core";
import { describe, expect, it, vi } from "vitest";
import { weaponPose } from "./build-renderer";
import { derelictClosestPoint } from "./derelict-collision";
import { createStar } from "./game-loop";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { PLASMA_RIFLE, SALVAGE } from "./schemas/salvage";

const star = createStar("G", 1800, 1000);
const launchTime = 0.7;
const travelTime = PLASMA_RIFLE.streamLifetime;
const reach = PLASMA_RIFLE.streamReach;

function fixture(twins = false) {
  const loadout = defaultLoadout("wasp");
  loadout.hull = ["plasma-rifle", twins ? "plasma-rifle" : null];
  const system = new SalvageSystem(loadout, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const [weapon] = system.weapons;
  const muzzle = weaponPose(ship, weapon.mount);
  const resources = { hull: 100, power: 100 };
  const policy = { shooterId: 10 };
  const target = (id: number, x: number, y: number, speed = 0, radius = 3) =>
    liveShipBody(
      id,
      { ...ship, pos: new Vec2(x, y), radius, vel: new Vec2(0, speed) },
      300,
      vi.fn(),
    );
  const trigger = target(11, muzzle.muzzleX + 100, muzzle.muzzleY);
  function step(dt: number, roster: readonly SalvageBody[] = [trigger]) {
    system.stepWeapons(
      dt,
      ship,
      star,
      resources,
      100,
      [],
      roster,
      undefined,
      policy,
    );
  }
  return { system, ship, muzzle, target, trigger, step };
}

describe("plasma eruption damage", () => {
  it("bursts at full reach in the release ship's frame, unaffected by later steering", () => {
    const f = fixture();
    f.ship.vel.set(30, -12);
    f.step(launchTime);
    f.step(travelTime / 2, []);
    expect(f.system.plasmaBurstEvents).toEqual([]);
    f.ship.vel.set(-50, 100);
    f.ship.rotation = Math.PI;
    f.step(travelTime / 2, []);
    expect(f.system.plasmaStreams).toEqual([]);
    expect(f.system.plasmaContacts).toBe(0);
    expect(f.system.plasmaAirbursts).toBe(1);
    const [burst] = f.system.plasmaBurstEvents;
    expect(burst).toMatchObject({
      outcome: "airburst",
      bodyId: null,
      mountKey: f.system.weapons[0].mount.key,
    });
    expect(burst.x).toBeCloseTo(f.muzzle.muzzleX + reach + 30 * travelTime, 8);
    expect(burst.y).toBeCloseTo(f.muzzle.muzzleY - 12 * travelTime, 8);
    f.step(travelTime, []);
    expect(f.system.plasmaBurstEvents).toEqual([]);
    expect(f.system.plasmaAirbursts).toBe(1);
  });

  it("applies one inclusive nearest-surface band and excludes the emitter and pickups", () => {
    const f = fixture();
    f.step(launchTime);
    const x = f.muzzle.muzzleX + reach;
    const y = f.muzzle.muzzleY;
    const bands = PLASMA_RIFLE.blastBands;
    const cases = bands.flatMap(({ radius, damage }, index) => [
      { distance: radius, damage },
      { distance: radius + 0.001, damage: bands[index + 1]?.damage ?? 0 },
    ]);
    const ships = cases.map(({ distance }, index) =>
      f.target(20 + index, x, y + distance + 3),
    );
    const emitter = f.target(10, x, y + 5);
    const pickup = { ...f.target(29, x, y + 5), kind: "cell" as const };
    const roster = [...ships, emitter, pickup];
    f.step(travelTime, roster);
    for (const [index, { damage }] of cases.entries()) {
      const ship = ships[index];
      expect(ship.hull).toBe(300 - damage);
      if (damage) expect(ship.onDamage).toHaveBeenCalledExactlyOnceWith(damage);
      else expect(ship.onDamage).not.toHaveBeenCalled();
    }
    expect(emitter.onDamage).not.toHaveBeenCalled();
    expect(pickup.onDamage).not.toHaveBeenCalled();
    f.step(travelTime, roster);
    expect(ships.map(({ hull }) => hull)).toEqual(
      cases.map(({ damage }) => 300 - damage),
    );
  });

  it("samples surrounding ship motion at eruption rather than at either substep boundary", () => {
    const f = fixture();
    f.step(launchTime);
    const x = f.muzzle.muzzleX + reach;
    const y = f.muzzle.muzzleY;
    const approaching = f.target(20, x, y + 18 + 2200 * travelTime, -2200);
    const leaving = f.target(21, x, y + 5, 3000);
    f.step(0.06, [approaching, leaving]);
    expect(approaching.hull).toBe(250);
    expect(leaving.hull).toBe(300);
    expect(f.system.plasmaAirbursts).toBe(1);
  });

  it("erupts on the first intercepting surface and spends that discharge once", () => {
    const f = fixture();
    f.step(launchTime);
    const y = f.muzzle.muzzleY;
    const intercept = f.target(20, f.muzzle.muzzleX + 48, y);
    const neighbor = f.target(21, f.muzzle.muzzleX + 45, y + 23);
    f.step(travelTime, [f.trigger, intercept, neighbor]);
    expect(f.system.plasmaContacts).toBe(1);
    expect(f.system.plasmaAirbursts).toBe(0);
    const [burst] = f.system.plasmaBurstEvents;
    expect(burst).toMatchObject({ outcome: "material", bodyId: intercept.id });
    expect(burst.x).toBeCloseTo(f.muzzle.muzzleX + 45, 8);
    expect(intercept.onDamage).toHaveBeenCalledExactlyOnceWith(75);
    expect(neighbor.onDamage).toHaveBeenCalledExactlyOnceWith(50);
    expect(f.trigger.onDamage).not.toHaveBeenCalled();
    f.step(travelTime, [f.trigger, intercept, neighbor]);
    expect(f.system.plasmaContacts).toBe(1);
    expect(f.system.plasmaBurstEvents).toEqual([]);
  });

  it("applies an earlier twin eruption before tracing a later head in the same substep", () => {
    const f = fixture(true);
    const [first, second] = f.system.weapons;
    const secondMuzzle = weaponPose(f.ship, second.mount);
    f.step(launchTime, [
      f.trigger,
      f.target(12, secondMuzzle.muzzleX + 100, secondMuzzle.muzzleY),
    ]);
    expect(f.system.plasmaReleases).toBe(2);

    const laterSurface = f.target(20, f.muzzle.muzzleX + 92, f.muzzle.muzzleY);
    laterSurface.hull = 20;
    const earlierSurface = f.target(
      21,
      secondMuzzle.muzzleX + 70,
      secondMuzzle.muzzleY,
    );
    const roster = [laterSurface, earlierSurface];
    const substep = travelTime / 4;
    f.step(substep * 2, roster);
    expect(f.system.plasmaContacts).toBe(0);
    f.step(substep, roster);
    expect(laterSurface.hull).toBe(0);
    expect(f.system.plasmaContacts).toBe(1);
    expect(f.system.plasmaBurstEvents).toMatchObject([
      {
        mountKey: second.mount.key,
        outcome: "material",
        bodyId: earlierSurface.id,
      },
    ]);
    f.step(substep, roster);
    expect(f.system.plasmaBurstEvents).toMatchObject([
      { mountKey: first.mount.key, outcome: "airburst", bodyId: null },
    ]);
  });

  it("uses wreck polygons, then excludes fragments born from the same eruption", () => {
    const f = fixture();
    f.step(launchTime);
    const point = { x: f.muzzle.muzzleX + reach, y: f.muzzle.muzzleY };
    const wreck = {
      kind: "wreck" as const,
      id: 54,
      group: 54,
      x: point.x,
      y: point.y + 70,
      previousX: point.x,
      previousY: point.y + 70,
      vx: 0,
      vy: 0,
      radius: 60,
      hull: 45,
      life: 10,
      rotation: 0,
      spin: 0,
    };
    const { distance } = derelictClosestPoint(wreck, point);
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(26);
    f.system.bodies.push(wreck);
    f.step(travelTime, []);
    expect(f.system.plasmaAirbursts).toBe(1);
    expect(wreck.hull).toBe(0);
    const fragments = f.system.bodies.filter(({ kind }) => kind === "fragment");
    expect(fragments).toHaveLength(SALVAGE.fragment.count);
    expect(fragments.every(({ hull }) => hull === SALVAGE.fragment.hull)).toBe(
      true,
    );
  });
});
