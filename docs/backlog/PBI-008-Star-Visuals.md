# PBI-008: Star Visuals & Workbench Lab

**Status:** Ready
**Priority:** High
**Role:** @Designer
**Parent:** Phase 2 (Core Mechanics)

## 1. Goal
Implement the visual representation of the "Star" entity and provide a tuning laboratory in the Gallery. The goal is to perfect the "burning/pulsing" look before integrating it into the game logic.

## 2. Requirements

### 2.1. The `drawStar` Function
-   Create `src/lib/assets/star.ts`.
-   Export a pure function: `drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, time: number)`.
-   **Visual Spec**:
    -   **Core**: A filled circle with the specified `color`.
    -   **Pulse**: Multiple rings radiating outwards from the center.
    -   **Animation**: The rings should expand and fade opacity as they travel. Use the `time` parameter to drive this phase.

### 2.2. Gallery Integration
-   Add a new "Star" view to `Gallery.svelte`.
-   **Controls**:
    -   `Radius` (Slider: 10px to 200px)
    -   `Color` (Color Picker: Default to Orange/Yellow)
    -   `Pulse Speed` (Slider: Adjust the speed of the radiating rings)
-   **Canvas**:
    -   Render the Star in the center of the canvas.
    -   Ensure the animation loop passes a `time` or `tick` value to `drawStar`.

## 3. Implementation Tasks
- [ ] Create `src/lib/assets/star.ts`.
- [ ] Implement the `drawStar` function with the "pulse" effect.
- [ ] Update `Gallery.svelte` to include the Star view.
- [ ] connect slider values to the `drawStar` parameters in real-time.

## 4. Acceptance Criteria
- [ ] The Star is visible in the Gallery.
- [ ] The "Pulse" animation flows smoothly outwards.
- [ ] Changing the color in the UI updates the Star immediately.
- [ ] Changing the radius updates the Star immediately.
- [ ] The visual style meets the "Void" aesthetic (minimalist but dynamic).
