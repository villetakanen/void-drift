# Phase 6: Foundation & High Scores — Implementation Roadmap

**Versions:** v0.1.x → v0.2.0  
**Status:** 🚧 PLANNING  
**Goal:** Restructure packages for multi-mode support, add QoL improvements, implement high score system

**⚡ ARCHITECTURE UPDATE (2025-12-25):** Pivoting from Firebase to **Supabase** per architecture team recommendation. See [Supabase Migration Assessment](./SUPABASE-MIGRATION-ASSESSMENT.md) for full analysis.

---

## Executive Summary

Phase 6 prepares the codebase for future Mode B (multiplayer) while completing Mode A with a global leaderboard. The phase is split into two tracks:

**Track A: Foundation (v0.1.x)**
- Package restructure (core + mode-a separation)
- QoL improvements and polish

**Track B: High Scores (v0.2.0)**
- **Supabase integration** (Anonymous Auth + PostgreSQL)
- Initials entry UI
- Leaderboard display

**Why This Matters:**
- Clean package structure prevents Mode A/B code mixing
- High scores add replayability and competition
- Foundation work now avoids painful refactoring later
- **Supabase provides unified platform for leaderboards + future multiplayer**

---

## Architecture Pivot: Firebase → Supabase

### Why Supabase?

**Technical Advantages:**
- ✅ PostgreSQL > NoSQL for leaderboards (ORDER BY, rankings, window functions)
- ✅ Supabase Realtime enables future Mode B multiplayer (Phase 9+)
- ✅ Row-Level Security (RLS) simpler than Firestore Rules
- ✅ Better TypeScript support and DX
- ✅ More generous free tier for our use case

**Migration Impact:**
- ✅ **Zero sunk cost:** Firebase SDK present but never implemented (empty placeholder files)
- ✅ Minimal effort increase: +2 story points (13 vs. 11)
- ✅ Timeline unchanged: v0.2.0 still Q1 2025

**Full Analysis:** [docs/SUPABASE-MIGRATION-ASSESSMENT.md](./SUPABASE-MIGRATION-ASSESSMENT.md)

---

## Phase 6 Components

### Track A: Foundation (v0.1.x)

#### PBI-021: Package Restructure
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Target Version:** v0.1.1

**What It Does:**
- Split `packages/engine` into `packages/core` + `packages/mode-a`
- Move shared physics, entities, assets to `core`
- Move survival-specific logic (resources, death, timer) to `mode-a`
- Update all imports across `apps/web`
- Ensure build and tests pass

**Package Structure:**
```
packages/
├── core/                 # @void-drift/core
│   └── src/lib/
│       ├── physics/      # Newtonian motion, gravity, collision
│       ├── entities/     # Ship, Star, Planet (data + behavior)
│       ├── assets/       # Procedural drawing functions
│       ├── schemas/      # Core schemas (Position, Velocity, etc.)
│       └── config.ts     # PHYSICS constants
│
├── mode-a/               # @void-drift/mode-a
│   └── src/
│       ├── schemas/      # GameState, Resources, DeathCause, Settings, HighScore
│       └── lib/
│           ├── game-loop.ts  # Survival-specific loop
│           ├── death.ts      # Death detection logic
│           ├── supabase.ts   # Supabase client initialization
│           └── config.ts     # SURVIVAL_CONFIG
```

**Success Criteria:**
- `pnpm -r build` succeeds
- `pnpm -r check` has zero TypeScript errors
- Game runs identically to v0.1.0
- No functional changes, pure restructure

**Link:** [PBI-021: Package Restructure](./backlog/PBI-021-Package-Restructure.md)

---

#### PBI-022: Button Design System
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Target Version:** v0.1.2

**What It Does:**
- Add button tokens to design system (padding, sizing, transitions)
- Create unified `.btn`, `.btn-ghost`, `.btn-filled`, `.btn-link` classes
- Migrate all button styles from components to global CSS
- Remove duplicated button CSS from GameOver, MenuOverlay, Settings

**Success Criteria:**
- All buttons use global classes
- Visual appearance unchanged
- Zero duplicated button CSS in components

**Link:** [PBI-022: Button Design System](./backlog/PBI-022-Button-Design-System.md)

---

#### PBI-023: Sun Scale System
**Priority:** MEDIUM  
**Estimate:** 5 Story Points  
**Target Version:** v0.1.3

**What It Does:**
- Define sun types: RED_GIANT, YELLOW_DWARF, BLUE_DWARF
- Each type has distinct size, gravity, power/burn multipliers, color
- Random sun type selected each game
- Sun type preview in lab with selector

**Sun Types:**
| Type | Size | Gravity | Power | Burn | Color |
|------|------|---------|-------|------|-------|
| Red Giant | 60px | 0.5x | 0.6x | 0.5x | Red |
| Yellow Dwarf | 40px | 1.0x | 1.0x | 1.0x | Orange |
| Blue Dwarf | 25px | 1.5x | 1.5x | 1.8x | Blue |

**Success Criteria:**
- Each run has random sun type
- Gameplay feels different per sun type
- Lab shows all three types with stats

**Link:** [PBI-023: Sun Scale System](./backlog/PBI-023-Sun-Scale-System.md)

---

#### PBI-024: Lab Stats View
**Priority:** LOW  
**Estimate:** 3 Story Points  
**Target Version:** v0.1.3

**What It Does:**
- Create `LabStats.svelte` component for displaying entity properties
- Show ship stats (radius, speed, thrust, drag)
- Show sun stats (type, multipliers, zone radii)
- Show planet stats (radius, mass, orbit)
- Stats update dynamically with selectors

**Success Criteria:**
- All entity stats visible in lab
- Stats match actual config values
- Clean, readable presentation

**Link:** [PBI-024: Lab Stats View](./backlog/PBI-024-Lab-Stats-View.md)

---

### Track B: High Scores with Supabase (v0.2.0)

#### PBI-026: Supabase Project Setup
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Target Version:** v0.2.0

**What It Does:**
- Create Supabase project
- Provision PostgreSQL database
- Enable Anonymous Authentication
- Create `highscores` table with schema
- Deploy Row-Level Security (RLS) policies
- Configure environment variables

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

create index highscores_seconds_idx on highscores (seconds asc, created_at asc);
```

**Success Criteria:**
- Supabase project accessible
- Database schema deployed
- RLS policies tested and passing
- Environment variables documented

**Link:** [PBI-026: Supabase Project Setup](./backlog/PBI-026-Supabase-Project-Setup.md)

---

#### PBI-027: Supabase Client Setup
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Target Version:** v0.2.0

**What It Does:**
- Install `@supabase/supabase-js` package
- Create `packages/mode-a/src/lib/supabase.ts`
- Implement anonymous auth flow
- Add session persistence
- Create `ensureAnonymousSession()` helper

**Implementation:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.signInAnonymously();
  }
  return session;
}
```

**Success Criteria:**
- Supabase client initializes without errors
- Anonymous auth flow works
- Session persists across page refreshes
- Zero TypeScript errors

**Link:** [PBI-027: Supabase Client Setup](./backlog/PBI-027-Supabase-Client-Setup.md)

---

#### PBI-028: High Score Schema + Submission
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Target Version:** v0.2.0

**What It Does:**
- Create `packages/mode-a/src/schemas/highscore.ts` with Zod schema
- Implement `submitHighScore()` function
- Add UID hash generation (SHA-256 → 6 chars)
- Handle submission errors gracefully

**Schema:**
```typescript
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

**Success Criteria:**
- Zod schema validates correctly
- `submitHighScore()` inserts to Supabase
- UID hash generates consistently
- Errors handled gracefully

**Link:** [PBI-028: High Score Schema + Submission](./backlog/PBI-028-High-Score-Schema.md)

---

#### PBI-029: Initials Entry UI
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Target Version:** v0.2.0

**What It Does:**
- Create `InitialsEntry.svelte` component
- Arcade-style 3-letter input (A-Z only)
- Keyboard navigation (Arrow keys + Enter)
- On-screen buttons for mobile
- Display UID hash preview
- Submit button → calls `submitHighScore()`

**UX Flow:**
```
Game Over → InitialsEntry → Submitting... → Leaderboard
```

**Success Criteria:**
- Component renders correctly
- Keyboard and on-screen input both work
- Validates A-Z letters only
- Disables submit until 3 letters entered
- Shows loading state during submission

**Link:** [PBI-029: Initials Entry UI](./backlog/PBI-029-Initials-Entry-UI.md)

---

#### PBI-030: Leaderboard Display
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Target Version:** v0.2.0

**What It Does:**
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

**Success Criteria:**
- Leaderboard displays top 20 scores
- Loads in <2 seconds
- Shows loading spinner
- Handles empty state gracefully
- Highlights current player's score

**Link:** [PBI-030: Leaderboard Display](./backlog/PBI-030-Leaderboard-Display.md)

---

## Implementation Strategy

### v0.1.1: Package Restructure
- **PBI-021:** Split engine → core + mode-a
- Pure refactor, no functional changes
- **Critical for v0.2.0:** Enables Mode A to have Supabase dependencies

### v0.1.2: Design System Polish
- **PBI-022:** Button Design System
- Unified button styles across app
- Prepares UI foundation for leaderboard components

### v0.1.3: Sun Variety & Lab Improvements
- **PBI-023:** Sun Scale System (random sun types)
- **PBI-024:** Lab Stats View (entity stats in lab)
- Adds gameplay variety and polish

### v0.2.0: High Score System with Supabase
1. **PBI-026:** Supabase Project Setup (infrastructure)
2. **PBI-027:** Supabase Client Setup (auth + client)
3. **PBI-028:** High Score Schema + Submission (backend logic)
4. **PBI-029:** Initials Entry UI (frontend component)
5. **PBI-030:** Leaderboard Display (frontend route)

**Total Estimate:** 13 story points (Track B)

---

## Dependencies

### External Dependencies
- ✅ Phase 5 complete (v0.1.0 shipped)
- ⏳ Supabase project setup required for Track B
- ⏳ Supabase CLI installed (`npm install -g supabase`)

### Internal Dependencies
- **Critical:** PBI-021 (Package Restructure) must complete before Track B
- Supabase PBIs should execute in order (026 → 027 → 028 → 029 → 030)
- PBI-022 (Button Design) should complete before UI PBIs (029, 030)

---

## Success Metrics

### Technical
- Zero TypeScript errors after restructure
- Build time not significantly increased
- No runtime regressions
- RLS policies prevent unauthorized writes
- Session persists across page refreshes

### Gameplay (v0.2.0)
- Player can submit score after death
- Leaderboard displays within 2 seconds
- Scores persist across sessions
- UID hash prevents duplicate initials confusion
- Top 20 leaderboard updates in real-time

---

## Out of Scope (Phase 7+)

- ❌ Sound effects
- ❌ Additional planets
- ❌ Visual effects (particles, screen shake)
- ❌ Mode B (multiplayer) — Deferred to Phase 9+ (post-v1.0.0)
- ❌ User accounts (Anonymous auth only for v0.2.0)
- ❌ Global leaderboard pagination (Top 20 only)

---

## Future: Mode B Multiplayer (Phase 9+)

**Why Supabase enables this:**
- Supabase Realtime supports WebSocket-based physics sync (15-20Hz)
- PostgreSQL `matches` table handles lobby/matchmaking
- Broadcast channels relay ship positions between clients
- Dead reckoning + interpolation smooths latency

**Deferred Architecture (for reference):**
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

**See:** [Supabase Migration Assessment - Mode B Section](./SUPABASE-MIGRATION-ASSESSMENT.md#future-mode-b-multiplayer-phase-9)

---

## Resources

### Documentation
- [Supabase Migration Assessment](./SUPABASE-MIGRATION-ASSESSMENT.md) — Full technical analysis
- [Leaderboard System Spec](./specs/leaderboard-system.md) — Feature spec (TBD)

### PBIs (Execution Order)

**Track A (Foundation):**
1. [PBI-021: Package Restructure](./backlog/PBI-021-Package-Restructure.md) — v0.1.1
2. [PBI-022: Button Design System](./backlog/PBI-022-Button-Design-System.md) — v0.1.2
3. [PBI-023: Sun Scale System](./backlog/PBI-023-Sun-Scale-System.md) — v0.1.3
4. [PBI-024: Lab Stats View](./backlog/PBI-024-Lab-Stats-View.md) — v0.1.3

**Track B (High Scores):**
5. [PBI-026: Supabase Project Setup](./backlog/PBI-026-Supabase-Project-Setup.md) — v0.2.0
6. [PBI-027: Supabase Client Setup](./backlog/PBI-027-Supabase-Client-Setup.md) — v0.2.0
7. [PBI-028: High Score Schema + Submission](./backlog/PBI-028-High-Score-Schema.md) — v0.2.0
8. [PBI-029: Initials Entry UI](./backlog/PBI-029-Initials-Entry-UI.md) — v0.2.0
9. [PBI-030: Leaderboard Display](./backlog/PBI-030-Leaderboard-Display.md) — v0.2.0

---

## Changelog

### 2025-12-25: Architecture Pivot to Supabase
- ❌ Removed PBI-025 (Firebase Project Setup)
- ✅ Added PBI-026 (Supabase Project Setup)
- ✅ Added PBI-027 (Supabase Client Setup)
- ✅ Added PBI-028 (High Score Schema + Submission)
- ✅ Added PBI-029 (Initials Entry UI)
- ✅ Added PBI-030 (Leaderboard Display)
- ✅ Updated Track B estimate: 13 story points (was 11)
- ✅ Created [SUPABASE-MIGRATION-ASSESSMENT.md](./SUPABASE-MIGRATION-ASSESSMENT.md)

---

## Sign-Off

**Phase Lead:** @Lead  
**Architecture Team Approval:** ✅ APPROVED (2025-12-25)  
**Target Completion:** Q1 2025

**Next Steps:**
1. ✅ Complete PBI-026 through PBI-030 documentation
2. ⏳ Begin PBI-021 implementation (v0.1.1)
3. ⏳ Set up Supabase project (PBI-026)
