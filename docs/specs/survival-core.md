# Feature: Survival Core (Mode A Gameplay)

**Status:** ✅ COMPLETE  
**Version:** v0.1.0  
**Phase:** 5 (Survival Core)

---

## Blueprint

### Context

Phase 5 transforms the physics sandbox into a complete single-player survival game. This feature introduces resource management (hull + fuel), three distinct death conditions, a game state machine, and player settings persistence.

**Why This Exists:**
- Mode A requires a win/loss condition beyond physics experimentation
- Fuel/hull creates risk/reward tension (sun proximity = refuel + danger)
- Settings allow accessibility (control inversion for left-handed players)
- Timer + death cause tracking enable leaderboard system (Phase 6)

**Dependencies:**
- ✅ Phase 4 complete (camera, viewport, star, planet, controls)
- ❌ Firebase (deferred to Phase 6)
- ❌ Leaderboard UI (deferred to Phase 6)

---

### Architecture

#### 1. Resource System

**Data Model:**

```typescript
// packages/engine/src/lib/schemas/game-state.ts
import { z } from 'zod';

export const ResourcesSchema = z.object({
  hull: z.number().min(0).max(100),     // Percentage (100% = full health)
  power: z.number().min(0).max(100),     // Percentage (100% = full battery)
});

export const GameStateSchema = z.object({
  status: z.enum(['MENU', 'PLAYING', 'GAME_OVER']),
  startTime: z.number().nullable(),     // Unix timestamp (ms)
  elapsedTime: z.number(),               // Seconds (float)
  resources: ResourcesSchema,
  deathCause: z.enum(['STAR', 'HULL', 'POWER']).nullable(),
});

export type GameState = z.infer<typeof GameStateSchema>;
export type DeathCause = 'STAR' | 'HULL' | 'POWER';
```

**State Transitions:**

```
MENU ──[first input]──> PLAYING ──[death]──> GAME_OVER ──[restart]──> MENU
  │                        │                      │
  │                        │                      └─> [view leaderboard]
  └────────────────────────┴─────────────────────────> [settings]
```

---

#### 2. Power System

**Consumption:**
- Power depletes constantly at a fixed rate
- Consumption rate: **1.0% per second** (constant decay)
- Life support and basic systems consume power regardless of thrusting

**Regeneration (Sun Proximity):**

```typescript
// Pseudo-code for sun refuel zones
const distanceToSun = Math.hypot(ship.x - sun.x, ship.y - sun.y);

if (distanceToSun < 100) {
  // ZONE 1: High Risk / High Reward
  powerRegenRate = 4.0; // % per second
  hullDamageRate = 1.5; // % per second
} else if (distanceToSun < 170) {
  // ZONE 2: Medium Risk / Medium Reward
  fuelRegenRate = 2.0;
  hullDamageRate = 0.5;
} else if (distanceToSun < 240) {
  // ZONE 3: Low Risk / Low Reward
  fuelRegenRate = 0.5;
  hullDamageRate = 0.1;
} else {
  // ZONE 4: No refuel, no burn (gravity only)
  fuelRegenRate = 0;
  hullDamageRate = 0;
}
```

**Implementation Location:**
- `packages/engine/src/lib/engine/physics.ts` — Add `updatePower()` method
- Call in main game loop after `applyGravity()`, before `applyVelocity()`

---

#### 3. Hull System

**Damage Sources:**

1. **Planet Collision:**
   - Fixed damage: **-7% hull** per collision
   - Applied on elastic bounce (existing collision detection)
   - Visual feedback: Screen shake (2px, 150ms)

2. **Sun Proximity:**
   - Distance-based damage (see zones above)
   - Applied continuously per frame (scaled by deltaTime)
   - Visual feedback: Red vignette at < 25% hull

3. **Star Contact (Instant Death):**
   - If `distanceToSun < sun.radius` → `hull = 0` immediately
   - Triggers death state with cause: `STAR`

**Hull Recovery:**
- No healing mechanic in v0.1.0
- Hull damage is permanent (encourages conservative play)

**Implementation Location:**
- `packages/engine/src/lib/engine/physics.ts` — Add `updateHull()` method
- Planet collision: Hook into existing `handlePlanetCollision()`
- Sun damage: Call in `updateHull()` alongside power regen logic

---

#### 4. Death Detection

**Three Fail States:**

```typescript
// packages/engine/src/lib/engine/game-loop.ts
function checkDeath(state: GameState, ship: Ship, sun: Star): DeathCause | null {
  // Priority order matters (star > hull > fuel)
  
  // 1. Star contact (instant death)
  const distanceToSun = Math.hypot(ship.x - sun.x, ship.y - sun.y);
  if (distanceToSun < sun.radius) {
    return 'STAR';
  }
  
  // 2. Hull depletion
  if (state.resources.hull <= 0) {
    return 'HULL';
  }
  
  // 3. Power depletion (life support failure)
  if (state.resources.power <= 0) {
    return 'POWER';
  }
  
  return null;
}
```

**Death Flow:**
1. Detect death cause
2. Set `state.status = 'GAME_OVER'`
3. Set `state.deathCause = cause`
4. Freeze physics (stop ship momentum)
5. Show Game Over screen with time + cause

---

#### 5. Timer System

**Timing Logic:**

```typescript
// Start timer on first input (not on page load)
let hasStarted = false;

function handleInput(state: GameState) {
  if (state.status === 'MENU' && !hasStarted) {
    state.status = 'PLAYING';
    state.startTime = Date.now();
    hasStarted = true;
  }
}

// Update elapsed time every frame
function updateTimer(state: GameState) {
  if (state.status === 'PLAYING' && state.startTime) {
    state.elapsedTime = (Date.now() - state.startTime) / 1000; // Convert to seconds
  }
}
```

**Display Format:**
- HUD: `123.4s` (1 decimal place, updates every frame)
- Game Over: `123.45s` (2 decimal places, final time)

**Implementation Location:**
- `packages/engine/src/lib/engine/game-loop.ts` — Add `updateTimer()` call
- `apps/web/src/components/HUD.svelte` — Display timer using `$derived`

---

#### 6. Settings System

**Data Model:**

```typescript
// apps/web/src/lib/settings.ts
import { z } from 'zod';

export const SettingsSchema = z.object({
  invertControls: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

const SETTINGS_KEY = 'void-drift:settings';

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') {
    return { invertControls: false };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { invertControls: false };
    
    const parsed = JSON.parse(stored);
    return SettingsSchema.parse(parsed);
  } catch (error) {
    console.warn('Failed to load settings, using defaults:', error);
    return { invertControls: false };
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const validated = SettingsSchema.parse(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
```

**Settings Route:**

```astro
---
// apps/web/src/pages/settings.astro
import Layout from '../layouts/Layout.astro';
import Settings from '../components/Settings.svelte';
---

<Layout title="Settings - Void Drift">
  <Settings client:load />
</Layout>
```

**Settings Component:**

```svelte
<!-- apps/web/src/components/Settings.svelte -->
<script lang="ts">
  import { loadSettings, saveSettings, type Settings } from '../lib/settings';
  
  let settings = $state<Settings>(loadSettings());
  
  function toggleInvertControls() {
    settings.invertControls = !settings.invertControls;
    saveSettings(settings);
  }
</script>

<div class="settings-container">
  <h1>Settings</h1>
  
  <section class="setting-group">
    <h2>Controls</h2>
    
    <label class="toggle">
      <input 
        type="checkbox" 
        checked={settings.invertControls}
        onchange={toggleInvertControls}
      />
      <span>Invert Controls</span>
      <p class="hint">Swap left/right engine controls</p>
    </label>
  </section>
  
  <a href="/" class="back-button">Back to Game</a>
</div>

<style>
  .settings-container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }
  
  h1 {
    color: var(--color-neon-blue);
    font-size: 2rem;
    margin-bottom: var(--spacing-lg);
  }
  
  .setting-group {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-neon-blue);
    border-radius: 8px;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
  
  .toggle {
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }
  
  .hint {
    font-size: 0.875rem;
    color: var(--color-gray);
    margin-top: var(--spacing-xs);
  }
  
  .back-button {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-neon-blue);
    color: var(--color-void);
    text-decoration: none;
    border-radius: 4px;
    margin-top: var(--spacing-lg);
  }
</style>
```

**Control Inversion Logic:**

```typescript
// packages/engine/src/lib/engine/input.ts
export function applyControls(
  ship: Ship, 
  input: InputState, 
  invertControls: boolean
): void {
  const leftActive = invertControls ? input.right : input.left;
  const rightActive = invertControls ? input.left : input.right;
  
  if (leftActive && rightActive) {
    // Both engines = forward thrust
    ship.thrust(ship.rotation, FULL_THRUST);
  } else if (leftActive) {
    // Left engine only = rotate left + partial thrust
    ship.rotate(-ROTATION_SPEED);
    ship.thrust(ship.rotation, PARTIAL_THRUST);
  } else if (rightActive) {
    // Right engine only = rotate right + partial thrust
    ship.rotate(ROTATION_SPEED);
    ship.thrust(ship.rotation, PARTIAL_THRUST);
  }
}
```

---

#### 7. HUD Design

**Layout (16:9 Viewport):**

```
┌─────────────────────────────────────────┐
│  ∅·Δ                          123.4s    │ ← Logo + Timer
│                                         │
│                                         │
│                                         │
│                                         │
│  ███████████░ POWER 91%                 │ ← Power Bar (Stacked on Hull)
│  ████████░░ HULL 82%                    │ ← Hull Bar (Bottom Left)
└─────────────────────────────────────────┘
```

**HUD Component:**

```svelte
<!-- apps/web/src/components/HUD.svelte -->
<script lang="ts">
  import type { GameState } from '@void-drift/engine';
  
  let { state }: { state: GameState } = $props();
  
  const hullPercent = $derived(state.resources.hull);
  const powerPercent = $derived(state.resources.power);
  const timeDisplay = $derived(
    state.status === 'PLAYING' 
      ? `${state.elapsedTime.toFixed(1)}s`
      : '0.0s'
  );
  
  const hullColor = $derived(
    hullPercent < 25 ? 'var(--color-danger)' :
    hullPercent < 50 ? 'var(--color-warning)' :
    'var(--color-neon-blue)'
  );
  
  const powerColor = $derived(
    powerPercent < 25 ? 'var(--color-danger)' :
    powerPercent < 50 ? 'var(--color-warning)' :
    'var(--color-acid-lime)'
  );
</script>

<div class="hud">
  <div class="hud-top">
    <div class="logo">∅·Δ</div>
    <div class="timer">{timeDisplay}</div>
  </div>
  
  <div class="resource-bar">
    <div class="bar-fill" style:width="{hullPercent}%" style:background-color={hullColor}></div>
    <span class="bar-label">HULL {hullPercent.toFixed(0)}%</span>
  </div>
  
  <div class="resource-bar">
    <div class="bar-fill" style:width="{powerPercent}%" style:background-color={powerColor}></div>
    <span class="bar-label">POWER {powerPercent.toFixed(0)}%</span>
  </div>
</div>

<style>
  .hud {
    position: absolute;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    right: var(--spacing-sm);
    pointer-events: none;
    z-index: 100;
  }
  
  .hud-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }
  
  .logo {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--color-neon-blue);
  }
  
  .timer {
    font-size: 1.25rem;
    color: var(--color-white);
    font-variant-numeric: tabular-nums;
  }
  
  .resource-bar {
    position: relative;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-neon-blue);
    margin-bottom: var(--spacing-xs);
    overflow: hidden;
  }
  
  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    transition: width 0.1s linear, background-color 0.3s ease;
  }
  
  .bar-label {
    position: relative;
    display: block;
    text-align: center;
    line-height: 24px;
    font-size: 0.875rem;
    color: var(--color-white);
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
    font-weight: bold;
  }
</style>
```

---

#### 8. Game Over Screen

**Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│          MISSION FAILED                 │
│                                         │
│       You survived 142.35 seconds       │
│                                         │
│         Cause: Hull Failure             │
│                                         │
│      [Try Again]  [Leaderboard]         │
│                                         │
└─────────────────────────────────────────┘
```

**Component:**

```svelte
<!-- apps/web/src/components/GameOver.svelte -->
<script lang="ts">
  import type { GameState } from '@void-drift/engine';
  
  let { state, onRestart }: { 
    state: GameState, 
    onRestart: () => void 
  } = $props();
  
  const deathMessages = {
    STAR: 'Incinerated by the star',
    HULL: 'Hull failure',
    POWER: 'Out of power',
  };
  
  const message = $derived(
    state.deathCause ? deathMessages[state.deathCause] : 'Unknown cause'
  );
</script>

<div class="game-over-overlay">
  <div class="game-over-card">
    <h1>MISSION FAILED</h1>
    <p class="time">You survived <strong>{state.elapsedTime.toFixed(2)}s</strong></p>
    <p class="cause">Cause: {message}</p>
    
    <div class="actions">
      <button onclick={onRestart} class="primary">Try Again</button>
      <a href="/leaderboard" class="secondary">Leaderboard</a>
    </div>
  </div>
</div>

<style>
  .game-over-overlay {
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
  
  .game-over-card {
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
  }
  
  .time {
    font-size: 1.5rem;
    color: var(--color-white);
    margin-bottom: var(--spacing-sm);
  }
  
  .cause {
    font-size: 1.125rem;
    color: var(--color-neon-pink);
    margin-bottom: var(--spacing-lg);
  }
  
  .actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }
  
  button, a {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 1.125rem;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  
  .primary {
    background: var(--color-neon-blue);
    color: var(--color-void);
    border: none;
  }
  
  .secondary {
    background: transparent;
    color: var(--color-neon-blue);
    border: 2px solid var(--color-neon-blue);
  }
</style>
```

---

### Anti-Patterns

**NEVER:**
- Update `hull` or `fuel` outside of the physics loop (causes desyncs)
- Allow negative fuel/hull values (clamp to 0 immediately)
- Start timer on page load (must start on first input)
- Save settings to Firestore (localStorage only for browser-specific settings)
- Hard-code distance thresholds (use named constants)

**AVOID:**
- Creating new objects in fuel/hull update loops (GC pauses)
- Using `setInterval` for timer (use `Date.now()` delta)
- Checking death state in render loop (physics only)
- Updating HUD every frame if values haven't changed (use `$derived`)

---

## Contract

### Definition of Done

**Core Gameplay:**
- [x] Player starts with 100% hull and 100% power
- [x] Power consumes 1.0% per second (constant decay)
- [x] Sun proximity refuels power based on distance zones (4 zones defined)
- [x] Sun proximity burns hull based on distance zones
- [x] Planet collisions deduct 7% hull with visual feedback
- [x] Star contact triggers instant death (`STAR` cause)
- [x] Hull = 0% triggers death (`HULL` cause)
- [x] Power = 0% triggers death (`POWER` cause)

**UI/UX:**
- [x] HUD displays hull bar (color-coded: green/yellow/red)
- [x] HUD displays power bar (color-coded: green/yellow/red)
- [x] HUD displays timer (1 decimal place, updates smoothly)
- [x] Timer starts on first input, not page load
- [x] Game Over screen shows final time (2 decimal places)
- [x] Game Over screen shows death cause with descriptive text
- [x] Restart button resets all state (ship, hull, power, timer, arena)

**Settings:**
- [x] `/settings` route exists and is accessible
- [x] Settings page has "Invert Controls" toggle
- [x] Toggle saves to localStorage immediately
- [x] Inverted controls apply in-game without restart
- [x] Settings persist across browser sessions
- [x] Settings page has "Back to Game" link

**Technical:**
- [x] Zero TypeScript errors in `pnpm -r check`
- [x] Game state machine enforces valid transitions
- [x] No state leaks between game sessions
- [x] 60 FPS maintained with all systems active
- [x] Fuel/hull updates use deltaTime (frame-rate independent)

---

### Regression Guardrails

**Performance:**
- `updatePower()` + `updateHull()` must execute < 0.5ms combined
- HUD re-renders only when values change (Svelte reactivity)
- No garbage collection pauses > 5ms during gameplay

**Physics Integrity:**
- Power/hull updates must occur AFTER input but BEFORE collision detection
- Death detection must occur AFTER all physics updates
- Timer must be monotonically increasing (no backwards jumps)

**State Safety:**
- `hull` and `power` clamped to [0, 100] range
- `elapsedTime` must be ≥ 0
- `deathCause` must be null during `PLAYING` state

---

### Scenarios

**Scenario 1: Power Depletion Death** ✅ TO VERIFY
- **Given:** Player is flying with 5% power remaining
- **When:** Player flies for 5 seconds without refueling
- **Then:** Power reaches 0%, death is triggered with cause `POWER`, Game Over screen displays "Out of power"

---

**Scenario 2: Hull Depletion from Planets** ✅ TO VERIFY
- **Given:** Player has 20% hull remaining
- **When:** Player collides with a planet 3 times (3 × 7% = 21% damage)
- **Then:** Hull reaches 0%, death is triggered with cause `HULL`, Game Over screen displays "Hull failure"

---

**Scenario 3: Star Contact Instant Death** ✅ TO VERIFY
- **Given:** Player is maneuvering near the star with 80% hull and 60% power
- **When:** Player's ship position enters the star's radius (distanceToSun < star.radius)
- **Then:** Death is triggered immediately with cause `STAR`, ignoring current hull/power values, Game Over screen displays "Incinerated by the star"

---

**Scenario 4: Sun Refuel Zone Strategy** ✅ TO VERIFY
- **Given:** Player has 30% power and 100% hull
- **When:** Player enters Zone 2 (150-250px from sun) for 10 seconds
- **Then:** Power increases by ~20% (2% per second × 10s), hull decreases by ~5% (0.5% per second × 10s), player survives and can continue

---

**Scenario 5: Control Inversion Toggle** ✅ TO VERIFY
- **Given:** Player is on `/settings` page with normal controls (invertControls = false)
- **When:** Player clicks "Invert Controls" toggle
- **Then:** localStorage is updated with `invertControls: true`, player navigates back to game, pressing left input activates right engine and vice versa

---

**Scenario 6: Settings Persistence** ✅ TO VERIFY
- **Given:** Player has enabled control inversion and saved settings
- **When:** Player closes browser and reopens game in a new session
- **Then:** Control inversion remains enabled (loaded from localStorage), no re-configuration required

---

**Scenario 7: Restart Flow Cleanup** ✅ TO VERIFY
- **Given:** Player has died with 15% hull, 0% power, after 85.23 seconds
- **When:** Player clicks "Try Again" on Game Over screen
- **Then:** Game transitions to MENU state, then PLAYING on first input, ship resets to spawn position with 100% hull and 100% power, timer resets to 0.0s, planet positions reset to initial orbit

---

## Implementation Notes

### Phase 5 Checklist ✅ COMPLETE

**Week 1: Core Systems**
- [x] Create `game-state.ts` schema with Zod validation
- [x] Implement game state machine (MENU → PLAYING → GAME_OVER)
- [x] Add `updatePower()` to physics loop with consumption logic
- [x] Add `updateHull()` to physics loop with planet collision hook
- [x] Implement sun proximity zones (refuel + burn calculations)
- [x] Add `checkDeath()` with three fail states

**Week 2: UI Components**
- [x] Build HUD component with hull/power bars
- [x] Implement timer display with deltaTime tracking
- [x] Create Game Over screen component
- [x] Add restart flow logic
- [x] Implement color-coded warnings (< 25% = red)

**Week 3: Settings System**
- [x] Create `/settings` Astro route
- [x] Build Settings.svelte component
- [x] Implement nanostores with localStorage persistence
- [x] Add control inversion logic to input handler
- [x] Test settings persistence across sessions

**Week 4: Polish & Testing**
- [x] Tune power consumption rate (playtest for ~60-90s initial runs)
- [x] Tune sun zone distances (risk/reward balance)
- [x] Power consumption scales with thrust (50%/75% more when thrusting)
- [x] Menu overlay with TAP TO START + Settings link
- [x] Performance audit (power/hull updates < 0.5ms)
- [x] Cross-browser testing (Chrome, Firefox, Safari)
- [x] Mobile testing (touch + inverted controls)

---

### Tuning Constants

```typescript
// packages/engine/src/lib/config.ts

export const SURVIVAL_CONFIG = {
  // Starting values
  INITIAL_HULL: 100,
  INITIAL_POWER: 100,
  
  // Fuel system
  FUEL_CONSUMPTION_RATE: 1.5, // % per second of thrust
  
  // Sun zones (distance from center in pixels)
  SUN_ZONE_1_RADIUS: 150,
  SUN_ZONE_2_RADIUS: 250,
  SUN_ZONE_3_RADIUS: 350,
  
  // Fuel regen rates (% per second)
  FUEL_REGEN_ZONE_1: 4.0,
  FUEL_REGEN_ZONE_2: 2.0,
  FUEL_REGEN_ZONE_3: 0.5,
  
  // Hull damage rates (% per second)
  HULL_BURN_ZONE_1: 1.5,
  HULL_BURN_ZONE_2: 0.5,
  HULL_BURN_ZONE_3: 0.1,
  
  // Collision damage
  PLANET_COLLISION_DAMAGE: 7, // % hull per hit
  
  // Visual thresholds
  WARNING_THRESHOLD: 25, // % (yellow warning)
  DANGER_THRESHOLD: 10,  // % (red warning + screen effects)
} as const;
```

---

### File Structure

```
void-drift/
├── packages/engine/src/
│   ├── lib/
│   │   ├── schemas/
│   │   │   └── game-state.ts         # NEW: GameState, Resources schemas
│   │   ├── engine/
│   │   │   ├── game-loop.ts          # EDIT: Add state machine, checkDeath()
│   │   │   ├── physics.ts            # EDIT: Add updateFuel(), updateHull()
│   │   │   └── input.ts              # EDIT: Add invertControls param
│   │   └── config.ts                 # EDIT: Add SURVIVAL_CONFIG
│   └── index.ts                      # EDIT: Export GameState types
│
├── apps/web/src/
│   ├── pages/
│   │   ├── index.astro               # EDIT: Wire up new game state
│   │   └── settings.astro            # NEW: Settings route
│   ├── components/
│   │   ├── HUD.svelte                # EDIT: Add hull/fuel bars, timer
│   │   ├── GameOver.svelte           # NEW: Game Over screen
│   │   └── Settings.svelte           # NEW: Settings UI
│   └── lib/
│       └── settings.ts               # NEW: localStorage wrapper
│
└── docs/
    └── specs/
        └── survival-core.md          # THIS FILE
```

---

## Known Limitations

**v0.1.0:**
- No sound effects (deferred to Phase 7)
- No visual effects for fuel regen or hull damage (deferred to Phase 7)
- No gamepad support for settings
- No cloud sync for settings (localStorage only)
- No difficulty levels (fixed constants)
- No tutorial or help screen

**Post-v0.1.0:**
- Phase 6 will add Firebase leaderboard
- Phase 7 will add sound FX and particle effects
- Phase 8 will add analytics and social sharing

---

## Future Enhancements

- [ ] Difficulty modes (Easy: slower fuel burn, more regen)
- [ ] Power-ups (temporary shield, fuel boost)
- [ ] Hazard variety (asteroid belt, black holes)
- [ ] Visual feedback (hull damage cracks, fuel regen glow)
- [ ] Sound effects (thrust loop, collision impact, death explosion)
- [ ] Achievements (survive 60s without refueling, 100+ sun visits)
- [ ] Replay system (save last death for analysis)
- [ ] Tutorial overlay (first-time player guidance)

---

**Next Steps:**
1. Review this spec with stakeholders
2. Create PBI-015 (Timer & Death Logic)
3. Create PBI-016 (Hull & Fuel Systems)
4. Create PBI-017 (Settings Route)
5. Begin implementation (Week 1: Core Systems)