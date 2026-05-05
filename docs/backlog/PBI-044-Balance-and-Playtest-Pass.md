# PBI-044: Balance + Playtest Pass (Ships + Zoom)

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 2 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)

---

## User Story

**As a** designer/developer  
**I want** a final balancing pass across all ship variants and zoom defaults  
**So that** no option feels clearly dominant and all options feel playable

---

## Acceptance Criteria

- [ ] Run playtests for each ship profile on desktop and mobile.
- [ ] Tune profile multipliers if one profile dominates survival duration.
- [ ] Validate zoom defaults per profile do not harm readability.
- [ ] Confirm no mobile performance regression from v0.3.0 baseline.

---

## Technical Implementation

- Add/update quick balancing notes in this PBI during playtests.
- Capture final profile values and rationale.
- Confirm metrics with Perf HUD when feature-flag enabled.

---

## Definition of Done

- [ ] Scout/Balanced/Tank all viable in short test sessions.
- [ ] Camera zoom defaults and bounds finalized.
- [ ] `pnpm -r check` and `pnpm -r build` pass.
