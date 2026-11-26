import { type GameObject, Vec2 } from "@void-drift/core";
import { applyBuildEngines, engineImpulse } from "./build-flight";
import { ASSEMBLED_ION_DEFAULTS, ION_REFERENCE_MASS } from "./schemas/ion";
import { buildStats, CHASSIS, defaultLoadout, PARTS } from "./schemas/loadout";

const STEP = 1 / 60;
const DRONE_TURN_MULTIPLIER = 3;
export const DRONE_ACCELERATION = 90;
export const DRONE_ENGINE_LIMIT = 279;
type Destination = { x: number; y: number; vx: number; vy: number };
type DroneCommand = { turn: number; burn: boolean; name: string };
const fighter = defaultLoadout("fighter");
const fighterStats = buildStats(fighter);
/** Borrow the stabilized Fighter's torque AND canted thrust vector, without
 * adopting its mass, energy system or speed envelope for the drone. */
export function droneSteering(
  angle: number,
  spin: number,
  turn: number,
  dt: number,
  mainEnabled = true,
) {
  const reference: GameObject = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: angle,
    radius: 3,
  };
  // Run the Fighter stabilizer in its own angular units.
  const motion = { velocity: spin / DRONE_TURN_MULTIPLIER };
  const settings = {
    acceleration: ASSEMBLED_ION_DEFAULTS.acceleration,
    maxTurn: ASSEMBLED_ION_DEFAULTS.maxTurn,
  };
  const output = applyBuildEngines(
    reference,
    fighter,
    {
      leftThruster: mainEnabled && turn >= 0,
      rightThruster: mainEnabled && turn <= 0,
      fire: false,
    },
    dt,
    true,
    {},
    1,
    motion,
    settings,
    PARTS,
    fighterStats,
  );
  const forwardAcceleration =
    (2 *
      Math.cos((CHASSIS.fighter.angle * Math.PI) / 180) *
      settings.acceleration *
      ION_REFERENCE_MASS) /
    fighterStats.mass;
  const fighterTurn = reference.rotation - angle;
  const droneTurn = fighterTurn * DRONE_TURN_MULTIPLIER;
  return {
    angle: angle + droneTurn,
    angularVelocity: motion.velocity * DRONE_TURN_MULTIPLIER,
    direction:
      Math.atan2(reference.vel.y, reference.vel.x) + (droneTurn - fighterTurn),
    accelerationFraction:
      dt > 0 ? reference.vel.mag() / (forwardAcceleration * dt) : 0,
    mainFraction: (output.left + output.right) / 2,
  };
}

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
  [1, 1],
  [2, 0],
  [2, 3],
  [2, 2],
  [3, 0],
  [3, 3],
] as const;
// One fixed-tick response table, compiled from the accepted drone adapter, not
// a Scout hull. Initial spin is a table dimension. Translational speed remains
// live: every predicted impulse uses the production speed envelope.
const spinLimit =
  (ASSEMBLED_ION_DEFAULTS.maxTurn * Math.PI * DRONE_TURN_MULTIPLIER) / 180;
const binCount = 128;
type Entry = { dx: number; dy: number; heading: number; spin: number };
let table: Entry[][] | undefined;
export function responseTable() {
  table ??= COMMANDS.map((command) =>
    Array.from({ length: binCount + 1 }, (_, i) => {
      const spin = -spinLimit + (2 * spinLimit * i) / binCount;
      const steering = droneSteering(0, spin, command.turn, STEP, command.burn);
      const impulse = DRONE_ACCELERATION * steering.accelerationFraction * STEP;
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
  mode: "Return" | "Pursuit",
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
