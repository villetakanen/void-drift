import type {
  GameObject,
  MassWell,
  Planet,
  PlumeEmitter,
  Star,
} from "@void-drift/core";
import {
  CONFIG,
  ENGINE_CUTOFF,
  EnginePlume,
  GravityFlightSchema,
  initializePlanets,
  massWellReach,
  updateHull,
  updatePlanetOrbit,
  updatePower,
  updateShip,
  Vec2,
} from "@void-drift/core";
import { solarCharge } from "./build-flight";
import { buildCollisionRadius, buildPlumeEmitters } from "./build-renderer";
import { SHIP_PROFILE_BY_ID } from "./config";
import { createStar } from "./game-loop";
import {
  createPirate,
  GAUNTLET_SHIP_CONTACT,
  type GauntletActor,
  NO_PILOT_COMMAND,
  type PilotCommand,
  type PiratePilotPlan,
  planPirate,
  stepGauntletActor,
  stepMountedActor,
} from "./gauntlet";
import { GRAVITY_COLLECTION } from "./gravity-collection";
import type { WeaponEvent, WeaponState } from "./salvage";
import {
  contactTime,
  type FlightTickInput,
  liveShipBody,
  SalvageSystem,
} from "./salvage";
import {
  type FlightSettings,
  FlightSettingsSchema,
  ReplaySchema,
} from "./schemas/flight";
import { createInitialGameState } from "./schemas/game-state";
import { type GauntletResult, GauntletResultSchema } from "./schemas/gauntlet";
import type { GravityTuning } from "./schemas/gravity";
import {
  buildStats,
  defaultLoadout,
  PARTS,
  starterLoadout,
} from "./schemas/loadout";
import {
  type DerelictsResult,
  DerelictsResultSchema,
  ENCOUNTER,
  SURVIVAL_ENCOUNTER,
} from "./schemas/salvage";
import type { ShipProfileId } from "./schemas/ship-profile";
import { GRAVITY_TUNING } from "./tuning";
import {
  applyYellowFamilyProfile,
  YELLOW_FAMILY_RADIUS,
  yellowFamilyRadius,
} from "./yellow-star-family";

export const STEP = 1 / 60;
/** Survival score points for each collected derelict energy cell. */
export const CELL_SCORE = 20;
export { CHALLENGE } from "../schemas/highscore";
export const GRAVITY_FLIGHT = GravityFlightSchema.parse({
  engineSpeedScale: 600,
});
/** A configured body's well under the gravity tuning's mass law. */
export function tunedMassWell(
  mass: number,
  tuning: GravityTuning = GRAVITY_TUNING,
): MassWell {
  return { mass, cutoff: tuning.cutoff, falloff: tuning.falloff };
}
/** A configured planet's mass from the tuning file; every configured planet needs one. */
export function planetMass(
  id: string | undefined,
  tuning: GravityTuning = GRAVITY_TUNING,
): number {
  const mass = id === undefined ? undefined : tuning.planetMass[id];
  if (mass === undefined)
    throw new Error(`No mass for planet ${id ?? "(no id)"} in the tuning file`);
  return mass;
}
/** Puts the play sun and configured planets on the mass law. */
export function applyGravityTuning(
  star: Star,
  planets: Planet[],
  tuning: GravityTuning = GRAVITY_TUNING,
) {
  setStarMassWell(star, tunedMassWell(tuning.sunMass, tuning));
  for (const planet of planets)
    planet.massWell = tunedMassWell(planetMass(planet.id, tuning), tuning);
}
/** Gives the star a mass well and makes its reach follow it. */
export function setStarMassWell(star: Star, well: MassWell) {
  star.massWell = well;
  star.influenceRadius = massWellReach(well.mass, well.cutoff, well.falloff);
}
export const CHALLENGE_SEED = 2026;
function arrivalBearing(seed: number) {
  return ((Math.imul(seed, 2654435761) >>> 0) / 4294967296) * Math.PI * 2;
}
export function stockSettings(id: ShipProfileId = "fighter"): FlightSettings {
  return FlightSettingsSchema.parse({
    seed: CHALLENGE_SEED,
    profile: SHIP_PROFILE_BY_ID[id],
    camera: { padding: 160, smoothing: 4, zoomSteps: 5 },
  });
}
export function gameSettings(id: ShipProfileId = "fighter"): FlightSettings {
  return FlightSettingsSchema.parse({
    ...stockSettings(id),
    loadout: starterLoadout(id),
  });
}
export function labSettings(id: ShipProfileId = "fighter"): FlightSettings {
  return FlightSettingsSchema.parse({
    ...stockSettings(id),
    loadout: defaultLoadout(id),
  });
}
export class Simulation {
  solarCollectionRate = 0;
  solarDamageRate = 0;
  readonly settings: FlightSettings;
  readonly ship: GameObject = {
    pos: new Vec2(460, 540),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: -Math.PI / 2,
    radius: CONFIG.SHIP_RADIUS,
  };
  readonly star = createStar("G", 960, 540);
  readonly planets = initializePlanets(960, 540);
  readonly state = createInitialGameState();
  readonly plume = new EnginePlume();
  readonly gravity: GravityTuning = GRAVITY_TUNING;
  readonly salvage?: SalvageSystem;
  readonly opponents: GauntletActor[];
  get opponent(): GauntletActor | null {
    return this.opponents[0] ?? null;
  }
  opponentPlan: PiratePilotPlan | null = null;
  opponentPlans: Array<PiratePilotPlan | null> = [];
  get playerWeapons(): readonly WeaponState[] {
    return this.salvage?.weapons ?? [];
  }
  get playerWeaponEvents(): readonly WeaponEvent[] {
    return this.salvage?.events ?? [];
  }
  gauntletResult: GauntletResult | null = null;
  private opponentCommands: PilotCommand[] = [];
  private finalDerelictsResult: Readonly<DerelictsResult> | null = null;
  get derelictsResult(): Readonly<DerelictsResult> | null {
    return this.finalDerelictsResult;
  }
  /** Gameplay seconds survived, rounded to the millisecond. */
  get elapsedSeconds(): number {
    return Math.round(this.ticks * STEP * 1000) / 1000;
  }
  /** Whole gameplay seconds survived; a partial second does not count. */
  get wholeSeconds(): number {
    return Math.floor(this.ticks * STEP + 1e-9);
  }
  /**
   * Survival score: whole seconds, plus one per point-defence or cannon hit on
   * a derelict or a derelict piece, plus 20 per derelict energy cell collected.
   * Destroying a derelict, and rail and laser hits, add nothing.
   */
  get survivalScore(): number {
    return (
      this.wholeSeconds +
      (this.salvage?.derelictIonHits ?? 0) +
      CELL_SCORE * (this.salvage?.cellsCollected ?? 0)
    );
  }
  gravityCollectionRate = 0;
  gravityFoldOpacity = 0;
  gravityFoldDirection = 0;
  engineOutput = {
    left: 0,
    right: 0,
    aft: [] as number[],
    stabilizers: [0, 0],
  };
  readonly angularMotion = { velocity: 0 };
  /**
   * The part definitions the engines run on: the game's own. A Lab instrument
   * may stage tuned copies here before a flight; play never does.
   */
  parts: typeof PARTS = PARTS;
  private readonly buildEmitters;
  private readonly engineTimers: Record<string, number> = {};
  ticks = 0;
  wraps = 0;
  private thrust = { left: false, right: false };
  constructor(settings: unknown = stockSettings()) {
    this.settings = FlightSettingsSchema.parse(settings);
    this.buildEmitters = this.settings.loadout
      ? buildPlumeEmitters(this.settings.loadout)
      : [];
    if (this.settings.loadout)
      this.ship.radius = buildCollisionRadius(this.settings.loadout);
    applyGravityTuning(this.star, this.planets, this.gravity);
    if (this.settings.mode === "derelicts" || this.settings.mode === "gauntlet")
      applyYellowFamilyProfile(
        this.star,
        yellowFamilyRadius(this.settings.seed),
        this.gravity,
      );
    if (this.settings.mode === "practice") {
      applyYellowFamilyProfile(
        this.star,
        YELLOW_FAMILY_RADIUS.reference,
        this.gravity,
      );
      this.star.designation = "G7, Sun";
    }
    // Seed changes orbit phase, not flight tuning.
    const phase =
      (((this.settings.mode === "practice"
        ? CHALLENGE_SEED
        : this.settings.seed) %
        360) /
        180) *
      Math.PI;
    for (const planet of this.planets) {
      planet.orbitAngle += phase;
      planet.pos.set(
        960 + Math.cos(planet.orbitAngle) * planet.orbitRadius,
        540 + Math.sin(planet.orbitAngle) * planet.orbitRadius,
      );
    }
    if (this.settings.arrival && this.settings.mode !== "practice") {
      const angle = arrivalBearing(this.settings.seed);
      this.ship.pos.set(
        960 + 1180 * Math.cos(angle),
        540 + 1180 * Math.sin(angle),
      );
      this.ship.rotation = angle + Math.PI + (37 * Math.PI) / 180;
      this.ship.vel.set(
        600 * Math.cos(this.ship.rotation),
        600 * Math.sin(this.ship.rotation),
      );
    }
    this.state.sunType = "G";
    const proposedPirateAngle = arrivalBearing(this.settings.seed ^ 0x51ed270b);
    const playerArrivalAngle = arrivalBearing(this.settings.seed);
    const entrySeparation =
      2360 * Math.abs(Math.sin((proposedPirateAngle - playerArrivalAngle) / 2));
    const pirateArrivalAngle =
      entrySeparation < 100
        ? proposedPirateAngle + Math.PI
        : proposedPirateAngle;
    const secondPirateArrivalAngle = [
      pirateArrivalAngle + Math.PI,
      pirateArrivalAngle + (2 * Math.PI) / 3,
      pirateArrivalAngle - (2 * Math.PI) / 3,
    ].sort((a, b) => {
      const separation = (angle: number, other: number) =>
        2360 * Math.abs(Math.sin((angle - other) / 2));
      const score = (angle: number) =>
        Math.min(
          separation(angle, pirateArrivalAngle),
          separation(angle, playerArrivalAngle),
        );
      return score(b) - score(a);
    })[0];
    this.opponents =
      this.settings.mode === "gauntlet"
        ? [
            createPirate(
              pirateArrivalAngle,
              (this.settings.seed ^ 0x51ed270b) >>> 0,
              this.settings.ion,
              "pirate-1",
            ),
            createPirate(
              secondPirateArrivalAngle,
              (this.settings.seed ^ 0x2c1b3c6d) >>> 0,
              this.settings.ion,
              "pirate-2",
            ),
          ]
        : [];
    this.opponentPlans = this.opponents.map(() => null);
    this.opponentCommands = this.opponents.map(() => NO_PILOT_COMMAND);
    if (this.settings.loadout)
      this.state.resources.power = buildStats(this.settings.loadout).capacity;
    // Survival and Derelicts mode each run the encounter with their own rules.
    if (
      this.settings.loadout &&
      (this.settings.encounters || this.settings.mode === "gauntlet") &&
      this.settings.mode !== "practice"
    )
      this.salvage = new SalvageSystem(
        this.settings.loadout,
        this.settings.seed,
        this.settings.ion,
        this.settings.mode === "derelicts" || this.settings.mode === "gauntlet"
          ? ENCOUNTER
          : SURVIVAL_ENCOUNTER,
      );
  }
  /** The plume emitters in mount order, with this tick's output; read-only. */
  get emitters(): readonly Readonly<PlumeEmitter>[] {
    return this.buildEmitters;
  }
  /** Seconds each main engine has been held, by mount key; read-only. */
  get engineSeconds(): Readonly<Record<string, number>> {
    return this.engineTimers;
  }
  get engineFeedback() {
    const build = this.settings.loadout;
    if (!build) return "";
    return Object.entries(this.engineTimers)
      .filter(([, time]) => time > 0)
      .map(([key, time]) => {
        const id = key.startsWith("aft-")
          ? build.aft[Number(key.slice(4))]
          : build.side;
        if (!id) return "";
        const part = this.parts[id];
        if (part.response === "delayed" && time < part.chargeSeconds)
          return `${key}: charging ${Math.floor((time / part.chargeSeconds) * 100)}%`;
        if (part.response === "pulse")
          return `${key}: ${time % part.pulsePeriod < part.pulseOn ? "pulse" : "recovering"}`;
        return `${key}: firing`;
      })
      .filter(Boolean)
      .join(" · ");
  }
  start() {
    this.state.status = "PLAYING";
    this.state.startTime = 0;
  }
  step(input: FlightTickInput) {
    if (this.state.status !== "PLAYING") return;
    const beforeX = this.ship.pos.x;
    const beforeY = this.ship.pos.y;
    let delivered = 0;
    let collected = 0;
    let solarCollected = 0;
    let playerCombatDamage = 0;
    const pirateCombatDamage = this.opponents.map(() => 0);
    let substeps = 0;
    // Four substeps resolve stronger close passes without changing the replay tick rate.
    for (let substep = 0; substep < 4; substep++) {
      if (this.settings.mode === "gauntlet")
        for (const planet of this.planets) updatePlanetOrbit(planet, STEP / 4);
      const previousX = this.ship.pos.x,
        previousY = this.ship.pos.y;
      const opponentPrevious = this.opponents.map((pirate) => ({
        x: pirate.ship.pos.x,
        y: pirate.ship.pos.y,
      }));
      if (this.settings.mode === "practice" && !this.settings.loadout)
        this.state.resources.power = 100;
      if (this.settings.loadout) {
        const actorState = {
          ship: this.ship,
          loadout: this.settings.loadout,
          resources: this.state.resources,
          engineTimers: this.engineTimers,
          angularMotion: this.angularMotion,
          engineOutput: this.engineOutput,
        };
        const result = stepMountedActor(
          actorState,
          input,
          STEP / 4,
          this.star,
          this.planets,
          this.settings.ion,
          { ...this.settings.profile, hullMultiplier: 1 },
          this.settings.mode === "practice",
          this.parts,
          this.settings.mode !== "gauntlet",
        );
        this.engineOutput = actorState.engineOutput;
        solarCollected += result.solarCollected;
        collected += result.collected;
        if (result.collected > 0 && result.gravityDirection !== undefined)
          this.gravityFoldDirection = result.gravityDirection;
      } else {
        delivered += updateShip(
          this.ship,
          input,
          STEP / 4,
          1920,
          1080,
          this.star,
          this.planets,
          this.state.resources,
          undefined,
          this.settings.profile,
          { drag: 0, speedLimit: null },
          "inverse-square",
          GRAVITY_FLIGHT.engineSpeedScale,
          ENGINE_CUTOFF,
        );
      }
      substeps++;
      const playerHullAtSubstep =
        this.state.resources.hull - playerCombatDamage;
      const playerCanFire = playerHullAtSubstep > 0;
      const piratesCanFire = this.opponents.map(
        (pirate, index) =>
          pirate.lifecycle === "active" &&
          pirate.resources.hull - pirateCombatDamage[index] > 0,
      );
      if (this.opponents.length) {
        for (let index = 0; index < this.opponents.length; index++) {
          const pirate = this.opponents[index];
          if (pirate.lifecycle === "destroyed") continue;
          const centreDistance = Math.hypot(
            pirate.ship.pos.x - 960,
            pirate.ship.pos.y - 540,
          );
          if (pirate.lifecycle === "arriving" && centreDistance < 1150)
            pirate.lifecycle = "active";
          if (
            pirate.lifecycle === "active" &&
            substep === 1 &&
            (this.ticks + index * 4) % 8 === 0
          ) {
            this.opponentPlans[index] = planPirate(
              pirate,
              this.ship,
              this.star,
              this.planets,
              this.settings.ion,
            );
            if (index === 0) this.opponentPlan = this.opponentPlans[index];
            this.opponentCommands[index] =
              this.opponentPlans[index]?.command ?? NO_PILOT_COMMAND;
          }
          stepGauntletActor(
            pirate,
            pirate.lifecycle === "active"
              ? this.opponentCommands[index]
              : NO_PILOT_COMMAND,
            STEP / 4,
            this.star,
            this.planets,
            this.settings.ion,
          );
        }
        if (this.settings.loadout) {
          for (let index = 0; index < this.opponents.length; index++) {
            const pirate = this.opponents[index];
            if (pirate.lifecycle === "destroyed") continue;
            const prior = opponentPrevious[index];
            const relX = previousX - prior.x,
              relY = previousY - prior.y;
            const relMoveX =
              this.ship.pos.x - previousX - (pirate.ship.pos.x - prior.x);
            const relMoveY =
              this.ship.pos.y - previousY - (pirate.ship.pos.y - prior.y);
            const contact = contactTime(
              relX,
              relY,
              relMoveX,
              relMoveY,
              this.ship.radius + pirate.ship.radius,
              1,
            );
            if (!Number.isFinite(contact)) continue;
            const t = Math.max(0, Math.min(1, contact));
            const px = previousX + (this.ship.pos.x - previousX) * t;
            const py = previousY + (this.ship.pos.y - previousY) * t;
            const ox = prior.x + (pirate.ship.pos.x - prior.x) * t;
            const oy = prior.y + (pirate.ship.pos.y - prior.y) * t;
            const distance = Math.hypot(px - ox, py - oy) || 1;
            const nx = (px - ox) / distance,
              ny = (py - oy) / distance;
            const closing =
              (this.ship.vel.x - pirate.ship.vel.x) * nx +
              (this.ship.vel.y - pirate.ship.vel.y) * ny;
            if (closing < 0) {
              const pm = buildStats(this.settings.loadout).mass,
                om = buildStats(pirate.loadout).mass;
              const impulse =
                -((1 + GAUNTLET_SHIP_CONTACT.restitution) * closing) /
                (1 / pm + 1 / om);
              this.ship.vel.x += (impulse * nx) / pm;
              this.ship.vel.y += (impulse * ny) / pm;
              pirate.ship.vel.x -= (impulse * nx) / om;
              pirate.ship.vel.y -= (impulse * ny) / om;
            }
            const half = (this.ship.radius + pirate.ship.radius) / 2;
            const mx = (px + ox) / 2,
              my = (py + oy) / 2,
              remaining = ((1 - t) * STEP) / 4;
            this.ship.pos.set(
              mx + nx * half + this.ship.vel.x * remaining,
              my + ny * half + this.ship.vel.y * remaining,
            );
            pirate.ship.pos.set(
              mx - nx * half + pirate.ship.vel.x * remaining,
              my - ny * half + pirate.ship.vel.y * remaining,
            );
            playerCombatDamage += GAUNTLET_SHIP_CONTACT.damage;
            pirateCombatDamage[index] += GAUNTLET_SHIP_CONTACT.damage;
          }
          for (let first = 0; first < this.opponents.length; first++) {
            const a = this.opponents[first];
            if (
              a.lifecycle === "destroyed" ||
              a.resources.hull - pirateCombatDamage[first] <= 0
            )
              continue;
            for (
              let second = first + 1;
              second < this.opponents.length;
              second++
            ) {
              const b = this.opponents[second];
              if (
                b.lifecycle === "destroyed" ||
                b.resources.hull - pirateCombatDamage[second] <= 0
              )
                continue;
              const pa = opponentPrevious[first],
                pb = opponentPrevious[second];
              const contact = contactTime(
                pa.x - pb.x,
                pa.y - pb.y,
                a.ship.pos.x - pa.x - (b.ship.pos.x - pb.x),
                a.ship.pos.y - pa.y - (b.ship.pos.y - pb.y),
                a.ship.radius + b.ship.radius,
                1,
              );
              if (!Number.isFinite(contact)) continue;
              const t = Math.max(0, Math.min(1, contact));
              const ax = pa.x + (a.ship.pos.x - pa.x) * t,
                ay = pa.y + (a.ship.pos.y - pa.y) * t;
              const bx = pb.x + (b.ship.pos.x - pb.x) * t,
                by = pb.y + (b.ship.pos.y - pb.y) * t;
              const length = Math.hypot(ax - bx, ay - by) || 1,
                nx = (ax - bx) / length,
                ny = (ay - by) / length;
              const closing =
                (a.ship.vel.x - b.ship.vel.x) * nx +
                (a.ship.vel.y - b.ship.vel.y) * ny;
              const am = buildStats(a.loadout).mass,
                bm = buildStats(b.loadout).mass;
              if (closing < 0) {
                const impulse =
                  -((1 + GAUNTLET_SHIP_CONTACT.restitution) * closing) /
                  (1 / am + 1 / bm);
                a.ship.vel.x += (impulse * nx) / am;
                a.ship.vel.y += (impulse * ny) / am;
                b.ship.vel.x -= (impulse * nx) / bm;
                b.ship.vel.y -= (impulse * ny) / bm;
              }
              const half = (a.ship.radius + b.ship.radius) / 2,
                mx = (ax + bx) / 2,
                my = (ay + by) / 2,
                remaining = ((1 - t) * STEP) / 4;
              a.ship.pos.set(
                mx + nx * half + a.ship.vel.x * remaining,
                my + ny * half + a.ship.vel.y * remaining,
              );
              b.ship.pos.set(
                mx - nx * half + b.ship.vel.x * remaining,
                my - ny * half + b.ship.vel.y * remaining,
              );
              pirateCombatDamage[first] += GAUNTLET_SHIP_CONTACT.damage;
              pirateCombatDamage[second] += GAUNTLET_SHIP_CONTACT.damage;
            }
          }
          const piratesAsTargets = this.opponents.flatMap(
            (target, targetIndex) =>
              target.lifecycle === "destroyed" ||
              target.resources.hull - pirateCombatDamage[targetIndex] <= 0
                ? []
                : [
                    liveShipBody(
                      900001 + targetIndex,
                      target.ship,
                      target.resources.hull - pirateCombatDamage[targetIndex],
                      (amount) => {
                        pirateCombatDamage[targetIndex] += amount;
                      },
                      opponentPrevious[targetIndex],
                    ),
                  ],
          );
          const arrivalsComplete = this.opponents.every(
            (actor) => actor.lifecycle !== "arriving",
          );
          if (this.salvage && arrivalsComplete && playerCanFire) {
            this.salvage.stepWeapons(
              STEP / 4,
              this.ship,
              this.star,
              this.state.resources,
              buildStats(this.settings.loadout).capacity,
              this.planets,
              piratesAsTargets,
            );
          }
          for (let index = 0; index < this.opponents.length; index++) {
            const pirate = this.opponents[index];
            if (!arrivalsComplete || !piratesCanFire[index]) continue;
            const playerTarget = liveShipBody(
              900000,
              this.ship,
              playerCanFire ? playerHullAtSubstep : 0,
              (amount) => {
                playerCombatDamage += amount;
              },
              { x: previousX, y: previousY },
            );
            const targets = [
              playerTarget,
              ...piratesAsTargets.filter((body) => body.id !== 900001 + index),
            ];
            pirate.combat.stepWeapons(
              STEP / 4,
              pirate.ship,
              this.star,
              pirate.resources,
              buildStats(pirate.loadout).capacity,
              this.planets,
              targets,
              [playerTarget],
            );
            pirate.weaponEvents = pirate.combat.events;
            pirate.weapons = pirate.combat.weapons;
          }
        }
      }
      if (
        this.salvage &&
        this.settings.loadout &&
        this.settings.mode !== "gauntlet"
      )
        this.salvage.step(
          STEP / 4,
          this.ship,
          this.star,
          this.state.resources,
          buildStats(this.settings.loadout).capacity,
          previousX,
          previousY,
          Math.hypot(this.ship.pos.x - previousX, this.ship.pos.y - previousY) >
            1200,
          this.planets,
        );
      if (
        this.settings.mode !== "practice" &&
        Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540) <
          this.star.radius + this.ship.radius
      )
        break;
    }
    for (const pirate of this.opponents) {
      if (pirate.lifecycle === "destroyed") {
        pirate.plume.clear();
        for (const emitter of pirate.emitters) emitter.output = 0;
        continue;
      }
      const outputs = [
        pirate.engineOutput.left,
        pirate.engineOutput.right,
        ...pirate.engineOutput.aft.filter((_, index) => {
          const id = pirate.loadout.aft[index];
          return !!id && PARTS[id].category === "E";
        }),
        ...pirate.engineOutput.stabilizers,
      ];
      for (const [index, emitter] of pirate.emitters.entries())
        emitter.output = outputs[index] ?? 0;
      pirate.plume.stepMounted(STEP, pirate.ship, pirate.emitters);
    }
    if (!this.settings.loadout) {
      this.engineOutput.left = input.leftThruster ? delivered / substeps : 0;
      this.engineOutput.right = input.rightThruster ? delivered / substeps : 0;
    }
    if (
      Math.hypot(this.ship.pos.x - beforeX, this.ship.pos.y - beforeY) > 1200
    ) {
      this.wraps++;
      this.plume.clear();
    }
    if (this.settings.loadout) {
      const outputs =
        this.settings.loadout.chassis === "wasp"
          ? [this.engineOutput.left, ...this.engineOutput.stabilizers]
          : [
              this.engineOutput.left,
              this.engineOutput.right,
              ...this.engineOutput.aft.filter((_, index) => {
                const id = this.settings.loadout?.aft[index];
                return !!id && PARTS[id].category === "E";
              }),
              ...this.engineOutput.stabilizers,
            ];
      const loadout = this.settings.loadout;
      const engines = [
        { key: "left", part: loadout.side },
        ...(loadout.chassis === "wasp"
          ? []
          : [
              { key: "right", part: loadout.side },
              ...loadout.aft.flatMap((part, index) =>
                part && PARTS[part].category === "E"
                  ? [{ key: `aft-${index}`, part }]
                  : [],
              ),
            ]),
      ];
      for (const [index, emitter] of this.buildEmitters.entries()) {
        emitter.output = outputs[index];
        const engine = engines[index];
        const part = engine && this.parts[engine.part];
        const held = engine ? (this.engineTimers[engine.key] ?? 0) : 0;
        const delayed = part?.response === "delayed" && part.chargeSeconds > 0;
        emitter.charge =
          delayed &&
          held > 0 &&
          (emitter.output > 0 || held <= part.chargeSeconds + 1e-9)
            ? Math.min(1, held / part.chargeSeconds)
            : undefined;
        emitter.thrustSeconds =
          engine && held > 0
            ? delayed
              ? held <= part.chargeSeconds + 1e-9
                ? 0
                : held - part.chargeSeconds
              : held
            : 0;
      }
      this.plume.stepMounted(STEP, this.ship, this.buildEmitters);
    } else
      this.plume.step(
        STEP,
        this.ship,
        this.engineOutput.left,
        this.engineOutput.right,
      );
    const distance = Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540);
    this.thrust.left = input.leftThruster;
    this.thrust.right = input.rightThruster;
    if (!this.settings.loadout)
      updatePower(
        this.state.resources,
        distance,
        this.star,
        STEP,
        this.thrust,
        this.settings.profile.powerDrainMultiplier,
      );
    if (this.opponents.length) {
      this.state.resources.hull = Math.max(
        0,
        this.state.resources.hull - playerCombatDamage,
      );
      for (const [index, pirate] of this.opponents.entries())
        pirate.resources.hull = Math.max(
          0,
          pirate.resources.hull - pirateCombatDamage[index],
        );
    }
    const hullBeforeSun = this.state.resources.hull;
    updateHull(this.state.resources, distance, this.star, STEP);
    if (this.opponents.length && this.settings.loadout) {
      const pirateDeaths = this.opponents.map((pirate) => {
        const pirateDistance = Math.hypot(
          pirate.ship.pos.x - this.star.pos.x,
          pirate.ship.pos.y - this.star.pos.y,
        );
        const hullBeforeWorld = pirate.resources.hull;
        updateHull(pirate.resources, pirateDistance, this.star, STEP);
        const environment =
          pirateDistance < this.star.radius + pirate.ship.radius ||
          (hullBeforeWorld > 0 && pirate.resources.hull <= 0) ||
          pirate.resources.power <= 0;
        const dead = environment || pirate.resources.hull <= 0;
        if (dead) {
          pirate.lifecycle = "destroyed";
          pirate.plume.clear();
        }
        return { dead, environment };
      });
      const playerEnvironmentDeath =
        distance < this.star.radius + this.ship.radius ||
        (hullBeforeSun > 0 && this.state.resources.hull <= 0) ||
        this.state.resources.power <= 0;
      const playerDead =
        playerEnvironmentDeath || this.state.resources.hull <= 0;
      const piratesDead = pirateDeaths.every((death) => death.dead);
      const pirateEnvironmentDeath = pirateDeaths.some(
        (death) => death.environment,
      );
      if (playerDead || piratesDead) {
        this.gauntletResult = GauntletResultSchema.parse({
          winner: playerDead ? (piratesDead ? "mutual" : "pirate") : "player",
          cause:
            (playerDead && playerEnvironmentDeath) ||
            (piratesDead && pirateEnvironmentDeath)
              ? "environment"
              : "combat",
        });
        this.state.status = "GAME_OVER";
        if (playerDead)
          this.state.deathCause = playerEnvironmentDeath
            ? distance < this.star.radius + this.ship.radius
              ? "STAR"
              : this.state.resources.power <= 0
                ? "POWER"
                : "HULL"
            : "HULL";
      }
    }
    this.solarCollectionRate = this.settings.loadout
      ? solarCollected / STEP
      : solarCharge(distance, this.star, 1);
    this.solarDamageRate =
      this.settings.mode === "practice"
        ? 0
        : (hullBeforeSun - this.state.resources.hull) / STEP;
    if (this.settings.mode === "practice") {
      this.state.resources.power = this.settings.loadout
        ? buildStats(this.settings.loadout).capacity
        : 100;
      this.state.resources.hull = 100;
    }
    this.gravityCollectionRate = collected / STEP;
    const target = collected > 0 ? 1 : 0;
    const fade = STEP / GRAVITY_COLLECTION.fadeSeconds;
    this.gravityFoldOpacity += Math.max(
      -fade,
      Math.min(fade, target - this.gravityFoldOpacity),
    );
    this.ticks++;
    this.state.elapsedTime = this.ticks * STEP;
    const cause =
      distance < this.star.radius + this.ship.radius
        ? "STAR"
        : this.state.resources.hull <= 0
          ? "HULL"
          : this.state.resources.power <= 0
            ? "POWER"
            : null;
    if (
      cause &&
      this.settings.mode !== "practice" &&
      this.settings.mode !== "gauntlet"
    ) {
      this.state.status = "GAME_OVER";
      this.state.deathCause = cause;
      if (this.settings.mode === "derelicts") {
        const seconds = this.state.elapsedTime;
        const playerKills = this.salvage?.playerKills ?? 0;
        this.finalDerelictsResult = Object.freeze(
          DerelictsResultSchema.parse({
            seconds,
            playerKills,
            score: seconds + 10 * playerKills,
          }),
        );
      }
    }
  }
  replay(data: unknown) {
    const inputs = ReplaySchema.parse(data);
    for (const input of inputs)
      for (let tick = 0; tick < input.ticks; tick++) this.step(input);
  }
}
