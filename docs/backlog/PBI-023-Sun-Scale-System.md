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

| Class | Size (1-100) | Radius | Gravity | Power Regen | Hull Burn | Example |
|-------|--------------|--------|---------|-------------|-----------|---------|
| O | 90 - 100 | XL | XL | XL | XL | Alnitak |
| B | 75 - 89 | L | L | L | L | Rigel |
| A | 60 - 74 | M | M | M | M | Vega |
| F | 45 - 59 | S | S | S | S | Procyon |
| G | 30 - 44 | XS | XS | XS | XS | The Sun |
| K | 15 - 29 | XXS | XXS | XXS | XXS | Arcturus |
| M | 1 - 14 | Tiny | Tiny | Tiny | Tiny | Proxima Centauri |

**Risk/Reward:** Class O stars are massive, hot, and extremely dangerous, offering high-speed refueling at the cost of intense hull damage. Class M stars are small, cool, and relatively safe, but require much longer exposure to refuel.

---

## Acceptance Criteria

### Sun Type Definition
- [ ] Define `SunType` enum: `O`, `B`, `A`, `F`, `G`, `K`, `M`
- [ ] Define `SunConfig` interface with all scalable properties:
  - `size` - standard size rating (1-100)
  - `radius` - visual/collision size
  - `color` - primary color
  - `glowColor` - outer glow color
  - `mass` - affects gravity strength
  - `powerMultiplier` - scales power regen rates
  - `burnMultiplier` - scales hull burn rates
  - `pulseSpeed` - animation speed

### Sun Presets
- [ ] `O`: XL radius, XL gravity, XL power/burn multipliers
- [ ] `G`: Medium radius (baseline), baseline gravity/power/burn (1.0x)
- [ ] `M`: Tiny radius, Low gravity, Low power/burn multipliers

**Note:** Seven presets based on stellar classification (OBAFGKM).

### Game Integration
- [ ] Random sun type selected on game start (equal probability)
- [ ] Sun type displayed in HUD (small icon or text indicator)
- [ ] Power zone radii scale proportionally with sun radius
- [ ] All SURVIVAL_CONFIG zone values use multipliers from sun type

### Lab Integration
- [ ] Add sun type selector to `/lab` (dropdown or radio buttons)
- [ ] Preview all seven sun types with live rendering
- [ ] Canvas fills available space in the layout for better visualization
- [ ] Show current stats (radius, gravity, power, burn multipliers)
- [ ] Slider to smoothly interpolate between types (for tuning)

### Visual Updates
- [ ] `drawStar()` accepts full `SunConfig` for rendering
- [ ] Each sun type has distinct visual identity:
  - Class O: intense pulse, brilliant blue-white glow, huge size
  - Class G: medium pulse (baseline), yellow-orange glow
  - Class M: very slow pulse, deep red glow, compact size

---

## Technical Implementation

### Sun Type Schema

```typescript
// packages/core/src/lib/schemas/sun.ts
import { z } from 'zod';

export const SunTypeSchema = z.enum(['O', 'B', 'A', 'F', 'G', 'K', 'M']);
export type SunType = z.infer<typeof SunTypeSchema>;

export const SunConfigSchema = z.object({
  type: SunTypeSchema,
  size: z.number().int().min(1).max(100),
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
  O: {
    type: 'O',
    size: 100,
    radius: 105,
    color: '#00ffff',
    glowColor: '#ffffff',
    mass: 3000,
    powerMultiplier: 4.5,
    burnMultiplier: 6.5,
    pulseSpeed: 4.5,
  },
  G: {
    type: 'G',
    size: 40,
    radius: 35,
    color: '#ffaa00',
    glowColor: '#ffaa00',
    mass: 600,
    powerMultiplier: 1.0,  // Baseline
    burnMultiplier: 1.0,   // Baseline
    pulseSpeed: 1.0,       // Baseline
  },
  M: {
    type: 'M',
    size: 1,
    radius: 15,
    color: '#ff4400',
    glowColor: '#ff0000',
    mass: 150,
    powerMultiplier: 0.4,
    burnMultiplier: 0.3,
    pulseSpeed: 0.3,
  },
  // ... and others
} as const;
```

**Note:** Actual values are tunable and defined in config.ts, not specs.

### Random Selection

```typescript
// packages/mode-a/src/lib/game-loop.ts
import { SUN_CONFIG, type SunType } from '@void-drift/core';

export function getRandomSunType(): SunType {
  const types: SunType[] = ["O", "B", "A", "F", "G", "K", "M"];
  return types[Math.floor(Math.random() * types.length)];
}

export function createStar(type: SunType, x: number, y: number): Star {
  const config = SUN_CONFIG[type];
  return {
    ...config,
    pos: new Vec2(x, y),
    influenceRadius: config.radius * 9, // Tunable scaling
  };
}
```

### Physics Integration

```typescript
// packages/core/src/lib/physics/Physics.ts
export function updatePower(
  resources: Resources,
  distanceToSun: number,
  sun: Star,
  deltaTime: number,
  thrustState: { left: boolean; right: boolean }
): void {
  // Scale zone radii proportionally to sun radius
  const radiusScale = sun.radius / 40; // 40 = nominal baseline
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
  regenRate *= sun.powerMultiplier;
  
  // ... rest of power logic
}
```

### Updated drawStar

```typescript
// packages/core/src/lib/assets/star.ts
export interface DrawStarOptions {
    x: number;
    y: number;
    radius: number;
    color: string;
    glowColor: string;
    time: number;
    pulseSpeed?: number;
    powerZoneRadius?: number;
}

export function drawStar(ctx: CanvasRenderingContext2D, options: DrawStarOptions): void {
  const { x, y, radius, color, glowColor, time, pulseSpeed } = options;
  
  // Use config values for rendering
  // ... existing logic with color, pulseSpeed, etc.
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
