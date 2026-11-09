import { z } from "zod";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
/**
 * Upper bound on a stored score; `firestore.rules` repeats it.
 * Gameplay seconds are at most 3600. Derelicts arrive at 3 s and then at least
 * 5 s apart, so a run meets at most 720 groups. A group offers at most 91 scoring
 * hits: 43 on the wreck (85 hull at the weakest 2-point point-defence band) and
 * 48 on its eight pieces (6 each, 12 hull at the same band). Each group yields at
 * most one energy cell, worth 20. 3600 + 720 x 91 + 720 x 20 = 83 520, rounded up.
 */
export const MAX_SCORE = 100000;
export const CHALLENGE = "ion-storm";
export const HighScoreSubmissionSchema = z.object({
  initials: z.string().regex(/^[A-Z]{3}$/),
  seconds: z.number().int().min(1).max(3600),
  score: z.number().int().min(1).max(MAX_SCORE),
  deathCause: z.enum(["STAR", "HULL", "POWER"]),
  // Fiddler is an unranked flight trial until balance is accepted.
  shipId: ShipProfileIdSchema.exclude(["fiddler"]),
  challenge: z.literal(CHALLENGE),
});
export const HighScoreSchema = HighScoreSubmissionSchema.extend({
  userId: z.string().min(1).max(128),
}).strict();
export type HighScore = z.infer<typeof HighScoreSchema>;
export type HighScoreSubmission = z.infer<typeof HighScoreSubmissionSchema>;
/** Leaderboard rows that fail the current schema (for example, retired ship ids) are skipped. */
export function parseHighScores(rows: unknown[]): HighScore[] {
  return rows.flatMap((row) => {
    const parsed = HighScoreSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
