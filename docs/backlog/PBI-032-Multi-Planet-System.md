# PBI-032: Multi-Planet System

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Phase:** 7 (Content & Polish)  
**Target Version:** v0.2.1  
**Epic:** [Phase 7: Content & Polish](../PHASE-7-ROADMAP.md)

---

## User Story

**As a** player  
**I want** to navigate through multiple planets with different orbits  
**So that** each run presents varied gravity challenges and strategic choices

---

## Context

This PBI transforms the single-planet arena into a dynamic multi-planetary system with 3 distinct celestial bodies. The shift from static to dynamic gravity landscapes forces players to adapt navigation strategies and creates emergent gameplay variety.

**Why This Matters:**
- **Variety:** Each run presents different orbital configurations due to varied planet speeds
- **Strategy:** Players must choose paths through shifting gravity wells
- **Replayability:** No two runs feel identical due to orbital dynamics

**Prerequisites:**
- ✅ Phase 5 complete (survival core with resources)
- ✅ Phase 6 complete (high scores & leaderboard)
- ✅ Existing planet mechanics (gravity, collision, orbit)

---

## Blueprint

### Architecture

#### 1. Configuration Schema

**File:** `packages/mode-a/src/lib/config.ts`

```typescript
import { z } from 'zod';

// Planet configuration schema
export const PlanetConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  radius: z.number().positive(),
  mass: z.number().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  orbitRadius: z.number().positive(),
  orbitSpeed: z.number(), // rad/s (can be negative for retrograde)
  orbitPhase: z.number(), // Initial angle in radians
  gravityRadius: z.number().positive(),
  restitution: z.number().min(0).max(1),
});

export type PlanetConfig = z.infer<typeof PlanetConfigSchema>;

// Update SURVIVAL_CONFIG
export const SURVIVAL_CONFIG = {
  // ... existing config
  
  // Replace single PLANET with PLANETS array
  PLANETS: [
    {
      id: 'rock',
      name: 'The Rock',
      radius: 40,
      mass: 1000,
      color: '#8B7355',
      orbitRadius: 300,
      orbitSpeed: 0.0005, // Slow, steady orbit
      orbitPhase: 0,
      gravityRadius: 160,
      restitution: 0.8,
    },
    {
      id: 'gas',
      name: 'The Gas',
      radius: 30,
      mass: 1200,
      color: '#6B4C9A',
      orbitRadius: 450,
      orbitSpeed: 0.0012, // Faster orbit
      orbitPhase: Math.PI / 2, // Start at 90° offset
      gravityRadius: 200, // Larger gravity well
      restitution: 0.7,
    },
    {
      id: 'moon',
      name: 'The Moon',
      radius: 20,
      mass: 600,
      color: '#D0D0D0',
      orbitRadius: 250,
      orbitSpeed: -0.002, // Fast retrograde orbit
      orbitPhase: Math.PI, // Start at 180°
      gravityRadius: 120,
      restitution: 0.9, // Very bouncy
    },
  ] as const satisfies readonly PlanetConfig[],
};
```

---

#### 2. Physics Updates

**File:** `packages/core/src/lib/physics/Physics.ts`

**Current State:**
```typescript
// Single planet gravity
applyGravity(ship, [sun, planet]);
checkCollision(ship, planet);
```

**New State:**
```typescript
// Multi-planet gravity (vector addition)
const celestialBodies = [sun, ...planets];
applyGravity(ship, celestialBodies);

// Check collisions with all planets
for (const planet of planets) {
  checkCollision(ship, planet);
}
```

**Gravity Calculation (No Changes Needed):**
The existing `applyGravity` function already supports multiple bodies through vector addition:

```typescript
export function applyGravity(
  ship: Ship,
  bodies: Array<{ x: number; y: number; mass: number; gravityRadius: number }>
): void {
  let totalForceX = 0;
  let totalForceY = 0;

  for (const body of bodies) {
    const dx = body.x - ship.x;
    const dy = body.y - ship.y;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);

    if (distance > body.gravityRadius) continue;

    const force = (PHYSICS_CONFIG.GRAVITY_CONSTANT * body.mass) / distanceSquared;
    totalForceX += (dx / distance) * force;
    totalForceY += (dy / distance) * force;
  }

  ship.vx += totalForceX;
  ship.vy += totalForceY;
}
```

---

#### 3. Planet Position Updates

**File:** `packages/mode-a/src/lib/game-loop.ts`

```typescript
import type { PlanetConfig } from './config';

export interface PlanetState {
  config: PlanetConfig;
  x: number;
  y: number;
  angle: number; // Current orbital angle
}

export function updatePlanetPositions(
  planets: PlanetState[],
  centerX: number,
  centerY: number,
  deltaTime: number
): void {
  for (const planet of planets) {
    // Update orbital angle
    planet.angle += planet.config.orbitSpeed * deltaTime;

    // Calculate position from angle
    planet.x = centerX + Math.cos(planet.angle) * planet.config.orbitRadius;
    planet.y = centerY + Math.sin(planet.angle) * planet.config.orbitRadius;
  }
}

// Initialize planets at game start
export function initializePlanets(
  configs: readonly PlanetConfig[],
  centerX: number,
  centerY: number
): PlanetState[] {
  return configs.map((config) => ({
    config,
    x: centerX + Math.cos(config.orbitPhase) * config.orbitRadius,
    y: centerY + Math.sin(config.orbitPhase) * config.orbitRadius,
    angle: config.orbitPhase,
  }));
}
```

---

#### 4. Rendering Updates

**File:** `apps/web/src/components/Game.svelte`

```typescript
// Update render loop to draw all planets
function render(ctx: CanvasRenderingContext2D) {
  // ... existing rendering (ship, star, HUD)

  // Render all planets
  for (const planet of planetStates) {
    const screenPos = worldToScreen(planet.x, planet.y);
    drawPlanet(
      ctx,
      screenPos.x,
      screenPos.y,
      planet.config.radius,
      planet.config.color
    );
  }
}
```

---

## Contract

### Schemas

**Export from `@void-drift/mode-a`:**
```typescript
export { PlanetConfigSchema, type PlanetConfig } from './lib/config';
export { type PlanetState, initializePlanets, updatePlanetPositions } from './lib/game-loop';
```

### API Surface

**Physics (No Breaking Changes):**
```typescript
// Existing function signature unchanged
export function applyGravity(
  ship: Ship,
  bodies: Array<GravitySource>
): void;

export function checkCollision(
  ship: Ship,
  body: { x: number; y: number; radius: number }
): CollisionResult | null;
```

**Game Loop:**
```typescript
export function initializePlanets(
  configs: readonly PlanetConfig[],
  centerX: number,
  centerY: number
): PlanetState[];

export function updatePlanetPositions(
  planets: PlanetState[],
  centerX: number,
  centerY: number,
  deltaTime: number
): void;
```

---

## Acceptance Criteria

### Configuration
- [x] `SURVIVAL_CONFIG.PLANETS` array defined with 3 planets
- [x] Each planet has unique orbital parameters (radius, speed, phase)
- [x] Schema validation passes for all planet configs
- [x] The Rock: Large, slow orbit (baseline difficulty)
- [x] The Gas: Medium, faster orbit, larger gravity well
- [x] The Moon: Small, fast retrograde orbit

### Physics
- [x] Gravity calculation handles N planets correctly (vector addition)
- [x] Ship responds to combined gravity from all sources (sun + 3 planets)
- [x] Collision detection works on all planets
- [x] Hull damage (-7%) applies on any planet collision
- [x] Elastic bounce works correctly for all planets

### Orbital Mechanics
- [x] All planets orbit the central star
- [x] Orbital positions update each frame based on deltaTime
- [x] Retrograde orbit (The Moon) moves clockwise
- [x] Planets maintain consistent orbital radius
- [x] Initial phases prevent all planets starting at same position

### Rendering
- [x] All 3 planets visible on screen
- [x] Planets render with correct colors (distinct from each other)
- [x] Planets render at correct orbital positions
- [x] Rendering order: background → star → planets → ship → HUD

### Performance
- [x] Maintains 60 FPS on desktop with 3 planets
- [x] Maintains 60 FPS on mobile (iPhone 12 / Pixel 5)
- [x] No frame drops during heavy gravity interactions
- [x] Physics step remains < 3ms (vs. 2ms single-planet baseline)

---

## Technical Implementation

### Step 1: Update Configuration (30 min)

1. **File:** `packages/mode-a/src/lib/config.ts`
   - Remove single `PLANET` config
   - Add `PLANETS` array with 3 planet configs
   - Validate schema exports

2. **File:** `packages/mode-a/src/lib/schemas/game-state.ts`
   - Export `PlanetConfigSchema`
   - No changes to `GameState` (planets are config, not state)

### Step 2: Update Game Loop (1 hour)

1. **File:** `packages/mode-a/src/lib/game-loop.ts`
   - Add `PlanetState` interface
   - Implement `initializePlanets()`
   - Implement `updatePlanetPositions()`
   - Update main loop to call `updatePlanetPositions()` before physics

2. **File:** `apps/web/src/components/Game.svelte`
   - Initialize `planetStates` from `SURVIVAL_CONFIG.PLANETS`
   - Call `updatePlanetPositions()` in game loop
   - Pass all planets to physics engine

### Step 3: Update Physics (30 min)

1. **File:** `packages/core/src/lib/physics/Physics.ts`
   - ✅ No changes needed (already supports array of bodies)
   - Test with 4 bodies (1 sun + 3 planets)

2. **File:** `apps/web/src/components/Game.svelte`
   - Update `applyGravity` call: `applyGravity(ship, [sun, ...planetStates])`
   - Update collision loop to iterate all planets

### Step 4: Update Rendering (30 min)

1. **File:** `apps/web/src/components/Game.svelte`
   - Update render loop to iterate `planetStates` array
   - Ensure consistent rendering order
   - Verify screen-space conversion for all planets

### Step 5: Tuning & Testing (1.5 hours)

1. **Gravity Tuning:**
   - Verify combined gravity feels correct
   - Test "gravity slingshot" scenarios (3+ bodies)
   - Adjust planet masses if needed

2. **Performance Testing:**
   - Profile physics step with 3 planets
   - Test on target mobile devices
   - Optimize if FPS drops below 60

3. **Playtesting:**
   - Verify emergent variety (orbital configurations)
   - Check for "dead zones" (impossible to survive)
   - Validate collision damage consistency

---

## Definition of Done

- [x] `SURVIVAL_CONFIG.PLANETS` array contains 3 planets
- [x] All planets orbit with distinct speeds and phases
- [x] Physics handles multi-body gravity correctly
- [x] Collisions work on all 3 planets
- [x] 60 FPS maintained on desktop and mobile
- [x] Zero TypeScript errors
- [x] Game loop delta time scales correctly
- [x] Orbital mechanics tested for 5+ minutes (verify stability)
- [x] Code reviewed and merged to `feat/phase-7`

---

## Testing Checklist

### Configuration
- [ ] All 3 planets defined in config
- [ ] Schema validation passes
- [ ] Each planet has unique ID, color, and parameters

### Physics
- [ ] Ship pulls toward multiple planets when equidistant
- [ ] Gravity direction changes correctly when passing between planets
- [ ] Collision works on The Rock
- [ ] Collision works on The Gas
- [ ] Collision works on The Moon
- [ ] Hull damage (-7%) applies on all collisions

### Orbital Mechanics
- [ ] The Rock completes full orbit in ~125 seconds
- [ ] The Gas orbits faster than The Rock
- [ ] The Moon orbits in retrograde (clockwise)
- [ ] Planets never collide with each other
- [ ] Initial phases prevent orbital overlap at start

### Performance
- [ ] Desktop maintains 60 FPS (Chrome DevTools Performance tab)
- [ ] Mobile maintains 60 FPS on iPhone 12
- [ ] Mobile maintains 60 FPS on Pixel 5
- [ ] Physics step < 3ms in profiler
- [ ] No GC pauses > 16ms

### Edge Cases
- [ ] Ship survives between 2 planets with opposing gravity
- [ ] Ship can "slingshot" around planet using combined gravity
- [ ] Collisions don't "stick" ship to planet surface
- [ ] Planets maintain stable orbits for 10+ minutes

---

## Out of Scope

- Planet textures or visual detail (defer to polish)
- Procedural planet generation (fixed 3 planets for v0.2.1)
- Planet-specific mechanics (e.g., gas planet slows ship)
- More than 3 planets (defer to Phase 8+)
- Moons orbiting planets (defer to future)

---

## Dependencies

- **Requires:** Phase 5 (Survival Core) complete
- **Requires:** Phase 6 (High Scores) complete
- **Blocks:** PBI-033 (Visual Juice) — needs multi-planet collisions for testing
- **Blocks:** PBI-035 (Mobile Performance) — needs full planet load for profiling

---

## Performance Considerations

### Baseline Metrics (Single Planet)
- Physics step: ~2ms
- Render step: ~4ms
- Total frame time: ~8ms (75% headroom for 60 FPS)

### Expected Impact (3 Planets)
- Additional gravity calculations: +0.5ms
- Additional collision checks: +0.3ms
- Additional rendering: +0.2ms
- **Target:** < 3ms physics step (still 50% headroom)

### Optimization Strategies (If Needed)
1. **Spatial Partitioning:** Skip gravity if planet is > 2x gravityRadius
2. **Collision Batching:** Use bounding box pre-check before circle collision
3. **Render Culling:** Skip planets outside viewport (unlikely needed)

---

## Related Documents

- [Phase 7 Roadmap](../PHASE-7-ROADMAP.md) — Epic overview
- [Planet Mechanics Spec](../specs/planet-mechanics.md) — Existing planet system
- [Physics Spec](../specs/game-engine-phase1.md) — Core physics engine
- [Survival Core Spec](../specs/survival-core.md) — Resource system

---

## Notes

**Design Philosophy:**
- Each planet should feel mechanically distinct (mass, orbit, gravity radius)
- Retrograde orbit (The Moon) creates unpredictable encounters
- Varied orbit radii prevent "safe zones" from forming

**Tuning Guidelines:**
- If too easy: Increase planet gravity radii (larger influence)
- If too hard: Decrease planet masses (weaker pull)
- If repetitive: Adjust orbit speeds for more variance

**Future Enhancements (Deferred):**
- Planet-specific visual effects (gas cloud, ring system)
- Procedural planet generation on game start
- Configurable planet count in settings
- Planet collision detection (planets bounce off each other)

---

## Acceptance

**Implemented by:** TBD  
**Reviewed by:** TBD  
**Playtested by:** TBD  
**Sign-off:** TBD
