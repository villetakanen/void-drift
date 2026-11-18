import { ARENA_RADIUS, FxPass, fxRetention, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import { PLASMA_RIFLE_MOUTHS, PLASMA_RIFLE_SCALE } from "./plasma-rifle-art";
import { drawPlasmaVent } from "./plasma-vent-fx";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { buildStats, defaultLoadout, type Loadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };
const star = createStar("G", 10_000, 10_000);

function studyWasp() {
  const build = defaultLoadout("wasp");
  build.side = "service-ion";
  build.hull = ["plasma-rifle", "light-ion-cannon"];
  return build;
}

function freeFlight(initialPower = 100) {
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
  sim.state.resources.power = initialPower;
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

describe("plasma target-loss venting", () => {
  it("moves the fitted Wasp backward by its calibrated 37.5 u/s without turning in ordinary flight", () => {
    const f = freeFlight(14.5);
    f.ticks(Math.round(0.7 / STEP));
    expect(f.rifle.plasma?.charge).toBeCloseTo(1, 8);
    expect(f.system.plasmaReleases).toBe(0);
    f.system.bodies.length = 0;
    const { x, y } = f.sim.ship.pos;
    const { x: vx, y: vy } = f.sim.ship.vel;
    const heading = f.sim.ship.rotation;
    f.ticks(Math.round(0.3 / STEP));
    expect(f.sim.ship.vel.x - vx).toBeCloseTo(-37.5, 8);
    expect(f.sim.ship.vel.y).toBeCloseTo(vy, 8);
    expect(f.sim.ship.pos.x).toBeLessThan(x - 5.4);
    expect(f.sim.ship.pos.y).toBeCloseTo(y, 8);
    expect(f.sim.ship.rotation).toBeCloseTo(heading, 8);
    expect(f.rifle.plasma?.phase).toBe("cooldown");
    expect(
      f.system.plasmaVentEvents.reduce((sum, event) => sum + event.duration, 0),
    ).toBeCloseTo(0.3, 8);
  });

  it("scales a partial Fighter vent by actual mass and drains only its paid interval", () => {
    const build = defaultLoadout("fighter");
    build.aft[0] = "plasma-rifle";
    const heading = Math.PI / 3;
    const f = mountedFixture(build, heading);
    const [rifle] = f.system.weapons;
    const { x: vx, y: vy } = f.ship.vel;
    const acceleration =
      (125 * buildStats(studyWasp()).mass) / buildStats(build).mass;
    f.step(0.35);
    expect(rifle.plasma?.charge).toBeCloseTo(0.5);
    f.step(0.05, []);
    const [emission] = f.system.plasmaVentEvents;
    expect(emission.time).toBeCloseTo(0.375, 8);
    expect(emission.duration).toBeCloseTo(0.05, 8);
    const pivot = weaponPose(f.ship, rifle.mount);
    const ports = [PLASMA_RIFLE_MOUTHS.left, PLASMA_RIFLE_MOUTHS.right];
    const midpointVx = vx - acceleration * 0.025 * Math.cos(heading);
    const midpointVy = vy - acceleration * 0.025 * Math.sin(heading);
    for (const [index, [cross, rearward]] of ports.entries()) {
      const outlet = emission.outlets[index];
      const forward = -rearward * PLASMA_RIFLE_SCALE;
      const across = cross * PLASMA_RIFLE_SCALE;
      const angle = pivot.angle + (index === 0 ? -0.305233 : 0.305233);
      expect(outlet.x).toBeCloseTo(
        pivot.x +
          forward * Math.cos(pivot.angle) -
          across * Math.sin(pivot.angle),
        8,
      );
      expect(outlet.y).toBeCloseTo(
        pivot.y +
          forward * Math.sin(pivot.angle) +
          across * Math.cos(pivot.angle),
        8,
      );
      expect(outlet.vx).toBeCloseTo(midpointVx + 300 * Math.cos(angle), 8);
      expect(outlet.vy).toBeCloseTo(midpointVy + 300 * Math.sin(angle), 8);
    }
    // Reintroducing the target leaves venting committed. This step ends in cooldown.
    f.step(0.2);
    expect(rifle.plasma?.phase).toBe("cooldown");
    expect(f.ship.vel.x).toBeCloseTo(
      vx - acceleration * 0.15 * Math.cos(heading),
      8,
    );
    expect(f.ship.vel.y).toBeCloseTo(
      vy - acceleration * 0.15 * Math.sin(heading),
      8,
    );
    expect(f.ship.rotation).toBe(heading);
    expect(
      f.system.plasmaVentEvents.reduce((sum, event) => sum + event.duration, 0),
    ).toBeCloseTo(0.15, 8);
    expect(f.resources.power).toBeCloseTo(100 - 1.75, 8);
  });

  it("adds independent recoil for two different paid charge fractions", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const f = mountedFixture(build);
    const [left, right] = f.system.weapons;
    const { x: vx, y: vy } = f.ship.vel;
    f.step(0.175, [f.targets[0]]);
    f.step(0.175);
    expect(left.plasma?.charge).toBeCloseTo(0.5);
    expect(right.plasma?.charge).toBeCloseTo(0.25);
    f.step(0.2, []);
    expect(f.system.plasmaVents).toBe(2);
    expect(left.plasma?.phase).toBe("cooldown");
    expect(right.plasma?.phase).toBe("cooldown");
    expect(f.system.plasmaVentEvents).toHaveLength(2);
    const durations = f.system.plasmaVentEvents
      .map((event) => event.duration)
      .sort((a, b) => a - b);
    expect(durations[0]).toBeCloseTo(0.075, 8);
    expect(durations[1]).toBeCloseTo(0.15, 8);
    const acceleration =
      (125 * buildStats(studyWasp()).mass) / buildStats(build).mass;
    for (const event of f.system.plasmaVentEvents) {
      const elapsed = event.time - 0.35;
      expect(elapsed).toBeCloseTo(event.duration / 2, 8);
      const sharedImpulse = acceleration * (elapsed + Math.min(elapsed, 0.075));
      const mount = event.duration > 0.1 ? left.mount : right.mount;
      const angle = weaponPose(f.ship, mount).angle;
      expect(
        event.outlets[0].vx - 300 * Math.cos(angle - 0.305233),
      ).toBeCloseTo(vx - sharedImpulse, 8);
      expect(
        event.outlets[0].vy - 300 * Math.sin(angle - 0.305233),
      ).toBeCloseTo(vy, 8);
    }
    expect(f.ship.vel.x).toBeCloseTo(vx - acceleration * (0.075 + 0.15), 8);
    expect(f.ship.vel.y).toBe(vy);
    expect(f.ship.rotation).toBe(0);
  });

  it("turns the vent force with the hull and leaves its previously emitted sample fixed", () => {
    const f = mountedFixture(studyWasp());
    const { x: vx, y: vy } = f.ship.vel;
    f.step(0.35, [f.targets[0]]);
    f.step(0.075, []);
    const [initial] = f.system.plasmaVentEvents.map((event) =>
      structuredClone(event),
    );
    f.ship.rotation = Math.PI / 2;
    f.step(0.075, []);
    expect(f.ship.vel.x).toBeCloseTo(vx - 125 * 0.075, 8);
    expect(f.ship.vel.y).toBeCloseTo(vy - 125 * 0.075, 8);
    expect(f.ship.rotation).toBe(Math.PI / 2);
    expect(f.system.plasmaVentEvents[0]).toEqual(initial);
  });

  it("launches the other rifle with only the vent impulse delivered before release", () => {
    const build = defaultLoadout("wasp");
    build.hull = ["plasma-rifle", "plasma-rifle"];
    const f = mountedFixture(build);
    const [left, right] = f.system.weapons;
    f.step(0.34, [f.targets[1]]);
    f.step(0.35);
    expect(left.plasma?.charge).toBeCloseTo(0.5, 8);
    expect(right.plasma?.charge).toBeCloseTo(0.69 / 0.7, 8);

    const pose = weaponPose(f.ship, right.mount);
    const x = pose.muzzleX + 120 * Math.cos(pose.angle);
    const y = pose.muzzleY + 120 * Math.sin(pose.angle);
    const target = {
      ...f.targets[1],
      x,
      y,
      previousX: x,
      previousY: y,
    };
    const { x: vx, y: vy } = f.ship.vel;
    f.step(0.02, [target]);
    expect(right.plasma?.phase).toBe("firing");
    expect(f.system.plasmaBurstEvents).toEqual([]);
    const [head] = f.system.plasmaStreams;
    expect(head.launchTime).toBeCloseTo(0.7, 8);
    const acceleration =
      (125 * buildStats(studyWasp()).mass) / buildStats(build).mass;
    expect(head.vx - 7800 * Math.cos(pose.angle)).toBeCloseTo(
      vx - acceleration * 0.01,
      8,
    );
    expect(head.vy - 7800 * Math.sin(pose.angle)).toBeCloseTo(vy, 8);
    expect(f.ship.vel.x).toBeCloseTo(vx - acceleration * 0.02, 8);
  });

  it("draws a brief vent at ejection and lets the fume marks drift and fade after the hull turns", () => {
    const heading = Math.PI / 3;
    const f = mountedFixture(studyWasp(), heading);
    const mount = f.system.weapons[0].mount;
    const axis = weaponPose(f.ship, mount).angle;
    f.step(STEP / 4, [f.targets[0]]);
    f.step(STEP / 4, []);
    expect(f.system.plasmaVentEvents).toHaveLength(1);
    const [sample] = f.system.plasmaVentEvents;
    // The only paired emission falls in the second combat substep.
    expect(Math.floor(sample.time / (STEP / 4))).toBe(1);

    const marks: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      alpha: number;
    }> = [];
    const fakeCanvas = {
      canvas: { width: 1920, height: 1080 },
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      globalAlpha: 1,
      fillStyle: "",
      save() {},
      restore() {},
      beginPath() {},
      arc(x: number, y: number, radius: number) {
        marks.push({
          x,
          y,
          radius,
          color: this.fillStyle,
          alpha: this.globalAlpha,
        });
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
    expect(initial).toHaveLength(2);
    expect(initial.map(({ x, y }) => ({ x, y }))).toEqual(
      sample.outlets.map(({ x, y }) => ({ x, y })),
    );
    const alpha = Math.min(1, sample.charge + 0.2) * 0.12;
    expect(initial[0]).toMatchObject({ color: "#ff8c32", radius: 1.4 });
    expect(initial[0].alpha).toBeCloseTo(alpha, 8);
    f.ship.pos.set(1500, 780);
    f.ship.rotation += Math.PI / 2;
    f.ship.vel.set(-50, 35);
    f.step(0.15, []);
    expect(f.system.plasmaVentEvents).toEqual([sample]);

    const age = 0.15;
    const cooled = draw(sample.time + age);
    expect(cooled).toHaveLength(2);
    for (const [side, port] of sample.outlets.entries()) {
      const outletAngle = axis + (side === 0 ? -0.305233 : 0.305233);
      const sourceAcross = side === 0 ? -4.86453 : 4.62775;
      const spread = Math.sin(sourceAcross) * 0.1;
      const vx =
        port.vx +
        300 * (Math.cos(outletAngle + spread) - Math.cos(outletAngle));
      const vy =
        port.vy +
        300 * (Math.sin(outletAngle + spread) - Math.sin(outletAngle));
      expect(cooled[side].x).toBeCloseTo(port.x + vx * age, 8);
      expect(cooled[side].y).toBeCloseTo(port.y + vy * age, 8);
      expect(cooled[side].radius).toBeCloseTo(1.4 + 13 * age, 8);
      expect(cooled[side].alpha).toBeCloseTo(alpha * (1 - age / 0.36), 8);
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

  it("leaves the target-loss vent journal empty on a funded release", () => {
    const build = defaultLoadout("fighter");
    build.aft[0] = "plasma-rifle";
    const f = mountedFixture(build);
    f.step(0.7);
    f.step(0.7);
    expect(f.system.plasmaReleases).toBe(1);
    expect(f.system.plasmaVentEvents).toEqual([]);
  });
});
