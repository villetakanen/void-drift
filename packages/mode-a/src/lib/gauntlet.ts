import {
  ENGINE_CUTOFF,
  EnginePlume,
  type GameObject,
  type Planet,
  type PlumeEmitter,
  type Resources,
  type Star,
  updatePlanetOrbit,
  updateShip,
  Vec2,
} from "@void-drift/core";
import type { z } from "zod";
import { applyBuildEngines, buildDrain, solarCharge } from "./build-flight";
import { buildCollisionRadius, buildPlumeEmitters } from "./build-renderer";
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

export type GauntletLifecycle = z.infer<typeof GauntletLifecycleSchema>;
export const GAUNTLET_SHIP_CONTACT = { restitution: 0.25, damage: 5 } as const;
export interface GauntletActor {
  id: "pirate-1";
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

/** Shared mounted-actor substep for the player, pirate and scratch prediction. */
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
): MountedStepResult {
  const stats = buildStats(actor.loadout);
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
    (buildDrain(actor.loadout, input, actor.angularMotion.velocity, dt, ion) -
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
  loadout.hull[0] = "ion-point-defence";
  loadout.aft[0] = "light-ion-cannon";
  return LoadoutSchema.parse(loadout);
}

export function createPirate(
  angle: number,
  seed = 1,
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
): GauntletActor {
  const allegiance = GauntletAllegianceSchema.parse("hostile");
  if (allegiance !== "hostile")
    throw new Error("Pirate allegiance schema mismatch");
  const loadout = pirateLoadout();
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
    id: GauntletActorIdSchema.parse("pirate-1"),
    allegiance,
    lifecycle: GauntletLifecycleSchema.parse("arriving"),
    ship,
    loadout,
    resources: { hull: 100, power: buildStats(loadout).capacity },
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

/** One mounted-build flight substep, shared by the pirate and its scratch rollouts. */
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
  );
}

function angleDifference(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

const COMMANDS: readonly PilotCommand[] = [
  { leftThruster: false, rightThruster: false, fire: false },
  { leftThruster: true, rightThruster: false, fire: false },
  { leftThruster: false, rightThruster: true, fire: false },
  { leftThruster: true, rightThruster: true, fire: false },
];
const CANDIDATE_SEQUENCES: readonly (readonly [PilotCommand, PilotCommand])[] =
  [
    [COMMANDS[0], COMMANDS[3]],
    [COMMANDS[1], COMMANDS[3]],
    [COMMANDS[2], COMMANDS[3]],
    [COMMANDS[3], COMMANDS[3]],
  ];

export interface PiratePilotPlan {
  command: PilotCommand;
  horizonSeconds: number;
  candidateCount: number;
  score: number;
  path: Array<{ x: number; y: number }>;
}

/** Twelve deterministic 1.2s command-sequence rollouts; only each first command is executed. */
export function planPirate(
  actor: GauntletActor,
  target: GameObject,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
) {
  const predictionHorizon = 1.2;
  const predictedTarget = {
    pos: {
      x: target.pos.x + target.vel.x * predictionHorizon,
      y: target.pos.y + target.vel.y * predictionHorizon,
    },
  };
  let best: PiratePilotPlan = {
    command: COMMANDS[0],
    horizonSeconds: predictionHorizon,
    candidateCount: CANDIDATE_SEQUENCES.length,
    score: Infinity,
    path: [],
  };
  let bestScore = Infinity;
  for (let index = 0; index < CANDIDATE_SEQUENCES.length; index++) {
    const [firstCommand, secondCommand] = CANDIDATE_SEQUENCES[index];
    const candidate: GauntletActor = {
      ...actor,
      ship: {
        ...actor.ship,
        pos: new Vec2(actor.ship.pos.x, actor.ship.pos.y),
        vel: new Vec2(actor.ship.vel.x, actor.ship.vel.y),
        acc: new Vec2(actor.ship.acc.x, actor.ship.acc.y),
      },
      resources: { ...actor.resources },
      engineTimers: { ...actor.engineTimers },
      angularMotion: { ...actor.angularMotion },
    };
    const scratchPlanets = planets.map((planet) => ({
      ...planet,
      pos: new Vec2(planet.pos.x, planet.pos.y),
      orbitCenter: new Vec2(planet.orbitCenter.x, planet.orbitCenter.y),
      massWell: planet.massWell ? { ...planet.massWell } : undefined,
      well: planet.well ? { ...planet.well } : undefined,
    }));
    const path = [{ x: candidate.ship.pos.x, y: candidate.ship.pos.y }];
    let minHazardClearance = Infinity;
    let rolloutStep = 0;
    for (let tick = 0; tick < 72; tick++) {
      for (let substep = 0; substep < 4; substep++) {
        if (rolloutStep++ > 0)
          for (const planet of scratchPlanets)
            updatePlanetOrbit(planet, 1 / 240);
        stepGauntletActor(
          candidate,
          tick < 18 ? firstCommand : secondCommand,
          1 / 240,
          star,
          scratchPlanets,
          ion,
        );
      }
      if (tick % 12 === 11)
        path.push({ x: candidate.ship.pos.x, y: candidate.ship.pos.y });
      minHazardClearance = Math.min(
        minHazardClearance,
        Math.hypot(
          candidate.ship.pos.x - star.pos.x,
          candidate.ship.pos.y - star.pos.y,
        ) -
          star.radius -
          candidate.ship.radius,
      );
      for (const planet of scratchPlanets)
        minHazardClearance = Math.min(
          minHazardClearance,
          Math.hypot(
            candidate.ship.pos.x - planet.pos.x,
            candidate.ship.pos.y - planet.pos.y,
          ) -
            planet.radius -
            candidate.ship.radius,
        );
    }
    const dx = predictedTarget.pos.x - candidate.ship.pos.x;
    const dy = predictedTarget.pos.y - candidate.ship.pos.y;
    const distance = Math.hypot(dx, dy);
    const bearing = Math.atan2(dy, dx);
    const alignment = Math.abs(
      angleDifference(bearing, candidate.ship.rotation),
    );
    const relativeSpeed = Math.hypot(
      candidate.ship.vel.x - target.vel.x,
      candidate.ship.vel.y - target.vel.y,
    );
    const score =
      distance +
      Math.max(0, 145 - distance) * 3 +
      alignment * 60 +
      Math.max(0, 55 - minHazardClearance) * 12 +
      relativeSpeed * 0.15 +
      (actor.resources.power - candidate.resources.power) * 0.4 +
      Number(firstCommand !== secondCommand) * 2;
    if (score < bestScore) {
      bestScore = score;
      best = {
        command: firstCommand,
        horizonSeconds: predictionHorizon,
        candidateCount: CANDIDATE_SEQUENCES.length,
        score,
        path,
      };
    }
  }
  return best;
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
