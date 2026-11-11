import { initializePlanets, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { derelictClosestPoint } from "./derelict-collision";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem, type WeaponState } from "./salvage";
import { defaultLoadout, type Loadout, LoadoutSchema } from "./schemas/loadout";
import { POINT_DEFENCE, pointDefenceDamage } from "./schemas/salvage";
import { STEP } from "./simulation";

const PART = "ion-point-defence" as const;
const DEG = Math.PI / 180;

function fixture(
  configure: (build: Loadout) => void = (b) => b.hull.fill(PART),
) {
  const loadout = defaultLoadout("fighter");
  configure(loadout);
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
  const planets: ReturnType<typeof initializePlanets> = [];
  const resources = { power: 100, hull: 100 };
  const energy = { capacity: 100 };
  const step = (n = 1, spin = 0) => {
    for (let i = 0; i < n; i++) {
      ship.rotation += spin * STEP;
      system.step(
        STEP,
        ship,
        star,
        resources,
        energy.capacity,
        ship.pos.x,
        ship.pos.y,
        false,
        planets,
      );
    }
  };
  let nextId = 100;
  const body = (
    x: number,
    y: number,
    kind: SalvageBody["kind"] = "fragment",
    id = ++nextId,
  ) => {
    const b: SalvageBody = {
      id,
      group: id,
      kind,
      x,
      y,
      previousX: x,
      previousY: y,
      vx: 0,
      vy: 0,
      radius: 18,
      hull: 1000,
      life: 100,
      rotation: 0,
      ...(kind === "fragment" ? { shardIndex: 0 } : {}),
    };
    system.bodies.push(b);
    return b;
  };
  const turrets = () => system.weapons.filter((w) => w.kind === PART);
  const pivot = (w: WeaponState) => weaponPose(ship, w.mount, w.angle);
  const distance = (w: WeaponState, b: SalvageBody) =>
    derelictClosestPoint(
      {
        kind: b.kind === "wreck" ? "wreck" : "fragment",
        x: b.x,
        y: b.y,
        rotation: b.rotation,
        shardIndex: b.shardIndex ?? 0,
        releasedMask: b.releasedMask ?? 0,
      },
      pivot(w),
    );
  /** Move a body along a world bearing from a turret pivot until its geometry is `d` away. */
  const place = (w: WeaponState, b: SalvageBody, d: number, bearing = 0) => {
    const p = pivot(w);
    let lo = 0,
      hi = d + 80;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      b.x = b.previousX = p.x + Math.cos(bearing) * mid;
      b.y = b.previousY = p.y + Math.sin(bearing) * mid;
      if (distance(w, b).distance < d) lo = mid;
      else hi = mid;
    }
    return b;
  };
  /** Point a turret exactly at its current target's aim point. */
  const align = (w: WeaponState) => {
    const target = system.pointDefenceTarget(w, ship, star, planets);
    if (!target) throw new Error("No target");
    const p = pivot(w);
    w.angle = Math.atan2(target.y - p.y, target.x - p.x) - ship.rotation;
    return target;
  };
  return {
    loadout,
    system,
    ship,
    star,
    planets,
    resources,
    energy,
    step,
    body,
    turrets,
    pivot,
    distance,
    place,
    align,
  };
}

describe("Ion Point Defence", () => {
  it("chooses the closest collision point, breaks ties by lower id, and switches only past the retention margin", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    let [w] = f.turrets();
    f.place(w, f.body(0, 0), 90, 0);
    const near = f.place(w, f.body(0, 0), 60, Math.PI / 2);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(near);

    f.system.bodies = [];
    f.body(near.x, near.y, "fragment", 9);
    const lower = f.body(near.x, near.y, "fragment", 4);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      lower,
    );

    f = fixture((b) => (b.hull[0] = PART));
    [w] = f.turrets();
    const retained = f.place(w, f.body(0, 0), 80, 0);
    const other = f.body(0, 0);
    f.place(w, other, 80 - POINT_DEFENCE.retention + 1, Math.PI / 2);
    w.target = retained.id;
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      retained,
    );
    f.place(w, other, 80 - POINT_DEFENCE.retention - 1, Math.PI / 2);
    w.target = retained.id;
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      other,
    );
  });

  it("ignores collectible energy and rejects targets behind a planet or the star", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    let [w] = f.turrets();
    const p = f.pivot(w);
    f.body(p.x + 30, p.y, "cell");
    f.step(30);
    expect(w.target).toBeNull();
    expect(f.system.pointDefenceDischarges).toBe(0);

    for (const blocker of ["planet", "star"] as const) {
      f = fixture((b) => (b.hull[0] = PART));
      [w] = f.turrets();
      f.place(w, f.body(0, 0), 60, 0);
      const pivot = f.pivot(w);
      if (blocker === "planet") {
        const planet = initializePlanets(960, 540)[0];
        planet.pos.set(pivot.x + 30, pivot.y);
        planet.radius = 10;
        planet.well = { reach: 0, strength: 0 };
        f.planets.push(planet);
      } else {
        f.star.pos.set(pivot.x + 30, pivot.y);
        f.star.radius = 10;
        f.star.influenceRadius = 0;
      }
      expect(
        f.system.pointDefenceTarget(w, f.ship, f.star, f.planets),
        blocker,
      ).toBeUndefined();
      f.step(60);
      expect(f.system.pointDefenceDischarges, blocker).toBe(0);
    }
  });

  it("never turns faster than its rate, even on a spinning ship", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    f.place(w, f.body(0, 0), 150, Math.PI);
    for (let i = 0; i < 30; i++) {
      const before = w.angle;
      f.step(1, 2 * Math.PI);
      expect(
        Math.abs(
          Math.atan2(Math.sin(w.angle - before), Math.cos(w.angle - before)),
        ),
      ).toBeLessThanOrEqual(POINT_DEFENCE.turnRate * STEP + 1e-12);
    }
  });

  it("fires only within its alignment tolerance", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    f.place(w, f.body(0, 0, "wreck"), 50, 0);
    const turn = POINT_DEFENCE.turnRate * STEP;
    f.align(w);
    w.angle -= turn + POINT_DEFENCE.tolerance + 0.05 * DEG;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(0);
    f.align(w);
    w.angle -= turn + POINT_DEFENCE.tolerance - 0.05 * DEG;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
  });

  it("does no damage beyond its reach, and its far endpoint still damages", () => {
    expect(pointDefenceDamage(POINT_DEFENCE.reach)).toBeGreaterThan(0);
    expect(pointDefenceDamage(POINT_DEFENCE.reach + 0.001)).toBe(0);
  });

  it("damages only the muzzle's first contact", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const near = f.place(w, f.body(0, 0, "wreck"), 60, 0);
    const far = f.body(near.x + 60, near.y, "wreck");
    f.align(w);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(near.hull).toBeLessThan(1000);
    expect(far.hull).toBe(1000);
  });

  it("funds turrets in mount order when power is scarce", () => {
    const f = fixture((b) => b.hull.fill(PART));
    f.energy.capacity = 1;
    const [a, b] = f.turrets();
    f.place(a, f.body(0, 0, "wreck"), 30, 0);
    f.align(a);
    f.align(b);
    f.resources.power = 1.5 * POINT_DEFENCE.energy;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(a.readyAt).toBeGreaterThan(0);
    expect(b.readyAt).toBe(0);
  });

  it("draws power before guns, even when the gun is mounted first", () => {
    const f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = PART;
    });
    f.energy.capacity = 1;
    const [w] = f.turrets();
    const cannon = f.system.weapons.find((x) => x.kind === "light-ion-cannon");
    if (!cannon) throw new Error("Cannon missing");
    expect(f.system.weapons.indexOf(cannon)).toBeLessThan(
      f.system.weapons.indexOf(w),
    );
    f.place(w, f.body(0, 0, "wreck"), 30, f.ship.rotation);
    f.align(w);
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    f.resources.power = 1.5 * POINT_DEFENCE.energy;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.system.ionDischarges).toBe(0);
    expect(cannon.readyAt).toBe(0);
  });

  it("lets a gun see the world its defence shot left", () => {
    const f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = PART;
    });
    const [w] = f.turrets();
    const fragment = f.place(w, f.body(0, 0), 30, f.ship.rotation);
    fragment.hull = 1;
    f.align(w);
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.system.ionDischarges).toBe(0);
  });
});
