# PBI-042: Ship Select UI + Persistence

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)

---

## User Story

**As a** player  
**I want** to choose my ship before starting  
**So that** I can play with a style that matches my preference

---

## Acceptance Criteria

- [ ] Menu overlay includes ship selection for 3 variants.
- [ ] Selected ship is clearly highlighted with short stat summary.
- [ ] Choice persists across reload using settings store.
- [ ] Restart/new game uses selected ship profile reliably.

---

## Technical Implementation

- Update `apps/web/src/components/MenuOverlay.svelte` with ship select controls.
- Extend settings schema/store with `selectedShipId`.
- Read selected profile in `GameWrapper.svelte` on start/restart.

---

## Definition of Done

- [ ] Mobile touch targets meet 44px minimum.
- [ ] Keyboard navigation works on desktop menu.
- [ ] Type check and build pass.

---

## Related Documents

- [PBI-041: Ship Profile Schemas & Runtime Config](./PBI-041-Ship-Profile-Schemas.md)
- [PBI-043: Procedural Ship Variants (3)](./PBI-043-Procedural-Ship-Variants.md)
- [PBI-045: Ship Lab Chassis Preview](./PBI-045-Ship-Lab-Chassis-Preview.md)
