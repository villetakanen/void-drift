# PBI-024: Lab Stats View

**Status:** DONE
**Priority:** LOW  
**Estimate:** 3 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.3

---

## User Story

**As a** developer/designer  
**I want** to see game stats for each entity in the lab  
**So that** I can understand and tune the gameplay parameters visually

---

## Context

The lab (`/lab`) currently shows visual previews of assets but doesn't display the underlying game stats that affect gameplay. When tuning parameters, developers need to:

1. Look at the visual representation
2. Cross-reference config files for actual values
3. Mentally map how values affect gameplay

This PBI adds a **stats panel** to the inspector sidebar of each lab entity and formalizes the **Entity Template** to ensure consistency across Ship, Star, and Planet workbenches.

### Entity Template Requirements
- **Layout:** Must strictly follow the **3-column Grid** defined in [Gallery and Assets Spec](../specs/gallery_and_assets.md#ui-layout-the-workbench-grid).
- **Stage:** `main` column uses split components (Main vs Inspector) for the interactive canvas.
- **Inspector:** `side-pane` column is dedicated to Svelte controls.

### Lab Segmentation
- **Entity Labs:** Ship, Star, Planet. (Must use `/lab/entities/` and `LabStats`)
- **System Labs:** Resources, Typography, Buttons. (Free-form layout, NO `LabStats`)

---

## Acceptance Criteria

### Stats Panel Component
- [x] Create reusable `LabStats.svelte` component
- [x] Displays key-value pairs in clean format
- [x] Supports grouping (Physical, Gameplay, Zones)
- [x] Uses monospace font for values (tabular alignment)
- [x] Matches design system (void bg, neon-blue accents)

### Ship Stats
- [x] Radius: collision size in pixels
- [x] Max Speed: pixels per second
- [x] Thrust Force: acceleration
- [x] Rotation Speed: radians per second
- [x] Drag: damping factor

### Sun Stats
- [x] Class: O / B / A / F / G / K / M
- [x] Size Rating: 1 - 100
- [x] Radius: visual/collision size in pixels
- [x] Mass: gravity strength factor
- [x] Power Multiplier: regen rate modifier
- [x] Burn Multiplier: hull damage modifier
- [x] Zone 1/2/3 Radii: calculated from base + sun scale

### Planet Stats
- [x] Radius: collision size
- [x] Mass: gravity strength
- [x] Orbit Radius: distance from sun
- [x] Orbit Speed: radians per second
- [x] Collision Damage: hull damage on impact

### Entity Lab Convergence
- [x] Refactor entity labs to follow the 3-column Grid
- [x] Implement Granular Routing (`/lab/entities/*`)
- [x] Create `LabPlanet.svelte` following the Entity Template (Drafted, ready for implementation)
- [x] Ensure `LabResources.svelte` (System Lab) does **not** include the `LabStats` component

---

## Technical Implementation

### Stats Component
Implemented in `apps/web/src/components/lab/LabStats.svelte`.

### Shared State Island Pattern
Implemented via `.svelte.ts` modules to share reactive state between the Stage and Inspector blocks in the Astro 3-column layout.

---

## Definition of Done

- [x] `LabStats.svelte` component created and restricted to Entity Labs
- [x] `LabLayout.astro` 3-column grid implemented
- [x] Ship stats displayed in simplified route `/lab/entities/ship`
- [x] Sun stats displayed in simplified route `/lab/entities/star`
- [x] Stats match actual config values
- [x] Stats update when selectors change
- [x] Consistent styling across all Entity Labs
- [x] Zero TypeScript errors

---

## Testing Checklist

### Accuracy
- [x] Ship stats match `CONFIG` values
- [x] Sun stats match `SUN_PRESETS` values
- [x] Zone radii calculate correctly with sun scale

### Visual
- [x] Stats panel readable
- [x] Values align nicely (tabular-nums)
- [x] Groups clearly separated
- [x] Matches void industrial aesthetic

### Interactivity
- [x] Sun type selector updates stats in real-time
- [x] No flicker or layout shift on update
