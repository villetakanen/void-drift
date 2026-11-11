import { z } from "zod";
import { PartIdSchema } from "../lib/schemas/loadout";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
export const CHALLENGE = "ion-storm";
/** A ship carries at most ten fitted parts; the bound is a sanity limit, `firestore.rules` repeats it. */
export const MAX_FITTING_PARTS = 16;
/** Milliseconds are the finest time the record keeps. */
const MILLISECOND_TOLERANCE = 1e-6;
export const HighScoreSubmissionSchema = z.object({
  initials: z.string().regex(/^[A-Z]{3}$/),
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
  score: z.number().int().min(1),
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
/** Leaderboard rows that fail the current schema are skipped. */
export function parseHighScores(rows: unknown[]): HighScore[] {
  return rows.flatMap((row) => {
    const parsed = HighScoreSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
