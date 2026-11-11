import { initializePlanets, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
  BUILD_FLIGHT_SCALE,
  buildMounts,
  drawBuild,
  drawNonEngineFitting,
  weaponPose,
} from "./build-renderer";
import { derelictClosestPoint } from "./derelict-collision";
import { createStar } from "./game-loop";
import { ION_CANNON_ART, ION_CANNON_MUZZLE } from "./ion-cannon-art";
import {
  POINT_DEFENCE_GEOMETRY,
  POINT_DEFENCE_MUZZLE,
  POINT_DEFENCE_MUZZLE_SIDE,
  POINT_DEFENCE_SOURCE_SCALE,
  POINT_DEFENCE_TURRET,
} from "./point-defence-art";
import { type SalvageBody, SalvageSystem, type WeaponState } from "./salvage";
import {
  buildStats,
  defaultLoadout,
  type Loadout,
  LoadoutSchema,
  PARTS,
} from "./schemas/loadout";
import {
  ION_CANNON,
  POINT_DEFENCE,
  pointDefenceDamage,
  WEAPONS,
} from "./schemas/salvage";
import { Simulation, STEP, stockSettings } from "./simulation";

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
  it("adds a 10-mass weapon with no idle power draw", () => {
    const part = PARTS[PART];
    expect(part.category).toBe("G");
    expect(part.mass).toBe(10);
    expect(part.draw).toBe(0);
    const bare = defaultLoadout("fighter");
    const fitted = defaultLoadout("fighter");
    fitted.hull[0] = PART;
    expect(buildStats(fitted).mass - buildStats(bare).mass).toBe(10);
    expect(buildStats(fitted).engineDraw).toBe(buildStats(bare).engineDraw);
  });

  it("keeps the source-art muzzle, pivot and visible turret rotation aligned", () => {
    const g = POINT_DEFENCE_GEOMETRY;
    expect(2 * g.baseRadius * POINT_DEFENCE_SOURCE_SCALE).toBeCloseTo(
      g.diameter,
      12,
    );
    expect(g.diameter).toBe(8);
    expect(g.innerRadius).toBeLessThan(g.baseRadius);

    const channelColours = new Set(ION_CANNON_ART.map(([colour]) => colour));
    const xs = (pts: readonly (readonly [number, number])[]) =>
      pts.map(([x]) => x);
    const top = (pts: readonly (readonly [number, number])[]) =>
      Math.min(...pts.map(([, y]) => y));
    const channel = POINT_DEFENCE_TURRET.filter(([colour]) =>
      channelColours.has(colour),
    )
      .map(([, pts]) => pts)
      .sort(
        (a, b) =>
          Math.max(...xs(a)) -
          Math.min(...xs(a)) -
          (Math.max(...xs(b)) - Math.min(...xs(b))),
      )[0];
    if (!channel) throw new Error("Channel missing");
    const tipY = top(channel);
    const forward = Math.min(
      ...POINT_DEFENCE_TURRET.map(([, pts]) => top(pts)),
    );
    expect(tipY - forward).toBeLessThan(1e-5);
    const tip = channel.filter(([, y]) => y === tipY);
    const tipX = tip.reduce((sum, [x]) => sum + x, 0) / tip.length;
    expect(POINT_DEFENCE_MUZZLE).toBeCloseTo(
      (g.centreY - tipY) * POINT_DEFENCE_SOURCE_SCALE,
      9,
    );
    expect(POINT_DEFENCE_MUZZLE_SIDE).toBeCloseTo(
      (tipX - g.centreX) * POINT_DEFENCE_SOURCE_SCALE,
      9,
    );
    expect(POINT_DEFENCE_MUZZLE).toBeGreaterThan(g.diameter / 2);
    expect(POINT_DEFENCE_MUZZLE).toBeLessThan(ION_CANNON_MUZZLE);

    const f = fixture();
    for (const w of f.turrets()) {
      for (const turn of [0, 0.7, -2.1]) {
        const p = weaponPose(f.ship, w.mount, w.mount.angle + turn);
        expect(p.x).toBeCloseTo(f.ship.pos.x + w.mount.x * BUILD_FLIGHT_SCALE);
        expect(p.y).toBeCloseTo(f.ship.pos.y + w.mount.y * BUILD_FLIGHT_SCALE);
        expect(Math.hypot(p.muzzleX - p.x, p.muzzleY - p.y)).toBeCloseTo(
          Math.hypot(POINT_DEFENCE_MUZZLE, POINT_DEFENCE_MUZZLE_SIDE),
        );
        const along =
          (p.muzzleX - p.x) * Math.cos(p.angle) +
          (p.muzzleY - p.y) * Math.sin(p.angle);
        expect(along).toBeCloseTo(POINT_DEFENCE_MUZZLE);
      }
    }

    const mount = {
      ...buildMounts(defaultLoadout("fighter"))[2],
      part: PART,
    } as const;
    function record(weaponAngle?: number) {
      const calls: { method: string; args: unknown[] }[] = [];
      const ctx = new Proxy({} as CanvasRenderingContext2D, {
        get:
          (_target, key) =>
          (...args: unknown[]) => {
            calls.push({ method: String(key), args });
            if (key === "createLinearGradient")
              return { addColorStop: () => {} };
          },
        set: () => true,
      });
      drawNonEngineFitting(ctx, mount, weaponAngle);
      return calls;
    }
    const turn = 1.1;
    const calls = record(mount.angle + turn);
    const rotations = calls
      .filter((c) => c.method === "rotate")
      .map((c) => c.args[0]);
    expect(rotations).toEqual([Math.PI / 2, turn]);
    const turnAt = calls.findIndex(
      (c) => c.method === "rotate" && c.args[0] === turn,
    );
    const arcs = calls.flatMap((c, i) => (c.method === "arc" ? [i] : []));
    expect(arcs).toHaveLength(2);
    expect(Math.max(...arcs)).toBeLessThan(turnAt);
    const fills = calls.flatMap((c, i) => (c.method === "fill" ? [i] : []));
    expect(fills.filter((i) => i > turnAt).length).toBeGreaterThan(0);
    expect(
      record()
        .filter((c) => c.method === "rotate")
        .map((c) => c.args[0]),
    ).toEqual([Math.PI / 2, 0]);

    const build = defaultLoadout("fighter");
    build.hull[0] = PART;
    const key = buildMounts(build).find((m) => m.part === PART)?.key ?? "";
    const seen: unknown[] = [];
    const ctx = new Proxy({} as CanvasRenderingContext2D, {
      get:
        (_target, k) =>
        (...args: unknown[]) => {
          if (k === "rotate") seen.push(args[0]);
          if (k === "createLinearGradient" || k === "createRadialGradient")
            return { addColorStop: () => {} };
        },
      set: () => true,
    });
    drawBuild(ctx, build, 0, 0, 0, 1, "", undefined, undefined, {
      [key]: turn,
    });
    expect(seen).toContain(turn);
  });

  it("chooses and retains targets by closest collision point, with independent turrets", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    let [w] = f.turrets();
    const far = f.place(w, f.body(0, 0), 90, 0);
    const near = f.place(w, f.body(0, 0), 60, Math.PI / 2);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(near);

    f.system.bodies = [];
    const a = f.body(far.x, far.y, "fragment", 9);
    const b = f.body(far.x, far.y, "fragment", 4);
    expect(f.distance(w, a).distance).toBe(f.distance(w, b).distance);
    const tied = f.system.pointDefenceTarget(w, f.ship, f.star, []);
    expect(tied?.body).toBe(b);
    const closest = f.distance(w, b);
    expect(tied?.x).toBe(closest.x);
    expect(tied?.distance).toBe(closest.distance);
    f.system.bodies = [];
    f.place(w, f.body(0, 0), 201, 0);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])).toBeUndefined();

    f = fixture((b) => (b.hull[0] = PART));
    [w] = f.turrets();
    const retained = f.place(w, f.body(0, 0), 80, 0);
    w.target = retained.id;
    const keptDistance = f.distance(w, retained).distance;
    const other = f.body(0, 0);
    const p = f.pivot(w);
    let lo = 0,
      hi = 200;
    const at = (r: number) => {
      other.x = other.previousX = p.x;
      other.y = other.previousY = p.y + r;
      return f.distance(w, other).distance;
    };
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid) <= keptDistance - POINT_DEFENCE.retention) lo = mid;
      else hi = mid;
    }
    const switchingDistance = at(lo);
    expect(keptDistance - switchingDistance).toBeGreaterThanOrEqual(
      POINT_DEFENCE.retention,
    );
    w.target = retained.id;
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      other,
    );
    const keepingDistance = at(hi);
    expect(keptDistance - keepingDistance).toBeLessThan(
      POINT_DEFENCE.retention,
    );
    w.target = retained.id;
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      retained,
    );

    f = fixture((b) => b.aft.fill(PART));
    const [left, right] = f.turrets();
    const leftTarget = f.place(left, f.body(0, 0), 40, -Math.PI / 2);
    const rightTarget = f.place(right, f.body(0, 0), 40, Math.PI / 2);
    f.step();
    expect(left.target).toBe(leftTarget.id);
    expect(right.target).toBe(rightTarget.id);
  });

  it("ignores collectible energy and rejects targets obscured by world bodies", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    let [w] = f.turrets();
    const p = f.pivot(w);
    f.body(p.x + 30, p.y, "cell");
    f.step(30);
    expect(w.target).toBeNull();
    expect(f.system.pointDefenceDischarges).toBe(0);
    const behind = f.place(w, f.body(0, 0), 60, 0);
    f.step(30);
    expect(w.target).toBe(behind.id);
    expect(f.system.pointDefenceDischarges).toBeGreaterThan(0);

    for (const blocker of ["planet", "star"] as const) {
      f = fixture((b) => (b.hull[0] = PART));
      [w] = f.turrets();
      const target = f.place(w, f.body(0, 0), 60, 0);
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
      expect(f.system.pointDefenceTarget(w, f.ship, f.star, f.planets)).toBe(
        undefined,
      );
      f.step(60);
      expect(f.system.pointDefenceDischarges).toBe(0);
      expect(f.resources.power).toBe(100);
      expect(target.hull).toBe(1000);
    }
  });

  it("turns at its rate, holds without a target, resets to mount, and requires alignment", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    let [w] = f.turrets();
    f.place(w, f.body(0, 0), 150, Math.PI);
    let previous = w.angle;
    let steps = 0;
    while (Math.abs(Math.cos(f.ship.rotation + w.angle) + 1) > 1e-6) {
      f.step();
      const delta = Math.atan2(
        Math.sin(w.angle - previous),
        Math.cos(w.angle - previous),
      );
      expect(Math.abs(delta)).toBeLessThanOrEqual(
        POINT_DEFENCE.turnRate * STEP + 1e-12,
      );
      previous = w.angle;
      steps++;
      if (steps > 200) throw new Error("Never aligned");
    }
    expect(steps).toBeGreaterThanOrEqual(
      Math.floor(Math.PI / (POINT_DEFENCE.turnRate * STEP)),
    );
    for (let i = 0; i < 60; i++) {
      f.step(1, 1);
      const aim = f.align({ ...w });
      const p = f.pivot(w);
      const bearing = Math.atan2(aim.y - p.y, aim.x - p.x);
      expect(
        Math.abs(
          Math.atan2(Math.sin(bearing - p.angle), Math.cos(bearing - p.angle)),
        ),
      ).toBeLessThanOrEqual(POINT_DEFENCE.tolerance);
    }
    for (let i = 0; i < 30; i++) {
      const before = w.angle;
      f.step(1, 2 * Math.PI);
      expect(
        Math.abs(
          Math.atan2(Math.sin(w.angle - before), Math.cos(w.angle - before)),
        ),
      ).toBeLessThanOrEqual(POINT_DEFENCE.turnRate * STEP + 1e-12);
    }

    f = fixture((b) => (b.hull[0] = PART));
    [w] = f.turrets();
    expect(w.angle).toBe(w.mount.angle);
    const target = f.place(w, f.body(0, 0), 150, Math.PI / 2);
    f.step(10);
    const held = w.angle;
    f.system.bodies = f.system.bodies.filter((b) => b !== target);
    f.step(10, 1);
    expect(w.angle).toBe(held);
    const sim = new Simulation({
      ...stockSettings("fighter"),
      loadout: LoadoutSchema.parse(f.loadout),
      mode: "derelicts",
      arrival: false,
    });
    expect(sim.salvage?.weapons.find((x) => x.kind === PART)?.angle).toBe(
      sim.salvage?.weapons.find((x) => x.kind === PART)?.mount.angle,
    );

    f = fixture((b) => (b.hull[0] = PART));
    [w] = f.turrets();
    f.place(w, f.body(0, 0, "wreck"), 50, 0);
    const turn = POINT_DEFENCE.turnRate * STEP;
    f.align(w);
    w.angle -= turn + 2.05 * DEG;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(0);
    f.align(w);
    w.angle -= turn + 1.95 * DEG;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
  });

  it("damages only the muzzle's first contact and applies the four distance bands", () => {
    for (const [distance, damage] of [
      [0, 8],
      [24.999, 8],
      [25, 6],
      [50, 4],
      [75, 2],
      [100, 2],
      [100.001, 0],
    ])
      expect(pointDefenceDamage(distance)).toBe(damage);

    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const near = f.place(w, f.body(0, 0, "wreck"), 104, 0);
    const far = f.body(near.x + 60, near.y, "wreck");
    f.align(w);
    const p = f.pivot(w);
    expect(f.distance(w, near).distance).toBeGreaterThan(POINT_DEFENCE.reach);
    const contact = f.system.ionContact(
      p.muzzleX,
      p.muzzleY,
      p.angle,
      f.star,
      [],
      POINT_DEFENCE.reach,
    );
    expect(contact.hit).toBe(near);
    expect(contact.distance).toBeLessThanOrEqual(POINT_DEFENCE.reach);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(near.hull).toBe(1000 - pointDefenceDamage(contact.distance));
    expect(far.hull).toBe(1000);
    const event = f.system.events.find((e) => e.kind === "point-defence");
    expect(event?.kind === "point-defence" && event.distance).toBe(
      contact.distance,
    );
  });

  it("charges the shot cost and cooldown while resolving defence before guns in mount order", () => {
    let f = fixture((b) => (b.hull[0] = PART));
    f.energy.capacity = 100;
    let [w] = f.turrets();
    f.place(w, f.body(0, 0, "wreck"), 40, 0);
    f.align(w);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.resources.power).toBeCloseTo(100 - POINT_DEFENCE.energy);
    expect(w.readyAt).toBeCloseTo(f.system.time + POINT_DEFENCE.cooldown);
    const first = f.system.time;
    while (f.system.pointDefenceDischarges < 2) f.step();
    expect(f.system.time - first).toBeGreaterThanOrEqual(
      POINT_DEFENCE.cooldown - 1e-9,
    );
    expect(f.system.time - first).toBeLessThan(POINT_DEFENCE.cooldown + STEP);
    const shots = f.system.pointDefenceDischarges;
    const spent = f.system.energySpent;
    f.step(Math.round(1 / STEP));
    const fired = f.system.pointDefenceDischarges - shots;
    expect(fired).toBeGreaterThan(0);
    expect(f.system.energySpent - spent).toBeCloseTo(
      fired * POINT_DEFENCE.energy,
    );

    f = fixture((b) => b.hull.fill(PART));
    f.energy.capacity = 1;
    const [a, b] = f.turrets();
    f.place(a, f.body(0, 0, "wreck"), 30, 0);
    f.align(a);
    f.align(b);
    f.resources.power = 1.5 * POINT_DEFENCE.energy;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.resources.power).toBeCloseTo(0.5 * POINT_DEFENCE.energy);
    expect(a.readyAt).toBeGreaterThan(0);
    expect(b.readyAt).toBe(0);

    f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = PART;
    });
    f.energy.capacity = 1;
    [w] = f.turrets();
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
    expect(f.resources.power).toBeCloseTo(0.5 * POINT_DEFENCE.energy);
    expect(f.system.ionDischarges).toBe(0);
    expect(cannon.readyAt).toBe(0);

    f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = "laser";
    });
    const firstCannon = f.system.weapons.find(
      (x) => x.kind === "light-ion-cannon",
    );
    const laser = f.system.weapons.find((x) => x.kind === "laser");
    if (!firstCannon || !laser) throw new Error("Weapons missing");
    expect(f.system.weapons.indexOf(firstCannon)).toBeLessThan(
      f.system.weapons.indexOf(laser),
    );
    const wreck = f.body(f.ship.pos.x + 60, f.ship.pos.y, "wreck");
    const base = weaponPose(f.ship, laser.mount, laser.angle);
    laser.angle =
      Math.atan2(wreck.y - base.y, wreck.x - base.x) - f.ship.rotation;
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    const floor = f.energy.capacity * WEAPONS.energyFloor;
    f.resources.power = floor + ION_CANNON.energy / 2;
    f.step();
    expect(f.system.laserPulses).toBe(1);
    expect(laser.readyAt).toBeGreaterThan(0);
    expect(f.system.ionDischarges).toBe(0);
    expect(firstCannon.readyAt).toBe(0);

    f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = PART;
    });
    [w] = f.turrets();
    const fragment = f.place(w, f.body(0, 0), 30, f.ship.rotation);
    fragment.hull = 1;
    f.align(w);
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(fragment.hull).toBeLessThanOrEqual(0);
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(false);
    expect(f.system.ionDischarges).toBe(0);
    expect(f.resources.power).toBeCloseTo(100 - POINT_DEFENCE.energy);
  });
});
