import { z } from "zod";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
export const CHALLENGE = "gravity-1";
export const HighScoreSubmissionSchema = z.object({
	initials: z.string().regex(/^[A-Z]{3}$/),
	seconds: z.number().int().min(1).max(3600),
	deathCause: z.enum(["STAR", "HULL", "POWER"]),
	shipId: ShipProfileIdSchema,
	challenge: z.literal(CHALLENGE),
});
export const HighScoreSchema = HighScoreSubmissionSchema.extend({
	userId: z.string().min(1).max(128),
}).strict();
export type HighScore = z.infer<typeof HighScoreSchema>;
export type HighScoreSubmission = z.infer<typeof HighScoreSubmissionSchema>;
