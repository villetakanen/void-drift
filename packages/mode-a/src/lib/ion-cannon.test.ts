import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { BUILD_FLIGHT_SCALE, buildMounts, weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import { ION_CANNON_MUZZLE } from "./ion-cannon-art";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout, LoadoutSchema, slotAccepts } from "./schemas/loadout";
import { ION_CANNON, ionCannonDamage } from "./schemas/salvage";
import { STEP } from "./simulation";

function fixture() {
  const loadout = defaultLoadout("fighter");
  loadout.hull.fill("light-ion-cannon");
  const system = new SalvageSystem(LoadoutSchema.parse(loadout), 2026);
  system.nextPass = Infinity;
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const star = createStar("G", 960, 540);
  const resources = { power: 100, hull: 100 };
  const step = (n = 1) => {
    for (let i = 0; i < n; i++)
      system.step(
        STEP,
        ship,
        star,
        resources,
        100,
        ship.pos.x,
        ship.pos.y,
        false,
      );
  };
  const target = (
    x = 500,
    y = 400,
    id = 101,
    kind: SalvageBody["kind"] = "wreck",
  ) => {
    const body: SalvageBody = {
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
    };
    system.bodies.push(body);
    return body;
  };
  return { loadout, system, ship, star, resources, step, target };
}
describe("Light Ion Cannon", () => {
  it("validates old and new loadouts and uses compatible slots", () => {
    expect(LoadoutSchema.safeParse(defaultLoadout("fighter")).success).toBe(
      true,
    );
    const f = fixture();
    expect(f.system.weapons).toHaveLength(2);
    expect(slotAccepts("engine", "G")).toBe(false);
    expect(slotAccepts("support", "G")).toBe(false);
    expect(slotAccepts("equipment", "G")).toBe(true);
    for (const m of buildMounts(f.loadout).filter(
      (m) => m.part === "light-ion-cannon",
    )) {
      const p = weaponPose(f.ship, m);
      expect(Math.hypot(p.muzzleX - p.x, p.muzzleY - p.y)).toBeCloseTo(
        ION_CANNON_MUZZLE,
      );
      expect(ION_CANNON_MUZZLE / BUILD_FLIGHT_SCALE).toBeGreaterThan(16);
    }
  });
  it.each([
    [0, 16],
    [49.999, 16],
    [50, 12],
    [99.999, 12],
    [100, 8],
    [149.999, 8],
    [150, 4],
    [200, 4],
    [200.001, 0],
    [-1, 0],
  ])("damage at %s units is %s", (d, v) => expect(ionCannonDamage(d)).toBe(v));
  it("empty line and energy collectibles do not trigger", () => {
    const f = fixture();
    f.step();
    f.target(500, 400, 101, "cell");
    f.step();
    expect(f.system.ionDischarges).toBe(0);
  });
  it("fires the ready volley, charges every miss, respects independent cooldowns and has no recoil", () => {
    const f = fixture();
    f.target();
    f.step();
    expect(f.system.ionDischarges).toBe(2);
    expect(f.system.energySpent).toBeCloseTo(0.4);
    expect(f.system.weapons.every((w) => w.recoil === null)).toBe(true);
    f.step(18);
    expect(f.system.ionDischarges).toBe(2);
    f.step(2);
    expect(f.system.ionDischarges).toBe(4);
  });
  it("allocates scarce power in stable mount order without a ten-power reserve", () => {
    const f = fixture();
    f.target();
    f.resources.power = 0.3;
    f.step();
    expect(f.system.ionDischarges).toBe(1);
    expect(f.system.weapons[0].readyAt).toBeGreaterThan(0);
    expect(f.system.weapons[1].readyAt).toBe(0);
    expect(f.resources.power).toBeCloseTo(0.1);
  });
  it("stops at the first real hull and blocks the trigger behind world geometry", () => {
    const f = fixture();
    const near = f.target();
    f.target(550, 400, 102);
    expect(f.system.ionContact(400, 400, 0, f.star, []).hit).toBe(near);
    f.star.pos.set(450, 400);
    f.star.radius = 15;
    f.step();
    expect(f.system.ionDischarges).toBe(0);
  });
  it("pays for offset misses on a small centreline fragment", () => {
    const f = fixture();
    // Use the existing offset aft slots, retaining centreline hull slots empty.
    const build = defaultLoadout("fighter");
    build.aft.fill("light-ion-cannon");
    const offset = new SalvageSystem(build, 2026);
    offset.nextPass = Infinity;
    f.system.weapons.splice(0, f.system.weapons.length, ...offset.weapons);
    // Find a real shard orientation intersecting the centreline, outside both side barrels.
    const t = f.target(500, 400, 101, "fragment");
    let found = false;
    for (let shard = 0; shard < 8 && !found; shard++)
      for (let i = 0; i < 360; i++) {
        t.shardIndex = shard;
        t.rotation = (i * Math.PI) / 180;
        const centre = f.system.ionContact(400, 400, 0, f.star, []).hit;
        const miss = f.system.weapons.some((w) => {
          const p = weaponPose(f.ship, w.mount);
          return !f.system.ionContact(p.muzzleX, p.muzzleY, p.angle, f.star, [])
            .hit;
        });
        if (centre && miss) {
          found = true;
          break;
        }
      }
    expect(found).toBe(true);
    expect(f.system.ionContact(400, 400, 0, f.star, []).hit).toBe(t);
    f.step();
    expect(f.system.ionDischarges).toBe(2);
    expect(f.system.energySpent).toBeCloseTo(0.4);
    expect(
      f.system.events
        .filter((e) => e.kind === "ion-cannon")
        .some(
          (e) => e.kind === "ion-cannon" && e.distance === ION_CANNON.range,
        ),
    ).toBe(true);
  });
  it("resolves once per discharge and retains the volley after destruction", () => {
    const f = fixture();
    const t = f.target();
    t.hull = 1;
    f.step();
    expect(f.system.ionDischarges).toBe(2);
    expect(f.system.playerKills).toBe(1);
    const spent = f.system.energySpent;
    f.step(3);
    expect(f.system.energySpent).toBe(spent);
  });
  it("acquires material inside the ship-width rectangle even when the centreline misses", () => {
    const f = fixture();
    const t = f.target(500, 400, 101, "fragment");
    let found = false;
    for (let y = 401; y < 440 && !found; y++)
      for (let shard = 0; shard < 8; shard++) {
        t.y = t.previousY = y;
        t.shardIndex = shard;
        if (
          !f.system.ionContact(400, 400, 0, f.star, []).hit &&
          f.system.ionTrigger(f.ship, f.star, [])
        ) {
          found = true;
          break;
        }
      }
    expect(found).toBe(true);
    f.step();
    expect(f.system.ionDischarges).toBe(2);
  });
  it("does not acquire material outside the rectangle or behind the ship", () => {
    const f = fixture();
    f.target(500, 500);
    expect(f.system.ionTrigger(f.ship, f.star, [])).toBe(false);
    f.system.bodies = [];
    f.target(300, 400);
    expect(f.system.ionTrigger(f.ship, f.star, [])).toBe(false);
    f.system.bodies = [];
    f.target(750, 400);
    expect(f.system.ionTrigger(f.ship, f.star, [])).toBe(false);
  });
  it.each([25, 75, 125, 175])(
    "applies only the first contact's damage at %s muzzle units",
    (distance) => {
      const f = fixture();
      f.system.weapons.splice(0, 1);
      const w = f.system.weapons[0],
        p = weaponPose(f.ship, w.mount);
      const near = f.target(p.muzzleX + 100, p.muzzleY);
      const initial = f.system.ionContact(
        p.muzzleX,
        p.muzzleY,
        p.angle,
        f.star,
        [],
      ).distance;
      near.x += distance - initial;
      near.previousX = near.x;
      const far = f.target(near.x + 90, p.muzzleY, 102);
      f.step();
      expect(near.hull).toBe(1000 - ionCannonDamage(distance));
      expect(far.hull).toBe(1000);
      const hull = near.hull;
      f.step(3);
      expect(near.hull).toBe(hull);
    },
  );
});
