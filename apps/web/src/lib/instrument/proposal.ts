import {
	GRAVITY_TUNING,
	type GravityTuning,
	GravityTuningSchema,
	type Tuning,
	TuningSchema,
} from "@void-drift/mode-a";
import { GRAVITY_PARAMETERS, InstrumentConfig, serialize } from "./config";

// The gravity tuning proposal (gravity-field.md, "Changing gravity values"): a
// self-describing block the pane copies and `pnpm tuning:apply gravity` reads.
// Only `field.changes` can reach the game; Lab wells and starts never do.

const HEADER =
	"Gravity tuning proposal (instrument document v2, from /lab/instrument)";
/** Every gravity key, in the order the block lists them. */
export const GRAVITY_KEYS = [
	...GRAVITY_PARAMETERS.map((p) => p.key),
	"curve",
] as const;

type Value = number | string;
/** A gravity value by key; `planetReach.*` reads the reach rule's parts. */
export function gravityValue(tuning: GravityTuning, key: string): Value {
	const [group, part] = key.split(".");
	return group === "planetReach"
		? tuning.planetReach[part as keyof GravityTuning["planetReach"]]
		: tuning[group as keyof Omit<GravityTuning, "planetReach">];
}
/** The keys whose values differ between two tunings. */
export function gravityDiff(from: GravityTuning, to: GravityTuning) {
	return GRAVITY_KEYS.filter(
		(key) => gravityValue(from, key) !== gravityValue(to, key),
	).map((key) => ({
		key,
		from: gravityValue(from, key),
		to: gravityValue(to, key),
	}));
}
const list = (entries: string[]) => entries.join("; ") || "none";

/** The proposal block for a field document with changes; null without any. */
export function gravityProposal(
	doc: InstrumentConfig,
	game: GravityTuning = GRAVITY_TUNING,
): string | null {
	if (doc.version !== 2 || !doc.field) return null;
	const next = GravityTuningSchema.parse({ ...game, ...doc.field.changes });
	const diff = gravityDiff(game, next);
	if (!diff.length) return null;
	return [
		HEADER,
		`Baseline: ${list(GRAVITY_KEYS.map((k) => `${k} ${gravityValue(game, k)}`))}`,
		`Apply: ${list(diff.map((d) => `${d.key} ${d.from} → ${d.to}`))}`,
		`Not applied (Lab wells): ${list(doc.field.wells.map((w) => w.label))}`,
		serialize(doc),
	].join("\n");
}

export type ProposalResult =
	| {
			ok: true;
			next: GravityTuning;
			diff: { key: string; from: Value; to: Value }[];
	  }
	| { ok: false; reason: string };

/**
 * Reads a proposal against the tuning file's gravity section. Refuses, with a
 * reason, a block without a document, a document without gravity changes, a
 * value out of range or unknown, an Apply line that disagrees with the
 * document, and a baseline that no longer matches the tuning file.
 */
export function readGravityProposal(
	text: string,
	current: GravityTuning,
): ProposalResult {
	const start = text.search(/^\{/m);
	if (start < 0) return { ok: false, reason: "No instrument document found." };
	let json: unknown;
	try {
		json = JSON.parse(text.slice(start));
	} catch {
		return { ok: false, reason: "The instrument document is not valid JSON." };
	}
	const parsed = InstrumentConfig.safeParse(json);
	if (!parsed.success)
		return {
			ok: false,
			reason: `The instrument document is invalid: ${parsed.error.issues
				.map((i) => `${i.path.join(".") || "document"}: ${i.message}`)
				.join("; ")}`,
		};
	const doc = parsed.data;
	if (doc.version !== 2 || !doc.field)
		return { ok: false, reason: "The document has no gravity field." };
	const next = GravityTuningSchema.safeParse({
		...current,
		...doc.field.changes,
	});
	if (!next.success)
		return {
			ok: false,
			reason: `Gravity values out of range: ${next.error.issues
				.map((i) => `${i.path.join(".")}: ${i.message}`)
				.join("; ")}`,
		};
	const diff = gravityDiff(current, next.data);
	const apply = text.match(/^Apply: (.*)$/m)?.[1];
	if (!apply) return { ok: false, reason: "The Apply line is missing." };
	const claimed = new Map(
		apply
			.split("; ")
			.map((entry) => entry.match(/^(\S+) (\S+) → (\S+)$/))
			.filter((m) => m !== null)
			.map((m) => [m[1], { from: m[2], to: m[3] }]),
	);
	for (const [key, { from }] of claimed) {
		if (!(GRAVITY_KEYS as readonly string[]).includes(key))
			return { ok: false, reason: `Unknown gravity value ${key}.` };
		const now = String(gravityValue(current, key));
		if (from !== now)
			return {
				ok: false,
				reason: `Stale proposal: ${key} was ${from} when copied but is ${now} in the tuning file.`,
			};
	}
	if (!diff.length)
		return {
			ok: false,
			reason: "The proposal changes no gravity value in the tuning file.",
		};
	const same =
		claimed.size === diff.length &&
		diff.every((d) => claimed.get(d.key)?.to === String(d.to));
	if (!same)
		return {
			ok: false,
			reason: "The Apply line does not match the document's gravity changes.",
		};
	return { ok: true, next: next.data, diff };
}

/**
 * The `gravity` area of `pnpm tuning:apply`: the whole tuning file with its
 * gravity section replaced, or the reason the proposal is refused.
 */
export function applyGravitySection(
	text: string,
	file: unknown,
): { ok: true; file: Tuning; lines: string[] } | { ok: false; reason: string } {
	const tuning = TuningSchema.safeParse(file);
	if (!tuning.success)
		return { ok: false, reason: "The tuning file itself is invalid." };
	const result = readGravityProposal(text, tuning.data.gravity);
	if (!result.ok) return result;
	return {
		ok: true,
		file: TuningSchema.parse({ ...tuning.data, gravity: result.next }),
		lines: result.diff.map((d) => `${d.key} ${d.from} → ${d.to}`),
	};
}
