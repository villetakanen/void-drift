import {
  antipodalWrap,
  type GameObject,
  type InputState,
  type Planet,
  planetPull,
  type Resources,
  type Star,
  starPull,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildMounts,
  weaponPose,
} from "./build-renderer";
import {
  castDerelict,
  derelictClosestPoint,
  derelictForwardContacts,
  getDerelictRadius,
} from "./derelict-collision";
import {
  DERELICT_ENERGY_EJECTION,
  DERELICT_ENERGY_SOURCE,
  DERELICT_ORIGIN,
  DERELICT_RELEASE_CUE,
  DERELICT_SCALE,
  DERELICT_SHARDS,
} from "./derelict-geometry";
import {
  ASSEMBLED_ION_DEFAULTS,
  type AssembledIonSettings,
  ION_REFERENCE_MASS,
} from "./schemas/ion";
import { buildStats, CHASSIS, type Loadout } from "./schemas/loadout";
import type { SalvagePhysicalState } from "./schemas/salvage";
import {
  type DestructionCause,
  ENCOUNTER,
  type EncounterConfig,
  ION_CANNON,
  ionCannonDamage,
  POINT_DEFENCE,
  pointDefenceDamage,
  SALVAGE,
  WEAPONS,
  type WeaponEvent,
  WeaponEventSchema,
} from "./schemas/salvage";

export type { WeaponEvent } from "./schemas/salvage";

export type FlightTickInput = InputState & { sendDerelict?: boolean };
export interface SalvageBody extends SalvagePhysicalState {
  id: number;
  group: number;
  kind: "wreck" | "fragment" | "cell" | "ship";
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  radius: number;
  hull: number;
  /** Seconds left; a shard has none and stays until destroyed. */
  life?: number;
  rotation: number;
  /** Set only for a temporary opposing ship contact supplied to weapon queries. */
  onDamage?: (amount: number) => void;
}
/** Temporary circle target inserted only while an existing weapon pass queries a live opponent. */
export function liveShipBody(
  id: number,
  ship: GameObject,
  hull: number,
  onDamage: (amount: number) => void,
  previous?: { x: number; y: number },
): SalvageBody {
  const x = previous?.x ?? ship.pos.x;
  const y = previous?.y ?? ship.pos.y;
  return {
    id,
    group: id,
    kind: "ship",
    x,
    y,
    previousX: x,
    previousY: y,
    vx: ship.vel.x,
    vy: ship.vel.y,
    radius: ship.radius,
    hull,
    rotation: ship.rotation,
    onDamage,
  };
}
export interface RailShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}
export interface WeaponState {
  mount: BuildMount;
  kind: "rail" | "laser" | "light-ion-cannon" | "ion-point-defence";
  angle: number;
  readyAt: number;
  target: number | null;
  recoil: { remaining: number; angle: number } | null;
}
/** First contact between relative linear motion and a circle, including overlap. */
export function contactTime(
  x: number,
  y: number,
  vx: number,
  vy: number,
  radius: number,
  horizon: number,
) {
  const c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const a = vx * vx + vy * vy;
  const b = 2 * (x * vx + y * vy);
  const d = b * b - 4 * a * c;
  if (a < 1e-12 || b >= 0 || d < 0) return Infinity;
  const t = (-b - Math.sqrt(d)) / (2 * a);
  return t >= 0 && t <= horizon + 1e-9 ? t : Infinity;
}
/** Spin of a wreck that carries none of its own, radians per second. */
const WRECK_SPIN = ENCOUNTER.wreckSpin.rate;
/** Signed radians per second: a wreck's own spin, a shard's fixed one. */
function spinOf(body: Pick<SalvageBody, "kind" | "spin">) {
  return body.kind === "wreck" ? (body.spin ?? WRECK_SPIN) : 0.8;
}
function angleDifference(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
function outside(x: number, y: number) {
  return (
    Math.hypot(x - ENCOUNTER.centerX, y - ENCOUNTER.centerY) >
    ENCOUNTER.radius + 1e-7
  );
}

/**
 * The one firing gate for every weapon: the ship must hold at least the floor
 * fraction of its capacity (so exactly 10% may fire) and afford the shot.
 * A refused shot takes no power and starts no cooldown.
 */
function canFire(resources: Resources, capacity: number, cost: number) {
  return (
    resources.power + 1e-9 >= capacity * WEAPONS.energyFloor &&
    resources.power + 1e-9 >= cost
  );
}
/** Bounded, deterministic gameplay. No Canvas, wall clock, or cosmetic randomness. */
export class SalvageSystem {
  private aimingBodies: readonly SalvageBody[] | null = null;
  readonly weapons: WeaponState[];
  readonly angles: Record<string, number> = {};
  bodies: SalvageBody[] = [];
  shots: RailShot[] = [];
  events: WeaponEvent[] = [];
  time = 0;
  nextPass: number;
  passes = 0;
  destroyed = 0;
  playerKills = 0;
  shotsFired = 0;
  ionDischarges = 0;
  pointDefenceDischarges = 0;
  laserPulses = 0;
  hits = 0;
  /** Point-defence and cannon hits on a wreck or a shard; they score in Survival. */
  derelictIonHits = 0;
  /** Derelict energy cells the ship has collected; each scores in Survival. */
  cellsCollected = 0;
  energySpent = 0;
  energyCollected = 0;
  lastCollection = { time: -Infinity, amount: 0 };
  private sequence = 0;
  private eventSequence = 0;
  private randomState: number;
  private scheduleState: number;
  private trajectoryState: number;
  private readonly recoilAcceleration: number;
  private readonly ionAcquisitionWidth: number;
  constructor(
    loadout: Loadout,
    seed: number,
    ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
    private readonly encounter: EncounterConfig = ENCOUNTER,
  ) {
    this.ionAcquisitionWidth =
      CHASSIS[loadout.chassis].width * BUILD_FLIGHT_SCALE;
    this.randomState = seed >>> 0;
    this.scheduleState = (seed ^ 0x9e3779b9) >>> 0;
    const { min, max } = encounter.firstPass;
    // A fixed first arrival draws nothing, so its later schedule is unchanged.
    this.nextPass = max > min ? min + this.scheduleRandom() * (max - min) : min;
    this.trajectoryState = (seed ^ 0x85ebca6b) >>> 0;
    this.recoilAcceleration =
      (ion.acceleration * ION_REFERENCE_MASS * WEAPONS.rail.recoilStrength) /
      buildStats(loadout).mass;
    this.weapons = buildMounts(loadout).flatMap((mount): WeaponState[] =>
      mount.part === "light-ion-cannon" ||
      mount.part === "ion-point-defence" ||
      mount.part === "rail" ||
      mount.part === "laser"
        ? [
            {
              mount,
              kind: mount.part,
              angle: mount.angle,
              readyAt: 0,
              target: null,
              recoil: null,
            },
          ]
        : [],
    );
    // Kept in build-mount order; fireWeapons applies class order (defence before guns).
    for (const weapon of this.weapons)
      this.angles[weapon.mount.key] = weapon.angle;
  }
  get groups() {
    return new Set(this.bodies.map((body) => body.group)).size;
  }
  private random() {
    this.randomState =
      (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
  private emit(
    kind: WeaponEvent["kind"],
    x: number,
    y: number,
    endX = x,
    endY = y,
    time = this.time,
  ) {
    if (this.events.length >= 128) {
      // Preserve active containment cues when ordinary impact traffic fills the ring.
      const ordinary = this.events.findIndex(
        (event) => event.kind !== "energy-release",
      );
      this.events.splice(Math.max(ordinary, 0), 1);
    }
    this.events.push(
      WeaponEventSchema.parse({
        id: ++this.eventSequence,
        kind,
        x,
        y,
        endX,
        endY,
        time,
      }),
    );
  }
  private body(
    kind: SalvageBody["kind"],
    group: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
  ): SalvageBody {
    const config =
      kind === "wreck"
        ? SALVAGE.wreck
        : kind === "fragment"
          ? SALVAGE.fragment
          : SALVAGE.cell;
    return {
      id: ++this.sequence,
      group,
      kind,
      x,
      y,
      previousX: x,
      previousY: y,
      vx,
      vy,
      radius: config.radius,
      hull: "hull" in config ? config.hull : 1,
      ...("life" in config ? { life: config.life } : {}),
      rotation: this.random() * Math.PI * 2,
      ...(kind === "wreck"
        ? { initialHull: SALVAGE.wreck.hull, releasedMask: 0 }
        : {}),
    };
  }
  private scheduleRandom() {
    this.scheduleState =
      (Math.imul(this.scheduleState, 1664525) + 1013904223) >>> 0;
    return this.scheduleState / 4294967296;
  }
  private trajectoryRandom() {
    this.trajectoryState =
      (Math.imul(this.trajectoryState, 1664525) + 1013904223) >>> 0;
    return this.trajectoryState / 4294967296;
  }
  private spawn() {
    const { encounter } = this;
    // Consume the complete trajectory even when the group budget is full.
    const angle = this.trajectoryRandom() * Math.PI * 2;
    let offset: number;
    if (encounter.entryAngle) {
      const side = this.trajectoryRandom() < 0.5 ? -1 : 1;
      offset =
        side *
        (encounter.entryAngle.min +
          this.trajectoryRandom() *
            (encounter.entryAngle.max - encounter.entryAngle.min));
    } else
      offset =
        (this.trajectoryRandom() * 2 - 1) * (encounter.headingSpread ?? 0);
    const heading = angle + Math.PI + offset;
    const speed =
      encounter.speedMin +
      this.trajectoryRandom() * (encounter.speedMax - encounter.speedMin);
    const spin =
      encounter.wreckSpin.direction === "random" &&
      this.trajectoryRandom() < 0.5
        ? -encounter.wreckSpin.rate
        : encounter.wreckSpin.rate;
    if (this.groups >= encounter.groups) return;
    this.passes++;
    const wreck = this.body(
      "wreck",
      this.passes,
      encounter.centerX + Math.cos(angle) * encounter.radius,
      encounter.centerY + Math.sin(angle) * encounter.radius,
      Math.cos(heading) * speed,
      Math.sin(heading) * speed,
    );
    wreck.spin = spin;
    // The art's narrow tip is local up (-y), a quarter turn behind the +x axis.
    if (encounter.orientation === "tip-first")
      wreck.rotation = heading + Math.PI / 2;
    this.bodies.push(wreck);
  }
  private cast(
    body: SalvageBody,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    horizon: number,
    previous = false,
    angularScale = 1,
  ) {
    if (body.kind === "cell" || body.kind === "ship")
      return contactTime(
        x - (previous ? body.previousX : body.x),
        y - (previous ? body.previousY : body.y),
        vx,
        vy,
        radius + body.radius,
        horizon,
      );
    const shape = {
      kind: body.kind,
      x: previous ? body.previousX : body.x,
      y: previous ? body.previousY : body.y,
      rotation: previous
        ? (body.previousRotation ?? body.rotation)
        : body.rotation,
      shardIndex: body.shardIndex ?? 0,
      releasedMask: body.releasedMask ?? 0,
    };
    const bound = getDerelictRadius(shape) + radius;
    if (
      !Number.isFinite(
        contactTime(x - shape.x, y - shape.y, vx, vy, bound, horizon),
      )
    )
      return Infinity;
    if (!Number.isFinite(horizon)) {
      const speed = Math.hypot(vx, vy);
      horizon =
        speed > 0
          ? (Math.hypot(x - shape.x, y - shape.y) + bound * 2) / speed
          : 0;
    }
    return (
      castDerelict(
        {
          kind: body.kind,
          x: previous ? body.previousX : body.x,
          y: previous ? body.previousY : body.y,
          rotation: previous
            ? (body.previousRotation ?? body.rotation)
            : body.rotation,
          shardIndex: body.shardIndex ?? 0,
          releasedMask: body.releasedMask ?? 0,
        },
        { x, y },
        { x: vx, y: vy },
        radius,
        horizon,
        previous ? spinOf(body) * angularScale : 0,
      )?.time ?? Infinity
    );
  }
  private release(
    body: SalvageBody,
    index: number,
    suppressShipContact = false,
  ) {
    const bit = 1 << index;
    if ((body.releasedMask ?? 0) & bit) return;
    body.releasedMask = (body.releasedMask ?? 0) | bit;
    const site = DERELICT_SHARDS[index];
    const c = Math.cos(body.rotation),
      s = Math.sin(body.rotation);
    const px = (site.x - DERELICT_ORIGIN.x) * DERELICT_SCALE,
      py = (site.y - DERELICT_ORIGIN.y) * DERELICT_SCALE;
    const fragment = this.body(
      "fragment",
      body.group,
      body.x + c * px - s * py,
      body.y + s * px + c * py,
      body.vx + c * site.vx - s * site.vy,
      body.vy + s * site.vx + c * site.vy,
    );
    fragment.rotation = body.rotation;
    fragment.previousRotation = body.rotation;
    fragment.shardIndex = index;
    fragment.suppressShipContact = suppressShipContact;
    this.bodies.push(fragment);
  }
  private destroy(
    body: SalvageBody,
    cause: DestructionCause,
    time = this.time,
  ) {
    if (body.hull <= 0) return;
    body.hull = 0;
    if (cause === "expiry" || cause === "exit") return;
    if (body.kind !== "wreck") {
      if (cause === "player-weapon" || cause === "player-ram")
        this.emit("impact", body.x, body.y);
      return;
    }
    if (cause === "player-weapon" || cause === "player-ram") {
      this.destroyed++;
      this.playerKills++;
    }
    const playerRelease = cause === "player-weapon" || cause === "player-ram";
    if (!playerRelease) this.emit("break", body.x, body.y);
    for (let i = 0; i < DERELICT_SHARDS.length; i++)
      this.release(body, i, cause === "player-ram");
    if (playerRelease) {
      const c = Math.cos(body.rotation),
        s = Math.sin(body.rotation);
      const px =
        (DERELICT_ENERGY_SOURCE.x - DERELICT_ORIGIN.x) * DERELICT_SCALE;
      const py =
        (DERELICT_ENERGY_SOURCE.y - DERELICT_ORIGIN.y) * DERELICT_SCALE;
      const x = body.x + c * px - s * py,
        y = body.y + s * px + c * py;
      const cell = this.body(
        "cell",
        body.group,
        x,
        y,
        body.vx +
          c * DERELICT_ENERGY_EJECTION.x -
          s * DERELICT_ENERGY_EJECTION.y,
        body.vy +
          s * DERELICT_ENERGY_EJECTION.x +
          c * DERELICT_ENERGY_EJECTION.y,
      );
      cell.rotation = body.rotation;
      this.bodies.push(cell);
      this.emit("energy-release", x, y, x, y, time);
    }
  }
  private damage(
    body: SalvageBody,
    amount: number,
    time = this.time,
    ionHit = false,
  ) {
    if (body.hull <= 0) return;
    if (body.kind === "ship") {
      body.onDamage?.(amount);
      body.hull = Math.max(0, body.hull - amount);
      if (body.hull > 0) this.emit("impact", body.x, body.y);
      return;
    }
    this.hits++;
    if (ionHit && body.kind !== "cell") this.derelictIonHits++;
    if (body.kind === "wreck" && body.initialHull === undefined)
      body.initialHull = body.hull;
    if (body.hull <= amount) this.destroy(body, "player-weapon", time);
    else {
      body.hull -= amount;
      if (body.kind === "wreck") {
        const damage = 1 - body.hull / (body.initialHull ?? SALVAGE.wreck.hull);
        for (const [threshold, index] of [
          [0.2, 0],
          [0.4, 6],
          [0.6, 3],
        ] as const)
          if (damage + 1e-9 >= threshold) this.release(body, index);
      }
      this.emit("impact", body.x, body.y);
    }
  }
  private lineClear(
    x: number,
    y: number,
    endX: number,
    endY: number,
    star: Star,
    planets: readonly Planet[],
  ) {
    if (
      contactTime(
        x - star.pos.x,
        y - star.pos.y,
        endX - x,
        endY - y,
        star.radius,
        1,
      ) !== Infinity
    )
      return false;
    return planets.every(
      (planet) =>
        contactTime(
          x - planet.pos.x,
          y - planet.pos.y,
          endX - x,
          endY - y,
          planet.radius,
          1,
        ) === Infinity,
    );
  }
  private targetLaser(
    weapon: WeaponState,
    ship: GameObject,
    star: Star,
    planets: readonly Planet[],
  ) {
    const pose = weaponPose(ship, weapon.mount, weapon.angle);
    const candidates = (this.aimingBodies ?? this.bodies)
      .flatMap((body) => {
        const distance = Math.hypot(body.x - pose.x, body.y - pose.y);
        if (
          body.kind === "cell" ||
          body.hull <= 0 ||
          distance > WEAPONS.laser.range ||
          !this.lineClear(pose.x, pose.y, body.x, body.y, star, planets)
        )
          return [];
        const threat =
          body.kind === "fragment"
            ? this.cast(
                body,
                ship.pos.x,
                ship.pos.y,
                ship.vel.x - body.vx,
                ship.vel.y - body.vy,
                ship.radius,
                WEAPONS.laser.threatHorizon,
              )
            : Infinity;
        const priority = Number.isFinite(threat)
          ? 0
          : body.kind === "wreck"
            ? 1
            : 2;
        return [{ body, priority, order: priority === 0 ? threat : distance }];
      })
      .sort(
        (a, b) =>
          a.priority - b.priority || a.order - b.order || a.body.id - b.body.id,
      );
    const first = candidates[0];
    const retained = candidates.find(
      (candidate) => candidate.body.id === weapon.target,
    );
    return retained && retained.priority === first?.priority
      ? retained.body
      : first?.body;
  }
  /** Instant physical contact. Presentation may query this without applying damage. */
  ionContact(
    x: number,
    y: number,
    angle: number,
    star: Star,
    planets: readonly Planet[],
    reach: number = ION_CANNON.range,
  ) {
    const dx = Math.cos(angle),
      dy = Math.sin(angle);
    let distance = reach;
    let hit: SalvageBody | undefined;
    let blocked = false;
    for (const object of [star, ...planets]) {
      const d = contactTime(
        x - object.pos.x,
        y - object.pos.y,
        dx,
        dy,
        object.radius,
        reach,
      );
      if (d <= distance) {
        distance = d;
        blocked = true;
      }
    }
    for (const body of this.bodies) {
      if (body.kind === "cell" || body.hull <= 0) continue;
      const d = this.cast(body, x, y, dx, dy, 0, reach);
      if (d < distance || (d === distance && !blocked && !hit)) {
        distance = d;
        hit = body;
      }
    }
    return { distance, hit };
  }
  /** Forward ship-width by 300 rectangle; acquisition does not steer muzzle rays. */
  ionTrigger(ship: GameObject, star: Star, planets: readonly Planet[]) {
    return (this.aimingBodies ?? this.bodies).some((body) => {
      if (body.kind === "cell" || body.hull <= 0) return false;
      if (body.kind === "ship") {
        const dx = body.x - ship.pos.x;
        const dy = body.y - ship.pos.y;
        const forward =
          dx * Math.cos(ship.rotation) + dy * Math.sin(ship.rotation);
        const lateral = Math.abs(
          -dx * Math.sin(ship.rotation) + dy * Math.cos(ship.rotation),
        );
        return (
          forward > 0 &&
          forward <= ION_CANNON.range + body.radius &&
          lateral <= this.ionAcquisitionWidth / 2 + body.radius &&
          this.lineClear(ship.pos.x, ship.pos.y, body.x, body.y, star, planets)
        );
      }
      return derelictForwardContacts(
        { ...body, kind: body.kind === "wreck" ? "wreck" : "fragment" },
        ship.pos.x,
        ship.pos.y,
        ship.rotation,
        this.ionAcquisitionWidth,
        ION_CANNON.range,
      ).some((p) =>
        this.lineClear(ship.pos.x, ship.pos.y, p.x, p.y, star, planets),
      );
    });
  }
  /** Ready cannons and the trigger are captured once per update; hits cannot cancel this volley. */
  private ionVolley(ship: GameObject, star: Star, planets: readonly Planet[]) {
    const ready = new Set(
      this.weapons.filter(
        (w) => w.kind === "light-ion-cannon" && this.time + 1e-9 >= w.readyAt,
      ),
    );
    return ready.size && this.ionTrigger(ship, star, planets)
      ? ready
      : new Set<WeaponState>();
  }
  /** One volley cannon; returns false once power cannot fund it, stopping the rest of the volley. */
  private fireIonCannon(
    weapon: WeaponState,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    planets: readonly Planet[],
  ) {
    if (!canFire(resources, capacity, ION_CANNON.energy)) return false;
    const pose = weaponPose(ship, weapon.mount);
    const { distance, hit } = this.ionContact(
      pose.muzzleX,
      pose.muzzleY,
      pose.angle,
      star,
      planets,
    );
    resources.power = Math.max(0, resources.power - ION_CANNON.energy);
    this.energySpent += ION_CANNON.energy;
    weapon.readyAt = this.time + ION_CANNON.cooldown;
    this.ionDischarges++;
    const endX = pose.muzzleX + Math.cos(pose.angle) * distance;
    const endY = pose.muzzleY + Math.sin(pose.angle) * distance;
    // Same bounded event ring as other weapons, with current-pose identity for LFX.
    if (this.events.length >= 128) this.events.shift();
    this.events.push(
      WeaponEventSchema.parse({
        kind: "ion-cannon",
        id: ++this.eventSequence,
        x: pose.muzzleX,
        y: pose.muzzleY,
        endX,
        endY,
        time: this.time,
        mountKey: weapon.mount.key,
        distance,
      }),
    );
    if (hit) {
      this.damage(hit, ionCannonDamage(distance), this.time, true);
      this.emit("collision", endX, endY);
    }
    return true;
  }
  /**
   * Closest live wreck or fragment by distance from the pivot to its actual
   * collision geometry, with a clear line to that closest point. A retained
   * target yields only to a candidate at least the retention margin closer.
   */
  pointDefenceTarget(
    weapon: WeaponState,
    ship: Pick<GameObject, "pos" | "rotation">,
    star: Star,
    planets: readonly Planet[],
  ) {
    const pivot = weaponPose(ship, weapon.mount, weapon.angle);
    type Candidate = {
      body: SalvageBody;
      x: number;
      y: number;
      distance: number;
    };
    type CandidateOption = {
      body: SalvageBody;
      shape: {
        kind: "wreck" | "fragment";
        x: number;
        y: number;
        rotation: number;
        shardIndex: number;
        releasedMask: number;
      } | null;
      bound: number;
      closest: { distance: number; x: number; y: number } | null;
    };
    // Visit bodies nearest-bound first so distant material is skipped cheaply.
    const nearby = (this.aimingBodies ?? this.bodies)
      .flatMap<CandidateOption>((body) => {
        if (body.kind === "cell" || body.hull <= 0) return [];
        if (body.kind === "ship") {
          const dx = body.x - pivot.x;
          const dy = body.y - pivot.y;
          const centreDistance = Math.hypot(dx, dy);
          const distance = Math.max(0, centreDistance - body.radius);
          if (distance > POINT_DEFENCE.trackingRange) return [];
          const scale = centreDistance > 0 ? distance / centreDistance : 0;
          return [
            {
              body,
              shape: null,
              bound: distance,
              closest: {
                distance,
                x: pivot.x + dx * scale,
                y: pivot.y + dy * scale,
              },
            },
          ];
        }
        const shape = {
          kind: body.kind,
          x: body.x,
          y: body.y,
          rotation: body.rotation,
          shardIndex: body.shardIndex ?? 0,
          releasedMask: body.releasedMask ?? 0,
        };
        const bound = Math.max(
          0,
          Math.hypot(body.x - pivot.x, body.y - pivot.y) -
            getDerelictRadius(shape),
        );
        return bound > POINT_DEFENCE.trackingRange
          ? []
          : [{ body, shape, bound, closest: null }];
      })
      .sort((a, b) => a.bound - b.bound);
    let best: Candidate | undefined;
    let retained: Candidate | undefined;
    for (const { body, shape, bound, closest: shipClosest } of nearby) {
      const current = body.id === weapon.target;
      if (best && bound > best.distance && !current) continue;
      const closest =
        shipClosest ??
        (shape
          ? derelictClosestPoint(
              shape,
              pivot,
              current
                ? POINT_DEFENCE.trackingRange
                : (best?.distance ?? POINT_DEFENCE.trackingRange),
            )
          : null);
      if (!closest) continue;
      if (
        closest.distance > POINT_DEFENCE.trackingRange ||
        !this.lineClear(pivot.x, pivot.y, closest.x, closest.y, star, planets)
      )
        continue;
      const candidate = { body, ...closest };
      if (current) retained = candidate;
      if (
        !best ||
        candidate.distance < best.distance ||
        (candidate.distance === best.distance && body.id < best.body.id)
      )
        best = candidate;
    }
    return retained &&
      best &&
      best.distance > retained.distance - POINT_DEFENCE.retention
      ? retained
      : best;
  }
  /**
   * One turret: target, turn, then fire in the world left by earlier shots.
   * Returns false once power cannot fund a ready shot, which stops funding the
   * remaining turrets without starting their cooldowns.
   */
  private firePointDefence(
    weapon: WeaponState,
    funded: boolean,
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    planets: readonly Planet[],
  ) {
    const target = this.pointDefenceTarget(weapon, ship, star, planets);
    weapon.target = target?.body.id ?? null;
    if (!target) return funded;
    const pivot = weaponPose(ship, weapon.mount, weapon.angle);
    // Relative to the ship: a turning ship is cancelled within the turn-rate limit.
    // A pivot inside material has no bearing: hold the angle, treated as aligned.
    const desired =
      target.distance > 0
        ? Math.atan2(target.y - pivot.y, target.x - pivot.x) - ship.rotation
        : weapon.angle;
    const turn = POINT_DEFENCE.turnRate * dt;
    weapon.angle = angleDifference(
      weapon.angle +
        Math.max(-turn, Math.min(turn, angleDifference(desired, weapon.angle))),
      0,
    );
    this.angles[weapon.mount.key] = weapon.angle;
    if (
      !funded ||
      this.time + 1e-9 < weapon.readyAt ||
      Math.abs(angleDifference(desired, weapon.angle)) >
        POINT_DEFENCE.tolerance + 1e-12
    )
      return funded;
    const pose = weaponPose(ship, weapon.mount, weapon.angle);
    const { distance, hit } = this.ionContact(
      pose.muzzleX,
      pose.muzzleY,
      pose.angle,
      star,
      planets,
      POINT_DEFENCE.reach,
    );
    // World geometry first, or nothing within reach: no discharge, cost or cooldown.
    if (!hit || distance > POINT_DEFENCE.reach) return funded;
    if (!canFire(resources, capacity, POINT_DEFENCE.energy)) return false;
    resources.power = Math.max(0, resources.power - POINT_DEFENCE.energy);
    this.energySpent += POINT_DEFENCE.energy;
    weapon.readyAt = this.time + POINT_DEFENCE.cooldown;
    this.pointDefenceDischarges++;
    const endX = pose.muzzleX + Math.cos(pose.angle) * distance;
    const endY = pose.muzzleY + Math.sin(pose.angle) * distance;
    if (this.events.length >= 128) this.events.shift();
    this.events.push(
      WeaponEventSchema.parse({
        kind: "point-defence",
        id: ++this.eventSequence,
        x: pose.muzzleX,
        y: pose.muzzleY,
        endX,
        endY,
        time: this.time,
        mountKey: weapon.mount.key,
        distance,
      }),
    );
    this.damage(hit, pointDefenceDamage(distance), this.time, true);
    this.emit("collision", endX, endY);
    return true;
  }
  /**
   * Power after life support and engines goes to defence weapons (point
   * defences, lasers), then guns (Light Ion Cannons, rails). `weapons` is in
   * build-mount order, so each class walks it once in that order, drawing on the
   * power and world the earlier shots left. The cannon volley is captured after
   * the defence class and before the first gun; a cannon power shortfall stops
   * the remaining cannons, while rails check the energy floor themselves.
   */
  private fireWeapons(
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    planets: readonly Planet[],
  ) {
    let turretsFunded = true;
    for (const weapon of this.weapons)
      if (weapon.kind === "ion-point-defence")
        turretsFunded = this.firePointDefence(
          weapon,
          turretsFunded,
          dt,
          ship,
          star,
          resources,
          capacity,
          planets,
        );
      else if (weapon.kind === "laser")
        this.fireRailOrLaser(
          weapon,
          dt,
          ship,
          star,
          resources,
          capacity,
          planets,
        );
    const volley = this.ionVolley(ship, star, planets);
    let cannonsFunded = true;
    for (const weapon of this.weapons)
      if (weapon.kind === "light-ion-cannon") {
        if (cannonsFunded && volley.has(weapon))
          cannonsFunded = this.fireIonCannon(
            weapon,
            ship,
            star,
            resources,
            capacity,
            planets,
          );
      } else if (weapon.kind === "rail")
        this.fireRailOrLaser(
          weapon,
          dt,
          ship,
          star,
          resources,
          capacity,
          planets,
        );
  }
  /** Laser and rail keep their own acquisition; the shared energy floor gates the shot. */
  private fireRailOrLaser(
    weapon: WeaponState,
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    planets: readonly Planet[],
  ) {
    if (weapon.kind !== "rail" && weapon.kind !== "laser") return;
    const config = WEAPONS[weapon.kind];
    let target: SalvageBody | undefined;
    if (weapon.kind === "laser") {
      target = this.targetLaser(weapon, ship, star, planets);
      weapon.target = target?.id ?? null;
      if (target) {
        const base = weaponPose(ship, weapon.mount, weapon.angle);
        const desired =
          Math.atan2(target.y - base.y, target.x - base.x) - ship.rotation;
        const delta = angleDifference(desired, weapon.angle);
        weapon.angle += Math.max(
          -WEAPONS.laser.turnSpeed * dt,
          Math.min(WEAPONS.laser.turnSpeed * dt, delta),
        );
        weapon.angle = angleDifference(weapon.angle, 0);
        if (
          Math.abs(angleDifference(desired, weapon.angle)) >
          WEAPONS.laser.tolerance
        )
          target = undefined;
      }
    } else weapon.angle = weapon.mount.angle;
    this.angles[weapon.mount.key] = weapon.angle;
    if (
      this.time + 1e-9 < weapon.readyAt ||
      !canFire(resources, capacity, config.energy)
    )
      return;
    const pose = weaponPose(ship, weapon.mount, weapon.angle);
    if (weapon.kind === "rail") {
      if (this.shots.length >= 64) return;
      const dx = Math.cos(pose.angle),
        dy = Math.sin(pose.angle);
      const vx = ship.vel.x + dx * WEAPONS.rail.speed;
      const vy = ship.vel.y + dy * WEAPONS.rail.speed;
      let earliest = contactTime(
        pose.muzzleX - star.pos.x,
        pose.muzzleY - star.pos.y,
        vx,
        vy,
        star.radius,
        Infinity,
      );
      for (const body of this.bodies) {
        if (
          body.kind === "cell" ||
          body.hull <= 0 ||
          Math.hypot(body.x - pose.x, body.y - pose.y) > config.range ||
          !this.lineClear(
            pose.muzzleX,
            pose.muzzleY,
            body.x,
            body.y,
            star,
            planets,
          )
        )
          continue;
        let t = this.cast(
          body,
          pose.muzzleX,
          pose.muzzleY,
          vx - body.vx,
          vy - body.vy,
          0,
          Infinity,
        );
        // Predict the target's bearing when the slug reaches its forward plane.
        // The arc relaxes the trigger, never the fixed muzzle direction.
        const forward =
          (body.x - pose.muzzleX) * dx + (body.y - pose.muzzleY) * dy;
        const closing = (vx - body.vx) * dx + (vy - body.vy) * dy;
        if (forward > 0 && closing > 0) {
          const crossing = forward / closing;
          const leadX =
            body.x - pose.muzzleX + (body.vx - ship.vel.x) * crossing;
          const leadY =
            body.y - pose.muzzleY + (body.vy - ship.vel.y) * crossing;
          if (
            Math.abs(angleDifference(Math.atan2(leadY, leadX), pose.angle)) <=
            WEAPONS.rail.arc
          )
            t = Math.min(t, crossing);
        }
        if (
          t < earliest &&
          !outside(pose.muzzleX + vx * t, pose.muzzleY + vy * t)
        ) {
          earliest = t;
          target = body;
        }
      }
      weapon.target = target?.id ?? null;
      if (!target) return;
      this.shots.push({
        x: pose.muzzleX,
        y: pose.muzzleY,
        vx,
        vy,
        angle: pose.angle,
      });
      this.shotsFired++;
      weapon.recoil = {
        remaining: WEAPONS.rail.recoilDuration,
        angle: pose.angle,
      };
      this.emit("rail", pose.muzzleX, pose.muzzleY);
    } else {
      if (!target) return;
      // The visible pulse follows the barrel; its first physical hit owns damage.
      const dx = Math.cos(pose.angle),
        dy = Math.sin(pose.angle);
      let first = contactTime(
        pose.muzzleX - star.pos.x,
        pose.muzzleY - star.pos.y,
        dx,
        dy,
        star.radius,
        config.range,
      );
      for (const planet of planets)
        first = Math.min(
          first,
          contactTime(
            pose.muzzleX - planet.pos.x,
            pose.muzzleY - planet.pos.y,
            dx,
            dy,
            planet.radius,
            config.range,
          ),
        );
      let hit: SalvageBody | undefined;
      for (const body of this.bodies) {
        if (body.kind === "cell" || body.hull <= 0) continue;
        const distance = this.cast(
          body,
          pose.muzzleX,
          pose.muzzleY,
          dx,
          dy,
          0,
          config.range,
        );
        if (distance < first) {
          first = distance;
          hit = body;
        }
      }
      if (!hit) return;
      this.emit(
        "laser",
        pose.muzzleX,
        pose.muzzleY,
        pose.muzzleX + dx * first,
        pose.muzzleY + dy * first,
      );
      this.laserPulses++;
      this.damage(hit, config.damage, this.time - dt);
    }
    weapon.readyAt = this.time + config.cooldown;
    resources.power -= config.energy;
    this.energySpent += config.energy;
  }

  /** Runs this ship's normal weapon pipeline against one temporary live ship. */
  stepWeapons(
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    planets: readonly Planet[],
    targets: SalvageBody | readonly SalvageBody[],
    aimTargets?: readonly SalvageBody[],
  ) {
    const targetList = Array.isArray(targets) ? targets : [targets];
    this.time += dt;
    this.events = this.events.filter((event) => this.time - event.time <= 0.2);
    this.bodies.push(...targetList);
    this.aimingBodies = aimTargets ?? null;
    try {
      this.fireWeapons(dt, ship, star, resources, capacity, [...planets]);
    } finally {
      this.aimingBodies = null;
    }
    this.bodies = this.bodies.filter((body) => !targetList.includes(body));

    this.shots = this.shots.filter((shot) => {
      let first = contactTime(
        shot.x - star.pos.x,
        shot.y - star.pos.y,
        shot.vx,
        shot.vy,
        star.radius,
        dt,
      );
      for (const planet of planets)
        first = Math.min(
          first,
          contactTime(
            shot.x - planet.pos.x,
            shot.y - planet.pos.y,
            shot.vx,
            shot.vy,
            planet.radius,
            dt,
          ),
        );
      let hitTarget: SalvageBody | undefined;
      for (const target of targetList) {
        if (target.hull <= 0) continue;
        const targetTime = contactTime(
          shot.x - target.previousX,
          shot.y - target.previousY,
          shot.vx - target.vx,
          shot.vy - target.vy,
          target.radius,
          dt,
        );
        if (targetTime < first) {
          first = targetTime;
          hitTarget = target;
        }
      }
      shot.x += shot.vx * Math.min(dt, first);
      shot.y += shot.vy * Math.min(dt, first);
      if (hitTarget)
        this.damage(hitTarget, WEAPONS.rail.damage, this.time - dt + first);
      if (first !== Infinity) this.emit("collision", shot.x, shot.y);
      return first === Infinity && !outside(shot.x, shot.y);
    });
    for (const weapon of this.weapons) {
      if (!weapon.recoil) continue;
      const duration = Math.min(dt, weapon.recoil.remaining);
      const impulse = this.recoilAcceleration * duration;
      ship.vel.x -= Math.cos(weapon.recoil.angle) * impulse;
      ship.vel.y -= Math.sin(weapon.recoil.angle) * impulse;
      weapon.recoil.remaining -= duration;
      if (weapon.recoil.remaining <= 1e-9) weapon.recoil = null;
    }
  }

  step(
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    capacity: number,
    previousX: number,
    previousY: number,
    wrapped: boolean,
    planets: readonly Planet[] = [],
  ) {
    this.time += dt;
    this.events = this.events.filter(
      (event) =>
        this.time - event.time <=
        (event.kind === "energy-release" ? DERELICT_RELEASE_CUE.duration : 0.2),
    );
    while (this.time + 1e-9 >= this.nextPass) {
      this.spawn();
      this.nextPass +=
        this.encounter.intervalMin +
        this.scheduleRandom() *
          (this.encounter.intervalMax - this.encounter.intervalMin);
    }
    const hazards = [star, ...planets];
    const existingBodies = new Set(this.bodies);
    // A body already touching a world hazard is gone before an instantaneous pulse.
    for (const body of existingBodies) {
      if (body.hull <= 0) continue;
      if (body.life !== undefined && body.life <= 0) {
        this.destroy(body, "expiry");
        continue;
      }
      if (body.kind !== "fragment" && outside(body.x, body.y)) {
        this.destroy(body, "exit");
        continue;
      }
      if (
        body.hull > 0 &&
        hazards.some(
          (hazard) =>
            this.cast(
              body,
              hazard.pos.x,
              hazard.pos.y,
              0,
              0,
              hazard.radius,
              0,
            ) !== Infinity,
        )
      )
        this.destroy(body, "environment");
    }
    this.fireWeapons(dt, ship, star, resources, capacity, planets);
    for (const weapon of this.weapons) {
      if (!weapon.recoil) continue;
      const duration = Math.min(dt, weapon.recoil.remaining);
      const impulse = this.recoilAcceleration * duration;
      // External recoil uses ion force and build mass, without an engine speed cap.
      // Keep the direction of the fired shot even if the ship turns during recoil.
      ship.vel.x -= Math.cos(weapon.recoil.angle) * impulse;
      ship.vel.y -= Math.sin(weapon.recoil.angle) * impulse;
      weapon.recoil.remaining -= duration;
      if (weapon.recoil.remaining <= 1e-9) weapon.recoil = null;
    }
    const startX = wrapped ? ship.pos.x : previousX,
      startY = wrapped ? ship.pos.y : previousY;
    for (const body of existingBodies) {
      if (body.hull <= 0) continue;
      body.previousRotation = body.rotation;
      body.previousX = body.x;
      body.previousY = body.y;
      // The ship's gravity field, evaluated the same way: the sun's pull, then
      // each planet's, as an acceleration that ignores the body's mass.
      // Velocity first, then position, as the ship integrates. The sweep below
      // is linear along the new velocity within the sub-step.
      const pull = starPull(body, star, "inverse-square");
      for (const planet of planets) {
        const planetAcc = planetPull(body, 0, planet);
        pull.x += planetAcc.x;
        pull.y += planetAcc.y;
      }
      body.vx += pull.x * dt;
      body.vy += pull.y * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      if (body.life !== undefined) body.life -= dt;
      if (body.kind !== "cell") body.rotation += dt * spinOf(body);
      if (body.kind === "fragment") {
        // A shard stays in the system: it reappears opposite, velocity and
        // heading kept, as the ship does. The previous pose continues the
        // motion so no sweep crosses the system.
        const wrap = antipodalWrap(
          body.x,
          body.y,
          ENCOUNTER.centerX,
          ENCOUNTER.centerY,
        );
        if (wrap) {
          body.x = wrap.x;
          body.y = wrap.y;
          body.previousX = wrap.x - body.vx * dt;
          body.previousY = wrap.y - body.vy * dt;
        }
      }
    }
    type Terminal = { time: number; cause: "environment" | "expiry" | "exit" };
    const terminalTimes = new Map<
      SalvageBody,
      { mask: number; terminal: Terminal }
    >();
    const shipTimes = new Map<SalvageBody, { mask: number; time: number }>();
    const terminal = (body: SalvageBody): Terminal => {
      const mask = body.releasedMask ?? 0;
      const cached = terminalTimes.get(body);
      if (cached?.mask === mask) return cached.terminal;
      let result: Terminal = { time: Infinity, cause: "environment" };
      for (const hazard of hazards) {
        const time = this.cast(
          body,
          hazard.pos.x,
          hazard.pos.y,
          -body.vx,
          -body.vy,
          hazard.radius,
          dt,
          true,
        );
        if (time < result.time) result = { time, cause: "environment" };
      }
      const expiry =
        body.life !== undefined && body.life <= 0
          ? Math.max(0, dt + body.life)
          : Infinity;
      if (expiry < result.time) result = { time: expiry, cause: "expiry" };
      if (body.kind !== "fragment" && outside(body.x, body.y)) {
        const x = body.previousX - ENCOUNTER.centerX,
          y = body.previousY - ENCOUNTER.centerY;
        const a = body.vx ** 2 + body.vy ** 2;
        const b = 2 * (x * body.vx + y * body.vy);
        const c = x * x + y * y - ENCOUNTER.radius ** 2;
        const time =
          a > 0
            ? Math.max(
                0,
                (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a),
              )
            : Infinity;
        if (time < result.time) result = { time, cause: "exit" };
      }
      terminalTimes.set(body, { mask, terminal: result });
      return result;
    };
    const shipTime = (body: SalvageBody) => {
      const mask = body.releasedMask ?? 0;
      const cached = shipTimes.get(body);
      if (cached?.mask === mask) return cached.time;
      const time = body.suppressShipContact
        ? Infinity
        : dt *
          this.cast(
            body,
            startX,
            startY,
            ship.pos.x - startX - (body.x - body.previousX),
            ship.pos.y - startY - (body.y - body.previousY),
            ship.radius,
            1,
            true,
            dt,
          );
      shipTimes.set(body, { mask, time });
      return time;
    };

    this.shots = this.shots.filter((shot) => {
      let first = contactTime(
        shot.x - star.pos.x,
        shot.y - star.pos.y,
        shot.vx,
        shot.vy,
        star.radius,
        dt,
      );
      for (const planet of planets)
        first = Math.min(
          first,
          contactTime(
            shot.x - planet.pos.x,
            shot.y - planet.pos.y,
            shot.vx,
            shot.vy,
            planet.radius,
            dt,
          ),
        );
      let hit: SalvageBody | undefined;
      for (const body of existingBodies) {
        if (body.kind === "cell" || body.hull <= 0) continue;
        const time = this.cast(
          body,
          shot.x,
          shot.y,
          shot.vx - body.vx,
          shot.vy - body.vy,
          0,
          dt,
          true,
        );
        if (
          time < first &&
          time < terminal(body).time &&
          time < shipTime(body)
        ) {
          first = time;
          hit = body;
        }
      }
      shot.x += shot.vx * Math.min(dt, first);
      shot.y += shot.vy * Math.min(dt, first);
      if (hit) {
        const end = { x: hit.x, y: hit.y, rotation: hit.rotation };
        hit.x = hit.previousX + hit.vx * first;
        hit.y = hit.previousY + hit.vy * first;
        hit.rotation =
          (hit.previousRotation ?? end.rotation) + first * spinOf(hit);
        this.damage(hit, WEAPONS.rail.damage, this.time - dt + first);
        if (hit.hull > 0) Object.assign(hit, end);
      }
      if (first !== Infinity) this.emit("collision", shot.x, shot.y);
      return first === Infinity && !outside(shot.x, shot.y);
    });
    // Keep every newborn from one ram suppressed until the ship has left all of them.
    const suppressedBodies = new Set(
      this.bodies.filter((b) => b.suppressShipContact),
    );
    const suppressedGroups = new Set([...suppressedBodies].map((b) => b.group));
    for (const group of suppressedGroups) {
      const pieces = this.bodies.filter(
        (b) => b.group === group && b.suppressShipContact,
      );
      if (
        pieces.every(
          (b) =>
            this.cast(b, ship.pos.x, ship.pos.y, 0, 0, ship.radius, 0) ===
            Infinity,
        )
      )
        for (const piece of pieces) piece.suppressShipContact = false;
    }
    for (const body of [...this.bodies]) {
      if (body.hull <= 0) continue;
      const born = !existingBodies.has(body);
      const contact = born
        ? this.cast(body, ship.pos.x, ship.pos.y, 0, 0, ship.radius, 0)
        : this.cast(
            body,
            startX,
            startY,
            ship.pos.x - startX - (body.x - body.previousX),
            ship.pos.y - startY - (body.y - body.previousY),
            ship.radius,
            1,
            true,
            dt,
          );
      if (suppressedBodies.has(body)) continue;
      if (
        contact === Infinity ||
        (!born && terminal(body).time <= contact * dt)
      )
        continue;
      if (body.kind === "cell") {
        const amount = Math.max(
          0,
          Math.min(SALVAGE.cell.energy, capacity - resources.power),
        );
        resources.power += amount;
        this.energyCollected += amount;
        this.cellsCollected++;
        this.lastCollection = { time: this.time, amount };
        body.hull = 0;
        this.emit("collect", body.x, body.y);
      } else {
        resources.hull = Math.max(
          0,
          resources.hull -
            (body.kind === "wreck"
              ? SALVAGE.wreck.contact
              : SALVAGE.fragment.contact),
        );
        if (body.kind === "wreck") {
          const hit = castDerelict(
            {
              kind: "wreck",
              x: body.previousX,
              y: body.previousY,
              rotation: body.previousRotation ?? body.rotation,
              releasedMask: body.releasedMask ?? 0,
            },
            { x: startX, y: startY },
            {
              x: ship.pos.x - startX - (body.x - body.previousX),
              y: ship.pos.y - startY - (body.y - body.previousY),
            },
            ship.radius,
            1,
            spinOf(body) * dt,
          );
          if (hit)
            this.emit(
              "collision",
              hit.surfaceX + (body.x - body.previousX) * hit.time,
              hit.surfaceY + (body.y - body.previousY) * hit.time,
            );
        }
        if (!born) {
          body.x = body.previousX + (body.x - body.previousX) * contact;
          body.y = body.previousY + (body.y - body.previousY) * contact;
          body.rotation =
            (body.previousRotation ?? body.rotation) +
            dt * contact * spinOf(body);
        }
        this.destroy(
          body,
          "player-ram",
          born ? this.time : this.time - dt + contact * dt,
        );
      }
    }
    for (const body of existingBodies) {
      if (body.hull <= 0) continue;
      const { time, cause } = terminal(body);
      if (time === Infinity) continue;
      body.x = body.previousX + body.vx * time;
      body.y = body.previousY + body.vy * time;
      body.rotation =
        (body.previousRotation ?? body.rotation) + time * spinOf(body);
      this.destroy(body, cause);
    }
    this.bodies = this.bodies.filter((body) => body.hull > 0);
  }
}
