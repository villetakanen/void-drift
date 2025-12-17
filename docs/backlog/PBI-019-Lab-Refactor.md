# PBI-019: Refactor Gallery to Lab Routing

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 3 Story Points  
**Phase:** 5 (Implementation Utility)  
**Target Version:** v0.0.5

---

## User Story

**As a** developer/designer  
**I want** a dedicated `/lab` route with sub-pages for each asset (e.g., `/lab/star`, `/lab/ship`)  
**So that** I can link directly to specific component workbenches and organize the growing number of assets without a single cluttered "Gallery" page.

---

## Context

The current `/gallery` is a single page that renders everything. As we add more complex UI elements (like the Resource HUD in PBI-015), a single page becomes unwieldy. We need a "Lab" structure where each experiment or asset has its own URL.

**Dependencies:**
- Blocks: PBI-015 (Resource HUD) - we want to build the HUD in this new `/lab/resource-hud` route.

---

## Acceptance Criteria

### Routing Structure
- [ ] Rename/Move `/gallery` logic to a new `/lab` base route.
- [ ] `/lab` (Index): Lists all available experiments/workbenches.
- [ ] `/lab/ship`: Dedicated page for Ship rendering tuning.
- [ ] `/lab/star`: Dedicated page for Star rendering tuning.
- [ ] `/lab/ui-kit`: (Optional) dedicated page for general UI tokens if needed.

### Lab Layout
- [ ] Create a `LabLayout.astro` (or similar shared layout) that provides navigation between lab pages.
- [ ] Ensure "Back to Lab Index" link exists on all sub-pages.

### Migration
- [ ] Refactor existing `Gallery.svelte` functionality:
    - Extract Ship viewing logic into `apps/web/src/components/lab/LabShip.svelte` (or similar).
    - Extract Star viewing logic into `apps/web/src/components/lab/LabStar.svelte`.
- [ ] Ensure the old `/gallery` route is removed or redirects to `/lab`.

---

## Technical Implementation Plan

1.  **Create Paths:**
    - `apps/web/src/pages/lab/index.astro` -> List of links.
    - `apps/web/src/pages/lab/ship.astro` -> Mounts Ship workbench.
    - `apps/web/src/pages/lab/star.astro` -> Mounts Star workbench.

2.  **Refactor Components:**
    - Split `Gallery.svelte` into smaller, focused components:
        - `LabShipViewer.svelte`
        - `LabStarViewer.svelte`

3.  **Update Navigation:**
    - Update main dev tools or index page to point to `/lab` instead of `/gallery`.

---

## Definition of Done

- [ ] navigating to `/lab` shows a list of assets.
- [ ] navigating to `/lab/ship` allows editing/viewing the ship.
- [ ] navigating to `/lab/star` allows editing/viewing the star.
- [ ] `pnpm check` passes.
- [ ] The "Gallery" terminology is replaced with "Lab" in the codebase where appropriate.
