import { Vec2 } from "@void-drift/core";
import {
  ASSEMBLED_ION_DEFAULTS,
  AssembledIonSettingsSchema,
  applyBuildEngines,
  buildDrain,
  buildStats,
  buyFissionIgnition,
  type EngineTimers,
  type FissionTick,
  LIFE_SUPPORT_DRAIN,
  PARTS,
  PartSchema,
} from "@void-drift/mode-a";
import { type BurnId, DT, inputAt, TOTAL_TICKS } from "./burns";
import { type Sample, type Track, traces } from "./calculate";
import type { ExperimentProperties, InstrumentVehicle } from "./config";

export const PAID_IGNITION_MEASURES = ["speed", "turn", "battery"] as const;
export const REFERENCE_SUPPLY = 3;

function paidParts(properties: ExperimentProperties) {
  return {
    ...PARTS,
    plasma: PartSchema.parse({ ...PARTS.plasma, ...properties.plasma }),
  };
}

export function paidFittingStats(
  { loadout }: InstrumentVehicle,
  properties: ExperimentProperties,
) {
  return buildStats(loadout, paidParts(properties));
}

/** Fixed supply instead of solar, otherwise the mounted actor's substep order. */
export function calculatePaidIgnition(
  { loadout, label }: InstrumentVehicle,
  burn: BurnId,
  color: string,
  properties: ExperimentProperties = {},
): Track {
  const parts = paidParts(properties);
  const stats = buildStats(loadout, parts);
  const ion = AssembledIonSettingsSchema.parse({
    ...ASSEMBLED_ION_DEFAULTS,
    ...properties.ion,
  });
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
  const resources = { power: stats.capacity };
  const motion = { velocity: 0 };
  const timers: EngineTimers = {};
  const frame: FissionTick = { carrierId: 0, tick: 0, readyAt: {}, events: [] };
  const samples: Sample[] = [];
  const battery: number[] = [];
  const ignitions: number[] = [];
  const record = () => {
    samples.push({
      x: ship.pos.x,
      y: ship.pos.y,
      vx: ship.vel.x,
      vy: ship.vel.y,
      spin: (motion.velocity * 180) / Math.PI,
    });
    battery.push(resources.power);
  };
  const dt = DT / 4;
  record();
  for (let tick = 0; tick < TOTAL_TICKS; tick++) {
    const pads = inputAt(burn, tick);
    const input = {
      leftThruster: pads.left,
      rightThruster: pads.right,
      fire: false,
    };
    for (let sub = 0; sub < 4; sub++) {
      const available = Math.max(
        0,
        Math.min(
          stats.capacity,
          resources.power + (REFERENCE_SUPPLY - LIFE_SUPPORT_DRAIN) * dt,
        ),
      );
      const requested = Math.max(
        0,
        (buildDrain(
          loadout,
          input,
          motion.velocity,
          dt,
          ion,
          1,
          stats.mass,
          parts,
        ) -
          LIFE_SUPPORT_DRAIN) *
          dt,
      );
      const spent = Math.min(available, requested);
      const fraction = requested > 0 ? spent / requested : 0;
      resources.power = available - spent;
      applyBuildEngines(
        ship,
        loadout,
        input,
        dt,
        fraction > 0,
        timers,
        fraction,
        motion,
        ion,
        parts,
        stats,
      );
      if (sub === 0) {
        frame.tick = tick;
        frame.events.length = 0;
        buyFissionIgnition(
          ship,
          loadout,
          input,
          resources,
          motion,
          ion,
          parts,
          stats,
          frame,
        );
        // All nozzles bought together share one point on each timeline. The
        // initial sample is still at rest; index tick+1 is the result of this tick.
        if (frame.events.length) ignitions.push(tick + 1);
      }
      ship.pos.x += ship.vel.x * dt;
      ship.pos.y += ship.vel.y * dt;
    }
    record();
  }
  return {
    label,
    color,
    samples,
    traces: { ...traces(samples), battery },
    marks: { speed: ignitions, turn: ignitions, battery: ignitions },
  };
}
