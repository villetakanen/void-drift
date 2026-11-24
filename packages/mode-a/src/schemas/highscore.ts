import { z } from "zod";
import { PartIdSchema } from "../lib/schemas/loadout";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
export const CHALLENGE = "fires-in-the-sky";
/** A ship carries at most ten fitted parts; the bound is a sanity limit, `firestore.rules` repeats it. */
export const MAX_FITTING_PARTS = 16;
/** Milliseconds are the finest time the record keeps. */
const MILLISECOND_TOLERANCE = 1e-6;
/** A saved score's tag: exactly three letters A–Z. */
export const InitialsSchema = z.string().regex(/^[A-Z]{3}$/);
export const HighScoreSubmissionSchema = z.object({
  initials: InitialsSchema,
  // Seconds survived with at most three decimals; the rules repeat the check.
  seconds: z
    .number()
    .positive()
    .finite()
    .refine(
      (value) =>
        Math.abs(value * 1000 - Math.round(value * 1000)) <
        MILLISECOND_TOLERANCE,
      "Seconds hold at most three decimals",
    ),
  score: z.number().int().nonnegative(),
  deathCause: z.enum(["STAR", "HULL", "POWER"]),
  // Which runs may be saved is the Playground gate's decision, not the record's.
  shipId: ShipProfileIdSchema,
  // The parts fitted to the flown ship, one id per mount.
  fitting: z.array(PartIdSchema).max(MAX_FITTING_PARTS),
  stabilizers: z.boolean(),
  linkedEngines: z.boolean(),
  challenge: z.literal(CHALLENGE),
});
export const HighScoreSchema = HighScoreSubmissionSchema.extend({
  userId: z.string().min(1).max(128),
}).strict();
export type HighScore = z.infer<typeof HighScoreSchema>;
export type HighScoreSubmission = z.infer<typeof HighScoreSubmissionSchema>;
/** A completed ranked run, ready to save once the player signs it. */
export const RankedRunSchema = HighScoreSubmissionSchema.omit({
  initials: true,
});
export type RankedRun = z.infer<typeof RankedRunSchema>;

const ScoreValueSchema = z.number().int().nonnegative();
/** The part of a stored row a best is judged by. */
export const StoredBestSchema = z.object({ score: ScoreValueSchema });
/** The player's saved best for one challenge and ship, as read from the store. */
export const PersonalBestSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("absent") }),
  z.object({ status: z.literal("found"), score: ScoreValueSchema }),
]);
export type PersonalBest = z.infer<typeof PersonalBestSchema>;
/** A best check either establishes the stored best or could not complete. */
export const PersonalBestLookupSchema = z.union([
  PersonalBestSchema,
  z.object({ status: z.literal("unavailable"), error: z.string() }),
]);
export type PersonalBestLookup = z.infer<typeof PersonalBestLookupSchema>;
/** What a score submission established about the stored record. */
export const SaveOutcomeSchema = z.discriminatedUnion("outcome", [
  // This submission wrote the stored record.
  z.object({ outcome: z.literal("saved"), scoreId: z.string() }),
  // A matching best is already stored; its origin is unknown.
  z.object({ outcome: z.literal("matching") }),
  // An equal or higher best is stored and stays; this run was not written.
  z.object({ outcome: z.literal("kept"), best: ScoreValueSchema }),
  // The store could not be reached or refused the write; nothing is known.
  z.object({ outcome: z.literal("failed"), error: z.string() }),
]);
export type SaveOutcome = z.infer<typeof SaveOutcomeSchema>;

/** A first score, or one strictly above the saved best, is a new best. */
export function isNewPersonalBest(best: PersonalBest, score: number) {
  return best.status === "absent" || score > best.score;
}
/** Reads a stored row as a best; a row without a readable score is not one. */
export function readPersonalBest(stored: unknown): PersonalBest | undefined {
  if (stored === undefined) return { status: "absent" };
  const parsed = StoredBestSchema.safeParse(stored);
  return parsed.success
    ? { status: "found", score: parsed.data.score }
    : undefined;
}
/** A run as the store keeps it, apart from the initials it was signed with. */
const runOf = ({ initials: _initials, ...run }: HighScore) =>
  JSON.stringify(run);
/**
 * Decides, inside the score transaction, what to do with a record given the
 * row stored under its id. A row matching apart from initials might be a
 * separate run or a save whose reply was lost. Neither case writes again.
 * An unreadable row is written over, and so left to the rules to judge.
 */
export function settleScore(
  stored: unknown,
  record: HighScore,
):
  | { write: true }
  | ({ write: false } & Extract<
      SaveOutcome,
      { outcome: "matching" | "kept" }
    >) {
  const same = HighScoreSchema.safeParse(stored);
  if (same.success && runOf(same.data) === runOf(HighScoreSchema.parse(record)))
    return { write: false, outcome: "matching" };
  const best = readPersonalBest(stored);
  if (best?.status === "found" && !isNewPersonalBest(best, record.score))
    return { write: false, outcome: "kept", best: best.score };
  return { write: true };
}
/** Leaderboard rows that fail the current schema are skipped. */
export function parseHighScores(rows: unknown[]): HighScore[] {
  return rows.flatMap((row) => {
    const parsed = HighScoreSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
