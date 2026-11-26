import {
  antipodalWrap,
  type GameObject,
  type InputState,
  type Planet,
  planetPull,
  type Resources,
  type Star,
  starPull,
  Vec2,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildMounts,
  plasmaVentOutlets,
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
import { PlasmaVentArea } from "./plasma-vent-area";
import {
  ASSEMBLED_ION_DEFAULTS,
  type AssembledIonSettings,
  ION_REFERENCE_MASS,
} from "./schemas/ion";
import {
  buildStats,
  CHASSIS,
  defaultLoadout,
  fittedParts,
  type Loadout,
  PARTS,
  type PartId,
} from "./schemas/loadout";
import type { SalvagePhysicalState } from "./schemas/salvage";
import {
  DamageAmountSchema,
  type DestructionCause,
  DRONE_LAUNCHER,
  ENCOUNTER,
  type EncounterConfig,
  ION_CANNON,
  ionCannonDamage,
  PLASMA_RIFLE,
  type PlasmaBurst,
  PlasmaBurstSchema,
  type PlasmaContact,
  PlasmaContactSchema,
  type PlasmaRifleCycle,
  PlasmaRifleCycleSchema,
  type PlasmaStream,
  PlasmaStreamSchema,
  type PlasmaVentEvent,
  type PlasmaVisualEvent,
  POINT_DEFENCE,
  pointDefenceDamage,
  SALVAGE,
  WEAPONS,
  type WeaponEvent,
  WeaponEventSchema,
} from "./schemas/salvage";
import {
  acquireFleetTargets,
  PLAYER_BODY_ID,
  type WeaponAcquisition,
} from "./targeting";

/** Study reference: Wasp, Service ion, rifle and Light Ion Cannon. */
const ventReferenceLoadout = defaultLoadout("wasp");
ventReferenceLoadout.side = "service-ion";
ventReferenceLoadout.hull = ["plasma-rifle", "light-ion-cannon"];
export const PLASMA_RIFLE_VENT_REFERENCE_MASS =
  buildStats(ventReferenceLoadout).mass;

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
  /** End pose for swept live-ship contact; acquisition retains its existing coordinates. */
  sweepEndX?: number;
  sweepEndY?: number;
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
    ...(previous ? { sweepEndX: ship.pos.x, sweepEndY: ship.pos.y } : {}),
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
/** Optional Lab counters, accumulated across every shooter in a combat substep. */
export interface TargetingMetrics {
  bodyVisits: number;
  comparisons: number;
  acquisitionMs: number;
  contactMs: number;
  activeRequests?: number;
  materialTests?: number;
  visibilityTests?: number;
}

export interface WeaponState {
  mount: BuildMount;
  kind:
    | "rail"
    | "laser"
    | "light-ion-cannon"
    | "ion-point-defence"
    | "plasma-rifle"
    | "drone-launcher";
  angle: number;
  readyAt: number;
  target: number | null;
  targetPoint?: { x: number; y: number } | null;
  plasma?: PlasmaRifleCycle;
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
interface PendingPlasmaKick {
  offset: number;
  angle: number;
  head: PlasmaStream;
}
interface PendingPlasmaVent {
  mount: BuildMount;
  sample: Pick<GameObject, "pos" | "rotation">;
  startSample: Pick<GameObject, "pos" | "rotation">;
  endSample: Pick<GameObject, "pos" | "rotation">;
  start: number;
  duration: number;
  intensity: number;
}
/** A body's linear start pose and velocity for one combat substep. */
function plasmaBodyMotion(body: SalvageBody, dt: number) {
  let x = body.previousX,
    y = body.previousY,
    vx = body.vx,
    vy = body.vy;
  if (
    body.kind === "ship" &&
    body.sweepEndX !== undefined &&
    body.sweepEndY !== undefined &&
    dt > 0
  ) {
    const dx = body.sweepEndX - x,
      dy = body.sweepEndY - y;
    if (Math.hypot(dx, dy) > 1200) {
      x = body.sweepEndX - vx * dt;
      y = body.sweepEndY - vy * dt;
    } else {
      vx = dx / dt;
      vy = dy / dt;
    }
  }
  return { x, y, vx, vy };
}
function plasmaBodyPose(
  body: SalvageBody,
  dt: number,
  offset: number,
  integrated: boolean,
) {
  const motion = plasmaBodyMotion(body, dt);
  return {
    ...motion,
    x: motion.x + motion.vx * offset,
    y: motion.y + motion.vy * offset,
    rotation:
      body.kind === "ship"
        ? body.rotation
        : (integrated
            ? (body.previousRotation ?? body.rotation)
            : body.rotation) +
          spinOf(body) * offset,
  };
}
function angleDifference(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
/** Interpolate a mounted emitter's pose without drawing a chord across wrap. */
function mountedPoseAt(
  ship: GameObject,
  previous: { x: number; y: number; rotation: number } | undefined,
  dt: number,
  elapsed: number,
) {
  if (!previous) return ship;
  const fraction = dt > 0 ? elapsed / dt : 1;
  const wrapped =
    Math.hypot(ship.pos.x - previous.x, ship.pos.y - previous.y) > 1200;
  const x = wrapped ? ship.pos.x - ship.vel.x * dt : previous.x;
  const y = wrapped ? ship.pos.y - ship.vel.y * dt : previous.y;
  return {
    pos: new Vec2(
      x + (ship.pos.x - x) * fraction,
      y + (ship.pos.y - y) * fraction,
    ),
    rotation:
      previous.rotation +
      angleDifference(ship.rotation, previous.rotation) * fraction,
  };
}
function outside(x: number, y: number) {
  return (
    Math.hypot(x - ENCOUNTER.centerX, y - ENCOUNTER.centerY) >
    ENCOUNTER.radius + 1e-7
  );
}

function isFunctionalWeapon(
  part: PartId | null,
): part is Exclude<WeaponState["kind"], "rail"> {
  return (
    part === "light-ion-cannon" ||
    part === "ion-point-defence" ||
    part === "laser" ||
    part === "drone-launcher" ||
    part === "plasma-rifle"
  );
}

export function fittedWeaponKinds(loadout: Loadout) {
  return fittedParts(loadout).filter(isFunctionalWeapon);
}

type WeaponDebit = Pick<WeaponState, "kind" | "plasma">;

function nextDebit(weapon: WeaponDebit, dt: number) {
  switch (weapon.kind) {
    case "drone-launcher":
      return DRONE_LAUNCHER.energy;
    case "ion-point-defence":
      return POINT_DEFENCE.energy;
    case "light-ion-cannon":
      return ION_CANNON.energy;
    case "plasma-rifle": {
      const charge =
        weapon.plasma?.phase === "charging" ? weapon.plasma.charge : 0;
      if (charge === 1) return PLASMA_RIFLE.releasePower;
      return (
        Math.min(dt, (1 - charge) * PLASMA_RIFLE.chargeSeconds) *
        PLASMA_RIFLE.chargePowerPerSecond
      );
    }
    default:
      return WEAPONS[weapon.kind].energy;
  }
}
export function weaponsEnergyEmergency(
  power: number,
  mounts: readonly WeaponDebit[],
  dt: number,
) {
  return (
    mounts.length > 0 &&
    mounts.every((mount) => power < WEAPONS.reserve + nextDebit(mount, dt))
  );
}
function canFire(resources: Resources, cost: number) {
  return resources.power > WEAPONS.reserve + cost;
}
/** Fixed shot prices are in tenths. Subtract in that unit so e.g. 10.3 - 0.1 lands on 10.2. */
function payShot(resources: Resources, cost: number) {
  resources.power = (resources.power * 10 - cost * 10) / 10;
}
/** Bounded, deterministic gameplay. No Canvas, wall clock, or cosmetic randomness. */
export class SalvageSystem {
  launchDrone?: (
    ship: GameObject,
    mount: WeaponState,
    targetId: number,
  ) => boolean;
  weaponsEnergyEmergency(power: number, dt = 1 / 240) {
    return weaponsEnergyEmergency(power, this.weapons, dt);
  }
  targetingMetrics?: TargetingMetrics;
  private aimingBodies: readonly SalvageBody[] | null = null;
  private activeBodies: readonly SalvageBody[] | null = null;
  private get weaponBodies(): readonly SalvageBody[] {
    return this.activeBodies ?? this.bodies;
  }
  private shooterId: number | null = null;
  private aimId: number | null = null;
  private acquisitionEligible(body: SalvageBody, pointDefence = false) {
    return (
      body.id !== this.shooterId &&
      (body.carrierId === undefined ||
        (pointDefence &&
          ((this.shooterId ?? PLAYER_BODY_ID) === PLAYER_BODY_ID) !==
            (body.carrierId === PLAYER_BODY_ID))) &&
      (this.aimId === null ||
        body.id === this.aimId ||
        body.carrierId === this.aimId)
    );
  }
  private contactEligible(body: SalvageBody) {
    return body.id !== this.shooterId;
  }
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
  plasmaReleases = 0;
  plasmaVents = 0;
  plasmaStreams: PlasmaStream[] = [];
  plasmaContacts = 0;
  plasmaAirbursts = 0;
  readonly plasmaBurstEvents: PlasmaBurst[] = [];
  lastPlasmaContact: PlasmaContact | null = null;
  readonly plasmaContactEvents: PlasmaContact[] = [];
  /** Translate local combat time to the containing simulation's clock. */
  presentationTimeOffset = 0;
  readonly plasmaVisualEvents: PlasmaVisualEvent[] = [];
  private plasmaVisualSequence = 0;
  readonly plasmaVentEvents: PlasmaVentEvent[] = [];
  private plasmaVentSequence = 0;
  readonly plasmaVentArea = new PlasmaVentArea();
  get hasActivePlasma() {
    return this.plasmaStreams.length > 0 || this.plasmaVentArea.active;
  }
  private readonly plasmaVentAcceleration: number;
  private readonly plasmaKickVelocity: number;
  laserPulses = 0;
  hits = 0;
  playerShardKills = 0;
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
  readonly loadoutChassis: Loadout["chassis"];
  constructor(
    loadout: Loadout,
    seed: number,
    ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
    private readonly encounter: EncounterConfig = ENCOUNTER,
  ) {
    this.loadoutChassis = loadout.chassis;
    this.plasmaKickVelocity =
      (PARTS.plasma.thrust * PLASMA_RIFLE.kickSeconds) /
      buildStats(loadout).mass;
    this.plasmaVentAcceleration =
      (PLASMA_RIFLE.ventReferenceAcceleration *
        PLASMA_RIFLE_VENT_REFERENCE_MASS) /
      buildStats(loadout).mass;
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
      isFunctionalWeapon(mount.part)
        ? [
            {
              mount,
              kind: mount.part,
              angle: mount.angle,
              readyAt: 0,
              target: null,
              ...(mount.part === "plasma-rifle"
                ? {
                    targetPoint: null,
                    plasma: PlasmaRifleCycleSchema.parse({
                      phase: "idle",
                      charge: 0,
                      remaining: 0,
                      targetId: null,
                    }),
                  }
                : {}),
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
    const occupied =
      encounter.occupancy === "intact-wrecks"
        ? this.bodies.some((body) => body.kind === "wreck" && body.hull > 0)
        : this.groups >= encounter.groups;
    if (occupied) return;
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
  cast(
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
    const playerRelease = cause === "player-weapon" || cause === "player-ram";
    if (body.kind !== "wreck") {
      if (playerRelease && body.kind === "fragment") this.playerShardKills++;
      if (playerRelease) this.emit("impact", body.x, body.y);
      return;
    }
    if (playerRelease) {
      this.destroyed++;
      this.playerKills++;
    }
    if (!playerRelease)
      this.emit("break", body.x, body.y, body.x, body.y, time);
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
  /** Shared weapon damage entry point; preserves production breakup and events. */
  applyDamage(body: SalvageBody, amount: number, playerWeapon = true) {
    const damage = DamageAmountSchema.parse(amount);
    if (!this.bodies.includes(body))
      throw new Error("Damage target is not in this simulation");
    this.damage(body, damage, this.time, playerWeapon);
  }
  private damage(
    body: SalvageBody,
    amount: number,
    time = this.time,
    playerWeapon = true,
  ) {
    if (body.hull <= 0) return;
    if (body.kind === "ship") {
      body.onDamage?.(amount);
      body.hull = Math.max(0, body.hull - amount);
      if (body.hull > 0) this.emit("impact", body.x, body.y);
      return;
    }
    if (playerWeapon) this.hits++;
    if (body.kind === "wreck" && body.initialHull === undefined)
      body.initialHull = body.hull;
    if (body.hull <= amount)
      this.destroy(body, playerWeapon ? "player-weapon" : "environment", time);
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
  lineClear(
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
    for (const body of this.weaponBodies) {
      if (!this.contactEligible(body) || body.kind === "cell" || body.hull <= 0)
        continue;
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
    const started = this.targetingMetrics ? performance.now() : 0;
    const triggered = (this.aimingBodies ?? this.weaponBodies).some((body) => {
      if (this.targetingMetrics) this.targetingMetrics.bodyVisits++;
      if (!this.acquisitionEligible(body)) return false;
      if (this.targetingMetrics) this.targetingMetrics.comparisons++;
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
    if (this.targetingMetrics)
      this.targetingMetrics.acquisitionMs += performance.now() - started;
    return triggered;
  }
  /** One volley cannon; returns false once power cannot fund it, stopping the rest of the volley. */
  private fireIonCannon(
    weapon: WeaponState,
    ship: GameObject,
    star: Star,
    resources: Resources,
    planets: readonly Planet[],
  ) {
    if (!canFire(resources, ION_CANNON.energy)) return false;
    const pose = weaponPose(ship, weapon.mount);
    const contactStarted = this.targetingMetrics ? performance.now() : 0;
    const { distance, hit } = this.ionContact(
      pose.muzzleX,
      pose.muzzleY,
      pose.angle,
      star,
      planets,
    );
    if (this.targetingMetrics)
      this.targetingMetrics.contactMs += performance.now() - contactStarted;
    payShot(resources, ION_CANNON.energy);
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
      this.damage(hit, ionCannonDamage(distance));
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
    const started = this.targetingMetrics ? performance.now() : 0;
    // Visit bodies nearest-bound first so distant material is skipped cheaply.
    const nearby = (this.aimingBodies ?? this.weaponBodies)
      .flatMap<CandidateOption>((body) => {
        if (this.targetingMetrics) this.targetingMetrics.bodyVisits++;
        if (!this.acquisitionEligible(body, true)) return [];
        if (this.targetingMetrics) this.targetingMetrics.comparisons++;
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
    if (this.targetingMetrics)
      this.targetingMetrics.acquisitionMs += performance.now() - started;
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
    planets: readonly Planet[],
    acquisition: WeaponAcquisition,
    allowFire: boolean,
  ) {
    const target = acquisition.targets.get(weapon);
    weapon.target = target?.id ?? null;
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
      !allowFire ||
      !funded ||
      this.time + 1e-9 < weapon.readyAt ||
      Math.abs(angleDifference(desired, weapon.angle)) >
        POINT_DEFENCE.tolerance + 1e-12
    )
      return funded;
    const pose = weaponPose(ship, weapon.mount, weapon.angle);
    const contactStarted = this.targetingMetrics ? performance.now() : 0;
    const { distance, hit } = this.ionContact(
      pose.muzzleX,
      pose.muzzleY,
      pose.angle,
      star,
      planets,
      POINT_DEFENCE.reach,
    );
    if (this.targetingMetrics)
      this.targetingMetrics.contactMs += performance.now() - contactStarted;
    // World geometry first, or nothing within reach: no discharge, cost or cooldown.
    if (!hit || distance > POINT_DEFENCE.reach) return funded;
    if (!canFire(resources, POINT_DEFENCE.energy)) return false;
    payShot(resources, POINT_DEFENCE.energy);
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
    this.damage(hit, pointDefenceDamage(distance));
    this.emit("collision", endX, endY);
    return true;
  }
  private startPlasmaVent(state: NonNullable<WeaponState["plasma"]>) {
    state.phase = "venting";
    state.remaining = PLASMA_RIFLE.ventSeconds;
    state.targetId = null;
    this.plasmaVents++;
  }
  /** Advance one mounted rifle with a single captured acquisition for this substep. */
  private advancePlasma(
    weapon: WeaponState,
    dt: number,
    resources: Resources,
    ship: GameObject,
    previousShip: { x: number; y: number; rotation: number } | undefined,
    vents: PendingPlasmaVent[],
    kicks: PendingPlasmaKick[],
    allowFire: boolean,
  ) {
    const state = weapon.plasma;
    if (!state) return;
    let left = dt;
    const target = allowFire ? weapon.target : null;
    while (true) {
      if (state.phase === "charging" && state.targetId !== target) {
        this.startPlasmaVent(state);
      }
      if (state.phase === "idle") {
        if (
          target === null ||
          left <= 0 ||
          !canFire(resources, nextDebit(weapon, left))
        )
          break;
        state.phase = "charging";
        state.targetId = target;
      }
      if (state.phase === "charging") {
        const chargeTime = (1 - state.charge) * PLASMA_RIFLE.chargeSeconds;
        const consumed = Math.min(left, chargeTime);
        if (consumed > 0) {
          const energy = consumed * PLASMA_RIFLE.chargePowerPerSecond;
          if (!canFire(resources, energy)) break;
          resources.power -= energy;
          this.energySpent += energy;
          state.charge = Math.min(
            1,
            state.charge + consumed / PLASMA_RIFLE.chargeSeconds,
          );
          left -= consumed;
        }
        if (state.charge >= 1 - 1e-9) {
          state.charge = 1;
          if (canFire(resources, PLASMA_RIFLE.releasePower)) {
            payShot(resources, PLASMA_RIFLE.releasePower);
            this.energySpent += PLASMA_RIFLE.releasePower;
            this.plasmaReleases++;
            const elapsed = dt - left;
            const releaseShip = mountedPoseAt(ship, previousShip, dt, elapsed);
            const pose = weaponPose(releaseShip, weapon.mount);
            const head = PlasmaStreamSchema.parse({
              mountKey: weapon.mount.key,
              originX: pose.muzzleX,
              originY: pose.muzzleY,
              x: pose.muzzleX,
              y: pose.muzzleY,
              vx: ship.vel.x + Math.cos(pose.angle) * PLASMA_RIFLE.streamSpeed,
              vy: ship.vel.y + Math.sin(pose.angle) * PLASMA_RIFLE.streamSpeed,
              heading: pose.angle,
              age: 0,
              launchTime: this.time - dt + elapsed,
            });
            this.plasmaStreams.push(head);
            kicks.push({ offset: elapsed, angle: pose.angle, head });
            state.phase = "firing";
            state.remaining = PLASMA_RIFLE.firingSeconds;
          } else break;
        } else break;
      }
      if (
        state.phase === "firing" ||
        state.phase === "venting" ||
        state.phase === "cooldown"
      ) {
        const phase = state.phase;
        const elapsed = Math.min(left, state.remaining);
        if (phase === "venting" && elapsed > 0) {
          const midpoint = dt - left + elapsed / 2;
          const sample = mountedPoseAt(ship, previousShip, dt, midpoint);
          vents.push({
            mount: weapon.mount,
            sample,
            startSample: mountedPoseAt(ship, previousShip, dt, dt - left),
            endSample: mountedPoseAt(
              ship,
              previousShip,
              dt,
              dt - left + elapsed,
            ),
            start: midpoint - elapsed / 2,
            duration: elapsed,
            intensity:
              (state.remaining - elapsed / 2) / PLASMA_RIFLE.ventSeconds,
          });
          state.charge *= 1 - elapsed / state.remaining;
        }
        state.remaining = Math.max(0, state.remaining - elapsed);
        left -= elapsed;
        if (state.remaining > 1e-9) break;
        if (phase === "firing") {
          state.charge = 0;
          this.startPlasmaVent(state);
        } else if (phase === "cooldown") {
          state.phase = "idle";
          state.targetId = null;
          state.charge = 0;
        } else {
          state.phase = "cooldown";
          state.remaining = PLASMA_RIFLE.cooldownSeconds;
          state.charge = 0;
          state.targetId = null;
        }
        if (left <= 1e-9) break;
      }
    }
  }
  /** All simultaneous vents sample the same time-varying hull velocity. */
  private resolvePlasmaForces(
    ship: GameObject,
    dt: number,
    vents: PendingPlasmaVent[],
    kicks: PendingPlasmaKick[],
  ) {
    const initialX = ship.vel.x,
      initialY = ship.vel.y;
    vents.sort((a, b) => a.start + a.duration / 2 - (b.start + b.duration / 2));
    for (const vent of vents) {
      const sampleOutlets = (
        sample: PendingPlasmaVent["sample"],
        at: number,
        beforeKick = false,
      ): PlasmaVentEvent["outlets"] => {
        let vx = initialX,
          vy = initialY;
        for (const other of vents) {
          const elapsed = Math.max(
            0,
            Math.min(other.duration, at - other.start),
          );
          vx -=
            Math.cos(other.sample.rotation) *
            this.plasmaVentAcceleration *
            elapsed;
          vy -=
            Math.sin(other.sample.rotation) *
            this.plasmaVentAcceleration *
            elapsed;
        }
        for (const kick of kicks) {
          if (beforeKick ? kick.offset < at - 1e-9 : kick.offset <= at + 1e-9) {
            vx -= Math.cos(kick.angle) * this.plasmaKickVelocity;
            vy -= Math.sin(kick.angle) * this.plasmaKickVelocity;
          }
        }
        return plasmaVentOutlets(sample, vent.mount).map((port) => ({
          x: port.x,
          y: port.y,
          vx: vx + Math.cos(port.angle) * PLASMA_RIFLE.ventExhaustSpeed,
          vy: vy + Math.sin(port.angle) * PLASMA_RIFLE.ventExhaustSpeed,
        })) as PlasmaVentEvent["outlets"];
      };
      const end = vent.start + vent.duration;
      const cuts: number[] = [];
      for (const kick of kicks)
        if (kick.offset > vent.start + 1e-9 && kick.offset < end - 1e-9)
          cuts.push(kick.offset);
      if (!cuts.length) {
        this.plasmaVentArea.emit(
          vent.mount.key,
          this.time - dt + vent.start,
          vent.duration,
          sampleOutlets(vent.startSample, vent.start),
          sampleOutlets(vent.endSample, end, true),
        );
      } else {
        cuts.sort((a, b) => a - b);
        const poseAt = (at: number) => {
          const f = (at - vent.start) / vent.duration;
          return {
            pos: new Vec2(
              vent.startSample.pos.x +
                (vent.endSample.pos.x - vent.startSample.pos.x) * f,
              vent.startSample.pos.y +
                (vent.endSample.pos.y - vent.startSample.pos.y) * f,
            ),
            rotation:
              vent.startSample.rotation +
              angleDifference(
                vent.endSample.rotation,
                vent.startSample.rotation,
              ) *
                f,
          };
        };
        let begin = vent.start;
        for (const next of [...cuts, end]) {
          if (next - begin <= 1e-9) continue;
          this.plasmaVentArea.emit(
            vent.mount.key,
            this.time - dt + begin,
            next - begin,
            sampleOutlets(poseAt(begin), begin),
            sampleOutlets(poseAt(next), next, true),
          );
          begin = next;
        }
      }
      const midpoint = vent.start + vent.duration / 2;
      const time = this.time - dt + midpoint + this.presentationTimeOffset;
      while (
        this.plasmaVentEvents.length &&
        this.plasmaVentEvents[0].time < time - 0.5
      )
        this.plasmaVentEvents.shift();
      if (this.plasmaVentEvents.length >= 512) this.plasmaVentEvents.shift();
      this.plasmaVentEvents.push({
        id: ++this.plasmaVentSequence,
        mountKey: vent.mount.key,
        time,
        duration: vent.duration,
        intensity: vent.intensity,
        outlets: sampleOutlets(vent.sample, midpoint),
      });
    }
    for (const release of kicks) {
      for (const earlier of kicks) {
        if (earlier.offset < release.offset - 1e-9) {
          release.head.vx -= Math.cos(earlier.angle) * this.plasmaKickVelocity;
          release.head.vy -= Math.sin(earlier.angle) * this.plasmaKickVelocity;
        }
      }
    }
    // A different mount may release during the same substep. Its inherited
    // drift includes only the vent impulse already delivered at that instant.
    for (const head of this.plasmaStreams) {
      if (head.age !== 0 || head.launchTime < this.time - dt - 1e-9) continue;
      const launchOffset = head.launchTime - (this.time - dt);
      for (const vent of vents) {
        const elapsed = Math.max(
          0,
          Math.min(vent.duration, launchOffset - vent.start),
        );
        head.vx -=
          Math.cos(vent.sample.rotation) *
          this.plasmaVentAcceleration *
          elapsed;
        head.vy -=
          Math.sin(vent.sample.rotation) *
          this.plasmaVentAcceleration *
          elapsed;
      }
    }
    for (const kick of kicks) {
      ship.vel.x -= Math.cos(kick.angle) * this.plasmaKickVelocity;
      ship.vel.y -= Math.sin(kick.angle) * this.plasmaKickVelocity;
    }
    for (const vent of vents) {
      ship.vel.x -=
        Math.cos(vent.sample.rotation) *
        this.plasmaVentAcceleration *
        vent.duration;
      ship.vel.y -=
        Math.sin(vent.sample.rotation) *
        this.plasmaVentAcceleration *
        vent.duration;
    }
  }
  /**
   * Defence draws first, then guns draw in fitted mount order. Each mount acts
   * on the power and physical contacts left by earlier shots, using the fleet
   * acquisition captured at the beginning of this substep.
   */
  private fireWeapons(
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    planets: readonly Planet[],
    acquisition: WeaponAcquisition,
    previousShip: { x: number; y: number; rotation: number } | undefined,
    allowFire: boolean,
  ) {
    let turretsFunded = true;
    for (const weapon of this.weapons)
      if (weapon.kind === "plasma-rifle") {
        const target = acquisition.targets.get(weapon);
        weapon.target = target?.id ?? null;
        weapon.targetPoint = target ? { x: target.x, y: target.y } : null;
      } else if (weapon.kind === "ion-point-defence")
        turretsFunded = this.firePointDefence(
          weapon,
          turretsFunded,
          dt,
          ship,
          star,
          resources,
          planets,
          acquisition,
          allowFire,
        );
      else if (weapon.kind === "laser")
        this.fireRailOrLaser(
          weapon,
          dt,
          ship,
          star,
          resources,
          planets,
          acquisition,
          allowFire,
        );
    let cannonsFunded = true;
    const vents: PendingPlasmaVent[] = [];
    const kicks: PendingPlasmaKick[] = [];
    for (const weapon of this.weapons)
      if (weapon.kind === "light-ion-cannon") {
        if (
          allowFire &&
          cannonsFunded &&
          acquisition.cannon &&
          this.time + 1e-9 >= weapon.readyAt
        )
          cannonsFunded = this.fireIonCannon(
            weapon,
            ship,
            star,
            resources,
            planets,
          );
      } else if (weapon.kind === "plasma-rifle") {
        this.advancePlasma(
          weapon,
          dt,
          resources,
          ship,
          previousShip,
          vents,
          kicks,
          allowFire,
        );
      } else if (weapon.kind === "drone-launcher") {
        const target = acquisition.targets.get(weapon);
        weapon.target = target?.id ?? null;
        if (
          target &&
          allowFire &&
          this.time + 1e-9 >= weapon.readyAt &&
          canFire(resources, DRONE_LAUNCHER.energy) &&
          this.launchDrone?.(ship, weapon, target.id)
        ) {
          payShot(resources, DRONE_LAUNCHER.energy);
          this.energySpent += DRONE_LAUNCHER.energy;
          weapon.readyAt = this.time + DRONE_LAUNCHER.cooldown;
        }
      } else if (weapon.kind === "rail")
        this.fireRailOrLaser(
          weapon,
          dt,
          ship,
          star,
          resources,
          planets,
          acquisition,
          allowFire,
        );
    if (vents.length || kicks.length)
      this.resolvePlasmaForces(ship, dt, vents, kicks);
  }
  /** Laser and rail keep their own acquisition; the shared energy floor gates the shot. */
  private fireRailOrLaser(
    weapon: WeaponState,
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    planets: readonly Planet[],
    acquisition: WeaponAcquisition,
    allowFire: boolean,
  ) {
    if (weapon.kind !== "rail" && weapon.kind !== "laser") return;
    const config = WEAPONS[weapon.kind];
    let target: Pick<SalvageBody, "id" | "x" | "y"> | undefined;
    if (weapon.kind === "laser") {
      target = acquisition.targets.get(weapon);
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
      !allowFire ||
      this.time + 1e-9 < weapon.readyAt ||
      !canFire(resources, config.energy)
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
      for (const body of this.weaponBodies) {
        if (
          !this.contactEligible(body) ||
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
      const contactStarted = this.targetingMetrics ? performance.now() : 0;
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
      for (const body of this.weaponBodies) {
        if (
          !this.contactEligible(body) ||
          body.kind === "cell" ||
          body.hull <= 0
        )
          continue;
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
      if (this.targetingMetrics)
        this.targetingMetrics.contactMs += performance.now() - contactStarted;
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
    payShot(resources, config.energy);
    this.energySpent += config.energy;
  }

  /** Advance surviving heads even when their emitter has been destroyed. */
  stepPlasmaStreams(
    dt: number,
    star: Star,
    planets: readonly Planet[],
    roster: readonly SalvageBody[],
    shooterId?: number,
  ) {
    this.time += dt;
    this.plasmaContactEvents.length = 0;
    this.plasmaBurstEvents.length = 0;
    const births = new Map<SalvageBody, number>();
    this.sweepPlasmaStreams(
      dt,
      star,
      planets,
      roster,
      shooterId,
      false,
      undefined,
      births,
    );
    this.sweepVentAreas(dt, roster, shooterId, false, undefined, births);
  }
  private plasmaVisual(
    event:
      | Omit<Extract<PlasmaVisualEvent, { kind: "segment" }>, "id">
      | Omit<Extract<PlasmaVisualEvent, { kind: "impact" }>, "id">
      | Omit<Extract<PlasmaVisualEvent, { kind: "absorb" }>, "id">,
  ) {
    if (this.plasmaVisualEvents.length >= 512) this.plasmaVisualEvents.shift();
    this.plasmaVisualEvents.push({ ...event, id: ++this.plasmaVisualSequence });
  }
  private sweepVentAreas(
    dt: number,
    bodies: readonly SalvageBody[],
    shooterId: number | undefined,
    integrated: boolean,
    terminal: ((body: SalvageBody) => number) | undefined,
    births: Map<SalvageBody, number>,
  ) {
    const start = this.time - dt;
    this.plasmaVentArea.sweep(
      start,
      dt,
      bodies,
      shooterId,
      (body, offset, registerNewborn) => {
        const pose = plasmaBodyPose(body, dt, offset, integrated);
        const end = { x: body.x, y: body.y, rotation: body.rotation };
        Object.assign(body, { x: pose.x, y: pose.y, rotation: pose.rotation });
        const oldCount = this.bodies.length;
        this.damage(body, PLASMA_RIFLE.ventDamage, start + offset);
        for (let i = oldCount; i < this.bodies.length; i++) {
          const newborn = this.bodies[i];
          births.set(newborn, offset);
          newborn.previousX = newborn.x - newborn.vx * offset;
          newborn.previousY = newborn.y - newborn.vy * offset;
          newborn.previousRotation =
            newborn.rotation - spinOf(newborn) * offset;
          if (integrated) {
            newborn.x += newborn.vx * (dt - offset);
            newborn.y += newborn.vy * (dt - offset);
            if (newborn.kind !== "cell")
              newborn.rotation += spinOf(newborn) * (dt - offset);
          }
          if (newborn.kind !== "cell" && newborn.hull > 0)
            registerNewborn(newborn);
        }
        if (body.hull > 0) Object.assign(body, end);
      },
      (body, offset) => plasmaBodyPose(body, dt, offset, integrated),
      (body) => ({ birth: births.get(body) ?? 0, end: terminal?.(body) ?? dt }),
    );
  }
  private sweepPlasmaStreams(
    dt: number,
    star: Star,
    planets: readonly Planet[],
    bodies: readonly SalvageBody[],
    shooterId?: number,
    integrated = false,
    terminal?: (body: SalvageBody) => number,
    birthOffsets = new Map<SalvageBody, number>(),
  ) {
    const cutoff = this.time + this.presentationTimeOffset - 0.5;
    while (
      this.plasmaVisualEvents.length &&
      this.plasmaVisualEvents[0].time < cutoff
    )
      this.plasmaVisualEvents.shift();
    if (!this.plasmaStreams.length) return;
    const started = this.targetingMetrics ? performance.now() : 0;
    const intervalStart = this.time - dt;
    const plan = (head: PlasmaStream) => {
      const offset = Math.max(0, head.launchTime - intervalStart);
      const horizon = Math.min(
        Math.max(0, dt - offset),
        Math.max(0, PLASMA_RIFLE.streamLifetime - head.age),
      );
      let first = Infinity;
      for (const world of [star, ...planets]) {
        // Planets have advanced to their substep end; recover their previous orbital pose.
        const planet = world === star ? undefined : (world as Planet);
        const previousAngle = planet
          ? planet.orbitAngle - planet.orbitSpeed * dt
          : 0;
        const startX =
          planet && planet.orbitSpeed !== 0
            ? planet.orbitCenter.x +
              planet.orbitRadius * Math.cos(previousAngle)
            : world.pos.x;
        const startY =
          planet && planet.orbitSpeed !== 0
            ? planet.orbitCenter.y +
              planet.orbitRadius * Math.sin(previousAngle)
            : world.pos.y;
        const vx = planet && dt > 0 ? (world.pos.x - startX) / dt : 0;
        const vy = planet && dt > 0 ? (world.pos.y - startY) / dt : 0;
        first = Math.min(
          first,
          contactTime(
            head.x - startX - vx * offset,
            head.y - startY - vy * offset,
            head.vx - vx,
            head.vy - vy,
            world.radius,
            horizon,
          ),
        );
      }
      let hit: SalvageBody | undefined;
      for (const body of bodies) {
        if (body.id === shooterId || body.hull <= 0 || body.kind === "cell")
          continue;
        const begin = Math.max(offset, birthOffsets.get(body) ?? 0);
        const delay = begin - offset;
        if (delay > horizon) continue;
        const pose = plasmaBodyPose(body, dt, begin, integrated);
        const headX = head.x + head.vx * delay,
          headY = head.y + head.vy * delay;
        const remaining = horizon - delay;
        const bx = pose.x,
          by = pose.y,
          bodyVx = pose.vx,
          bodyVy = pose.vy;
        let time: number;
        if (body.kind === "ship") {
          time = contactTime(
            headX - bx,
            headY - by,
            head.vx - bodyVx,
            head.vy - bodyVy,
            body.radius,
            remaining,
          );
        } else {
          const shape = {
            kind: body.kind,
            x: bx,
            y: by,
            rotation: pose.rotation,
            shardIndex: body.shardIndex ?? 0,
            releasedMask: body.releasedMask ?? 0,
          };
          const vx = head.vx - bodyVx,
            vy = head.vy - bodyVy;
          time = Number.isFinite(
            contactTime(
              headX - bx,
              headY - by,
              vx,
              vy,
              getDerelictRadius(shape),
              remaining,
            ),
          )
            ? (castDerelict(
                shape,
                { x: headX, y: headY },
                { x: vx, y: vy },
                0,
                remaining,
                spinOf(body),
              )?.time ?? Infinity)
            : Infinity;
        }
        time += delay;
        if (time + offset >= (terminal?.(body) ?? Infinity)) continue;
        if (time < first || (hit && time === first && body.id < hit.id)) {
          first = time;
          hit = body;
        }
      }
      return {
        head,
        offset,
        horizon,
        first,
        hit,
        eventTime: offset + Math.min(horizon, first),
      };
    };
    const pending = [...this.plasmaStreams];
    const survivors: PlasmaStream[] = [];
    while (pending.length) {
      let chosenIndex = 0;
      let chosen = plan(pending[0]);
      for (let i = 1; i < pending.length; i++) {
        const candidate = plan(pending[i]);
        if (candidate.eventTime < chosen.eventTime) {
          chosen = candidate;
          chosenIndex = i;
        }
      }
      pending.splice(chosenIndex, 1);
      const { head, offset, horizon, first, hit } = chosen;
      const elapsed = Math.min(horizon, first);
      const fromX = head.x,
        fromY = head.y;
      head.x += head.vx * elapsed;
      head.y += head.vy * elapsed;
      head.age += elapsed;
      const visualTime =
        intervalStart + offset + elapsed + this.presentationTimeOffset;
      if (elapsed > 0)
        this.plasmaVisual({
          kind: "segment",
          originX: head.originX,
          originY: head.originY,
          time: visualTime,
          x: fromX,
          y: fromY,
          endX: head.x,
          endY: head.y,
        });
      const reachedEnd =
        first === Infinity && head.age >= PLASMA_RIFLE.streamLifetime - 1e-9;
      if (hit || reachedEnd) {
        const outcome = hit ? "material" : "airburst";
        const time = intervalStart + offset + elapsed;
        this.plasmaVisual({
          kind: "impact",
          outcome,
          originX: head.originX,
          originY: head.originY,
          time: visualTime,
          x: head.x,
          y: head.y,
        });
        const burst = PlasmaBurstSchema.parse({
          mountKey: head.mountKey,
          outcome,
          bodyId: hit?.id ?? null,
          x: head.x,
          y: head.y,
          time,
        });
        this.plasmaBurstEvents.push(burst);
        if (hit) {
          const contact = PlasmaContactSchema.parse({
            mountKey: head.mountKey,
            bodyId: hit.id,
            x: head.x,
            y: head.y,
            time,
          });
          this.lastPlasmaContact = contact;
          this.plasmaContactEvents.push(contact);
          this.plasmaContacts++;
        } else this.plasmaAirbursts++;
        // Snapshot recipients and their contact-time poses before any breakup.
        const recipients: {
          body: SalvageBody;
          x: number;
          y: number;
          rotation: number;
          damage: number;
        }[] = [];
        const burstOffset = offset + elapsed;
        for (const body of bodies) {
          if (
            body.id === shooterId ||
            body.hull <= 0 ||
            body.kind === "cell" ||
            burstOffset < (birthOffsets.get(body) ?? 0) ||
            burstOffset >= (terminal?.(body) ?? Infinity)
          )
            continue;
          const { x, y, rotation } = plasmaBodyPose(
            body,
            dt,
            burstOffset,
            integrated,
          );
          const centre = Math.hypot(x - head.x, y - head.y);
          let distance: number;
          if (body.kind === "ship")
            distance = Math.max(0, centre - body.radius);
          else {
            const shape = {
              kind: body.kind,
              x,
              y,
              rotation,
              shardIndex: body.shardIndex ?? 0,
              releasedMask: body.releasedMask ?? 0,
            };
            const outerRadius = PLASMA_RIFLE.blastBands[2].radius;
            if (centre - getDerelictRadius(shape) > outerRadius) continue;
            distance = derelictClosestPoint(shape, head, outerRadius).distance;
          }
          const band = PLASMA_RIFLE.blastBands.find(
            (candidate) => distance <= candidate.radius + 1e-9,
          );
          if (band)
            recipients.push({ body, x, y, rotation, damage: band.damage });
        }
        for (const recipient of recipients) {
          const body = recipient.body;
          const end = { x: body.x, y: body.y, rotation: body.rotation };
          body.x = recipient.x;
          body.y = recipient.y;
          body.rotation = recipient.rotation;
          const oldCount = this.bodies.length;
          this.damage(body, recipient.damage, time);
          for (let i = oldCount; i < this.bodies.length; i++) {
            const newborn = this.bodies[i];
            birthOffsets.set(newborn, burstOffset);
            newborn.previousX = newborn.x - newborn.vx * burstOffset;
            newborn.previousY = newborn.y - newborn.vy * burstOffset;
            newborn.previousRotation =
              newborn.rotation - spinOf(newborn) * burstOffset;
            if (integrated) {
              const remaining = dt - burstOffset;
              newborn.x += newborn.vx * remaining;
              newborn.y += newborn.vy * remaining;
              if (newborn.kind !== "cell")
                newborn.rotation += spinOf(newborn) * remaining;
            }
          }
          if (body.hull > 0) Object.assign(body, end);
        }
      } else if (first !== Infinity) {
        this.plasmaVisual({
          kind: "absorb",
          originX: head.originX,
          originY: head.originY,
          time: visualTime,
          x: head.x,
          y: head.y,
        });
      }
      if (first === Infinity && head.age < PLASMA_RIFLE.streamLifetime - 1e-9)
        survivors.push(head);
    }
    this.plasmaStreams = survivors;
    if (this.targetingMetrics)
      this.targetingMetrics.contactMs += performance.now() - started;
  }
  /** Whether this substep needs encounter bodies for acquisition or a shot. */
  needsWeaponRoster(dt: number) {
    return (
      this.shots.length > 0 ||
      this.plasmaStreams.length > 0 ||
      this.weapons.some(
        (weapon) =>
          weapon.kind === "ion-point-defence" ||
          weapon.kind === "laser" ||
          weapon.kind === "plasma-rifle" ||
          this.time + dt + 1e-9 >= weapon.readyAt,
      )
    );
  }
  /** Runs this ship's normal weapon pipeline against shared live contacts. */
  stepWeapons(
    dt: number,
    ship: GameObject,
    star: Star,
    resources: Resources,
    _capacity: number,
    planets: readonly Planet[],
    targets: SalvageBody | readonly SalvageBody[],
    aimTargets?: readonly SalvageBody[],
    policy?: { shooterId: number; aimId?: number },
    acquisition?: WeaponAcquisition,
    previousShip?: { x: number; y: number; rotation: number },
    allowFire = true,
  ) {
    const targetList = Array.isArray(targets) ? targets : [targets];
    this.time += dt;
    this.plasmaContactEvents.length = 0;
    this.plasmaBurstEvents.length = 0;
    this.events = this.events.filter((event) => this.time - event.time <= 0.2);
    const ownsBodies = this.bodies.length > 0;
    const rosterOffset = this.bodies.length;
    if (ownsBodies) this.bodies.push(...targetList);
    this.activeBodies = ownsBodies ? this.bodies : targetList;
    this.aimingBodies = aimTargets ?? null;
    this.shooterId = policy?.shooterId ?? null;
    this.aimId = policy?.aimId ?? null;
    try {
      const selected =
        acquisition ??
        acquireFleetTargets(
          this.weaponBodies,
          [
            {
              system: this,
              ship,
              shooterId: policy?.shooterId,
              aimId: policy?.aimId,
              aimTargets,
            },
          ],
          star,
          planets,
          0,
          this.targetingMetrics,
        ).get(this);
      if (!selected) throw new Error("Missing weapon acquisition");
      this.fireWeapons(
        dt,
        ship,
        star,
        resources,
        planets,
        selected,
        previousShip,
        allowFire,
      );
      const births = new Map<SalvageBody, number>();
      this.sweepPlasmaStreams(
        dt,
        star,
        planets,
        this.weaponBodies,
        policy?.shooterId,
        false,
        undefined,
        births,
      );
      this.sweepVentAreas(
        dt,
        this.weaponBodies,
        policy?.shooterId,
        false,
        undefined,
        births,
      );
      this.activeBodies = null;

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
          if (!this.contactEligible(target) || target.hull <= 0) continue;
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
    } finally {
      this.aimingBodies = null;
      this.activeBodies = null;
      if (ownsBodies) this.bodies.splice(rosterOffset, targetList.length);
      this.shooterId = null;
      this.aimId = null;
    }
  }

  /** Apply arrivals and immediate world losses before any ship acquires targets.
   * The returned cohort also determines which salvage bodies move this substep. */
  prepareEncounter(dt: number, star: Star, planets: readonly Planet[]) {
    const endTime = this.time + dt;
    this.plasmaContactEvents.length = 0;
    this.plasmaBurstEvents.length = 0;
    this.events = this.events.filter(
      (event) =>
        endTime - event.time <=
        (event.kind === "energy-release" ? DERELICT_RELEASE_CUE.duration : 0.2),
    );
    while (endTime + 1e-9 >= this.nextPass) {
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
        this.destroy(body, "environment", endTime);
    }
    return existingBodies;
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
    previousRotation = ship.rotation,
    hostile?: SalvageBody,
    allowFire = true,
    options?: {
      extraBodies: readonly SalvageBody[];
      shooterId: number;
      acquisition?: WeaponAcquisition;
      preparedBodies?: Set<SalvageBody>;
    },
  ) {
    const existingBodies =
      options?.preparedBodies ?? this.prepareEncounter(dt, star, planets);
    this.time += dt;
    const hazards = [star, ...planets];
    // Live ships participate in weapons queries only. Their flight and ram
    // contacts are advanced by the opponent simulation.
    const hostileIndex = this.bodies.length;
    const contacts = options?.extraBodies;
    if (hostile) this.bodies.push(hostile);
    if (contacts?.length) this.bodies.push(...contacts);
    this.shooterId = options?.shooterId ?? null;
    const acquisition =
      options?.acquisition ??
      acquireFleetTargets(
        this.bodies,
        [{ system: this, ship, shooterId: options?.shooterId }],
        star,
        planets,
        0,
        this.targetingMetrics,
      ).get(this);
    if (!acquisition) throw new Error("Missing weapon acquisition");
    this.fireWeapons(
      dt,
      ship,
      star,
      resources,
      planets,
      acquisition,
      {
        x: wrapped ? ship.pos.x : previousX,
        y: wrapped ? ship.pos.y : previousY,
        rotation: previousRotation,
      },
      allowFire,
    );
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

    const births = new Map<SalvageBody, number>();
    const bodyEnd = (body: SalvageBody) =>
      existingBodies.has(body)
        ? Math.min(terminal(body).time, shipTime(body))
        : Infinity;
    this.sweepPlasmaStreams(
      dt,
      star,
      planets,
      this.bodies,
      options?.shooterId,
      true,
      bodyEnd,
      births,
    );
    this.sweepVentAreas(
      dt,
      this.bodies,
      options?.shooterId,
      true,
      bodyEnd,
      births,
    );

    this.shooterId = null;
    const externalCount = Number(!!hostile) + (contacts?.length ?? 0);
    const external = externalCount
      ? this.bodies.splice(hostileIndex, externalCount)
      : null;
    const shotTargets =
      external && this.shots.length
        ? [
            ...existingBodies,
            ...external.filter((body) => body.id !== options?.shooterId),
          ]
        : existingBodies;
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
      for (const body of shotTargets) {
        if (
          !this.contactEligible(body) ||
          body.kind === "cell" ||
          body.hull <= 0
        )
          continue;
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
          (!existingBodies.has(body) ||
            (time < terminal(body).time && time < shipTime(body)))
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
