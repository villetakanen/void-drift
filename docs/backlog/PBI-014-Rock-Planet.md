# PBI-014: Rock Planet Implementation

**Status:** TODO
**Priority:** Medium
**Parent:** Phase 4 (QoL)

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
- [ ] At least one Planet appears in the game.
- [ ] Flying near it pulls the ship (gravity).
- [ ] Crashing into it bounces the ship off.
- [ ] Planet looks distinct from the Star (not glowing/pulsing).
