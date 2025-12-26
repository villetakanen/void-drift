# Phase 5: Survival Core — Implementation Roadmap

**Versions:** v0.0.5 → v0.0.6 → v0.0.7 → v0.1.0  
**Status:** ✅ COMPLETE
**Goal:** Transform physics sandbox into complete single-player survival game

---

## Executive Summary

Phase 5 is the first major milestone for **Mode A** (single-player survival). This phase implements the core gameplay loop through 4 incremental releases using a **design-first approach**.

**Why 4 Releases:**
- **v0.0.5:** Design visual components in gallery (iterate before integration)
- **v0.0.6:** Implement resource logic and integrate designed HUD
- **v0.0.7:** Add player settings (independent, can parallel with v0.0.6)
- **v0.1.0:** Complete game loop with timer and death mechanics

**Why This Matters:**
- First shippable gameplay experience (start → play → die → restart)
- Establishes resource management foundation (risk/reward sun mechanic)
- Validates survival time tracking for Phase 6 (leaderboard)
- Provides accessibility options (control inversion)

**Duration:** 3-4 weeks  
**Story Points:** 26 total (5 + 8 + 3 + 5 + 3 + 2)

---

## Phase 5 Components (4 Incremental Releases)

### v0.0.5: PBI-015 — Resource HUD Design
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Owner:** @Designer + @Dev

**What It Does:**
- Design hull/fuel bars in gallery workbench (3 color states each)
- Design death cause icons (STAR/HULL/FUEL symbols)
- Define timer display format (tabular-nums font)
- Add gallery controls (sliders to test all states)
- NO game logic — pure visual design iteration

**Key Files:**
- `packages/engine/src/lib/assets/resource-bar.ts` — NEW (canvas drawing functions)
- `packages/engine/src/lib/assets/death-icons.ts` — NEW (icon drawing functions)
- `apps/web/src/components/Gallery.svelte` — EDIT (add HUD Elements section)
- `apps/web/src/styles.css` — EDIT (add warning color tokens if needed)

**Success Criteria:**
- Hull/fuel bars render in gallery with 3 color states
- Death icons recognizable at 16px and 24px
- Timer format defined and displayed
- All use Design System tokens (no hardcoded colors)
- Visual review approved by team

**Why First:**
- Design-first approach: iterate on visuals before integration
- Get feedback on colors, sizes, layouts without game logic
- Establish component API contracts for PBI-016

---

### v0.0.6: PBI-016 — Resource Logic & HUD Integration
**Priority:** HIGH  
**Estimate:** 8 Story Points  
**Owner:** @Dev  
**Depends On:** PBI-015 (designs must be complete)

**What It Does:**
- Implement hull/power tracking logic (Zod schemas)
- Power consumption (1.0%/s constant), sun refuel (4 zones), hull burn
- Planet collision damage (-7% per hit)
- Integrate designed HUD bars into game (Svelte components)
- Physics loop integration (updateFuel, updateHull)

**Key Files:**
- `packages/engine/src/lib/schemas/game-state.ts` — NEW (Zod)
- `packages/engine/src/lib/engine/physics.ts` — EDIT (add resource updates)
- `packages/engine/src/lib/config.ts` — EDIT (SURVIVAL_CONFIG)
- `apps/web/src/components/HUD.svelte` — EDIT (add bars using PBI-015 designs)

**Success Criteria:**
- Hull/power tracked correctly (100% → 0%)
- Sun zones work (refuel + burn rates)
- HUD bars display in-game with correct colors
- Resources clamp to [0, 100]
- Performance: < 0.5ms for updates

---

### v0.0.7: PBI-018 — Settings Route
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Owner:** @Dev  
**Depends On:** None (can parallelize with PBI-016)

**What It Does:**
- `/settings` Astro route with settings UI
- Control inversion toggle (swap left/right engines)
- localStorage persistence (`void-drift:settings`)
- Settings apply immediately (no restart)
- Keyboard accessible

**Key Files:**
- `apps/web/src/pages/settings.astro` — NEW
- `apps/web/src/components/Settings.svelte` — NEW
- `apps/web/src/lib/settings.ts` — NEW (localStorage wrapper)
- `packages/engine/src/lib/engine/input.ts` — EDIT (invertControls param)

**Success Criteria:**
- Settings page functional and accessible
- Control inversion works (keyboard + touch)
- localStorage persists across sessions
- Invalid data handled gracefully

---

### v0.1.0: PBI-017 — Timer & Death Logic
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Owner:** @Dev  
**Depends On:** PBI-015 (death icons), PBI-016 (hull/power values)

**What It Does:**
- Game state machine (MENU → PLAYING → GAME_OVER)
- Timer system (starts on first input, Date.now() delta)
- Death detection (STAR > HULL > POWER priority)
- Game Over screen (time + death icon + message)
- Restart flow (reset all state)
- HUD timer display

**Key Files:**
- `packages/engine/src/lib/schemas/game-state.ts` — EDIT (add status, timer, deathCause)
- `packages/engine/src/lib/engine/game-loop.ts` — EDIT (checkDeath, updateTimer)
- `apps/web/src/components/HUD.svelte` — EDIT (add timer)
- `apps/web/src/components/GameOver.svelte` — NEW

**Success Criteria:**
- Timer accurate and visible
- All three death causes work
- Game Over screen displays correctly
- Restart resets all state (no leaks)

**Why Last:**
- Requires resource logic (PBI-016) to be complete
- Uses death icons from PBI-015
- Completes the full game loop

---

### v0.1.0: PBI-020 — Menu Overlay
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Owner:** @Dev  
**Depends On:** PBI-017 (game state machine), PBI-018 (settings page)

**What It Does:**
- Menu overlay visible in MENU state
- "TAP TO START" button to begin game
- Settings link for navigation to `/settings`
- Keyboard and touch accessible
- New `--color-overlay` design token

**Key Files:**
- `apps/web/src/components/MenuOverlay.svelte` — NEW
- `apps/web/src/components/GameWrapper.svelte` — EDIT (render overlay, startGame function)
- `apps/web/src/styles.css` — EDIT (add --color-overlay token)
- `apps/web/src/components/GameOver.svelte` — EDIT (use overlay token)
- `packages/engine/src/lib/engine/game-loop.ts` — EDIT (remove auto-start from updateTimer)

**Success Criteria:**
- Menu overlay displays in MENU state
- Start button and any-key starts game
- Settings link navigates correctly
- Keyboard accessible (Tab, Enter, Space)
- Mobile touch works

**Why Needed:**
- Players need a way to access settings from the game
- Provides intentional game start (not accidental input)
- Completes the user-facing game loop

---

## Implementation Strategy

### Week 1: Design & HUD Elements (v0.0.5: PBI-015)
**Focus:** Design-first — create and iterate on visual components in gallery

**Days 1-2: Resource Bar Design**
- [x] Create `resource-bar.ts` with canvas drawing functions
- [x] Design 3 color states (normal/warning/danger)
- [x] Add to gallery with slider controls
- [x] Get visual feedback from team

**Days 3-4: Icons & Timer Design**
- [x] Create `death-icons.ts` with STAR/HULL/POWER designs
- [x] Test icons at multiple sizes (16px, 24px)
- [x] Define timer display format and styling
- [x] Add all to gallery for review

**Day 5: Design System Updates & Review**
- [x] Update CSS tokens if needed (warning colors, etc.)
- [x] Final visual review and approval
- [x] Document component APIs for PBI-016

**Milestone:** All HUD designs complete in gallery, ready for integration

---

### Week 2: Resource Logic & Integration (v0.0.6: PBI-016)
**Focus:** Implement resource tracking and integrate designed HUD

**Days 1-2: Schema & Physics**
- [x] Create `game-state.ts` with ResourcesSchema (Zod)
- [x] Add SURVIVAL_CONFIG constants
- [x] Implement `updatePower()` and `updateHull()`

**Days 3-4: HUD Integration**
- [x] Create Svelte version of resource bars (using PBI-015 designs)
- [x] Integrate into HUD component
- [x] Wire up to physics loop
- [x] Test color state transitions

**Day 5: Testing & Tuning**
- [x] Manual testing (power consumption, sun zones, collisions)
- [x] Performance profiling (< 0.5ms target)
- [x] Initial tuning pass

**Milestone:** Resources functional with visual HUD integration

---

### Week 3: Death/Timer Logic + Settings (v0.1.0 + v0.0.7)
**Focus:** Complete game loop and add settings (parallel work)

**Days 1-2: State Machine & Death Detection**
- [x] Extend GameState with status, timer, deathCause
- [x] Implement `checkDeath()` with priority order
- [x] Implement `updateTimer()` with Date.now() delta

**Days 3-4: Game Over Screen + Settings (Parallel)**
- [x] Create GameOver.svelte (using PBI-015 death icons)
- [x] Add timer to HUD
- [x] **Parallel:** Create `/settings` route + control inversion

**Day 5: Integration & Testing**
- [x] Test all death conditions
- [x] Test restart flow (memory leaks)
- [x] Test settings persistence
- [x] Test control inversion

**Milestone:** v0.1.0 complete — full game loop + settings ✅

---

### Week 4: Polish & Release Prep
**Focus:** Holistic testing, tuning, and documentation

**Days 1-2: Gameplay Tuning**
- [x] Playtest 10+ runs, adjust SURVIVAL_CONFIG constants
- [x] Target: 60-90s average survival time
- [x] Ensure all three death causes occur naturally
- [x] Balance sun zone risk/reward

**Days 3-4: Comprehensive QA**
- [x] All acceptance criteria verified (PBI-015 through PBI-020)
- [x] Performance audit (60 FPS on desktop + mobile)
- [x] Cross-browser testing (Chrome, Firefox, Safari)
- [x] Accessibility audit (keyboard nav, contrast, ARIA)
- [x] Mobile testing (iOS Safari, Android Chrome)

**Day 5: Documentation & Git Tags**
- [x] Update project-vision.md (Phase 5 complete)
- [x] Update package.json versions (0.0.5 → 0.0.6 → 0.0.7 → 0.1.0)
- [x] Create release notes for each version
- [x] Git tags: `v0.0.5`, `v0.0.6`, `v0.0.7`, `v0.1.0`
- [x] Internal playtest with 3+ users

**Milestone:** v0.1.0 shipped, Phase 5 complete ✅

---

## Success Metrics

### Technical
- ✅ Zero TypeScript errors (`pnpm -r check`)
- ✅ 60 FPS maintained on desktop (Chrome, Firefox, Safari)
- ✅ 60 FPS maintained on mobile (iPhone 12 / Pixel 5 equivalent)
- ✅ Resource updates < 0.5ms combined
- ✅ No memory leaks (tested with Chrome DevTools)

### Gameplay
- ✅ Player can survive 60-90 seconds on first attempt (with learning)
- ✅ Average survival time 30-60s (indicates balanced difficulty)
- ✅ All three death causes occur naturally (not one-sided)
- ✅ Sun approach feels risky but necessary (risk/reward balance)

### UX
- ✅ Controls feel responsive (< 50ms input latency)
- ✅ Timer is always visible and accurate
- ✅ Game Over screen is clear and actionable
- ✅ Settings save/load without issues
- ✅ Mobile controls work smoothly (44px min targets)

---

## Dependencies & Blockers

### External Dependencies
- ✅ Phase 4 complete (camera, viewport, star, planet)
- ✅ Input system functional (keyboard + touch)
- ✅ Physics engine stable (gravity, collision, wrapping)

### Internal Dependencies
- PBI-016 depends on PBI-015 (needs hull/fuel values)
- PBI-017 is independent (can parallelize)

### Potential Blockers
- Performance regression (resource updates too expensive)
- Tuning issues (fuel consumption too fast/slow)
- Mobile input lag (touch events delayed)

**Mitigation:** Allocate Week 4 as buffer for unexpected issues

---

## Testing Strategy

### Unit Tests (Optional for v0.1.0)
- `updateFuel()` clamps to [0, 100]
- `updateHull()` clamps to [0, 100]
- `checkDeath()` returns correct priority
- `loadSettings()` handles corrupt data

### Integration Tests
- Timer starts on first input
- Death triggers state transition
- Restart resets all state
- Settings persist across sessions

### Manual QA Checklist
See individual PBIs for detailed checklists:
- [PBI-015 Testing](./backlog/PBI-015-Resource-Systems.md#testing-checklist)
- [PBI-016 Testing](./backlog/PBI-016-Timer-Death-Logic.md#testing-checklist)
- [PBI-017 Testing](./backlog/PBI-017-Settings-Route.md#testing-checklist)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Fuel consumption too aggressive | HIGH | Player frustration | Tuning constants, multiple playtests |
| Sun zones not balanced | MEDIUM | Avoid-sun strategy dominant | Adjust regen/burn ratio, make Zone 2 rewarding |
| Performance regression | LOW | FPS drops below 60 | Profile early, optimize distance calculations |
| Settings don't apply live | LOW | Requires restart (bad UX) | Pass settings reactively to game loop |
| Memory leaks on restart | MEDIUM | Browser slows over time | Profile with DevTools, cleanup listeners |

---

## Out of Scope (Phase 6+)

The following are explicitly **NOT** in v0.1.0:

- ❌ Firebase integration (Auth, Firestore)
- ❌ Leaderboard submission & display
- ❌ Initials entry UI
- ❌ Sound effects (thrust, collision, death)
- ❌ Visual effects (particles, screen shake)
- ❌ Additional planets (variety)
- ❌ Pause menu
- ❌ Tutorial overlay

These will be addressed in:
- **Phase 6 (v0.2.0):** High Score System
- **Phase 7 (v0.3.0):** Content & Polish
- **Phase 8 (v1.0.0):** Ship Mode A

---

## Definition of Done (Phase 5)

Phase 5 is complete when:

- [x] All three PBIs (015, 016, 017) marked DONE
- [x] All acceptance criteria met for each PBI
- [x] Zero TypeScript errors in build
- [x] 60 FPS maintained on desktop + mobile
- [x] Manual QA pass complete (all checklists)
- [x] Cross-browser testing complete (Chrome, Firefox, Safari)
- [x] Mobile testing complete (iOS + Android)
- [x] Documentation updated (vision.md, CHANGELOG)
- [x] Git tagged: `v0.1.0`
- [x] Internal playtest with 3+ users (feedback documented)

---

## Post-Phase 5 Next Steps

Once v0.1.0 ships:

1. **Internal Playtest**
   - 3-5 internal testers play for 30 minutes
   - Collect feedback: Is fuel/hull balanced? Is sun too scary? Controls comfortable?
   - Document findings in `docs/playtest-feedback-v0.1.0.md`

2. **Tuning Adjustments**
   - Adjust SURVIVAL_CONFIG constants based on feedback
   - Target: 60-90s average survival time for new players
   - Ensure all three death causes occur with similar frequency

3. **Phase 6 Planning**
   - Create spec for Firebase integration (Auth + Firestore)
   - Design leaderboard UI/UX
   - Create PBIs for high score submission

4. **Performance Baseline**
   - Document current FPS on test devices
   - Establish performance budget for Phase 6 features

---

## Resources

### Documentation
- [Project Vision](./project-vision.md) — Updated with Phase 5 details
- [Survival Core Spec](./specs/survival-core.md) — Comprehensive feature spec
- [AGENTS.md](../AGENTS.md) — Agent roles and coding standards

### PBIs (Execution Order)
1. [PBI-015: Resource HUD Design](./backlog/PBI-015-Resource-HUD-Design.md) — v0.0.5 ✅
2. [PBI-016: Resource Logic](./backlog/PBI-016-Resource-Logic.md) — v0.0.6 ✅
3. [PBI-017: Timer & Death Logic](./backlog/PBI-017-Timer-Death-Logic.md) — v0.1.0 ✅
4. [PBI-018: Settings Route](./backlog/PBI-018-Settings-Route.md) — v0.0.7 ✅
5. [PBI-019: Lab Refactor](./backlog/PBI-019-Lab-Refactor.md) — v0.0.5 ✅
6. [PBI-020: Menu Overlay](./backlog/PBI-020-Menu-Overlay.md) — v0.1.0 ✅

### Related Specs
- [Game Engine Phase 1](./specs/game-engine-phase1.md) — Physics foundation
- [Controls System](./specs/controls-system.md) — Input handling
- [Camera System](./specs/camera-system.md) — Viewport tracking
- [Star Mechanics](./specs/star_mechanics.md) — Gravity well + death zone
- [Planet Mechanics](./specs/planet-mechanics.md) — Collision + orbit

---

## Sign-Off

**Phase Lead:** @Lead  
**Implementation:** @Dev  
**Approval:** ⏳ Pending Kickoff

**Kickoff Date:** TBD  
**Target Completion:** TBD (3-4 weeks from kickoff)

---

**Next Phase:** Phase 6 (v0.2.0) — High Score System with Firebase + Leaderboard