# Project: VOID DRIFT

**"Newtonian Chaos in a Shared Canvas"**

## 1. High Concept

**Void Drift** is a minimalist space survival game built on a foundation of satisfying Newtonian physics and procedural aesthetics. The project is designed with two complementary game modes that share the same engine, assets, and core mechanics:

- **Mode A (VOID DRIFT):** Single-player survival. Dodge gravity wells, rack up seconds, chase the global high score.
- **Mode B (VOID BRAWL):** Multiplayer arena combat. Star Control: Super Melee meets browser accessibility.

**Current Goal:** Ship Mode A first. It serves as both a complete, shippable game AND a testbed for polishing ship physics and behavior before tackling multiplayer complexity.

---

## 2. Mode A: VOID DRIFT (Single-Player Survival)

### 2.1 Core Gameplay

**Objective:** Survive as long as possible in a gravity-dense arena.

**Controls:** Differential thrust only.
- **Desktop:** WASD / Arrow Keys (Left/Right = spiral turns, Both = forward thrust)
- **Mobile:** Split-screen touch zones

**Resources:**
- **Hull:** 100% at start. Depletes to 0% = death.
  - Planet collision: -7% hull damage per hit
  - Sun proximity: Burns hull (slow → fast based on distance)
- **Fuel:** 100% at start. Depletes to 0% = game over.
  - Consumed when thrusting (engines burn fuel)
  - Refueled by sun proximity (closer = faster regen)

**The Core Tension:**
- Need fuel to maneuver → Must approach sun
- Sun refuels you → But burns your hull
- Longer survival → More sun visits → More risk

**Hazards:**
- **Central Star:** Dual-purpose hazard/resource. Too close = hull damage. Contact = instant death. Gravity well pulls you in.
- **Orbiting Planets:** Gravity wells + elastic collision. Each hit costs 7% hull.
- **Your Own Momentum:** Physics never forgives. Fuel mismanagement = death.

**Victory Condition:** None. Only death and time.

### 2.2 High Score System

**Format:** Flipper-style arcade leaderboard.
- **3 Letters:** Classic initials entry (e.g., `ACE`)
- **UID Hash:** First 6 characters of user ID hash for uniqueness
- **Time:** Seconds survived (to milliseconds)
- **Cause of Death:** Hull failure, fuel depletion, or star contact

**Leaderboard:** Global, Firebase-backed, top 20 displayed.

**Example Entry:**
```
 1. ACE·A3F8B2  —  142.3s  [HULL]
 2. VXN·9D4E1C  —  128.7s  [FUEL]
 3. ???·FFFFFF  —  001.2s  [STAR] ← You
```

### 2.3 Why Mode A First?

1. **Shippable Product:** A complete, playable game with clear win condition (high score).
2. **Physics Testbed:** Validates ship handling, gravity tuning, collision response, and resource management without network complexity.
3. **Content Pipeline:** Establishes procedural asset creation and Design System workflows.
4. **Faster Iteration:** No lobby, no sync, no lag compensation. Pure local gameplay.
5. **Marketing Asset:** Shareable scores, GIFs of near-misses and desperate fuel runs, "one more run" addiction.
6. **Emergent Strategy:** Fuel/hull creates meaningful risk/reward decisions, not just "avoid everything."

---

## 3. Mode B: VOID BRAWL (Multiplayer Arena) - DEFERRED

### 3.1 Core Gameplay

**Objective:** Outlast opponents in a shared gravity arena.

**Weapons:**
- **Auto-Turret:** Plasma bolts fire automatically when enemies enter arc + range.
- **Antimatter Bomb (Ultimate):** Drop gravity mine with 3s fuse. Pulls ships in before exploding.

**Victory Condition:** Last ship standing. Kills tracked to global stats.

### 3.2 Network Architecture

**Sync Strategy:** 10Hz Firestore updates with client-side interpolation.
- **Input Capture:** Local inputs applied immediately (optimistic UI).
- **State Broadcast:** Every 100ms, push `{ position, velocity, rotation, health }`.
- **Opponent Rendering:** Lerp between snapshots to smooth 10Hz → 60Hz.

**Lobby System:**
- **Create Lobby:** Host generates 6-character join code.
- **Join via URL:** `voiddrift.app/join/ABC123`
- **Firebase Paths:** `artifacts/{appId}/public/data/lobbies/{lobbyId}`

### 3.3 Why Mode B Later?

- **Complexity:** Auth, state sync, lobby UI, lag compensation, anti-cheat.
- **Dependency:** Requires Mode A's physics to be polished first.
- **Risk:** Multiplayer is a force multiplier. Bugs become 2x worse with desyncs.

**Timeline:** Mode B begins after Mode A ships to production and collects user feedback.

---

## 4. The "Vibe" & Aesthetic

### 4.1 Visual Style

**Theme:** High-contrast neon vectors on infinite void.
- **Color Palette:** Acid lime, neon pink, electric blue on deep black (`#0a0a0f`).
- **Rendering:** Flat vector shapes (circles, polygons). No gradients except glow effects.
- **Effects:** CRT scanlines (optional toggle), chromatic aberration on impacts, heavy particle usage.

**Design System:** 15+ CSS tokens defined in `apps/web/src/styles.css`.
- Colors: `--color-void`, `--color-neon-blue`, `--color-neon-pink`, etc.
- Spacing: `--spacing-xs` through `--spacing-xl`.
- Typography: `--font-display` (Noto Sans Math for logo: ∅·Δ).

### 4.2 Physics "Feel"

**Newtonian Drift:** Heavy inertia, low drag (0.5/s), max speed cap (500px/s).
- **Spiral Turns:** Single-engine thrust creates elegant arcs.
- **Momentum Preservation:** Screen-wrap maintains velocity (Pac-Man topology).
- **Gravity Wells:** Inverse-square law. Star (300px influence), Planets (160px).

**Juice:**
- **Thrust Particles:** Trailing glow on engine fire.
- **Screen Shake:** On collision (subtle, 2-4px).
- **Elastic Bounce:** Planet collisions use restitution 0.8.
- **Camera Smoothing:** Lerp factor 0.1 for buttery tracking.

---

## 5. Tech Stack & Architecture

### 5.1 Monorepo Structure

**Workspace Manager:** PNPM Workspaces.

```
void-drift/
├── packages/
│   └── engine/              # @void-drift/engine
│       ├── src/
│       │   ├── lib/
│       │   │   ├── engine/  # GameLoop, Physics, Camera
│       │   │   ├── assets/  # Procedural draw functions
│       │   │   ├── schemas/ # Zod validation (Mode B)
│       │   │   └── audio/   # Web Audio API wrappers
│       │   └── index.ts     # Public exports
│       └── package.json
├── apps/
│   └── web/                 # The Astro + Svelte site
│       ├── src/
│       │   ├── pages/
│       │   │   ├── index.astro    # Game route
│       │   │   └── gallery.astro  # Asset workbench
│       │   ├── components/        # Svelte UI islands
│       │   └── styles.css         # Design System tokens
│       └── package.json
└── pnpm-workspace.yaml
```

### 5.2 Frontend Stack

- **Framework:** Astro (SSG routing) + Svelte 5 (Runes for reactivity).
- **Bundler:** Vite.
- **Styling:** Native CSS (scoped `<style>` blocks). **No Tailwind.**
- **Rendering:** Raw `CanvasRenderingContext2D`. **No game engines.**

### 5.3 Backend Stack (Mode A)

- **Auth:** Firebase Anonymous Authentication (for UID hashing).
- **Database:** Firestore (leaderboard only).
- **Hosting:** Firebase Hosting or Vercel.

**Firestore Paths (Mode A):**
```
artifacts/{appId}/public/data/highscores/{scoreId}
  - initials: string (3 uppercase letters)
  - uidHash: string (6 chars from SHA-256 of anon UID)
  - seconds: number (survival time)
  - timestamp: number (Unix ms)
  - userId: string (anon UID for anti-cheat)
```

**Security Rules (Mode A):**
```javascript
// Only allow writes if userId matches auth.uid
match /artifacts/{appId}/public/data/highscores/{scoreId} {
  allow read: if true;
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
}
```

### 5.4 Validation

**Zod Schemas:** Runtime type safety for network data (Mode B) and leaderboard (Mode A).

**Example (Mode A):**
```typescript
const HighScoreSchema = z.object({
  initials: z.string().length(3).regex(/^[A-Z]{3}$/),
  uidHash: z.string().length(6),
  seconds: z.number().positive().max(999999),
  timestamp: z.number(),
  userId: z.string()
});
```

---

## 6. Implementation Roadmap

### ✅ Phase 1: The Engine (Vibe Check) — COMPLETED v0.0.1
- [x] Svelte + Canvas setup
- [x] Ship with differential thrust physics
- [x] Screen wrapping (Pac-Man topology)
- [x] Tuning: Spiral turns, max speed, inertia damping

### ✅ Phase 2: Mobile Controls — COMPLETED v0.0.2
- [x] Split-screen touch inputs
- [x] Touch visual feedback
- [x] Portrait mode warning

### ✅ Phase 3: Asset Gallery & Design System — COMPLETED v0.0.3
- [x] Internal workbench at `/gallery`
- [x] Procedural asset refactor (ship, star)
- [x] Design System tokens in CSS

### ✅ Phase 4: QoL & Polish — COMPLETED v0.0.4
- [x] 16:9 constrained viewport
- [x] Camera system (smooth tracking, world↔screen conversions)
- [x] Central star (gravity + death on contact)
- [x] Rock planet (orbit, gravity, elastic collision)
- [x] HUD with logo (∅·Δ)

---

### ✅ Phase 5: Survival Core — COMPLETE (v0.1.0)

**Goal:** Implement Mode A's core gameplay loop (timer → death → restart) with full resource management and player settings.

#### v0.0.5: Resource HUD Design — PBI-015 (5 SP) ✅
**Goal:** Design visual components in gallery before integration
- [x] Hull bar design (3 color states: normal/warning/danger)
- [x] Power bar design (3 color states: normal/warning/danger)
- [x] Death cause iconography (STAR/HULL/POWER symbols)
- [x] Timer display format (tabular-nums font)
- [x] Gallery integration with sliders for testing
- [x] Design System tokens updated

#### v0.0.6: Resource Logic & HUD Integration — PBI-016 (8 SP) ✅
**Goal:** Implement resource tracking and integrate designed HUD elements
- [x] Hull system (100% → 0%, planet damage -7%, sun burn)
- [x] Power system (100% → 0%, constant consumption, sun refuel)
- [x] Sun proximity zones (4 zones with refuel/burn rates)
- [x] Physics integration (updatePower, updateHull)
- [x] HUD bars display in-game (color-coded warnings)
- [x] Zod schemas for resources

#### v0.0.7: Settings Route — PBI-018 (3 SP) ✅
**Goal:** Player settings with control customization
- [x] `/settings` Astro page
- [x] Control inversion toggle (swap left/right engines)
- [x] Nanostores with localStorage persistence
- [x] Settings apply immediately (no restart)
- [x] Keyboard accessible

#### v0.1.0: Timer & Death Logic — PBI-017 + PBI-020 (7 SP) ✅
**Goal:** Complete game loop with timer, death conditions, Game Over screen
- [x] Game state machine (MENU → PLAYING → GAME_OVER)
- [x] Timer system (starts on first input)
- [x] Death detection (STAR > HULL > POWER priority)
- [x] Game Over screen (time + death cause + icon)
- [x] Menu overlay with TAP TO START + Settings link
- [x] Restart flow (reset all state)
- [x] HUD timer display

**Phase 5 Total:** 26 Story Points — COMPLETE

---

### 🚧 Phase 6: High Score System — PLANNED v0.2.0 (after v0.1.0)

**Goal:** Global leaderboard with arcade-style initials entry.

**Features:**
- [ ] Firebase Anonymous Auth integration
- [ ] 3-letter initials input UI (keyboard + on-screen buttons)
- [ ] UID hash generation (SHA-256 → first 6 chars)
- [ ] Firestore write (submit score on death with cause: `STAR | HULL | FUEL`)
- [ ] Leaderboard display screen (top 20, sorted by `seconds` desc)
- [ ] Death cause icons/labels (visual differentiation)
- [ ] Firestore Security Rules (validate `userId` on write)

**Definition of Done:**
- Player can enter initials after death.
- Score includes survival time + death cause.
- Score appears in global leaderboard within 2 seconds.
- Leaderboard displays correctly sorted (longest survival first).
- Death cause is visible in leaderboard entries.
- Duplicate entries allowed (same initials, different hashes).

---

### 🚧 Phase 7: Content & Polish — PLANNED v0.3.0 (after v0.2.0)

**Goal:** Add variety and juice to survival gameplay.

**Features:**
- [ ] Add 2nd planet (different orbit radius/speed)
- [ ] Add 3rd planet (optional, if performance allows)
- [ ] Screen shake on collision (2-4px, 200ms duration)
- [ ] Particle trail polish (thrust particles fade smoothly)
- [ ] Sound FX (thrust loop, collision impact, death explosion)
- [ ] Mobile performance audit (maintain 60fps on mid-range devices)

**Definition of Done:**
- 3 planets with varied orbits create strategic choices.
- Screen shake feels punchy but not nauseating.
- Sound FX enhance immersion without being annoying.
- Game runs at 60fps on iPhone 12 / Pixel 5 equivalent.

---

### 🚧 Phase 8: Ship Mode A — PLANNED v1.0.0

**Goal:** Deploy Mode A to production and gather user feedback.

**Features:**
- [ ] Firebase Hosting deployment
- [ ] Social sharing (auto-generate "I survived X seconds" image)
- [ ] Analytics (optional: track deaths, average survival time)
- [ ] Performance monitoring (Firebase Performance or similar)
- [ ] Bug bash & QA pass

**Definition of Done:**
- Game is live at `voiddrift.app` (or equivalent).
- Social sharing generates correct Open Graph images.
- Zero critical bugs in production.
- At least 100 leaderboard entries from real users.

---

### 🔮 Phase 9+: Mode B (Multiplayer) — FUTURE

**Deferred until Mode A ships and collects feedback.**

Planned features:
- Firebase Auth (persistent accounts optional)
- Lobby creation & join-by-code
- Firestore state sync (10Hz)
- Weapon systems (auto-turret, antimatter bomb)
- Multiplayer camera (dynamic zoom to fit all players)
- Kill/death stats

**Decision Point:** After Mode A launch, evaluate:
- User engagement with single-player mode
- Technical performance (can we handle real-time sync?)
- Community demand for multiplayer

---

## 7. Current State (v0.0.4)

### 7.1 What's Built

**Monorepo:**
- ✅ `packages/engine` — Pure TypeScript game logic
- ✅ `apps/web` — Astro + Svelte 5 site
- ✅ Vite build system, Biome linter

**Gameplay:**
- ✅ Newtonian physics with drift and max speed cap
- ✅ Differential thrust controls (spiral turns on single-engine)
- ✅ Circular arena with antipodal wrapping
- ✅ Central star (gravity well + instant death on contact)
- ✅ 1 Rock Planet (orbital, gravity, elastic collision)
- ✅ Cross-platform input (WASD/Arrows + split-touch mobile)
- ❌ Resource system (hull/fuel) — **Planned v0.0.5**
- ❌ Sun refueling mechanic — **Planned v0.0.5**
- ❌ Hull damage (planets + sun) — **Planned v0.0.5**

**Presentation:**
- ✅ 16:9 viewport with letterboxing
- ✅ Smooth camera tracking (lerp factor 0.1)
- ✅ Design System with 15+ CSS tokens
- ✅ Procedural assets (ship, star, planet)
- ✅ HUD with logo (∅·Δ)
- ✅ Asset gallery workbench at `/gallery`

**Performance:**
- ✅ 60 FPS maintained on desktop
- ✅ Zero per-frame allocations in render loop
- ✅ Camera update < 1ms
- ✅ Physics step < 2ms

### 7.2 What's Complete (Mode A)

**Phase 5 (Survival Core) — v0.1.0:** ✅ COMPLETE
- [x] v0.0.5: Resource HUD design (bars, icons, timer format) in gallery
- [x] v0.0.6: Hull/power tracking logic + HUD integration
- [x] v0.0.7: Settings page with control inversion toggle
- [x] v0.1.0: Timer system + death detection + Game Over screen + Menu overlay

### 7.3 What's Next (Mode A)

**Phase 6 (High Score System) — v0.2.0:**
- [ ] Initials entry UI
- [ ] Firebase integration (Auth + Firestore)
- [ ] Leaderboard display with death cause

**Phase 7 (Content & Polish) — v0.3.0:**
- [ ] Sound effects
- [ ] More planets (variety)
- [ ] Visual feedback (hull damage effects, power regen glow)

---

## 8. Design Principles

### 8.1 Code Philosophy

**Spec-Driven Development:**
- Always define the Blueprint (architecture) before implementation.
- All specs follow ASDLC format (Blueprint → Contract → Implementation).

**Schema First:**
- Never write game logic without defining the Zod schema first.
- All network inputs must be validated before processing.

**Performance:**
- Avoid object allocation in render loop (GC pauses kill 60fps).
- Prefer flat data structures over nested objects.
- Use `Math.hypot` over manual square roots.

**Type Safety:**
- Strict TypeScript mode. No `any`.
- Unknown types must be narrowed before use.

### 8.2 Visual Philosophy

**Experience Modeling:**
- Define Design Tokens before building features.
- All colors, fonts, spacing must use CSS variables.
- No magic numbers in components.

**Procedural Assets:**
- Avoid external image files. Draw everything on canvas.
- Asset functions live in `packages/engine/src/lib/assets/`.
- Gallery workbench tests all assets in isolation.

**Read-Only Design System:**
- Once tokens are defined, developers consume them, never modify.
- Changes to Design System require Designer approval.

### 8.3 Gameplay Philosophy

**Juice Over Realism:**
- Prioritize "feel" (screen shake, trails, elastic bounces) over accurate physics.
- Every action should have satisfying feedback.

**Emergence Over Scripting:**
- Complex behavior from simple rules (gravity + momentum = slingshots).
- Avoid hard-coded scenarios.

**Accessibility:**
- Mobile-first. All interactions must work via touch.
- Minimum touch target: 44px × 44px.
- Portrait mode warning (game requires landscape).

---

## 9. Anti-Patterns

### 9.1 Technical

**NEVER:**
- Add npm dependencies without discussion (aim for zero-dep).
- Use external game engines (Phaser, Three.js, etc.).
- Hardcode hex colors or pixel sizes in components.
- Allocate objects inside the render loop.
- Use `any` type in TypeScript.

**AVOID:**
- Circular dependencies between packages.
- Mixing game logic with UI logic.
- Firestore queries without indices (free tier limits).

### 9.2 Design

**NEVER:**
- Ship features without specs.
- Change gravity/friction constants without testing (affects "vibe").
- Add external assets (.png, .mp3) without justification.

**AVOID:**
- Complex UI during gameplay (HUD should be minimal).
- Over-explaining mechanics (let players discover).

---

## 10. Success Metrics

### Mode A (v0.0.8 Launch)

**Technical:**
- ✅ 60 FPS on mid-range mobile (iPhone 12 / Pixel 5)
- ✅ Zero critical bugs in production
- ✅ < 2s load time on 3G connection

**Engagement:**
- ✅ 100+ unique leaderboard entries in first week
- ✅ Average survival time > 30 seconds (indicates learning curve works)
- ✅ 10+ social shares (Twitter/Discord)

**Quality:**
- ✅ 95%+ positive feedback on "feel" / physics
- ✅ < 5% rage quits (closing tab within 10 seconds)

### Mode B (Future)

**To be defined after Mode A feedback.**

Likely metrics:
- Average session duration
- Match completion rate
- Concurrent players peak
- Community-created content (mods, assets)

---

## 11. Open Questions

### Mode A (To Be Decided in Phase 5 — v0.1.0)

1. **Fuel Consumption Rate:**
   - How much fuel per second of thrusting?
   - Should single-engine thrust (spiral) use less fuel than dual-engine (forward)?
   - **Current Lean:** ~1-2% per second, balanced for ~60s initial fuel budget.

2. **Sun Refuel Distance Bands:**
   - Zone 1 (< 150px): Fast refuel (3-5% per second) + moderate hull burn (1-2% per second)
   - Zone 2 (150-300px): Slow refuel (1% per second) + slow hull burn (0.5% per second)
   - Zone 3 (> 300px): No refuel, no burn (gravity only)
   - **Current Lean:** Needs playtesting for risk/reward balance.

3. **Hull Damage Tuning:**
   - Planet collision: -7% (specified)
   - Sun burn rate: Should it escalate sharply at close range?
   - **Current Lean:** Exponential scaling (distance² or distance³ for dramatic "too close!" moments).

4. **Starting Resources:**
   - Should all runs start at 100% hull + 100% fuel?
   - Or randomized starting fuel (80-100%) for variety?
   - **Current Lean:** Fixed 100/100 for fairness.

5. **Control Inversion Default:**
   - Should controls be inverted by default (left engine on right side)?
   - Or normal by default (left engine on left side)?
   - **Current Lean:** Normal by default, inverted as opt-in setting.

6. **Settings UI Location:**
   - Accessible from main menu only?
   - Or also from pause menu during gameplay?
   - **Current Lean:** Both (menu button + pause screen option).

7. **Leaderboard Refresh:**
   - Option A: Real-time `onSnapshot` (live updates).
   - Option B: Fetch once on Game Over screen.
   - **Current Lean:** Option B (cheaper, simpler).

8. **Additional Hazards:**
   - Asteroids? Moving debris? Black holes?
   - **Current Lean:** 3 planets only for v1.0.0, evaluate later.

9. **Sound Strategy:**
   - Fuel regen sound (sizzling when near sun)?
   - Hull damage warning beep (when < 25%)?
   - Web Audio API (procedural) vs. short audio files?
   - **Current Lean:** Procedural (aligns with asset philosophy).

10. **Visual Feedback:**
   - Should hull damage show cracks/sparks on ship sprite?
   - Should low fuel dim the engine glow?
   - **Current Lean:** Subtle effects that don't obscure gameplay.

### Mode B (Future)

1. **Lag Compensation:** Client-side prediction + server reconciliation?
2. **Weapon Balance:** Should auto-turret have limited ammo?
3. **Camera:** Zoom out to fit all players, or split-screen?
4. **Matchmaking:** Random lobbies or only friend-join?

---

## 12. Revision History

- **v0.0.1 (2024):** Initial vision document. Multiplayer-first approach.
- **v0.0.4 (2024):** Updated with monorepo structure, Phase 1-4 completion.
- **v0.0.5 (2025):** **PIVOT:** Mode A (single-player survival) becomes Goal 1. Mode B (multiplayer) deferred. Phase 5 split into 4 incremental releases (v0.0.5 → v0.1.0): HUD Design → Resource Logic → Settings → Death/Timer. Design-first approach with gallery iteration.
- **v0.1.0 (2025):** **Phase 5 COMPLETE.** Full survival gameplay with hull/power systems, settings (nanostores + localStorage), menu overlay, game state machine (MENU → PLAYING → GAME_OVER), and restart flow. Ready for Phase 6 (High Score System).

---

**Next Steps:**
1. Review this updated vision with stakeholders.
2. Create spec for Phase 5 (Survival Core).
3. Draft PBI-015 (Timer & Death Logic).
4. Begin Mode A implementation.