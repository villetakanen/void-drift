import { type GameObject, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { buildMounts, droneRailPose } from "./build-renderer";
import { sweptFront } from "./drone-contact";
import { DRONE_WAVE_SECONDS, DroneFlight } from "./drone-flight";
import { droneSteering, predictTick } from "./drone-pilot";
import { createStar } from "./game-loop";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";
import { acquireFleetTargets, PLAYER_BODY_ID } from "./targeting";

const star = createStar("G", 10000, 10000);
const idle = { leftThruster: false, rightThruster: false, fire: false };
const quarter = STEP / 4;
function ship(x = 0, y = 0): GameObject {
  return {
    pos: new Vec2(x, y),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    radius: 10,
    rotation: 0,
  };
}
function launcher() {
  const build = defaultLoadout("fighter");
  build.hull[0] = "drone-launcher";
  return build;
}
function damage(body: SalvageBody, amount: number) {
  body.onDamage?.(amount);
  body.hull = Math.max(0, body.hull - amount);
}
function craft(id: number, x: number, y = 0) {
  return liveShipBody(id, ship(x, y), 100, () => {});
}
function flightWithDrone(
  carrier = ship(),
  id = PLAYER_BODY_ID,
  target = PLAYER_BODY_ID + 1,
) {
  const flight = new DroneFlight();
  const mount = buildMounts(launcher()).find(
    (m) => m.part === "drone-launcher",
  );
  if (!mount) throw new Error("Launcher mount absent");
  expect(flight.launch(id, carrier, mount, target)).toBe(true);
  return { flight, drone: flight.drones[0], mount };
}
describe("Encounter drone flight", () => {
  it("predicts a sustained drone turn above the Fighter spin limit", () => {
    const body = ship();
    let spin = 0;
    let predictedSpin = 0;
    let angle = 0;
    for (let tick = 0; tick < 120; tick++) {
      const steering = droneSteering(angle, spin, 1, STEP);
      angle = steering.angle;
      spin = steering.angularVelocity;
      predictedSpin = predictTick(body, predictedSpin, 2);
    }
    expect(spin).toBeCloseTo(3 * Math.PI);
    expect(predictedSpin).toBeCloseTo(spin);
    expect(body.rotation).toBeCloseTo(angle, 2);
  });

  it("keeps a rotating seat through clearance, inherits tangential velocity and stays unarmed through coast", () => {
    const carrier = ship();
    carrier.vel.set(30, 0);
    const { flight, drone, mount } = flightWithDrone(carrier);
    for (let i = 0; i < 36; i++) {
      const previous = { ...carrier.pos };
      carrier.pos.x += 30 * quarter;
      carrier.rotation += quarter * 2;
      const roster = [
        liveShipBody(PLAYER_BODY_ID, carrier, 100, () => {}, previous),
        craft(PLAYER_BODY_ID + 1, 300),
        ...flight.bodies(),
      ];
      flight.move(quarter, roster);
      if (!drone.released) {
        const seat = droneRailPose(carrier, mount);
        expect(drone.x).toBeCloseTo(
          seat.x + Math.cos(seat.angle) * drone.age * 70,
        );
        expect(drone.y).toBeCloseTo(
          seat.y + Math.sin(seat.angle) * drone.age * 70,
        );
      } else {
        expect(
          Math.hypot(
            drone.vx - 30 - 70 * Math.cos(drone.rotation),
            drone.vy - 70 * Math.sin(drone.rotation),
          ),
        ).toBeGreaterThan(1);
      }
      expect(drone.armed).toBe(false);
    }
  });
  it("carries a seated drone through the carrier's warp without sweeping the arena", () => {
    const carrier = ship(2159, 540);
    const { flight, drone, mount } = flightWithDrone(carrier);
    const previous = { ...carrier.pos };
    carrier.pos.set(-230, 540);
    const roster = [
      liveShipBody(PLAYER_BODY_ID, carrier, 100, () => {}, previous),
      ...flight.bodies(),
    ];
    flight.move(quarter, roster);
    const seat = droneRailPose(carrier, mount);
    expect(drone.x).toBeCloseTo(seat.x + Math.cos(seat.angle) * quarter * 70);
    expect(drone.y).toBeCloseTo(seat.y + Math.sin(seat.angle) * quarter * 70);
    expect(roster[1].previousX).toBeCloseTo(seat.x);
    expect(drone.released).toBe(false);
  });
  it("warps a coasting drone past the central star in a live encounter", () => {
    const sim = new Simulation({
      ...gameSettings("fighter"),
      loadout: launcher(),
      seed: 12,
    });
    sim.planets.length = 0;
    sim.star.pos.set(960, 540);
    const mount = buildMounts(launcher()).find(
      (m) => m.part === "drone-launcher",
    );
    if (!mount) throw new Error("Launcher mount absent");
    sim.start();
    sim.droneFlight.launch(PLAYER_BODY_ID, sim.ship, mount, 42);
    const drone = sim.droneFlight.drones[0];
    Object.assign(drone, {
      released: true,
      x: 2159.9,
      y: 540,
      vx: 60,
      vy: 0,
      spin: 1.5,
      age: 0.2,
    });
    sim.step(idle);
    expect(sim.droneFlight.drones).toContain(drone);
    expect(drone.x).toBeCloseTo(-230 + 3 * quarter * 60);
    expect(drone.y).toBe(540);
    expect(drone.vx).toBe(60);
    expect(drone.spin).toBe(1.5);
    expect(drone.age).toBeCloseTo(0.2 + STEP);
    expect(sim.droneFlight.events).toHaveLength(0);
  });
  it("keeps a live enemy strictly inside 500, breaks ties by ID and falls back after carrier loss", () => {
    const { drone } = flightWithDrone();
    Object.assign(drone, { x: 0, y: 0, target: 20 });
    const roster = [
      craft(20, 499),
      craft(11, 10),
      craft(10, -10),
      craft(PLAYER_BODY_ID, 1),
    ];
    const acquire = () =>
      acquireFleetTargets(roster, [], star, [], quarter, undefined, [drone]);
    acquire();
    expect(drone.target).toBe(20);
    roster[0].x = 500;
    acquire();
    expect(drone.target).toBe(10);
    roster[2].hull = 0;
    acquire();
    expect(drone.target).toBe(11);
    roster[3].hull = 0;
    acquire();
    expect(drone.target).toBe(11);
  });
  it("replans a return immediately when an enemy enters range just before carrier contact", () => {
    const { flight, drone } = flightWithDrone(ship(960, 540));
    Object.assign(drone, {
      released: true,
      age: 1,
      x: 974,
      y: 540,
      vx: -200,
      vy: 0,
    });
    const carrier = craft(PLAYER_BODY_ID, 960, 540);
    const enemy = craft(PLAYER_BODY_ID + 1, 1500, 540);
    const refunds: number[] = [];
    const advance = () => {
      const roster = [carrier, enemy, ...flight.bodies()];
      acquireFleetTargets(roster, [], star, [], quarter, undefined, [drone]);
      flight.move(quarter, roster);
      flight.resolve(quarter, drone.age, roster, star, [], damage, (id) =>
        refunds.push(id),
      );
    };
    advance();
    expect(drone.destination).toBe(carrier.id);
    expect(drone.x - carrier.x).toBeGreaterThan(carrier.radius + 3);
    const nextReturnPlan = drone.nextPlan;
    enemy.x = 1400;
    advance();
    expect(drone.age).toBeLessThan(nextReturnPlan);
    expect(drone.nextPlan).toBeGreaterThan(nextReturnPlan);
    expect(drone.destination).toBe(enemy.id);
    expect(drone.x - carrier.x).toBeLessThan(carrier.radius + 3);
    expect(flight.drones).toContain(drone);
    expect(refunds).toEqual([]);
  });
  it("recovers only on returning hull contact, once, with the same carrier identity", () => {
    const { flight, drone } = flightWithDrone();
    Object.assign(drone, {
      x: 0,
      y: 0,
      previousX: 60,
      previousY: 0,
      target: null,
      destination: PLAYER_BODY_ID,
    });
    const refunds: number[] = [];
    const roster = [craft(PLAYER_BODY_ID, 0), ...flight.bodies()];
    for (let tick = 0; tick < 2; tick++)
      flight.resolve(quarter, quarter * tick, roster, star, [], damage, (id) =>
        refunds.push(id),
      );
    expect(refunds).toEqual([PLAYER_BODY_ID]);
    expect(flight.drones).toHaveLength(0);
  });
  it("fuses on the first swept enemy hull even while pursuing another ship", () => {
    const { flight, drone } = flightWithDrone();
    Object.assign(drone, {
      previousX: 0,
      previousY: 0,
      x: 100,
      y: 0,
      armed: true,
      armedFrom: 0,
    });
    const roster: SalvageBody[] = [
      craft(PLAYER_BODY_ID + 1, 110),
      { ...craft(3, 20), kind: "wreck" },
      { ...craft(-3, 25), carrierId: 42 },
      { ...craft(4, 30), hull: 0 },
      craft(5, 80),
      ...flight.bodies(),
    ];
    flight.resolve(quarter, 0, roster, star, [], damage, () => {});
    expect(
      flight.events.find((event) => event.kind === "detonation")?.x,
    ).toBeCloseTo(45);
  });
  it("protects a carrier from the armed fuse but forces terrain bursts even during coast", () => {
    const { flight, drone } = flightWithDrone();
    Object.assign(drone, {
      x: 0,
      y: 0,
      previousX: 0,
      previousY: 0,
      armed: true,
      armedFrom: 0,
    });
    const carrier = craft(PLAYER_BODY_ID, 45),
      enemy = craft(PLAYER_BODY_ID + 1, 12);
    const outside = craft(42, 45.01);
    const roster = [carrier, enemy, outside, ...flight.bodies()];
    flight.resolve(quarter, 0, roster, star, [], damage, () => {});
    expect(flight.events).toHaveLength(0);
    drone.armed = false;
    flight.resolve(
      quarter,
      quarter,
      roster,
      createStar("G", 60, 0),
      [],
      damage,
      () => {},
    );
    expect(flight.events.filter((e) => e.kind === "detonation")).toHaveLength(
      1,
    );
    expect(carrier.hull).toBe(70);
    expect(outside.hull).toBe(100);
    expect(enemy.hull).toBe(67);
  });
  it("resolves a lethal wave before a later proximity fuse and gives each overlapping front one hit", () => {
    const { flight, drone } = flightWithDrone();
    Object.assign(drone, {
      x: 100,
      y: 0,
      previousX: 40,
      previousY: 0,
      armed: true,
      armedFrom: 0,
      hull: 3,
    });
    const enemy = craft(PLAYER_BODY_ID + 1, 105);
    const adapter = flight.bodies()[0];
    Object.assign(adapter, { previousX: 40, sweepEndX: 100 });
    const bystander: SalvageBody = { ...craft(12, 70), kind: "wreck" };
    for (const id of [-20, -21])
      flight.waves.push({
        id,
        carrierId: PLAYER_BODY_ID,
        x: 0,
        y: 0,
        time: -0.16,
        hit: new Set(),
      });
    const roster = [enemy, adapter, bystander];
    flight.resolve(quarter, 0, roster, star, [], damage, () => {});
    expect(flight.drones).toHaveLength(0);
    expect(flight.events.some((e) => e.kind === "detonation")).toBe(false);
    for (let tick = 1; tick < 200; tick++)
      flight.resolve(
        quarter,
        tick * quarter,
        roster,
        star,
        [],
        damage,
        () => {},
      );
    expect(bystander.hull).toBe(94);
    expect(flight.waves).toHaveLength(0);
  });
  it("sweeps fast translating material across both sides of the expanding front and ignores missing material", () => {
    const fragment: SalvageBody = {
      ...craft(123, -220),
      kind: "fragment",
      previousX: 220,
      x: -220,
      y: 18,
      previousY: 18,
      rotation: 0.5,
      previousRotation: 0,
      shardIndex: 1,
    };
    const hit = sweptFront(
      fragment,
      { x: 0, y: 0 },
      0,
      1,
      35,
      35 + (166 * quarter) / DRONE_WAVE_SECONDS,
    );
    expect(hit?.t).toBeGreaterThan(0);
    expect(hit?.t).toBeLessThan(0.5);
    expect(
      sweptFront(
        { ...fragment, kind: "wreck", releasedMask: 255 },
        { x: 0, y: 0 },
        0,
        1,
        35,
        36,
      ),
    ).toBeUndefined();
  });
  it("releases three of four ready mounts in a fitted Gauntlet and continues a moving intercept while Off", () => {
    const build = launcher();
    build.hull.fill("drone-launcher");
    build.aft.fill("drone-launcher");
    const sim = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
      loadout: build,
      arrival: false,
      seed: 342,
    });
    sim.planets.length = 0;
    sim.star.pos.set(10000, 10000);
    sim.ship.pos.set(400, 540);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    const pirate = sim.opponents[0];
    pirate.ship.pos.set(570, 540);
    pirate.ship.vel.set(5, 0);
    for (const weapon of pirate.weapons) weapon.readyAt = Infinity;
    sim.start();
    sim.step(idle);
    expect(sim.droneFlight.drones).toHaveLength(3);
    expect(sim.salvage?.energySpent).toBe(6);
    expect(sim.salvage?.weapons.filter((w) => w.readyAt > 0)).toHaveLength(3);
    expect(sim.toggleWeapons()).toBe(true);
    let ignited = false,
      burst = false;
    for (let tick = 0; tick < 500 && !burst; tick++) {
      sim.step(idle);
      ignited ||= sim.droneFlight.drones.some((d) => d.armed && d.thrust > 0);
      burst ||= sim.droneFlight.events.some((e) => e.kind === "detonation");
    }
    expect(ignited).toBe(true);
    expect(burst).toBe(true);
    expect(pirate.resources.hull).toBeLessThan(100);
    expect(sim.salvage?.energySpent).toBe(6);
  });
  it("lets Survival point defence intercept a hostile drone after its carrier dies", () => {
    const build = defaultLoadout("fighter");
    build.hull[0] = "ion-point-defence";
    const sim = new Simulation({
      ...gameSettings("fighter"),
      loadout: build,
      seed: 12,
    });
    sim.planets.length = 0;
    sim.star.pos.set(10000, 10000);
    sim.ship.pos.set(400, 500);
    sim.ship.vel.set(0, 0);
    sim.ship.rotation = 0;
    sim.start();
    sim.ticks = 45 * 60 - 1;
    sim.step(idle);
    const pirate = sim.opponent;
    if (!pirate || !sim.salvage) throw new Error("Expected Survival opponents");
    pirate.ship.pos.set(480, 500);
    pirate.ship.vel.set(0, 0);
    pirate.ship.rotation = Math.PI;
    pirate.combat = new SalvageSystem(launcher(), 12);
    pirate.weapons = pirate.combat.weapons;
    sim.salvage.weapons[0].readyAt = Infinity;
    sim.step(idle);
    const drone = sim.droneFlight.drones[0];
    expect(drone).toBeDefined();
    pirate.resources.hull = 0;
    sim.step(idle);
    expect(sim.opponent).toBeNull();
    const untargeted = sim.salvage.pointDefenceDischarges;
    sim.salvage.weapons[0].readyAt = 0;
    for (let i = 0; i < 90 && sim.droneFlight.drones.length; i++)
      sim.step(idle);
    expect(sim.salvage.pointDefenceDischarges).toBeGreaterThan(untargeted);
    expect(sim.droneFlight.drones).toHaveLength(0);
    expect(
      sim.droneFlight.events.filter((e) => e.kind === "detonation"),
    ).toHaveLength(0);
  });
  it("does not recover onto a replacement pirate at the same roster index", () => {
    const sim = new Simulation({ ...gameSettings("fighter"), seed: 37 });
    sim.planets.length = 0;
    sim.star.pos.set(10000, 10000);
    sim.ship.pos.set(450, 540);
    sim.start();
    sim.ticks = 45 * 60 - 1;
    sim.step(idle);
    const first = sim.opponent;
    if (!first) throw new Error("Expected Survival arrival");
    first.ship.pos.set(650, 540);
    first.ship.vel.set(0, 0);
    first.combat = new SalvageSystem(launcher(), 37);
    first.weapons = first.combat.weapons;
    sim.step(idle);
    const drone = sim.droneFlight.drones[0];
    expect(drone).toBeDefined();
    first.resources.hull = 0;
    sim.step(idle);
    // Keep the orphan clear of other contacts until the replacement arrives.
    Object.assign(drone, { released: true, x: 800, y: 540, vx: 0, vy: 0 });
    sim.ship.pos.set(1600, 540);
    for (let i = 0; i < 61 * 60 && !sim.opponent; i++) sim.step(idle);
    const next = sim.opponents[0];
    if (!next) throw new Error("Expected replacement arrival");
    Object.assign(drone, { x: 800, y: 540, vx: 0, vy: 0 });
    next.ship.pos.set(drone.x, drone.y);
    next.resources.power = 1;
    Object.assign(drone, { age: 2, released: true, armed: true, armedFrom: 0 });
    sim.step(idle);
    expect(drone.destination).toBeNull();
    expect(sim.droneFlight.drones).toContain(drone);
    expect(next.resources.power).toBeLessThan(2);
  });
});
