import { EnginePlume, type FxPass, Vec2 } from "@void-drift/core";
import {
  ASSEMBLED_ION_DEFAULTS,
  applyBuildEngines,
  buildPlumeEmitters,
  defaultLoadout,
  ION_CANNON,
  type Loadout,
} from "@void-drift/mode-a";

export const RENDER_MODEL_CENTER = { x: 960, y: 540 } as const;
export const RENDER_MODEL_TURN_RATE =
  (ASSEMBLED_ION_DEFAULTS.maxTurn * Math.PI) / 180;

export function advanceRenderModelHeading(heading: number, dt: number) {
  return (heading + RENDER_MODEL_TURN_RATE * dt) % (Math.PI * 2);
}

export function isIonBeamPulseActive(time: number) {
  return time % ION_CANNON.cooldown < ION_CANNON.flashSeconds;
}

/** Real Wasp fittings and production plume outlets for the isolated render sample. */
export function createRenderModelFixture() {
  const build: Loadout = defaultLoadout("wasp");
  const emitters = buildPlumeEmitters(build);
  const plume = new EnginePlume();
  const ship = {
    pos: new Vec2(RENDER_MODEL_CENTER.x, RENDER_MODEL_CENTER.y),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 0,
  };

  function advance(dt: number, heading: number) {
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
    for (let index = 0; index < 4; index++)
      emitters[index + 1].output = outputs.stabilizers[index];
    plume.stepMounted(dt, ship, emitters);
    return outputs;
  }

  function stamp(ctx: CanvasRenderingContext2D, pass: FxPass) {
    plume.stamp(ctx, pass);
  }

  return { build, emitters, plume, ship, advance, stamp };
}
