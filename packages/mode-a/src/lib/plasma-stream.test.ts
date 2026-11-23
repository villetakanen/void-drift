import { type Planet, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { buildCollisionRadius, weaponPose } from "./build-renderer";
import { castDerelict, getDerelictWorldPolygons } from "./derelict-collision";
import { createStar } from "./game-loop";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const substep = STEP / 4;
const still = { leftThruster: false, rightThruster: false, fire: false };
const distantStar = createStar("G", 1800, 1000);
const fighter = defaultLoadout("fighter");
fighter.aft[0] = "plasma-rifle";
const waspRadius = buildCollisionRadius(defaultLoadout("wasp"));

function material(
  id: number,
  kind: "wreck" | "fragment",
  x: number,
  y: number,
): SalvageBody {
  return {
    id,
    group: id,
    kind,
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    hull: 100,
    radius: 60,
    rotation: 0,
  };
}

function fixture() {
  const system = new SalvageSystem(fighter, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: buildCollisionRadius(fighter),
  };
  const resources = { hull: 100, power: 100 };
  const [rifle] = system.weapons;
  const muzzle = weaponPose(ship, rifle.mount);
  function target(id: number, forward: number, side = 0, vy = 0) {
    return liveShipBody(
      id,
      {
        ...ship,
        pos: new Vec2(muzzle.muzzleX + forward, muzzle.muzzleY + side),
        vel: new Vec2(0, vy),
        radius: waspRadius,
      },
      100,
      () => {},
    );
  }
  const wasp = target(20, 105);
  function step(
    dt = substep,
    roster: readonly SalvageBody[] = [wasp],
    star = distantStar,
    planets: readonly Planet[] = [],
  ) {
    system.stepWeapons(dt, ship, star, resources, 100, planets, roster);
  }
  return { system, ship, rifle, muzzle, wasp, target, step };
}

describe("plasma stream travel and first contact", () => {
  it("launches from the Fighter muzzle with inherited velocity and uses the remainder of its release substep", () => {
    const f = fixture();
    f.ship.vel.set(20, -10);
    f.step(0.699);
    f.step(0.011);
    expect(f.system.plasmaReleases).toBe(1);
    expect(f.system.plasmaStreams).toHaveLength(1);
    const [head] = f.system.plasmaStreams;
    expect(head.mountKey).toBe(f.rifle.mount.key);
    expect(head.launchTime).toBeCloseTo(0.7, 9);
    expect(head.age).toBeCloseTo(0.01, 9);
    expect(head.vy).toBeCloseTo(-10, 9);
    expect(head.y).toBeCloseTo(f.muzzle.muzzleY - 0.1, 9);
  });

  it("records a moving fragment that crosses between samples after a Fighter releases at a held Wasp", () => {
    const f = fixture();
    f.step(0.7);
    expect(f.rifle.target).toBe(f.wasp.id);
    f.step(0.004);
    const [head] = f.system.plasmaStreams;
    const [piece] = getDerelictWorldPolygons({
      kind: "fragment",
      rotation: 0,
      x: 0,
      y: 0,
      shardIndex: 0,
    });
    const offsetX = piece.reduce((sum, p) => sum + p.x, 0) / piece.length;
    const offsetY = piece.reduce((sum, p) => sum + p.y, 0) / piece.length;
    const speed = 20_000;
    const spin = 0.8;
    const shard = {
      ...material(
        7,
        "fragment",
        head.x + (head.vx * substep) / 2 - offsetX,
        head.y - (speed * substep) / 2 - offsetY,
      ),
      kind: "fragment" as const,
      shardIndex: 0,
      vy: speed,
    };
    expect(castDerelict(shard, head, { x: 0, y: 0 }, 0, 0)).toBeNull();
    expect(
      castDerelict(
        { ...shard, y: shard.y + speed * substep, rotation: spin * substep },
        { x: head.x + head.vx * substep, y: head.y },
        { x: 0, y: 0 },
        0,
        0,
      ),
    ).toBeNull();
    const hit = castDerelict(
      shard,
      head,
      { x: head.vx, y: -speed },
      0,
      substep,
      spin,
    );
    if (!hit) throw new Error("The moving fragment must cross the interval");
    f.system.bodies.push(shard);
    f.step();
    expect(f.system.plasmaStreams).toEqual([]);
    expect(f.system.plasmaContacts).toBe(1);
    const contact = f.system.lastPlasmaContact;
    expect(contact).toMatchObject({
      mountKey: f.rifle.mount.key,
      bodyId: shard.id,
    });
    expect(shard.hull).toBe(25);
    f.step();
    expect(f.system.plasmaContacts).toBe(1);
  });

  it("misses a clearing ship, passes through a wreck opening, and reaches live material behind it", () => {
    const f = fixture();
    f.step(0.7);
    const openWreck = {
      ...material(7, "wreck", f.muzzle.muzzleX + 55, f.muzzle.muzzleY + 3),
      kind: "wreck" as const,
      releasedMask: (1 << 2) | (1 << 5),
      spin: 0,
    };
    const from = { x: f.muzzle.muzzleX, y: f.muzzle.muzzleY };
    const ray = { x: 7800, y: 0 };
    expect(castDerelict(openWreck, from, ray, 0, STEP)).toBeNull();
    expect(
      castDerelict({ ...openWreck, releasedMask: 0 }, from, ray, 0, STEP),
    ).not.toBeNull();
    const clearingShip = f.target(21, 60, 0, 20_000);
    const rearShip = f.target(22, 125);
    f.system.bodies.push(openWreck);
    f.step(STEP, [clearingShip, rearShip]);
    expect(f.system.plasmaContacts).toBe(1);
    expect(f.system.lastPlasmaContact?.bodyId).toBe(rearShip.id);
  });

  it("includes material at the expiry endpoint and breaks equal-time ties by stable ID", () => {
    const f = fixture();
    f.step(0.7);
    const lower = f.target(21, 130 + waspRadius);
    const higher = { ...lower, id: 22 };
    for (let time = 0; time < 4; time++) f.step(substep, [higher, lower]);
    expect(f.system.plasmaStreams).toEqual([]);
    expect(f.system.plasmaContacts).toBe(1);
    expect(f.system.lastPlasmaContact?.bodyId).toBe(lower.id);
    expect(f.system.lastPlasmaContact?.x).toBeCloseTo(
      f.muzzle.muzzleX + 130,
      8,
    );
  });

  it.each(["star", "planet"] as const)(
    "lets a %s win an equal-time contact without recording material",
    (kind) => {
      const f = fixture();
      f.step(0.7);
      const body = f.target(21, 120);
      const pos = new Vec2(body.x, body.y);
      const star = { ...distantStar, pos, radius: body.radius };
      const planet: Planet = {
        pos,
        orbitCenter: pos,
        orbitRadius: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        initialAngle: 0,
        radius: body.radius,
        mass: 1,
        color: "#aaa",
        type: "rock",
      };
      f.step(
        STEP,
        [body],
        kind === "star" ? star : distantStar,
        kind === "planet" ? [planet] : [],
      );
      expect(f.system.plasmaStreams).toEqual([]);
      expect(f.system.plasmaContacts).toBe(0);
      expect(f.system.plasmaAirbursts).toBe(0);
      expect(f.system.lastPlasmaContact).toBeNull();
    },
  );

  it("retains both simultaneous material contacts from twin mounts", () => {
    const f = fixture();
    const loadout = defaultLoadout("wasp");
    loadout.hull = ["plasma-rifle", "plasma-rifle"];
    const system = new SalvageSystem(loadout, 2026);
    const mounts = system.weapons.map((weapon) => ({
      key: weapon.mount.key,
      pose: weaponPose(f.ship, weapon.mount),
    }));
    const targets = mounts.map(({ pose }, index) =>
      liveShipBody(
        20 + index,
        {
          ...f.ship,
          pos: new Vec2(pose.muzzleX + 77, pose.muzzleY),
          radius: 2,
        },
        300,
        () => {},
      ),
    );
    const resources = { hull: 100, power: 100 };
    system.stepWeapons(0.7, f.ship, distantStar, resources, 100, [], targets);
    expect(system.plasmaReleases).toBe(2);
    system.stepWeapons(STEP, f.ship, distantStar, resources, 100, [], targets);
    expect(system.plasmaStreams).toEqual([]);
    expect(system.plasmaContacts).toBe(2);
    expect(system.plasmaContactEvents).toHaveLength(2);
    for (const [index, { key, pose }] of mounts.entries()) {
      const hit = system.plasmaContactEvents.find(
        (entry) => entry.mountKey === key,
      );
      expect(hit?.bodyId).toBe(targets[index].id);
      expect(hit?.x).toBeCloseTo(pose.muzzleX + 75, 8);
      expect(hit?.y).toBeCloseTo(pose.muzzleY, 8);
    }
  });

  it("erupts once at full reach and launches nothing on a partial vent", () => {
    const f = fixture();
    f.step(0.35);
    f.step(0.3, []);
    expect(f.system.plasmaVents).toBe(1);
    expect(f.system.plasmaStreams).toEqual([]);
    expect(f.system.plasmaAirbursts).toBe(0);
    f.step(2.1, []);
    f.step(0.7);
    f.step(STEP, [f.target(21, 130.001 + waspRadius)]);
    expect(f.system.plasmaReleases).toBe(1);
    expect(f.system.plasmaStreams).toEqual([]);
    expect(f.system.plasmaContacts).toBe(0);
    expect(f.system.plasmaAirbursts).toBe(1);
  });

  it("records stream contact through ordinary Derelicts simulation ticks", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      loadout: fighter,
      mode: "derelicts",
      arrival: false,
    });
    sim.star.pos.set(10_000, 10_000);
    sim.planets.length = 0;
    sim.ship.pos.set(400, 400);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    const system = sim.salvage;
    if (!system) throw new Error("Expected the Derelicts encounter");
    system.nextPass = Infinity;
    const [rifle] = system.weapons;
    const muzzle = weaponPose(sim.ship, rifle.mount);
    const wreck = material(7, "wreck", muzzle.muzzleX + 105, muzzle.muzzleY);
    system.bodies.push(wreck);
    sim.start();
    for (let tick = 0; tick < 60; tick++) sim.step(still);
    expect(system.plasmaReleases).toBe(1);
    expect(system.plasmaContacts).toBe(1);
    expect(system.lastPlasmaContact).toMatchObject({
      mountKey: rifle.mount.key,
      bodyId: wreck.id,
    });
    expect(wreck.hull).toBe(25);
  });
});
