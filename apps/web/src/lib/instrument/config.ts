import {
	GRAVITY_TUNING,
	GravityFieldSchema,
	type GravityTuning,
	ION_DEFAULTS,
	IonSettingsSchema,
	type Loadout,
	LoadoutSchema,
	PARTS,
	type ShipStart,
	ShipStartSchema,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import { BURN_IDS, V2_BURN_IDS } from "./burns";
import { fieldSimulation, type InstrumentField } from "./field";

// The Lab instrument's configuration document: what an agent writes, the
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

const InstrumentConfigV1 = z
	.object({
		version: z.literal(1),
		burn: z.enum(BURN_IDS).default("course"),
		vehicles: z.array(InstrumentVehicle).min(1).max(6),
	})
	.strict();

// Version 2 adds the coast burn and an optional field (lab-instrument.md,
// "Gravity field mode"); a field vehicle may set its start.
const InstrumentConfigV2 = z
	.object({
		version: z.literal(2),
		burn: z.enum(V2_BURN_IDS).default("course"),
		field: gameSchema<InstrumentField>(
			GravityFieldSchema.omit({ start: true }),
		).optional(),
		vehicles: z
			.array(
				InstrumentVehicle.extend({
					start: gameSchema<ShipStart>(ShipStartSchema).optional(),
				}),
			)
			.min(1)
			.max(6),
	})
	.strict();

export const InstrumentConfig = z
	.discriminatedUnion("version", [InstrumentConfigV1, InstrumentConfigV2])
	.superRefine((doc, ctx) => {
		if (doc.version !== 2) return;
		doc.vehicles.forEach((vehicle, i) => {
			if (!doc.field) {
				if (vehicle.start)
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["vehicles", i, "start"],
						message: "A start needs a field",
					});
				return;
			}
			for (const family of ["fusion", "plasma"] as const)
				if (Object.keys(vehicle.changes[family] ?? {}).length)
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["vehicles", i, "changes", family],
						message:
							"Part changes in a field need the per-chassis tuning patch, not yet available",
					});
			try {
				fieldSimulation(vehicle, doc.field);
			} catch (error) {
				// Schema errors are already reported; only the Simulation's own refusals are new.
				if (error instanceof Error && "issues" in error) return;
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["vehicles", i, "start"],
					message: error instanceof Error ? error.message : String(error),
				});
			}
		});
	});
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

/**
 * Applies an edit to a copy of the document and keeps it only if the result is
 * still a valid document; otherwise returns why, so the pane can refuse it.
 */
export function editDocument(
	doc: InstrumentConfig,
	edit: (draft: InstrumentConfig) => void,
): { ok: true; doc: InstrumentConfig } | { ok: false; message: string } {
	const draft = structuredClone(doc);
	edit(draft);
	const parsed = InstrumentConfig.safeParse(draft);
	if (parsed.success) return { ok: true, doc: parsed.data };
	return {
		ok: false,
		message: parsed.error.issues.map((issue) => issue.message).join("; "),
	};
}

/** Gravity values the pane edits; `planetReach.*` are the reach rule's parts. */
export const GRAVITY_PARAMETERS: Parameter[] = [
	{ key: "sunMultiplier", label: "Sun multiplier", unit: "× sun mass" },
	{ key: "planetStrength", label: "Planet strength", unit: "u/s²" },
	{ key: "sunReachFactor", label: "Sun reach", unit: "× sun radius" },
	{ key: "planetReach.massScale", label: "Planet reach", unit: "u per √mass" },
	{ key: "planetReach.minRadii", label: "Planet reach min", unit: "× radius" },
	{ key: "planetReach.maxRadii", label: "Planet reach max", unit: "× radius" },
];
type GravityChanges = NonNullable<InstrumentField["changes"]>;
/** A gravity value in the game's tuning file. */
export function gravityStock(key: string): number {
	const [group, part] = key.split(".");
	const value =
		group === "planetReach"
			? GRAVITY_TUNING.planetReach[part as keyof GravityTuning["planetReach"]]
			: GRAVITY_TUNING[group as keyof GravityTuning];
	return typeof value === "number" ? value : Number.NaN;
}
/** The document's value for a gravity key, or undefined when it is the game's. */
export function gravityChange(
	changes: GravityChanges,
	key: string,
): number | undefined {
	const [group, part] = key.split(".");
	const value =
		group === "planetReach"
			? changes.planetReach?.[part as keyof GravityTuning["planetReach"]]
			: changes[group as keyof GravityChanges];
	return typeof value === "number" && value !== gravityStock(key)
		? value
		: undefined;
}
/** Sets (or, for undefined or the game's value, clears) a gravity change in place. */
export function setGravityChange(
	changes: GravityChanges,
	key: string,
	value: number | undefined,
) {
	const [group, part] = key.split(".");
	const stock = value === undefined || value === gravityStock(key);
	if (group === "planetReach") {
		const reach = {
			...GRAVITY_TUNING.planetReach,
			...changes.planetReach,
			[part]: stock ? gravityStock(key) : value,
		};
		const same = (Object.keys(reach) as (keyof typeof reach)[]).every(
			(k) => reach[k] === GRAVITY_TUNING.planetReach[k],
		);
		if (same) delete changes.planetReach;
		else changes.planetReach = reach;
		return;
	}
	const k = group as Exclude<keyof GravityChanges, "planetReach" | "curve">;
	if (stock) delete changes[k];
	else changes[k] = value;
}
