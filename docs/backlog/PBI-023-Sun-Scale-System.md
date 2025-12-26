# PBI-023: Sun Scale System

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 5 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.3

---

## User Story

**As a** player  
**I want** the sun to vary in size and type between games  
**So that** each run feels different and requires adapting my strategy

**As a** developer  
**I want** to preview sun scales in the lab  
**So that** I can tune the visual and gameplay parameters

---

## Context

Currently the sun has fixed properties:
- Fixed radius (~40px)
- Fixed color (orange #ffaa00)
- Fixed gravity strength
- Fixed power zone radii

This PBI introduces a **sun scale system** where the sun type affects gameplay:

| Type | Size | Gravity | Power Regen | Hull Burn | Color |
|------|------|---------|-------------|-----------|-------|
| Red Giant | Large | Low | Low | Low | Deep Red |
| Yellow Dwarf | Medium | Medium | Medium | Medium | Yellow/Orange |
| Blue Dwarf | Small | High | High | High | Blue/White |

**Risk/Reward:** Blue dwarfs are dangerous but efficient for refueling. Red giants are safer but require longer exposure.

---

## Acceptance Criteria

### Sun Type Definition
- [ ] Define `SunType` enum: `RED_GIANT`, `YELLOW_DWARF`, `BLUE_DWARF`
- [ ] Define `SunConfig` interface with all scalable properties:
  - `radius` - visual/collision size
  - `color` - primary color
  - `glowColor` - outer glow color
  - `mass` - affects gravity strength
  - `powerMultiplier` - scales power regen rates
  - `burnMultiplier` - scales hull burn rates
  - `pulseSpeed` - animation speed

### Sun Presets
- [ ] `RED_GIANT`: large radius, low gravity, low power multiplier, low burn multiplier, deep red
- [ ] `YELLOW_DWARF`: medium radius, baseline gravity (1.0x), baseline power (1.0x), baseline burn (1.0x), orange
- [ ] `BLUE_DWARF`: small radius, high gravity, high power multiplier, high burn multiplier, blue-white

**Note:** Exact values defined in `SUN_CONFIG`, tuned through playtesting.

### Game Integration
- [ ] Random sun type selected on game start (equal probability)
- [ ] Sun type displayed in HUD (small icon or text indicator)
- [ ] Power zone radii scale proportionally with sun radius
- [ ] All SURVIVAL_CONFIG zone values use multipliers from sun type

### Lab Integration
- [ ] Add sun type selector to `/lab` (dropdown or radio buttons)
- [ ] Preview all three sun types with live rendering
- [ ] Show current stats (radius, gravity, power, burn multipliers)
- [ ] Slider to smoothly interpolate between types (for tuning)

### Visual Updates
- [ ] `drawStar()` accepts full `SunConfig` for rendering
- [ ] Each sun type has distinct visual identity:
  - Red Giant: slow pulse, large soft glow
  - Yellow Dwarf: medium pulse (current behavior)
  - Blue Dwarf: fast pulse, intense compact glow

---

## Technical Implementation

### Sun Type Schema

```typescript
// packages/core/src/lib/schemas/sun.ts
import { z } from 'zod';

export const SunTypeSchema = z.enum(['RED_GIANT', 'YELLOW_DWARF', 'BLUE_DWARF']);
export type SunType = z.infer<typeof SunTypeSchema>;

export const SunConfigSchema = z.object({
  type: SunTypeSchema,
  radius: z.number().positive(),
  color: z.string(),
  glowColor: z.string(),
  mass: z.number().positive(),
  powerMultiplier: z.number().positive(),
  burnMultiplier: z.number().positive(),
  pulseSpeed: z.number().positive(),
});
export type SunConfig = z.infer<typeof SunConfigSchema>;
```

### Sun Config Structure

```typescript
// packages/core/src/lib/config.ts
export const SUN_CONFIG: Record<SunType, SunTypeConfig> = {
  RED_GIANT: {
    type: 'RED_GIANT',
    radius: /* large, tunable */,
    color: /* deep red hex */,
    glowColor: /* red glow hex */,
    mass: /* low gravity */,
    powerMultiplier: /* < 1.0 */,
    burnMultiplier: /* < 1.0 */,
    pulseSpeed: /* slow */,
  },
  YELLOW_DWARF: {
    type: 'YELLOW_DWARF',
    radius: /* medium, baseline */,
    color: /* orange hex */,
    glowColor: /* orange glow hex */,
    mass: /* baseline gravity */,
    powerMultiplier: 1.0,  // Baseline
    burnMultiplier: 1.0,   // Baseline
    pulseSpeed: 1.0,       // Baseline
  },
  BLUE_DWARF: {
    type: 'BLUE_DWARF',
    radius: /* small, tunable */,
    color: /* blue-white hex */,
    glowColor: /* blue glow hex */,
    mass: /* high gravity */,
    powerMultiplier: /* > 1.0 */,
    burnMultiplier: /* > 1.0 */,
    pulseSpeed: /* fast */,
  },
} as const;
```

**Note:** Actual values are tunable and defined in config.ts, not specs.

### Random Selection

```typescript
// packages/mode-a/src/lib/game-loop.ts
import { SUN_PRESETS, type SunType } from '@void-drift/core';

export function getRandomSunType(): SunType {
  const types: SunType[] = ['RED_GIANT', 'YELLOW_DWARF', 'BLUE_DWARF'];
  return types[Math.floor(Math.random() * types.length)];
}

export function createStar(sunType: SunType) {
  const config = SUN_PRESETS[sunType];
  return {
    ...config,
    x: ARENA_CENTER_X,
    y: ARENA_CENTER_Y,
    influenceRadius: config.radius * 8, // Gravity influence scales with size
  };
}
```

### Physics Integration

```typescript
// packages/mode-a/src/lib/physics.ts
export function updatePower(
  resources: Resources,
  distanceToSun: number,
  sunConfig: SunConfig,
  deltaTime: number,
  thrustState: { left: boolean; right: boolean }
): void {
  // Scale zone radii proportionally to sun radius
  const radiusScale = sunConfig.radius / 40; // 40 = baseline (yellow dwarf)
  const zone1 = SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * radiusScale;
  const zone2 = SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS * radiusScale;
  const zone3 = SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * radiusScale;
  
  let regenRate = 0;
  if (distanceToSun < zone1) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_1;
  } else if (distanceToSun < zone2) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_2;
  } else if (distanceToSun < zone3) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_3;
  }
  
  // Apply sun type multiplier
  regenRate *= sunConfig.powerMultiplier;
  
  // ... rest of power logic
}
```

### Updated drawStar

```typescript
// packages/core/src/lib/assets/star.ts
export interface DrawStarOptions {
  x: number;
  y: number;
  config: SunConfig;
  time: number;
  powerZoneRadius?: number;
}

export function drawStar(ctx: CanvasRenderingContext2D, options: DrawStarOptions): void {
  const { x, y, config, time, powerZoneRadius } = options;
  const { radius, color, pulseSpeed } = config;
  
  // Use config values for rendering
  // ... existing logic with config.color, config.pulseSpeed, etc.
}
```

---

## Definition of Done

- [ ] `SunType` and `SunConfig` schemas defined in core
- [ ] Three sun presets with distinct visual/gameplay properties
- [ ] Random sun selection on game start
- [ ] Power/burn calculations use sun multipliers
- [ ] Zone radii scale with sun size
- [ ] Lab page allows previewing all sun types
- [ ] HUD indicates current sun type
- [ ] Zero TypeScript errors (`pnpm -r check`)
- [ ] Game feels different with each sun type

---

## Testing Checklist

### Gameplay Balance
- [ ] Red Giant: Easier to approach, slower refuel
- [ ] Yellow Dwarf: Balanced (current feel)
- [ ] Blue Dwarf: Dangerous but fast refuel
- [ ] All three death causes still possible with each sun type

### Visual
- [ ] Red Giant: Large, slow pulse, red/orange glow
- [ ] Yellow Dwarf: Medium (current look)
- [ ] Blue Dwarf: Small, fast pulse, blue-white glow
- [ ] Power zone circle scales correctly

### Lab
- [ ] Can select each sun type
- [ ] Preview renders correctly
- [ ] Stats display shows multipliers

---

## Out of Scope

- Binary star systems
- Dynamic sun changes mid-game
- Sun type selection by player
- Weighted probability (favor balanced types)

---

## Related Documents

- [Star Mechanics Spec](../specs/star_mechanics.md)
- [Survival Core Spec](../specs/survival-core.md)
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
