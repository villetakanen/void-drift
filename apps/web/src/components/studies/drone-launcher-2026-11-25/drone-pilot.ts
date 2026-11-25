import { type GameObject, Vec2 } from "@void-drift/core";
import { engineImpulse, STEP } from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  DEFAULT_FLIGHT,
  DRONE_ENGINE_LIMIT,
  type DroneCommand,
  droneSteering,
} from "./flight-motion";

export const EncounterSchema = z.enum(["Long pursuit", "Early departure"]);
export const PilotOptionsSchema = z
  .object({
    ranges: z.boolean(),
    encounter: EncounterSchema,
    launchRange: z.number().min(50).max(800),
    pursuitRange: z.number().min(50).max(800),
    returnRange: z.number().min(50).max(800),
  })
  .strict();
export type PilotOptions = z.infer<typeof PilotOptionsSchema>;
export const DEFAULT_PILOT = PilotOptionsSchema.parse({
  ranges: true,
  encounter: "Long pursuit",
  launchRange: 450,
  pursuitRange: 500,
  returnRange: 500,
});
export const AI_FLIGHT = { ...DEFAULT_FLIGHT, style: "Fighter" as const };
export type Destination = { x: number; y: number; vx: number; vy: number };
export type DroneMode = "Pursuit" | "Return" | "Drift";
export const COMMANDS: readonly DroneCommand[] = [
  { turn: 0, burn: false, name: "Off" },
  { turn: -1, burn: true, name: "Left" },
  { turn: 1, burn: true, name: "Right" },
  { turn: 0, burn: true, name: "Forward" },
];
export const REPLAN_TICKS = 8;
const candidates = [
  [0, 0],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 3],
  [3, 0],
  [3, 3],
] as const;
export function droneMode(
  enemyDistance: number,
  carrierDistance: number,
  options = DEFAULT_PILOT,
): DroneMode {
  return enemyDistance < options.pursuitRange
    ? "Pursuit"
    : carrierDistance < options.returnRange
      ? "Return"
      : "Drift";
}

// One fixed-tick response table, compiled from the accepted drone adapter, not
// a Scout hull. Initial spin is a table dimension. Translational speed remains
// live: every predicted impulse uses the production 271 u/s envelope.
const spinLimit = Math.PI;
const binCount = 128;
type Entry = { dx: number; dy: number; heading: number; spin: number };
let table: Entry[][] | undefined;
export function responseTable() {
  table ??= COMMANDS.map((command) =>
    Array.from({ length: binCount + 1 }, (_, i) => {
      const spin = -spinLimit + (2 * spinLimit * i) / binCount;
      const steering = droneSteering(
        0,
        spin,
        command.turn,
        STEP,
        "Fighter",
        command.burn,
      );
      const impulse =
        AI_FLIGHT.acceleration * steering.accelerationFraction * STEP;
      return {
        dx: Math.cos(steering.direction) * impulse,
        dy: Math.sin(steering.direction) * impulse,
        heading: steering.angle,
        spin: steering.angularVelocity,
      };
    }),
  );
  return table;
}
export function predictTick(body: GameObject, spin: number, command: number) {
  const coordinate = Math.max(
    0,
    Math.min(binCount, ((spin + spinLimit) / (2 * spinLimit)) * binCount),
  );
  const low = Math.min(binCount - 1, Math.floor(coordinate));
  const fraction = coordinate - low;
  const entries = responseTable()[command];
  const a = entries[low],
    b = entries[low + 1];
  const dx = a.dx + (b.dx - a.dx) * fraction;
  const dy = a.dy + (b.dy - a.dy) * fraction;
  const impulse = Math.hypot(dx, dy);
  if (impulse > 0)
    engineImpulse(
      body,
      body.rotation + Math.atan2(dy, dx),
      impulse / STEP,
      DRONE_ENGINE_LIMIT,
      STEP,
    );
  body.rotation += a.heading + (b.heading - a.heading) * fraction;
  body.pos.x += body.vel.x * STEP;
  body.pos.y += body.vel.y * STEP;
  return a.spin + (b.spin - a.spin) * fraction;
}
export function planDrone(
  body: GameObject,
  initialSpin: number,
  target: Destination,
  mode: DroneMode,
) {
  let best = { command: 0, continuation: 0, score: Infinity };
  for (const [first, continuation] of candidates) {
    const predicted: GameObject = {
      ...body,
      pos: body.pos.clone(),
      vel: body.vel.clone(),
      acc: new Vec2(0, 0),
    };
    let spin = initialSpin;
    for (let tick = 0; tick < 72; tick++)
      spin = predictTick(predicted, spin, tick < 18 ? first : continuation);
    const dx = target.x + target.vx * 1.2 - predicted.pos.x;
    const dy = target.y + target.vy * 1.2 - predicted.pos.y;
    const distance = Math.hypot(dx, dy);
    const bearing = Math.atan2(dy, dx) - predicted.rotation;
    const alignment = Math.abs(
      Math.atan2(Math.sin(bearing), Math.cos(bearing)),
    );
    // Pursue the centre; there is no pirate standoff, hazard or energy model.
    // Return also values matching the carrier's velocity, without completing recovery.
    const relativeSpeed = Math.hypot(
      predicted.vel.x - target.vx,
      predicted.vel.y - target.vy,
    );
    const score =
      distance +
      alignment * Math.min(mode === "Return" ? 60 : 20, distance / 4) +
      (mode === "Return" ? relativeSpeed * 0.8 : 0) +
      Number(first !== continuation) * 0.2;
    if (score < best.score) best = { command: first, continuation, score };
  }
  return best;
}

export function createDronePilot(options = DEFAULT_PILOT) {
  let mode: DroneMode = "Drift";
  let nextPlan = 0;
  let command = 0;
  let continuation = 0;
  let enemyDistance = Infinity;
  let carrierDistance = Infinity;
  return {
    get state() {
      return {
        mode,
        nextPlan,
        command,
        continuation,
        enemyDistance,
        carrierDistance,
      };
    },
    command(
      body: GameObject,
      spin: number,
      enemy: Destination,
      carrier: Destination,
      tick: number,
    ) {
      enemyDistance = Math.hypot(enemy.x - body.pos.x, enemy.y - body.pos.y);
      carrierDistance = Math.hypot(
        carrier.x - body.pos.x,
        carrier.y - body.pos.y,
      );
      const nextMode = droneMode(enemyDistance, carrierDistance, options);
      if (nextMode !== mode) nextPlan = tick;
      mode = nextMode;
      if (mode === "Drift") {
        command = 0;
        continuation = 0;
        nextPlan = tick;
      } else if (tick >= nextPlan) {
        const plan = planDrone(
          body,
          spin,
          mode === "Pursuit" ? enemy : carrier,
          mode,
        );
        command = plan.command;
        continuation = plan.continuation;
        nextPlan = tick + REPLAN_TICKS;
      }
      return COMMANDS[command];
    },
  };
}

/** A single launch opportunity; losing range during the preview cancels it. */
export function createLaunchGate(range: number, earliest = 1) {
  let readyAt: number | undefined;
  let launched = false;
  return {
    step(time: number, distance: number) {
      if (launched) return { seated: false, release: false };
      if (distance > range) readyAt = undefined;
      else if (time >= earliest - 0.1 - 1e-9 && readyAt === undefined)
        readyAt = Math.max(earliest, time + 0.1);
      const release =
        readyAt !== undefined && time + 1e-9 >= readyAt && distance <= range;
      if (release) launched = true;
      return { seated: readyAt !== undefined && !release, release };
    },
  };
}

/** Staged smooth flybys, continuous position and velocity; no target teleports. */
export function enemyRoute(
  time: number,
  encounter = DEFAULT_PILOT.encounter,
): Destination {
  const knots =
    encounter === "Long pursuit"
      ? [
          { t: 0, x: 300, y: 30, vx: 60, vy: 20 },
          { t: 7, x: 850, y: -30, vx: 90, vy: -40 },
          { t: 11, x: 100, y: -350, vx: -140, vy: 0 },
          { t: 14, x: -100, y: -200, vx: -30, vy: 35 },
        ]
      : [
          { t: 0, x: 300, y: 30, vx: 60, vy: 20 },
          { t: 2, x: 350, y: 50, vx: -100, vy: -100 },
          { t: 5, x: -500, y: -300, vx: -150, vy: 0 },
          { t: 14, x: -650, y: -200, vx: 0, vy: 0 },
        ];
  const end = knots.findIndex((k) => k.t >= time);
  const i = Math.max(1, end < 0 ? knots.length - 1 : end);
  const a = knots[i - 1],
    b = knots[i];
  const dt = b.t - a.t,
    u = Math.max(0, Math.min(1, (time - a.t) / dt));
  function sample(p: number, q: number, v: number, w: number) {
    return {
      p:
        (2 * u * u * u - 3 * u * u + 1) * p +
        (u * u * u - 2 * u * u + u) * dt * v +
        (-2 * u * u * u + 3 * u * u) * q +
        (u * u * u - u * u) * dt * w,
      v:
        ((6 * u * u - 6 * u) * p +
          (3 * u * u - 4 * u + 1) * dt * v +
          (-6 * u * u + 6 * u) * q +
          (3 * u * u - 2 * u) * dt * w) /
        dt,
    };
  }
  const x = sample(a.x, b.x, a.vx, b.vx),
    y = sample(a.y, b.y, a.vy, b.vy);
  return { x: 460 + x.p, y: 1040 + y.p, vx: x.v, vy: y.v };
}
