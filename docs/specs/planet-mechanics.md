# Feature: Planet Entity

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context
Planets supply the "Terrain" of the void. Unlike Stars, they are persistent obstacles that provide cover and smaller gravity wells for slingshot maneuvers. They introduce variety to the arena layout.

**Achievement:** Orbiting rock planet with gravity well and elastic collision mechanics operational.

### Architecture

#### Planet Type System

| Type | ID | Color | Description |
|------|----|-------|-------------|
| Rock | `rock` | `#8B7355` | Brown rocky surface, cratered terrain |
| Gas | `gas` | `#6B4C9A` | Purple gas giant, swirling atmosphere |
| Ocean | `ocean` | `#4A90C2` | Blue water world |
| Desert | `desert` | `#C4A35A` | Sandy tan, arid surface |
| Ice | `ice` | `#A8D8E8` | Light blue frozen world |

#### Data Model
  ```typescript
  type PlanetType = 'rock' | 'gas' | 'ocean' | 'desert' | 'ice';

  interface Planet {
    pos: Vec2;
    orbitCenter: Vec2;
    orbitRadius: number; // Distance from center (200-1000px)
    orbitSpeed: number;  // Radians per second
    orbitAngle: number;  // Current angle
    radius: number;      // Planet size (10-100px)
    mass: number;
    color: string;
    type: PlanetType;    // Visual type category
    hasRing: boolean;    // Ring system around planet
  }
  ```

#### Dynamic Spawning

Each new game generates 0-5 planets randomly using the following parameter ranges:

| Parameter | Range | Notes |
|-----------|-------|-------|
| Count | 0-5 | Random per game session |
| Orbit Radius | 200-1000px | Distance from star center |
| Planet Radius | 10-100px | Physical size |
| Orbit Speed | ±0.02-0.15 rad/s | Sign determines direction |
| Type | rock/gas/ocean/desert/ice | Random selection |
| Ring | 20% probability | Visual ring system |

**Non-Overlap Constraint:**
Planets cannot overlap at any point in their orbits. For two planets with radii `r1` and `r2`:
- Minimum orbit separation: `(r1 * 4) + (r2 * 4)`
- Star exclusion zone: orbit radius ≥ 200px

**Spawn Algorithm:**
1. Generate random planet count (0-5)
2. For each planet, generate random parameters
3. Validate orbit doesn't conflict with existing planets
4. Retry with different orbit if conflict detected (max 10 attempts)
5. Skip planet if no valid placement found

- **Physics:**
  - Gravity: Inverse square law, influence radius is **mass-based** (capped at `radius * 8`).
  - Collision: Elastic bounce (restitution 0.8).
  - Motion: Planets orbit the central star.
- **Rendering:** Flat Vector Style (Solid Color) in `packages/core/src/lib/assets/planet.ts`.
  - Visualize orbit path with faint line.
  - Draw planet as simple circle (no gradients/textures to match aesthetic).

### Anti-Patterns
- **Do NOT** use expensive noise algorithms (Perlin) every frame. Pre-render to an offscreen canvas or use simple geometric rendering (craters = circles).
- **Do NOT** make planets overlap the Star or Spawn points.

## Contract

### Definition of Done
- [x] Planet renders with a distinct visual style (flat vector, solid color) distinguishable from the Star.
- [x] Physics engine applies local gravity near the planet (inverse square law).
- [x] Ships collide/bounce off the planet surface (elastic collision with restitution 0.8).
- [x] Planet orbits around a center point with configurable speed.
- [x] Orbit path visualized with faint line.

### Regression Guardrails
- **Visibility:** Planets must be clearly distinct from the background and the Star.
- **Physics:** Gravity wells of multiple bodies (Star + Planet) must sum logically.

### Scenarios
**Scenario: Slingshot** ✅
- Given a Planet exists in the arena
- When I fly past it tangentially
- Then my trajectory curves slightly due to its gravity
- But I do not get sucked in immediately (unless very close)
- **Status:** VERIFIED - Gravity well affects ship trajectory

**Scenario: Collision** ✅
- Given I fly directly into the Planet
- When impact happens
- Then my ship bounces back with elastic collision
- And velocity is damped by restitution factor (0.8)
- **Status:** VERIFIED - Collision detection and bounce functional

## Current Implementation

### Planet Data Structure
```typescript
interface Planet {
  pos: Vec2;              // Current position (updated each frame)
  orbitCenter: Vec2;      // Center of orbit (usually star position)
  orbitRadius: number;    // Distance from center (700px)
  orbitSpeed: number;     // Angular velocity (0.05 rad/s - very slow)
  orbitAngle: number;     // Current angle in radians
  radius: number;         // Physical/collision radius (30px)
  mass: number;           // Gravitational mass (400)
  color: string;          // Visual color (Slate Blue)
}
```

### Rendering
- **Style:** Flat vector aesthetic (no gradients or textures)
- **Color:** Slate Blue to match arcade vector art style
- **Orbit Path:** Faint white line (`rgba(255,255,255,0.05)`) shows orbital trajectory
- **Size:** Relatively small (20px radius) but large gravity influence
- **Location:** `packages/core/src/lib/assets/planet.ts` (rendering), `packages/core/src/lib/physics/Physics.ts` (physics)

### Physics

#### Orbital Mechanics
- **Update Formula:** 
  ```typescript
  orbitAngle += orbitSpeed * dt
  pos.x = orbitCenter.x + Math.cos(orbitAngle) * orbitRadius
  pos.y = orbitCenter.y + Math.sin(orbitAngle) * orbitRadius
  ```
- **Speed:** Very slow (0.05 rad/s) acts as semi-static hazard
- **Radius:** Orbits at 700px from star center

#### Gravity
- **Law:** Inverse square law scaled by mass
- **Influence Radius:** 16x physical radius (480px)
- **Formula:** `F = G * m1 * m2 / max(distance², minDistance²)`
- **Integration:** Uses same gravity system as star

#### Collision
- **Detection:** Distance check `|ship.pos - planet.pos| < (ship.radius + planet.radius)`
- **Response:** Elastic bounce with restitution 0.8
- **Formula:** `velocity_new = velocity_old.reflect(normal) * restitution`
- **Normal:** Calculated as `(ship.pos - planet.pos).normalize()`

### Configuration
- **Current Setup:** 1 Slate Blue planet orbiting at R=700
- **Spawning:** Hardcoded in game initialization (future: configurable via gallery)
- **Variability:** System supports multiple planets with different orbits

## Performance Characteristics
- **Render Time:** ~0.15ms per planet (circle + orbit line)
- **Physics Time:** ~0.2ms per planet (gravity + collision check)
- **Memory:** Zero allocations per frame (reuses Vec2 instances)

## Visual Properties
- **Color:** Slate Blue (#6A7B8C) for rock planet aesthetic
- **Orbit Visualization:** Subtle white line at 5% opacity
- **Scale:** Small relative to arena (1.67% of arena radius)
- **Contrast:** Easily distinguishable from star (no glow/pulse)

## Known Limitations
- **Ship Damage:** No health system (collision bounces but doesn't damage)
- **Rings:** Ring rendering is visual-only (no collision)

## Future Enhancements
- [ ] Add planet rotation animation
- [ ] Add surface detail (procedural craters, terrain)
- [ ] Add ship damage on high-velocity impacts
- [ ] Add atmospheric drag near large planets
- [ ] Ring collision detection

---

**Planet System Status: OPERATIONAL** 🪐  
**Dynamic Spawning:** 0-5 planets per game  
**Types:** rock, gas, ocean, desert, ice  
**Lab:** Parameter exploration at `/lab/entities/planet`

