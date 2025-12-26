# PBI-027: Supabase Client Setup

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 6 (High Scores)  
**Target Version:** v0.2.0

---

## User Story

**As a** developer  
**I want** the Supabase JavaScript client configured  
**So that** the app can authenticate users and query the database

---

## Context

This PBI implements the Supabase client initialization and anonymous authentication flow. It bridges the infrastructure (PBI-026) with the application logic (PBI-028+).

**Prerequisites:** PBI-026 (Supabase Project Setup) must be complete.

---

## Acceptance Criteria

### Package Installation
- [ ] `@supabase/supabase-js` installed as dependency
- [ ] Package version documented (use latest stable)
- [ ] TypeScript types available

### Client Initialization
- [ ] Create `packages/mode-a/src/lib/supabase.ts`
- [ ] Supabase client initialized with environment variables
- [ ] Client exported for use in components

### Authentication
- [ ] Implement `ensureAnonymousSession()` helper
- [ ] Auto-signin on first visit
- [ ] Session persists across page refreshes
- [ ] Session accessible via `supabase.auth.getSession()`

### Error Handling
- [ ] Handle missing environment variables gracefully
- [ ] Log errors to console (dev mode only)
- [ ] Fail gracefully if Supabase is unreachable

---

## Technical Implementation

### Installation

```bash
# In packages/mode-a/
pnpm add @supabase/supabase-js
```

**Note:** This should be added to `packages/mode-a` after PBI-021 (Package Restructure) is complete. If PBI-021 is not done, add to `packages/engine` temporarily.

---

### Supabase Client Initialization

**File:** `packages/mode-a/src/lib/supabase.ts`

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Environment variables (exposed via Astro's PUBLIC_ prefix)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env.local for PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not using OAuth
  },
});

/**
 * Ensures the user has an anonymous session.
 * Auto-signs in if no session exists.
 *
 * @returns The current session (existing or newly created)
 */
export async function ensureAnonymousSession() {
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log('[Supabase Auth] Existing session found:', session.user.id);
    return session;
  }

  // No session - create anonymous user
  console.log('[Supabase Auth] No session found, signing in anonymously...');
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('[Supabase Auth] Anonymous signin failed:', error.message);
    throw error;
  }

  console.log('[Supabase Auth] Anonymous session created:', data.user?.id);
  return data.session;
}
```

---

### TypeScript Types

**File:** `packages/mode-a/src/lib/types/database.ts` (optional, for future)

```typescript
// Database types for Supabase
// This file can be auto-generated with `supabase gen types typescript`

export type Database = {
  public: {
    Tables: {
      highscores: {
        Row: {
          id: string;
          user_id: string;
          initials: string;
          uid_hash: string;
          seconds: number;
          death_cause: 'STAR' | 'HULL' | 'POWER';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          initials: string;
          uid_hash: string;
          seconds: number;
          death_cause: 'STAR' | 'HULL' | 'POWER';
          created_at?: string;
        };
        Update: {
          // Updates not allowed (immutable scores)
        };
      };
    };
  };
};
```

**Note:** For v0.2.0, this is optional. Can be added later for stricter typing.

---

### Integration with App

**File:** `apps/web/src/components/GameWrapper.svelte` (example usage)

```typescript
import { ensureAnonymousSession } from '@void-drift/mode-a/supabase';
import { onMount } from 'svelte';

onMount(async () => {
  // Ensure user is authenticated before game starts
  try {
    await ensureAnonymousSession();
  } catch (error) {
    console.error('Failed to authenticate:', error);
    // Optionally show error UI
  }
});
```

**When to call:**
- Option 1: `onMount()` in `GameWrapper.svelte` (recommended)
- Option 2: On game over, before showing InitialsEntry
- Option 3: In `+layout.astro` (global, runs once per session)

**Recommendation:** Call in `GameWrapper.svelte` to ensure auth before gameplay starts.

---

## Definition of Done

- [ ] `@supabase/supabase-js` installed
- [ ] `packages/mode-a/src/lib/supabase.ts` created
- [ ] Supabase client initializes without errors
- [ ] `ensureAnonymousSession()` creates session on first visit
- [ ] Session persists across page refreshes
- [ ] Zero TypeScript errors in `pnpm -r check`
- [ ] Console logs show auth flow (dev mode only)

---

## Testing Checklist

### Installation
- [ ] `pnpm install` succeeds
- [ ] `pnpm -r build` succeeds
- [ ] No missing dependency errors

### Authentication Flow
- [ ] Open app in incognito/private window
- [ ] Check browser console for "[Supabase Auth] No session found, signing in anonymously..."
- [ ] Verify "[Supabase Auth] Anonymous session created: [UUID]"
- [ ] Refresh page
- [ ] Verify "[Supabase Auth] Existing session found: [UUID]"
- [ ] Same UUID should appear after refresh (session persisted)

### Error Handling
- [ ] Temporarily remove `.env.local`
- [ ] Verify error: "Missing Supabase environment variables"
- [ ] Restore `.env.local`
- [ ] Verify app works again

### TypeScript
- [ ] `pnpm -r check` shows zero errors
- [ ] Import `supabase` in a component without errors
- [ ] Import `ensureAnonymousSession` in a component without errors

---

## Out of Scope

- High score submission logic (PBI-028)
- Initials entry UI (PBI-029)
- Leaderboard display (PBI-030)
- Database type generation (optional, can defer)

---

## Dependencies

- **Requires:** PBI-026 (Supabase Project Setup)
- **Blocks:** PBI-028 (High Score Submission)
- **Recommended:** PBI-021 (Package Restructure) — but can proceed in `packages/engine` if not ready

---

## Related Documents

- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Supabase Migration Assessment](../SUPABASE-MIGRATION-ASSESSMENT.md)
- [PBI-026: Supabase Project Setup](./PBI-026-Supabase-Project-Setup.md)
- [PBI-028: High Score Schema + Submission](./PBI-028-High-Score-Schema.md)

---

## Notes

**Session Persistence:**
- Supabase stores session in `localStorage` by default
- Session includes: `access_token`, `refresh_token`, `user` object
- Auto-refreshes token before expiration (configurable)

**Anonymous Auth Gotchas:**
- Anonymous users are **permanent** (same UUID across sessions)
- Clearing browser storage creates a new anonymous user
- No way to "log out" of anonymous session (by design)

**Environment Variables:**
- `PUBLIC_` prefix required for Astro to expose to client
- Values visible in browser (not secret)
- `anon` key is safe to expose (rate-limited by Supabase)

---

## Acceptance

**Verified by:** Manual testing in browser console + session persistence test  
**Sign-off:** @Lead
