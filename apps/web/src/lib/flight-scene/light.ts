import type { FxPass } from "@void-drift/core";
import {
  type Loadout,
  PARTS,
  PartSchema,
  type Simulation,
  STEP,
} from "@void-drift/mode-a";
import type { ExperimentProperties } from "../instrument/config";

export type EngineId = Loadout["side"];

// A study's own light in the Flight scene instrument. The instrument has no
// drawing of its own; a study that proposes a light for an engine supplies it
// here, and the instrument paints it where the game would paint that engine's
// plume. Everything else in the frame stays the game's.

/** One main engine at an instant, as a study's light sees it. */
export interface EngineLight {
  part: EngineId;
  /** The simulation's mount key: `left`, `right` or `aft-N`. */
  key: string;
  /** The nozzle in world units, and the direction the engine thrusts along. */
  x: number;
  y: number;
  angle: number;
  /** Seconds the engine has been held; 0 when released or without power. */
  held: number;
  /** Progress through the part's charge, 0 to 1; 1 for a part without one. */
  charge: number;
  /** The part's charge in seconds, as this flight is tuned; 0 without one. */
  chargeSeconds: number;
  /** The output the game's plume would be painted with this tick, 0 to 1. */
  output: number;
}

export interface StudyLightState {
  tick: number;
  /** Seconds of flight. */
  time: number;
  ship: { x: number; y: number; rotation: number; vx: number; vy: number };
  /** The loadout's main engines, in mount order. */
  engines: readonly EngineLight[];
}

/** What a study supplies; both painters draw in world units. */
export interface StudyLight {
  /** Shown beside the scene, so study drawing is never taken for the game's. */
  label: string;
  /** Engine parts whose production plume stays dark; the study paints them. */
  replaces: readonly EngineId[];
  /** Fresh emission into the persistent FX surface, once a tick. */
  fx?(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    state: StudyLightState,
  ): void;
  /** Live light on LFX, redrawn for the frame shown. */
  lfx?(ctx: CanvasRenderingContext2D, state: StudyLightState): void;
}

/**
 * Experiment-wide tuning of the delayed and pulsed engine parts, the same
 * values the Motion instrument exposes. The game's definitions are never
 * changed; a flight runs on tuned copies.
 */
export type PartTuning = Pick<ExperimentProperties, "fusion" | "plasma">;

/** The game's parts with a flight's tuning applied; the game's own when untuned. */
export function tunedParts(tuning: PartTuning = {}): typeof PARTS {
  if (!tuning.fusion && !tuning.plasma) return PARTS;
  return {
    ...PARTS,
    fusion: PartSchema.parse({ ...PARTS.fusion, ...tuning.fusion }),
    plasma: PartSchema.parse({ ...PARTS.plasma, ...tuning.plasma }),
  };
}

/** A loadout's main engines in the simulation's emitter order, with their keys. */
export function mainEngines(
  loadout: Loadout,
): { index: number; key: string; part: EngineId }[] {
  const engines =
    loadout.chassis === "wasp"
      ? [{ key: "left", part: loadout.side }]
      : [
          { key: "left", part: loadout.side },
          { key: "right", part: loadout.side },
          ...loadout.aft.flatMap((id, index) =>
            id && PARTS[id].category === "E"
              ? [{ key: `aft-${index}`, part: id as EngineId }]
              : [],
          ),
        ];
  return engines.map((engine, index) => ({ index, ...engine }));
}

/** The state a study's light is painted from, read from the simulation. */
export function studyLightState(
  sim: Simulation,
  loadout: Loadout,
  tick: number,
): StudyLightState {
  const { ship } = sim;
  const cos = Math.cos(ship.rotation),
    sin = Math.sin(ship.rotation);
  return {
    tick,
    time: tick * STEP,
    ship: {
      x: ship.pos.x,
      y: ship.pos.y,
      rotation: ship.rotation,
      vx: ship.vel.x,
      vy: ship.vel.y,
    },
    engines: mainEngines(loadout).flatMap(({ index, key, part }) => {
      const emitter = sim.emitters[index];
      if (!emitter) return [];
      const held = sim.engineSeconds[key] ?? 0;
      const { chargeSeconds } = sim.parts[part];
      return [
        {
          part,
          key,
          x: ship.pos.x + emitter.x * cos - emitter.y * sin,
          y: ship.pos.y + emitter.x * sin + emitter.y * cos,
          angle: ship.rotation + emitter.angle,
          held,
          charge: chargeSeconds > 0 ? Math.min(1, held / chargeSeconds) : 1,
          chargeSeconds,
          output: emitter.output,
        },
      ];
    }),
  };
}
