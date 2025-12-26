# Feature: Star Entity & Mechanics

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context
The **Star** acts as the central anchor of the arena. It provides both a lethal hazard (collision) and a strategic mechanic (gravity slingshot). Its visual representation must convey "heat" and "danger" without interfering with the readability of the game state.

**Achievement:** Central star with gravity well and procedural pulsing animation operational at arena center.

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
- **Physics API:** `applyGravity(ship: Ship, star: Star): Vector2` (implemented in `packages/core/src/lib/physics/Physics.ts`)
- **Render API:** `drawStar(ctx: CanvasRenderingContext2D, star: Star, time: number)` (implemented in `packages/core/src/lib/assets/star.ts`)

### Anti-Patterns
- **Do NOT** use DOM elements (e.g., `<div>`) for the star; it must be drawn on the active Canvas.
- **Do NOT** apply gravity globally; it must be range-limited (`influenceRadius`) to prevent chaos.
- **Do NOT** use static sprites; the star must pulse to feel "alive".

## Contract

### Definition of Done
- [x] Star renders with a solid core and pulsing outer rings.
- [x] Gravity force vector is applied to the Ship when within `influenceRadius`.
- [x] Star positioned at arena center (960, 540 in logical coordinates).
- [x] Ship responds to gravity pull (inverse square law).

### Regression Guardrails
- **FPS:** The pulse animation must not degrade performance (zero object allocation per frame).
- **Determinism:** Gravity calculation must use fixed-step delta time (if possible) or be robust to frame-rate variance.

### Scenarios
**Scenario: Gravity Pull** ✅
- Given the Ship is motionless at distance `d < influenceRadius`
- When the physics loop ticks
- Then the Ship's velocity changes towards the Star's center
- And the speed increases over time
- **Status:** VERIFIED - Gravity well functional

**Scenario: Safety Zone** ✅
- Given the Ship is at distance `d > influenceRadius`
- When the physics loop ticks
- Then no external force is applied from the Star
- **Status:** VERIFIED - Influence radius properly limits gravity

**Scenario: Visual Animation** ✅
- Given the Star is rendered each frame
- When time progresses
- Then the outer rings pulse smoothly
- And the animation uses Math.sin for smooth oscillation
- **Status:** VERIFIED - Pulsing effect operational

## Current Implementation

### Star Data Structure
```typescript
interface Star {
  pos: Vec2;           // Position (960, 540 - arena center)
  radius: number;      // Visual/collision radius (varies by type)
  influenceRadius: number;  // Gravity range (varies by type)
  mass: number;        // Gravitational mass (varies by type)
  color: string;       // Color based on sun type
  type: SunType;       // RED_GIANT | YELLOW_DWARF | BLUE_DWARF
}

type SunType = 'RED_GIANT' | 'YELLOW_DWARF' | 'BLUE_DWARF';
```

### Sun Type System

The sun type determines visual appearance and gameplay characteristics.

**Config Location:** `packages/core/src/lib/config.ts`

```typescript
// Schema definition
interface SunTypeConfig {
  radius: number;           // Visual/collision radius
  influenceRadius: number;  // Gravity effective range
  mass: number;             // Gravitational pull strength
  color: string;            // Core color hex
  powerMultiplier: number;  // Fuel regen rate multiplier (1.0 = baseline)
  burnMultiplier: number;   // Hull damage rate multiplier (1.0 = baseline)
}

// Config structure
export const SUN_CONFIG = {
  RED_GIANT: {
    radius: /* tunable */,
    influenceRadius: /* tunable */,
    mass: /* tunable */,
    color: /* tunable */,
    powerMultiplier: /* tunable, < 1.0 */,
    burnMultiplier: /* tunable, < 1.0 */,
  },
  YELLOW_DWARF: {
    radius: /* tunable */,
    influenceRadius: /* tunable */,
    mass: /* tunable */,
    color: /* tunable */,
    powerMultiplier: 1.0,  // Baseline reference
    burnMultiplier: 1.0,   // Baseline reference
  },
  BLUE_DWARF: {
    radius: /* tunable */,
    influenceRadius: /* tunable */,
    mass: /* tunable */,
    color: /* tunable */,
    powerMultiplier: /* tunable, > 1.0 */,
    burnMultiplier: /* tunable, > 1.0 */,
  },
} as const;
```

### Sun Type Gameplay Effects

| Sun Type | Size | Gravity | Fuel Regen | Hull Burn | Difficulty |
|----------|------|---------|------------|-----------|------------|
| Red Giant | Large | Low | Slow | Low | Easy |
| Yellow Dwarf | Medium | Medium | Normal (1.0x) | Normal (1.0x) | Medium |
| Blue Dwarf | Small | High | Fast | High | Hard |

**Design Intent:**
- Red Giant: Forgiving, good for learning mechanics
- Yellow Dwarf: Baseline difficulty, balanced risk/reward
- Blue Dwarf: High risk/high reward, for skilled players

### Random Sun Selection
At game start, a random sun type is selected:
```typescript
function getRandomSunType(): SunType {
  const types: SunType[] = ['RED_GIANT', 'YELLOW_DWARF', 'BLUE_DWARF'];
  return types[Math.floor(Math.random() * types.length)];
}
```

### Lab Integration
The Lab must display the current sun configuration:
- Sun type name
- Radius, mass, influence radius
- Power/burn multipliers
- Visual preview with correct color and size

### Rendering (`packages/core/src/lib/assets/star.ts`)
- **Core:** Solid circle using star color
- **Glow Layers:** 3 concentric circles with decreasing opacity
- **Fuel Zone:** Faint dashed circle at fuel regen threshold
- **Animation:** Outer rings pulse using `Math.sin(time * 2)` for breathing effect
- **Blend Mode:** `lighter` for additive glow effect
- **Performance:** Zero allocations per frame (reuses colors/radii)

### Physics (`packages/core/src/lib/physics/Physics.ts`)
- **Gravity Law:** Inverse square with safeguard: `F = G * m1 * m2 / max(distance², minDistance²)`
- **Influence Check:** Only applies force if `distance < influenceRadius`
- **Force Application:** `ship.acc += force_vector`
- **Constants:**
  - Gravitational constant: `G = 0.1`
  - Minimum distance: `50px` (prevents singularity near core)

### Visual Properties
- **Color:** Warm orange (#ffaa00) to convey heat
- **Pulse Speed:** 2 rad/s (completes cycle every π seconds)
- **Glow Radius:** 3 layers at 1.5x, 2x, 2.5x core radius
- **Opacity:** Core 1.0, layers 0.3, 0.2, 0.1

### Integration
- **Location:** Always at arena center `(960, 540)` in logical viewport
- **Camera:** Star position used as fallback center for camera bounds
- **Starfield:** Background stars provide depth cues around the central star

## Performance Characteristics
- **Render Time:** ~0.2ms per frame (4 circle draws + blend mode)
- **Physics Time:** ~0.1ms per frame (distance calculation + force vector)
- **Memory:** Zero allocations (no temporary objects created)

## Known Limitations
- **Collision:** Ship does not explode on contact (death mechanic not yet implemented)
- **Debug Overlay:** Influence radius circle not visualized (future enhancement)
- **Multiple Stars:** System designed for single star (no multi-body physics)

## Future Enhancements
- [ ] Add binary star systems (two orbiting stars)
- [ ] Add solar flare particle effects
- [ ] Add death/respawn mechanic on collision
- [ ] Add corona shader effect for more dramatic visuals
- [ ] Add debug mode to visualize influence radius

---

**Star System Status: OPERATIONAL** ⭐  
**Location:** Arena center (960, 540)  
**Gravity:** Active with 350px influence radius
