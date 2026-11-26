import {
  antipodalWrap,
  type GameObject,
  type Planet,
  STANDARD_SUN,
  type Star,
  Vec2,
} from "@void-drift/core";
import { z } from "zod";
import { engineImpulse } from "./build-flight";
import { type BuildMount, droneRailPose } from "./build-renderer";
import { positionAt, sweptFront } from "./drone-contact";
import {
  COMMANDS,
  DRONE_ACCELERATION,
  DRONE_ENGINE_LIMIT,
  droneSteering,
  planDrone,
} from "./drone-pilot";
import { contactTime, type SalvageBody } from "./salvage";
import { DRONE_LAUNCHER, ENCOUNTER } from "./schemas/salvage";

import { isDroneEnemyHull } from "./targeting";

const FUSE_CLEARANCE = 25;
const RADIATION_RADIUS = 35;
export const DRONE_RADIATION_DAMAGE = 30;
export const DRONE_WAVE_DAMAGE = 3;
export const DRONE_WAVE_SECONDS = 44 / 60;
export const droneWaveRadius = (ageSeconds: number) =>
  14 + 166 * Math.min(1, Math.max(0, ageSeconds / DRONE_WAVE_SECONDS));
const DroneStateSchema = z.object({
  id: z.number().int(),
  carrierId: z.number().int(),
  target: z.number().int().nullable(),
  x: z.number(),
  y: z.number(),
  vx: z.number(),
  vy: z.number(),
  rotation: z.number(),
  hull: z.number().default(4),
  thrust: z.number().default(0),
  armed: z.boolean().default(false),
  spin: z.number().default(0),
  age: z.number().default(0),
});
type Drone = z.infer<typeof DroneStateSchema> & {
  mount: BuildMount;
  carrier: GameObject;
  rail: ReturnType<typeof droneRailPose>;
  released: boolean;
  command: number;
  nextPlan: number;
  destination: number | null;
  previousX: number;
  previousY: number;
  armedFrom: number;
};
type Wave = {
  carrierId: number;
  x: number;
  y: number;
  id: number;
  time: number;
  hit: Set<number>;
};
type DroneEvent = {
  kind: "detonation" | "contact";
  id: number;
  seq: number;
  time: number;
  offset: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
};

function circleHit(drone: Drone, body: SalvageBody, reach: number, from = 0) {
  const a = positionAt(body, from),
    b = positionAt(body, 1);
  const dx = drone.x - drone.previousX,
    dy = drone.y - drone.previousY;
  const f = contactTime(
    drone.previousX + dx * from - a.x,
    drone.previousY + dy * from - a.y,
    dx * (1 - from) - (b.x - a.x),
    dy * (1 - from) - (b.y - a.y),
    reach,
    1,
  );
  return Number.isFinite(f) ? from + (1 - from) * f : Infinity;
}

export class DroneFlight {
  readonly drones: Drone[] = [];
  readonly waves: Wave[] = [];
  readonly events: DroneEvent[] = [];
  private sequence = 0;
  private eventSequence = 0;
  get active() {
    return !!(this.drones.length || this.waves.length);
  }
  launch(
    carrierId: number,
    ship: GameObject,
    mount: BuildMount,
    target: number,
  ) {
    if (
      this.drones.filter(
        (drone) => drone.hull > 0 && drone.carrierId === carrierId,
      ).length >= DRONE_LAUNCHER.airborneLimit
    )
      return false;
    const rail = droneRailPose(ship, mount);
    const { x, y, angle } = rail;
    this.drones.push({
      ...DroneStateSchema.parse({
        id: --this.sequence,
        carrierId,
        target,
        x,
        y,
        vx: ship.vel.x,
        vy: ship.vel.y,
        rotation: angle,
      }),
      carrier: ship,
      mount,
      rail,
      released: false,
      command: 0,
      nextPlan: 0,
      destination: null,
      previousX: x,
      previousY: y,
      armedFrom: Infinity,
    });
    return true;
  }
  bodies(): SalvageBody[] {
    return this.drones
      .filter((drone) => drone.hull > 0)
      .map((drone) => ({
        id: drone.id,
        group: drone.carrierId,
        carrierId: drone.carrierId,
        kind: "ship",
        x: drone.x,
        y: drone.y,
        previousX: drone.x,
        previousY: drone.y,
        rotation: drone.rotation,
        vx: drone.vx,
        vy: drone.vy,
        radius: 3,
        hull: drone.hull,
        onDamage: (amount) => {
          drone.hull = Math.max(0, drone.hull - amount);
        },
      }));
  }
  move(dt: number, roster: readonly SalvageBody[]) {
    for (const drone of this.drones) {
      drone.previousX = drone.x;
      drone.previousY = drone.y;
      drone.armedFrom = drone.armed ? 0 : Infinity;
      const start = drone.age;
      drone.age += dt;
      const carrier = roster.find(
        (b) => b.id === drone.carrierId && b.hull > 0,
      );
      const freeDt = this.advanceRail(drone, carrier, start, dt);
      const ballistic = Math.min(
        freeDt,
        Math.max(0, 32 / 70 - (drone.age - freeDt)),
      );
      drone.x += drone.vx * ballistic;
      drone.y += drone.vy * ballistic;
      const powered = freeDt - ballistic;
      if (powered > 1e-12)
        this.advancePowered(drone, roster, carrier, powered, dt);
      const landing = drone.released
        ? antipodalWrap(drone.x, drone.y, ENCOUNTER.centerX, ENCOUNTER.centerY)
        : null;
      if (landing) {
        drone.x = drone.previousX = landing.x;
        drone.y = drone.previousY = landing.y;
      }
      const adapter = roster.find((b) => b.id === drone.id);
      if (adapter) {
        adapter.x = adapter.previousX = drone.previousX;
        adapter.y = adapter.previousY = drone.previousY;
        adapter.sweepEndX = drone.x;
        adapter.sweepEndY = drone.y;
        adapter.vx = drone.vx;
        adapter.vy = drone.vy;
      }
    }
  }
  private advanceRail(
    drone: Drone,
    carrier: SalvageBody | undefined,
    start: number,
    dt: number,
  ) {
    let freeDt = dt;
    if (!drone.released) {
      const next = droneRailPose(drone.carrier, drone.mount);
      const length = Math.hypot(next.muzzleX - next.x, next.muzzleY - next.y);
      const clear = length / 70;
      const fraction = carrier
        ? Math.min(1, Math.max(0, (clear - start) / dt))
        : 0;
      const rotationDelta = Math.atan2(
        Math.sin(next.angle - drone.rail.angle),
        Math.cos(next.angle - drone.rail.angle),
      );
      drone.rotation = drone.rail.angle + rotationDelta * fraction;
      const travelled = Math.min(length, 70 * (start + dt * fraction));
      // Interpolate the translating carrier and rotate the local seat offset at clearance.
      const previous = carrier ? positionAt(carrier, 0) : drone.carrier.pos;
      const current = drone.carrier.pos;
      const delta = rotationDelta * fraction;
      const startX = carrier?.previousX ?? previous.x;
      const startY = carrier?.previousY ?? previous.y;
      const ox = drone.rail.x - startX,
        oy = drone.rail.y - startY;
      // On a carrier wrap, move the attached drone's sweep to the landing side.
      drone.previousX += previous.x - startX;
      drone.previousY += previous.y - startY;
      const cx = previous.x + (current.x - previous.x) * fraction,
        cy = previous.y + (current.y - previous.y) * fraction;
      drone.x =
        cx +
        ox * Math.cos(delta) -
        oy * Math.sin(delta) +
        Math.cos(drone.rotation) * travelled;
      drone.y =
        cy +
        ox * Math.sin(delta) +
        oy * Math.cos(delta) +
        Math.sin(drone.rotation) * travelled;
      drone.vx =
        drone.carrier.vel.x -
        (rotationDelta / dt) * (drone.y - cy) +
        70 * Math.cos(drone.rotation);
      drone.vy =
        drone.carrier.vel.y +
        (rotationDelta / dt) * (drone.x - cx) +
        70 * Math.sin(drone.rotation);
      drone.released = !carrier || drone.age >= clear;
      drone.rail = next;
      freeDt = drone.released ? dt * (1 - fraction) : 0;
    }
    return freeDt;
  }
  private advancePowered(
    drone: Drone,
    roster: readonly SalvageBody[],
    carrier: SalvageBody | undefined,
    powered: number,
    dt: number,
  ) {
    const target = roster.find((b) => b.id === drone.target && b.hull > 0);
    const destination =
      target ??
      (carrier && Math.hypot(drone.x - carrier.x, drone.y - carrier.y) < 500
        ? carrier
        : undefined);
    const body: GameObject = {
      pos: new Vec2(drone.x, drone.y),
      vel: new Vec2(drone.vx, drone.vy),
      rotation: drone.rotation,
      acc: new Vec2(0, 0),
      radius: 3,
    };
    if (
      destination &&
      (drone.age >= drone.nextPlan || destination.id !== drone.destination)
    ) {
      drone.command = planDrone(
        body,
        drone.spin,
        destination,
        target ? "Pursuit" : "Return",
      ).command;
      drone.nextPlan = drone.age + 8 / 60;
    }
    if (!destination) drone.command = 0;
    drone.destination = destination?.id ?? null;
    const command = COMMANDS[drone.command];
    const steering = droneSteering(
      drone.rotation,
      drone.spin,
      command.turn,
      powered,
      command.burn,
    );
    drone.rotation = steering.angle;
    drone.spin = steering.angularVelocity;
    drone.thrust =
      destination && steering.mainFraction > 0
        ? engineImpulse(
            body,
            steering.direction,
            DRONE_ACCELERATION * steering.accelerationFraction,
            DRONE_ENGINE_LIMIT,
            powered,
          ) * steering.mainFraction
        : 0;
    if (!drone.armed && drone.thrust > 0) {
      drone.armed = true;
      drone.armedFrom = 1 - powered / dt;
    }
    drone.vx = body.vel.x;
    drone.vy = body.vel.y;
    drone.x += drone.vx * powered;
    drone.y += drone.vy * powered;
  }
  pruneEvents(time: number) {
    while (this.events.length && this.events[0].time < time - 1)
      this.events.shift();
  }
  private emit(
    kind: DroneEvent["kind"],
    wave: Wave,
    x: number,
    y: number,
    time: number,
    start: number,
  ) {
    this.events.push({
      kind,
      id: wave.id,
      seq: ++this.eventSequence,
      x,
      y,
      originX: wave.x,
      originY: wave.y,
      time,
      offset: time - Math.floor((start + 1e-9) * 60) / 60,
    });
  }
  private fuseContact(
    drone: Drone,
    target: SalvageBody,
    carrier: SalvageBody | undefined,
    from: number,
  ) {
    const hit = circleHit(
      drone,
      target,
      target.radius + FUSE_CLEARANCE,
      Math.max(from, drone.armedFrom),
    );
    if (!carrier || !Number.isFinite(hit)) return hit;
    const clearOfCarrier = (t: number) => {
      const position = positionAt(carrier, t);
      const x = drone.previousX + (drone.x - drone.previousX) * t;
      const y = drone.previousY + (drone.y - drone.previousY) * t;
      return (
        Math.hypot(x - position.x, y - position.y) >
        RADIATION_RADIUS + carrier.radius
      );
    };
    if (clearOfCarrier(hit)) return hit;
    if (!clearOfCarrier(1)) return Infinity;
    // The relative path exits the circular safety region once.
    let inside = hit,
      outside = 1;
    for (let i = 0; i < 28; i++) {
      const middle = (inside + outside) / 2;
      if (clearOfCarrier(middle)) outside = middle;
      else inside = middle;
    }
    return circleHit(drone, target, target.radius + FUSE_CLEARANCE, outside);
  }
  private nextDroneContact(
    drone: Drone,
    roster: readonly SalvageBody[],
    star: Star,
    planets: readonly Planet[],
    from: number,
  ) {
    const carrier = roster.find(
      (body) => body.id === drone.carrierId && body.hull > 0,
    );
    const target = roster.find(
      (body) => body.id === drone.target && body.hull > 0,
    );
    const recover =
      carrier && !target && drone.destination === carrier.id
        ? circleHit(drone, carrier, carrier.radius + 3, from)
        : Infinity;
    let detonate = Infinity;
    if (drone.armed) {
      for (const body of roster) {
        if (isDroneEnemyHull(drone.carrierId, body))
          detonate = Math.min(
            detonate,
            this.fuseContact(drone, body, carrier, from),
          );
      }
    }
    const dx = drone.x - drone.previousX,
      dy = drone.y - drone.previousY;
    for (const world of [star, ...planets]) {
      const radius =
        world === star
          ? (star.damageField?.reach ?? STANDARD_SUN.damageReach)
          : world.radius + 3;
      const offset = contactTime(
        drone.previousX + dx * from - world.pos.x,
        drone.previousY + dy * from - world.pos.y,
        dx,
        dy,
        radius,
        1 - from,
      );
      detonate = Math.min(detonate, from + offset);
    }
    return { time: Math.min(recover, detonate), recover: recover < detonate };
  }
  resolve(
    dt: number,
    start: number,
    roster: readonly SalvageBody[],
    star: Star,
    planets: readonly Planet[],
    damage: (body: SalvageBody, amount: number, carrierId: number) => void,
    refund: (id: number) => void,
  ) {
    type Action =
      | {
          kind: "contact";
          wave: Wave;
          body: SalvageBody;
          x: number;
          y: number;
          t: number;
        }
      | {
          kind: "recover" | "detonate";
          drone: Drone;
          adapter: SalvageBody;
          t: number;
        };
    // Recompute after every contact: radiation can kill a later detonator,
    // a wave can destroy a carrier, and damage can remove attached material.
    let cursor = 0;
    while (cursor <= 1) {
      let next: Action | undefined;
      for (const wave of this.waves) {
        const from = Math.max(cursor, (wave.time - start) / dt, 0);
        const to = Math.min(1, (wave.time + DRONE_WAVE_SECONDS - start) / dt);
        if (from > to) continue;
        const ageAt = (t: number) => Math.max(0, start + t * dt - wave.time);
        for (const body of roster) {
          if (body.hull <= 0 || body.kind === "cell" || wave.hit.has(body.id))
            continue;
          const birth =
            ageAt(from) < 1e-10 &&
            sweptFront(body, wave, from, from, 14, 14, true);
          const hit =
            birth ||
            sweptFront(
              body,
              wave,
              from,
              to,
              droneWaveRadius(ageAt(from)),
              droneWaveRadius(ageAt(to)),
            );
          if (hit && (!next || hit.t < next.t))
            next = { kind: "contact", wave, body, ...hit };
        }
      }
      for (const drone of this.drones) {
        if (drone.hull <= 0) continue;
        const adapter = roster.find((b) => b.id === drone.id);
        if (!adapter) continue;
        const contact = this.nextDroneContact(
          drone,
          roster,
          star,
          planets,
          cursor,
        );
        if (Number.isFinite(contact.time) && (!next || contact.time < next.t))
          next = {
            kind: contact.recover ? "recover" : "detonate",
            drone,
            adapter,
            t: Math.min(1, contact.time),
          };
      }
      if (!next) break;
      cursor = next.t;
      const time = start + cursor * dt;
      if (next.kind === "contact") {
        next.wave.hit.add(next.body.id);
        damage(next.body, DRONE_WAVE_DAMAGE, next.wave.carrierId);
        this.emit("contact", next.wave, next.x, next.y, time, start);
        continue;
      }
      const drone = next.drone;
      next.adapter.hull = 0;
      drone.hull = 0;
      if (next.kind === "recover") {
        refund(drone.carrierId);
        continue;
      }
      const wave = {
        carrierId: drone.carrierId,
        x: drone.previousX + (drone.x - drone.previousX) * cursor,
        y: drone.previousY + (drone.y - drone.previousY) * cursor,
        id: drone.id,
        time,
        hit: new Set<number>(),
      };
      this.waves.push(wave);
      this.emit("detonation", wave, wave.x, wave.y, time, start);
      for (const body of roster)
        if (
          body.hull > 0 &&
          body.kind !== "cell" &&
          sweptFront(
            body,
            wave,
            cursor,
            cursor,
            RADIATION_RADIUS,
            RADIATION_RADIUS,
            true,
          )
        )
          damage(body, DRONE_RADIATION_DAMAGE, wave.carrierId);
    }
    for (let i = this.waves.length - 1; i >= 0; i--)
      if (this.waves[i].time + DRONE_WAVE_SECONDS <= start + dt + 1e-10)
        this.waves.splice(i, 1);
    for (let i = this.drones.length - 1; i >= 0; i--)
      if (this.drones[i].hull <= 0) this.drones.splice(i, 1);
  }
}
