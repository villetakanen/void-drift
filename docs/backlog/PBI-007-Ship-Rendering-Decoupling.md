# PBI-007: Ship Rendering Decoupling

**Status:** Done
**Priority:** High
**Parent:** Phase 1 (Foundation)

## 1. Goal
Decouple the ship rendering logic from the main `Renderer` class so that it can be reused in the Gallery workbench without instantiating the entire game engine.

## 2. Requirements

### 2.1. Engine Refactoring
- Extract the ship drawing code from `Renderer.ts` into a standalone function: `drawShip(ctx, position, rotation, radius, color)`.
- Ensure this function is exported from `@void-drift/engine`.

### 2.2. Game Update
- Update the main game loop (`GameWrapper` / `Renderer`) to use this new `drawShip` function.
- Verify that the game looks exactly the same as before.

### 2.3. Gallery Integration
- In `Gallery.svelte`, implement the "Ship" view.
- Use `drawShip` to render the ship in the center of the canvas.
- Add a rotation control (slider) in the inspector to test the rendering.

## 3. Implementation Tasks
- [ ] Create `packages/engine/src/lib/renderers/ship.ts` (or similar).
- [ ] Move drawing logic from `Renderer.js` to new file.
- [ ] Export `drawShip` from `index.ts`.
- [ ] Refactor `Renderer.ts` to consume `drawShip`.
- [ ] Update `Gallery.svelte` to import and use `drawShip`.
- [ ] Add rotation slider to `Gallery.svelte`.

## 4. Acceptance Criteria
- [ ] `drawShip` is a pure function exportable from the engine.
- [ ] The game still renders the ship correctly.
- [ ] The Gallery "Ship" tab renders the ship.
- [ ] The Gallery slider rotates the ship.
