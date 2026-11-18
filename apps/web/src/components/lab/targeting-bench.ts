import {
  acquireFleetTargets,
  applyBuildEngines,
  buildCollisionRadius,
  buildDrain,
  buildPlumeEmitters,
  buildStats,
  createPirate,
  defaultLoadout,
  LIFE_SUPPORT_DRAIN,
  LoadoutSchema,
  liveShipBody,
  PLASMA_RIFLE,
  SalvageSystem,
  Simulation,
  STEP,
  solarCharge,
  stockSettings,
  type TargetingMetrics,
  weaponPose,
} from "@void-drift/mode-a";

export type TargetingWeapon =
  | "light-ion-cannon"
  | "ion-point-defence"
  | "laser"
  | "plasma-rifle";
export type TargetingMode = "sustained" | "live";
export interface TargetingConfig {
  slot1: TargetingWeapon;
  slot2: TargetingWeapon;
  mode: TargetingMode;
  formation?: "three-loops" | "held-approach";
}
export const TARGETING_CENTER = { x: 960, y: 540 };
// Camera center and full world extent include margin around all three paths.
export const FORMATION_SCALE = 1.8;
export const TARGETING_VIEW = {
  x: 960,
  y: 540,
  width: 1200 * FORMATION_SCALE,
  height: 780 * FORMATION_SCALE,
};
const COUNT = 16;
export const TARGETING_LOOPS = [
  {
    count: 6,
    x: 702,
    y: 489,
    rx: 260,
    ry: 170,
    tilt: (Math.PI * 35) / 180,
    speed: 0.16,
    phase: 0,
    outwardHeading: 0,
  },
  {
    count: 6,
    x: 1194,
    y: 619,
    rx: 226,
    ry: 174,
    tilt: 0,
    speed: -0.13,
    phase: 0.35,
    outwardHeading: 0,
  },
  {
    count: 4,
    x: 1180,
    y: 619,
    rx: 132,
    ry: 132,
    tilt: 0,
    speed: 0.22,
    phase: 0.7,
    outwardHeading: Math.PI / 3,
  },
] as const;
const SUBSTEP = STEP / 4;
const WARMUP = 120;
const WINDOW = 600;

type Sample = TargetingMetrics & {
  combatMs: number;
  discharges: number;
  rosterMs: number;
  rosterBuilds: number;
  adapters: number;
};
export interface TargetingSummary {
  plasmaReleases: number;
  plasmaVents: number;
  plasmaIntervals: {
    short: number;
    sustained: number;
    initial: number;
    ongoing: number;
  };
  ships: number;
  mounts: number;
  discharges: number;
  samples: number;
  warmup: number;
  window: number;
  bodyVisits: number;
  comparisons: number;
  bodyVisitsMean: number;
  comparisonsMean: number;
  activeRequestsMean: number;
  materialTestsMean: number;
  visibilityTestsMean: number;
  acquisitionMs: number;
  contactMs: number;
  acquisitionMsMean: number;
  contactMsMean: number;
  combatMs: number;
  adapterMs: number;
  plumeMs: number;
  rosterMs: number;
  rosterBuildsMean: number;
  adaptersMean: number;
}
function mean(samples: Sample[], field: keyof Sample) {
  return samples.length
    ? samples.reduce((sum, sample) => sum + (sample[field] ?? 0), 0) /
        samples.length
    : 0;
}
function percentile(samples: Sample[], field: keyof Sample) {
  if (!samples.length) return 0;
  const values = samples
    .map((sample) => sample[field] ?? 0)
    .sort((a, b) => a - b);
  return values[Math.ceil(values.length * 0.95) - 1];
}

/** Deterministic choreography around the production mounted-weapon pipeline. */
export class TargetingBench {
  readonly sim: Simulation;
  readonly config: TargetingConfig;
  private readonly fleetStats: ReturnType<typeof buildStats>;
  private readonly samples: Sample[] = [];
  private readonly tickSamples: { adapterMs: number; plumeMs: number }[] = [];
  private readonly plasmaObservers: {
    actor: Simulation["opponents"][number];
    mount: Simulation["opponents"][number]["weapons"][number];
    id: number | null;
    start: number;
  }[] = [];
  private shortIntervals = 0;
  private sustainedIntervals = 0;
  private initialIntervals = 0;
  private substeps = 0;
  private discharges = 0;
  private readonly counters: TargetingMetrics = {
    bodyVisits: 0,
    comparisons: 0,
    activeRequests: 0,
    materialTests: 0,
    visibilityTests: 0,
    acquisitionMs: 0,
    contactMs: 0,
  };
  constructor(config: TargetingConfig) {
    this.config = config;
    const loadout = defaultLoadout("wasp");
    loadout.hull = [config.slot1, config.slot2];
    const build = LoadoutSchema.parse(loadout);
    this.fleetStats = buildStats(build);
    this.sim = new Simulation({
      ...stockSettings("wasp"),
      mode: "gauntlet",
      arrival: false,
      loadout: build,
    });
    this.sim.start();
    this.sim.ship.pos.set(-100000, -100000);
    this.sim.star.pos.set(-100000, -100000);
    this.sim.planets.length = 0;
    this.sim.opponents.length = 0;
    const fleetSize = config.formation === "held-approach" ? 2 : COUNT;
    for (let i = 0; i < fleetSize; i++) {
      const actor = createPirate(0, i + 1);
      actor.loadout = LoadoutSchema.parse(build);
      actor.ship.radius = buildCollisionRadius(actor.loadout);
      actor.emitters = buildPlumeEmitters(actor.loadout);
      actor.resources = {
        hull: 100,
        power: this.fleetStats.capacity,
      };
      actor.combat = new SalvageSystem(actor.loadout, i + 1);
      actor.combat.targetingMetrics = this.counters;
      actor.weapons = actor.combat.weapons;
      actor.lifecycle = "active";
      for (const mount of actor.weapons)
        if (mount.kind === "plasma-rifle")
          this.plasmaObservers.push({ actor, mount, id: null, start: 0 });
      this.sim.opponents.push(actor);
    }
    this.place(0);
  }
  private place(time: number) {
    if (this.config.formation === "held-approach") {
      // Both Wasps move on one orbit. The leader opens and closes the gap
      // while the trailing hull faces the chord. Acquisition still uses each muzzle.
      const radius = 225;
      const bearing = time * 0.18;
      const gap = 0.64 + 0.2 * Math.cos(time * 0.4);
      for (const [index, actor] of this.sim.opponents.entries()) {
        const angle = index === 0 ? bearing : bearing + gap;
        const speed = index === 0 ? 0.18 : 0.18 - 0.08 * Math.sin(time * 0.4);
        actor.ship.pos.set(
          TARGETING_CENTER.x + radius * Math.cos(angle),
          TARGETING_CENTER.y + radius * Math.sin(angle),
        );
        actor.ship.vel.set(
          -radius * speed * Math.sin(angle),
          radius * speed * Math.cos(angle),
        );
        actor.ship.rotation = angle + Math.PI / 2 + (index === 0 ? gap / 2 : 0);
      }
      return;
    }
    let index = 0;
    for (const loop of TARGETING_LOOPS) {
      const cosTilt = Math.cos(loop.tilt),
        sinTilt = Math.sin(loop.tilt);
      for (let i = 0; i < loop.count; i++, index++) {
        const actor = this.sim.opponents[index];
        const angle =
          loop.phase + (i * Math.PI * 2) / loop.count + time * loop.speed;
        const x = loop.rx * Math.cos(angle),
          y = loop.ry * Math.sin(angle);
        const vx = -loop.rx * loop.speed * Math.sin(angle),
          vy = loop.ry * loop.speed * Math.cos(angle);
        actor.ship.pos.set(
          TARGETING_CENTER.x +
            (loop.x - TARGETING_CENTER.x + x * cosTilt - y * sinTilt) *
              FORMATION_SCALE,
          TARGETING_CENTER.y +
            (loop.y - TARGETING_CENTER.y + x * sinTilt + y * cosTilt) *
              FORMATION_SCALE,
        );
        actor.ship.vel.set(
          (vx * cosTilt - vy * sinTilt) * FORMATION_SCALE,
          (vx * sinTilt + vy * cosTilt) * FORMATION_SCALE,
        );
        const tangent = Math.atan2(actor.ship.vel.y, actor.ship.vel.x);
        actor.ship.rotation =
          tangent - Math.sign(loop.speed) * loop.outwardHeading;
      }
    }
  }
  step() {
    const tickStart = performance.now();
    let tickCombatMs = 0;
    for (let sub = 0; sub < 4; sub++) {
      this.place((this.substeps + 1) * SUBSTEP);
      Object.assign(this.counters, {
        bodyVisits: 0,
        comparisons: 0,
        activeRequests: 0,
        materialTests: 0,
        visibilityTests: 0,
        acquisitionMs: 0,
        contactMs: 0,
      });
      let discharges = 0;
      let combatMs = 0;
      const damage = Array<number>(this.sim.opponents.length).fill(0);
      const needsRoster = this.sim.opponents.some(
        (actor) =>
          actor.lifecycle !== "destroyed" &&
          actor.combat.needsWeaponRoster(SUBSTEP),
      );
      const rosterStart = performance.now();
      const roster = needsRoster
        ? this.sim.opponents.flatMap((target, index) => {
            if (target.lifecycle === "destroyed") return [];
            return [
              liveShipBody(
                index + 1,
                target.ship,
                target.resources.hull,
                (amount) => {
                  if (this.config.mode === "live") damage[index] += amount;
                },
              ),
            ];
          })
        : [];
      const rosterMs = needsRoster ? performance.now() - rosterStart : 0;
      const requests = this.sim.opponents.flatMap((actor, index) =>
        actor.lifecycle === "destroyed"
          ? []
          : [{ system: actor.combat, ship: actor.ship, shooterId: index + 1 }],
      );
      const acquisitionStart = performance.now();
      const acquisitions = acquireFleetTargets(
        roster,
        requests,
        this.sim.star,
        this.sim.planets,
        SUBSTEP,
        this.counters,
      );
      combatMs += performance.now() - acquisitionStart;
      for (let i = 0; i < this.sim.opponents.length; i++) {
        const shooter = this.sim.opponents[i];
        if (shooter.lifecycle === "destroyed") continue;
        const { capacity, coils } = this.fleetStats;
        const input = { leftThruster: true, rightThruster: true, fire: false };
        if (this.config.mode === "sustained")
          shooter.resources.power = capacity;
        const distance = Math.hypot(
          shooter.ship.pos.x - this.sim.star.pos.x,
          shooter.ship.pos.y - this.sim.star.pos.y,
        );
        const supplied = Math.max(
          0,
          Math.min(
            capacity,
            shooter.resources.power +
              (solarCharge(distance, this.sim.star, coils) -
                LIFE_SUPPORT_DRAIN) *
                SUBSTEP,
          ),
        );
        const requested =
          Math.max(
            0,
            buildDrain(
              shooter.loadout,
              input,
              shooter.angularMotion.velocity,
              SUBSTEP,
            ) - LIFE_SUPPORT_DRAIN,
          ) * SUBSTEP;
        const spent = Math.min(supplied, requested);
        shooter.resources.power = supplied - spent;
        const fraction = requested > 0 ? spent / requested : 0;
        const rotation = shooter.ship.rotation;
        const vx = shooter.ship.vel.x;
        const vy = shooter.ship.vel.y;
        shooter.engineOutput = applyBuildEngines(
          shooter.ship,
          shooter.loadout,
          input,
          SUBSTEP,
          fraction > 0,
          shooter.engineTimers,
          fraction,
          shooter.angularMotion,
        );
        shooter.ship.vel.set(vx, vy);
        shooter.ship.rotation = rotation;

        const before =
          shooter.combat.ionDischarges +
          shooter.combat.laserPulses +
          shooter.combat.pointDefenceDischarges +
          shooter.combat.plasmaReleases;
        const start = performance.now();
        shooter.combat.stepWeapons(
          SUBSTEP,
          shooter.ship,
          this.sim.star,
          shooter.resources,
          capacity,
          this.sim.planets,
          roster,
          undefined,
          { shooterId: i + 1 },
          acquisitions.get(shooter.combat),
        );
        combatMs += performance.now() - start;
        shooter.weaponEvents = shooter.combat.events;
        discharges +=
          shooter.combat.ionDischarges +
          shooter.combat.laserPulses +
          shooter.combat.pointDefenceDischarges +
          shooter.combat.plasmaReleases -
          before;
      }
      this.observePlasma();
      for (let i = 0; i < this.sim.opponents.length; i++) {
        const target = this.sim.opponents[i];
        target.resources.hull = Math.max(0, target.resources.hull - damage[i]);
        if (target.resources.hull <= 0) target.lifecycle = "destroyed";
      }
      tickCombatMs += combatMs;
      this.discharges += discharges;
      this.substeps++;
      if (this.substeps > WARMUP) {
        this.samples.push({
          ...this.counters,
          combatMs,
          discharges,
          rosterMs,
          rosterBuilds: Number(needsRoster),
          adapters: roster.length,
        });
        if (this.samples.length > WINDOW) this.samples.shift();
      }
    }
    const plumeStart = performance.now();
    for (const actor of this.sim.opponents) {
      if (actor.lifecycle === "destroyed") {
        actor.plume.clear();
        for (const emitter of actor.emitters) emitter.output = 0;
        continue;
      }
      // Choreography supplies motion; show the Wasp’s fitted main engine burning.
      for (const [index, emitter] of actor.emitters.entries())
        emitter.output = index === 0 ? actor.engineOutput.left : 0;
      actor.plume.stepMounted(STEP, actor.ship, actor.emitters);
    }
    const plumeMs = performance.now() - plumeStart;
    this.sim.ticks++;
    if (this.substeps > WARMUP) {
      this.tickSamples.push({
        adapterMs: Math.max(
          0,
          performance.now() - tickStart - tickCombatMs - plumeMs,
        ),
        plumeMs,
      });
      if (this.tickSamples.length > WINDOW / 4) this.tickSamples.shift();
    }
  }
  private observePlasma() {
    for (const observer of this.plasmaObservers) {
      const next =
        observer.actor.lifecycle === "destroyed" ? null : observer.mount.target;
      if (next === observer.id) continue;
      if (observer.id !== null) {
        const duration = (this.substeps - observer.start) * SUBSTEP;
        if (observer.start === 0) this.initialIntervals++;
        else if (duration >= PLASMA_RIFLE.observationSeconds)
          this.sustainedIntervals++;
        else this.shortIntervals++;
      }
      observer.id = next;
      observer.start = this.substeps;
    }
  }
  get metrics(): TargetingSummary {
    const ships = this.sim.opponents.filter(
      (actor) => actor.lifecycle !== "destroyed",
    ).length;
    return {
      ships,
      plasmaReleases: this.sim.opponents.reduce(
        (sum, actor) => sum + actor.combat.plasmaReleases,
        0,
      ),
      plasmaVents: this.sim.opponents.reduce(
        (sum, actor) => sum + actor.combat.plasmaVents,
        0,
      ),
      plasmaIntervals: {
        short: this.shortIntervals,
        sustained: this.sustainedIntervals,
        initial: this.initialIntervals,
        ongoing: this.plasmaObservers.filter((observer) => observer.id !== null)
          .length,
      },
      mounts: ships * 2,
      discharges: this.discharges,
      samples: this.samples.length,
      warmup: WARMUP,
      window: WINDOW,
      bodyVisits: percentile(this.samples, "bodyVisits"),
      comparisons: percentile(this.samples, "comparisons"),
      bodyVisitsMean: mean(this.samples, "bodyVisits"),
      comparisonsMean: mean(this.samples, "comparisons"),
      activeRequestsMean: mean(this.samples, "activeRequests"),
      materialTestsMean: mean(this.samples, "materialTests"),
      visibilityTestsMean: mean(this.samples, "visibilityTests"),
      acquisitionMs: percentile(this.samples, "acquisitionMs"),
      contactMs: percentile(this.samples, "contactMs"),
      acquisitionMsMean: mean(this.samples, "acquisitionMs"),
      contactMsMean: mean(this.samples, "contactMs"),
      adapterMs: this.tickPercentile("adapterMs"),
      plumeMs: this.tickPercentile("plumeMs"),
      rosterMs: percentile(this.samples, "rosterMs"),
      rosterBuildsMean: mean(this.samples, "rosterBuilds"),
      adaptersMean: mean(this.samples, "adapters"),
      combatMs: percentile(this.samples, "combatMs"),
    };
  }
  private tickPercentile(field: "adapterMs" | "plumeMs") {
    if (!this.tickSamples.length) return 0;
    const values = this.tickSamples
      .map((sample) => sample[field])
      .sort((a, b) => a - b);
    return values[Math.ceil(values.length * 0.95) - 1];
  }
  get traces() {
    return this.sim.opponents.flatMap((actor) =>
      actor.lifecycle === "destroyed"
        ? []
        : actor.combat.weapons.flatMap((weapon) => {
            const target =
              weapon.target === null
                ? undefined
                : this.sim.opponents[weapon.target - 1];
            if (!target || target.lifecycle === "destroyed") return [];
            const pose = weaponPose(actor.ship, weapon.mount, weapon.angle);
            return [
              {
                x: weapon.kind === "plasma-rifle" ? pose.muzzleX : pose.x,
                y: weapon.kind === "plasma-rifle" ? pose.muzzleY : pose.y,
                endX: weapon.targetPoint?.x ?? target.ship.pos.x,
                endY: weapon.targetPoint?.y ?? target.ship.pos.y,
              },
            ];
          }),
    );
  }
}
