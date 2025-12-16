# Specification: Star Entity & Gravity Mechanics

## 1. Overview
The **Star** is a central celestial body in the Void Drift universe. It acts as both a visual anchor and a primary gameplay mechanic, introducing gravity to the flight physics.

## 2. Goals
1.  **Visual Identity**: Create a "burning" celestial body that fits the Void aesthetic (minimalist, geometry-focused).
2.  **Core Mechanic**: Implement a gravity well that alters the ship's trajectory, requiring player compensation.
3.  **Testability**: Inspect and tune the star's visual and physical parameters in the Workbench.

## 3. Capabilities

### 3.1. Physics: The Gravity Well
The star exerts an attractive force on the player's ship.
-   **Range**: The gravity affects the ship *only* within a specific **Influence Radius** (e.g., 200px). Outside this range, the ship floats in zero-g logic.
-   **Behavior**:
    -   When `distance(ship, star) < InfluenceRadius`:
    -   Apply a force vector directed towards the star's center.
    -   Force magnitude should likely increase as the ship gets closer (Inverse-square law or simplified linear approximation for gameplay feel).
-   **Collision**: The star body is solid. Colliding with the core (radius `r`) is a crash/death state (or bounce, pending `PBI-009`).

### 3.2. Rendering: The "Pulse"
The star is not a static sprite. It is procedurally drawn.
-   **Core**: A solid, filled circle (Colour: Warm/Bright, e.g., Orange/Yellow/White).
-   **Corona/Glow**:
    -   Animated circles radiating outwards from the core.
    -   These circles expand and fade (opacity -> 0) as they reach the outer limit.
    -   This creates a "pulsing" or "radiating" heat effect.
-   **Context**: Drawn on the HTML5 Canvas via `drawStar`.

## 4. Architecture & Data

### 4.1. Data Structure
```typescript
interface Star {
  x: number;
  y: number;
  radius: number;       // The physical collision size
  influenceRadius: number; // The gravity range (e.g., 200px)
  color: string;
}
```

### 4.2. Functional Interface
We continue the pure-function approach:
```typescript
// Render
function drawStar(ctx: CanvasRenderingContext2D, star: Star, time: number) {
  // 'time' is needed for the pulse animation phase
}

// Physics
function applyGravity(ship: Ship, star: Star): Vector2 {
  // Returns the force vector to add to ship.velocity
}
```

## 5. Integration Points

### 5.1. The Gallery (Workbench)
-   **New View**: Add a "Star" tab to the Gallery sidebar.
-   **Controls**:
    -   `Radius` (Slider 10-100)
    -   `Influence` (Slider 100-500)
    -   `Color` (Picker)
-   **Preview**: Render the star in the center.

### 5.2. The Demo Area (`index.astro` / `GameWrapper`)
-   The default game loop must now spawn a Star in the play area.
-   The player should experience the pull immediately if they fly near it.

## 6. Implementation Plan

### Phase 1: Visuals
1.  Create `src/lib/assets/star.ts`.
2.  Implement `drawStar` with the radiating pulse animation.
3.  Add "Star" to `Gallery.svelte` to tune the animation speeds and colors.

### Phase 2: Mechanics
1.  Implement `applyGravity` logic in the physics engine (likely `GameLoop.ts` or a new `Physics.ts`).
2.  Update the main loop to check distance between Ship and Star.
3.  Apply the force to the ship's velocity vector.

### Phase 3: Integration
1.  Instantiate a `Star` object in the main game state.
2.  Ensure it renders and exerts force in the `contracts/GameWrapper` context.

## 7. Acceptance Criteria
- [ ] **Visual**: The star pulses with expanding, fading rings.
- [ ] **Visual**: The star has a solid core.
- [ ] **Physics**: The ship's trajectory curves towards the star when within 200px (or configured radius).
- [ ] **Physics**: The ship is unaffected when outside the radius.
- [ ] **Workbench**: A developer can adjust the star's look in the Gallery.
- [ ] **Demo**: Loading `localhost:xxxx/` shows a Star in the scene.
