import { z } from "zod";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
export const CHALLENGE = "ion-1";
export const HighScoreSubmissionSchema = z.object({
	initials: z.string().regex(/^[A-Z]{3}$/),
	seconds: z.number().int().min(1).max(3600),
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
