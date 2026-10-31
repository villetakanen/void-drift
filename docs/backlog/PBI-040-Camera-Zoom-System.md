# PBI-040: Camera Zoom System

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 8 (Gameplay Expansion)  
**Target Version:** v0.4.0  
**Spec:** [Camera Zoom + Ship Select (v0.4.0)](../specs/ship-select-and-camera-zoom-v0.4.0.md)

---

## User Story

**As a** player  
**I want** to zoom the camera in and out during gameplay  
**So that** I can choose between precision flying and wider situational awareness

---

## Acceptance Criteria

- [ ] Camera supports smooth zoom interpolation (`currentZoom` -> `targetZoom`).
- [ ] Zoom range is clamped (`0.85` to `1.35`).
- [ ] Desktop input supports zoom in/out and reset.
- [ ] Mobile has touch-safe zoom controls (44px minimum targets).
- [ ] HUD remains screen-space and does not scale with world zoom.

---

## Technical Implementation

- Update `packages/core/src/lib/physics/Camera.ts` with zoom state + methods.
- Wire controls in `apps/web/src/components/GameWrapper.svelte`.
- Add simple zoom control UI in HUD overlay for mobile.

---

## Definition of Done

- [ ] Feature is available on desktop + mobile.
- [ ] Type check and build pass.
- [ ] No camera jitter artifacts during shake + zoom overlap.
