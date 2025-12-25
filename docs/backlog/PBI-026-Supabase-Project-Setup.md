# PBI-026: Supabase Project Setup

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Phase:** 6 (High Scores)  
**Target Version:** v0.2.0

---

## User Story

**As a** developer  
**I want** Supabase configured for the project  
**So that** we can implement authentication and leaderboard features

---

## Context

This is the foundational PBI for the Supabase-based leaderboard system. It sets up the Supabase project and configures the necessary services without implementing any application code.

**This PBI is infrastructure-only.** No application code changes except environment configuration.

**Replaces:** PBI-025 (Firebase Project Setup) — Firebase abandoned in favor of Supabase per architecture team recommendation.

---

## Acceptance Criteria

### Supabase Project
- [ ] Supabase project created at https://supabase.com
- [ ] Project name: `void-drift` or `void-drift-prod`
- [ ] Region selected (prefer `us-east-1` or nearest)
- [ ] Free tier confirmed (sufficient for v0.2.0)

### Authentication
- [ ] Anonymous Authentication enabled in Supabase Dashboard
- [ ] No other auth providers enabled (keep minimal)
- [ ] Auth settings confirmed

### PostgreSQL Database
- [ ] Database provisioned automatically by Supabase
- [ ] `highscores` table created with schema (see below)
- [ ] Index created for leaderboard queries

### Row-Level Security (RLS)
- [ ] RLS enabled on `highscores` table
- [ ] Policies deployed (see below)
- [ ] Policies tested in SQL Editor

### Environment Variables
- [ ] `.env.example` updated with Supabase placeholders
- [ ] `.env.local` added to `.gitignore` (if not already)
- [ ] Environment variables documented

---

## Technical Implementation

### Database Schema

**Execute in Supabase SQL Editor:**

```sql
-- Create highscores table
create table highscores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  initials text not null check (initials ~ '^[A-Z]{3}$'),
  uid_hash text not null,
  seconds integer not null check (seconds > 0 and seconds < 1000000),
  death_cause text not null check (death_cause in ('STAR', 'HULL', 'POWER')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index for leaderboard queries (ORDER BY seconds ASC)
create index highscores_seconds_idx on highscores (seconds asc, created_at asc);

-- Enable Row-Level Security
alter table highscores enable row level security;

-- Policy: Anyone can read leaderboard
create policy "Leaderboard is public"
  on highscores for select
  using (true);

-- Policy: Authenticated users can create their own scores
create policy "Users can submit scores"
  on highscores for insert
  with check (auth.uid() = user_id);

-- Scores are immutable (no update/delete policies = denied by default)
```

**Field Descriptions:**
- `id`: Auto-generated UUID primary key
- `user_id`: References Supabase anonymous auth user
- `initials`: 3 uppercase letters (validated by check constraint)
- `uid_hash`: 6-character hash of user_id (prevents duplicate initials confusion)
- `seconds`: Survival time in seconds (1 to 999,999)
- `death_cause`: One of `STAR`, `HULL`, or `POWER`
- `created_at`: Timestamp for tie-breaking

---

### Environment Variables

**Update `.env.example`:**

```bash
# Supabase Configuration
# Copy to .env.local and fill with values from Supabase Dashboard > Settings > API
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** `PUBLIC_` prefix required for Astro to expose to client.

**Get Values From:**
- Supabase Dashboard → Settings → API
- Copy `Project URL` → `PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `PUBLIC_SUPABASE_ANON_KEY`

---

### Testing RLS Policies

**In Supabase SQL Editor, test these queries:**

```sql
-- Test 1: Unauthenticated read should SUCCEED
select * from highscores;
-- Expected: Returns all rows (or empty if no data)

-- Test 2: Unauthenticated insert should FAIL
insert into highscores (user_id, initials, uid_hash, seconds, death_cause)
values ('00000000-0000-0000-0000-000000000000', 'AAA', 'ABC123', 100, 'STAR');
-- Expected: Error (RLS policy violation)

-- Test 3: Authenticated insert with MATCHING user_id should SUCCEED
-- (Requires anonymous session - test via app, not SQL Editor)

-- Test 4: Authenticated update should FAIL
update highscores set seconds = 999 where id = (select id from highscores limit 1);
-- Expected: Error (no update policy exists)

-- Test 5: Authenticated delete should FAIL
delete from highscores where id = (select id from highscores limit 1);
-- Expected: Error (no delete policy exists)
```

---

## Definition of Done

- [ ] Supabase project exists and is accessible
- [ ] Anonymous Auth enabled in Dashboard
- [ ] `highscores` table created with schema
- [ ] RLS policies deployed and tested
- [ ] Environment variables documented in `.env.example`
- [ ] SQL schema saved in project (consider `migrations/` folder for future)

---

## Testing Checklist

### Supabase Dashboard
- [ ] Can access project dashboard
- [ ] Anonymous Auth shows in Authentication → Providers
- [ ] Table Editor shows `highscores` table with correct schema
- [ ] Policies visible in Table Editor → RLS tab

### SQL Editor
- [ ] Test queries execute correctly (see Testing RLS Policies section)
- [ ] Unauthenticated read succeeds
- [ ] Unauthenticated insert fails
- [ ] Update/delete fail (no policies)

### Environment
- [ ] `.env.example` has Supabase placeholders
- [ ] `.env.local` is in `.gitignore`
- [ ] Values from Dashboard match `.env.example` format

---

## Out of Scope

- Supabase client installation (PBI-027)
- Application code changes (PBI-027+)
- Hosting/deployment configuration (Phase 8)
- User accounts (Anonymous only for v0.2.0)

---

## Dependencies

- Supabase account (free tier)
- Access to Supabase Dashboard

---

## Related Documents

- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Supabase Migration Assessment](../SUPABASE-MIGRATION-ASSESSMENT.md)
- [PBI-027: Supabase Client Setup](./PBI-027-Supabase-Client-Setup.md)

---

## Notes

**Why Supabase over Firebase:**
- PostgreSQL better for leaderboards (ORDER BY, rankings)
- RLS simpler than Firestore Rules
- Enables future multiplayer (Supabase Realtime)
- Better free tier for our use case

**Migration Status:**
- Firebase SDK was present but **never implemented** (empty placeholder)
- Zero sunk cost in migration

---

## Acceptance

**Verified by:** Manual testing in Supabase Dashboard + SQL Editor  
**Sign-off:** @Lead
