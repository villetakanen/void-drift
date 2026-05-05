# PBI-045: Ship Lab Chassis Preview

**Status:** DONE  
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Ship Lab Chassis Preview](../specs/ship-lab-chassis-preview.md)

---

## User Story

**As a** designer/developer  
**I want** to preview ship chassis variants in the Lab  
**So that** I can validate visuals and profile stats before gameplay balancing

---

## Acceptance Criteria

- [x] `/lab/entities/ship` can switch between `scout`, `balanced`, and `tank`.
- [x] Lab UI shows active profile stats (thrust, turn, hull, power drain, zoom default).
- [x] Ship preview rendering uses the same production config source as gameplay.
- [x] Variant visual differences are visible in the Lab preview.

---

## Technical Implementation

- Extend ship lab controls in `apps/web/src/components/lab/LabShipInspector.svelte`.
- Update `apps/web/src/components/lab/LabShipMain.svelte` to render selected profile variant.
- Read profile data from shared schema/config in `@void-drift/mode-a`.
- Keep lab preview deterministic and lightweight (no render-loop allocations).

---

## Definition of Done

- [x] Lab can be used to compare all three chassis without starting gameplay.
- [x] Stats shown in Lab match in-game profile values exactly.
- [x] Type check and build pass.

---

## Related Documents

- [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)
- [PBI-041: Ship Profile Schemas & Runtime Config](./PBI-041-Ship-Profile-Schemas.md)
- [PBI-043: Procedural Ship Variants (3)](./PBI-043-Procedural-Ship-Variants.md)
