# Phase 6: Foundation & High Scores — Implementation Roadmap

**Versions:** v0.1.x → v0.2.0  
**Status:** 🚧 PLANNING  
**Goal:** Restructure packages for multi-mode support, add QoL improvements, implement high score system

---

## Executive Summary

Phase 6 prepares the codebase for future Mode B (multiplayer) while completing Mode A with a global leaderboard. The phase is split into two tracks:

**Track A: Foundation (v0.1.x)**
- Package restructure (core + mode-a separation)
- QoL improvements and polish

**Track B: High Scores (v0.2.0)**
- Firebase integration (Anonymous Auth + Firestore)
- Initials entry UI
- Leaderboard display

**Why This Matters:**
- Clean package structure prevents Mode A/B code mixing
- High scores add replayability and competition
- Foundation work now avoids painful refactoring later

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
│   └── src/lib/
│       ├── schemas/      # GameState, Resources, DeathCause, Settings
│       ├── game-loop.ts  # Survival-specific loop
│       ├── death.ts      # Death detection logic
│       └── config.ts     # SURVIVAL_CONFIG
```

**Success Criteria:**
- `pnpm -r build` succeeds
- `pnpm -r check` has zero TypeScript errors
- Game runs identically to v0.1.0
- No functional changes, pure restructure

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

---

### Track B: High Scores (v0.2.0)

#### PBI-0XX: Firebase Integration
**Priority:** HIGH  
**Estimate:** 3 Story Points

**What It Does:**
- Add Firebase SDK dependencies
- Configure Firebase project (Anonymous Auth + Firestore)
- Create Firestore security rules
- Implement anonymous auth flow

---

#### PBI-0XX: Initials Entry UI
**Priority:** HIGH  
**Estimate:** 5 Story Points

**What It Does:**
- 3-letter arcade-style initials input
- Keyboard and on-screen button support
- UID hash generation (SHA-256 → 6 chars)
- Score submission to Firestore

---

#### PBI-0XX: Leaderboard Display
**Priority:** HIGH  
**Estimate:** 3 Story Points

**What It Does:**
- Leaderboard route (`/leaderboard`)
- Display top 20 scores
- Show initials, UID hash, time, death cause
- Link from Game Over screen

---

## Implementation Strategy

### v0.1.1: Package Restructure
- PBI-021: Split engine → core + mode-a
- Pure refactor, no functional changes

### v0.1.2: Design System Polish
- PBI-022: Button Design System
- Unified button styles across app

### v0.1.3: Sun Variety & Lab Improvements
- PBI-023: Sun Scale System (random sun types)
- PBI-024: Lab Stats View (entity stats in lab)

### v0.2.0: High Score System
- Firebase setup
- Initials entry
- Leaderboard display

---

## Dependencies

### External Dependencies
- ✅ Phase 5 complete (v0.1.0 shipped)
- Firebase project setup required for Track B

### Internal Dependencies
- PBI-021 (Package Restructure) should be done first
- Firebase PBIs depend on project setup

---

## Success Metrics

### Technical
- Zero TypeScript errors after restructure
- Build time not significantly increased
- No runtime regressions

### Gameplay (v0.2.0)
- Player can submit score after death
- Leaderboard displays within 2 seconds
- Scores persist across sessions

---

## Out of Scope (Phase 7+)

- ❌ Sound effects
- ❌ Additional planets
- ❌ Visual effects (particles, screen shake)
- ❌ Mode B (multiplayer)

---

## Resources

### PBIs (Execution Order)
1. [PBI-021: Package Restructure](./backlog/PBI-021-Package-Restructure.md) — v0.1.1
2. TBD: QoL items
3. TBD: Firebase Integration
4. TBD: Initials Entry UI
5. TBD: Leaderboard Display

---

## Sign-Off

**Phase Lead:** @Lead  
**Approval:** ⏳ Pending

**Target Completion:** TBD
