# PBI-005: Gallery Workbench UI

**Status:** Done
**Priority:** Medium
**Parent:** Phase 1 (Foundation)

## 1. Problem
The Gallery needs a structure to host controls and the rendering canvas side-by-side.

## 2. Requirements

### 2.1. Layout
- Implement the layout defined in the spec `docs/specs/gallery_and_assets.md`.
- **Left Sidebar (Asset Picker)**: A list of buttons to switch between viewing 'Ship', 'Asteroid', 'Effects', etc.
- **Center (Stage)**: A container for the canvas or UI component being tested.
- **Right Sidebar (Inspector)**: A container for knobs/controls (sliders, checkboxes).

### 2.2. Components
- `apps/web/src/components/Gallery.svelte`: Main grid layout.
- `apps/web/src/components/Controls.svelte`: A component to render the right sidebar controls.
- `apps/web/src/components/Canvas.svelte`: A component to handle the 2D Context setup for the center stage.

## 3. Acceptance Criteria
- [ ] Visiting `/gallery` shows a 3-column layout (or responsive equivalent).
- [ ] There is a visible list of "Planned Assets" on the left.
- [ ] There is a place to put controls on the right.
