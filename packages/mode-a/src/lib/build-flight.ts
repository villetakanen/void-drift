import type { GameObject, InputState, Star } from "@void-drift/core";
import { solarCollectionRate } from "@void-drift/core";
import { buildMounts, buildNozzlePose } from "./build-renderer";
import {
  ASSEMBLED_ION_DEFAULTS,
  type AssembledIonSettings,
  ION_REFERENCE_MASS,
  STABILIZER_ENERGY,
  STABILIZER_STRENGTH,
} from "./schemas/ion";
import {
  buildStats,
  CHASSIS,
  type FlightParts,
  LIFE_SUPPORT_DRAIN,
  type Loadout,
  PARTS,
} from "./schemas/loadout";
import { lhiStabilizers, stabilizerMount } from "./stabilizers";

/** One engine impulse: transverse steering may rotate, never inflate overspeed. */
export function engineImpulse(
  ship: GameObject,
  direction: number,
  acceleration: number,
  limit: number,
  dt: number,
) {
  const speed = ship.vel.mag();
  const dx = Math.cos(direction),
    dy = Math.sin(direction);
  const along = speed > 0 ? (ship.vel.x * dx + ship.vel.y * dy) / speed : 0;
  const taper = Math.max(0, 1 - speed / limit);
  const radial = acceleration * along;
  let ax = acceleration * dx,
    ay = acceleration * dy;
  if (speed > 0 && radial > 0) {
    ax -= (ship.vel.x / speed) * radial * (1 - taper);
    ay -= (ship.vel.y / speed) * radial * (1 - taper);
  }
  ship.vel.x += ax * dt;
  ship.vel.y += ay * dt;
  const next = ship.vel.mag();
  // Even a perpendicular finite impulse adds energy unless normalized.
  const allowed = Math.max(speed, limit);
  if (next > allowed) ship.vel.mult(allowed / next);
  return Math.hypot(ax, ay) / acceleration;
}
export type EngineTimers = Record<string, number>;
/** Actual elapsed time, independent of fractional energy delivery. */
export function engineDuty(
  part: Exclude<FlightParts[keyof FlightParts], { response: "paid-ignition" }>,
  held: boolean,
  dt: number,
  timers: EngineTimers,
  key: string,
) {
  const start = timers[key] ?? 0;
  if (!held) {
    // Historical pulses cut thrust on release but keep their recovery.
    timers[key] =
      part.response === "pulse" && start > 0 && start + dt < part.pulsePeriod
        ? start + dt
        : 0;
    return 0;
  }
  timers[key] =
    part.response === "pulse" ? (start + dt) % part.pulsePeriod : start + dt;
  if (part.response === "delayed")
    return start + 1e-9 >= part.chargeSeconds ? 1 : 0;
  if (part.response === "pulse")
    return start % part.pulsePeriod < part.pulseOn ? 1 : 0;
  return 1;
}
export interface AngularMotion {
  velocity: number;
}
/** Fractional final braking burn stops at zero without reversing the spin. */
export function stabilizerBurn(
  build: Loadout,
  input: InputState,
  spin: number,
  dt: number,
  settings: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
  mass?: number,
) {
  const command = Number(input.leftThruster) - Number(input.rightThruster);
  const isLhi = !!lhiStabilizers(build.chassis);
  if ((!isLhi && !build.stabilizers) || (!command && Math.abs(spin) < 1e-10))
    return { side: 0, duty: 0 };
  const m = stabilizerMount(build.chassis);
  const direction = command || -Math.sign(spin);
  const acceleration =
    (settings.acceleration * ION_REFERENCE_MASS) /
    (mass ?? buildStats(build).mass);
  const angularAcceleration =
    (acceleration * STABILIZER_STRENGTH * Math.abs(m.lever)) / m.inertiaPerMass;
  return {
    side: -direction * Math.sign(m.lever),
    duty: command
      ? 1
      : Math.min(1, Math.abs(spin) / (angularAcceleration * dt)),
  };
}
/** Linked Fiddler drive follows the active turning/braking side, never adds torque. */
function fiddlerDrive(
  build: Loadout,
  input: InputState,
  burn: { side: number; duty: number },
) {
  if (input.leftThruster && input.rightThruster) return [1, 1] as const;
  if (!build.linkedEngines) return [0, 0] as const;
  return [
    burn.side < 0 ? burn.duty : 0,
    burn.side > 0 ? burn.duty : 0,
  ] as const;
}
export function applyBuildEngines(
  ship: GameObject,
  build: Loadout,
  input: InputState,
  dt: number,
  powered: boolean,
  timers: EngineTimers = {},
  powerFraction = 1,
  motion: AngularMotion = { velocity: 0 },
  settings: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
  parts: FlightParts = PARTS,
  stats = buildStats(build, parts),
) {
  const isWasp = build.chassis === "wasp";
  const isFiddler = build.chassis === "fiddler";
  const lhi = lhiStabilizers(build.chassis);
  const burn = stabilizerBurn(
    build,
    input,
    motion.velocity,
    dt,
    settings,
    stats.mass,
  );
  const drive = fiddlerDrive(build, input, burn);
  const output = {
    left: 0,
    right: 0,
    aft: build.aft.map(() => 0),
    stabilizers: lhi ? [0, 0, 0, 0] : [0, 0],
  };
  const chassis = CHASSIS[build.chassis];
  const m = stabilizerMount(build.chassis);
  const angle = (chassis.angle * Math.PI) / 180;
  const mainLever =
    Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX;
  const power = powered ? powerFraction : 0;
  let ix = 0,
    iy = 0,
    torque = 0;
  const ionOutputs: {
    group: "left" | "right" | "aft";
    index: number;
    duty: number;
  }[] = [];
  const otherImpulses: {
    direction: number;
    thrust: number;
    limit: number;
    group: "left" | "right" | "aft";
    index: number;
    duty: number;
  }[] = [];
  function main(
    id: keyof typeof PARTS,
    held: boolean,
    key: string,
    direction: number,
    lever: number,
    group: "left" | "right" | "aft",
    index = 0,
    commandDuty = 1,
  ) {
    const part = parts[id];
    if (part.response === "paid-ignition") return;
    const duty =
      engineDuty(part, powered && held, dt, timers, key) * commandDuty;
    const strength = part.ion?.strength ?? 0;
    const thrust = strength
      ? settings.acceleration * ION_REFERENCE_MASS * strength
      : part.thrust;
    torque += thrust * duty * lever;
    if (strength) {
      ix += Math.cos(direction) * strength * duty;
      iy += Math.sin(direction) * strength * duty;
      ionOutputs.push({ group, index, duty });
    } else
      otherImpulses.push({
        direction,
        thrust: thrust * duty,
        limit: stats.poweredCruiseCeiling,
        group,
        index,
        duty,
      });
  }
  if (isFiddler) {
    main(build.side, drive[0] > 0, "left", 0, 0, "left", 0, drive[0]);
    main(build.side, drive[1] > 0, "right", 0, 0, "right", 0, drive[1]);
  } else if (isWasp) {
    main(
      build.side,
      input.leftThruster && input.rightThruster,
      "left",
      0,
      0,
      "left",
    );
  } else {
    main(build.side, input.leftThruster, "left", angle, mainLever, "left");
    main(build.side, input.rightThruster, "right", -angle, -mainLever, "right");
  }
  for (const [index, id] of build.aft.entries())
    if (id && PARTS[id].category === "E")
      main(
        id,
        isFiddler
          ? drive[index] > 0
          : build.linkedEngines
            ? input.leftThruster || input.rightThruster
            : input.leftThruster && input.rightThruster,
        `aft-${index}`,
        0,
        0,
        "aft",
        index,
        isFiddler ? drive[index] : 1,
      );
  const strength = burn.duty * STABILIZER_STRENGTH * Number(powered);
  if (lhi) {
    const frontSide = -burn.side;
    const rearSide = burn.side;
    ix += strength * (lhi.front.fx + lhi.rear.fx);
    iy += strength * (-frontSide * lhi.front.fy + -rearSide * lhi.rear.fy);
    torque +=
      -burn.side *
      strength *
      lhi.coupledLever *
      settings.acceleration *
      ION_REFERENCE_MASS;
  } else {
    ix += strength * m.fx;
    iy += -burn.side * strength * m.fy;
    torque +=
      -burn.side *
      strength *
      m.lever *
      settings.acceleration *
      ION_REFERENCE_MASS;
  }
  const previous = motion.velocity;
  const maxTurn = (settings.maxTurn * Math.PI) / 180;
  motion.velocity = Math.max(
    -maxTurn,
    Math.min(
      maxTurn,
      previous + (torque / (stats.mass * m.inertiaPerMass)) * dt * power,
    ),
  );
  if (
    Number(input.leftThruster) === Number(input.rightThruster) &&
    burn.duty &&
    Math.abs(motion.velocity) < 1e-10
  )
    motion.velocity = 0;
  ship.rotation += motion.velocity * dt;
  function set(group: "left" | "right" | "aft", index: number, value: number) {
    if (group === "aft") output.aft[index] = value;
    else output[group] = value;
  }
  const combined = Math.hypot(ix, iy);
  const delivered =
    combined > 1e-10 && power > 0
      ? engineImpulse(
          ship,
          ship.rotation + Math.atan2(iy, ix),
          (settings.acceleration * ION_REFERENCE_MASS * combined) / stats.mass,
          stats.poweredCruiseCeiling,
          dt * power,
        )
      : 0;
  for (const o of ionOutputs) set(o.group, o.index, o.duty * delivered * power);
  // Symmetric non-ion side pairs retain their combined forward impulse.
  const l = otherImpulses.find((o) => o.group === "left");
  const r = otherImpulses.find((o) => o.group === "right");
  if (l && r && l.duty === r.duty && l.thrust > 0 && power > 0) {
    const delivery =
      engineImpulse(
        ship,
        ship.rotation,
        (2 * l.thrust * Math.cos(angle)) / stats.mass,
        l.limit,
        dt * power,
      ) *
      l.duty *
      power;
    output.left = output.right = delivery;
  }
  // Response timing remains family-specific; every installed engine shares V.
  for (const o of otherImpulses) {
    if (o.group !== "aft" && l && r && l.duty === r.duty) continue;
    if (o.thrust > 0 && power > 0)
      set(
        o.group,
        o.index,
        engineImpulse(
          ship,
          ship.rotation + o.direction,
          o.thrust / stats.mass,
          o.limit,
          dt * power,
        ) *
          o.duty *
          power,
      );
  }

  if (burn.side) {
    if (lhi) {
      if (burn.side === -1) {
        // Visual outlets are ordered front(-y,+y), rear(-y,+y). Show exhaust
        // whose moment opposes the positive turn that this command produces.
        output.stabilizers[0] = strength * power;
        output.stabilizers[3] = strength * power;
      } else {
        output.stabilizers[1] = strength * power;
        output.stabilizers[2] = strength * power;
      }
    } else {
      output.stabilizers[burn.side === -1 ? 0 : 1] = strength * power;
    }
  }
  return output;
}
export interface FissionIgnitionEvent {
  readonly carrierId: number;
  readonly tick: number;
  readonly mountKey: string;
  readonly x: number;
  readonly y: number;
  /** World exhaust direction in radians (opposite thrust). */
  readonly exhaustAngle: number;
}

export interface FissionTick {
  carrierId: number;
  tick: number;
  /** Actor-owned, separate from continuous engine timers. */
  readyAt: Record<string, number>;
  events: FissionIgnitionEvent[];
  /** Remaining live substeps with this tick's held input, in seconds. */
  reserveSeconds?: number;
}

/** Largest fraction of the unrotated kick that fits, without clamping coasting speed. */
function kickFraction(
  ship: GameObject,
  dx: number,
  dy: number,
  ceiling: number,
) {
  const kickSq = dx * dx + dy * dy;
  if (kickSq === 0) return 0;
  const speed = ship.vel.mag();
  const gap = ceiling - speed;
  // A clipped kick can land a few ulps below the ceiling. Don't sell a second
  // ignition for that rounding residue.
  const room = gap > 4 * Number.EPSILON * speed ? gap * (ceiling + speed) : 0;
  const dot = ship.vel.x * dx + ship.vel.y * dy;
  if (kickSq + 2 * dot <= room) return 1;
  if (room === 0 && dot >= 0) return 0;
  const root = Math.sqrt(dot * dot + kickSq * room);
  // Use the conjugate for forward thrust to avoid subtracting nearly equal values.
  return dot >= 0 ? room / (root + dot) : (root - dot) / kickSq;
}

/** Buys one whole commanded group, after continuous loads and before integration. */
export function buyFissionIgnition(
  ship: GameObject,
  build: Loadout,
  input: InputState,
  resources: { power: number },
  motion: AngularMotion,
  settings: AssembledIonSettings,
  parts: FlightParts,
  stats: ReturnType<typeof buildStats>,
  frame: FissionTick,
) {
  const part = parts.fusion;
  const left = input.leftThruster;
  const right = input.rightThruster;
  if (
    part.response !== "paid-ignition" ||
    (!left && !right) ||
    (build.side !== "fusion" && !build.aft.includes("fusion"))
  )
    return;

  const both = left && right;
  const fiddler = build.chassis === "fiddler";
  const linked = build.linkedEngines;
  // Group by this pad request, not by installed pairs or individual readiness.
  const commanded = buildMounts(build).filter((mount) => {
    if (mount.part !== "fusion") return false;
    if (build.chassis === "wasp") return both;
    if (fiddler) return both || (linked && (mount.index === 0 ? left : right));
    if (mount.group === "aft") return both || linked;
    return mount.index === 0 ? left : right;
  });
  const cost = commanded.length * part.energyPerIgnition;
  if (
    commanded.length === 0 ||
    resources.power < cost ||
    commanded.some((mount) => frame.tick < (frame.readyAt[mount.key] ?? 0))
  )
    return;

  let dx = 0;
  let dy = 0;
  let torque = 0;
  const rotation = ship.rotation;
  for (const mount of commanded) {
    const direction = rotation + mount.angle;
    dx += (Math.cos(direction) * part.impulse) / stats.mass;
    dy += (Math.sin(direction) * part.impulse) / stats.mass;
    if (mount.group === "side")
      torque +=
        part.impulse *
        (mount.x * Math.sin(mount.angle) - mount.y * Math.cos(mount.angle));
  }
  const fraction = kickFraction(ship, dx, dy, stats.poweredCruiseCeiling);
  if (fraction <= 0) return;

  const maxTurn = (settings.maxTurn * Math.PI) / 180;
  const inertia = stats.mass * stabilizerMount(build.chassis).inertiaPerMass;
  const spin = Math.max(
    -maxTurn,
    Math.min(maxTurn, motion.velocity + (torque * fraction) / inertia),
  );
  const remaining = frame.reserveSeconds ?? 0;
  if (remaining > 0) {
    // A single pad commands fixed duty; both pads hold the drive and the
    // stabilizer can only brake. A horizon-length duty prices that braking
    // from the post-kick spin without a motion or collection forecast.
    const reserve =
      buildDrain(
        build,
        input,
        spin,
        remaining,
        settings,
        1,
        stats.mass,
        parts,
      ) * remaining;
    if (resources.power < cost + reserve) return;
    // The live weapon reserve exceeds this fraction of a tick's load. Leave
    // the energy in the battery; the remaining substeps debit it as usual.
  }

  resources.power -= cost;
  ship.vel.x += dx * fraction;
  ship.vel.y += dy * fraction;
  motion.velocity = spin;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (const mount of commanded) {
    frame.readyAt[mount.key] = frame.tick + part.recoveryTicks;
    const nozzle = buildNozzlePose(build, mount);
    frame.events.push({
      carrierId: frame.carrierId,
      tick: frame.tick,
      mountKey: mount.key,
      x: ship.pos.x + nozzle.x * cos - nozzle.y * sin,
      y: ship.pos.y + nozzle.x * sin + nozzle.y * cos,
      exhaustAngle: rotation + nozzle.angle + Math.PI,
    });
  }
}

export function solarCharge(distance: number, star: Star, coils: number) {
  return solarCollectionRate(distance, star, coils);
}
export function buildDrain(
  build: Loadout,
  input: InputState,
  spin = 0,
  dt = 1 / 240,
  settings: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
  lightIonDrawScale = 1,
  mass?: number,
  parts: FlightParts = PARTS,
) {
  const draw = (id: keyof typeof PARTS) => {
    const part = parts[id];
    return part.response === "paid-ignition"
      ? 0
      : part.draw * (id === "ion" ? lightIonDrawScale : 1);
  };
  const burn = stabilizerBurn(build, input, spin, dt, settings, mass);
  if (build.chassis === "fiddler") {
    const drive = fiddlerDrive(build, input, burn);
    return (
      LIFE_SUPPORT_DRAIN +
      (drive[0] + drive[1]) * draw(build.side) +
      build.aft.reduce(
        (sum, id, index) => sum + (id ? draw(id) * drive[index] : 0),
        0,
      ) +
      burn.duty * STABILIZER_ENERGY * draw("ion")
    );
  }
  const count = Number(input.leftThruster) + Number(input.rightThruster);
  const isWasp = build.chassis === "wasp";
  const sideDraw = isWasp
    ? count === 2
      ? draw(build.side)
      : 0
    : count * draw(build.side);
  return (
    LIFE_SUPPORT_DRAIN +
    sideDraw +
    burn.duty * STABILIZER_ENERGY * draw("ion") +
    ((build.linkedEngines ? count > 0 : count === 2)
      ? build.aft.reduce((sum, id) => sum + (id ? draw(id) : 0), 0)
      : 0)
  );
}
