# PBI-030: Leaderboard Display

**Status:** DONE  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 6 (High Scores)  
**Target Version:** v0.2.0

---

## User Story

**As a** player  
**I want** to view the global leaderboard  
**So that** I can see how my score compares to other players

---

## Context

This PBI implements the leaderboard display page that shows the top 20 high scores. It provides the final piece of the high score system, allowing players to see the results of their submissions.

**Prerequisites:**
- PBI-026 (Supabase Project Setup)
- PBI-027 (Supabase Client Setup)
- PBI-028 (High Score Schema + Submission)

---

## Acceptance Criteria

### Route Creation
- [ ] Create `/leaderboard` route in Astro
- [ ] Accessible from GameOver screen
- [ ] Accessible from main menu

### Data Display
- [ ] Display top 20 scores from Supabase
- [ ] Show: Rank, Initials, UID Hash, Time, Death Cause
- [ ] Highlight current player's score (if in top 20)
- [ ] Scores ordered by time (ascending)

### Loading States
- [ ] Show loading spinner while fetching data
- [ ] Handle empty state (no scores yet)
- [ ] Handle error state (network failure)

### Formatting
- [ ] Time displayed as MM:SS format
- [ ] Death cause icons/colors (STAR = red, HULL = orange, POWER = blue)
- [ ] Rank displayed as #1, #2, etc.
- [ ] Current player's score highlighted

### Navigation
- [ ] "Play Again" button → returns to game
- [ ] "Back to Menu" button → returns to main menu
- [ ] Link from GameOver screen after submission

---

## Technical Implementation

### Route Setup

**File:** `apps/web/src/pages/leaderboard.astro`

```astro
---
import Layout from '../layouts/Layout.astro';
import Leaderboard from '../components/Leaderboard.svelte';
---

<Layout title="Leaderboard - Void Drift">
  <Leaderboard client:load />
</Layout>
```

---

### Leaderboard Component

**File:** `apps/web/src/components/Leaderboard.svelte`

```svelte
<script lang="ts">
  import { supabase } from '@void-drift/mode-a/supabase';
  import { onMount } from 'svelte';

  type HighScoreRow = {
    id: string;
    user_id: string;
    initials: string;
    uid_hash: string;
    seconds: number;
    death_cause: 'STAR' | 'HULL' | 'POWER';
    created_at: string;
  };

  let scores = $state<HighScoreRow[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let currentUserId = $state<string | null>(null);

  onMount(async () => {
    await loadLeaderboard();
  });

  async function loadLeaderboard() {
    isLoading = true;
    error = null;

    try {
      // Get current user ID for highlighting
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user.id ?? null;

      // Fetch top 20 scores
      const { data, error: fetchError } = await supabase
        .from('highscores')
        .select('*')
        .order('seconds', { ascending: true })
        .order('created_at', { ascending: true }) // Tie-breaker
        .limit(20);

      if (fetchError) {
        throw fetchError;
      }

      scores = data ?? [];
    } catch (err) {
      console.error('[Leaderboard] Failed to load scores:', err);
      error = err instanceof Error ? err.message : 'Failed to load leaderboard';
    } finally {
      isLoading = false;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getDeathCauseColor(cause: 'STAR' | 'HULL' | 'POWER'): string {
    switch (cause) {
      case 'STAR': return 'var(--color-error)';
      case 'HULL': return 'var(--color-warning)';
      case 'POWER': return 'var(--color-info)';
    }
  }

  function getDeathCauseIcon(cause: 'STAR' | 'HULL' | 'POWER'): string {
    switch (cause) {
      case 'STAR': return '☀️';
      case 'HULL': return '💥';
      case 'POWER': return '🔋';
    }
  }
</script>

<div class="leaderboard-page">
  <header>
    <h1>Global Leaderboard</h1>
    <p class="subtitle">Top 20 Longest Survival Times</p>
  </header>

  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading leaderboard...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>Failed to load leaderboard</p>
      <p class="error-message">{error}</p>
      <button class="btn btn-filled" onclick={loadLeaderboard}>
        Retry
      </button>
    </div>
  {:else if scores.length === 0}
    <div class="empty">
      <p>No scores yet!</p>
      <p class="empty-hint">Be the first to submit a score.</p>
      <a href="/" class="btn btn-filled">Play Game</a>
    </div>
  {:else}
    <div class="leaderboard">
      <table>
        <thead>
          <tr>
            <th class="rank-col">Rank</th>
            <th class="player-col">Player</th>
            <th class="time-col">Time</th>
            <th class="death-col">Death</th>
          </tr>
        </thead>
        <tbody>
          {#each scores as score, index}
            <tr class:highlight={score.user_id === currentUserId}>
              <td class="rank-col">
                #{index + 1}
              </td>
              <td class="player-col">
                <span class="initials">{score.initials}</span>
                <span class="uid-hash">_{score.uid_hash}</span>
              </td>
              <td class="time-col">
                {formatTime(score.seconds)}
              </td>
              <td class="death-col">
                <span
                  class="death-badge"
                  style="color: {getDeathCauseColor(score.death_cause)}"
                  title={score.death_cause}
                >
                  {getDeathCauseIcon(score.death_cause)} {score.death_cause}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="actions">
      <a href="/" class="btn btn-filled">Play Again</a>
      <button class="btn btn-ghost" onclick={loadLeaderboard}>
        Refresh
      </button>
    </div>
  {/if}
</div>

<style>
  .leaderboard-page {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  header {
    text-align: center;
  }

  h1 {
    font-size: var(--font-size-xxl);
    color: var(--color-text-primary);
    margin: 0;
  }

  .subtitle {
    color: var(--color-text-secondary);
    margin-top: var(--space-xs);
  }

  .loading,
  .error,
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-xxl);
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border-subtle);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    color: var(--color-error);
    font-size: var(--font-size-sm);
  }

  .empty-hint {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .leaderboard {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
  }

  thead {
    border-bottom: 2px solid var(--color-border-default);
  }

  th {
    padding: var(--space-md);
    text-align: left;
    font-weight: bold;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
  }

  tbody tr {
    border-bottom: 1px solid var(--color-border-subtle);
    transition: background-color 0.2s ease;
  }

  tbody tr:hover {
    background-color: var(--color-bg-hover);
  }

  tbody tr.highlight {
    background-color: var(--color-accent-primary-alpha-10);
    border-color: var(--color-accent-primary);
  }

  td {
    padding: var(--space-md);
  }

  .rank-col {
    width: 80px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .player-col {
    min-width: 150px;
  }

  .initials {
    font-weight: bold;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
  }

  .uid-hash {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    margin-left: var(--space-xs);
  }

  .time-col {
    width: 120px;
    font-weight: bold;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
  }

  .death-col {
    width: 150px;
  }

  .death-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    padding-top: var(--space-lg);
  }

  /* Mobile responsive */
  @media (max-width: 600px) {
    table {
      font-size: var(--font-size-sm);
    }

    th,
    td {
      padding: var(--space-sm);
    }

    .uid-hash {
      display: block;
      margin-left: 0;
      margin-top: var(--space-xs);
    }

    .death-badge {
      font-size: var(--font-size-xs);
    }
  }
</style>
```

---

## Definition of Done

- [ ] `/leaderboard` route created
- [ ] Leaderboard component renders correctly
- [ ] Fetches top 20 scores from Supabase
- [ ] Displays all required fields (rank, initials, hash, time, death)
- [ ] Time formatted as MM:SS
- [ ] Death cause color-coded
- [ ] Current player's score highlighted (if in top 20)
- [ ] Loading state shows spinner
- [ ] Empty state shows "No scores yet"
- [ ] Error state shows retry button
- [ ] Navigation buttons work
- [ ] Mobile responsive layout
- [ ] Zero TypeScript errors

---

## Testing Checklist

### Data Fetching
- [ ] Leaderboard loads on page load
- [ ] Shows top 20 scores only
- [ ] Scores ordered by time (ascending)
- [ ] Tie-breaker uses `created_at` (earlier = higher rank)

### Display Formatting
- [ ] Rank displays as #1, #2, etc.
- [ ] Initials + UID hash displayed correctly
- [ ] Time formatted as MM:SS (e.g., 123 seconds = "2:03")
- [ ] Death cause shows icon + text
- [ ] STAR = red, HULL = orange, POWER = blue

### Highlighting
- [ ] Submit a score
- [ ] Navigate to `/leaderboard`
- [ ] Verify your score is highlighted (if in top 20)
- [ ] Verify no highlight if not in top 20

### Loading States
- [ ] Initial load shows spinner
- [ ] Data loads and spinner disappears
- [ ] Refresh button shows spinner during reload

### Empty State
- [ ] Clear all scores from Supabase
- [ ] Navigate to `/leaderboard`
- [ ] Verify "No scores yet" message
- [ ] Verify "Play Game" button works

### Error State
- [ ] Disconnect network
- [ ] Navigate to `/leaderboard`
- [ ] Verify error message displays
- [ ] Reconnect network
- [ ] Click "Retry" button
- [ ] Verify data loads successfully

### Navigation
- [ ] "Play Again" button navigates to `/`
- [ ] "Refresh" button reloads data
- [ ] Back button returns to previous page

### Mobile
- [ ] Test on mobile viewport (320px wide)
- [ ] Table scrolls horizontally if needed
- [ ] Text remains readable
- [ ] Buttons remain accessible

---

## Out of Scope

- Pagination (top 20 only for v0.2.0)
- Filtering by death cause
- Sorting by different columns
- Player profiles
- Score history (player's past scores)
- Global stats (total players, average time, etc.)

---

## Dependencies

- **Requires:** PBI-026 (Supabase Project Setup)
- **Requires:** PBI-027 (Supabase Client Setup)
- **Requires:** PBI-028 (High Score Schema + Submission)
- **Recommended:** PBI-022 (Button Design System) — for consistent styling

---

## Related Documents

- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Supabase Migration Assessment](../SUPABASE-MIGRATION-ASSESSMENT.md)
- [PBI-028: High Score Schema + Submission](./PBI-028-High-Score-Schema.md)
- [PBI-029: Initials Entry UI](./PBI-029-Initials-Entry-UI.md)

---

## Notes

**Query Optimization:**
- Index on `(seconds ASC, created_at ASC)` ensures fast queries
- `LIMIT 20` keeps payload small
- No N+1 queries (single query fetches all data)

**Real-Time Updates (Future):**
- Supabase Realtime can subscribe to table changes
- `supabase.channel('highscores').on('postgres_changes', ...)`
- Deferred to Phase 7+ (polish)

**UX Considerations:**
- Highlight current player's score for instant feedback
- MM:SS format more readable than raw seconds
- Color-coded death causes for visual variety
- Mobile-first responsive design

**Performance:**
- Top 20 only (small payload, fast load)
- No images (text + CSS only)
- Spinner prevents perceived slowness

---

## Acceptance

**Verified by:** Manual testing on desktop + mobile  
**Sign-off:** @Lead
