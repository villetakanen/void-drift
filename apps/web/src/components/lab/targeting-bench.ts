import {
  buildCollisionRadius,
  buildStats,
  createPirate,
  defaultLoadout,
  LoadoutSchema,
  liveShipBody,
  SalvageSystem,
  Simulation,
  STEP,
  stockSettings,
  type TargetingMetrics,
  weaponPose,
} from "@void-drift/mode-a";

export type TargetingWeapon =
  | "light-ion-cannon"
  | "ion-point-defence"
  | "laser";
export type TargetingMode = "sustained" | "live";
export interface TargetingConfig {
  slot1: TargetingWeapon;
  slot2: TargetingWeapon;
  mode: TargetingMode;
}
export const TARGETING_CENTER = { x: 960, y: 540 };
export const TARGETING_RADIUS = 280;
const COUNT = 16;
const ANGULAR_SPEED = 0.16;
const SUBSTEP = STEP / 4;
const WARMUP = 120;
const WINDOW = 600;

type Sample = TargetingMetrics & { combatMs: number; discharges: number };
export interface TargetingSummary {
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
  acquisitionMs: number;
  contactMs: number;
  combatMs: number;
}
function percentile(samples: Sample[], field: keyof Sample) {
  if (!samples.length) return 0;
  const values = samples.map((sample) => sample[field]).sort((a, b) => a - b);
  return values[Math.ceil(values.length * 0.95) - 1];
}

/** Deterministic choreography around the production mounted-weapon pipeline. */
export class TargetingBench {
  readonly sim: Simulation;
  readonly config: TargetingConfig;
  private readonly samples: Sample[] = [];
  private substeps = 0;
  private discharges = 0;
  private readonly counters: TargetingMetrics = {
    bodyVisits: 0,
    comparisons: 0,
    acquisitionMs: 0,
    contactMs: 0,
  };
  constructor(config: TargetingConfig) {
    this.config = config;
    const loadout = defaultLoadout("wasp");
    loadout.hull = [config.slot1, config.slot2];
    const build = LoadoutSchema.parse(loadout);
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
    for (let i = 0; i < COUNT; i++) {
      const actor = createPirate(0, i + 1);
      actor.loadout = LoadoutSchema.parse(build);
      actor.ship.radius = buildCollisionRadius(actor.loadout);
      actor.resources = {
        hull: 100,
        power: buildStats(actor.loadout).capacity,
      };
      actor.combat = new SalvageSystem(actor.loadout, i + 1);
      actor.combat.targetingMetrics = this.counters;
      actor.weapons = actor.combat.weapons;
      actor.lifecycle = "active";
      this.sim.opponents.push(actor);
    }
    this.place(0);
  }
  private place(time: number) {
    for (let i = 0; i < COUNT; i++) {
      const actor = this.sim.opponents[i];
      const angle = (i * Math.PI * 2) / COUNT + time * ANGULAR_SPEED;
      const next = angle + (Math.PI * 2) / COUNT;
      actor.ship.pos.set(
        TARGETING_CENTER.x + TARGETING_RADIUS * Math.cos(angle),
        TARGETING_CENTER.y + TARGETING_RADIUS * Math.sin(angle),
      );
      actor.ship.vel.set(
        -TARGETING_RADIUS * ANGULAR_SPEED * Math.sin(angle),
        TARGETING_RADIUS * ANGULAR_SPEED * Math.cos(angle),
      );
      actor.ship.rotation = Math.atan2(
        Math.sin(next) - Math.sin(angle),
        Math.cos(next) - Math.cos(angle),
      );
    }
  }
  step() {
    for (let sub = 0; sub < 4; sub++) {
      this.place((this.substeps + 1) * SUBSTEP);
      Object.assign(this.counters, {
        bodyVisits: 0,
        comparisons: 0,
        acquisitionMs: 0,
        contactMs: 0,
      });
      let discharges = 0;
      let combatMs = 0;
      const damage = Array<number>(COUNT).fill(0);
      for (let i = 0; i < COUNT; i++) {
        const shooter = this.sim.opponents[i];
        if (shooter.lifecycle === "destroyed") continue;
        const capacity = buildStats(shooter.loadout).capacity;
        if (this.config.mode === "sustained")
          shooter.resources.power = capacity;
        const targets = this.sim.opponents.flatMap((target, index) => {
          if (index === i || target.lifecycle === "destroyed") return [];
          return [
            liveShipBody(
              index + 1,
              target.ship,
              Math.max(0, target.resources.hull - damage[index]),
              (amount) => {
                if (this.config.mode === "live") damage[index] += amount;
              },
            ),
          ];
        });
        const before =
          shooter.combat.ionDischarges +
          shooter.combat.laserPulses +
          shooter.combat.pointDefenceDischarges;
        const start = performance.now();
        shooter.combat.stepWeapons(
          SUBSTEP,
          shooter.ship,
          this.sim.star,
          shooter.resources,
          capacity,
          this.sim.planets,
          targets,
        );
        combatMs += performance.now() - start;
        shooter.weaponEvents = shooter.combat.events;
        discharges +=
          shooter.combat.ionDischarges +
          shooter.combat.laserPulses +
          shooter.combat.pointDefenceDischarges -
          before;
      }
      for (let i = 0; i < COUNT; i++) {
        const target = this.sim.opponents[i];
        target.resources.hull = Math.max(0, target.resources.hull - damage[i]);
        if (target.resources.hull <= 0) target.lifecycle = "destroyed";
      }
      this.discharges += discharges;
      this.substeps++;
      if (this.substeps > WARMUP) {
        this.samples.push({ ...this.counters, combatMs, discharges });
        if (this.samples.length > WINDOW) this.samples.shift();
      }
    }
    this.sim.ticks++;
  }
  get metrics(): TargetingSummary {
    const ships = this.sim.opponents.filter(
      (actor) => actor.lifecycle !== "destroyed",
    ).length;
    return {
      ships,
      mounts: ships * 2,
      discharges: this.discharges,
      samples: this.samples.length,
      warmup: WARMUP,
      window: WINDOW,
      bodyVisits: percentile(this.samples, "bodyVisits"),
      comparisons: percentile(this.samples, "comparisons"),
      bodyVisitsMean:
        this.samples.reduce((sum, sample) => sum + sample.bodyVisits, 0) /
        (this.samples.length || 1),
      comparisonsMean:
        this.samples.reduce((sum, sample) => sum + sample.comparisons, 0) /
        (this.samples.length || 1),
      acquisitionMs: percentile(this.samples, "acquisitionMs"),
      contactMs: percentile(this.samples, "contactMs"),
      combatMs: percentile(this.samples, "combatMs"),
    };
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
                x: pose.x,
                y: pose.y,
                endX: target.ship.pos.x,
                endY: target.ship.pos.y,
              },
            ];
          }),
    );
  }
}
