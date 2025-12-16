# Feature: Planet Entity

## Blueprint

### Context
Planets supply the "Terrain" of the void. Unlike Stars, they are persistent obstacles that provide cover and smaller gravity wells for slingshot maneuvers. They introduce variety to the arena layout.

### Architecture
- **Data Model:**
  ```typescript

  interface Planet {
    pos: Vec2;
    orbitCenter: Vec2;
    orbitRadius: number; // Distance from center
    orbitSpeed: number;  // Radians per second
    orbitAngle: number;  // Current angle
    radius: number;
    mass: number;
    color: string;
  }
  ```
- **Physics:**
  - Gravity: Inverse square law (8x radius influence).
  - Collision: Elastic bounce (restitution 0.8).
  - Motion: Planets orbit the central star.
- **Rendering:** Flat Vector Style (Solid Color).
  - Visualize orbit path with faint line.
  - Draw planet as simple circle (no gradients/textures to match aesthetic).

### Anti-Patterns
- **Do NOT** use expensive noise algorithms (Perlin) every frame. Pre-render to an offscreen canvas or use simple geometric rendering (craters = circles).
- **Do NOT** make planets overlap the Star or Spawn points.

## Contract

### Definition of Done
- [ ] Planet renders with a distinct visual style (e.g., solid color with crater details) distinguishable from the Star.
- [ ] Physics engine applies local gravity near the planet.
- [ ] Ships collide/bounce off the planet surface.
- [ ] Workbench (`/#gallery`) allows spawning/tuning a Planet.

### Regression Guardrails
- **Visibility:** Planets must be clearly distinct from the background and the Star.
- **Physics:** Gravity wells of multiple bodies (Star + Planet) must sum logically.

### Scenarios
**Scenario: Slingshot**
- Given a Planet exists at (500, 500)
- When I fly past it tangentially
- Then my trajectory curves slightly due to its gravity
- But I do not get sucked in immediately (unless very close)

**Scenario: Collision**
- Given I fly directly into the Planet
- When impact happens
- Then my ship bounces back
- And velocity is conserved (elastic) or damped
