# Feature: Star Entity & Mechanics

## Blueprint

### Context
The **Star** acts as the central anchor of the arena. It provides both a lethal hazard (collision) and a strategic mechanic (gravity slingshot). Its visual representation must convey "heat" and "danger" without interfering with the readability of the game state.

### Architecture
- **Data Model:**
  ```typescript
  interface Star {
    x: number;
    y: number;
    radius: number;       // Collision Radius
    influenceRadius: number; // Gravity effective range
    color: string;
  }
  ```
- **Physics API:** `applyGravity(ship: Ship, star: Star): Vector2`
- **Render API:** `drawStar(ctx: CanvasRenderingContext2D, star: Star, time: number)`

### Anti-Patterns
- **Do NOT** use DOM elements (e.g., `<div>`) for the star; it must be drawn on the active Canvas.
- **Do NOT** apply gravity globally; it must be range-limited (`influenceRadius`) to prevent chaos.
- **Do NOT** use static sprites; the star must pulse to feel "alive".

## Contract

### Definition of Done
- [ ] Star renders with a solid core and pulsing outer rings.
- [ ] Gravity force vector is applied to the Ship when within `influenceRadius`.
- [ ] Physics debug overlay shows the gravity radius circle.
- [ ] Ship explodes (game over) upon touching the core radius.

### Regression Guardrails
- **FPS:** The pulse animation must not degrade performance (zero object allocation per frame).
- **Determinism:** Gravity calculation must use fixed-step delta time (if possible) or be robust to frame-rate variance.

### Scenarios
**Scenario: Gravity Pull**
- Given the Ship is motionless at distance `d < influenceRadius`
- When the physics loop ticks
- Then the Ship's velocity changes towards the Star's center
- And the speed increases over time

**Scenario: Safety Zone**
- Given the Ship is at distance `d > influenceRadius`
- When the physics loop ticks
- Then no external force is applied from the Star

**Scenario: Collision**
- Given the Ship touches the Star's `radius`
- When the collision detection runs
- Then the `isDead` state becomes `true`
