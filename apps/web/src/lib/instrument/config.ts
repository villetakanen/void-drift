import {
	ASSEMBLED_ION_DEFAULTS,
	AssembledIonSettingsSchema,
	type Loadout,
	LoadoutSchema,
	PARTS,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { BURN_IDS } from "./burns";
import { EnergyAnalysis } from "./energy";

// The Motion instrument's configuration document: what an agent writes, the
// designer adjusts in the pane, and is copied back. Vehicles are game loadouts;
// properties are sparse overrides shared across the experiment.

import { gameSchema } from "./external-schema";

// Supported production values shared by every vehicle in an experiment.
const PartChange = z
	.object({
		thrust: z.number().finite().positive(),
		speedContribution: z.number().finite().min(0),
		chargeSeconds: z.number().finite().min(0).max(5),
		pulsePeriod: z.number().finite().positive(),
		pulseOn: z.number().finite().positive(),
	})
	.partial()
	.strict();
export const ExperimentProperties = z
	.object({
		ion: gameSchema(AssembledIonSettingsSchema.partial().strict()),
		fusion: PartChange,
		plasma: PartChange,
	})
	.partial()
	.strict();
export type ExperimentProperties = z.infer<typeof ExperimentProperties>;

export const InstrumentVehicle = z
	.object({
		label: z.string().min(1),
		loadout: gameSchema<Loadout>(LoadoutSchema),
	})
	.strict();
export type InstrumentVehicle = z.infer<typeof InstrumentVehicle>;

export const InstrumentConfig = z
	.object({
		version: z.literal(1),
		burn: z.enum(BURN_IDS).default("course"),
		properties: ExperimentProperties.default({}),
		vehicles: z.array(InstrumentVehicle).min(1).max(6),
		energy: EnergyAnalysis.optional(),
	})
	.strict();
export type InstrumentConfig = z.infer<typeof InstrumentConfig>;

export type Family = "ion" | "fusion" | "plasma";
export type Parameter = { key: string; label: string; unit: string };
export const PARAMETERS: Record<Family, Parameter[]> = {
	ion: [
		{ key: "acceleration", label: "Acceleration", unit: "u/s²" },
		{ key: "maxTurn", label: "Turn cap", unit: "°/s" },
	],
	fusion: [
		{ key: "thrust", label: "Thrust", unit: "force" },
		{ key: "speedContribution", label: "Cruise contribution", unit: "u/s" },
		{ key: "pulsePeriod", label: "Pulse period", unit: "s" },
		{ key: "pulseOn", label: "Pulse on", unit: "s" },
	],
	plasma: [
		{ key: "thrust", label: "Thrust", unit: "force" },
		{ key: "speedContribution", label: "Cruise contribution", unit: "u/s" },
		{ key: "chargeSeconds", label: "Charge delay", unit: "s" },
	],
};
export function stockValue(family: Family, key: string): number {
	const source: Record<string, unknown> =
		family === "ion" ? ASSEMBLED_ION_DEFAULTS : PARTS[family];
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

/** The document as text, leaving out empty shared-property groups. */
export function familiesIn(vehicles: InstrumentVehicle[]): Family[] {
	const used = new Set(vehicles.flatMap(({ loadout }) => familiesOf(loadout)));
	return (["ion", "fusion", "plasma"] as const).filter((family) =>
		used.has(family),
	);
}

export function serialize(config: InstrumentConfig): string {
	const { properties, ...rest } = config;
	const kept = Object.fromEntries(
		Object.entries(properties).filter(
			([, values]) => values && Object.keys(values).length,
		),
	);
	return JSON.stringify(
		Object.keys(kept).length ? { ...rest, properties: kept } : rest,
		null,
		2,
	);
}
