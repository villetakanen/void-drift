import type {
  AirSample,
  GameObject,
  MassWell,
  Planet,
  PlumeEmitter,
  Star,
} from "@void-drift/core";
import {
  assignPlanetSystemPositions,
  CONFIG,
  densestAirSample,
  ENGINE_CUTOFF,
  EnginePlume,
  GravityFlightSchema,
  initializePlanets,
  massWellReach,
  StarWorldHudIdentitySchema,
  updateHull,
  updatePlanetOrbit,
  updatePower,
  updateShip,
  Vec2,
} from "@void-drift/core";
import { type FissionIgnitionEvent, solarCharge } from "./build-flight";
import { buildCollisionRadius, buildPlumeEmitters } from "./build-renderer";
import { SHIP_PROFILE_BY_ID } from "./config";
import { DroneFlight } from "./drone-flight";
import { type FissionContact, FissionFlight } from "./fission-contact";
import { createStar } from "./game-loop";
import {
  createPirate,
  GAUNTLET_SHIP_CONTACT,
  type GauntletActor,
  NO_PILOT_COMMAND,
  type PilotCommand,
  type PiratePilotPlan,
  pirateLoadout,
  planPirate,
  stepGauntletActor,
  stepMountedActor,
  updateEnemyObjective,
} from "./gauntlet";
import { GRAVITY_COLLECTION } from "./gravity-collection";
import { habitableMass } from "./habitable-world";
import {
  applyMercurialGravity,
  MERCURIAL_ROCK_RADIUS,
  mercurialMass,
  PRACTICE_MERCURY_ORBIT,
  PRACTICE_MERCURY_TRAVEL_SPEED,
} from "./mercurial-rock";
import {
  PRACTICE_CRADLE_COLOR,
  PRACTICE_CRADLE_ORBIT,
  PRACTICE_CRADLE_RADIUS,
  PRACTICE_CRADLE_TRAVEL_SPEED,
} from "./practice-cradle";
import {
  PRACTICE_VENUS_ORBIT,
  PRACTICE_VENUS_RADIUS,
  PRACTICE_VENUS_TRAVEL_SPEED,
} from "./practice-venus";
import type {
  SalvageBody,
  TargetingMetrics,
  WeaponEvent,
  WeaponState,
} from "./salvage";
import {
  contactTime,
  type FlightTickInput,
  fittedWeaponKinds,
  liveShipBody,
  SalvageSystem,
  weaponsEnergyEmergency,
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
  type FlightParts,
  isScoredEligible,
  PARTS,
  starterLoadout,
} from "./schemas/loadout";
import {
  type DerelictsResult,
  DerelictsResultSchema,
  DRONE_LAUNCHER,
  ENCOUNTER,
  RANKED_SURVIVAL_ENCOUNTER,
  SURVIVAL_ENCOUNTER,
} from "./schemas/salvage";
import type { ShipProfileId } from "./schemas/ship-profile";
import { generateSolarSystem } from "./solar-system";
import {
  acquireFleetTargets,
  PLAYER_BODY_ID,
  type WeaponAcquisition,
} from "./targeting";
import { ATMOSPHERE_TUNING, GRAVITY_TUNING, PRACTICE_SYSTEM } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

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
/** The densest air the ship is in this tick, or null outside every atmosphere. */
export function playerAirSample(
  ship: GameObject,
  planets: readonly Planet[],
): AirSample | null {
  return densestAirSample(ship, planets);
}
export function planetMass(
  id: string | undefined,
  tuning: GravityTuning = GRAVITY_TUNING,
  radius: number = tuning.mercurial.referenceRadius,
): number {
  if (id === "moon" || id === "outer-mercurial")
    return mercurialMass(radius, tuning.mercurial);
  if (id === "habitable") return habitableMass(radius, tuning.habitable);
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
  for (const planet of planets) {
    if (planet.id === "moon" || planet.id === "outer-mercurial")
      applyMercurialGravity(planet, tuning);
    else if (planet.id === "habitable") {
      planet.mass = habitableMass(planet.radius, tuning.habitable);
      planet.massWell = tunedMassWell(planet.mass, tuning);
    } else
      planet.massWell = tunedMassWell(planetMass(planet.id, tuning), tuning);
  }
}
/** Gives the star a mass well and makes its reach follow it. */
export function setStarMassWell(star: Star, well: MassWell) {
  star.massWell = well;
  star.influenceRadius = massWellReach(well.mass, well.cutoff, well.falloff);
}
export const CHALLENGE_SEED = 2026;
const GAUNTLET_ROSTER_SIZE = 7;
const GAUNTLET_ARRIVAL_TICKS = 600;

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
  /** Optional cumulative acquisition/contact measurements for this simulation. */
  targetingMetrics?: TargetingMetrics;
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
  readonly star: Star;
  readonly planets: Planet[];
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
  private gauntletArrivalsIssued = 0;
  private nextSurvivalPirateTick = Infinity;
  private survivalPiratesIssued = 0;
  private playerEntryComplete = false;
  private playerWeaponsChoice: "auto" | "off" = "auto";
  readonly droneFlight = new DroneFlight();
  private readonly carrierIds = new WeakMap<GauntletActor, number>();
  private nextCarrierId = PLAYER_BODY_ID;
  private carrierId(actor: GauntletActor) {
    let id = this.carrierIds.get(actor);
    if (id === undefined) {
      id = ++this.nextCarrierId;
      this.carrierIds.set(actor, id);
      const carrierId = id;
      if (actor.combat.weapons.some((w) => w.kind === "drone-launcher"))
        actor.combat.launchDrone = (ship, weapon, target) =>
          this.droneFlight.launch(carrierId, ship, weapon.mount, target);
    }
    return id;
  }
  private readonly playerWeaponKinds: Pick<WeaponState, "kind">[];
  private readonly playerCapacity: number;
  get weaponsChoice(): "auto" | "off" {
    return this.playerWeaponsChoice;
  }
  get weaponsEnergyEmergency(): boolean {
    return (
      this.salvage?.weaponsEnergyEmergency(
        this.state.resources.power,
        STEP / 4,
      ) ??
      weaponsEnergyEmergency(
        this.state.resources.power,
        this.playerWeaponKinds,
        STEP / 4,
      )
    );
  }
  /** Simulation availability; the caller also respects UI pause and visibility. */
  get canToggleWeapons(): boolean {
    return (
      this.state.status === "PLAYING" &&
      this.settings.mode !== "survival" &&
      this.playerEntryComplete &&
      !this.weaponsEnergyEmergency
    );
  }
  toggleWeapons(): boolean {
    if (!this.canToggleWeapons) return false;
    this.playerWeaponsChoice =
      this.playerWeaponsChoice === "auto" ? "off" : "auto";
    return true;
  }
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
  private playerPirateKills = 0;
  get survivalScore(): number {
    return (
      this.wholeSeconds +
      50 * this.playerPirateKills +
      10 * (this.salvage?.playerKills ?? 0) +
      2 * (this.salvage?.playerShardKills ?? 0) +
      CELL_SCORE * (this.salvage?.cellsCollected ?? 0)
    );
  }
  gravityCollectionRate = 0;
  /** The player's contact with the densest air it touches, for drawing only. */
  airSample: AirSample | null = null;
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
  parts: FlightParts = PARTS;
  private readonly fissionReadyAt: Record<string, number> = {};
  private readonly tickIgnitions: FissionIgnitionEvent[] = [];
  private readonly fissionFlight = new FissionFlight();
  /** Resolved exhaust hits from the most recently simulated replay tick. */
  get fissionContacts(): readonly FissionContact[] {
    return this.fissionFlight.contacts;
  }
  /** All successful nozzles from the most recently simulated replay tick. */
  get fissionIgnitions(): readonly FissionIgnitionEvent[] {
    return this.tickIgnitions;
  }
  private readonly buildEmitters;
  private readonly engineTimers: Record<string, number> = {};
  ticks = 0;
  wraps = 0;
  private thrust = { left: false, right: false };
  constructor(settings: unknown = stockSettings()) {
    this.settings = FlightSettingsSchema.parse(settings);
    if (this.settings.mode === "practice") {
      this.star = createStar("G", 960, 540);
      this.planets = initializePlanets(960, 540);
    } else {
      const system = generateSolarSystem({
        seed: this.settings.seed,
        centerX: 960,
        centerY: 540,
      });
      this.star = system.star;
      this.planets = system.planets;
    }
    this.buildEmitters = this.settings.loadout
      ? buildPlumeEmitters(this.settings.loadout)
      : [];
    if (this.settings.loadout)
      this.ship.radius = buildCollisionRadius(this.settings.loadout);
    // Venus replaces the middle gas world only in Practice, before mass lookup.
    if (this.settings.mode === "practice") {
      const venus = this.planets.find((planet) => planet.id === "gas");
      if (venus) {
        venus.id = "venus";
        venus.radius = PRACTICE_VENUS_RADIUS;
        venus.orbitRadius = PRACTICE_VENUS_ORBIT;
        venus.orbitSpeed = PRACTICE_VENUS_TRAVEL_SPEED / PRACTICE_VENUS_ORBIT;
        venus.mass = planetMass("venus", this.gravity);
        venus.color = PRACTICE_SYSTEM.venus.color;
        venus.type = "rock";
      }
      // The Cradle replaces the outer stock rock, also before mass lookup.
      const cradle = this.planets.find((planet) => planet.id === "rock");
      if (cradle) {
        cradle.id = "cradle";
        cradle.displayName = "The Cradle";
        cradle.radius = PRACTICE_CRADLE_RADIUS;
        cradle.orbitRadius = PRACTICE_CRADLE_ORBIT;
        cradle.orbitSpeed =
          PRACTICE_CRADLE_TRAVEL_SPEED / PRACTICE_CRADLE_ORBIT;
        cradle.color = PRACTICE_CRADLE_COLOR;
        cradle.atmosphere = ATMOSPHERE_TUNING.cradle;
      }
    }
    const massTuning =
      this.settings.mode === "practice"
        ? {
            ...this.gravity,
            planetMass: {
              ...this.gravity.planetMass,
              ...this.gravity.practicePlanetMass,
            },
          }
        : this.gravity;
    if (this.settings.mode === "practice")
      applyGravityTuning(this.star, this.planets, massTuning);
    if (this.settings.mode === "practice") {
      applyYellowFamilyProfile(
        this.star,
        PRACTICE_SYSTEM.star.radius,
        this.gravity,
      );
      Object.assign(
        this.star,
        StarWorldHudIdentitySchema.parse({ name: "Sun", denomination: "G7" }),
      );
      this.star.designation = "G7 Sun";
      // The innermost stock rock is Practice's Mercury application.
      const mercury = this.planets.find((planet) => planet.id === "moon");
      if (mercury) {
        mercury.displayName = "Mercury";
        mercury.radius = MERCURIAL_ROCK_RADIUS.practice;
        applyMercurialGravity(mercury, this.gravity);
        mercury.orbitRadius = PRACTICE_MERCURY_ORBIT;
        mercury.orbitSpeed =
          PRACTICE_MERCURY_TRAVEL_SPEED / PRACTICE_MERCURY_ORBIT;
      }
      const venus = this.planets.find((planet) => planet.id === "venus");
      if (venus) venus.displayName = "Venus";
    }
    assignPlanetSystemPositions(this.planets);
    // Practice remains fixed; generated flight modes receive their seed phase
    // from generateSolarSystem above.
    if (this.settings.mode === "practice") {
      const phase = ((PRACTICE_SYSTEM.phaseSeed % 360) / 180) * Math.PI;
      for (const planet of this.planets) {
        planet.orbitAngle += phase;
        planet.pos.set(
          960 + Math.cos(planet.orbitAngle) * planet.orbitRadius,
          540 + Math.sin(planet.orbitAngle) * planet.orbitRadius,
        );
      }
    }
    const hasArrival =
      this.settings.arrival && this.settings.mode !== "practice";
    this.playerEntryComplete = !hasArrival;
    if (hasArrival) {
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
    this.opponents = [];
    const rankedSurvival =
      this.settings.mode === "survival" &&
      this.settings.encounters &&
      this.settings.experimental === "Off" &&
      this.settings.loadout &&
      isScoredEligible(this.settings.loadout);
    if (rankedSurvival) this.nextSurvivalPirateTick = Math.round(45 / STEP);
    if (this.settings.mode === "gauntlet")
      this.opponents.push(
        createPirate(
          this.clearSpawnBearing(0),
          (this.settings.seed ^ 0x51ed270b) >>> 0,
          this.settings.ion,
          "pirate-1",
        ),
      );
    this.gauntletArrivalsIssued = this.opponents.length;
    this.opponentPlans = this.opponents.map(() => null);
    this.opponentCommands = this.opponents.map(() => NO_PILOT_COMMAND);
    this.playerWeaponKinds = this.settings.loadout
      ? fittedWeaponKinds(this.settings.loadout).map((kind) => ({ kind }))
      : [];
    this.playerCapacity = this.settings.loadout
      ? buildStats(this.settings.loadout).capacity
      : this.state.resources.power;
    this.state.resources.power = this.playerCapacity;
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
          : rankedSurvival
            ? RANKED_SURVIVAL_ENCOUNTER
            : SURVIVAL_ENCOUNTER,
      );
    if (this.salvage?.weapons.some((w) => w.kind === "drone-launcher"))
      this.salvage.launchDrone = (ship, weapon, target) =>
        this.droneFlight.launch(PLAYER_BODY_ID, ship, weapon.mount, target);
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
  private clearSpawnBearing(index: number): number {
    const seedAngle = arrivalBearing(
      (this.settings.seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0,
    );
    const radius = buildCollisionRadius(pirateLoadout());
    let bestAngle = seedAngle;
    let bestClearance = -Infinity;
    for (let candidate = 0; candidate < 32; candidate++) {
      const angle = seedAngle + candidate * ((Math.PI * 2) / 32);
      const x = 960 + 1180 * Math.cos(angle);
      const y = 540 + 1180 * Math.sin(angle);
      let clearance = Infinity;
      for (const actor of this.opponents) {
        if (actor.lifecycle === "destroyed") continue;
        clearance = Math.min(
          clearance,
          Math.hypot(x - actor.ship.pos.x, y - actor.ship.pos.y) -
            actor.ship.radius -
            radius,
        );
      }
      for (const planet of this.planets)
        clearance = Math.min(
          clearance,
          Math.hypot(x - planet.pos.x, y - planet.pos.y) -
            planet.radius -
            radius,
        );
      clearance = Math.min(
        clearance,
        Math.hypot(x - this.ship.pos.x, y - this.ship.pos.y) -
          this.ship.radius -
          radius,
      );
      clearance = Math.min(
        clearance,
        Math.hypot(x - this.star.pos.x, y - this.star.pos.y) -
          this.star.radius -
          radius,
      );
      if (clearance > bestClearance) {
        bestClearance = clearance;
        bestAngle = angle;
      }
    }
    return bestAngle;
  }
  start() {
    this.state.status = "PLAYING";
    this.state.startTime = 0;
  }
  step(input: FlightTickInput) {
    if (this.state.status !== "PLAYING") return;
    this.tickIgnitions.length = 0;
    this.fissionFlight.beginTick();
    this.droneFlight.pruneEvents(this.ticks * STEP);
    const beforeX = this.ship.pos.x;
    const beforeY = this.ship.pos.y;
    let delivered = 0;
    let collected = 0;
    let solarCollected = 0;
    let playerCombatDamage = 0;
    const pirateCombatDamage = this.opponents.map(() => 0);
    const playerDamagesPirate = (index: number, amount: number) => {
      const remaining =
        this.opponents[index].resources.hull - pirateCombatDamage[index];
      pirateCombatDamage[index] += amount;
      if (
        this.settings.mode === "survival" &&
        remaining > 0 &&
        amount >= remaining
      )
        this.playerPirateKills++;
    };
    let substeps = 0;
    // Four substeps resolve stronger close passes without changing the replay tick rate.
    for (let substep = 0; substep < 4; substep++) {
      if (this.settings.mode === "gauntlet")
        for (const planet of this.planets) updatePlanetOrbit(planet, STEP / 4);
      const visualEnd = this.ticks * STEP + ((substep + 1) * STEP) / 4;
      if (this.salvage)
        this.salvage.presentationTimeOffset =
          visualEnd - (this.salvage.time + STEP / 4);
      for (const actor of this.opponents)
        actor.combat.presentationTimeOffset =
          visualEnd - (actor.combat.time + STEP / 4);
      const previousX = this.ship.pos.x,
        previousY = this.ship.pos.y,
        previousRotation = this.ship.rotation;
      const opponentPrevious = this.opponents.map((pirate) => ({
        x: pirate.ship.pos.x,
        y: pirate.ship.pos.y,
        rotation: pirate.ship.rotation,
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
          undefined,
          substep === 0
            ? {
                carrierId: PLAYER_BODY_ID,
                tick: this.ticks,
                readyAt: this.fissionReadyAt,
                events: this.tickIgnitions,
                reserveSeconds: (3 * STEP) / 4,
              }
            : undefined,
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
      if (
        !this.playerEntryComplete &&
        Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540) < 1150
      )
        this.playerEntryComplete = true;
      const playerCanFire = playerHullAtSubstep > 0 && this.playerEntryComplete;
      for (const pirate of this.opponents)
        if (pirate.lifecycle !== "destroyed") updateEnemyObjective(pirate);
      const piratesCanFire = this.opponents.map(
        (pirate, index) =>
          pirate.lifecycle !== "destroyed" &&
          pirate.objective !== "recover" &&
          pirate.resources.hull - pirateCombatDamage[index] > 0,
      );
      let survivalTarget: ReturnType<typeof liveShipBody> | undefined;
      let physical: SalvageBody[] = [];
      let droneBodies: SalvageBody[] = [];
      let acquisition: WeaponAcquisition | undefined;
      let preparedBodies: Set<SalvageBody> | undefined;
      if (this.opponents.length || this.droneFlight.active) {
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
            (this.ticks + index) % 8 === 0
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
            this.opponentCommands[index],
            STEP / 4,
            this.star,
            this.planets,
            this.settings.ion,
            substep === 0
              ? {
                  carrierId: this.carrierId(pirate),
                  tick: this.ticks,
                  events: this.tickIgnitions,
                  reserveSeconds: (3 * STEP) / 4,
                }
              : undefined,
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
                om = pirate.stats.mass;
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
            playerDamagesPirate(index, GAUNTLET_SHIP_CONTACT.damage);
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
              const am = a.stats.mass,
                bm = b.stats.mass;
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
          const fleetPlayer = this.settings.mode === "gauntlet";
          const needsRoster =
            this.droneFlight.active ||
            !!this.salvage?.hasActivePlasma ||
            this.opponents.some((actor) => actor.combat.hasActivePlasma) ||
            ((playerCanFire || !fleetPlayer) &&
              !!this.salvage?.needsWeaponRoster(STEP / 4)) ||
            this.opponents.some(
              (actor, index) =>
                piratesCanFire[index] &&
                actor.combat.needsWeaponRoster(STEP / 4),
            );
          // One set of physical adapters is shared for this combat substep.
          if (this.droneFlight.drones.length)
            droneBodies = this.droneFlight.bodies();
          const roster = needsRoster
            ? [
                liveShipBody(
                  PLAYER_BODY_ID,
                  this.ship,
                  this.state.resources.hull - playerCombatDamage,
                  (amount) => {
                    playerCombatDamage += amount;
                  },
                  { x: previousX, y: previousY },
                ),
                ...this.opponents.flatMap((target, targetIndex) =>
                  target.lifecycle === "destroyed" ||
                  target.resources.hull - pirateCombatDamage[targetIndex] <= 0
                    ? []
                    : [
                        liveShipBody(
                          this.carrierId(target),
                          target.ship,
                          target.resources.hull -
                            pirateCombatDamage[targetIndex],
                          (amount) => {
                            pirateCombatDamage[targetIndex] += amount;
                          },
                          opponentPrevious[targetIndex],
                        ),
                      ],
                ),
                ...droneBodies,
              ]
            : [];
          physical = roster;
          if (!fleetPlayer && this.opponent)
            survivalTarget = roster.find(
              (body) => body.id === this.carrierId(this.opponents[0]),
            );
          const requests = [];
          if (this.salvage && (playerCanFire || !fleetPlayer))
            requests.push({
              system: this.salvage,
              ship: this.ship,
              shooterId: PLAYER_BODY_ID,
            });
          for (let index = 0; index < this.opponents.length; index++) {
            const actor = this.opponents[index];
            if (piratesCanFire[index])
              requests.push({
                system: actor.combat,
                ship: actor.ship,
                shooterId: this.carrierId(actor),
                aimId: PLAYER_BODY_ID,
              });
          }
          if (this.salvage) {
            this.salvage.plasmaContactEvents.length = 0;
            this.salvage.plasmaBurstEvents.length = 0;
            this.salvage.targetingMetrics = this.targetingMetrics;
          }
          for (const actor of this.opponents) {
            actor.combat.plasmaContactEvents.length = 0;
            actor.combat.plasmaBurstEvents.length = 0;
            actor.combat.targetingMetrics = this.targetingMetrics;
          }
          if (!fleetPlayer && this.salvage)
            preparedBodies = this.salvage.prepareEncounter(
              STEP / 4,
              this.star,
              this.planets,
            );
          const acquisitions = acquireFleetTargets(
            needsRoster && !fleetPlayer && this.salvage
              ? [...roster, ...this.salvage.bodies]
              : roster,
            requests,
            this.star,
            this.planets,
            STEP / 4,
            this.targetingMetrics,
            this.droneFlight.drones,
          );
          acquisition = this.salvage
            ? acquisitions.get(this.salvage)
            : undefined;
          if (droneBodies.length) this.droneFlight.move(STEP / 4, roster);
          if (fleetPlayer && this.salvage && playerCanFire) {
            this.salvage.stepWeapons(
              STEP / 4,
              this.ship,
              this.star,
              this.state.resources,
              this.playerCapacity,
              this.planets,
              roster,
              undefined,
              { shooterId: PLAYER_BODY_ID },
              acquisitions.get(this.salvage),
              { x: previousX, y: previousY, rotation: previousRotation },
              this.weaponsChoice === "auto",
            );
          } else if (fleetPlayer && this.salvage) {
            this.salvage.stepPlasmaStreams(
              STEP / 4,
              this.star,
              this.planets,
              roster,
              PLAYER_BODY_ID,
            );
          }
          for (let index = 0; index < this.opponents.length; index++) {
            const pirate = this.opponents[index];
            if (!piratesCanFire[index]) {
              pirate.combat.stepPlasmaStreams(
                STEP / 4,
                this.star,
                this.planets,
                roster,
                this.carrierId(pirate),
              );
              continue;
            }
            pirate.combat.stepWeapons(
              STEP / 4,
              pirate.ship,
              this.star,
              pirate.resources,
              pirate.stats.capacity,
              this.planets,
              roster,
              undefined,
              { shooterId: this.carrierId(pirate), aimId: PLAYER_BODY_ID },
              acquisitions.get(pirate.combat),
              opponentPrevious[index],
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
      ) {
        this.salvage.targetingMetrics = this.targetingMetrics;
        if (survivalTarget)
          survivalTarget.onDamage = (amount) => playerDamagesPirate(0, amount);
        this.salvage.step(
          STEP / 4,
          this.ship,
          this.star,
          this.state.resources,
          this.playerCapacity,
          previousX,
          previousY,
          Math.hypot(this.ship.pos.x - previousX, this.ship.pos.y - previousY) >
            1200,
          this.planets,
          previousRotation,
          survivalTarget,
          this.weaponsChoice === "auto" &&
            (this.settings.mode !== "derelicts" || this.playerEntryComplete),
          {
            extraBodies: droneBodies,
            shooterId: PLAYER_BODY_ID,
            acquisition,
            preparedBodies,
          },
        );
      }
      if (this.droneFlight.active) {
        const bodies =
          this.salvage && this.settings.mode !== "gauntlet"
            ? [...physical, ...this.salvage.bodies]
            : physical;
        this.droneFlight.resolve(
          STEP / 4,
          visualEnd - STEP / 4,
          bodies,
          this.star,
          this.planets,
          (body, amount, carrierId) => {
            if (body.kind === "ship") {
              const opponent = this.opponents.findIndex(
                (actor) => this.carrierId(actor) === body.id,
              );
              if (opponent < 0) body.onDamage?.(amount);
              else if (carrierId === PLAYER_BODY_ID)
                playerDamagesPirate(opponent, amount);
              else pirateCombatDamage[opponent] += amount;
              body.hull = Math.max(0, body.hull - amount);
            } else
              this.salvage?.applyDamage(
                body,
                amount,
                carrierId === PLAYER_BODY_ID,
              );
          },
          (id) => {
            if (id === PLAYER_BODY_ID)
              this.state.resources.power = Math.min(
                this.playerCapacity,
                this.state.resources.power + DRONE_LAUNCHER.energy,
              );
            else {
              const carrier = this.opponents.find(
                (actor) => this.carrierId(actor) === id,
              );
              if (carrier)
                carrier.resources.power = Math.min(
                  carrier.stats.capacity,
                  carrier.resources.power + DRONE_LAUNCHER.energy,
                );
            }
          },
        );
      }
      if (substep === 0)
        for (const ignition of this.tickIgnitions)
          this.fissionFlight.launch(ignition, STEP);
      if (this.fissionFlight.active) {
        // Use completed movement and current hull, independent of the weapons
        // roster (which need not exist at all while Weapons is Off).
        const targets = this.opponents.flatMap((actor, index) =>
          actor.lifecycle === "destroyed"
            ? []
            : [
                liveShipBody(
                  this.carrierId(actor),
                  actor.ship,
                  actor.resources.hull - pirateCombatDamage[index],
                  (amount) => playerDamagesPirate(index, amount),
                  opponentPrevious[index],
                ),
              ],
        );
        if (this.opponents.length)
          targets.push(
            liveShipBody(
              PLAYER_BODY_ID,
              this.ship,
              this.state.resources.hull - playerCombatDamage,
              (amount) => {
                playerCombatDamage += amount;
              },
              { x: previousX, y: previousY },
            ),
          );
        if (this.salvage && this.settings.mode !== "gauntlet")
          targets.push(...this.salvage.bodies);
        this.fissionFlight.resolve(
          visualEnd - STEP / 4,
          visualEnd,
          targets,
          (body, { ignition, damage }) => {
            if (body.kind === "ship") {
              body.onDamage?.(damage);
              body.hull = Math.max(0, body.hull - damage);
            } else
              this.salvage?.applyDamage(
                body,
                damage,
                ignition.carrierId === PLAYER_BODY_ID,
              );
          },
        );
      }
      if (
        this.settings.mode !== "practice" &&
        Math.hypot(this.ship.pos.x - 960, this.ship.pos.y - 540) <
          this.star.radius + this.ship.radius
      )
        break;
    }
    // An exact-balance purchase can leave a rounding residue after the separate
    // substep debits. Preserve normal empty-battery handling for that tick.
    if (
      substeps === 4 &&
      this.state.resources.power <= Number.EPSILON &&
      this.tickIgnitions.some((event) => event.carrierId === PLAYER_BODY_ID)
    )
      this.state.resources.power = 0;
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
        if (pirate.lifecycle === "destroyed")
          return { dead: true, environment: false };
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
      const piratesDead =
        this.gauntletArrivalsIssued === GAUNTLET_ROSTER_SIZE &&
        this.opponents.length === GAUNTLET_ROSTER_SIZE &&
        pirateDeaths.every((death) => death.dead);
      const pirateEnvironmentDeath = pirateDeaths.some(
        (death) => death.environment,
      );
      if (this.settings.mode === "gauntlet" && (playerDead || piratesDead)) {
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
    this.airSample = playerAirSample(this.ship, this.planets);
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
    if (this.state.status === "PLAYING") {
      if (
        this.settings.mode === "gauntlet" &&
        this.gauntletArrivalsIssued < GAUNTLET_ROSTER_SIZE &&
        this.ticks >= this.gauntletArrivalsIssued * GAUNTLET_ARRIVAL_TICKS
      ) {
        const index = this.gauntletArrivalsIssued;
        const angle = this.clearSpawnBearing(index);
        this.opponents.push(
          createPirate(
            angle,
            (this.settings.seed ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0,
            this.settings.ion,
            `pirate-${index + 1}` as GauntletActor["id"],
          ),
        );
        this.opponentPlans.push(null);
        this.opponentCommands.push(NO_PILOT_COMMAND);
        this.gauntletArrivalsIssued++;
      }
    }
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
    if (this.state.status === "PLAYING" && this.settings.mode === "survival") {
      if (this.opponent?.lifecycle === "destroyed") {
        this.opponents.length = 0;
        this.opponentPlans.length = 0;
        this.opponentCommands.length = 0;
        this.opponentPlan = null;
        const seed =
          this.settings.seed ^
          Math.imul(this.survivalPiratesIssued, 0x85ebca6b);
        const fraction = arrivalBearing(seed) / (2 * Math.PI);
        this.nextSurvivalPirateTick =
          this.ticks + Math.round((45 + 15 * fraction) / STEP);
      } else if (this.ticks === this.nextSurvivalPirateTick) {
        const index = this.survivalPiratesIssued++;
        this.opponents.push(
          createPirate(
            this.clearSpawnBearing(index),
            (this.settings.seed ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0,
            this.settings.ion,
          ),
        );
        this.opponentPlans.push(null);
        this.opponentCommands.push(NO_PILOT_COMMAND);
        this.nextSurvivalPirateTick = Infinity;
      }
    }
  }
  replay(data: unknown) {
    const inputs = ReplaySchema.parse(data);
    for (const input of inputs)
      for (let tick = 0; tick < input.ticks; tick++) this.step(input);
  }
}
