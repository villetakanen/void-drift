import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  buildMounts,
} from "./build-renderer";
import { createStar } from "./game-loop";
import { partFigures } from "./part-figures";
import { PLASMA_RIFLE_ENVELOPE } from "./plasma-rifle-art";
import { SalvageSystem } from "./salvage";
import {
  BuildStoreSchema,
  buildStats,
  defaultBuilds,
  defaultLoadout,
  isScoredEligible,
  LoadoutSchema,
  PARTS,
  slotAccepts,
} from "./schemas/loadout";
import { PLASMA_RIFLE } from "./schemas/salvage";
import { ShipProfileIdSchema } from "./schemas/ship-profile";
import { STEP } from "./simulation";

const SUBSTEP = STEP / 4;

function rifleFixture(
  hull: ("plasma-rifle" | "light-ion-cannon" | "battery" | null)[] = [
    "plasma-rifle",
    null,
  ],
) {
  const build = defaultLoadout("wasp");
  build.hull = [...hull];
  const system = new SalvageSystem(LoadoutSchema.parse(build), 2026);
  system.nextPass = Infinity;
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const star = createStar("G", 960, 540);
  const resources = { hull: 100, power: 100 };
  const target = (
    id = 1,
    x = 500,
    y = 400,
    kind: "wreck" | "fragment" = "wreck",
  ) => ({
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
  });
  const weapon = () => {
    const mounted = system.weapons.find((item) => item.kind === "plasma-rifle");
    if (!mounted) throw new Error("Plasma rifle mount missing");
    return mounted;
  };
  const gauntletStep = (
    dt = SUBSTEP,
    body?: ReturnType<typeof target> | readonly ReturnType<typeof target>[],
    capacity = buildStats(build).capacity,
  ) => system.stepWeapons(dt, ship, star, resources, capacity, [], body ?? []);
  const normalStep = (dt = SUBSTEP) =>
    system.step(
      dt,
      ship,
      star,
      resources,
      buildStats(build).capacity,
      ship.pos.x,
      ship.pos.y,
      false,
    );
  return {
    build,
    system,
    ship,
    star,
    resources,
    target,
    weapon,
    gauntletStep,
    normalStep,
  };
}

describe("Plasma rifle", () => {
  it("adds weight through ordinary statistics and round-trips saved fittings", () => {
    const build = defaultLoadout("wasp");
    const mass = buildStats(build).mass;
    build.hull[0] = "plasma-rifle";
    expect(LoadoutSchema.parse(JSON.parse(JSON.stringify(build)))).toEqual(
      build,
    );
    expect(buildStats(build).mass - mass).toBeCloseTo(
      PARTS["light-ion-cannon"].mass * 2.7,
    );
    expect(partFigures("plasma-rifle")).toEqual([
      { icon: "mass", value: "24.3", label: "mass" },
    ]);
    expect(isScoredEligible(build)).toBe(false);
    const saved = defaultBuilds();
    saved.wasp = build;
    expect(
      BuildStoreSchema.parse(JSON.parse(JSON.stringify(saved))).wasp,
    ).toEqual(build);
    expect(slotAccepts("weapon", "G")).toBe(true);
    expect(slotAccepts("support", "G")).toBe(false);
    expect(
      LoadoutSchema.safeParse({ ...build, side: "plasma-rifle" }).success,
    ).toBe(false);
  });

  it("creates one independent cycle state for every fitted mount", () => {
    for (const chassis of ShipProfileIdSchema.options) {
      const build = defaultLoadout(chassis);
      build.hull[0] = "plasma-rifle";
      const rifles = new SalvageSystem(build, 2026).weapons.filter(
        (weapon) => weapon.kind === "plasma-rifle",
      );
      expect(rifles).toHaveLength(1);
      expect(rifles[0].plasmaRifle?.phase).toBe("idle");
    }
  });

  it("charges and releases exactly at full charge, then applies both forces", () => {
    const f = rifleFixture();
    const target = f.target();
    f.resources.power = 17;
    for (let i = 0; i < 168; i++) f.gauntletStep(SUBSTEP, target);
    const rifle = f.weapon().plasmaRifle;
    expect(rifle?.phase).toBe("firing");
    expect(f.system.energySpent).toBeCloseTo(7, 10);
    expect(f.resources.power).toBeCloseTo(10, 10);
    expect(f.ship.vel.x).toBe(0);
    for (let i = 0; i < 168; i++) f.gauntletStep(SUBSTEP, target);
    const reference = defaultLoadout("wasp");
    reference.hull[0] = "plasma-rifle";
    reference.hull[1] = "light-ion-cannon";
    const mass = buildStats(f.build).mass;
    const expected =
      (PARTS.plasma.thrust * PLASMA_RIFLE.kickStrength * 0.7 +
        PLASMA_RIFLE.ventAcceleration * buildStats(reference).mass * 0.3) /
      mass;
    expect(f.ship.vel.x).toBeCloseTo(-expected, 8);
    expect(f.weapon().plasmaRifle?.phase).toBe("recovery");
  });

  it("scales kick and vent recoil by the fitted ship mass", () => {
    const light = rifleFixture(["plasma-rifle", null]);
    const heavy = rifleFixture(["plasma-rifle", "battery"]);
    const lightTarget = light.target();
    const heavyTarget = heavy.target();
    for (let i = 0; i < 336; i++) {
      light.gauntletStep(SUBSTEP, lightTarget);
      heavy.gauntletStep(SUBSTEP, heavyTarget);
    }
    const ratio = buildStats(heavy.build).mass / buildStats(light.build).mass;
    expect(Math.abs(light.ship.vel.x / heavy.ship.vel.x)).toBeCloseTo(ratio, 8);
    expect(light.ship.vel.y).toBeCloseTo(heavy.ship.vel.y, 10);
  });

  it("uses the nearest stable-ID wreck and ignores fragments as acquisition targets", () => {
    const f = rifleFixture();
    const farther = f.target(8, 510);
    const nearerHigh = f.target(9, 490);
    const nearerLow = f.target(3, 490);
    const fragment = f.target(1, 430, 400, "fragment");
    f.gauntletStep(SUBSTEP, [farther, nearerHigh, fragment, nearerLow]);
    expect(f.weapon().plasmaRifle?.target).toBe(3);
  });

  it("vents a partial charge when its locked target is lost without switching", () => {
    const f = rifleFixture();
    const locked = f.target(1, 500);
    const alternative = f.target(2, 480);
    for (let i = 0; i < 84; i++) f.gauntletStep(SUBSTEP, locked);
    // Keep both candidates supplied to the same weapon query, then remove the lock.
    locked.hull = 0;
    f.gauntletStep(SUBSTEP, [locked, alternative]);
    const rifle = f.weapon().plasmaRifle;
    expect(rifle?.phase).toBe("venting");
    expect(rifle?.target).toBeNull();
    expect(rifle?.chargeSeconds).toBeCloseTo(0.35, 8);
    expect(f.system.energySpent).toBeLessThan(
      PLASMA_RIFLE.chargePowerPerSecond * 0.7,
    );
    const ventDuration =
      (PLASMA_RIFLE.ventSeconds * 0.35) / PLASMA_RIFLE.chargeSeconds;
    for (let i = 0; i < Math.ceil(ventDuration / SUBSTEP); i++)
      f.gauntletStep(SUBSTEP, alternative);
    expect(rifle?.phase).toBe("recovery");
  });

  it("does not acquire below the full-cycle budget and waits at full charge for release power", () => {
    const f = rifleFixture();
    const target = f.target();
    f.resources.power = 16.999;
    f.gauntletStep(SUBSTEP, target);
    expect(f.weapon().plasmaRifle?.phase).toBe("idle");
    expect(f.system.energySpent).toBe(0);

    f.resources.power = 100;
    for (let i = 0; i < 167; i++) f.gauntletStep(SUBSTEP, target);
    f.resources.power = 12;
    f.gauntletStep(SUBSTEP, target);
    expect(f.weapon().plasmaRifle?.phase).toBe("charging");
    expect(f.weapon().plasmaRifle?.chargeSeconds).toBe(
      PLASMA_RIFLE.chargeSeconds,
    );
    f.resources.power = PLASMA_RIFLE.minimumReleasePower;
    f.gauntletStep(SUBSTEP, target);
    expect(f.weapon().plasmaRifle?.phase).toBe("firing");
    expect(f.resources.power).toBeCloseTo(10, 8);
  });

  it("reserves the release budget above the floor for expanded energy capacity", () => {
    const f = rifleFixture();
    const target = f.target();
    f.resources.power = 103.499;
    f.gauntletStep(SUBSTEP, target, 1000);
    expect(f.weapon().plasmaRifle?.phase).toBe("idle");
    f.resources.power = 103.5;
    f.gauntletStep(SUBSTEP, target, 1000);
    expect(f.weapon().plasmaRifle?.phase).toBe("charging");
  });

  it("keeps full-charge timing and recoil deterministic across partitions and both entry paths", () => {
    const targetA = rifleFixture();
    const targetB = rifleFixture();
    const bodyA = targetA.target();
    const bodyB = targetB.target();
    targetA.gauntletStep(1.4, bodyA);
    for (let i = 0; i < 336; i++) targetB.gauntletStep(SUBSTEP, bodyB);
    expect(targetA.resources.power).toBeCloseTo(targetB.resources.power, 9);
    expect(targetA.ship.vel.x).toBeCloseTo(targetB.ship.vel.x, 8);
    expect(targetA.weapon().plasmaRifle?.phase).toBe("recovery");
    expect(targetB.weapon().plasmaRifle?.phase).toBe("recovery");

    const normal = rifleFixture();
    const normalTarget = normal.target();
    normal.system.bodies = [normalTarget];
    for (let i = 0; i < 336; i++) normal.normalStep();
    expect(normal.system.energySpent).toBeCloseTo(7, 8);
    expect(normal.weapon().plasmaRifle?.phase).toBe("recovery");
    expect(normal.ship.vel.x).toBeLessThan(0);
  });

  it("captures the barrel direction at release after tracking a turning ship", () => {
    const f = rifleFixture();
    const target = f.target(1, 500, 400);
    for (let i = 0; i < 84; i++) f.gauntletStep(SUBSTEP, target);
    f.ship.rotation = Math.PI / 2;
    target.x = 408;
    target.y = 500;
    for (let i = 0; i < 84; i++) f.gauntletStep(SUBSTEP, target);
    expect(f.weapon().plasmaRifle?.phase).toBe("firing");
    expect(f.weapon().plasmaRifle?.capturedAngle).toBeCloseTo(Math.PI / 2, 8);
    f.gauntletStep(SUBSTEP, target);
    expect(Math.abs(f.ship.vel.x)).toBeLessThan(1e-6);
    expect(f.ship.vel.y).toBeLessThan(0);
    const poses = f.weapon().plasmaRifle;
    expect(poses?.primaryPose.x).toBeGreaterThan(f.ship.pos.x);
    expect(
      Math.hypot(
        (poses?.leftVentPose.x ?? 0) - (poses?.rightVentPose.x ?? 0),
        (poses?.leftVentPose.y ?? 0) - (poses?.rightVentPose.y ?? 0),
      ),
    ).toBeGreaterThan(0);
  });

  it("spends available charge before venting at the weapon floor", () => {
    const f = rifleFixture();
    const target = f.target();
    f.resources.power = 100;
    for (let i = 0; i < 84; i++) f.gauntletStep(SUBSTEP, target);
    f.resources.power = 10.001;
    f.gauntletStep(SUBSTEP, target);
    expect(f.weapon().plasmaRifle?.phase).toBe("venting");
    expect(f.resources.power).toBeCloseTo(10, 9);
    expect(f.system.energySpent).toBeCloseTo(1.751, 6);
  });

  it("runs independent rifle mounts in stable gun-slot order around an ion volley", () => {
    const firstRifle = rifleFixture(["plasma-rifle", "light-ion-cannon"]);
    const targetA = firstRifle.target(1, 500);
    firstRifle.resources.power = 17;
    firstRifle.gauntletStep(SUBSTEP, targetA);
    expect(firstRifle.system.ionDischarges).toBeGreaterThan(0);
    expect(firstRifle.weapon().plasmaRifle?.phase).toBe("charging");

    const firstCannon = rifleFixture(["light-ion-cannon", "plasma-rifle"]);
    const targetB = firstCannon.target(1, 500);
    firstCannon.resources.power = 17;
    firstCannon.gauntletStep(SUBSTEP, targetB);
    expect(firstCannon.system.ionDischarges).toBeGreaterThan(0);
    expect(firstCannon.weapon().plasmaRifle?.phase).toBe("idle");

    const twoRifles = rifleFixture(["plasma-rifle", "plasma-rifle"]);
    const targetC = twoRifles.target(1, 500);
    twoRifles.resources.power = 100;
    twoRifles.gauntletStep(SUBSTEP, targetC);
    expect(
      twoRifles.system.weapons.filter(
        (weapon) => weapon.plasmaRifle?.phase === "charging",
      ),
    ).toHaveLength(2);
    expect(twoRifles.system.energySpent).toBeCloseTo(10 * SUBSTEP, 9);
  });

  it("includes the full fitted silhouette in collision bounds on every hull", () => {
    for (const chassis of ShipProfileIdSchema.options) {
      const build = defaultLoadout(chassis);
      build.hull[0] = "plasma-rifle";
      const mount = buildMounts(build).find((m) => m.part === "plasma-rifle");
      if (!mount) throw new Error("Missing rifle mount");
      const radius = buildCollisionRadius(build);
      for (const [forward, across] of PLASMA_RIFLE_ENVELOPE) {
        const x =
          mount.x * BUILD_FLIGHT_SCALE +
          forward * Math.cos(mount.angle) -
          across * Math.sin(mount.angle);
        const y =
          mount.y * BUILD_FLIGHT_SCALE +
          forward * Math.sin(mount.angle) +
          across * Math.cos(mount.angle);
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(radius + 1e-9);
      }
    }
  });
});
