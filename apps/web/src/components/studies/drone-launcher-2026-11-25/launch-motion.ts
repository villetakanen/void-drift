import { z } from "zod";

export const LaunchOptionsSchema = z
  .object({
    releaseSeconds: z.number().min(0.5).max(5),
    ejectSpeed: z.number().min(20).max(180),
    ignitionDistance: z.number().min(5).max(100),
    acceleration: z.number().min(0).max(180),
  })
  .strict();
export const DEFAULT_LAUNCH = LaunchOptionsSchema.parse({
  releaseSeconds: 1,
  ejectSpeed: 70,
  ignitionDistance: 32,
  acceleration: 60,
});
export type LaunchOptions = z.infer<typeof LaunchOptionsSchema>;
export type Release = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  time: number;
  distance?: number;
};

/** Ballistic launch base: ignition distance is relative to inherited drift.
 * Powered flight takes over from the exact ignition state in flight-motion.ts. */
export function launchSample(
  release: Release,
  time: number,
  options: LaunchOptions,
) {
  const age = Math.max(0, time - release.time);
  const travelled = release.distance ?? 0;
  const ignitionAge =
    Math.max(0, options.ignitionDistance - travelled) / options.ejectSpeed;
  const distance = options.ejectSpeed * age;
  const speed = options.ejectSpeed;
  const c = Math.cos(release.angle),
    s = Math.sin(release.angle);
  return {
    x: release.x + release.vx * age + c * distance,
    y: release.y + release.vy * age + s * distance,
    vx: release.vx + c * speed,
    vy: release.vy + s * speed,
    angle: release.angle,
    distance: travelled + distance,
    powered: age >= ignitionAge,
    ignitionTime: release.time + ignitionAge,
  };
}

export const PREVIEW_SECONDS = 0.1;
export function previewVisible(time: number, nextLaunch: number) {
  return time >= nextLaunch - PREVIEW_SECONDS - 1e-9 && time < nextLaunch;
}

export type CarrierPose = Omit<Release, "time" | "distance">;
export type Rail = { x: number; y: number; angle: number; length: number };
export type RailLaunch = { time: number; release?: Release };

function railPose(carrier: CarrierPose, rail: Rail, distance: number) {
  const angle = carrier.angle + rail.angle;
  return {
    x:
      carrier.x +
      rail.x * Math.cos(carrier.angle) -
      rail.y * Math.sin(carrier.angle) +
      distance * Math.cos(angle),
    y:
      carrier.y +
      rail.x * Math.sin(carrier.angle) +
      rail.y * Math.cos(carrier.angle) +
      distance * Math.sin(angle),
    vx: carrier.vx,
    vy: carrier.vy,
    angle,
  };
}

/** The centre stays on the moving rail until it reaches the muzzle. Interpolate
 * the carrier at the exact crossing, so a sub-tick handoff has no position jump. */
export function railLaunchSample(
  launch: RailLaunch,
  previous: CarrierPose,
  carrier: CarrierPose,
  time: number,
  step: number,
  rail: Rail,
  options: LaunchOptions,
) {
  const clearanceTime = launch.time + rail.length / options.ejectSpeed;
  if (time < clearanceTime) {
    const distance = Math.max(0, time - launch.time) * options.ejectSpeed;
    const pose = railPose(carrier, rail, distance);
    return {
      ...pose,
      distance,
      powered: false,
      ignitionTime:
        launch.time +
        Math.max(rail.length, options.ignitionDistance) / options.ejectSpeed,
      onRail: true,
    };
  }
  if (!launch.release) {
    const fraction = Math.max(
      0,
      Math.min(1, (clearanceTime - (time - step)) / step),
    );
    const angleDelta = Math.atan2(
      Math.sin(carrier.angle - previous.angle),
      Math.cos(carrier.angle - previous.angle),
    );
    const crossing = {
      x: previous.x + (carrier.x - previous.x) * fraction,
      y: previous.y + (carrier.y - previous.y) * fraction,
      vx: previous.vx + (carrier.vx - previous.vx) * fraction,
      vy: previous.vy + (carrier.vy - previous.vy) * fraction,
      angle: previous.angle + angleDelta * fraction,
    };
    const muzzle = railPose(crossing, rail, rail.length);
    const angularSpeed = angleDelta / step; // radians per second
    launch.release = {
      ...muzzle,
      vx: crossing.vx - angularSpeed * (muzzle.y - crossing.y),
      vy: crossing.vy + angularSpeed * (muzzle.x - crossing.x),
      time: clearanceTime,
      distance: rail.length,
    };
  }
  return { ...launchSample(launch.release, time, options), onRail: false };
}
