import {
	type BuildMount,
	buildMounts,
	defaultLoadout,
} from "@void-drift/mode-a";
import { z } from "astro/zod";

const PositionSchema = z
	.object({
		halfSpan: z.number().finite().min(1).max(32),
		y: z.number().finite().min(-62).max(0),
	})
	.strict();
export const PINCER_SUPPORT = [
	"gravity-coil",
	"battery",
	"heavy-well",
	"coil",
] as const;
export const PINCER_WEAPONS = ["rail", "laser"] as const;
const SupportFittingSchema = z
	.object({
		layer: z.enum(["Above", "Below"]),
		part: z.enum(PINCER_SUPPORT).nullable(),
	})
	.strict();
const FrontFittingSchema = SupportFittingSchema.extend({
	part: z.enum([...PINCER_SUPPORT, ...PINCER_WEAPONS]).nullable(),
});
export const PincerSlotsSchema = z
	.object({
		version: z.literal(2),
		positions: z
			.object({ forward: PositionSchema, aft: PositionSchema })
			.strict(),
		slots: z
			.object({
				Q1: FrontFittingSchema,
				Q2: FrontFittingSchema,
				Q3: SupportFittingSchema,
				Q4: SupportFittingSchema,
			})
			.strict(),
	})
	.strict();
export type PincerSlots = z.infer<typeof PincerSlotsSchema>;
export type PincerPair = keyof PincerSlots["positions"];
export type PincerSlot = keyof PincerSlots["slots"];
export type PincerPosition = PincerSlots["positions"][PincerPair];
export type PincerPart = PincerSlots["slots"][PincerSlot]["part"];
// Study vocabulary: + excludes engines here. Do not reinterpret the game's
// existing universal (+) mounts, which still accept engines.
export const PINCER_LANGUAGE = {
	forward: { symbol: "+", label: "Weapon / support" },
	aft: { symbol: "S", label: "Support only" },
} as const;
export const PINCER_SLOTS = [
	{
		id: "Q1",
		pair: "forward",
		side: -1,
		label: "+1 · Left forward",
		short: "+1",
	},
	{
		id: "Q2",
		pair: "forward",
		side: 1,
		label: "+2 · Right forward",
		short: "+2",
	},
	{ id: "Q3", pair: "aft", side: -1, label: "S3 · Left aft", short: "S3" },
	{ id: "Q4", pair: "aft", side: 1, label: "S4 · Right aft", short: "S4" },
] as const;
export const PINCER_START: PincerSlots = {
	version: 2,
	positions: {
		forward: { halfSpan: 15.5, y: -52 },
		aft: { halfSpan: 15.5, y: -29 },
	},
	slots: {
		Q1: { layer: "Below", part: "gravity-coil" },
		Q2: { layer: "Below", part: "gravity-coil" },
		Q3: { layer: "Below", part: "battery" },
		Q4: { layer: "Below", part: "battery" },
	},
};
/** Restore decided geometry and mounting while retaining independent trial fittings. */
export function decidedPincerPlacement(draft: PincerSlots): PincerSlots {
	return PincerSlotsSchema.parse({
		...draft,
		positions: PINCER_START.positions,
		slots: Object.fromEntries(
			PINCER_SLOTS.map(({ id }) => [
				id,
				{ ...draft.slots[id], layer: "Below" },
			]),
		),
	});
}
export const LegacyPincerSlotsSchema = PincerSlotsSchema.extend({
	version: z.literal(1),
});
export function fitPincerPart(
	draft: PincerSlots,
	id: PincerSlot,
	part: PincerPart,
): PincerSlots {
	return PincerSlotsSchema.parse({
		...draft,
		slots: { ...draft.slots, [id]: { ...draft.slots[id], part } },
	});
}
export function adjustPincerPosition(
	position: PincerPosition,
	change: Partial<PincerPosition>,
) {
	const next = { ...position, ...change };
	next.halfSpan = Math.max(1, Math.min(32, next.halfSpan));
	next.y = Math.max(-62, Math.min(0, next.y));
	return PositionSchema.parse(next);
}
// Reuse the production equipment mount's footprint. Fittings retain actual game scale.
const reference = buildMounts(defaultLoadout("wasp"))[0];
export function pincerMounts(draft: PincerSlots): (BuildMount & {
	underHull: boolean;
	language: { symbol: string; label: string };
})[] {
	return PINCER_SLOTS.map(({ id, pair, side, label }, index) => ({
		...reference,
		key: id,
		label,
		index,
		x: -draft.positions[pair].y,
		y: side * draft.positions[pair].halfSpan,
		part: draft.slots[id].part,
		underHull: draft.slots[id].layer === "Below",
		language: PINCER_LANGUAGE[pair],
	}));
}
