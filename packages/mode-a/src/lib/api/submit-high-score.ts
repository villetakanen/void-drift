import { supabase } from '../supabase';
import { HighScoreSchema, type HighScoreSubmission } from '../../schemas/highscore';
import { generateUidHash } from '../utils/uid-hash';

/**
 * Result of high score submission.
 */
export type SubmitHighScoreResult =
    | { success: true; scoreId: string }
    | { success: false; error: string };

/**
 * Submits a high score to the leaderboard.
 *
 * Steps:
 * 1. Get current user session
 * 2. Generate UID hash from user ID
 * 3. Validate with Zod schema
 * 4. Insert to Supabase
 *
 * @param submission - Initials, seconds, deathCause
 * @returns Success with scoreId, or error message
 */
export async function submitHighScore(
    submission: HighScoreSubmission
): Promise<SubmitHighScoreResult> {
    try {
        // 1. Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: 'Not authenticated. Please reload the page and try again.',
            };
        }

        const userId = session.user.id;

        // 2. Generate UID hash
        const uidHash = await generateUidHash(userId);

        // 3. Build full high score object
        const highScore = {
            ...submission,
            userId,
            uidHash,
        };

        // 4. Validate with Zod
        const validated = HighScoreSchema.safeParse(highScore);

        if (!validated.success) {
            const errors = validated.error.issues.map((issue) => issue.message).join(', ');
            return {
                success: false,
                error: `Validation failed: ${errors}`,
            };
        }

        // 5. Insert to Supabase
        const { data, error: insertError } = await supabase
            .from('highscores')
            .insert({
                user_id: validated.data.userId,
                initials: validated.data.initials,
                uid_hash: validated.data.uidHash,
                seconds: validated.data.seconds,
                death_cause: validated.data.deathCause,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[submitHighScore] Insert failed:', insertError);
            return {
                success: false,
                error: `Failed to submit score: ${insertError.message}`,
            };
        }

        console.log('[submitHighScore] Score submitted successfully:', data.id);

        return {
            success: true,
            scoreId: data.id,
        };
    } catch (error) {
        console.error('[submitHighScore] Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
