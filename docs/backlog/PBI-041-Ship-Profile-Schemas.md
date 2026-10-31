# PBI-041: Ship Profile Schemas & Runtime Config

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)

---

## User Story

**As a** developer  
**I want** ship variants defined through a strict schema  
**So that** balancing and gameplay behavior stay type-safe and consistent

---

## Acceptance Criteria

- [ ] Add `ShipProfileSchema` using Zod.
- [ ] Define three profiles: `scout`, `balanced`, `tank`.
- [ ] Runtime config is validated once on load.
- [ ] Ship profile is available in game state and start/restart flow.

---

## Technical Implementation

- Add `packages/mode-a/src/lib/schemas/ship-profile.ts`.
- Add profile config export in `packages/mode-a/src/lib/config.ts`.
- Export schema/types from `packages/mode-a/src/index.ts`.

---

## Definition of Done

- [ ] No `any` types introduced.
- [ ] Invalid profile data fails schema validation.
- [ ] Type check and build pass.
