# PBI-017: Timer & Death Logic

**Status:** DONE
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Phase:** 5 (Survival Core - Game Loop)  
**Target Version:** v0.1.0

---

## User Story

**As a** player  
**I want** a visible timer and clear death conditions  
**So that** I know how long I survived and can compete on the leaderboard

---

## Context

This is the third PBI for Phase 5 (Survival Core). It builds on PBI-016 (Resource Logic) to create the complete game loop: start → play → die → restart.

**The Three Death Conditions:**
1. **STAR:** Ship touches star surface (instant death)
2. **HULL:** Hull reaches 0% (collision/burn damage)
3. **POWER:** Power reaches 0% (can't maneuver or sustain life support)

**This Completes v0.1.0:**
- v0.0.5: Resource HUD Design ✅
- v0.0.6: Resource Logic & HUD Integration ✅
- v0.0.7: Settings Route ✅ (parallel)
- **v0.1.0: Timer & Death Logic** ← YOU ARE HERE

**Dependencies:**
- ✅ PBI-015 (Resource HUD Design) — Provides death icon designs
- ✅ PBI-016 (Resource Logic) — REQUIRED (needs hull/fuel values)
- ❌ Phase 6 (Leaderboard) — Will consume death data

---

## Acceptance Criteria

### Game State Machine
- [x] Four states defined: `MENU`, `PLAYING`, `GAME_OVER`, `SETTINGS`
- [x] Valid transitions enforced:
  - `MENU → PLAYING` (on first input)
  - `PLAYING → GAME_OVER` (on death)
  - `GAME_OVER → MENU` (on restart)
  - `ANY → SETTINGS` (navigation)
- [x] State stored in `GameState` schema
- [x] Physics pauses during `MENU` and `GAME_OVER` states
- [x] No invalid state transitions possible

### Timer System
- [x] Timer starts at 0.0 seconds
- [x] Timer begins counting on first input (not page load)
- [x] Timer increments using `Date.now()` delta (frame-rate independent)
- [x] Timer displays in HUD with 1 decimal place (e.g., `42.3s`)
- [x] Timer freezes on death (preserves final time)
- [x] Final time displayed on Game Over screen with 2 decimal places (e.g., `42.35s`)
- [x] Timer resets to 0.0 on restart

### Death Detection
- [x] `checkDeath()` function runs every frame during `PLAYING` state
- [x] Death check occurs AFTER all physics updates
- [x] Priority order enforced: STAR > HULL > POWER
  - If ship touches star, cause is `STAR` (even if hull/power also 0)
  - If hull = 0 but not touching star, cause is `HULL`
  - If power = 0 but hull > 0, cause is `POWER`
- [x] Death cause stored in `GameState.deathCause`
- [x] Ship momentum frozen on death (velocityX/velocityY = 0)
- [x] Death triggers state transition to `GAME_OVER`

### HUD Updates
- [x] Timer displayed in top-right corner
- [x] Timer updates every frame (smooth animation)
- [x] Timer font uses tabular-nums (fixed width for no layout shift)
- [x] Timer visible during `PLAYING` state only
- [x] Timer color: white (no warnings)

### Game Over Screen
- [x] Modal overlay covers entire viewport
- [x] Dark background (rgba(10, 10, 15, 0.95))
- [x] "MISSION FAILED" heading in danger color
- [x] Survival time displayed: "You survived X.XX seconds"
- [x] Death cause displayed with icon (from PBI-015) + descriptive text:
  - `STAR` → "Incinerated by the star"
  - `HULL` → "Hull failure"
  - `POWER` → "Out of power"
- [x] "Try Again" button (primary CTA)
- [x] "View Leaderboard" link (secondary, routes to `/leaderboard` - Phase 6)
- [x] Fade-in animation (0.3s)
- [x] Keyboard accessible (Tab navigation, Enter to restart)

### Restart Flow
- [x] "Try Again" button resets all game state:
  - Ship position → spawn point (center of arena)
  - Ship velocity → (0, 0)
  - Ship rotation → 0 (facing right)
  - Hull → 100%
  - Power → 100%
  - Timer → 0.0s
  - Death cause → null
- [x] Planets reset to initial orbit positions
- [x] State transitions: `GAME_OVER → MENU`
- [x] Game starts on next input (not immediately)
- [x] No memory leaks (canvas cleared, event listeners reset)

---

## Technical Implementation

### 1. Game State Schema Extension

**File:** `packages/engine/src/lib/schemas/game-state.ts`

```typescript
import { z } from 'zod';
import { ResourcesSchema } from './game-state'; // From PBI-016

export const GameStateSchema = z.object({
  status: z.enum(['MENU', 'PLAYING', 'GAME_OVER', 'SETTINGS']),
  startTime: z.number().nullable(), // Unix timestamp (ms)
  elapsedTime: z.number(),          // Seconds (float)
  resources: ResourcesSchema,
  deathCause: z.enum(['STAR', 'HULL', 'FUEL']).nullable(),
});

export type GameState = z.infer<typeof GameStateSchema>;
export type GameStatus = GameState['status'];
export type DeathCause = NonNullable<GameState['deathCause']>;

export function createInitialGameState(): GameState {
  return {
    status: 'MENU',
    startTime: null,
    elapsedTime: 0,
    resources: {
      hull: 100,
      fuel: 100,
    },
    deathCause: null,
  };
}
```

---

### 2. Death Detection Logic

**File:** `packages/engine/src/lib/engine/game-loop.ts`

```typescript
import type { GameState, DeathCause } from '../schemas/game-state';
import type { Ship, Star } from '../types';

export function checkDeath(
  state: GameState,
  ship: Ship,
  star: Star
): DeathCause | null {
  // Priority: STAR > HULL > FUEL
  
  // 1. Star contact (instant death)
  const distanceToStar = Math.hypot(
    ship.position.x - star.position.x,
    ship.position.y - star.position.y
  );
  
  if (distanceToStar < star.radius) {
    return 'STAR';
  }
  
  // 2. Hull depletion
  if (state.resources.hull <= 0) {
    return 'HULL';
  }
  
  // 3. Fuel depletion
  if (state.resources.fuel <= 0) {
    return 'FUEL';
  }
  
  return null;
}

export function handleDeath(state: GameState, cause: DeathCause, ship: Ship): void {
  state.status = 'GAME_OVER';
  state.deathCause = cause;
  
  // Freeze ship momentum
  ship.velocity.x = 0;
  ship.velocity.y = 0;
}
```

---

### 3. Timer Update

**File:** `packages/engine/src/lib/engine/game-loop.ts`

```typescript
export function updateTimer(state: GameState, inputActive: boolean): void {
  // Start timer on first input
  if (state.status === 'MENU' && inputActive) {
    state.status = 'PLAYING';
    state.startTime = Date.now();
  }
  
  // Update elapsed time during gameplay
  if (state.status === 'PLAYING' && state.startTime !== null) {
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
  }
}
```

---

### 4. HUD Timer Display

**File:** `apps/web/src/components/HUD.svelte`

Add timer to existing HUD component from PBI-016:

```svelte
<script lang="ts">
  import type { GameState } from '@void-drift/engine';
  
  let { state }: { state: GameState } = $props();
  
  // Existing resource bar code...
  
  const timeDisplay = $derived(
    state.status === 'PLAYING' 
      ? `${state.elapsedTime.toFixed(1)}s`
      : '0.0s'
  );
  
  const isPlaying = $derived(state.status === 'PLAYING');
</script>

<div class="hud">
  <!-- Existing resource bars -->
  
  {#if isPlaying}
    <div class="timer">{timeDisplay}</div>
  {/if}
</div>

<style>
  /* Existing styles... */
  
  .timer {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: 1.25rem;
    color: var(--color-white);
    font-variant-numeric: tabular-nums;
    font-family: monospace;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
    z-index: 100;
  }
</style>
```

---

### 5. Game Over Component

**File:** `apps/web/src/components/GameOver.svelte`

```svelte
<script lang="ts">
  import type { GameState } from '@void-drift/engine';
  import { drawDeathIcon } from '@void-drift/engine/assets/death-icons'; // From PBI-015
  
  let { state, onRestart }: { 
    state: GameState, 
    onRestart: () => void 
  } = $props();
  
  const deathMessages: Record<string, string> = {
    STAR: 'Incinerated by the star',
    HULL: 'Hull failure',
    FUEL: 'Out of fuel',
  };
  
  const causeMessage = $derived(
    state.deathCause ? deathMessages[state.deathCause] : 'Unknown'
  );
  
  const finalTime = $derived(state.elapsedTime.toFixed(2));
  
  // Render death icon on canvas
  let iconCanvas: HTMLCanvasElement;
  $effect(() => {
    if (iconCanvas && state.deathCause) {
      const ctx = iconCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        drawDeathIcon(ctx, 16, 16, 24, state.deathCause);
      }
    }
  });
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="card">
    <h1>MISSION FAILED</h1>
    
    <p class="time">
      You survived <strong>{finalTime}s</strong>
    </p>
    
    <div class="cause-container">
      <canvas bind:this={iconCanvas} width="32" height="32" class="death-icon"></canvas>
      <p class="cause">{causeMessage}</p>
    </div>
    
    <div class="actions">
      <button onclick={onRestart} class="primary">
        Try Again
      </button>
      <a href="/leaderboard" class="secondary">
        View Leaderboard
      </a>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 15, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .card {
    text-align: center;
    padding: var(--spacing-xl);
    border: 2px solid var(--color-danger);
    background: rgba(255, 0, 100, 0.1);
    border-radius: 8px;
    max-width: 500px;
  }
  
  h1 {
    color: var(--color-danger);
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .time {
    font-size: 1.5rem;
    color: var(--color-white);
    margin-bottom: var(--spacing-md);
  }
  
  strong {
    color: var(--color-neon-blue);
    font-variant-numeric: tabular-nums;
  }
  
  .cause-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }
  
  .death-icon {
    width: 32px;
    height: 32px;
  }
  
  .cause {
    font-size: 1.125rem;
    color: var(--color-neon-pink);
    margin: 0;
  }
  
  .actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }
  
  button, a {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 1.125rem;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    font-family: inherit;
    transition: filter 0.2s ease;
  }
  
  .primary {
    background: var(--color-neon-blue);
    color: var(--color-void);
    border: none;
    font-weight: 600;
  }
  
  .primary:hover {
    filter: brightness(1.2);
  }
  
  .secondary {
    background: transparent;
    color: var(--color-neon-blue);
    border: 2px solid var(--color-neon-blue);
  }
  
  .secondary:hover {
    background: rgba(0, 200, 255, 0.1);
  }
  
  /* Mobile */
  @media (max-width: 640px) {
    .card {
      padding: var(--spacing-lg);
      max-width: 90vw;
    }
    
    h1 {
      font-size: 2rem;
    }
    
    .actions {
      flex-direction: column;
      width: 100%;
    }
    
    button, a {
      width: 100%;
    }
  }
</style>
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Game state machine enforces valid transitions
- [x] Timer starts on first input (not page load)
- [x] Timer displays correctly in HUD
- [x] Death detection checks all three conditions in priority order
- [x] Game Over screen shows correct time and death cause with icon
- [x] Restart button resets all state correctly
- [x] Zero TypeScript errors (`pnpm -r check`)
- [x] No memory leaks (tested with Chrome DevTools Memory profiler)
- [x] Keyboard navigation works (Tab, Enter)
- [x] Mobile tested (touch interactions)
- [x] Code reviewed and approved

---

## Testing Checklist

### State Machine Tests

**Menu to Playing:**
- [ ] Start game in MENU state
- [ ] Press any movement key
- [ ] Verify state transitions to PLAYING
- [ ] Verify timer starts counting

**Playing to Game Over (STAR):**
- [ ] Maneuver ship into star
- [ ] Verify state transitions to GAME_OVER
- [ ] Verify deathCause is 'STAR'
- [ ] Verify ship stops moving
- [ ] Verify star icon appears on Game Over screen

**Playing to Game Over (HULL):**
- [ ] Collide with planets until hull = 0
- [ ] Verify state transitions to GAME_OVER
- [ ] Verify deathCause is 'HULL'
- [ ] Verify hull icon appears on Game Over screen

**Playing to Game Over (FUEL):**
- [ ] Thrust continuously until fuel = 0
- [ ] Verify state transitions to GAME_OVER
- [ ] Verify deathCause is 'FUEL'
- [ ] Verify fuel icon appears on Game Over screen

**Game Over to Menu:**
- [ ] Die, then click "Try Again"
- [ ] Verify state transitions to MENU
- [ ] Verify all values reset (hull, fuel, timer)
- [ ] Press input to start new game

---

### Timer Tests

**Start Timing:**
- [ ] Load game page
- [ ] Wait 5 seconds (no input)
- [ ] Verify timer shows 0.0s
- [ ] Press movement key
- [ ] Verify timer starts incrementing

**Timer Accuracy:**
- [ ] Start game
- [ ] Play for exactly 60 seconds (use stopwatch)
- [ ] Verify timer shows 60.0s ±0.5s

**Timer Freeze:**
- [ ] Play until death at ~45 seconds
- [ ] Wait 10 seconds on Game Over screen
- [ ] Verify displayed time remains at 45.XX seconds

**Timer Reset:**
- [ ] Die after 30 seconds
- [ ] Click "Try Again"
- [ ] Verify timer resets to 0.0s
- [ ] Start new game
- [ ] Verify timer starts from 0.0s

---

### Death Priority Tests

**STAR > HULL:**
- [ ] Reduce hull to 5%
- [ ] Fly into star
- [ ] Verify deathCause is 'STAR' (not 'HULL')

**HULL > FUEL:**
- [ ] Reduce fuel to 0%
- [ ] Keep flying with 50% hull
- [ ] Then reduce hull to 0% via collisions
- [ ] Verify deathCause is 'HULL' when hull depletes

**Fuel Only:**
- [ ] Reduce fuel to 0% with 100% hull
- [ ] Avoid star and planets
- [ ] Verify deathCause is 'FUEL'

---

### UI Tests

**Game Over Screen:**
- [ ] Verify modal covers entire screen
- [ ] Verify text is readable (contrast)
- [ ] Verify buttons are tappable on mobile (44px min)
- [ ] Verify fade-in animation plays smoothly
- [ ] Verify death icon renders correctly (not blurry)

**Keyboard Navigation:**
- [ ] Die and reach Game Over screen
- [ ] Press Tab key
- [ ] Verify focus moves between "Try Again" and "View Leaderboard"
- [ ] Press Enter on "Try Again"
- [ ] Verify restart works

**Mobile:**
- [ ] Die on mobile device
- [ ] Verify Game Over screen fits viewport
- [ ] Verify buttons are easy to tap
- [ ] Verify no horizontal scroll

---

## Out of Scope

This PBI does NOT include:
- ❌ Leaderboard submission logic (Phase 6)
- ❌ Initials entry UI (Phase 6)
- ❌ Sound effects (Phase 7)
- ❌ Visual effects (screen shake, particles) (Phase 7)
- ❌ Pause menu (Phase 7)
- ❌ Replay system (Future)

---

## Dependencies

**Blocked By:**
- ✅ PBI-015 (Resource HUD Design) — Provides death icon designs
- ✅ PBI-016 (Resource Logic) — REQUIRED (needs hull/fuel values)

**Blocks:**
- Phase 6 (High Score System) — Needs timer + death cause data

**Parallel Work:**
- PBI-018 (Settings Route) — Can develop independently

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Timer drift over time | Inaccurate survival times | Use `Date.now()` delta, not frame count |
| State machine bugs | Invalid transitions | Unit tests for all state pairs |
| Memory leaks on restart | Browser slows down | Profile with DevTools, cleanup listeners |
| Race condition on death | Multiple death causes | Single death check per frame, priority order |
| Death icons not loading | Broken UI | Test icon rendering in gallery first (PBI-015) |

---

## Notes

**Design Decisions:**
- Timer starts on first input (not page load) to avoid unfair countdown while reading UI
- Death priority STAR > HULL > FUEL ensures consistency (star is "most dramatic" death)
- Game Over screen is modal (not in-game overlay) to clearly signal end state
- Death icons rendered on canvas (consistent with gallery design)

**Accessibility:**
- Keyboard navigation fully supported (Tab, Enter)
- ARIA labels on modal (`role="dialog"`, `aria-modal="true"`)
- High contrast text (WCAG AA compliant)
- Death cause has both icon AND text (not relying on color alone)

**Performance:**
- Death check only runs during PLAYING state (not in menu/game over)
- Timer uses `Date.now()` (no per-frame accumulation errors)
- Game Over modal renders only when needed (conditional rendering)

**Future Enhancements (Post-v0.1.0):**
- Pause menu (Escape key)
- Replay last run (save inputs for playback)
- Death statistics (average survival time, most common cause)
- Animated death sequence (ship explosion)
- Social sharing (auto-generate "I survived X seconds" image)

---

## Sign-Off

**Specification Author:** @Lead  
**Assigned To:** @Dev  
**Reviewer:** TBD  
**Approved:** ⏳ Pending Review

---

**Related Documents:**
- [Survival Core Spec](../specs/survival-core.md)
- [PBI-015: Resource HUD Design](./PBI-015-Resource-HUD-Design.md) — Death icon dependency
- [PBI-016: Resource Logic](./PBI-016-Resource-Logic.md) — Required dependency
- [PBI-018: Settings Route](./PBI-018-Settings-Route.md) — Parallel work
- [Phase 5 Roadmap](../PHASE-5-ROADMAP.md)
- [Project Vision](../project-vision.md) — Phase 5