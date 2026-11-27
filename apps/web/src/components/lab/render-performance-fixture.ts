import {
  EnginePlume,
  FissionExhaust,
  type FissionExhaustPose,
  type FxPass,
  Vec2,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildMounts,
  buildNozzlePose,
  buildPlumeEmitters,
  defaultLoadout,
  drawBuild,
} from "@void-drift/mode-a";
import { advanceRenderModelHeading } from "./render-model-fixture";

export const ENGINE_PROFILES = {
  baseline: "Baseline · Wasp",
  mixed: "Mixed · Fighter",
  coincident: "Coincident · Fighter",
} as const;
export type EngineProfile = keyof typeof ENGINE_PROFILES;
export const FISSION_CADENCE = 48;
const TICKS_PER_SECOND = 60;
const MAX_CAPTURE_TICKS = 60;
const PLASMA_BURN_TICKS = 12;

export function engineProfileDetail(profile: EngineProfile, count: number) {
  if (profile === "baseline") {
    return `${count === 1 ? "one ion main plume" : "alternating ion/plasma main plumes"}, stabilizers and three synchronized ion beams per Wasp`;
  }
  const engines =
    profile === "mixed"
      ? "2 Fission + 1 Ion + 1 cycling Plasma per Fighter"
      : "4 Fission per Fighter";
  return `${engines}; all Fission nozzles ignite together every ${FISSION_CADENCE} ticks at 60 Hz; no beams or contacts`;
}

/** A scripted stage, not a flight or battery simulation. All cells share one
 * coordinate system (stage pixels divided by cell scale), so a single production
 * painter can cull and prioritize across the entire stage under the shared pass.
 */
export function createMultiMountFixture(
  profile: Exclude<EngineProfile, "baseline">,
  centers: readonly { x: number; y: number }[],
  scale: number,
) {
  const build = defaultLoadout("fighter");
  build.side = "fusion";
  build.aft = profile === "mixed" ? ["ion", "plasma"] : ["fusion", "fusion"];
  const nozzles = buildMounts(build)
    .filter((mount) => mount.part === "fusion")
    .map((mount) => buildNozzlePose(build, mount));
  const exhaust = new FissionExhaust();
  const cells = centers.map(({ x, y }) => ({
    ship: {
      pos: new Vec2(x / scale, y / scale),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 0,
    },
    plume: new EnginePlume(),
    emitters: buildPlumeEmitters(build),
  }));
  const ignitions: FissionExhaustPose[] = [];
  let captured = 0;
  function advance(time: number, heading: number, dt: number) {
    const tick = Math.floor(time * TICKS_PER_SECOND + 1e-9);
    // Match the production painter's bounded unpresented history after a stall.
    const first = Math.max(captured + 1, tick - MAX_CAPTURE_TICKS + 1);
    let fired = 0;
    for (let t = first; t <= tick; t++) {
      if ((t - 1) % FISSION_CADENCE === 0) {
        const angle = advanceRenderModelHeading(
          heading,
          t / TICKS_PER_SECOND - time,
        );
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        for (const { ship } of cells) {
          for (const nozzle of nozzles) {
            ignitions.push({
              x: ship.pos.x + nozzle.x * cos - nozzle.y * sin,
              y: ship.pos.y + nozzle.x * sin + nozzle.y * cos,
              exhaustAngle: angle + nozzle.angle + Math.PI,
            });
          }
        }
      }
      exhaust.capture(t, ignitions);
      fired += ignitions.length;
      ignitions.length = 0;
    }
    captured = tick;
    if (profile === "mixed") {
      const phase = (tick - 1) % FISSION_CADENCE;
      for (const { ship, plume, emitters } of cells) {
        // Fitted main outlets are side pair, then aft pair; no duty plume on Fission.
        const ion = emitters[2];
        const plasma = emitters[3];
        ship.rotation = heading;
        ion.output = 1;
        plasma.output = phase < PLASMA_BURN_TICKS ? 1 : 0;
        plasma.thrustSeconds = phase / TICKS_PER_SECOND;
        plasma.charge = plasma.output
          ? undefined
          : (phase - PLASMA_BURN_TICKS) / (FISSION_CADENCE - PLASMA_BURN_TICKS);
        plume.stepMounted(dt, ship, emitters);
      }
    }
    return fired;
  }

  return {
    advance,
    scale,
    drawWorld(ctx: CanvasRenderingContext2D, heading: number) {
      for (const { ship } of cells)
        drawBuild(
          ctx,
          build,
          ship.pos.x,
          ship.pos.y,
          heading,
          BUILD_FLIGHT_SCALE,
        );
    },
    stampFx(ctx: CanvasRenderingContext2D, pass: FxPass) {
      if (profile === "mixed")
        for (const { plume } of cells) plume.stamp(ctx, pass);
      exhaust.stamp(ctx, pass);
    },
    drawLfx(ctx: CanvasRenderingContext2D, pass: FxPass) {
      exhaust.live(ctx, pass);
      if (profile === "mixed")
        for (const { plume } of cells) plume.drawCharge(ctx);
    },
  };
}
