# PBI-043: Procedural Ship Variants (3)

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)

---

## User Story

**As a** player  
**I want** each ship choice to look visually distinct  
**So that** my chosen profile feels intentional and readable in motion

---

## Acceptance Criteria

- [ ] `drawShip` supports variant rendering by ship id/profile.
- [ ] Each variant has unique silhouette accents or geometry, not only color.
- [ ] Visual style remains consistent with current vector aesthetic.
- [ ] No external image/audio assets are added.

---

## Technical Implementation

- Update `packages/core/src/lib/assets/ship.ts` variant drawing paths.
- Pass selected profile visual info from game layer to renderer.
- Keep render path allocation-free inside frame loop.

---

## Definition of Done

- [ ] Variant differences are recognizable at gameplay scale.
- [ ] Existing ship effects (thrust, damage flash) remain intact.
- [ ] Type check and build pass.

---

## Related Documents

- [PBI-041: Ship Profile Schemas & Runtime Config](./PBI-041-Ship-Profile-Schemas.md)
- [PBI-042: Ship Select UI + Persistence](./PBI-042-Ship-Select-UI.md)
- [PBI-045: Ship Lab Chassis Preview](./PBI-045-Ship-Lab-Chassis-Preview.md)
