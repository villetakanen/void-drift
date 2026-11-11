import { EnginePlume, type FxPass, Vec2 } from "@void-drift/core";
import {
  ASSEMBLED_ION_DEFAULTS,
  applyBuildEngines,
  BUILD_FLIGHT_SCALE,
  buildCollisionRadius,
  buildPlumeEmitters,
  defaultLoadout,
  drawBuild,
  drawIonBeamMark,
  ION_CANNON,
  type Loadout,
} from "@void-drift/mode-a";

export const RENDER_MODEL_CENTER = { x: 960, y: 540 } as const;
export const RENDER_MODEL_TURN_RATE =
  (ASSEMBLED_ION_DEFAULTS.maxTurn * Math.PI) / 180;
export const RENDER_MODEL_BEAM_OFFSETS = (build: Loadout) => {
  const sweep = buildCollisionRadius(build) + 8;
  return [-sweep, 0, sweep] as const;
};

export function advanceRenderModelHeading(heading: number, dt: number) {
  return (heading + RENDER_MODEL_TURN_RATE * dt) % (Math.PI * 2);
}

export function isIonBeamPulseActive(time: number) {
  return time % ION_CANNON.cooldown < ION_CANNON.flashSeconds;
}

/** Real Wasp fittings and production plume outlets for isolated render samples. */
export function createRenderModelFixture(
  center: { x: number; y: number } = RENDER_MODEL_CENTER,
  engine: "ion" | "plasma" = "ion",
) {
  const build: Loadout = defaultLoadout("wasp");
  build.side = engine;
  const emitters = buildPlumeEmitters(build);
  const plume = new EnginePlume();
  const ship = {
    pos: new Vec2(center.x, center.y),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 0,
  };

  let thrustSeconds = 0;
  function advance(dt: number, heading: number) {
    thrustSeconds = dt > 0 ? thrustSeconds + dt : 0;
    const motion = { velocity: RENDER_MODEL_TURN_RATE };
    const outputs = applyBuildEngines(
      ship,
      build,
      { leftThruster: true, rightThruster: false, fire: false },
      dt,
      true,
      {},
      1,
      motion,
    );
    ship.rotation = heading;
    emitters[0].output = 1;
    emitters[0].thrustSeconds = thrustSeconds;
    for (let index = 0; index < 4; index++)
      emitters[index + 1].output = outputs.stabilizers[index];
    plume.stepMounted(dt, ship, emitters);
    return outputs;
  }

  function stamp(ctx: CanvasRenderingContext2D, pass: FxPass, scale = 1) {
    plume.stamp(ctx, pass, undefined, undefined, (x, y, radius) => ({
      x: center.x + (x - center.x) * scale,
      y: center.y + (y - center.y) * scale,
      radius: radius * scale,
    }));
  }

  function drawWorld(ctx: CanvasRenderingContext2D, heading: number) {
    drawBuild(ctx, build, center.x, center.y, heading, BUILD_FLIGHT_SCALE);
  }

  function drawLfx(ctx: CanvasRenderingContext2D, pulse: boolean) {
    if (!pulse) return;
    for (const y of RENDER_MODEL_BEAM_OFFSETS(build)) {
      ctx.save();
      ctx.translate(center.x - ION_CANNON.range / 2, center.y + y);
      drawIonBeamMark(ctx, ION_CANNON.range, ION_CANNON.range, false);
      ctx.restore();
    }
  }

  function stampFx(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    pulse: boolean,
    scale = 1,
  ) {
    stamp(ctx, pass, scale);
    if (!pulse) return;
    for (const y of RENDER_MODEL_BEAM_OFFSETS(build)) {
      const x = center.x - ION_CANNON.range / 2;
      const py = center.y + y;
      const visibleX = center.x + (x - center.x) * scale;
      const visibleY = center.y + (py - center.y) * scale;
      if (
        !pass.visible(visibleX, visibleY, ION_CANNON.range * scale) ||
        !pass.budget.take(true)
      )
        continue;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = pass.opacity;
      ctx.translate(x, py);
      drawIonBeamMark(ctx, ION_CANNON.range, ION_CANNON.range, true);
      ctx.restore();
    }
  }

  return {
    build,
    emitters,
    plume,
    ship,
    advance,
    stamp,
    drawWorld,
    drawLfx,
    stampFx,
  };
}
