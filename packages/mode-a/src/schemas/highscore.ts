import { z } from 'zod';

/**
 * High Score schema for leaderboard entries.
 *
 * Fields:
 * - initials: 3 uppercase letters (A-Z)
 * - uidHash: 6-character hash of userId (auto-generated)
 * - seconds: Survival time in seconds (1 to 999,999)
 * - deathCause: How the player died (STAR, HULL, POWER)
 * - userId: Supabase auth user ID (UUID)
 */
export const HighScoreSchema = z.object({
    initials: z
        .string()
        .length(3, 'Initials must be exactly 3 characters')
        .regex(/^[A-Z]{3}$/, 'Initials must be uppercase letters (A-Z)'),
    uidHash: z
        .string()
        .length(6, 'UID hash must be 6 characters'),
    seconds: z
        .number()
        .int('Seconds must be an integer')
        .positive('Seconds must be positive')
        .max(999999, 'Seconds cannot exceed 999,999'),
    deathCause: z.enum(['STAR', 'HULL', 'POWER'], {
        errorMap: () => ({ message: 'Death cause must be STAR, HULL, or POWER' }),
    }),
    userId: z
        .string()
        .uuid('User ID must be a valid UUID'),
});

export type HighScore = z.infer<typeof HighScoreSchema>;

/**
 * Partial schema for score submission (userId auto-filled).
 * Used in the UI layer.
 */
export const HighScoreSubmissionSchema = HighScoreSchema.omit({ userId: true, uidHash: true });

export type HighScoreSubmission = z.infer<typeof HighScoreSubmissionSchema>;
