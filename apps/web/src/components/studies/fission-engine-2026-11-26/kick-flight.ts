import {
  applyYellowFamilyProfile,
  buildStats,
  defaultLoadout,
  engineImpulse,
  GRAVITY_TUNING,
  type Loadout,
  LoadoutSchema,
  STEP,
  YELLOW_FAMILY_RADIUS,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  type FlightExperiment,
  FlightRun,
  FlightSceneDocumentSchema,
  mainEngines,
  type PartTuning,
} from "../../../lib/flight-scene";
import { createBlastPainter } from "./channel-blast";

// Fission engine 02.5: the engine's push as a kick. A study flight rule on a
// single-engine Wasp, so that one engine's behaviour can be read without
// another's mixed in. The rule is the study's; nothing here is production
// flight. The explosion's light is 02.4's, set off once per kick.

export const HoldingSchema = z.enum(["Repeats while held", "One per press"]);
export const CeilingSchema = z.enum(["Tapers", "Overshoots", "Holds fire"]);

export const KickSchema = z
  .object({
    version: z.literal(1),
    /** Speed one kick adds along the ship's heading, in u/s, before any taper. */
    gain: z.number().min(20).max(300),
    /** Ticks the kick is delivered over; 1 is all at once. */
    ticks: z.number().int().min(1).max(11),
    /** Seconds from one kick to the next. It runs whatever the pads do. */
    wait: z.number().min(0.3).max(2),
    holding: HoldingSchema,
    ceiling: CeilingSchema,
    /** Seconds for speed above the ceiling to halve, when kicks overshoot. */
    bleed: z.number().min(0.1).max(3),
  })
  .strict();
export type Kick = z.infer<typeof KickSchema>;

/**
 * The game's fission engine written as a kick: 0.18 s of thrust is 11 ticks at
 * 631.6 u/s² on this Wasp, 116 u/s in all, every 0.45 s while held, tapering
 * at the shared ceiling.
 */
export const TODAY_KICK: Kick = KickSchema.parse({
  version: 1,
  gain: 116,
  ticks: 11,
  wait: 0.45,
  holding: "Repeats while held",
  ceiling: "Tapers",
  bleed: 0.5,
});

/** The working assumption from 02.5, 26 November 2026. */
export const ASSUMED_KICK: Kick = KickSchema.parse({
  version: 1,
  gain: 78,
  ticks: 1,
  wait: 0.3,
  holding: "Repeats while held",
  ceiling: "Holds fire",
  bleed: 0.5,
});

export const ENGINES = ["service-ion", "ion", "heavy-ion", "plasma"] as const;
export type ReferenceEngine = (typeof ENGINES)[number];
type Engine = ReferenceEngine | "fusion";

/** The Wasp with one engine and nothing else fitted. */
export const wasp = (engine: Engine): Loadout =>
  LoadoutSchema.parse({ ...defaultLoadout("wasp"), side: engine });
export const FISSION_WASP = wasp("fusion");
/** The stock cruise ceiling of the fission Wasp, in u/s. */
export const CEILING = buildStats(FISSION_WASP).poweredCruiseCeiling;

/**
 * The scene: 1,100 u from the star, heading along a chord of the arena that
 * stays far from it. The flight rule shrinks the star so that no burn feels
 * gravity.
 */
export const KICK_SCENE = {
  loadout: FISSION_WASP,
  start: { x: 160, y: 1300, rotation: -Math.PI / 2 },
  opening: { burn: "course", view: "2x", tick: 31 },
};

/**
 * The production fission engine is left fitted but made inert: next to no
 * thrust, lit for its whole period, and with its cruise contribution raised
 * so the game's own ceiling never cuts its output. Its output is then above
 * zero exactly while both pads are held, and the flight rule reads that as
 * the pilot's input. The kick itself comes from the rule.
 */
export const INERT_FISSION: PartTuning = {
  fusion: {
    thrust: 1,
    pulsePeriod: 0.45,
    pulseOn: 0.45,
    speedContribution: 5000,
  },
};

/** A quiet field: the smallest yellow-family star and no planets. */
function quiet(sim: Parameters<FlightExperiment["create"]>[0]) {
  applyYellowFamilyProfile(sim.star, YELLOW_FAMILY_RADIUS.min, GRAVITY_TUNING);
  sim.planets.length = 0;
}
const QUIET_FIELD: FlightExperiment = {
  label: "No gravity",
  create(sim) {
    quiet(sim);
    return { step() {} };
  },
};

export interface KickReadout {
  speed: number;
  kicks: number;
  /** Speed the last finished kick added; absent before the first. */
  lastGain?: number;
}

/**
 * The kick rule and its light. Each tick after the game's own step: a kick
 * starts if the pads ask for one, the wait is over and the ceiling allows it;
 * a kick under way adds its share of speed along the ship's heading.
 */
export function kickExperiment(
  kickInput: unknown,
  blast?: unknown,
  show?: unknown,
  report?: (readout: KickReadout) => void,
): FlightExperiment {
  const kick = KickSchema.parse(kickInput);
  const waitTicks = Math.round(kick.wait / STEP);
  const engine = mainEngines(FISSION_WASP).find((e) => e.part === "fusion");
  if (!engine) throw new Error("The fission Wasp has no fission engine");
  return {
    label: "02.5 fission kick",
    create(sim) {
      quiet(sim);
      const painter = blast ? createBlastPainter(blast, show) : undefined;
      const { ship } = sim;
      let now = 0;
      let wait = 0;
      let left = 0;
      let was = false;
      let armed = false;
      let kicks = 0;
      let from = 0;
      let lastGain: number | undefined;
      const speed = () => Math.hypot(ship.vel.x, ship.vel.y);
      return {
        step(_, tick) {
          now = tick;
          const emitter = sim.emitters[engine.index];
          const held = (emitter?.output ?? 0) > 0;
          // A press is spent by its kick, and lost if the pads are let go.
          if (held && !was) armed = true;
          if (!held) armed = false;
          was = held;
          if (wait > 0) wait--;
          const heading = ship.rotation + (emitter?.angle ?? 0);
          const dx = Math.cos(heading);
          const dy = Math.sin(heading);
          const asked = kick.holding === "One per press" ? armed : held;
          // Holds fire: a kick goes off only if the whole of it fits.
          const fits =
            kick.ceiling !== "Holds fire" ||
            Math.hypot(
              ship.vel.x + dx * kick.gain,
              ship.vel.y + dy * kick.gain,
            ) <=
              CEILING + 0.5;
          if (asked && left === 0 && wait === 0 && fits && emitter) {
            left = kick.ticks;
            wait = waitTicks;
            armed = false;
            kicks++;
            from = speed();
            const cos = Math.cos(ship.rotation);
            const sin = Math.sin(ship.rotation);
            painter?.ignite(
              {
                x: ship.pos.x + emitter.x * cos - emitter.y * sin,
                y: ship.pos.y + emitter.x * sin + emitter.y * cos,
                angle: heading + Math.PI,
                tick,
              },
              tick * STEP,
            );
          }
          if (left > 0) {
            const share = kick.gain / kick.ticks;
            // Tapers is the game's rule for every engine, through its own code
            // and in the four substeps the game takes each tick.
            if (kick.ceiling === "Tapers")
              for (let i = 0; i < 4; i++)
                engineImpulse(ship, heading, share / STEP, CEILING, STEP / 4);
            else {
              ship.vel.x += dx * share;
              ship.vel.y += dy * share;
            }
            left--;
            if (left === 0) lastGain = speed() - from;
          } else if (kick.ceiling === "Overshoots") {
            // Nothing in the game slows a ship above its ceiling; this does.
            const v = speed();
            if (v > CEILING)
              ship.vel.mult(
                (CEILING + (v - CEILING) * 0.5 ** (STEP / kick.bleed)) / v,
              );
          }
          report?.({ speed: speed(), kicks, lastGain });
        },
        passes: painter
          ? [
              {
                id: "study-fission-kick-live",
                name: "Fission kick live light",
                layer: "lfx",
                space: "world",
                draws: "The flash, lance and particle tips of each kick",
                source: "study/fission-engine/channel-blast.ts",
                draw(frame, ctx) {
                  const { pos, radius } = frame.sim.ship;
                  painter.lfx(
                    ctx,
                    { x: pos.x, y: pos.y, radius },
                    now,
                    now * STEP,
                  );
                },
              },
            ]
          : undefined,
        fx: painter
          ? (ctx, pass) => painter.fx(ctx, pass, now, now * STEP)
          : undefined,
      };
    },
  };
}

/** Seconds at which the recorded table reads each curve. */
export const READ_AT = [0.1, 0.2, 0.5, 1, 2, 3, 6] as const;
const HELD_TICKS = 6 / STEP;

/** Speed at every tick with both pads held for 6 s from rest, without gravity. */
function heldSpeeds(
  loadout: Loadout,
  experiment: FlightExperiment,
  tuning: PartTuning = {},
): number[] {
  // Burn B2 holds both pads for its first 6 s.
  const run = new FlightRun(
    FlightSceneDocumentSchema.parse({ ...KICK_SCENE, loadout }),
    "turn",
    "none",
    [],
    tuning,
    experiment,
  );
  const speeds = [0];
  for (let tick = 0; tick < HELD_TICKS; tick++) {
    run.advance();
    speeds.push(Math.hypot(run.sim.ship.vel.x, run.sim.ship.vel.y));
  }
  return speeds;
}
/** One of the game's engines alone on the Wasp, as the game flies it. */
export const referenceSpeeds = (engine: Engine) =>
  heldSpeeds(wasp(engine), QUIET_FIELD);
/** The fission Wasp under a kick rule. */
export const kickSpeeds = (kick: unknown) =>
  heldSpeeds(FISSION_WASP, kickExperiment(kick), INERT_FISSION);
