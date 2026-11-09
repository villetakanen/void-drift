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
  POINT_DEFENCE_RIM_SLOTS,
  POINT_DEFENCE_SOURCE_SCALE,
  POINT_DEFENCE_TURRET,
} from "./point-defence-art";
import { type SalvageBody, SalvageSystem, type WeaponState } from "./salvage";
import {
  BuildStoreSchema,
  buildStats,
  CHASSIS,
  defaultBuilds,
  defaultLoadout,
  type Loadout,
  LoadoutSchema,
  PARTS,
  slotAccepts,
  starterLoadout,
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
const angleBetween = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));

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

describe("Ion Point Defence equipment", () => {
  it("is a genuine 10-mass weapon part with zero idle draw and builder text", () => {
    const part = PARTS[PART];
    expect(part.category).toBe("G");
    expect(part.mass).toBe(10);
    expect(part.draw).toBe(0);
    expect(part.description).toContain("8–24 damage/s");
    expect(part.description).toContain("3 shots/s");
    expect(part.description).toContain("100-unit reach");
    expect(part.description).toContain("0.1p/shot");
    const bare = defaultLoadout("fighter"),
      fitted = defaultLoadout("fighter");
    fitted.hull[0] = PART;
    expect(buildStats(fitted).mass - buildStats(bare).mass).toBe(10);
    expect(buildStats(fitted).engineDraw).toBe(buildStats(bare).engineDraw);
  });
  it("fits compatible weapon, equipment and universal slots and rejects support and engine slots", () => {
    expect(slotAccepts("weapon", "G")).toBe(true);
    expect(slotAccepts("equipment", "G")).toBe(true);
    expect(slotAccepts("universal", "G")).toBe(true);
    expect(slotAccepts("support", "G")).toBe(false);
    expect(slotAccepts("engine", "G")).toBe(false);
    for (const chassis of Object.keys(CHASSIS) as Loadout["chassis"][]) {
      for (const mount of buildMounts(defaultLoadout(chassis))) {
        if (mount.group === "side") continue;
        const build = starterLoadout(chassis);
        (mount.group === "hull" ? build.hull : build.aft)[mount.index] = PART;
        const parsed = LoadoutSchema.safeParse(build);
        const compatible = slotAccepts(mount.type, "G");
        if (compatible) expect(parsed.success).toBe(true);
        if (mount.type === "support" || mount.type === "engine")
          expect(parsed.success).toBe(false);
      }
    }
    expect(
      LoadoutSchema.safeParse({ ...defaultLoadout("fighter"), side: PART })
        .success,
    ).toBe(false);
  });
  it("parses existing saves unchanged and round-trips a saved turret fitting", () => {
    const builds = defaultBuilds();
    expect(BuildStoreSchema.parse(JSON.parse(JSON.stringify(builds)))).toEqual(
      builds,
    );
    builds.fighter.hull[1] = PART;
    builds.corvette.aft[1] = PART;
    const restored = BuildStoreSchema.parse(JSON.parse(JSON.stringify(builds)));
    expect(restored.fighter.hull[1]).toBe(PART);
    expect(restored.corvette.aft[1]).toBe(PART);
    for (const chassis of Object.keys(CHASSIS) as Loadout["chassis"][])
      if (chassis !== "wasp")
        expect(starterLoadout(chassis).hull).not.toContain(PART);
  });
  it("derives the pivot and channel-tip muzzle from the same 8-unit base geometry", () => {
    const g = POINT_DEFENCE_GEOMETRY;
    expect(2 * g.baseRadius * POINT_DEFENCE_SOURCE_SCALE).toBeCloseTo(
      g.diameter,
      12,
    );
    expect(g.diameter).toBe(8);
    expect(g.innerRadius).toBeLessThan(g.baseRadius);
    // The muzzle is the tip of the drawn channel: the narrowest turret polygon
    // in one of the cannon's colours, whose tip is the turret's forwardmost edge.
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
    // Source coordinates carry five decimals; the channel ends at the barrel tip.
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
    // The barrel protrudes past the base and is shorter than the cannon's.
    expect(POINT_DEFENCE_MUZZLE).toBeGreaterThan(g.diameter / 2);
    expect(POINT_DEFENCE_MUZZLE).toBeLessThan(ION_CANNON_MUZZLE);
    expect(POINT_DEFENCE_RIM_SLOTS).toBe(6);
    const f = fixture();
    for (const w of f.turrets()) {
      for (const turn of [0, 0.7, -2.1]) {
        const p = weaponPose(f.ship, w.mount, w.mount.angle + turn);
        // The pivot is the base centre on the mount.
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
  });
  it("draws the base fixed to the ship and the turret at its weapon angle", () => {
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
    // Preview and Plan draw along the mount direction.
    expect(
      record()
        .filter((c) => c.method === "rotate")
        .map((c) => c.args[0]),
    ).toEqual([Math.PI / 2, 0]);
    // drawBuild forwards per-mount weapon angles to the fitting.
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
});

describe("Ion Point Defence targeting and turning", () => {
  it.each([
    [0, 8],
    [24.999, 8],
    [25, 6],
    [49.999, 6],
    [50, 4],
    [74.999, 4],
    [75, 2],
    [100, 2],
    [100.001, 0],
    [-1, 0],
  ])("damage at %s units is %s", (d, v) =>
    expect(pointDefenceDamage(d)).toBe(v),
  );
  it("selects the closest candidate by collision geometry and breaks ties by lower id", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const far = f.place(w, f.body(0, 0), 90, 0);
    const near = f.place(w, f.body(0, 0), 60, Math.PI / 2);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(near);
    f.system.bodies = [];
    const a = f.body(far.x, far.y, "fragment", 9);
    const b = f.body(far.x, far.y, "fragment", 4);
    expect(f.distance(w, a).distance).toBe(f.distance(w, b).distance);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(b);
    // The aim point is the closest point of the actual geometry.
    const target = f.system.pointDefenceTarget(w, f.ship, f.star, []);
    const closest = f.distance(w, b);
    expect(target?.x).toBe(closest.x);
    expect(target?.distance).toBe(closest.distance);
    // Nothing beyond the 200-unit tracking range is a candidate.
    f.system.bodies = [];
    f.place(w, f.body(0, 0), 201, 0);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])).toBeUndefined();
  });
  it("retains its target unless another candidate is at least 10 units closer", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const fragment = f.place(w, f.body(0, 0), 80, 0);
    f.step();
    expect(w.target).toBe(fragment.id);
    const wreck = f.place(w, f.body(0, 0, "wreck"), 72, Math.PI / 2);
    f.step();
    expect(w.target).toBe(fragment.id);
    f.place(w, wreck, 65, Math.PI / 2);
    f.step();
    expect(w.target).toBe(wreck.id);
  });
  it("switches at exactly the 10-unit retention margin and keeps just inside it", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const retained = f.place(w, f.body(0, 0), 80, 0);
    w.target = retained.id;
    const kept = f.distance(w, retained).distance;
    const other = f.body(0, 0);
    const p = f.pivot(w);
    // Bisect the other body's position to the float boundary of the margin.
    let lo = 0,
      hi = 200;
    const at = (r: number) => {
      other.x = other.previousX = p.x;
      other.y = other.previousY = p.y + r;
      return f.distance(w, other).distance;
    };
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid) <= kept - POINT_DEFENCE.retention) lo = mid;
      else hi = mid;
    }
    const switching = at(lo);
    expect(kept - switching).toBeGreaterThanOrEqual(POINT_DEFENCE.retention);
    expect(kept - switching).toBeCloseTo(POINT_DEFENCE.retention, 9);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      other,
    );
    const keeping = at(hi);
    expect(kept - keeping).toBeLessThan(POINT_DEFENCE.retention);
    expect(kept - keeping).toBeCloseTo(POINT_DEFENCE.retention, 9);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, [])?.body).toBe(
      retained,
    );
  });
  it("chooses independently per turret", () => {
    const f = fixture((b) => b.aft.fill(PART));
    const [a, b] = f.turrets();
    const left = f.place(a, f.body(0, 0), 40, -Math.PI / 2);
    const right = f.place(b, f.body(0, 0), 40, Math.PI / 2);
    f.step();
    expect(a.target).toBe(left.id);
    expect(b.target).toBe(right.id);
  });
  it("never treats collectible energy as a candidate or obstacle", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const p = f.pivot(w);
    f.body(p.x + 30, p.y, "cell");
    f.step(30);
    expect(w.target).toBeNull();
    expect(f.system.pointDefenceDischarges).toBe(0);
    const behind = f.place(w, f.body(0, 0), 60, 0);
    f.step(30);
    expect(w.target).toBe(behind.id);
    expect(f.system.pointDefenceDischarges).toBeGreaterThan(0);
  });
  it("is blocked by star and planet circles", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const target = f.place(w, f.body(0, 0), 60, 0);
    const p = f.pivot(w);
    const planet = initializePlanets(960, 540)[0];
    planet.pos.set(p.x + 30, p.y);
    planet.radius = 10;
    f.planets.push(planet);
    expect(f.system.pointDefenceTarget(w, f.ship, f.star, f.planets)).toBe(
      undefined,
    );
    f.step(60);
    expect(f.system.pointDefenceDischarges).toBe(0);
    expect(f.resources.power).toBe(100);
    f.planets.length = 0;
    f.star.pos.set(p.x + 30, p.y);
    f.star.radius = 10;
    f.step(60);
    expect(f.system.pointDefenceDischarges).toBe(0);
    expect(target.hull).toBe(1000);
    // The same ray query reports the star, not material, as first contact.
    expect(
      f.system.ionContact(p.x, p.y, 0, f.star, [], POINT_DEFENCE.reach).hit,
    ).toBeUndefined();
  });
  it("turns at most 180°/s and cancels a slower ship turn", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
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
    // Half a turn takes a second at 180°/s.
    expect(steps).toBeGreaterThanOrEqual(
      Math.floor(Math.PI / (POINT_DEFENCE.turnRate * STEP)),
    );
    // A ship turning at 1 rad/s is cancelled: the turret keeps its world bearing.
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
    // Faster than the limit, the relative angle still changes by at most 180°/s.
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
  it("holds its angle without a target and returns to the mount direction on a new flight", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    expect(w.angle).toBe(w.mount.angle);
    expect(f.system.angles[w.mount.key]).toBe(w.mount.angle);
    const t = f.place(w, f.body(0, 0), 150, Math.PI / 2);
    f.step(10);
    const held = w.angle;
    expect(held).not.toBe(w.mount.angle);
    f.system.bodies = f.system.bodies.filter((b) => b !== t);
    f.step(10, 1);
    expect(w.angle).toBe(held);
    const loadout = LoadoutSchema.parse(f.loadout);
    const sim = new Simulation({
      ...stockSettings("fighter"),
      loadout,
      mode: "derelicts",
      arrival: false,
    });
    const fresh = sim.salvage?.weapons.find((x) => x.kind === PART);
    expect(fresh?.angle).toBe(fresh?.mount.angle);
  });
  it("fires only within 2° of the aim point's bearing", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
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
});

describe("Ion Point Defence firing", () => {
  it("tracks a candidate beyond reach without discharge, debit or cooldown", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const target = f.place(w, f.body(0, 0, "wreck"), 150, Math.PI / 3);
    f.step(120);
    expect(w.target).toBe(target.id);
    const p = f.pivot(w);
    const closest = f.distance(w, target);
    const bearing = Math.atan2(closest.y - p.y, closest.x - p.x);
    expect(
      Math.abs(
        Math.atan2(Math.sin(bearing - p.angle), Math.cos(bearing - p.angle)),
      ),
    ).toBeLessThanOrEqual(POINT_DEFENCE.tolerance);
    expect(f.system.pointDefenceDischarges).toBe(0);
    expect(f.system.energySpent).toBe(0);
    expect(f.resources.power).toBe(100);
    expect(w.readyAt).toBe(0);
    f.place(w, target, 90, Math.PI / 3);
    f.step(5);
    expect(f.system.pointDefenceDischarges).toBeGreaterThan(0);
  });
  it("fires when first contact from the muzzle is within reach though the pivot is beyond it", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const target = f.place(w, f.body(0, 0, "wreck"), 104, 0);
    const aim = f.align(w);
    expect(aim.body).toBe(target);
    expect(aim.distance).toBeGreaterThan(POINT_DEFENCE.reach);
    const p = f.pivot(w);
    const contact = f.system.ionContact(
      p.muzzleX,
      p.muzzleY,
      p.angle,
      f.star,
      [],
      POINT_DEFENCE.reach,
    );
    expect(contact.hit).toBe(target);
    expect(contact.distance).toBeLessThanOrEqual(POINT_DEFENCE.reach);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(target.hull).toBe(1000 - pointDefenceDamage(contact.distance));
  });
  it.each(["planet", "star"] as const)(
    "does not discharge when a %s is the barrel's first contact though the pivot line is clear",
    (blocker) => {
      const f = fixture((b) => (b.hull[0] = PART));
      const [w] = f.turrets();
      const target = f.place(w, f.body(0, 0, "wreck"), 90, 0);
      const aim = f.align(w);
      // Within the 2° tolerance, but off the pivot line; a tiny update keeps it there.
      w.angle -= 1.9 * DEG;
      const p = f.pivot(w);
      const at = 40;
      const cx = p.muzzleX + Math.cos(p.angle) * at,
        cy = p.muzzleY + Math.sin(p.angle) * at;
      const radius = 0.5;
      const clear = f.system.ionContact(
        p.muzzleX,
        p.muzzleY,
        p.angle,
        f.star,
        [],
        POINT_DEFENCE.reach,
      );
      expect(clear.hit).toBe(target);
      expect(clear.distance).toBeGreaterThan(at);
      if (blocker === "planet") {
        const planet = initializePlanets(960, 540)[0];
        planet.pos.set(cx, cy);
        planet.radius = radius;
        f.planets.push(planet);
      } else {
        f.star.pos.set(cx, cy);
        f.star.radius = radius;
      }
      // The candidate stays valid: its pivot line is clear.
      const still = f.system.pointDefenceTarget(w, f.ship, f.star, f.planets);
      expect(still?.body).toBe(target);
      expect(still?.distance).toBe(aim.distance);
      f.system.step(
        1e-4,
        f.ship,
        f.star,
        f.resources,
        100,
        f.ship.pos.x,
        f.ship.pos.y,
        false,
        f.planets,
      );
      expect(w.target).toBe(target.id);
      expect(
        Math.abs(
          angleBetween(f.pivot(w).angle, Math.atan2(aim.y - p.y, aim.x - p.x)),
        ),
      ).toBeLessThanOrEqual(POINT_DEFENCE.tolerance);
      expect(f.system.pointDefenceDischarges).toBe(0);
      expect(f.resources.power).toBe(100);
      expect(w.readyAt).toBe(0);
      expect(f.system.events.some((e) => e.kind === "point-defence")).toBe(
        false,
      );
      expect(target.hull).toBe(1000);
    },
  );
  it("holds its angle as aligned when the pivot lies inside material", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    const [w] = f.turrets();
    const p = f.pivot(w);
    const wreck = f.body(p.x, p.y, "wreck");
    expect(f.distance(w, wreck).distance).toBe(0);
    // Not facing world +x, which atan2(0, 0) would give.
    w.angle = w.mount.angle + 1.3;
    const held = w.angle;
    f.step();
    expect(w.target).toBe(wreck.id);
    expect(w.angle).toBe(held);
    f.step(10, 1);
    expect(w.angle).toBe(held);
  });
  it.each([10, 30, 60, 90])(
    "applies the band damage once at the first contact %s units from the muzzle",
    (d) => {
      const f = fixture((b) => (b.hull[0] = PART));
      const [w] = f.turrets();
      const near = f.body(0, 0, "wreck");
      const far = f.body(0, 0, "wreck");
      f.place(w, near, d, 0);
      f.align(w);
      const p = f.pivot(w);
      // Shift the near body so first contact along the barrel lies exactly d from the muzzle.
      for (let i = 0; i < 4; i++) {
        const hit = f.system.ionContact(
          p.muzzleX,
          p.muzzleY,
          p.angle,
          f.star,
          [],
          POINT_DEFENCE.reach,
        );
        near.x = near.previousX += (d - hit.distance) * Math.cos(p.angle);
        near.y = near.previousY += (d - hit.distance) * Math.sin(p.angle);
      }
      far.x = far.previousX = near.x + 60 * Math.cos(p.angle);
      far.y = far.previousY = near.y + 60 * Math.sin(p.angle);
      f.align(w);
      const contact = f.system.ionContact(
        f.pivot(w).muzzleX,
        f.pivot(w).muzzleY,
        f.pivot(w).angle,
        f.star,
        [],
        POINT_DEFENCE.reach,
      );
      expect(contact.hit).toBe(near);
      f.step();
      expect(f.system.pointDefenceDischarges).toBe(1);
      expect(near.hull).toBe(1000 - pointDefenceDamage(contact.distance));
      expect(far.hull).toBe(1000);
      const event = f.system.events.find((e) => e.kind === "point-defence");
      expect(event?.kind === "point-defence" && event.distance).toBe(
        contact.distance,
      );
      expect(
        f.system.events.some(
          (e) =>
            e.kind === "collision" &&
            Math.abs(e.x - (event?.endX ?? NaN)) < 1e-9 &&
            Math.abs(e.y - (event?.endY ?? NaN)) < 1e-9,
        ),
      ).toBe(true);
    },
  );
  it("debits 0.1p per discharge, starts a 1/3-second cooldown", () => {
    const f = fixture((b) => (b.hull[0] = PART));
    f.energy.capacity = 1; // keeps the 10% floor at the cost of one discharge
    const [w] = f.turrets();
    f.place(w, f.body(0, 0, "wreck"), 40, 0);
    f.align(w);
    f.resources.power = 0.1;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.resources.power).toBeCloseTo(0);
    expect(w.readyAt).toBeCloseTo(f.system.time + POINT_DEFENCE.cooldown);
    f.resources.power = 100;
    const first = f.system.time;
    while (f.system.pointDefenceDischarges < 2) f.step();
    expect(f.system.time - first).toBeGreaterThanOrEqual(
      POINT_DEFENCE.cooldown - 1e-9,
    );
    expect(f.system.time - first).toBeLessThan(POINT_DEFENCE.cooldown + STEP);
    // Three shots per second at 0.3p/s.
    const shots = f.system.pointDefenceDischarges,
      spent = f.system.energySpent;
    f.step(Math.round(1 / STEP));
    expect(f.system.pointDefenceDischarges - shots).toBe(3);
    expect(f.system.energySpent - spent).toBeCloseTo(0.3);
  });
  it("funds turrets in mount order: 0.15p fires only the first", () => {
    const f = fixture((b) => b.hull.fill(PART));
    f.energy.capacity = 1;
    const [a, b] = f.turrets();
    f.place(a, f.body(0, 0, "wreck"), 30, 0);
    f.align(a);
    f.align(b);
    f.resources.power = 0.15;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.resources.power).toBeCloseTo(0.05);
    expect(a.readyAt).toBeGreaterThan(0);
    expect(b.readyAt).toBe(0);
  });
  it("draws defence power before guns: 0.15p fires the turret and leaves the cannon ready", () => {
    // Capacity 1 keeps the 10% floor below one discharge.
    // The cannon precedes the turret in mount order; class order still wins.
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
    // The cannon is ready and its trigger holds, so only power stops it.
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    f.resources.power = 0.15;
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(f.resources.power).toBeCloseTo(0.05);
    expect(f.system.ionDischarges).toBe(0);
    expect(cannon.readyAt).toBe(0);
    expect(f.system.events.some((e) => e.kind === "ion-cannon")).toBe(false);
  });
  it("resolves a laser before a cannon: the energy floor admits only the first shot", () => {
    const f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = "laser";
    });
    const cannon = f.system.weapons.find((x) => x.kind === "light-ion-cannon");
    const laser = f.system.weapons.find((x) => x.kind === "laser");
    if (!cannon || !laser) throw new Error("Weapons missing");
    expect(f.system.weapons.indexOf(cannon)).toBeLessThan(
      f.system.weapons.indexOf(laser),
    );
    const wreck = f.body(f.ship.pos.x + 60, f.ship.pos.y, "wreck");
    const base = weaponPose(f.ship, laser.mount, laser.angle);
    laser.angle =
      Math.atan2(wreck.y - base.y, wreck.x - base.x) - f.ship.rotation;
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    // Above the floor by less than one cannon shot: whichever weapon draws
    // first leaves the other below the floor.
    const floor = f.energy.capacity * WEAPONS.energyFloor;
    f.resources.power = floor + ION_CANNON.energy / 2;
    f.step();
    expect(f.system.laserPulses).toBe(1);
    expect(laser.readyAt).toBeGreaterThan(0);
    expect(f.system.ionDischarges).toBe(0);
    expect(cannon.readyAt).toBe(0);
    expect(f.resources.power).toBeCloseTo(
      floor + ION_CANNON.energy / 2 - WEAPONS.laser.energy,
    );
  });
  it("resolves guns in build-mount order: the gun mounted first spends and the floor stops the other", () => {
    const gunOrder = (first: "rail" | "light-ion-cannon") => {
      const f = fixture((b) => {
        b.hull[0] = first;
        b.hull[1] = first === "rail" ? "light-ion-cannon" : "rail";
      });
      const rail = f.system.weapons.find((x) => x.kind === "rail");
      const cannon = f.system.weapons.find(
        (x) => x.kind === "light-ion-cannon",
      );
      if (!rail || !cannon) throw new Error("Weapons missing");
      expect(
        f.system.weapons.indexOf(rail) < f.system.weapons.indexOf(cannon),
      ).toBe(first === "rail");
      // Ahead of both fixed barrels and inside the cannon's acquisition.
      f.body(f.ship.pos.x + 120, f.ship.pos.y, "wreck");
      expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
      // Above the floor by less than one cannon shot, so one shot drops below it.
      const floor = f.energy.capacity * WEAPONS.energyFloor;
      f.resources.power = floor + ION_CANNON.energy / 2;
      f.step();
      return { f, rail, cannon, floor };
    };
    const railFirst = gunOrder("rail");
    expect(railFirst.f.system.shotsFired).toBe(1);
    expect(railFirst.f.system.ionDischarges).toBe(0);
    expect(railFirst.cannon.readyAt).toBe(0);
    expect(railFirst.f.resources.power).toBeCloseTo(
      railFirst.floor + ION_CANNON.energy / 2 - WEAPONS.rail.energy,
    );
    const cannonFirst = gunOrder("light-ion-cannon");
    expect(cannonFirst.f.system.ionDischarges).toBe(1);
    expect(cannonFirst.f.system.shotsFired).toBe(0);
    expect(cannonFirst.rail.readyAt).toBe(0);
    expect(cannonFirst.f.resources.power).toBeCloseTo(
      cannonFirst.floor + ION_CANNON.energy / 2 - ION_CANNON.energy,
    );
  });
  it("evaluates the cannon trigger after defence: a turret kill of the only material leaves the cannon idle", () => {
    const f = fixture((b) => {
      b.hull[0] = "light-ion-cannon";
      b.hull[1] = PART;
    });
    const [w] = f.turrets();
    const cannon = f.system.weapons.find((x) => x.kind === "light-ion-cannon");
    if (!cannon) throw new Error("Cannon missing");
    const fragment = f.place(w, f.body(0, 0), 30, f.ship.rotation);
    fragment.hull = 1;
    f.align(w);
    // Before the update the fragment alone holds the cannon's trigger.
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(true);
    f.step();
    expect(f.system.pointDefenceDischarges).toBe(1);
    expect(fragment.hull).toBeLessThanOrEqual(0);
    // The cannon queries the world the turret left: no discharge, cost or cooldown.
    expect(f.system.ionTrigger(f.ship, f.star, f.planets)).toBe(false);
    expect(f.system.ionDischarges).toBe(0);
    expect(cannon.readyAt).toBe(0);
    expect(f.resources.power).toBeCloseTo(100 - POINT_DEFENCE.energy);
  });
  it("does nothing while paused and starts clean after reset", () => {
    const build = defaultLoadout("fighter");
    build.hull[0] = PART;
    const settings = {
      ...stockSettings("fighter"),
      loadout: LoadoutSchema.parse(build),
      mode: "derelicts" as const,
      arrival: false,
    };
    const sim = new Simulation(settings);
    sim.planets.length = 0;
    sim.star.pos.set(1800, 1000);
    sim.ship.pos.set(400, 400);
    sim.ship.vel.set(0, 0);
    sim.start();
    const salvage = sim.salvage;
    if (!salvage) throw new Error("Salvage missing");
    salvage.nextPass = Infinity;
    const w = salvage.weapons.find((x) => x.kind === PART) as WeaponState;
    const p = weaponPose(sim.ship, w.mount, w.angle);
    salvage.bodies.push({
      id: 101,
      group: 101,
      kind: "wreck",
      x: p.x + 60,
      y: p.y + 30,
      previousX: p.x + 60,
      previousY: p.y + 30,
      vx: 0,
      vy: 0,
      radius: 18,
      hull: 85,
      life: 60,
      rotation: 0,
    });
    const idle = { leftThruster: false, rightThruster: false, fire: false };
    for (let i = 0; i < 60; i++) sim.step(idle);
    expect(salvage.pointDefenceDischarges).toBeGreaterThan(0);
    const snapshot = JSON.stringify({
      angle: w.angle,
      readyAt: w.readyAt,
      bodies: salvage.bodies,
      power: sim.state.resources.power,
      shots: salvage.pointDefenceDischarges,
    });
    // Paused play stops updates: the simulation steps only while PLAYING.
    sim.state.status = "MENU";
    for (let i = 0; i < 60; i++) sim.step(idle);
    expect(
      JSON.stringify({
        angle: w.angle,
        readyAt: w.readyAt,
        bodies: salvage.bodies,
        power: sim.state.resources.power,
        shots: salvage.pointDefenceDischarges,
      }),
    ).toBe(snapshot);
    const reset = new Simulation(settings);
    const fresh = reset.salvage?.weapons.find((x) => x.kind === PART);
    expect(fresh?.angle).toBe(fresh?.mount.angle);
    expect(fresh?.readyAt).toBe(0);
    expect(reset.salvage?.events).toEqual([]);
    expect(reset.salvage?.pointDefenceDischarges).toBe(0);
  });
});
