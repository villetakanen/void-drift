import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import { type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout, LoadoutSchema } from "./schemas/loadout";
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
  const energy = { capacity: 100 };
  const step = (n = 1) => {
    for (let i = 0; i < n; i++)
      system.step(
        STEP,
        ship,
        star,
        resources,
        energy.capacity,
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
  return { loadout, system, ship, star, resources, energy, step, target };
}
describe("Light Ion Cannon", () => {
  it("does no damage beyond its range, and its far endpoint still damages", () => {
    expect(ionCannonDamage(ION_CANNON.range)).toBeGreaterThan(0);
    expect(ionCannonDamage(ION_CANNON.range + 0.001)).toBe(0);
  });
  it("is not triggered by collectible energy", () => {
    const f = fixture();
    f.target(500, 400, 101, "cell");
    f.step();
    expect(f.system.ionDischarges).toBe(0);
  });
  it("does not fire again before its cooldown ends", () => {
    const f = fixture();
    const volley = f.system.weapons.length;
    const cooldown = Math.round(ION_CANNON.cooldown / STEP);
    f.target();
    f.step();
    expect(f.system.ionDischarges).toBe(volley);
    f.step(cooldown - 2);
    expect(f.system.ionDischarges).toBe(volley);
    f.step(2);
    expect(f.system.ionDischarges).toBe(2 * volley);
  });
  it("allocates scarce power in stable mount order", () => {
    const f = fixture();
    // A two-shot capacity keeps the energy floor below the power left for a shot.
    f.energy.capacity = 2 * ION_CANNON.energy;
    f.target();
    // Funds one shot, not two.
    f.resources.power = 1.5 * ION_CANNON.energy;
    f.step();
    expect(f.system.ionDischarges).toBe(1);
    expect(f.system.weapons[0].readyAt).toBeGreaterThan(0);
    expect(f.system.weapons[1].readyAt).toBe(0);
  });
  it("is not triggered through the star", () => {
    const f = fixture();
    f.target();
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
    f.step();
    expect(f.system.ionDischarges).toBe(f.system.weapons.length);
    expect(f.system.energySpent).toBeCloseTo(
      f.system.ionDischarges * ION_CANNON.energy,
    );
  });
  it("fires the whole ready volley even when the first shot destroys the trigger", () => {
    const f = fixture();
    const t = f.target();
    t.hull = 1;
    f.step();
    expect(f.system.playerKills).toBe(1);
    expect(f.system.ionDischarges).toBe(f.system.weapons.length);
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
    expect(f.system.ionDischarges).toBe(f.system.weapons.length);
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
  it("damages only the first contact, once per discharge", () => {
    const f = fixture();
    f.system.weapons.splice(0, 1);
    const p = weaponPose(f.ship, f.system.weapons[0].mount);
    const near = f.target(p.muzzleX + 75, p.muzzleY);
    const far = f.target(near.x + 90, p.muzzleY, 102);
    f.step();
    expect(near.hull).toBeLessThan(1000);
    expect(far.hull).toBe(1000);
    const hull = near.hull;
    f.step(3);
    expect(near.hull).toBe(hull);
  });
});
