# PBI-015: Resource HUD Design System

**Status:** DONE  
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Phase:** 5 (Survival Core - Design)  
**Target Version:** v0.0.5

---

## User Story

**As a** designer/developer  
**I want** visual designs for resource bars, warning states, and death iconography  
**So that** I can iterate on the visual language before implementing game logic

---

## Context

This is the first PBI for Phase 5 (Survival Core). Before implementing resource tracking logic, we must establish the visual design system for HUD elements in the gallery workbench.

**Design-First Approach:**
- Design and iterate in `/gallery` (isolated environment)
- Get visual feedback without game logic
- Establish component API contracts
- Then integrate into game (PBI-016)

**Dependencies:**
- ✅ Phase 4 complete (Design System tokens exist)
- ✅ Gallery workbench functional at `/gallery`
- ❌ PBI-016 (Resource Logic) — Blocked until this is complete
- ✅ PBI-019 (Lab Refactor) — This PBI blocks PBI-015 (we need the /lab structure first)

---

## Acceptance Criteria

### Resource Bars (Hull & Fuel)

- [x] Two bar designs created: Hull (blue theme) and Fuel (lime theme)
- [x] Bar states designed:
  - 100-50%: Normal (full color)
  - 49-25%: Warning (yellow/orange color)
  - 24-0%: Danger (red color with pulsing)
- [x] Bar fill animates smoothly (CSS transition)
- [x] Label overlays percentage text (e.g., "HULL 82%")
- [x] Label remains readable on all fill levels (text shadow)
- [x] Bar dimensions: ~200px width × 24px height (mobile-friendly)

### Warning Visual States

- [x] Color progression defined:
  - Normal: `--color-neon-blue` (hull), `--color-acid-lime` (fuel)
  - Warning: `--color-warning` (new token if needed)
  - Danger: `--color-danger`
- [x] Pulsing animation for danger state (< 25%)
- [x] Optional: Low resource sound trigger point defined (for Phase 7)

### Death Cause Iconography

- [x] Three death icons designed (16×16px or 24×24px):
  - `STAR` — Sun/star symbol (☀ or custom)
  - `HULL` — Crack/damage symbol (⚠ or shield with crack)
  - `FUEL` — Empty tank/droplet (🪫 or gas pump)
- [x] Icons rendered in `/gallery` with labels
- [x] Icons use Design System colors
- [x] Icons work at small sizes (readable on mobile)

### Timer Display Design

- [x] Timer format defined: `XXX.Xs` (e.g., "142.3s")
- [x] Font styling: Monospace/tabular-nums to prevent layout shift
- [x] Size: Large enough to read during gameplay (~1.25rem)
- [x] Color: White with dark shadow for readability
- [x] Position mockup: Top-right of HUD

### Gallery/Lab Integration

- [x] New lab route: `/lab/resources`
- [x] All components rendered in isolation with controls:
  - Hull bar with slider (0-100%)
  - Fuel bar with slider (0-100%)
  - Death icons (all three displayed)
  - Timer display (static examples: 0.0s, 42.3s, 142.3s)
- [x] Components exported as reusable functions
- [x] No game logic—pure visual rendering

---

## Technical Implementation

### 1. Resource Bar Component Design

**File:** `packages/engine/src/lib/assets/resource-bar.ts`

```typescript
export interface ResourceBarProps {
  value: number;        // 0-100
  maxValue: number;     // Usually 100
  label: string;        // "HULL" or "FUEL"
  colorNormal: string;  // CSS color for 50-100%
  colorWarning: string; // CSS color for 25-49%
  colorDanger: string;  // CSS color for 0-24%
}

/**
 * Draw a resource bar on canvas
 * For use in gallery/workbench only (Svelte version for game HUD)
 */
export function drawResourceBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  props: ResourceBarProps
): void {
  const percentage = (props.value / props.maxValue) * 100;
  
  // Determine color based on percentage
  let fillColor = props.colorNormal;
  if (percentage < 25) {
    fillColor = props.colorDanger;
  } else if (percentage < 50) {
    fillColor = props.colorWarning;
  }
  
  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x, y, width, height);
  
  // Border
  ctx.strokeStyle = props.colorNormal;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Fill
  const fillWidth = (props.value / props.maxValue) * width;
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, fillWidth, height);
  
  // Label text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Text shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  
  const text = `${props.label} ${Math.round(percentage)}%`;
  ctx.fillText(text, x + width / 2, y + height / 2);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}
```

---

### 2. Death Icon Designs

**File:** `packages/engine/src/lib/assets/death-icons.ts`

```typescript
export type DeathCause = 'STAR' | 'HULL' | 'FUEL';

/**
 * Draw death cause icon (for leaderboard/Game Over screen)
 */
export function drawDeathIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cause: DeathCause
): void {
  ctx.save();
  ctx.translate(x, y);
  
  switch (cause) {
    case 'STAR':
      // Draw star/sun icon (8-pointed star)
      drawStarIcon(ctx, size);
      break;
    case 'HULL':
      // Draw cracked shield icon
      drawHullIcon(ctx, size);
      break;
    case 'FUEL':
      // Draw empty droplet/tank icon
      drawFuelIcon(ctx, size);
      break;
  }
  
  ctx.restore();
}

function drawStarIcon(ctx: CanvasRenderingContext2D, size: number): void {
  const points = 8;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.5;
  
  ctx.fillStyle = '#ffaa00'; // Warning color
  ctx.beginPath();
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  ctx.fill();
}

function drawHullIcon(ctx: CanvasRenderingContext2D, size: number): void {
  const halfSize = size / 2;
  
  // Shield outline
  ctx.strokeStyle = '#ff0064'; // Danger color
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(halfSize, 0);
  ctx.lineTo(0, halfSize);
  ctx.lineTo(-halfSize, 0);
  ctx.closePath();
  ctx.stroke();
  
  // Crack through shield
  ctx.strokeStyle = '#ff0064';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfSize * 0.7, -halfSize * 0.3);
  ctx.lineTo(0, 0);
  ctx.lineTo(halfSize * 0.7, halfSize * 0.3);
  ctx.stroke();
}

function drawFuelIcon(ctx: CanvasRenderingContext2D, size: number): void {
  const halfSize = size / 2;
  
  // Droplet shape
  ctx.fillStyle = '#00c8ff'; // Neon blue
  ctx.beginPath();
  ctx.arc(0, halfSize * 0.2, halfSize * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  // Top point of droplet
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(-halfSize * 0.3, halfSize * 0.2);
  ctx.lineTo(halfSize * 0.3, halfSize * 0.2);
  ctx.closePath();
  ctx.fill();
  
  // Empty indicator (X through droplet)
  ctx.strokeStyle = '#ff0064';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfSize * 0.5, -halfSize * 0.5);
  ctx.lineTo(halfSize * 0.5, halfSize * 0.5);
  ctx.moveTo(halfSize * 0.5, -halfSize * 0.5);
  ctx.lineTo(-halfSize * 0.5, halfSize * 0.5);
  ctx.stroke();
}
```

---

### 3. Gallery Integration

**File:** `apps/web/src/components/Gallery.svelte`

Add new section to existing gallery:

```svelte
<section id="hud-elements">
  <h2>HUD Elements</h2>
  
  <div class="demo-grid">
    <!-- Hull Bar States -->
    <div class="demo-item">
      <h3>Hull Bar (100%)</h3>
      <canvas id="hull-bar-full" width="220" height="40"></canvas>
      <input type="range" min="0" max="100" value="100" 
             oninput={updateHullBar} />
    </div>
    
    <div class="demo-item">
      <h3>Hull Bar (35% - Warning)</h3>
      <canvas id="hull-bar-warning" width="220" height="40"></canvas>
    </div>
    
    <div class="demo-item">
      <h3>Hull Bar (15% - Danger)</h3>
      <canvas id="hull-bar-danger" width="220" height="40"></canvas>
    </div>
    
    <!-- Fuel Bar States -->
    <div class="demo-item">
      <h3>Fuel Bar (100%)</h3>
      <canvas id="fuel-bar-full" width="220" height="40"></canvas>
    </div>
    
    <div class="demo-item">
      <h3>Fuel Bar (40% - Warning)</h3>
      <canvas id="fuel-bar-warning" width="220" height="40"></canvas>
    </div>
    
    <div class="demo-item">
      <h3>Fuel Bar (10% - Danger)</h3>
      <canvas id="fuel-bar-danger" width="220" height="40"></canvas>
    </div>
    
    <!-- Death Icons -->
    <div class="demo-item">
      <h3>Death Icons</h3>
      <canvas id="death-icons" width="200" height="80"></canvas>
      <p>STAR | HULL | FUEL</p>
    </div>
    
    <!-- Timer Display -->
    <div class="demo-item">
      <h3>Timer Display</h3>
      <div class="timer-examples">
        <span class="timer">0.0s</span>
        <span class="timer">42.3s</span>
        <span class="timer">142.3s</span>
      </div>
    </div>
  </div>
</section>

<style>
  .timer-examples {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    margin-top: var(--spacing-sm);
  }
  
  .timer {
    font-size: 1.25rem;
    color: var(--color-white);
    font-variant-numeric: tabular-nums;
    font-family: monospace;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-neon-blue);
    border-radius: 4px;
  }
</style>
```

---

### 4. Design Tokens Update

**File:** `apps/web/src/styles.css`

Add new color tokens if needed:

```css
:root {
  /* Existing tokens... */
  
  /* Resource state colors */
  --color-resource-normal: var(--color-neon-blue);
  --color-resource-warning: #ffaa00;  /* Orange/yellow */
  --color-resource-danger: var(--color-danger);
  
  /* Optional: HUD specific */
  --hud-bar-height: 24px;
  --hud-bar-width: 200px;
  --hud-border-width: 1px;
}
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Resource bars render in `/gallery` with slider controls
- [ ] Three color states visible (normal/warning/danger)
- [ ] Death icons render in `/gallery` (all three causes)
- [ ] Timer display examples in `/gallery`
- [ ] All components use Design System tokens (no hardcoded colors)
- [ ] Components exported as reusable functions
- [ ] Zero TypeScript errors (`pnpm -r check`)
- [ ] Gallery page builds without errors
- [ ] Visual review approved by @Designer
- [ ] Mobile tested (readable at 320px width)

---

## Testing Checklist

### Visual Review (Gallery)

**Resource Bars:**
- [ ] Hull bar displays with blue theme at 100%
- [ ] Hull bar turns yellow/orange at 35%
- [ ] Hull bar turns red at 15%
- [ ] Fuel bar displays with lime theme at 100%
- [ ] Fuel bar turns yellow/orange at 40%
- [ ] Fuel bar turns red at 10%
- [ ] Slider controls update bar fill smoothly
- [ ] Percentage label remains readable on all fill levels
- [ ] Text shadow makes label readable over fill color

**Death Icons:**
- [ ] STAR icon is recognizable at 16px and 24px
- [ ] HULL icon is recognizable at 16px and 24px
- [ ] FUEL icon is recognizable at 16px and 24px
- [ ] Icons render clearly on dark background
- [ ] Icons use appropriate colors from Design System

**Timer Display:**
- [ ] Numbers don't shift horizontally (tabular-nums working)
- [ ] Text is readable during rapid updates (test in game later)
- [ ] Text shadow provides contrast on any background
- [ ] Format is clear: `142.3s` not `2:22.3` or `142.345s`

### Design System Compliance

- [ ] All colors use CSS variables (no hex codes in components)
- [ ] All spacing uses spacing tokens
- [ ] Font sizes use typography tokens
- [ ] Borders use consistent width/style
- [ ] Animations use consistent timing (0.1s-0.3s)

### Cross-Browser (Gallery Only)

- [ ] Chrome: All elements render correctly
- [ ] Firefox: Canvas rendering works
- [ ] Safari: No font/color issues

---

## Out of Scope

This PBI does NOT include:
- ❌ Actual hull/fuel tracking logic (PBI-016)
- ❌ Integration with game HUD (PBI-016)
- ❌ Sound effects for warnings (Phase 7)
- ❌ Pulsing/flashing animations (nice-to-have, defer if time)
- ❌ Death screen layout (PBI-017)

---

## Dependencies

**Blocked By:**
- ✅ Phase 4 (Design System tokens exist)
- ✅ Gallery workbench functional

**Blocks:**
- PBI-016 (Resource Logic & HUD Integration)
- PBI-017 (Game Over screen needs death icons)

**Parallel Work:**
- Can design while other systems are in progress (independent)

---

## Design Decisions

### Bar Fill Direction
- Left-to-right (standard convention)
- Fill color overlays background
- Smooth transition on value change (CSS or lerp in canvas)

### Warning Thresholds
- < 50%: Warning (gives player time to react)
- < 25%: Danger (critical state, needs immediate action)
- Thresholds configurable via props (easy to tune later)

### Icon Style
- Flat vector shapes (matches game aesthetic)
- Minimal detail (readable at small sizes)
- Consistent line weights (2px for outlines)
- Use Design System colors (not custom per-icon)

### Timer Format
- Seconds with 1 decimal place during gameplay: `42.3s`
- 2 decimal places on Game Over screen: `42.35s`
- No minutes:seconds format (keeps it simple, survival time is short)

---

## Future Enhancements (Post-v0.0.5)

- [ ] Animated pulsing for danger state (< 25%)
- [ ] Screen edge vignette when hull < 25% (red tint)
- [ ] Fuel regen glow effect when near sun
- [ ] Hull damage particle burst on collision
- [ ] Audio feedback trigger points (low fuel beep, etc.)

---

## Notes

**Design Philosophy:**
- Iterate in isolation (gallery) before integrating into game
- Get visual feedback from multiple people before locking design
- Design System consistency is critical (no one-off colors)

**Performance:**
- Canvas rendering for gallery is fine (low frame rate)
- Game HUD will use Svelte components (better for text/accessibility)
- Resource bars in game should be DOM elements, not canvas (easier styling)

**Accessibility:**
- Color should not be the only indicator (text labels required)
- Consider adding shapes/patterns for color-blind players (future)

---

## Sign-Off

**Specification Author:** @Lead  
**Design Lead:** @Designer  
**Implementation:** @Dev  
**Reviewer:** TBD  
**Approved:** ⏳ Pending Review

---

**Related Documents:**
- [Survival Core Spec](../specs/survival-core.md)
- [Design System Core](../specs/design-system-core.md)
- [Gallery & Assets](../specs/gallery_and_assets.md)
- [Phase 5 Roadmap](../PHASE-5-ROADMAP.md)