# Supabase Migration Assessment

**Date:** 2025-12-25  
**Status:** ✅ APPROVED  
**Impact:** Phase 6 (v0.2.0) High Score System + Future Mode B (Multiplayer)

---

## Executive Summary

The architecture team's recommendation to pivot from Firebase to Supabase is **technically sound and strategically beneficial** for Void Drift. This assessment validates the proposed architecture and provides a migration roadmap.

**Key Finding:** The timing is ideal—Firebase SDK is present as a dependency but has **zero implementation code**, making this a zero-cost pivot for v0.2.0.

---

## Architecture Recommendation Review

### Proposed Architecture

**Backend Provider:** Supabase  
**Architecture Pattern:** Peer-to-Peer State Sync via Relay (Supabase Realtime)

**Dual-Layer Design:**
1. **Persistent State (PostgreSQL):** Lobby/Matchmaking, High Scores, Stats
2. **Ephemeral State (Realtime Broadcast):** Ship Physics, Projectiles, Inputs

### Assessment: ✅ APPROVED

**Strengths:**
- **Right tool for the job:** PostgreSQL excels at leaderboards (ORDER BY, rankings, windowing)
- **Future-proof:** Supabase Realtime enables Mode B multiplayer (Phase 9+)
- **Unified platform:** Auth + DB + Realtime in one service (vs. Firebase's fragmented SDKs)
- **Developer experience:** Better TypeScript support, simpler RLS vs. Firestore Rules
- **Cost efficiency:** Better free tier for small-scale projects

**Validation:**
- ✅ Hybrid approach (persistent + ephemeral) matches game architecture needs
- ✅ Realtime Broadcast suitable for 15-20Hz physics sync
- ✅ PostgreSQL better for structured leaderboard queries than NoSQL
- ✅ RLS policies easier to reason about than Firestore security rules

---

## Current State Analysis

### Codebase Status (v0.1.0)

**Package Structure:** ❌ NOT YET SPLIT
- Current: Single `packages/engine` package
- Planned: Split into `packages/core` + `packages/mode-a` (PBI-021, v0.1.1)

**Backend Integration:** ❌ NONE
- `firebase` dependency listed in package.json (v12.6.0)
- **CRITICAL:** `packages/engine/src/lib/firebase.ts` is an **empty placeholder**
- No auth code, no Firestore queries, no initialization
- **Migration Impact:** Zero code rewrite needed—this is greenfield implementation

**Multiplayer Readiness:** ⚠️ PARTIAL
- ✅ Zod schemas (serialization-ready)
- ✅ Deterministic physics (same input → same output)
- ✅ Decoupled entity models (Ship, Star, Planet)
- ❌ No network sync layer
- ❌ No interpolation/lag compensation

---

## Migration Strategy

### Phase 1: Foundation (v0.1.1 - v0.1.3)
**Goal:** Prepare architecture for backend integration

**PBI-021: Package Restructure (v0.1.1)**
- Split `packages/engine` → `packages/core` + `packages/mode-a`
- **Why critical:** Allows Mode A to have Supabase deps while keeping core physics backend-agnostic
- **Status:** Already planned, zero changes needed

**PBI-022: Button Design System (v0.1.2)**
- Design system polish for leaderboard UI
- **Status:** Already planned, zero changes needed

**PBI-023 + 024: Sun Scale + Lab Stats (v0.1.3)**
- Gameplay variety and QoL
- **Status:** Already planned, zero changes needed

---

### Phase 2: Supabase Integration (v0.2.0)
**Goal:** Implement high score system with Supabase

#### PBI-026: Supabase Project Setup (NEW)
**Replaces:** PBI-025 Firebase Project Setup  
**Priority:** HIGH  
**Estimate:** 2 Story Points

**Deliverables:**
- Supabase project created
- PostgreSQL database provisioned
- Anonymous Auth enabled
- Environment variables configured

**Database Schema:**
```sql
create table highscores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  initials text not null check (initials ~ '^[A-Z]{3}$'),
  uid_hash text not null,
  seconds integer not null check (seconds > 0 and seconds < 1000000),
  death_cause text not null check (death_cause in ('STAR', 'HULL', 'POWER')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for leaderboard queries (top 20 by time)
create index highscores_seconds_idx on highscores (seconds asc, created_at asc);

-- RLS Policies
alter table highscores enable row level security;

-- Anyone can read leaderboard
create policy "Leaderboard is public"
  on highscores for select
  using (true);

-- Authenticated users can create their own scores
create policy "Users can submit scores"
  on highscores for insert
  with check (auth.uid() = user_id);

-- Scores are immutable
-- (No update/delete policies = denied by default)
```

---

#### PBI-027: Supabase Client Setup (NEW)
**Priority:** HIGH  
**Estimate:** 3 Story Points

**Deliverables:**
- Install `@supabase/supabase-js` package
- Create `packages/mode-a/src/lib/supabase.ts` (replaces firebase.ts)
- Implement anonymous auth flow
- Create session persistence

**Implementation:**
```typescript
// packages/mode-a/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auto-signin on first visit
export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.signInAnonymously();
  }
  return session;
}
```

---

#### PBI-028: High Score Schema + Submission (NEW)
**Priority:** HIGH  
**Estimate:** 3 Story Points

**Deliverables:**
- Create `packages/mode-a/src/schemas/highscore.ts` with Zod schema
- Implement `submitHighScore()` function
- Add UID hash generation (SHA-256 → 6 chars)
- Handle submission errors gracefully

**Schema:**
```typescript
// packages/mode-a/src/schemas/highscore.ts
import { z } from 'zod';

export const HighScoreSchema = z.object({
  initials: z.string().regex(/^[A-Z]{3}$/),
  uidHash: z.string().length(6),
  seconds: z.number().int().positive().max(999999),
  deathCause: z.enum(['STAR', 'HULL', 'POWER']),
  userId: z.string().uuid(),
});

export type HighScore = z.infer<typeof HighScoreSchema>;
```

---

#### PBI-029: Initials Entry UI (NEW)
**Priority:** HIGH  
**Estimate:** 5 Story Points

**Deliverables:**
- Create `InitialsEntry.svelte` component
- Arcade-style 3-letter input (A-Z only)
- Keyboard navigation (Arrow keys + Enter)
- On-screen buttons for mobile
- Display UID hash preview
- Submit button → calls `submitHighScore()`

**UX Flow:**
```
Game Over → InitialsEntry (if top 20) → Submitting... → Leaderboard
```

---

#### PBI-030: Leaderboard Display (NEW)
**Priority:** HIGH  
**Estimate:** 3 Story Points

**Deliverables:**
- Create `/leaderboard` route
- Display top 20 scores from Supabase
- Show: Rank, Initials, UID Hash, Time, Death Cause
- Highlight current player's score (if present)
- Link from GameOver screen
- Loading states + error handling

**Query:**
```typescript
const { data: scores } = await supabase
  .from('highscores')
  .select('*')
  .order('seconds', { ascending: true })
  .limit(20);
```

---

## Future: Mode B Multiplayer (Phase 9+)

### Supabase Realtime Protocol (Deferred, but planned)

**Why this architecture works for multiplayer:**

1. **Lobby System (PostgreSQL):**
   - `matches` table stores game rooms (host, guest, status)
   - Query `status = 'waiting'` to find open lobbies
   - Update `status = 'in_progress'` on match start

2. **Physics Sync (Realtime Broadcast):**
   - Channel: `game_room:{match_id}`
   - Broadcast event: `ship_update` (15-20Hz)
   - Payload: position, velocity, rotation, input_state

3. **Client-Side Interpolation:**
   - Store `targetPos` from network
   - Dead reckoning: `predictedPos = lastPos + (velocity * timeSinceLastPacket)`
   - Lerp visual sprite toward predicted position

**Database Schema (for future Mode B):**
```sql
create table matches (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references auth.users(id),
  guest_id uuid references auth.users(id),
  status text check (status in ('waiting', 'in_progress', 'finished')),
  winner_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

**Realtime Event Schema:**
```typescript
// Broadcast every 50-66ms
type ShipUpdateEvent = {
  type: 'ship_update';
  payload: {
    player_id: string;
    timestamp: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    rotation: number;
    input_state: { thrust: boolean; turn_left: boolean };
  };
};
```

**Client-Side Interpolation (Pseudocode):**
```typescript
function onReceiveUpdate(payload) {
  enemyShip.targetPos = payload.position;
  enemyShip.targetVel = payload.velocity;
  enemyShip.lastUpdate = now();
}

function gameLoop(deltaTime) {
  // 1. Dead Reckoning: Predict where enemy is NOW
  const timeSinceUpdate = now() - enemyShip.lastUpdate;
  const predictedPos = {
    x: enemyShip.targetPos.x + enemyShip.targetVel.x * timeSinceUpdate,
    y: enemyShip.targetPos.y + enemyShip.targetVel.y * timeSinceUpdate,
  };

  // 2. Smooth Lerp: Visual sprite moves toward predicted position
  visualSprite.x = lerp(visualSprite.x, predictedPos.x, 0.1);
  visualSprite.y = lerp(visualSprite.y, predictedPos.y, 0.1);
}
```

**Optimization Notes:**
- Round floats to 2 decimal places before sending (reduce payload size)
- Only send updates if position changed significantly (>1px threshold)
- Fade enemy ship to 50% opacity if no packet received for >500ms (connection loss indicator)

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase Realtime rate limits | MEDIUM | MEDIUM | Optimize packet rate (15Hz max), batch updates |
| PostgreSQL query performance | LOW | LOW | Indexed `ORDER BY seconds`, top 20 limit |
| Anonymous auth abuse | MEDIUM | MEDIUM | Rate limit submissions (1/min per user), validate schema |
| Latency spikes in multiplayer | MEDIUM | HIGH | Dead reckoning + interpolation (already planned) |
| RLS policy bypass | LOW | CRITICAL | Thorough testing in RLS Playground, penetration testing |

### Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep to multiplayer | HIGH | HIGH | Defer Mode B to Phase 9+ (post-v1.0.0) |
| Team Firebase expertise loss | LOW | LOW | Firebase never implemented—zero knowledge loss |
| Environment variable confusion | MEDIUM | LOW | Clear `.env.example`, documentation |

---

## Cost Comparison

### Firebase Free Tier
- **Firestore:** 1GB storage, 50K reads/day
- **Auth:** Unlimited
- **Realtime Database:** 1GB storage, 100 simultaneous connections

### Supabase Free Tier
- **PostgreSQL:** 500MB storage, unlimited queries
- **Auth:** 50K active users/month
- **Realtime:** 200 concurrent connections, 2GB bandwidth/month

**Verdict:** Supabase free tier is **more generous** for leaderboard queries and multiplayer connections.

---

## Recommendation

### ✅ APPROVE Supabase Migration

**Rationale:**
1. **Zero sunk cost:** Firebase SDK is present but unused—no code to rewrite
2. **Better fit:** PostgreSQL > NoSQL for leaderboards (rankings, windowing, ORDER BY)
3. **Future-proof:** Supabase Realtime enables Mode B multiplayer (Phase 9+)
4. **Simpler DX:** RLS policies clearer than Firestore Rules, better TypeScript support
5. **Cost-effective:** More generous free tier for our use case

**Action Items:**
1. ✅ Approve architecture pivot
2. ✅ Update Phase 6 roadmap (replace Firebase PBIs with Supabase PBIs)
3. ✅ Create new PBI documents (PBI-026 through PBI-030)
4. ✅ Update dependencies (remove `firebase`, add `@supabase/supabase-js`)
5. ✅ Proceed with PBI-021 package restructure (already planned for v0.1.1)

---

## Timeline Impact

**Original Timeline:** v0.2.0 in Q1 2025  
**Revised Timeline:** v0.2.0 in Q1 2025 (no change)

**Effort Comparison:**
- Firebase implementation: 11 story points (PBI-025 + 3 app PBIs)
- Supabase implementation: 13 story points (PBI-026 through PBI-030)
- **Net difference:** +2 story points (1 sprint)

**Why minimal impact:**
- Most work is UI (InitialsEntry, Leaderboard) — backend-agnostic
- Schema design effort identical (Firestore vs. PostgreSQL)
- Auth flow nearly identical (Anonymous in both)

---

## Success Metrics

### v0.2.0 Launch Criteria
- [ ] Player can submit initials after death
- [ ] Leaderboard displays top 20 scores
- [ ] Scores persist across sessions
- [ ] UID hash prevents duplicate initials confusion
- [ ] Submission fails gracefully with error messages
- [ ] Leaderboard loads in <2 seconds

### Technical Validation
- [ ] RLS policies tested in Supabase SQL Editor
- [ ] No console errors during auth flow
- [ ] Session persists across page refreshes
- [ ] Zero TypeScript errors in `pnpm -r check`
- [ ] Build succeeds with Supabase SDK

---

## Appendix: File Changes Required

### New Files (Supabase)
- `docs/SUPABASE-MIGRATION-ASSESSMENT.md` ← This document
- `docs/backlog/PBI-026-Supabase-Project-Setup.md`
- `docs/backlog/PBI-027-Supabase-Client-Setup.md`
- `docs/backlog/PBI-028-High-Score-Schema.md`
- `docs/backlog/PBI-029-Initials-Entry-UI.md`
- `docs/backlog/PBI-030-Leaderboard-Display.md`
- `packages/mode-a/src/lib/supabase.ts` (after PBI-021 split)
- `packages/mode-a/src/schemas/highscore.ts` (after PBI-021 split)
- `apps/web/src/components/InitialsEntry.svelte`
- `apps/web/src/components/Leaderboard.svelte`
- `apps/web/src/pages/leaderboard.astro`

### Modified Files
- `docs/PHASE-6-ROADMAP.md` (replace Firebase sections)
- `packages/engine/package.json` (remove firebase, add @supabase/supabase-js — after PBI-021)
- `apps/web/src/components/GameOver.svelte` (integrate InitialsEntry flow)
- `.env.example` (Supabase env vars instead of Firebase)
- `.gitignore` (ensure .env.local ignored)

### Deleted Files
- `docs/backlog/PBI-025-Firebase-Project-Setup.md` (replaced by PBI-026)
- `packages/engine/src/lib/firebase.ts` (empty placeholder, replaced by supabase.ts in mode-a)

---

## Sign-Off

**Assessed by:** Architecture Team  
**Reviewed by:** @Lead  
**Approval:** ✅ APPROVED  
**Next Steps:** Update Phase 6 Roadmap, create Supabase PBIs, proceed with v0.1.1

**Date:** 2025-12-25
