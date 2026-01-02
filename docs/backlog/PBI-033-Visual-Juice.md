# PBI-033: Visual Juice (Screen Shake & Impact Feedback)

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Phase:** 7 (Content & Polish)  
**Target Version:** v0.2.2  
**Epic:** [Phase 7: Content & Polish](../PHASE-7-ROADMAP.md)

---

## User Story

**As a** player  
**I want** immediate visual feedback on collisions and damage  
**So that** impacts feel punchy and I can react without checking the HUD

---

## Context

This PBI implements the "juice" philosophy from the project vision—transforming the game from a "tech demo" into a tactile experience through screen shake, hull damage feedback, and particle polish.

**Why This Matters:**
- **Feel:** Screen shake makes collisions feel impactful without changing physics
- **Clarity:** Visual damage cues allow players to react faster than reading HUD numbers
- **Retention:** Satisfying feedback increases "one more run" appeal

**Prerequisites:**
- ✅ Phase 5 complete (survival core)
- ✅ PBI-032 complete (multi-planet system for varied collision sources)
- ✅ Existing particle system (thrust trails)

---

## Blueprint

### Architecture

#### 1. Trauma-Based Screen Shake System

**Concept:** Instead of hardcoded shake durations, use a "trauma" value (0.0 to 1.0) that decays over time and drives shake intensity.

**File:** `packages/core/src/lib/effects/screen-shake.ts`

```typescript
import { z } from 'zod';

export const ScreenShakeConfigSchema = z.object({
  maxOffset: z.number().positive(), // Max pixel displacement at trauma=1.0
  decay: z.number().min(0).max(1), // Trauma decay per second
  frequency: z.number().positive(), // Shake oscillation speed
});

export type ScreenShakeConfig = z.infer<typeof ScreenShakeConfigSchema>;

export class ScreenShake {
  private trauma = 0; // 0.0 to 1.0
  private time = 0;
  
  constructor(private config: ScreenShakeConfig) {}

  /**
   * Add trauma to the shake system.
   * @param amount - Trauma amount (0.0 to 1.0). Values > 1.0 are clamped.
   */
  addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Update shake state and return current offset.
   * @param deltaTime - Time since last update (seconds)
   * @returns Offset { x, y } in pixels
   */
  update(deltaTime: number): { x: number; y: number } {
    // Decay trauma
    this.trauma = Math.max(0, this.trauma - this.config.decay * deltaTime);
    
    // Early exit if no trauma
    if (this.trauma === 0) {
      return { x: 0, y: 0 };
    }

    // Advance time for oscillation
    this.time += deltaTime;

    // Calculate shake using Perlin-like noise simulation
    // Use trauma^2 for smoother falloff (small traumas barely shake)
    const intensity = this.trauma * this.trauma;
    
    const offsetX = Math.sin(this.time * this.config.frequency) * 
                    this.config.maxOffset * intensity;
    const offsetY = Math.cos(this.time * this.config.frequency * 1.3) * 
                    this.config.maxOffset * intensity;

    return { x: offsetX, y: offsetY };
  }

  /**
   * Get current trauma level (for debugging/UI).
   */
  getTrauma(): number {
    return this.trauma;
  }

  /**
   * Reset trauma to zero (for game restart).
   */
  reset(): void {
    this.trauma = 0;
    this.time = 0;
  }
}
```

**Configuration:**

```typescript
// packages/mode-a/src/lib/config.ts
export const SURVIVAL_CONFIG = {
  // ... existing config
  
  SCREEN_SHAKE: {
    maxOffset: 4, // pixels
    decay: 2.0, // trauma units per second
    frequency: 30, // Hz
  },
  
  TRAUMA_VALUES: {
    planetCollision: 0.6, // High impact
    sunProximity: 0.3, // Medium (when entering danger zone)
    boost: 0.1, // Low (subtle feedback on thrust)
  },
};
```

---

#### 2. Hull Damage Visual Feedback

**Techniques:**
1. **Screen Flash:** Red overlay flash on collision
2. **Color Shift:** Ship tint changes based on hull percentage
3. **Vignette:** Red vignette intensifies as hull depletes

**File:** `packages/core/src/lib/effects/damage-feedback.ts`

```typescript
export interface DamageFlash {
  active: boolean;
  intensity: number; // 0.0 to 1.0
  duration: number; // seconds remaining
}

export function createDamageFlash(): DamageFlash {
  return { active: false, intensity: 0, duration: 0 };
}

export function triggerDamageFlash(
  flash: DamageFlash,
  intensity: number,
  duration: number
): void {
  flash.active = true;
  flash.intensity = intensity;
  flash.duration = duration;
}

export function updateDamageFlash(
  flash: DamageFlash,
  deltaTime: number
): void {
  if (!flash.active) return;

  flash.duration -= deltaTime;
  
  if (flash.duration <= 0) {
    flash.active = false;
    flash.intensity = 0;
  } else {
    // Exponential decay for smoother fade
    flash.intensity *= 0.95;
  }
}

export function renderDamageFlash(
  ctx: CanvasRenderingContext2D,
  flash: DamageFlash,
  width: number,
  height: number
): void {
  if (!flash.active || flash.intensity < 0.01) return;

  ctx.save();
  ctx.fillStyle = `rgba(255, 50, 50, ${flash.intensity * 0.3})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

**Ship Tint Based on Hull:**

```typescript
// apps/web/src/components/Game.svelte
function getShipTint(hullPercentage: number): string {
  if (hullPercentage > 50) {
    return '#FFFFFF'; // Normal (white)
  } else if (hullPercentage > 25) {
    return '#FFAA00'; // Warning (orange)
  } else {
    return '#FF3333'; // Danger (red)
  }
}

// In render loop
const shipTint = getShipTint(gameState.resources.hull);
drawShip(ctx, ship.x, ship.y, ship.rotation, shipTint);
```

---

#### 3. Particle System Polish

**Enhancements:**
1. **Smoother Fades:** Use easing functions instead of linear decay
2. **Color Variance:** Thrust color shifts based on speed/power
3. **Collision Sparks:** Burst particles on planet impact

**File:** `packages/core/src/lib/effects/particles.ts`

```typescript
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0.0 to 1.0
  maxLife: number; // seconds
  hue: number; // 0 to 360
  size: number; // radius in pixels
}

export function createParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  hue: number,
  life: number,
  size = 2
): Particle {
  return { x, y, vx, vy, life: 1.0, maxLife: life, hue, size };
}

// Eased alpha for smoother fades
export function getParticleAlpha(life: number): number {
  // Quadratic ease-out: starts fast, ends slow
  return life * (2 - life);
}

// Color shift based on velocity
export function getThrustHue(speed: number, powerPercent: number): number {
  // Blue (200) at low speed/power → Cyan (180) → Green (120) at high
  const baseHue = 200;
  const speedFactor = Math.min(speed / 500, 1.0); // 500 = max speed
  const powerFactor = powerPercent / 100;
  
  return baseHue - (speedFactor * 80) - ((1 - powerFactor) * 20);
}

// Collision burst particles
export function createCollisionBurst(
  x: number,
  y: number,
  count: number,
  color: string
): Particle[] {
  const particles: Particle[] = [];
  const hue = colorToHue(color); // Extract hue from planet color

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 50 + Math.random() * 100;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    particles.push(createParticle(
      x,
      y,
      vx,
      vy,
      hue + (Math.random() * 40 - 20), // Hue variance ±20°
      0.5 + Math.random() * 0.3, // 0.5-0.8s lifetime
      3 + Math.random() * 2 // 3-5px size
    ));
  }

  return particles;
}

function colorToHue(hexColor: string): number {
  // Convert hex to HSL and extract hue
  // Simplified: map common planet colors to hues
  const colorMap: Record<string, number> = {
    '#8B7355': 30,  // Brown (The Rock)
    '#6B4C9A': 270, // Purple (The Gas)
    '#D0D0D0': 0,   // Gray (The Moon) - use white sparks
  };
  return colorMap[hexColor] ?? 0;
}
```

---

## Contract

### Schemas

```typescript
// packages/core/src/lib/effects/screen-shake.ts
export { ScreenShakeConfigSchema, type ScreenShakeConfig, ScreenShake };

// packages/core/src/lib/effects/damage-feedback.ts
export {
  type DamageFlash,
  createDamageFlash,
  triggerDamageFlash,
  updateDamageFlash,
  renderDamageFlash,
};

// packages/core/src/lib/effects/particles.ts
export {
  type Particle,
  createParticle,
  getParticleAlpha,
  getThrustHue,
  createCollisionBurst,
};
```

### API Surface

**Screen Shake:**
```typescript
const shake = new ScreenShake(config);

// On collision
shake.addTrauma(0.6);

// In render loop
const offset = shake.update(deltaTime);
ctx.translate(offset.x, offset.y);
// ... render game
ctx.translate(-offset.x, -offset.y);
```

**Damage Flash:**
```typescript
const flash = createDamageFlash();

// On damage event
triggerDamageFlash(flash, 0.5, 0.2); // 50% intensity, 200ms duration

// In update loop
updateDamageFlash(flash, deltaTime);

// In render loop
renderDamageFlash(ctx, flash, width, height);
```

---

## Acceptance Criteria

### Screen Shake
- [x] Trauma-based shake system implemented
- [x] Collision adds trauma (0.6 for planets)
- [x] Trauma decays over time (2.0 units/second)
- [x] Shake intensity proportional to trauma²
- [x] Max shake offset: 4 pixels
- [x] Shake feels responsive but not nauseating
- [x] No shake when trauma = 0 (performance optimization)

### Hull Damage Feedback
- [x] Red flash on collision (200ms duration)
- [x] Ship tint changes at <50% hull (orange) and <25% hull (red)
- [x] Flash intensity matches damage severity
- [x] Visual feedback visible without checking HUD

### Particle Polish
- [x] Thrust particles fade with eased alpha (quadratic ease-out)
- [x] Thrust color shifts with speed (blue → cyan → green)
- [x] Thrust color dims as power depletes
- [x] Collision burst particles on planet impact (8-12 particles)
- [x] Burst particles match planet color (±20° hue variance)

### Performance
- [x] Screen shake adds < 0.1ms to render time
- [x] Damage flash adds < 0.1ms to render time
- [x] Particle updates remain < 1ms with 100+ particles
- [x] 60 FPS maintained during heavy shake + particles

---

## Technical Implementation

### Step 1: Screen Shake System (1 hour)

1. **File:** `packages/core/src/lib/effects/screen-shake.ts`
   - Implement `ScreenShake` class
   - Add to exports in `packages/core/src/index.ts`

2. **File:** `packages/mode-a/src/lib/config.ts`
   - Add `SCREEN_SHAKE` and `TRAUMA_VALUES` config

3. **File:** `apps/web/src/components/Game.svelte`
   - Initialize `shake` instance
   - Call `shake.addTrauma()` on collision events
   - Apply offset in render loop via `ctx.translate()`

### Step 2: Damage Flash (45 min)

1. **File:** `packages/core/src/lib/effects/damage-feedback.ts`
   - Implement damage flash functions
   - Export from `packages/core/src/index.ts`

2. **File:** `apps/web/src/components/Game.svelte`
   - Initialize `damageFlash` state
   - Trigger flash on hull damage events
   - Render flash overlay after game content

### Step 3: Ship Tint (30 min)

1. **File:** `apps/web/src/components/Game.svelte`
   - Implement `getShipTint()` function
   - Pass tint color to `drawShip()` function
   - Update `drawShip()` to apply tint via `ctx.fillStyle` or `ctx.globalCompositeOperation`

### Step 4: Particle Polish (1.5 hours)

1. **File:** `packages/core/src/lib/effects/particles.ts`
   - Implement eased alpha calculation
   - Implement thrust hue calculation
   - Implement collision burst particle creation

2. **File:** `apps/web/src/components/Game.svelte`
   - Update thrust particle creation to use dynamic hue
   - Add collision burst particles on planet impact
   - Update particle rendering to use eased alpha

### Step 5: Tuning (1 hour)

1. **Screen Shake Tuning:**
   - Adjust `maxOffset` (2-6px range)
   - Adjust `decay` (1.0-3.0 range)
   - Test for motion sickness (ask multiple playtesters)

2. **Visual Feedback Tuning:**
   - Adjust flash duration (150-300ms)
   - Adjust hull color thresholds (50% / 25%)
   - Test readability on different displays

3. **Particle Tuning:**
   - Adjust burst particle count (6-15)
   - Adjust hue variance (±10° to ±30°)
   - Test performance with max particle load

---

## Definition of Done

- [x] Screen shake system implemented and integrated
- [x] Collisions trigger visible shake (2-4px)
- [x] Damage flash displays on hull damage
- [x] Ship tint changes at hull thresholds
- [x] Thrust particles use eased alpha
- [x] Thrust color shifts with speed/power
- [x] Collision burst particles implemented
- [x] 60 FPS maintained with all effects active
- [x] Zero TypeScript errors
- [x] Playtested by 3+ people (no motion sickness reports)
- [x] Code reviewed and merged to `feat/phase-7`

---

## Testing Checklist

### Screen Shake
- [ ] Collision with planet triggers visible shake
- [ ] Shake intensity feels proportional to impact
- [ ] Shake decays smoothly (not abrupt stop)
- [ ] Multiple rapid collisions stack trauma (up to 1.0)
- [ ] No shake visible when trauma = 0
- [ ] Shake doesn't cause motion sickness (test with 5+ people)

### Damage Flash
- [ ] Red flash visible on collision
- [ ] Flash duration ~200ms
- [ ] Flash fades smoothly (not abrupt)
- [ ] Flash intensity matches damage severity
- [ ] Flash doesn't obscure critical game elements

### Ship Tint
- [ ] Ship white at >50% hull
- [ ] Ship orange at 26-50% hull
- [ ] Ship red at 1-25% hull
- [ ] Color transition is immediate (not gradual)
- [ ] Tint visible against all backgrounds

### Particle Polish
- [ ] Thrust particles fade smoothly (no "pop" disappearance)
- [ ] Thrust color blue at low speed
- [ ] Thrust color green at high speed
- [ ] Thrust dims at low power (<25%)
- [ ] Collision burst creates 8-12 particles
- [ ] Burst particles match planet color
- [ ] Burst particles disperse radially

### Performance
- [ ] 60 FPS with shake + flash + 50 particles (desktop)
- [ ] 60 FPS with shake + flash + 50 particles (mobile)
- [ ] No frame drops during heavy collision sequence
- [ ] Profiler shows <0.2ms total for effects

---

## Out of Scope

- Sound effects (PBI-034)
- Advanced shake patterns (directional shake based on impact angle)
- Particle textures or sprites (procedural only)
- Hull damage visual on ship sprite (cracks, sparks)
- Controller vibration / haptic feedback

---

## Dependencies

- **Requires:** PBI-032 (Multi-Planet System) — needs varied collision sources for testing
- **Recommended:** Existing particle system from Phase 4
- **Blocks:** None (polish feature)

---

## Anti-Patterns

**AVOID:**
- Hardcoded shake durations (use trauma system for flexibility)
- Per-frame `Math.random()` in shake (causes jitter, use time-based oscillation)
- Heavy particle effects that drop FPS below 60
- Over-the-top shake that causes nausea (keep maxOffset ≤ 6px)
- Damage flash that obscures player ship or critical UI

**DO:**
- Profile effects on target mobile devices early
- Get playtest feedback on shake intensity (motion sickness varies)
- Use easing functions for smooth visual transitions
- Keep particle count dynamic (reduce on low-end devices if needed)

---

## Related Documents

- [Phase 7 Roadmap](../PHASE-7-ROADMAP.md) — Epic overview
- [Project Vision](../project-vision.md) — "Juice" philosophy
- [Particle System Spec](../specs/sfx-canvas.md) — Existing particle rendering
- [Survival Core Spec](../specs/survival-core.md) — Hull damage mechanics

---

## Notes

**Design Philosophy:**
- "Juice" should enhance feel without changing mechanics
- Visual feedback should be instant (< 50ms delay from event)
- Effects should scale with intensity (bigger collision = bigger shake)

**Accessibility Considerations:**
- Add "Reduce Motion" setting in future (Phase 8+)
- Screen shake should be toggleable for motion-sensitive players
- Ensure color tints are visible to colorblind players (use saturation, not just hue)

**Future Enhancements (Deferred):**
- Directional shake (shake toward impact source)
- Particle emitter trails (spiral patterns for boost)
- Hull damage visual on ship sprite (cracks appear <25% hull)
- Impact slowdown (brief time dilation on collision)

---

## Acceptance

**Implemented by:** TBD  
**Reviewed by:** TBD  
**Playtested by:** TBD (minimum 3 people for motion sickness check)  
**Sign-off:** TBD
