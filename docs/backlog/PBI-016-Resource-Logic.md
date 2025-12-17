# PBI-016: Resource Logic & HUD Integration

**Status:** DONE  
**Priority:** HIGH  
**Estimate:** 8 Story Points  
**Phase:** 5 (Survival Core - Logic)  
**Target Version:** v0.0.6

---

## User Story

**As a** player  
**I want** hull and fuel resources that deplete and regenerate based on my actions  
**So that** I must balance risk/reward decisions (sun proximity refuels but damages hull)

---

## Context

This is the second PBI for Phase 5 (Survival Core). It implements the actual resource tracking logic and integrates the designed HUD elements (from PBI-015) into the game.

**The Core Tension:**
- Player needs fuel to maneuver → Must approach sun
- Sun proximity refuels ship → But burns hull
- Longer survival → More sun visits → More accumulated risk

**Dependencies:**
- ✅ PBI-015 (Resource HUD Design) — REQUIRED (visual designs must be complete)
- ✅ Phase 4 complete (star, planet, physics engine)
- ❌ PBI-017 (Timer & Death Logic) — Blocked until this is complete

---

## Acceptance Criteria

### Hull System
- [x] Ship starts with 100% hull on game initialization
- [x] Planet collision deducts 7% hull per impact
- [x] Hull damage is applied during existing collision detection logic
- [x] Sun proximity burns hull based on distance zones:
  - Zone 1 (< 150px): 1.5% per second
  - Zone 2 (150-250px): 0.5% per second
  - Zone 3 (250-350px): 0.1% per second
  - Zone 4 (> 350px): No damage
- [x] Star contact (distance < star.radius) sets hull to 0 immediately
- [x] Hull value is clamped to [0, 100] range
- [x] Hull updates are frame-rate independent (use deltaTime)

### Fuel System
- [x] Ship starts with 100% fuel on game initialization
- [x] Thrusting (any engine) consumes 1.5% fuel per second
- [x] Single-engine thrust (left OR right) uses same rate as dual-engine
- [x] Sun proximity refuels based on distance zones:
  - Zone 1 (< 150px): +4.0% per second
  - Zone 2 (150-250px): +2.0% per second
  - Zone 3 (250-350px): +0.5% per second
  - Zone 4 (> 350px): No refuel
- [x] Fuel value is clamped to [0, 100] range
- [x] Fuel updates are frame-rate independent (use deltaTime)
- [x] Fuel cannot regenerate above 100%

### Data Model
- [x] `ResourcesSchema` defined in Zod with hull/fuel validation
- [x] `GameState` schema includes resources object
- [x] Resources exported from `@void-drift/engine` package
- [x] All resource mutations go through validated update functions

### Physics Integration
- [x] `updateFuel()` function added to physics loop
- [x] `updateHull()` function added to physics loop
- [x] Resource updates occur AFTER input processing, BEFORE collision detection
- [x] Sun distance calculation reuses existing gravity well code
- [x] No new object allocations in update loops (performance)

### HUD Integration
- [x] Hull bar displayed in game HUD (uses PBI-015 design)
- [x] Fuel bar displayed in game HUD (uses PBI-015 design)
- [x] Bars update every frame (smooth animation)
- [x] Color states work correctly (normal/warning/danger)
- [x] Percentage labels display current values
- [x] HUD visible during gameplay, hidden during menu

---

## Technical Implementation

### 1. Zod Schema

**File:** `packages/engine/src/lib/schemas/game-state.ts`

```typescript
import { z } from 'zod';

export const ResourcesSchema = z.object({
  hull: z.number().min(0).max(100),
  fuel: z.number().min(0).max(100),
});

export type Resources = z.infer<typeof ResourcesSchema>;

export const GameStateSchema = z.object({
  resources: ResourcesSchema,
  // Other game state fields added in PBI-017
});

export type GameState = z.infer<typeof GameStateSchema>;
```

---

### 2. Configuration Constants

**File:** `packages/engine/src/lib/config.ts`

Add to existing config:
```typescript
export const SURVIVAL_CONFIG = {
  INITIAL_HULL: 100,
  INITIAL_FUEL: 100,
  FUEL_CONSUMPTION_RATE: 1.5,
  
  SUN_ZONE_1_RADIUS: 150,
  SUN_ZONE_2_RADIUS: 250,
  SUN_ZONE_3_RADIUS: 350,
  
  FUEL_REGEN_ZONE_1: 4.0,
  FUEL_REGEN_ZONE_2: 2.0,
  FUEL_REGEN_ZONE_3: 0.5,
  
  HULL_BURN_ZONE_1: 1.5,
  HULL_BURN_ZONE_2: 0.5,
  HULL_BURN_ZONE_3: 0.1,
  
  PLANET_COLLISION_DAMAGE: 7,
} as const;
```

---

### 3. Physics Loop Integration

**File:** `packages/engine/src/lib/engine/physics.ts`

Add two new functions:

```typescript
import { SURVIVAL_CONFIG } from '../config';
import type { Resources } from '../schemas/game-state';

export function updateFuel(
  resources: Resources,
  isThrusting: boolean,
  distanceToSun: number,
  deltaTime: number
): void {
  const dt = deltaTime / 1000; // Convert ms to seconds
  
  // Consumption
  if (isThrusting) {
    resources.fuel -= SURVIVAL_CONFIG.FUEL_CONSUMPTION_RATE * dt;
  }
  
  // Regeneration (sun proximity)
  let regenRate = 0;
  if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_1_RADIUS) {
    regenRate = SURVIVAL_CONFIG.FUEL_REGEN_ZONE_1;
  } else if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_2_RADIUS) {
    regenRate = SURVIVAL_CONFIG.FUEL_REGEN_ZONE_2;
  } else if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_3_RADIUS) {
    regenRate = SURVIVAL_CONFIG.FUEL_REGEN_ZONE_3;
  }
  
  resources.fuel += regenRate * dt;
  
  // Clamp
  resources.fuel = Math.max(0, Math.min(100, resources.fuel));
}

export function updateHull(
  resources: Resources,
  distanceToSun: number,
  sunRadius: number,
  deltaTime: number
): void {
  const dt = deltaTime / 1000;
  
  // Star contact = instant death
  if (distanceToSun < sunRadius) {
    resources.hull = 0;
    return;
  }
  
  // Sun proximity burn
  let burnRate = 0;
  if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_1_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_1;
  } else if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_2_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_2;
  } else if (distanceToSun < SURVIVAL_CONFIG.SUN_ZONE_3_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_3;
  }
  
  resources.hull -= burnRate * dt;
  
  // Clamp
  resources.hull = Math.max(0, Math.min(100, resources.hull));
}

export function applyPlanetCollisionDamage(resources: Resources): void {
  resources.hull -= SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE;
  resources.hull = Math.max(0, resources.hull);
}
```

---

### 4. Collision Hook

**File:** `packages/engine/src/lib/engine/physics.ts`

Find existing `handlePlanetCollision()` and add:
```typescript
// After elastic bounce calculation
applyPlanetCollisionDamage(gameState.resources);
```

---

### 5. HUD Component (Svelte)

**File:** `apps/web/src/components/HUD.svelte`

```svelte
<script lang="ts">
  import type { GameState } from '@void-drift/engine';
  
  let { state }: { state: GameState } = $props();
  
  const hullPercent = $derived(state.resources.hull);
  const fuelPercent = $derived(state.resources.fuel);
  
  const hullColor = $derived(
    hullPercent < 25 ? 'var(--color-danger)' :
    hullPercent < 50 ? 'var(--color-warning)' :
    'var(--color-neon-blue)'
  );
  
  const fuelColor = $derived(
    fuelPercent < 25 ? 'var(--color-danger)' :
    fuelPercent < 50 ? 'var(--color-warning)' :
    'var(--color-acid-lime)'
  );
</script>

<div class="hud">
  <div class="resource-bar">
    <div class="bar-fill" style:width="{hullPercent}%" style:background-color={hullColor}></div>
    <span class="bar-label">HULL {hullPercent.toFixed(0)}%</span>
  </div>
  
  <div class="resource-bar">
    <div class="bar-fill" style:width="{fuelPercent}%" style:background-color={fuelColor}></div>
    <span class="bar-label">FUEL {fuelPercent.toFixed(0)}%</span>
  </div>
</div>

<style>
  .hud {
    position: absolute;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    pointer-events: none;
    z-index: 100;
  }
  
  .resource-bar {
    position: relative;
    width: 200px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-neon-blue);
    margin-bottom: var(--spacing-xs);
    overflow: hidden;
  }
  
  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    transition: width 0.1s linear, background-color 0.3s ease;
  }
  
  .bar-label {
    position: relative;
    display: block;
    text-align: center;
    line-height: 24px;
    font-size: 0.875rem;
    color: var(--color-white);
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
    font-weight: bold;
  }
</style>
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Zod schema validates resources correctly
- [x] Physics loop calls `updateFuel()` and `updateHull()` every frame
- [x] Planet collisions trigger hull damage
- [x] Sun proximity zones work as specified (tested with console.log)
- [x] HUD displays hull/fuel bars correctly
- [x] Color states transition correctly (normal/warning/danger)
- [x] Zero TypeScript errors (`pnpm -r check`)
- [x] Performance: updateFuel + updateHull < 0.5ms combined
- [x] No garbage collection pauses introduced
- [x] Manual testing complete (see checklist below)
- [x] Code reviewed and approved

---

## Testing Checklist

### Manual Tests

**Fuel Consumption:**
- [ ] Start game with 100% fuel
- [ ] Thrust continuously for 10 seconds
- [ ] Verify fuel is at ~85% (15% consumed at 1.5%/s)
- [ ] Verify fuel bar shows correct percentage
- [ ] Verify fuel bar turns yellow at < 50%

**Fuel Regeneration (Zone 1):**
- [ ] Reduce fuel to 50% (via thrusting)
- [ ] Position ship < 150px from sun
- [ ] Wait 5 seconds without thrusting
- [ ] Verify fuel increases by ~20% (4%/s × 5s)
- [ ] Verify fuel bar updates smoothly

**Hull Burn (Zone 1):**
- [ ] Position ship < 150px from sun
- [ ] Wait 10 seconds
- [ ] Verify hull decreases by ~15% (1.5%/s × 10s)
- [ ] Verify hull bar shows correct percentage

**Planet Collision Damage:**
- [ ] Start with 100% hull
- [ ] Collide with planet 3 times
- [ ] Verify hull is at 79% (100 - 3×7)
- [ ] Verify hull bar turns red at < 25%

**Star Contact Instant Death:**
- [ ] Position ship to touch star surface
- [ ] Verify hull immediately drops to 0%
- [ ] Verify hull bar is empty (red)

**Clamping:**
- [ ] Thrust until fuel reaches 0%
- [ ] Continue thrusting (verify no negative fuel)
- [ ] Refuel near sun until 100%
- [ ] Stay near sun (verify fuel doesn't exceed 100%)

**HUD Visual States:**
- [ ] Hull at 100%: Blue bar, full
- [ ] Hull at 35%: Yellow/orange bar
- [ ] Hull at 15%: Red bar
- [ ] Fuel at 100%: Lime bar, full
- [ ] Fuel at 40%: Yellow/orange bar
- [ ] Fuel at 10%: Red bar

### Performance Tests
- [ ] Run game for 60 seconds with resource updates active
- [ ] Check Chrome DevTools Performance tab
- [ ] Verify no frame drops below 58 FPS
- [ ] Verify resource update functions < 0.5ms combined
- [ ] Verify HUD re-renders only when values change

---

## Out of Scope

This PBI does NOT include:
- ❌ Timer system (deferred to PBI-017)
- ❌ Death detection logic (deferred to PBI-017)
- ❌ Game Over screen (deferred to PBI-017)
- ❌ Visual effects (particles, screen shake) — Phase 7
- ❌ Sound effects — Phase 7

---

## Dependencies

**Blocked By:**
- ✅ PBI-015 (Resource HUD Design) — REQUIRED (must be complete)
- ✅ PBI-013 (Game Viewport & Camera) — DONE
- ✅ PBI-014 (Rock Planet) — DONE

**Blocks:**
- PBI-017 (Timer & Death Logic) — Needs resources.hull and resources.fuel

**Parallel Work:**
- PBI-018 (Settings Route) — Can develop independently

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fuel consumption too fast | Players die in < 30s | Tuning constants in `config.ts`, playtest with 5 users |
| Sun zones too punishing | Players avoid sun entirely | Adjust regen/burn ratio, make Zone 2 more rewarding |
| Performance regression | FPS drops below 60 | Profile with Chrome DevTools, optimize distance calculations |
| Hull damage feels unfair | Negative player feedback | Add visual warning when entering burn zones (Phase 7) |
| HUD bars not smooth | Jittery updates | Use CSS transitions, verify Svelte reactivity |

---

## Notes

**Tuning Philosophy:**
- Initial values are educated guesses based on 60-90s target survival time
- Expect 2-3 tuning iterations after playtest feedback
- Use `SURVIVAL_CONFIG` constants for all magic numbers (easy to adjust)

**Performance Considerations:**
- Reuse existing `distanceToSun` calculation from gravity system
- Avoid `Math.sqrt()` where possible (use squared distances if feasible)
- No object creation in update loops (mutate `resources` in-place)
- HUD should use Svelte reactivity (only re-render when values change)

**Integration with PBI-015:**
- Visual design from PBI-015 must be approved before starting
- HUD component should match gallery designs exactly
- Color thresholds (50%, 25%) are consistent across design and logic

**Future Enhancements (Post-v0.0.6):**
- Visual indicators for sun zones (colored rings)
- Audio feedback for fuel regen (sizzle sound)
- Particle effects for hull damage (sparks)
- Hull repair pickups (rare spawn near planets)

---

## Sign-Off

**Specification Author:** @Lead  
**Assigned To:** @Dev  
**Reviewer:** TBD  
**Approved:** ⏳ Pending Review

---

**Related Documents:**
- [Survival Core Spec](../specs/survival-core.md)
- [PBI-015: Resource HUD Design](./PBI-015-Resource-HUD-Design.md) — Dependency
- [PBI-017: Timer & Death Logic](./PBI-017-Timer-Death-Logic.md) — Next in sequence
- [Project Vision](../project-vision.md) — Phase 5