import { updatePlanetOrbit } from "@void-drift/core";
import {
  buildStats,
  type Loadout,
  type PartId,
  SALVAGE,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { type BurnId, inputAt, TOTAL_TICKS } from "../instrument/burns";
import type { FlightSceneDocument } from "./config";
import type { FlightExperiment, FlightExperimentRun } from "./experiment";
import { mainEngines, type PartTuning, tunedParts } from "./light";
import { atmosphereSample } from "./planet";

// The simulation half of the instrument: no canvas, so it runs anywhere.
// Staging happens here, from the Lab side: the game has no code for placed or
// held wrecks, the instrument writes the fields the game already reads.

export type TargetMode = "none" | "placed" | "held";

/** Placed when the document has targets, else held, else none. */
export function defaultTargets(doc: FlightSceneDocument): TargetMode {
  if (doc.targets.length) return "placed";
  return doc.held ? "held" : "none";
}

/** The target modes a document supports, in menu order. */
export function targetModes(doc: FlightSceneDocument): TargetMode[] {
  return [
    "none",
    ...(doc.targets.length ? (["placed"] as const) : []),
    ...(doc.held ? (["held"] as const) : []),
  ];
}

export const HELD_ID = 100;
const PLACED_ID = 101;

function wreck(id: number, x: number, y: number) {
  return {
    id,
    group: id,
    kind: "wreck" as const,
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    radius: SALVAGE.wreck.radius,
    hull: SALVAGE.wreck.hull,
    life: SALVAGE.wreck.life,
    rotation: 0,
  };
}

/** One burn flown through the production simulation, one tick at a time. */
export class FlightRun {
  tick = 0;
  sim: Simulation;
  experimentRun?: FlightExperimentRun;
  private ignitions: Simulation["fissionIgnitions"] = [];
  private contacts: Simulation["fissionContacts"] = [];

  /** Latest paid group and latest contact step at or before the selected tick. */
  get fission() {
    return { ignitions: this.ignitions, contacts: this.contacts };
  }

  constructor(
    readonly doc: FlightSceneDocument,
    readonly burn: BurnId,
    readonly targets: TargetMode = defaultTargets(doc),
    /** Engine parts a study paints itself; their production plume stays dark. */
    readonly replaces: readonly PartId[] = [],
    /** Tuning of the delayed and pulsed parts; the game's values when empty. */
    readonly tuning: PartTuning = {},
    readonly experiment?: FlightExperiment,
  ) {
    this.sim = this.build();
    this.experimentRun = this.experiment?.create(this.sim);
  }

  /** Hull of a placed wreck by its document index; zero once it is gone. */
  targetHull(index: number): { current: number; maximum: number } | null {
    if (
      this.targets !== "placed" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.doc.targets.length
    )
      return null;
    const body = this.sim.salvage?.bodies.find(
      (item) => item.id === PLACED_ID + index && item.kind === "wreck",
    );
    return {
      current: Math.max(0, body?.hull ?? 0),
      maximum: SALVAGE.wreck.hull,
    };
  }

  get lost() {
    return this.sim.state.status === "PLAYING"
      ? null
      : { seconds: this.sim.ticks * STEP, cause: this.sim.state.deathCause };
  }

  /** Flies the burn again from its start. */
  restart() {
    this.tick = 0;
    this.ignitions = [];
    this.contacts = [];
    this.sim = this.build();
    this.experimentRun = this.experiment?.create(this.sim);
  }

  /** A fresh simulation of the document, staged and started. */
  private build(): Simulation {
    const { doc } = this;
    const loadout: Loadout = doc.loadout;
    const sim = new Simulation({
      ...stockSettings(loadout.chassis),
      loadout,
      experimental: "On", // Lab runs are unscored, including unsanctioned fittings.
      mode: doc.system || doc.planet ? "practice" : "derelicts",
    });
    if (doc.planet) {
      const planet = sim.planets.find((item) => item.id === "venus");
      if (!planet) throw new Error("Practice Venus reference unavailable");
      sim.planets.splice(0, sim.planets.length, planet);
      planet.orbitAngle = doc.planet.orbitAngle;
      updatePlanetOrbit(planet, 0);
    }
    sim.parts = tunedParts(this.tuning);
    const salvage = sim.salvage;
    if (salvage) {
      // The scene supplies its own targets instead of waiting for encounters.
      salvage.nextPass = Infinity;
      if (this.targets === "placed")
        for (const [index, { x, y }] of doc.targets.entries())
          salvage.bodies.push({
            ...wreck(PLACED_ID + index, x, y),
            spin: doc.wreckSpin,
          });
    }
    if (doc.start) {
      sim.ship.pos.set(doc.start.x, doc.start.y);
      sim.ship.rotation = doc.start.rotation;
      if (doc.start.velocity)
        sim.ship.vel.set(doc.start.velocity.x, doc.start.velocity.y);
    }
    sim.start();
    return sim;
  }

  /** Holds the wreck ahead of the ship; a broken one is replaced. */
  private hold() {
    const held = this.doc.held;
    const { salvage, ship } = this.sim;
    if (!salvage || !held || this.targets !== "held") return;
    const x = ship.pos.x + Math.cos(ship.rotation) * held.distance;
    const y = ship.pos.y + Math.sin(ship.rotation) * held.distance;
    // The game keeps shards for good; a wreck replaced all burn would bury the
    // scene, so the held wreck's shards expire by the game's own expiry.
    for (const shard of salvage.bodies)
      if (
        shard.kind === "fragment" &&
        shard.group === HELD_ID &&
        shard.life === undefined
      )
        shard.life = held.shardLife;
    let body = salvage.bodies.find(
      (b) => b.id === HELD_ID && b.kind === "wreck",
    );
    if (!body) {
      body = wreck(HELD_ID, x, y);
      salvage.bodies.push(body);
    }
    Object.assign(body, {
      x,
      y,
      previousX: x,
      previousY: y,
      vx: ship.vel.x,
      vy: ship.vel.y,
      life: SALVAGE.wreck.life,
    });
  }

  /**
   * Steps the plume again with the replaced engines at no output, so the game's
   * light pass paints every other outlet and leaves these to the study. The
   * plume holds current outlets only; the flight itself is untouched.
   */
  private silence() {
    if (!this.replaces.length) return;
    const replaced = new Set(
      mainEngines(this.doc.loadout)
        .filter((engine) => this.replaces.includes(engine.part))
        .map((engine) => engine.index),
    );
    if (!replaced.size) return;
    this.sim.plume.stepMounted(
      STEP,
      this.sim.ship,
      this.sim.emitters.map((emitter, index) =>
        replaced.has(index)
          ? { ...emitter, output: 0, charge: undefined, thrustSeconds: 0 }
          : emitter,
      ),
    );
  }

  /** One tick of the burn's input; true when the ship wrapped round the arena. */
  advance(): boolean {
    const input = inputAt(this.burn, this.tick);
    const wraps = this.sim.wraps;
    this.hold();
    this.sim.step({
      leftThruster:
        this.tick >= (this.doc.encounter?.restTicks ?? 0) && input.left,
      rightThruster:
        this.tick >= (this.doc.encounter?.restTicks ?? 0) && input.right,
      fire: false,
    });
    if (this.sim.fissionIgnitions.length)
      this.ignitions = [...this.sim.fissionIgnitions];
    if (this.sim.fissionContacts.length)
      this.contacts = [...this.sim.fissionContacts];
    const air = this.doc.planet?.atmosphere;
    if (air && this.sim.state.status === "PLAYING") {
      const sample = atmosphereSample(
        this.sim.ship,
        this.sim.planets[0],
        air.depth,
      );
      const retain = Math.exp(-air.dragRate * sample.density * STEP);
      this.sim.ship.vel.set(
        sample.vx + (this.sim.ship.vel.x - sample.vx) * retain,
        sample.vy + (this.sim.ship.vel.y - sample.vy) * retain,
      );
    }
    this.tick++;
    for (const impulse of this.doc.impulses) {
      if (impulse.tick !== this.tick) continue;
      const delta =
        impulse.backwardMomentum / buildStats(this.doc.loadout).mass;
      this.sim.ship.vel.x -= Math.cos(this.sim.ship.rotation) * delta;
      this.sim.ship.vel.y -= Math.sin(this.sim.ship.rotation) * delta;
    }
    if (this.sim.state.status === "PLAYING")
      this.experimentRun?.step(this.sim, this.tick);
    this.silence();
    return wraps !== this.sim.wraps;
  }

  /**
   * Flies to `target`, clamped to the burn; a backward jump starts again.
   * `each` sees every tick flown, with the ticks still to go.
   */
  seek(target: number, each?: (wrapped: boolean, remaining: number) => void) {
    const to = Math.max(0, Math.min(TOTAL_TICKS, Math.round(target)));
    if (to < this.tick) this.restart();
    while (this.tick < to) {
      const wrapped = this.advance();
      each?.(wrapped, to - this.tick);
    }
  }
}
