import { ARENA_RADIUS, FxPass, fxRetention, Vec2 } from "@void-drift/core";
import { describe, expect, it, vi } from "vitest";
import { weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import { drawPlasmaVent } from "./plasma-vent-fx";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import {
  buildStats,
  defaultLoadout,
  type Loadout,
  PARTS,
} from "./schemas/loadout";
import { SALVAGE } from "./schemas/salvage";
import { gameSettings, Simulation, STEP } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };
const star = createStar("G", 10_000, 10_000);

function studyWasp() {
  const build = defaultLoadout("wasp");
  build.side = "service-ion";
  build.hull = ["plasma-rifle", "light-ion-cannon"];
  return build;
}

function freeFlight() {
  const sim = new Simulation({
    ...gameSettings("wasp"),
    loadout: studyWasp(),
    mode: "derelicts",
    arrival: false,
  });
  sim.start();
  sim.planets.length = 0;
  sim.star.pos.set(star.pos.x, star.pos.y);
  sim.ship.pos.set(400, 400);
  sim.ship.vel.set(0, 0);
  sim.ship.rotation = 0;
  const system = sim.salvage;
  if (!system) throw new Error("Expected a free-flight encounter");
  system.nextPass = Infinity;
  const [rifle, cannon] = system.weapons;
  cannon.readyAt = Infinity;
  const muzzle = weaponPose(sim.ship, rifle.mount);
  const target = liveShipBody(
    20,
    {
      ...sim.ship,
      pos: new Vec2(muzzle.muzzleX + 105, muzzle.muzzleY),
      radius: 20,
    },
    100,
    () => {},
  );
  system.bodies.push({ ...target, kind: "wreck", life: 20 });
  function ticks(count: number) {
    for (let n = 0; n < count; n++) sim.step(still);
  }
  return { sim, system, rifle, ticks };
}

function mountedFixture(loadout: Loadout, rotation = 0) {
  const system = new SalvageSystem(loadout, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(24, -12),
    acc: new Vec2(0, 0),
    rotation,
    radius: 20,
  };
  const resources = { hull: 100, power: 100 };
  const targets = system.weapons.map((weapon, index) => {
    const muzzle = weaponPose(ship, weapon.mount);
    return liveShipBody(
      20 + index,
      {
        ...ship,
        pos: new Vec2(
          muzzle.muzzleX + 8 * Math.cos(muzzle.angle),
          muzzle.muzzleY + 8 * Math.sin(muzzle.angle),
        ),
        radius: 2,
      },
      100,
      () => {},
    );
  });
  function step(dt: number, roster: readonly SalvageBody[] = targets) {
    system.stepWeapons(dt, ship, star, resources, 100, [], roster);
  }
  return { system, ship, resources, targets, step };
}

describe("paired plasma vents", () => {
  it("emits identical samples and recoil after a shot and after losing a quarter charge", () => {
    const shot = mountedFixture(studyWasp());
    const loss = mountedFixture(studyWasp());
    shot.step(0.7, [shot.targets[0]]);
    shot.step(0.7, []);
    loss.step(1.225, []);
    loss.step(0.175, [loss.targets[0]]);
    expect(shot.system.plasmaReleases).toBe(1);
    expect(loss.system.weapons[0].plasma?.charge).toBeCloseTo(0.25);
    loss.ship.vel.set(shot.ship.vel.x, shot.ship.vel.y);
    for (let tick = 0; tick < 72; tick++) {
      for (const flight of [shot, loss]) {
        flight.ship.rotation = tick / 100;
        flight.step(1 / 240, []);
      }
      const a = shot.system.plasmaVentEvents[tick];
      const b = loss.system.plasmaVentEvents[tick];
      expect(a.intensity).toBeCloseTo(b.intensity, 10);
      expect(a.time).toBeCloseTo(b.time, 10);
      expect(a.outlets).toEqual(b.outlets);
      expect(shot.ship.vel).toEqual(loss.ship.vel);
    }
    for (const flight of [shot, loss]) {
      expect(flight.system.plasmaVentEvents).toHaveLength(72);
      expect(flight.system.plasmaVents).toBe(1);
      expect(flight.system.weapons[0].plasma?.phase).toBe("cooldown");
    }
  });

  it("scales vent recoil by actual fitted mass and stays committed when the target returns", () => {
    const ventImpulse = (build: Loadout, heading: number) => {
      const f = mountedFixture(build, heading);
      const [rifle] = f.system.weapons;
      const roster = [f.targets[0]];
      const { x: vx, y: vy } = f.ship.vel;
      f.step(0.35, roster);
      f.step(0.05, []);
      // Reintroducing the target leaves venting committed.
      f.step(0.25, roster);
      expect(rifle.plasma?.phase).toBe("cooldown");
      expect(f.ship.rotation).toBe(heading);
      const dx = f.ship.vel.x - vx;
      const dy = f.ship.vel.y - vy;
      expect(dx * Math.sin(heading) - dy * Math.cos(heading)).toBeCloseTo(0, 8);
      expect(dx * Math.cos(heading) + dy * Math.sin(heading)).toBeLessThan(0);
      return Math.hypot(dx, dy) * buildStats(build).mass;
    };
    const fighter = defaultLoadout("fighter");
    fighter.aft[0] = "plasma-rifle";
    expect(ventImpulse(fighter, Math.PI / 3)).toBeCloseTo(
      ventImpulse(studyWasp(), 0),
      6,
    );
  });

  it("adds independent recoil for two different paid charge fractions", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const recoil = (both: boolean) => {
      const f = mountedFixture(build);
      const [left, right] = f.system.weapons;
      const { x: vx, y: vy } = f.ship.vel;
      f.step(0.175, [f.targets[0]]);
      f.step(0.175, both ? f.targets : [f.targets[0]]);
      if (both) {
        expect(left.plasma?.charge).toBeCloseTo(0.5);
        expect(right.plasma?.charge).toBeCloseTo(0.25);
      }
      f.step(0.3, []);
      expect(f.system.plasmaVents).toBe(both ? 2 : 1);
      expect(f.ship.vel.y).toBe(vy);
      expect(f.ship.rotation).toBe(0);
      return f.ship.vel.x - vx;
    };
    const single = recoil(false);
    expect(single).toBeLessThan(0);
    expect(recoil(true)).toBeCloseTo(2 * single, 8);
  });

  it("turns the vent force with the hull and leaves its previously emitted sample fixed", () => {
    const f = mountedFixture(studyWasp());
    const { x: vx, y: vy } = f.ship.vel;
    f.step(0.35, [f.targets[0]]);
    f.step(0.075, []);
    const push = vx - f.ship.vel.x;
    expect(push).toBeGreaterThan(0);
    const [initial] = f.system.plasmaVentEvents.map((event) =>
      structuredClone(event),
    );
    f.ship.rotation = Math.PI / 2;
    f.step(0.075, []);
    expect(f.ship.vel.x).toBeCloseTo(vx - push, 8);
    expect(vy - f.ship.vel.y).toBeCloseTo(push, 8);
    expect(f.ship.rotation).toBe(Math.PI / 2);
    expect(f.system.plasmaVentEvents[0]).toEqual(initial);
  });

  it("draws a brief vent at ejection and lets the fume marks drift and fade after the hull turns", () => {
    const f = mountedFixture(studyWasp(), Math.PI / 3);
    f.step(STEP / 4, [f.targets[0]]);
    f.step(STEP / 4, []);
    expect(f.system.plasmaVentEvents).toHaveLength(1);
    const [sample] = f.system.plasmaVentEvents;
    // The only paired emission falls in the second combat substep.
    expect(Math.floor(sample.time / (STEP / 4))).toBe(1);

    const marks: Array<{ x: number; y: number; alpha: number }> = [];
    const fakeCanvas = {
      canvas: { width: 1920, height: 1080 },
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      globalAlpha: 1,
      fillStyle: "",
      save() {},
      restore() {},
      beginPath() {},
      arc(x: number, y: number) {
        marks.push({ x, y, alpha: this.globalAlpha });
      },
      fill() {},
    };
    const ctx = fakeCanvas as unknown as CanvasRenderingContext2D;
    function draw(time: number) {
      marks.length = 0;
      const pass = new FxPass();
      pass.begin(ctx, true, 2.2 * (1 - fxRetention(STEP)));
      drawPlasmaVent(ctx, pass, f.system, time);
      pass.end(ctx);
      return marks.slice();
    }

    const initial = draw(sample.time);
    expect(initial.map(({ x, y }) => ({ x, y }))).toEqual(
      sample.outlets.map(({ x, y }) => ({ x, y })),
    );
    f.ship.pos.set(1500, 780);
    f.ship.rotation += Math.PI / 2;
    f.ship.vel.set(-50, 35);
    // Inspect the already emitted sample independently of later emissions.

    const age = 0.15;
    const cooled = draw(sample.time + age);
    expect(cooled).toHaveLength(2);
    for (const [side, port] of sample.outlets.entries()) {
      const drift = Math.hypot(port.vx, port.vy) * age;
      expect(
        Math.hypot(
          cooled[side].x - (port.x + port.vx * age),
          cooled[side].y - (port.y + port.vy * age),
        ),
      ).toBeLessThan(0.2 * drift);
      expect(cooled[side].alpha).toBeLessThan(initial[side].alpha);
    }
    expect(draw(sample.time + 0.361)).toEqual([]);
  });

  it("keeps old fumes detached and starts new emission locally across flight wrap", () => {
    const f = freeFlight();
    f.ticks(21);
    expect(f.rifle.plasma?.charge).toBeCloseTo(0.5);
    f.system.bodies.length = 0;
    f.sim.ship.pos.set(960 + ARENA_RADIUS - 1.2, 540);
    f.sim.ship.vel.set(50, 0);
    f.ticks(1);
    expect(f.sim.ship.pos.x).toBeGreaterThan(960 + ARENA_RADIUS - 2);
    const initial = f.system.plasmaVentEvents.map((event) =>
      structuredClone(event),
    );
    expect(initial).toHaveLength(4);
    f.ticks(1);
    expect(f.sim.ship.pos.x).toBeLessThan(960 - ARENA_RADIUS + 20);
    expect(f.system.plasmaVentEvents.slice(0, initial.length)).toEqual(initial);
    const samples = f.system.plasmaVentEvents.slice(initial.length);
    expect(samples).toHaveLength(4);
    const positions = samples.flatMap(({ outlets }) =>
      outlets.map(({ x }) => x),
    );
    expect(positions.some((x) => x < 960 - ARENA_RADIUS + 32)).toBe(true);
    expect(positions.every((x) => Math.abs(x - 960) > ARENA_RADIUS - 32)).toBe(
      true,
    );
  });

  it("damages a ship on vent entry for both triggers and preserves contact during cooldown", () => {
    const damageFor = (trigger: "shot" | "loss") => {
      const f = mountedFixture(studyWasp());
      if (trigger === "shot") {
        f.step(0.7, [f.targets[0]]);
        f.step(0.7, []);
      } else {
        f.step(1.05, []);
        f.step(0.35, [f.targets[0]]);
      }
      f.step(0.05, []);
      const sample = f.system.plasmaVentEvents.at(-1);
      if (!sample) throw new Error("Expected vent emission");
      const outlet = sample.outlets[0];
      let damage = 0;
      const victim = liveShipBody(
        900,
        {
          ...f.ship,
          pos: new Vec2(
            outlet.x + outlet.vx * 0.025,
            outlet.y + outlet.vy * 0.025,
          ),
          vel: new Vec2(outlet.vx, outlet.vy),
          radius: 1,
        },
        100,
        (amount) => {
          damage += amount;
        },
      );
      f.step(1 / 240, [victim]);
      expect(damage).toBe(3);
      for (let i = 0; i < 10; i++) {
        victim.previousX += outlet.vx / 240;
        victim.previousY += outlet.vy / 240;
        victim.x = victim.previousX;
        victim.y = victim.previousY;
        f.step(1 / 240, [victim]);
      }
      expect(damage).toBe(3);
      return damage;
    };
    expect(damageFor("shot")).toBe(damageFor("loss"));
  });

  it("keeps damaging after the emitter stops running its weapon cycle", () => {
    const f = mountedFixture(studyWasp());
    f.step(0.35, [f.targets[0]]);
    f.step(0.05, []);
    const sample = f.system.plasmaVentEvents.at(-1);
    if (!sample) throw new Error("Expected vent emission");
    const outlet = sample.outlets[0];
    let damage = 0;
    const victim = liveShipBody(
      900,
      {
        ...f.ship,
        pos: new Vec2(
          outlet.x + outlet.vx * 0.025,
          outlet.y + outlet.vy * 0.025,
        ),
        vel: new Vec2(outlet.vx, outlet.vy),
        radius: 1,
      },
      100,
      (amount) => {
        damage += amount;
      },
    );
    expect(f.system.hasActivePlasma).toBe(true);
    f.system.stepPlasmaStreams(1 / 240, star, [], [victim], 901);
    expect(damage).toBe(3);
    f.system.stepPlasmaStreams(0.5, star, [], [], 901);
    expect(f.system.hasActivePlasma).toBe(false);
  });

  it("checks fragments born during vent damage at their birth time", () => {
    const f = mountedFixture(studyWasp());
    const wreck: SalvageBody = {
      kind: "wreck",
      id: 500,
      group: 500,
      x: 500,
      y: 500,
      previousX: 500,
      previousY: 500,
      vx: 0,
      vy: 0,
      radius: 18,
      hull: 3,
      life: 10,
      rotation: 0,
      spin: 0,
    };
    f.system.bodies.push(wreck);
    f.system.nextPass = Infinity;
    const port = { x: 450, y: 500, vx: 500, vy: 0 };
    const far = { x: 450, y: 800, vx: 500, vy: 0 };
    f.system.plasmaVentArea.emit("test", 0, 0.1, [port, far], [port, far]);
    f.system.step(0.1, f.ship, star, f.resources, 100, 400, 400, false);
    expect(wreck.hull).toBe(0);
    const fragments = f.system.bodies.filter(
      (body) => body.kind === "fragment",
    );
    expect(fragments).toHaveLength(SALVAGE.fragment.count);
    expect(fragments.some((body) => body.hull < SALVAGE.fragment.hull)).toBe(
      true,
    );
  });

  it("rechecks remaining wreck material when a vent hit releases a shard", () => {
    const f = mountedFixture(studyWasp());
    const wreck: SalvageBody = {
      kind: "wreck",
      id: 500,
      group: 500,
      x: 500,
      y: 500,
      previousX: 500,
      previousY: 500,
      vx: 0,
      vy: 0,
      radius: 18,
      hull: 69,
      initialHull: SALVAGE.wreck.hull,
      life: 10,
      rotation: 0,
      spin: 0,
    };
    f.system.bodies.push(wreck);
    f.system.nextPass = Infinity;

    // This point is on shard zero and over 14 units from the remaining wreck.
    const port = { x: 491.16, y: 449.82, vx: 0, vy: 0 };
    const far = { x: 450, y: 800, vx: 0, vy: 0 };
    f.system.plasmaVentArea.emit("first", 0.01, 0.01, [port, far], [port, far]);
    f.system.plasmaVentArea.emit(
      "second",
      0.03,
      0.01,
      [port, far],
      [port, far],
    );
    f.system.step(0.05, f.ship, star, f.resources, 100, 400, 400, false);

    const shard = f.system.bodies.find(
      (body) => body.kind === "fragment" && body.shardIndex === 0,
    );
    expect(wreck.hull).toBe(66);
    expect(shard?.hull).toBe(SALVAGE.fragment.hull - 6);
  });

  it("splits vent emissions at a neighbouring rifle release", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const f = mountedFixture(build);
    f.step(0.34, [f.targets[1]]);
    f.step(0.35);
    const right = f.system.weapons[1];
    const pose = weaponPose(f.ship, right.mount);
    const target = {
      ...f.targets[1],
      x: pose.muzzleX + 120 * Math.cos(pose.angle),
      y: pose.muzzleY + 120 * Math.sin(pose.angle),
    };
    target.previousX = target.x;
    target.previousY = target.y;
    const emit = vi.spyOn(f.system.plasmaVentArea, "emit");
    f.step(0.02, [target]);
    expect(emit).toHaveBeenCalledTimes(2);
    const kick = (PARTS.plasma.thrust * 0.49) / buildStats(build).mass;
    const [before, after] = emit.mock.calls;
    expect(after[3][0].vx - before[4][0].vx).toBeCloseTo(
      -kick * Math.cos(pose.angle),
      7,
    );
    expect(f.system.plasmaVentEvents).toHaveLength(1);
    expect(
      f.system.plasmaVentEvents[0].outlets[0].vx - before[4][0].vx,
    ).toBeCloseTo(-kick * Math.cos(pose.angle), 7);
  });

  it("gives simultaneous releases the same pre-kick drift and sums their impulses", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const f = mountedFixture(build);
    const poses = f.system.weapons.map((weapon) =>
      weaponPose(f.ship, weapon.mount),
    );
    f.step(0.7);
    expect(f.system.plasmaReleases).toBe(2);
    const kick = (PARTS.plasma.thrust * 0.49) / buildStats(build).mass;
    expect(f.ship.vel.x).toBeCloseTo(
      24 - kick * poses.reduce((sum, pose) => sum + Math.cos(pose.angle), 0),
      8,
    );
    expect(f.ship.vel.y).toBeCloseTo(
      -12 - kick * poses.reduce((sum, pose) => sum + Math.sin(pose.angle), 0),
      8,
    );
    for (const [index, head] of f.system.plasmaStreams.entries()) {
      expect(head.vx - 7800 * Math.cos(poses[index].angle)).toBeCloseTo(24, 8);
      expect(head.vy - 7800 * Math.sin(poses[index].angle)).toBeCloseTo(-12, 8);
    }
  });

  it("applies an earlier rifle kick to a later launch within the same substep", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const f = mountedFixture(build);
    const [first, second] = f.system.weapons;
    if (!first.plasma || !second.plasma) throw new Error("Expected rifles");
    Object.assign(first.plasma, {
      phase: "charging",
      targetId: f.targets[0].id,
      charge: 1 - 0.002 / 0.7,
    });
    Object.assign(second.plasma, {
      phase: "charging",
      targetId: f.targets[1].id,
      charge: 1 - 0.007 / 0.7,
    });
    const poses = [
      weaponPose(f.ship, first.mount),
      weaponPose(f.ship, second.mount),
    ];
    for (const [index, target] of f.targets.entries()) {
      target.x = target.previousX =
        poses[index].muzzleX + 120 * Math.cos(poses[index].angle);
      target.y = target.previousY =
        poses[index].muzzleY + 120 * Math.sin(poses[index].angle);
    }
    f.step(0.01);
    const [a, b] = f.system.plasmaStreams;
    const kick = (PARTS.plasma.thrust * 0.49) / buildStats(build).mass;
    expect(a.vx - 7800 * Math.cos(poses[0].angle)).toBeCloseTo(24, 8);
    expect(b.vx - 7800 * Math.cos(poses[1].angle)).toBeCloseTo(
      24 - kick * Math.cos(poses[0].angle),
      8,
    );
    expect(b.vy - 7800 * Math.sin(poses[1].angle)).toBeCloseTo(
      -12 - kick * Math.sin(poses[0].angle),
      8,
    );
  });
});
