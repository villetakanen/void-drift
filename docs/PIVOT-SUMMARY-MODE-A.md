# Product Pivot Summary: Mode A First Strategy

**Date:** 2025-01-XX  
**Version:** Post-v0.0.4 → v0.1.0 Planning  
**Decision:** Ship single-player survival game (Mode A) before multiplayer (Mode B)

---

## Executive Summary

Void Drift has pivoted from a **multiplayer-first** approach to a **single-player-first** strategy. The project now consists of two distinct game modes sharing the same engine and assets:

- **Mode A (VOID DRIFT):** Single-player survival game — **GOAL 1 (Ship First)**
- **Mode B (VOID BRAWL):** Multiplayer arena combat — **DEFERRED (Future)**

**Rationale:** Mode A is a complete, shippable product that validates core mechanics (physics, controls, resource management) without the complexity of networking, lobbies, and state synchronization.

---

## What Changed

### Before (Original Vision)
```
Phase 1-4: Physics sandbox ✅ DONE
Phase 5: Networking & Lobbies
Phase 6: Multiplayer sync
Phase 7: Combat & weapons
Phase 8: Leaderboard & polish
```

**Problems:**
- Networking complexity delays first shippable version
- Can't validate ship physics without real gameplay loop
- No clear win condition for playtesting

---

### After (New Vision)
```
Phase 1-4: Physics sandbox ✅ DONE (v0.0.4)
Phase 5: Survival Core ← YOU ARE HERE (v0.1.0)
Phase 6: High Score System (v0.2.0)
Phase 7: Content & Polish (v0.3.0)
Phase 8: Ship Mode A (v1.0.0)
Phase 9+: Mode B - Multiplayer (Future)
```

**Benefits:**
- Ship Mode A in ~4 weeks (v0.1.0)
- Validate physics/controls with real survival gameplay
- Create marketing asset (shareable high scores)
- Build user base before adding multiplayer

---

## Mode A: VOID DRIFT (Single-Player Survival)

### Core Gameplay Loop

```
Start Game
    ↓
Thrust to maneuver (consumes fuel)
    ↓
Approach sun to refuel (burns hull)
    ↓
Avoid planets (collision damage)
    ↓
Death (star contact / hull=0 / fuel=0)
    ↓
Leaderboard entry (3 letters + time)
    ↓
Restart
```

### The Core Tension

**Resource Management:**
- **Fuel:** Depletes when thrusting (1.5%/s)
- **Hull:** Damaged by planets (-7%) and sun proximity (0.1-1.5%/s)
- **Sun:** Refuels ship (0.5-4.0%/s) BUT burns hull

**Risk/Reward:**
- Need fuel → Must approach sun
- Sun refuels → But damages hull
- Longer survival → More sun visits → More risk

### Three Death Conditions

1. **STAR:** Ship touches star surface (instant death)
2. **HULL:** Hull reaches 0% (collision or burn damage)
3. **FUEL:** Fuel reaches 0% (can't maneuver)

### High Score System (Phase 6)

**Format:** Flipper-style arcade leaderboard
```
 1. ACE·A3F8B2  —  142.3s  [HULL]
 2. VXN·9D4E1C  —  128.7s  [FUEL]
 3. ???·FFFFFF  —  001.2s  [STAR] ← You
```

- **3 Letters:** Classic initials (arcade style)
- **UID Hash:** First 6 chars of user ID (uniqueness)
- **Time:** Seconds survived (to milliseconds)
- **Cause:** Death condition (STAR/HULL/FUEL)

---

## Mode B: VOID BRAWL (Multiplayer) - DEFERRED

### Why Later?

**Complexity:**
- Firebase Auth & Firestore setup
- Lobby creation & join-by-code UI
- State synchronization (10Hz updates)
- Client-side interpolation (lerp between snapshots)
- Lag compensation & anti-cheat
- Weapon systems (auto-turret, antimatter bomb)

**Dependency:**
- Requires Mode A's physics to be polished first
- Need user feedback on ship handling before multiplayer
- Networking bugs are 2x worse (desyncs, rubberbanding)

**Timeline:** Begin after Mode A ships to production (v1.0.0+)

---

## Phase 5: Survival Core (v0.1.0)

**Goal:** Transform physics sandbox into complete single-player game

### Three PBIs (16 Story Points Total)

#### PBI-015: Resource Systems (8 SP)
- Hull & Fuel tracking (100% → 0%)
- Fuel consumption (1.5%/s when thrusting)
- Sun proximity zones (4 zones: refuel + burn)
- Planet collision damage (-7% hull)
- Star contact instant death

**Key Files:**
- `packages/engine/src/lib/schemas/game-state.ts` — NEW
- `packages/engine/src/lib/engine/physics.ts` — EDIT
- `packages/engine/src/lib/config.ts` — EDIT

---

#### PBI-016: Timer & Death Logic (5 SP)
- Timer system (starts on first input)
- Game state machine (MENU → PLAYING → GAME_OVER)
- Death detection (STAR > HULL > FUEL priority)
- HUD timer display (1 decimal: `42.3s`)
- Game Over screen (time + death cause)
- Restart flow (reset all state)

**Key Files:**
- `packages/engine/src/lib/engine/game-loop.ts` — EDIT
- `apps/web/src/components/HUD.svelte` — EDIT
- `apps/web/src/components/GameOver.svelte` — NEW

---

#### PBI-017: Settings Route (3 SP)
- `/settings` Astro page
- Control inversion toggle (swap left/right)
- localStorage persistence (`void-drift:settings`)
- Immediate application (no restart needed)

**Key Files:**
- `apps/web/src/pages/settings.astro` — NEW
- `apps/web/src/components/Settings.svelte` — NEW
- `apps/web/src/lib/settings.ts` — NEW
- `packages/engine/src/lib/engine/input.ts` — EDIT

---

### Implementation Timeline

**Week 1:** Resource Systems (PBI-015)
- Schema, config, physics integration

**Week 2:** Timer & Death Logic (PBI-016)
- State machine, HUD, Game Over screen

**Week 3:** Settings Route (PBI-017)
- Settings page, control inversion

**Week 4:** Polish & Testing
- Tuning, QA, performance audit

**Target:** v0.1.0 shipped in 3-4 weeks

---

## Success Metrics (v0.1.0)

### Technical
- ✅ 60 FPS on desktop + mobile
- ✅ Zero TypeScript errors
- ✅ Resource updates < 0.5ms
- ✅ No memory leaks

### Gameplay
- ✅ 60-90s average survival time (balanced difficulty)
- ✅ All three death causes occur naturally
- ✅ Sun approach feels risky but necessary

### UX
- ✅ Controls responsive (< 50ms latency)
- ✅ Timer always visible and accurate
- ✅ Settings persist across sessions

---

## What's NOT in v0.1.0

**Phase 6+ Features:**
- ❌ Firebase (Auth, Firestore)
- ❌ Leaderboard submission/display
- ❌ Initials entry UI
- ❌ Sound effects
- ❌ Visual effects (particles, screen shake)
- ❌ Additional planets
- ❌ Pause menu

**Mode B Features (Future):**
- ❌ Multiplayer networking
- ❌ Lobby system
- ❌ Weapons (auto-turret, bombs)
- ❌ Kill/death tracking

---

## Roadmap Post-v0.1.0

### Phase 6: High Score System (v0.2.0)
- Firebase Anonymous Auth
- Firestore leaderboard schema
- 3-letter initials entry UI
- Global top-20 display
- Death cause icons

**Estimate:** 2-3 weeks

---

### Phase 7: Content & Polish (v0.3.0)
- Add 2-3 more planets (orbital variety)
- Sound effects (thrust, collision, death)
- Visual effects (particles, screen shake)
- Performance optimization (mobile 60fps)

**Estimate:** 2-3 weeks

---

### Phase 8: Ship Mode A (v1.0.0)
- Firebase Hosting deployment
- Social sharing (auto-generate score images)
- Analytics (survival stats)
- Bug bash & final QA
- Marketing push

**Estimate:** 1-2 weeks

**Target:** Mode A in production by [TBD]

---

### Phase 9+: Mode B - Multiplayer (Future)

**Decision Point:** After v1.0.0 launches, evaluate:
- User engagement with Mode A
- Technical performance (can we handle real-time sync?)
- Community demand for multiplayer
- Team bandwidth

**Estimate:** 6-8 weeks (if greenlit)

---

## Key Design Decisions

### Sun Proximity Zones

```
Zone 1 (< 150px): High Risk / High Reward
  Refuel: +4.0%/s
  Burn:   -1.5%/s

Zone 2 (150-250px): Medium Risk / Medium Reward
  Refuel: +2.0%/s
  Burn:   -0.5%/s

Zone 3 (250-350px): Low Risk / Low Reward
  Refuel: +0.5%/s
  Burn:   -0.1%/s

Zone 4 (> 350px): Safe Zone
  Refuel: 0%/s
  Burn:   0%/s
```

**Tuning Philosophy:** Zone 2 should be the "sweet spot" for sustained refueling. Zone 1 is desperate/high-skill maneuvers.

---

### Fuel Consumption Rate

**1.5% per second** (regardless of single vs. dual engine)

**Rationale:**
- Encourages forward thrust (dual engine = same cost)
- Initial fuel budget: ~66 seconds of continuous thrust
- Requires 2-3 sun visits for 60s+ survival

---

### Death Priority Order

**STAR > HULL > FUEL**

**Rationale:**
- Star contact is instant/dramatic (highest priority)
- Hull failure is second (visible degradation)
- Fuel depletion is last (player sees it coming)

---

## Open Questions (To Resolve in Week 1)

1. **Hull Damage Scaling:**
   - Linear (fixed rates per zone) or exponential (distance²)?
   - Current: Linear (simpler, easier to tune)

2. **Starting Resources:**
   - Always 100/100 or randomized (80-100%)?
   - Current: Fixed 100/100 (fairness)

3. **Visual Feedback:**
   - Red vignette at < 25% hull?
   - Fuel regen glow near sun?
   - Current: Minimal (defer to Phase 7)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fuel consumption too fast | Players die in < 30s | Tuning constants, playtesting |
| Sun zones not balanced | Avoid sun entirely | Adjust regen/burn ratio |
| Performance regression | FPS drops below 60 | Profile early, optimize |
| Settings don't apply live | Bad UX (restart needed) | Pass settings reactively |

---

## Documentation Updates

**Completed:**
- ✅ [project-vision.md](./project-vision.md) — Updated with two-mode strategy
- ✅ [survival-core.md](./specs/survival-core.md) — Comprehensive Phase 5 spec
- ✅ [PBI-015](./backlog/PBI-015-Resource-Systems.md) — Resource systems
- ✅ [PBI-016](./backlog/PBI-016-Timer-Death-Logic.md) — Timer & death
- ✅ [PBI-017](./backlog/PBI-017-Settings-Route.md) — Settings page
- ✅ [PHASE-5-ROADMAP.md](./PHASE-5-ROADMAP.md) — Implementation plan

**Next:**
- [ ] Create playtest feedback template
- [ ] Create Phase 6 spec (Firebase + Leaderboard)
- [ ] Update README with new vision

---

## Approval & Sign-Off

**Product Vision:** ✅ APPROVED  
**Phase 5 Scope:** ✅ APPROVED  
**PBI Breakdown:** ✅ APPROVED  

**Next Step:** Begin PBI-015 implementation (Resource Systems)

---

**Related Documents:**
- [Project Vision](./project-vision.md)
- [Survival Core Spec](./specs/survival-core.md)
- [Phase 5 Roadmap](./PHASE-5-ROADMAP.md)
- [AGENTS.md](../AGENTS.md)

---

**Revision History:**
- **2025-01-XX:** Initial pivot decision and Phase 5 planning