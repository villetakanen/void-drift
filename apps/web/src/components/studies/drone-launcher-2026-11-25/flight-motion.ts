import { BeamSchema, type GameObject, Vec2 } from "@void-drift/core";
import {
  ASSEMBLED_ION_DEFAULTS,
  applyBuildEngines,
  buildStats,
  CHASSIS,
  defaultLoadout,
  engineImpulse,
  ION_REFERENCE_MASS,
  LIGHT_ION_BEAM,
  PARTS,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  type CarrierPose,
  DEFAULT_LAUNCH,
  LaunchOptionsSchema,
  launchSample,
  type Rail,
  type RailLaunch,
  railLaunchSample,
} from "./launch-motion";

export const FlightStyleSchema = z.enum(["Wasp", "Fighter", "Scout"]);
export const FlightOptionsSchema = LaunchOptionsSchema.extend({
  style: FlightStyleSchema,
  plumeSize: z.number().min(0).max(100),
}).strict();
export type FlightOptions = z.infer<typeof FlightOptionsSchema>;
export type FlightStyle = z.infer<typeof FlightStyleSchema>;
export const DEFAULT_FLIGHT = FlightOptionsSchema.parse({
  ...DEFAULT_LAUNCH,
  style: "Wasp",
  plumeSize: 50,
});
/** Production world units: an engine envelope, never a velocity clamp. */
export const DRONE_ENGINE_LIMIT = 271;
const fighter = defaultLoadout("fighter");
const fighterStats = buildStats(fighter);
export const FLIGHT_PROFILES = {
  Wasp: { maxTurn: 120, response: 1 },
  Fighter: { maxTurn: ASSEMBLED_ION_DEFAULTS.maxTurn, response: 1 },
  Scout: { maxTurn: 200, response: 2 },
} satisfies Record<FlightStyle, { maxTurn: number; response: number }>;

/** Borrow the stabilized Fighter's torque AND canted thrust vector, without
 * adopting its mass, energy system or speed envelope for the drone. */
export function droneSteering(
  angle: number,
  spin: number,
  turn: number,
  dt: number,
  style: FlightStyle,
  mainEnabled = true,
) {
  const reference: GameObject = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: angle,
    radius: 3,
  };
  const motion = { velocity: spin };
  const profile = FLIGHT_PROFILES[style];
  const settings = {
    acceleration: ASSEMBLED_ION_DEFAULTS.acceleration * profile.response,
    maxTurn: profile.maxTurn,
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
  return {
    angle: reference.rotation,
    angularVelocity: motion.velocity,
    direction: Math.atan2(reference.vel.y, reference.vel.x),
    accelerationFraction:
      dt > 0 ? reference.vel.mag() / (forwardAcceleration * dt) : 0,
    mainFraction: (output.left + output.right) / 2,
  };
}

/** Study colour, production Service → Light Ion source envelopes. */
export function droneBeam(size: number) {
  const service = PARTS["service-ion"].ion?.beam;
  if (!service) throw new Error("Service Ion beam missing");
  const mix = FlightOptionsSchema.shape.plumeSize.parse(size) / 100;
  return BeamSchema.parse({
    length: service.length + (LIGHT_ION_BEAM.length - service.length) * mix,
    width: service.width + (LIGHT_ION_BEAM.width - service.width) * mix,
    ink: "41,186,255",
  });
}

/** All three interpret the same repeating, ignition-relative pilot script. */
export function flightCommand(age: number) {
  const phase = Math.floor((Math.max(0, age) + 1e-9) / 0.5) % 4;
  if (phase === 0) return { turn: -1, burn: true, name: "Left" };
  if (phase === 2) return { turn: 1, burn: true, name: "Right" };
  return { turn: 0, burn: true, name: "Forward" };
}

type LaunchSample = ReturnType<typeof railLaunchSample>;
export type DroneSample = Omit<LaunchSample, "distance"> & {
  output: number;
  angularVelocity: number;
  command: string;
};
export type DroneFlight = RailLaunch & {
  body?: GameObject;
  sample?: DroneSample;
};

/** One bounded body per launch, stepped only by the host's fixed simulation tick.
 * Rail attachment and ballistic handoff remain the accepted launch calculation. */
export type DroneCommand = { turn: number; burn: boolean; name: string };
export type DronePilot = (body: GameObject, spin: number) => DroneCommand;

export function stepDrone(
  drone: DroneFlight,
  previous: CarrierPose,
  carrier: CarrierPose,
  time: number,
  step: number,
  rail: Rail,
  options: FlightOptions,
  pilot?: DronePilot,
): DroneSample {
  const ballistic = { ...options, acceleration: 0 };
  const free = railLaunchSample(
    drone,
    previous,
    carrier,
    time,
    step,
    rail,
    ballistic,
  );
  if (!free.powered) {
    drone.sample = {
      ...free,
      output: 0,
      angularVelocity: 0,
      command: free.onRail ? "On rails" : "Coasting",
    };
    return drone.sample;
  }
  let dt = step;
  if (!drone.body) {
    // The ignition boundary can fall inside a tick; preserve the exact ballistic
    // position and full inherited velocity before integrating only its remainder.
    if (!drone.release)
      throw new Error("Drone ignited before muzzle clearance");
    const ignition = launchSample(drone.release, free.ignitionTime, ballistic);
    drone.body = {
      pos: new Vec2(ignition.x, ignition.y),
      vel: new Vec2(ignition.vx, ignition.vy),
      acc: new Vec2(0, 0),
      rotation: ignition.angle,
      radius: 3,
    };
    dt = Math.max(0, time - free.ignitionTime);
  }
  const body = drone.body;
  const command =
    pilot?.(body, drone.sample?.angularVelocity ?? 0) ??
    flightCommand(time - free.ignitionTime - dt / 2);
  const steering = droneSteering(
    body.rotation,
    drone.sample?.angularVelocity ?? 0,
    command.turn,
    dt,
    options.style,
    command.burn,
  );
  const angularVelocity = steering.angularVelocity;
  body.rotation = steering.angle;
  const burning = options.style !== "Wasp" || command.turn === 0;
  const delivered =
    burning &&
    options.acceleration > 0 &&
    steering.accelerationFraction > 0 &&
    dt > 0
      ? engineImpulse(
          body,
          steering.direction,
          options.acceleration * steering.accelerationFraction,
          DRONE_ENGINE_LIMIT,
          dt,
        )
      : 0;
  // Stabilizer force participates in steering, but never lights the main nozzle.
  const output = delivered * steering.mainFraction;
  body.pos.x += body.vel.x * dt;
  body.pos.y += body.vel.y * dt;
  drone.sample = {
    x: body.pos.x,
    y: body.pos.y,
    vx: body.vel.x,
    vy: body.vel.y,
    angle: body.rotation,
    ignitionTime: free.ignitionTime,
    powered: true,
    onRail: false,
    output,
    angularVelocity,
    command: command.name,
  };
  return drone.sample;
}
