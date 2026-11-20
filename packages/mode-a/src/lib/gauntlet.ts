import {
  ENGINE_CUTOFF,
  EnginePlume,
  type GameObject,
  type Planet,
  type PlumeEmitter,
  type Resources,
  type Star,
  updateShip,
  Vec2,
} from "@void-drift/core";
import type { z } from "zod";
import { applyBuildEngines, buildDrain, solarCharge } from "./build-flight";
import { buildCollisionRadius, buildPlumeEmitters } from "./build-renderer";
import {
  EnemyCapabilitiesSchema,
  type EnemyObjective,
  updateEnemyObjectiveForCapacity,
} from "./enemy-ai";
import { gravityCollectionRate, gravitySource } from "./gravity-collection";
import { SalvageSystem, type WeaponEvent, type WeaponState } from "./salvage";
import {
  GauntletActorIdSchema,
  GauntletAllegianceSchema,
  GauntletLifecycleSchema,
} from "./schemas/gauntlet";
import {
  ASSEMBLED_ION_DEFAULTS,
  type AssembledIonSettings,
} from "./schemas/ion";
import {
  buildStats,
  defaultLoadout,
  LIFE_SUPPORT_DRAIN,
  type Loadout,
  LoadoutSchema,
  PARTS,
} from "./schemas/loadout";
import { planScout } from "./scout-pilot";
import { scoutFlightProfile } from "./scout-predictor";

export type GauntletLifecycle = z.infer<typeof GauntletLifecycleSchema>;
export const GAUNTLET_SHIP_CONTACT = { restitution: 0.25, damage: 5 } as const;
export interface GauntletActor {
  id: z.infer<typeof GauntletActorIdSchema>;
  objective: EnemyObjective;
  readonly stats: ReturnType<typeof buildStats>;
  allegiance: "hostile";
  lifecycle: GauntletLifecycle;
  ship: GameObject;
  loadout: Loadout;
  resources: Resources;
  engineTimers: Record<string, number>;
  angularMotion: { velocity: number };
  engineOutput: ReturnType<typeof applyBuildEngines>;
  plume: EnginePlume;
  emitters: PlumeEmitter[];
  weapons: WeaponState[];
  weaponEvents: WeaponEvent[];
  combat: SalvageSystem;
}

export interface MountedActorState {
  ship: GameObject;
  loadout: Loadout;
  resources: Resources;
  engineTimers: Record<string, number>;
  angularMotion: { velocity: number };
  engineOutput: ReturnType<typeof applyBuildEngines>;
}

export interface MountedStepResult {
  solarCollected: number;
  collected: number;
  gravityDirection?: number;
}

/** Shared mounted-actor substep for the player and enemy ships. */
export function stepMountedActor(
  actor: MountedActorState,
  input: { leftThruster: boolean; rightThruster: boolean; fire: boolean },
  dt: number,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
  profile = { thrustMultiplier: 1, turnMultiplier: 1, hullMultiplier: 1 },
  practice = false,
  parts: typeof PARTS = PARTS,
  advancePlanets = true,
  stats = buildStats(actor.loadout),
): MountedStepResult {
  const distance = Math.hypot(
    actor.ship.pos.x - star.pos.x,
    actor.ship.pos.y - star.pos.y,
  );
  const solar = solarCharge(distance, star, stats.coils);
  const supplied = actor.resources.power + (solar - LIFE_SUPPORT_DRAIN) * dt;
  const source = gravitySource(actor.ship, planets);
  const gravityDirection = source
    ? Math.atan2(
        actor.ship.pos.y - source.pos.y,
        actor.ship.pos.x - source.pos.x,
      )
    : undefined;
  const collected = source
    ? Math.max(
        0,
        Math.min(
          stats.capacity - supplied,
          gravityCollectionRate(actor.loadout) * dt,
        ),
      )
    : 0;
  const available = practice
    ? stats.capacity
    : Math.max(0, Math.min(stats.capacity, supplied + collected));
  const requested = Math.max(
    0,
    (buildDrain(
      actor.loadout,
      input,
      actor.angularMotion.velocity,
      dt,
      ion,
      1,
      stats.mass,
    ) -
      LIFE_SUPPORT_DRAIN) *
      dt,
  );
  const spent = practice ? requested : Math.min(available, requested);
  const fraction = practice ? 1 : requested > 0 ? spent / requested : 0;
  actor.resources.power = practice ? stats.capacity : available - spent;
  actor.engineOutput = applyBuildEngines(
    actor.ship,
    actor.loadout,
    input,
    dt,
    fraction > 0,
    actor.engineTimers,
    fraction,
    actor.angularMotion,
    ion,
    parts,
    parts === PARTS ? stats : undefined,
  );
  updateShip(
    actor.ship,
    { leftThruster: false, rightThruster: false, fire: false },
    dt,
    1920,
    1080,
    star,
    planets,
    actor.resources,
    undefined,
    profile,
    { drag: 0, speedLimit: null },
    "inverse-square",
    600,
    ENGINE_CUTOFF,
    advancePlanets,
  );
  return {
    solarCollected: solar * dt,
    collected,
    ...(gravityDirection === undefined ? {} : { gravityDirection }),
  };
}

export function pirateLoadout(): Loadout {
  const loadout = defaultLoadout("scout");
  loadout.side = "ion";
  loadout.hull[0] = "plasma-rifle";
  loadout.aft[0] = "light-ion-cannon";
  return LoadoutSchema.parse(loadout);
}

export function createPirate(
  angle: number,
  seed = 1,
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
  id: GauntletActor["id"] = "pirate-1",
): GauntletActor {
  const allegiance = GauntletAllegianceSchema.parse("hostile");
  if (allegiance !== "hostile")
    throw new Error("Pirate allegiance schema mismatch");
  const loadout = pirateLoadout();
  const { stats } = scoutFlightProfile(loadout, ion);
  const radius = buildCollisionRadius(loadout);
  const emitters = buildPlumeEmitters(loadout);
  const combat = new SalvageSystem(loadout, seed, ion);
  const ship: GameObject = {
    pos: new Vec2(960 + 1180 * Math.cos(angle), 540 + 1180 * Math.sin(angle)),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: angle + Math.PI + Math.PI / 6,
    radius,
  };
  ship.vel.set(600 * Math.cos(ship.rotation), 600 * Math.sin(ship.rotation));
  return {
    id: GauntletActorIdSchema.parse(id),
    objective: "pursue",
    get stats() {
      return scoutFlightProfile(this.loadout, ion).stats;
    },
    allegiance,
    lifecycle: GauntletLifecycleSchema.parse("arriving"),
    ship,
    loadout,
    resources: { hull: 100, power: stats.capacity },
    engineTimers: {},
    angularMotion: { velocity: 0 },
    engineOutput: { left: 0, right: 0, aft: [0], stabilizers: [0, 0] },
    plume: new EnginePlume(),
    emitters,
    weapons: combat.weapons,
    weaponEvents: [],
    combat,
  };
}

export type PilotCommand = {
  leftThruster: boolean;
  rightThruster: boolean;
  fire: false;
};
export const NO_PILOT_COMMAND: PilotCommand = {
  leftThruster: false,
  rightThruster: false,
  fire: false,
};

/** One live enemy flight substep; the simulation owns the planetary clock. */
export function stepGauntletActor(
  actor: GauntletActor,
  input: PilotCommand,
  dt: number,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
) {
  stepMountedActor(
    actor,
    input,
    dt,
    star,
    planets,
    ion,
    undefined,
    false,
    PARTS,
    false,
    scoutFlightProfile(actor.loadout, ion).stats,
  );
}

const scoutCapabilities = EnemyCapabilitiesSchema.parse({
  solarRecovery: true,
});

export function updateEnemyObjective(actor: GauntletActor) {
  return updateEnemyObjectiveForCapacity(
    actor,
    actor.stats.capacity,
    scoutCapabilities.solarRecovery,
  );
}

export interface PiratePilotPlan {
  command: PilotCommand;
  horizonSeconds: number;
  candidateCount: number;
  score: number;
  path: Array<{ x: number; y: number }>;
}

/** Gauntlet supplies the Scout pilot with its actor and current target. */
export function planPirate(
  actor: GauntletActor,
  target: GameObject,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
): PiratePilotPlan {
  return planScout(actor, target, star, planets, ion);
}

export function planPirateCommand(
  actor: GauntletActor,
  target: GameObject,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
) {
  return planPirate(actor, target, star, planets, ion).command;
}
