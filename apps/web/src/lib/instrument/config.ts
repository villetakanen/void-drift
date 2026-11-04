import {
	ION_DEFAULTS,
	IonSettingsSchema,
	type Loadout,
	LoadoutSchema,
	PARTS,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { BURN_IDS } from "./burns";

// The Motion instrument's configuration document: what an agent writes, the
// designer adjusts in the pane, and is copied back. Each vehicle is a game
// loadout plus a sparse list of changes; the burn is one of the fixed set.

type Issue = { path: (string | number)[]; message: string };
// Wraps a game schema (separate Zod instance) so its own rules still apply.
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
export type InstrumentVehicle = z.infer<typeof InstrumentVehicle>;

export const InstrumentConfig = z
	.object({
		version: z.literal(1),
		burn: z.enum(BURN_IDS).default("course"),
		vehicles: z.array(InstrumentVehicle).min(1).max(6),
	})
	.strict();
export type InstrumentConfig = z.infer<typeof InstrumentConfig>;

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

/** The document as text, leaving out empty change groups. */
export function serialize(config: InstrumentConfig): string {
	return JSON.stringify(
		{
			...config,
			vehicles: config.vehicles.map(({ changes, ...rest }) => {
				const kept = Object.fromEntries(
					Object.entries(changes).filter(
						([, values]) => values && Object.keys(values).length > 0,
					),
				);
				return Object.keys(kept).length ? { ...rest, changes: kept } : rest;
			}),
		},
		null,
		2,
	);
}
