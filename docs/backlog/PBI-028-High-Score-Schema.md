# PBI-028: High Score Schema + Submission

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 6 (High Scores)  
**Target Version:** v0.2.0

---

## User Story

**As a** player  
**I want** my score submitted to the leaderboard  
**So that** I can compete with other players

---

## Context

This PBI implements the high score data schema (Zod) and submission logic. It connects game state (time survived, death cause) with the Supabase database.

**Prerequisites:**
- PBI-026 (Supabase Project Setup)
- PBI-027 (Supabase Client Setup)

---

## Acceptance Criteria

### Schema Definition
- [ ] Create `packages/mode-a/src/schemas/highscore.ts`
- [ ] Zod schema validates high score data
- [ ] TypeScript type exported from schema

### UID Hash Generation
- [ ] Implement `generateUidHash(userId: string)` function
- [ ] Uses SHA-256 hash → base64 → first 6 characters
- [ ] Same userId always produces same hash (deterministic)

### Score Submission
- [ ] Implement `submitHighScore()` function
- [ ] Accepts: initials, seconds, deathCause
- [ ] Auto-fills userId from current session
- [ ] Generates uidHash automatically
- [ ] Validates with Zod before submitting
- [ ] Returns success/error status

### Error Handling
- [ ] Handle network errors gracefully
- [ ] Handle RLS policy violations (user mismatch)
- [ ] Handle validation errors (invalid initials, etc.)
- [ ] Return user-friendly error messages

---

## Technical Implementation

### High Score Schema

**File:** `packages/mode-a/src/schemas/highscore.ts`

```typescript
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
```

---

### UID Hash Generation

**File:** `packages/mode-a/src/lib/utils/uid-hash.ts`

```typescript
/**
 * Generates a 6-character hash from a UUID.
 *
 * Uses SHA-256 → base64 → first 6 chars.
 * Deterministic: same input always produces same output.
 *
 * Purpose: Prevents duplicate initials confusion (AAA_abc123 vs AAA_xyz789).
 *
 * @param userId - Supabase auth user ID (UUID)
 * @returns 6-character alphanumeric hash
 *
 * @example
 * generateUidHash('550e8400-e29b-41d4-a716-446655440000')
 * // => 'Xa3cD1'
 */
export async function generateUidHash(userId: string): Promise<string> {
  // Convert UUID string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  // Take first 6 characters (alphanumeric + some symbols)
  // Replace URL-unsafe characters for cleaner display
  const hash = hashBase64
    .substring(0, 6)
    .replace(/\+/g, 'x')
    .replace(/\//g, 'y')
    .replace(/=/g, 'z');

  return hash;
}
```

---

### Score Submission Function

**File:** `packages/mode-a/src/lib/api/submit-high-score.ts`

```typescript
import { supabase } from '../supabase';
import { HighScoreSchema, type HighScoreSubmission } from '../schemas/highscore';
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
 *
 * @example
 * const result = await submitHighScore({
 *   initials: 'AAA',
 *   seconds: 123,
 *   deathCause: 'STAR',
 * });
 *
 * if (result.success) {
 *   console.log('Score submitted:', result.scoreId);
 * } else {
 *   console.error('Submission failed:', result.error);
 * }
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
```

---

## Definition of Done

- [ ] `highscore.ts` schema created and exported
- [ ] `uid-hash.ts` utility function created
- [ ] `submit-high-score.ts` function created
- [ ] All TypeScript types properly defined
- [ ] Zod validation works correctly
- [ ] UID hash generates deterministically
- [ ] Submission inserts to Supabase
- [ ] Error handling covers all cases
- [ ] Zero TypeScript errors in `pnpm -r check`

---

## Testing Checklist

### Schema Validation
```typescript
import { HighScoreSchema } from '@void-drift/mode-a/schemas/highscore';

// Valid
HighScoreSchema.parse({
  initials: 'AAA',
  uidHash: 'Xa3cD1',
  seconds: 123,
  deathCause: 'STAR',
  userId: '550e8400-e29b-41d4-a716-446655440000',
});
// => Success

// Invalid initials (lowercase)
HighScoreSchema.safeParse({
  initials: 'aaa',
  uidHash: 'Xa3cD1',
  seconds: 123,
  deathCause: 'STAR',
  userId: '550e8400-e29b-41d4-a716-446655440000',
});
// => { success: false, error: ... }

// Invalid death cause
HighScoreSchema.safeParse({
  initials: 'AAA',
  uidHash: 'Xa3cD1',
  seconds: 123,
  deathCause: 'EXPLOSION', // Not in enum
  userId: '550e8400-e29b-41d4-a716-446655440000',
});
// => { success: false, error: ... }
```

### UID Hash Generation
```typescript
import { generateUidHash } from '@void-drift/mode-a/utils/uid-hash';

const userId = '550e8400-e29b-41d4-a716-446655440000';

const hash1 = await generateUidHash(userId);
const hash2 = await generateUidHash(userId);

console.assert(hash1 === hash2, 'Hash should be deterministic');
console.assert(hash1.length === 6, 'Hash should be 6 characters');
```

### Score Submission (Integration Test)
```typescript
import { submitHighScore } from '@void-drift/mode-a/api/submit-high-score';
import { ensureAnonymousSession } from '@void-drift/mode-a/supabase';

// Ensure authenticated
await ensureAnonymousSession();

// Submit score
const result = await submitHighScore({
  initials: 'TST',
  seconds: 999,
  deathCause: 'HULL',
});

console.assert(result.success === true, 'Submission should succeed');
console.log('Score ID:', result.scoreId);

// Verify in Supabase Dashboard → Table Editor → highscores
// Should see new row with initials='TST', seconds=999, death_cause='HULL'
```

### Error Handling
- [ ] Test with no auth session (should fail gracefully)
- [ ] Test with invalid initials (should fail validation)
- [ ] Test with negative seconds (should fail validation)
- [ ] Test with network offline (should fail gracefully)

---

## Out of Scope

- Initials entry UI (PBI-029)
- Leaderboard display (PBI-030)
- Checking if score qualifies for top 20 (defer to PBI-029)
- Score deletion/moderation (future feature)

---

## Dependencies

- **Requires:** PBI-026 (Supabase Project Setup)
- **Requires:** PBI-027 (Supabase Client Setup)
- **Blocks:** PBI-029 (Initials Entry UI)

---

## Related Documents

- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Supabase Migration Assessment](../SUPABASE-MIGRATION-ASSESSMENT.md)
- [PBI-027: Supabase Client Setup](./PBI-027-Supabase-Client-Setup.md)
- [PBI-029: Initials Entry UI](./PBI-029-Initials-Entry-UI.md)

---

## Notes

**Why UID Hash?**
- Prevents duplicate initials confusion (AAA can be 50 different players)
- Shown as `AAA_Xa3cD1` in leaderboard
- Deterministic: same player always has same hash

**Why SHA-256?**
- Built into Web Crypto API (no dependencies)
- Fast and deterministic
- Overkill for this use case, but simple to implement

**Security Notes:**
- RLS policy enforces `user_id = auth.uid()` (prevents impersonation)
- Client-side validation is UX only (server validates via RLS)
- Anon users are permanent (same UUID across sessions)

---

## Acceptance

**Verified by:** Unit tests + integration test in browser  
**Sign-off:** @Lead
