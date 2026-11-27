import { fieldRate, PositionedEnergyFieldSchema } from "@void-drift/core";
import {
  ASSEMBLED_ION_DEFAULTS,
  AssembledIonSettingsSchema,
  buildDrain,
  buildStats,
  LIFE_SUPPORT_DRAIN,
  PARTS,
  PaidIgnitionPartSchema,
  PartSchema,
} from "@void-drift/mode-a";
import { z } from "zod";
import { type BurnId, DT, inputAt } from "./burns";
import type { Sample } from "./calculate";
import type { ExperimentProperties, InstrumentVehicle } from "./config";
import { gameSchema } from "./external-schema";
export const CollectionField = gameSchema(PositionedEnergyFieldSchema);
/** Energy-only analysis: never feeds capacity or starvation back into motion. */
export const EnergyAnalysis = z
  .object({
    fields: z.array(CollectionField).max(12),
    lifeSupport: z.number().finite().nonnegative().default(LIFE_SUPPORT_DRAIN),
    ionDraw: z.number().finite().nonnegative().default(PARTS.ion.draw),
    feedback: z.literal("excluded").default("excluded"),
  })
  .strict();
export type EnergyAnalysis = z.infer<typeof EnergyAnalysis>;
export const ENERGY_MEASURES = [
  "collection",
  "consumption",
  "netPower",
  "batteryChange",
] as const;
export function energyTraces(
  samples: Sample[],
  vehicle: InstrumentVehicle,
  burn: BurnId,
  energy: EnergyAnalysis,
  properties: ExperimentProperties = {},
) {
  const ion = AssembledIonSettingsSchema.parse({
    ...ASSEMBLED_ION_DEFAULTS,
    ...properties.ion,
  });
  const parts = {
    ...PARTS,
    fusion: PaidIgnitionPartSchema.parse({
      ...PARTS.fusion,
      ...properties.fusion,
    }),
    plasma: PartSchema.parse({ ...PARTS.plasma, ...properties.plasma }),
  };
  const { coils: collectors, mass } = buildStats(vehicle.loadout, parts);
  const collection = samples.map((s) =>
    energy.fields.reduce(
      (sum, field) =>
        sum +
        fieldRate(Math.hypot(s.x - field.x, s.y - field.y), field) * collectors,
      0,
    ),
  );
  const consumption = samples.map((s, tick) => {
    const input = inputAt(burn, Math.max(0, tick - 1));
    const draw = buildDrain(
      vehicle.loadout,
      { leftThruster: input.left, rightThruster: input.right, fire: false },
      (s.spin * Math.PI) / 180,
      DT / 4,
      ion,
      1,
      mass,
      parts,
    );
    // Only Light ion and its stabilizers are rescaled; other families keep their costs.
    const withoutIon = buildDrain(
      vehicle.loadout,
      { leftThruster: input.left, rightThruster: input.right, fire: false },
      (s.spin * Math.PI) / 180,
      DT / 4,
      ion,
      0,
      mass,
      parts,
    );
    return (
      (s.ignitionEnergy ?? 0) / DT +
      energy.lifeSupport +
      withoutIon -
      LIFE_SUPPORT_DRAIN +
      ((draw - withoutIon) * energy.ionDraw) / PARTS.ion.draw
    );
  });
  const netPower = collection.map((value, tick) => value - consumption[tick]);
  let total = 0;
  const batteryChange = netPower.map((net, tick) => {
    if (tick) total += net * DT;
    return total;
  });
  return { collection, consumption, netPower, batteryChange };
}
