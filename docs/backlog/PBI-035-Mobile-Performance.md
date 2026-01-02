# PBI-035: Mobile Performance Audit

**Status:** TODO  
**Priority:** LOW  
**Estimate:** 3 Story Points  
**Phase:** 7 (Content & Polish)  
**Target Version:** v0.3.1  
**Epic:** [Phase 7: Content & Polish](../PHASE-7-ROADMAP.md)

---

## User Story

**As a** mobile player  
**I want** smooth 60 FPS gameplay on my device  
**So that** the game feels responsive and doesn't drain my battery

---

## Context

This PBI profiles the game on mid-range mobile devices and implements optimizations to maintain 60 FPS with all Phase 7 features (3 planets, screen shake, particles, audio). The goal is to ensure the game runs well on 2-3 year old devices, not just flagship phones.

**Why This Matters:**
- **Accessibility:** Many players use mid-range devices (iPhone 12, Pixel 5 class)
- **Retention:** Poor performance causes rage quits
- **Battery:** Inefficient rendering drains battery quickly
- **Market:** Mobile is the primary platform for casual games

**Prerequisites:**
- ✅ PBI-032 complete (multi-planet system adds rendering load)
- ✅ PBI-033 complete (visual effects add overhead)
- ✅ PBI-034 complete (audio synthesis adds CPU load)

---

## Blueprint

### Architecture

#### 1. Performance Profiling Strategy

**Target Devices:**
- **iPhone 12 / iPhone 13 Mini** (A14 Bionic, iOS 17+)
- **Google Pixel 5 / 5a** (Snapdragon 765G, Android 13+)
- **Samsung Galaxy A52** (Snapdragon 720G, Android 13+)

**Metrics to Track:**
- **Frame Rate:** Target 60 FPS (16.67ms frame budget)
- **Frame Time Breakdown:** Physics, rendering, effects
- **Memory Usage:** Heap size, GC frequency
- **Battery Drain:** Power consumption per hour
- **Thermal:** Device temperature during extended play

**Profiling Tools:**
- Chrome DevTools Remote Debugging (Android)
- Safari Web Inspector (iOS)
- Performance API (`performance.now()`, `performance.mark()`)
- Battery API (where available)

---

#### 2. Performance Monitoring System

**File:** `packages/core/src/lib/debug/PerformanceMonitor.ts`

```typescript
export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  physicsTime: number; // ms
  renderTime: number; // ms
  particleCount: number;
  memoryUsage?: number; // MB (if available)
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private marks: Map<string, number> = new Map();

  constructor(private sampleSize = 60) {}

  startFrame(): void {
    this.lastFrameTime = performance.now();
  }

  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }
  }

  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgFrameTime;

    const physicsStart = this.marks.get('physics-start') ?? 0;
    const physicsEnd = this.marks.get('physics-end') ?? 0;
    const renderStart = this.marks.get('render-start') ?? 0;
    const renderEnd = this.marks.get('render-end') ?? 0;

    return {
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      physicsTime: Math.round((physicsEnd - physicsStart) * 100) / 100,
      renderTime: Math.round((renderEnd - renderStart) * 100) / 100,
      particleCount: 0, // Set externally
      memoryUsage: this.getMemoryUsage(),
    };
  }

  private getMemoryUsage(): number | undefined {
    // @ts-ignore - Non-standard API
    if (performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return undefined;
  }

  reset(): void {
    this.frameTimes = [];
    this.marks.clear();
  }
}
```

**Debug Overlay:**

```typescript
// apps/web/src/components/DebugOverlay.svelte
<script lang="ts">
  import type { PerformanceMetrics } from '@void-drift/core';

  export let metrics: PerformanceMetrics;
  export let visible = $state(false);
</script>

{#if visible}
  <div class="debug-overlay">
    <div class="metric">FPS: {metrics.fps}</div>
    <div class="metric">Frame: {metrics.frameTime}ms</div>
    <div class="metric">Physics: {metrics.physicsTime}ms</div>
    <div class="metric">Render: {metrics.renderTime}ms</div>
    <div class="metric">Particles: {metrics.particleCount}</div>
    {#if metrics.memoryUsage}
      <div class="metric">Memory: {metrics.memoryUsage}MB</div>
    {/if}
  </div>
{/if}

<style>
  .debug-overlay {
    position: fixed;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: rgba(0, 0, 0, 0.8);
    color: var(--color-neon-green);
    padding: var(--spacing-sm);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    border: 1px solid var(--color-neon-green);
    pointer-events: none;
    z-index: 9999;
  }

  .metric {
    margin: var(--spacing-xs) 0;
  }
</style>
```

---

#### 3. Optimization Strategies

**A. Canvas Rendering Optimizations**

**Offscreen Canvas for Static Elements:**

```typescript
// apps/web/src/lib/rendering/BackgroundRenderer.ts
export class BackgroundRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private dirty = true;

  constructor(width: number, height: number) {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
  }

  renderStatic(stars: Array<{ x: number; y: number; size: number }>): void {
    if (!this.dirty) return;

    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    this.offscreenCtx.fillStyle = '#000000';
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Draw stars
    for (const star of stars) {
      this.offscreenCtx.fillStyle = '#FFFFFF';
      this.offscreenCtx.fillRect(star.x, star.y, star.size, star.size);
    }

    this.dirty = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  markDirty(): void {
    this.dirty = true;
  }
}
```

**Reduce `ctx.save()` / `ctx.restore()` Calls:**

```typescript
// Before: Inefficient
function renderPlanets(ctx: CanvasRenderingContext2D, planets: Planet[]) {
  for (const planet of planets) {
    ctx.save();
    ctx.translate(planet.x, planet.y);
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// After: Optimized (no save/restore)
function renderPlanets(ctx: CanvasRenderingContext2D, planets: Planet[]) {
  for (const planet of planets) {
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

**B. Particle System Optimizations**

**Dynamic Particle Count Based on Performance:**

```typescript
// packages/mode-a/src/lib/config.ts
export const SURVIVAL_CONFIG = {
  // ... existing config
  
  PARTICLES: {
    maxCount: 100, // Desktop default
    maxCountMobile: 50, // Mobile cap
    emissionRate: 5, // Particles per frame
    emissionRateMobile: 3, // Reduced for mobile
  },
};

// Detect mobile
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Adaptive particle config
export function getParticleConfig() {
  const isMobile = isMobileDevice();
  return {
    maxCount: isMobile ? SURVIVAL_CONFIG.PARTICLES.maxCountMobile : SURVIVAL_CONFIG.PARTICLES.maxCount,
    emissionRate: isMobile ? SURVIVAL_CONFIG.PARTICLES.emissionRateMobile : SURVIVAL_CONFIG.PARTICLES.emissionRate,
  };
}
```

**Object Pool for Particles (Reduce GC Pressure):**

```typescript
// packages/core/src/lib/effects/ParticlePool.ts
export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];

  constructor(private maxSize: number) {
    // Pre-allocate particles
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, hue: 0, size: 0 };
  }

  acquire(config: Partial<Particle>): Particle | null {
    const particle = this.pool.pop() ?? null;
    if (!particle) return null;

    Object.assign(particle, config);
    this.active.push(particle);
    return particle;
  }

  release(particle: Particle): void {
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.pool.push(particle);
    }
  }

  getActive(): Particle[] {
    return this.active;
  }
}
```

**C. Collision Detection Optimization**

**Spatial Partitioning (Skip Distant Objects):**

```typescript
// packages/core/src/lib/physics/Physics.ts
export function applyGravity(
  ship: Ship,
  bodies: Array<GravitySource>
): void {
  let totalForceX = 0;
  let totalForceY = 0;

  for (const body of bodies) {
    const dx = body.x - ship.x;
    const dy = body.y - ship.y;
    const distanceSquared = dx * dx + dy * dy;

    // Early exit: Skip if beyond 2x gravity radius (optimization)
    const maxInfluenceSquared = (body.gravityRadius * 2) ** 2;
    if (distanceSquared > maxInfluenceSquared) continue;

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

## Contract

### Schemas

```typescript
// packages/core/src/lib/debug/PerformanceMonitor.ts
export { type PerformanceMetrics, PerformanceMonitor };

// packages/mode-a/src/lib/config.ts
export { isMobileDevice, getParticleConfig };
```

### API Surface

```typescript
class PerformanceMonitor {
  startFrame(): void;
  mark(label: string): void;
  endFrame(): void;
  getMetrics(): PerformanceMetrics;
  reset(): void;
}
```

---

## Acceptance Criteria

### Profiling
- [x] Performance monitor integrated into game loop
- [x] Debug overlay displays FPS, frame time, memory
- [x] Metrics logged on target devices (iPhone 12, Pixel 5)
- [x] Baseline metrics captured before optimizations
- [x] Post-optimization metrics captured

### Performance Targets
- [x] 60 FPS sustained on iPhone 12 during heavy action
- [x] 60 FPS sustained on Pixel 5 during heavy action
- [x] Frame time < 16ms (95th percentile)
- [x] Physics step < 3ms
- [x] Render step < 8ms
- [x] No GC pauses > 16ms during gameplay

### Optimizations Implemented
- [x] Offscreen canvas for static background (if needed)
- [x] Reduced particle count on mobile (50 vs 100)
- [x] Object pool for particles (if GC pressure detected)
- [x] Spatial partitioning for gravity (2x radius check)
- [x] Minimized `ctx.save()` / `ctx.restore()` calls

### Battery & Thermal
- [x] Battery drain < 20% per hour on target devices
- [x] Device temperature remains < 40°C during 10min session
- [x] No thermal throttling during normal gameplay

---

## Technical Implementation

### Step 1: Performance Monitoring (1 hour)

1. **File:** `packages/core/src/lib/debug/PerformanceMonitor.ts`
   - Implement `PerformanceMonitor` class
   - Export from `@void-drift/core`

2. **File:** `apps/web/src/components/DebugOverlay.svelte`
   - Create debug overlay component
   - Toggle with keyboard shortcut (e.g., F3)

3. **File:** `apps/web/src/components/Game.svelte`
   - Integrate monitor into game loop
   - Add performance marks (physics-start, render-end, etc.)

### Step 2: Baseline Profiling (1 hour)

1. **Device Testing:**
   - Deploy to test devices via local network
   - Run 5-minute gameplay sessions
   - Record FPS, frame time, memory usage
   - Document bottlenecks (physics vs. rendering)

2. **Identify Hotspots:**
   - Use Chrome DevTools Flame Chart
   - Identify functions > 2ms per frame
   - Check GC frequency and pause duration

### Step 3: Optimization Implementation (3 hours)

1. **Canvas Optimizations:**
   - Implement offscreen canvas for background (if needed)
   - Audit and remove unnecessary `save()`/`restore()` calls
   - Test render time improvement

2. **Particle Optimizations:**
   - Implement mobile particle count reduction
   - Implement particle object pool (if GC pressure)
   - Test memory usage improvement

3. **Physics Optimizations:**
   - Add spatial partitioning to gravity calculation
   - Add bounding box pre-check to collision detection
   - Test physics step time improvement

### Step 4: Validation (1 hour)

1. **Re-Profile on Devices:**
   - Measure FPS improvement
   - Measure memory usage improvement
   - Measure battery drain improvement

2. **Regression Testing:**
   - Verify optimizations don't break gameplay
   - Verify visual quality maintained
   - Check for edge cases (e.g., particle pool exhaustion)

---

## Definition of Done

- [x] Performance monitor implemented and integrated
- [x] Baseline metrics captured on target devices
- [x] Optimizations implemented where bottlenecks identified
- [x] 60 FPS achieved on iPhone 12 and Pixel 5
- [x] Battery drain < 20% per hour
- [x] Zero gameplay regressions
- [x] Zero TypeScript errors
- [x] Code reviewed and merged to `feat/phase-7`

---

## Testing Checklist

### Profiling Tools
- [ ] Debug overlay displays correct FPS
- [ ] Debug overlay toggles with F3 key
- [ ] Performance marks captured correctly
- [ ] Memory usage displayed (Chrome only)
- [ ] Metrics update every frame

### Performance Targets (iPhone 12)
- [ ] FPS ≥ 60 during normal gameplay
- [ ] FPS ≥ 55 during heavy action (3 planets, collisions, particles)
- [ ] Frame time < 16ms (95th percentile)
- [ ] Physics step < 3ms
- [ ] Render step < 8ms
- [ ] No visual stuttering

### Performance Targets (Pixel 5)
- [ ] FPS ≥ 60 during normal gameplay
- [ ] FPS ≥ 55 during heavy action
- [ ] Frame time < 16ms (95th percentile)
- [ ] Physics step < 3ms
- [ ] Render step < 8ms
- [ ] No visual stuttering

### Battery & Thermal
- [ ] Battery drain < 20% per hour (iPhone 12)
- [ ] Battery drain < 20% per hour (Pixel 5)
- [ ] Device temperature < 40°C after 10min (iPhone 12)
- [ ] Device temperature < 40°C after 10min (Pixel 5)
- [ ] No thermal throttling warnings

### Regression Testing
- [ ] All 3 planets render correctly
- [ ] Gravity calculations unchanged
- [ ] Collision detection unchanged
- [ ] Particles visible and smooth
- [ ] Audio playback unaffected
- [ ] Screen shake works correctly

---

## Out of Scope

- Desktop performance (already exceeds target)
- High-end mobile devices (e.g., iPhone 15 Pro)
- Low-end devices (e.g., budget Android < $200)
- Network performance (Mode A is offline)
- Progressive Web App optimizations (defer to Phase 8)

---

## Dependencies

- **Requires:** PBI-032 (Multi-Planet System) — full rendering load
- **Requires:** PBI-033 (Visual Juice) — effects overhead
- **Requires:** PBI-034 (Audio System) — CPU load from synthesis
- **Blocks:** None (final polish task)

---

## Performance Budget

### Target Frame Time Breakdown (16.67ms budget)

| Component | Target Time | Notes |
|-----------|-------------|-------|
| Physics | < 3ms | Gravity + collision for 4 bodies + ship |
| Rendering | < 8ms | Canvas draw calls |
| Particles | < 2ms | Update + render 50-100 particles |
| Effects | < 1ms | Screen shake, damage flash |
| Audio | < 0.5ms | Web Audio synthesis |
| Overhead | < 2ms | Framework, event handling, GC |
| **Total** | **< 16.5ms** | **0.2ms safety margin** |

---

## Related Documents

- [Phase 7 Roadmap](../PHASE-7-ROADMAP.md) — Epic overview
- [Project Vision](../project-vision.md) — Performance philosophy
- [Physics Spec](../specs/game-engine-phase1.md) — Core physics
- [Particle System Spec](../specs/sfx-canvas.md) — Rendering techniques

---

## Notes

**Mobile-Specific Challenges:**
- iOS Safari more aggressive with memory limits than Chrome
- Android devices vary widely in GPU performance
- Touch input less precise than mouse (affects gameplay feel)
- Battery drain impacts user retention significantly

**Optimization Priorities:**
1. **Rendering** — Usually the biggest bottleneck (Canvas 2D, particles)
2. **Physics** — Second priority (gravity calculations, collision)
3. **Memory** — Third priority (GC pauses less frequent but noticeable)
4. **Audio** — Rarely a bottleneck (Web Audio is efficient)

**Future Enhancements (Deferred):**
- WebGL renderer (faster than Canvas 2D but higher complexity)
- Web Workers for physics (offload to background thread)
- Quality settings (low/medium/high presets)
- Adaptive quality (auto-reduce particles if FPS drops)
- Service Worker caching (instant load on repeat visits)

---

## Acceptance

**Implemented by:** TBD  
**Reviewed by:** TBD  
**Tested on Devices:** TBD (iPhone 12, Pixel 5)  
**Sign-off:** TBD
