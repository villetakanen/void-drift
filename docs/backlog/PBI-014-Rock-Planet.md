# PBI-014: Rock Planet Implementation

**Status:** DONE
**Priority:** Medium
**Parent:** Phase 4 (QoL)
**Completed:** 2024

## 1. Context
To demonstrate the "Newtonian Chaos" vision, we need obstacles. The "Rock Planet" serves as a static gravity well and collision hazard.

## 2. Requirements

### 2.1. Planet Entity
- Create `Planet` interface (see `docs/specs/planet-mechanics.md`).
- Add `Planet` list to the `GameState`.

### 2.2. Procedural Rendering
- Create `src/lib/assets/planet.ts`.
- Implement `drawPlanet`:
  - Solid circle (Grey/Brown palette).
  - Simple details (e.g., 2-3 smaller circles for "craters") for parallax depth/rotation (optional).
  - Use `docs/specs/planet-mechanics.md` guidelines (no Perlin noise every frame).

### 2.3. Mechanics
- **Gravity:** Reuse/adapt the `applyGravity` logic from Star for Planets (potentially weaker pull).
- **Collision:** Implement Ship-Planet collision.
  - Simple elastic bounce: `ship.velocity = ship.velocity.reflect(normal) * restitution`.
  - Ship takes damage on impact (optional for now).

### 2.4. Integration
- Spawn 1-2 Planets in the default game arena (hardcoded positions is fine for now).

## 3. Acceptance Criteria
- [x] At least one Planet appears in the game.
- [x] Flying near it pulls the ship (gravity).
- [x] Crashing into it bounces the ship off.
- [x] Planet looks distinct from the Star (not glowing/pulsing).

## 4. Implementation Notes

### Physics
- **Defined `Planet` Interface:** Includes orbital properties (`orbitCenter`, `orbitRadius`, `orbitSpeed`).
- **Gravity:** Inverse square law logic similar to Star, but scaled by mass. Influence radius is **8x** physical radius.
- **Collision:** Simple elastic bounce with `restitution = 0.8`.
- **Orbital Mechanics:** Planets update their position every frame based on angular velocity.

### Rendering
- **Flat Vector Style:** Removed gradients/craters in favor of clean, solid colors (Slate Blue) to match the "vector arcade" aesthetic.
- **Orbit Visualization:** Renders a faint white line (`rgba(255,255,255,0.05)`) to show the path.
- **Dimensions:** Planet is relatively small (Radius = 20px) but has a large gravity impact.

### Configuration
- **Single Planet:** Currently spawning 1 Slate Blue planet at `R=700`.
- **Speed:** Drifts very slowly (`speed=0.05`) to act as a semi-static hazard.
