import { Vec2 } from "@void-drift/core";
import {
  applyBuildEngines,
  type EngineTimers,
  ION_DEFAULTS,
  IonSettingsSchema,
  type Loadout,
  LoadoutSchema,
  PARTS,
  PartSchema,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { type BurnId, inputAt } from "./burns";
import { DT, TOTAL_TICKS } from "./movement-bench";
import type { PathSeries } from "./path-instrument";

// Wraps a game schema (separate Zod instance) so its own rules still apply.
type Issue = { path: (string | number)[]; message: string };
function gameSchema<T>(schema: {
  safeParse(
    v: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: Issue[] } };
}) {
  return z.unknown().transform((value, ctx) => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    for (const issue of result.error.issues)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    return z.NEVER;
  });
}

// Parameters the production engine calculation reads per vehicle. Ion tuning is
// shared by light and heavy ions and the stabilisers; it also caps turn rate.
const PartChange = z
  .object({
    thrust: z.number().finite().positive(),
    limit: z.number().finite().positive(),
    chargeSeconds: z.number().finite().min(0).max(5),
    pulsePeriod: z.number().finite().positive(),
    pulseOn: z.number().finite().positive(),
  })
  .partial()
  .strict();
export const VehicleChanges = z
  .object({
    ion: gameSchema(IonSettingsSchema.partial().strict()),
    fusion: PartChange,
    plasma: PartChange,
  })
  .partial()
  .strict();
export type VehicleChanges = z.infer<typeof VehicleChanges>;

export const InstrumentVehicle = z
  .object({
    label: z.string().min(1),
    loadout: gameSchema<Loadout>(LoadoutSchema),
    changes: VehicleChanges.default({}),
  })
  .strict();
export const InstrumentConfig = z
  .object({
    version: z.literal(1),
    /** One of the instrument's fixed 14-second input programs. */
    burn: z.enum(["course", "turn", "weave"]).default("course"),
    vehicles: z.array(InstrumentVehicle).min(1).max(6),
  })
  .strict();
export type InstrumentConfig = z.infer<typeof InstrumentConfig>;
export type InstrumentVehicle = z.infer<typeof InstrumentVehicle>;

export type Family = "ion" | "fusion" | "plasma";
export type Parameter = { key: string; label: string; unit: string };
export const PARAMETERS: Record<Family, Parameter[]> = {
  ion: [
    { key: "acceleration", label: "Acceleration", unit: "u/s²" },
    { key: "maxSpeed", label: "Speed ceiling", unit: "u/s" },
    { key: "bonus", label: "Heavy ceiling bonus", unit: "×" },
    { key: "falloff", label: "Bonus falloff", unit: "" },
    { key: "maxTurn", label: "Turn cap", unit: "°/s" },
  ],
  fusion: [
    { key: "thrust", label: "Thrust", unit: "force" },
    { key: "limit", label: "Speed ceiling", unit: "u/s" },
    { key: "pulsePeriod", label: "Pulse period", unit: "s" },
    { key: "pulseOn", label: "Pulse on", unit: "s" },
  ],
  plasma: [
    { key: "thrust", label: "Thrust", unit: "force" },
    { key: "limit", label: "Speed ceiling", unit: "u/s" },
    { key: "chargeSeconds", label: "Charge delay", unit: "s" },
  ],
};
export function stockValue(family: Family, key: string): number {
  const source: Record<string, unknown> =
    family === "ion" ? ION_DEFAULTS : PARTS[family];
  const value = source[key];
  return typeof value === "number" ? value : Number.NaN;
}

/** Engine families a loadout uses; stabilisers count as ion. */
export function familiesOf(loadout: Loadout): Family[] {
  const ids = new Set<string>([loadout.side]);
  for (const id of loadout.aft) if (id) ids.add(id);
  if (loadout.stabilizers) ids.add("ion");
  const out: Family[] = [];
  if (ids.has("ion") || ids.has("heavy-ion")) out.push("ion");
  if (ids.has("fusion")) out.push("fusion");
  if (ids.has("plasma")) out.push("plasma");
  return out;
}

// Frozen: the chassis names this study showed before the 2026-11-02 rename.
const CHASSIS_NAMES: Record<Loadout["chassis"], string> = {
  fiddler: "LHI Fiddler",
  wasp: "LHI Wasp",
  scout: "Scout",
  fighter: "Fighter",
  corvette: "Heavy Corvette",
};
const PART_NAMES: Record<string, string> = {
  ion: "light ion",
  "heavy-ion": "heavy ion",
  fusion: "fusion",
  plasma: "plasma",
};
export function describeLoadout(loadout: Loadout) {
  const aft = loadout.aft.filter((id): id is NonNullable<typeof id> => !!id);
  const aftText = aft.length
    ? `${aft.length}× ${[...new Set(aft)].map((id) => PART_NAMES[id] ?? id).join(" + ")} aft`
    : "no aft";
  return `${CHASSIS_NAMES[loadout.chassis]} · ${PART_NAMES[loadout.side]} sides · ${aftText}${loadout.stabilizers ? " · stabilisers" : ""}`;
}
export function describeChanges(changes: VehicleChanges) {
  return Object.entries(changes)
    .flatMap(([family, values]) =>
      Object.entries(values ?? {}).map(([key, v]) => `${family}.${key} ${v}`),
    )
    .join(", ");
}

/**
 * Calculates one vehicle on one of the instrument's burns with the production
 * engine function. Not included: gravity, power limits, part mass changes.
 */
export function calculate(vehicle: InstrumentVehicle, burn: BurnId = "course") {
  const { loadout, changes } = vehicle;
  const parts = {
    ...PARTS,
    fusion: PartSchema.parse({ ...PARTS.fusion, ...changes.fusion }),
    plasma: PartSchema.parse({ ...PARTS.plasma, ...changes.plasma }),
  };
  const ion = IonSettingsSchema.parse({ ...ION_DEFAULTS, ...changes.ion });
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
  const timers: EngineTimers = {};
  const motion = { velocity: 0 };
  const samples: PathSeries["samples"] = [];
  const record = () =>
    samples.push({
      x: ship.pos.x,
      y: ship.pos.y,
      vx: ship.vel.x,
      vy: ship.vel.y,
      spin: (motion.velocity * 180) / Math.PI,
    });
  record();
  for (let tick = 0; tick < TOTAL_TICKS; tick++) {
    const input = inputAt(burn, tick);
    for (let sub = 0; sub < 4; sub++) {
      applyBuildEngines(
        ship,
        loadout,
        { leftThruster: input.left, rightThruster: input.right, fire: false },
        DT / 4,
        true,
        timers,
        1,
        motion,
        ion,
        parts,
      );
      ship.pos.x += (ship.vel.x * DT) / 4;
      ship.pos.y += (ship.vel.y * DT) / 4;
    }
    record();
  }
  return samples;
}
