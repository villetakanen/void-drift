# PBI-009: Star Mechanics & Gravity

**Status:** Draft
**Priority:** Medium
**Role:** @GameDev
**Dependency:** PBI-008 (Visuals Complete)

## 1. Goal
Implement the gravitational mechanics of the Star, making it a functional gameplay element that alters the player's trajectory.

## 2. Requirements

### 2.1. Physics Data
-   Define the `Star` entity interface in the game engine.
-   Properties: `x`, `y`, `mass` (or `influenceRadius`), `radius` (physical collision).

### 2.2. Gravity Logic
-   Implement a gravity function that applies force to the Ship.
-   **Logic**:
    -   If `distance(ship, star) < influenceRadius`:
    -   `force = normalize(star - ship) * gravity_strength`
    -   `ship.velocity += force * deltaTime`

### 2.3. Game Integration
-   Spawn a `Star` in the default game scene (`GameWrapper`).
-   Render it using the `drawStar` function from PBI-008.
-   Apply the gravity physics in the update loop.

## 3. Implementation Tasks
- [ ] Define `Star` type in `packages/engine`.
- [ ] Implement `applyGravity` function.
- [ ] Integrate into `GameLoop` update step.
- [ ] Add visual debug cues (optional): Draw a faint line for the influence radius.

## 4. Acceptance Criteria
- [ ] Flying near the star pulls the ship in.
- [ ] Flying outside the influence radius feels like zero-g.
- [ ] Colliding with the star core (visual radius) triggers a collision event (stop/bounce/die).
