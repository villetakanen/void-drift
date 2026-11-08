import { Vec2 } from "@void-drift/core";
import {
  CHASSIS,
  engineImpulse,
  ION_DEFAULTS,
  ION_REFERENCE_MASS,
  ionCeiling,
  ionStrength,
  PARTS,
} from "@void-drift/mode-a";

export const REFERENCE_MASS = ION_REFERENCE_MASS;
export const LIGHT_FORCE = ION_DEFAULTS.acceleration * ION_REFERENCE_MASS;
// Collinear, centreline fixtures isolate force addition from mount angles/torque.
export const forceConfigurations = [
  { label: "One Light ion", engines: ["ion"], color: "#5ce5e7" },
  { label: "Two Light ions", engines: ["ion", "ion"], color: "#ffbd69" },
  {
    label: "Light + Heavy ion",
    engines: ["ion", "heavy-ion"],
    color: "#c8fa64",
  },
  {
    label: "Light + Plasma (2× Light)",
    engines: ["ion", "plasma"],
    color: "#c49bff",
  },
] as const;
export function forceComposition(
  index: number,
  fitted: boolean,
  plasmaReady: boolean,
) {
  const config = forceConfigurations[index];
  const contributions = config.engines.map((id) => ({
    id,
    force:
      id === "plasma"
        ? plasmaReady
          ? 2 * LIGHT_FORCE
          : 0
        : ionStrength(id) * LIGHT_FORCE,
  }));
  const force = contributions.reduce((sum, item) => sum + item.force, 0);
  const fittedMass =
    CHASSIS.fighter.mass +
    config.engines.reduce((sum, id) => sum + PARTS[id].mass, 0);
  const mass = fitted ? fittedMass : REFERENCE_MASS;
  return {
    ...config,
    contributions,
    force,
    mass,
    fittedMass,
    acceleration: force / mass,
    ceiling: ionCeiling(force / LIGHT_FORCE),
  };
}
// Sample the real radial impulse at a specified speed; no time integration/animation.
export function forwardAcceleration(
  force: number,
  mass: number,
  ceiling: number,
  speed: number,
) {
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(speed, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
  if (force <= 0) return 0;
  engineImpulse(ship, 0, force / mass, ceiling, 1 / 240);
  return (ship.vel.x - speed) * 240;
}
