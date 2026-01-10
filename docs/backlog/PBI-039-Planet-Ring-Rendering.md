# PBI-039: Planet Ring Rendering

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 1 Story Point  
**Target Version:** v0.2.4

---

## User Story

**As a** player  
**I want** some planets to have visible ring systems  
**So that** the solar system feels more visually diverse

---

## Context

The Planet interface now includes `hasRing: boolean`. Ring rendering is implemented in the Planet Lab but not in the main game renderer.

**Spec Reference:** [planet-mechanics.md](../specs/planet-mechanics.md) - Data Model

---

## Acceptance Criteria

- [ ] `drawPlanet()` function supports optional ring rendering
- [ ] Rings render as tilted ellipse behind planet
- [ ] Ring color matches planet color at 40% opacity
- [ ] Ring is visual-only (no collision)

---

## Technical Implementation

**File:** `packages/core/src/lib/assets/planet.ts`

Update `drawPlanet()` to accept optional `hasRing` parameter:

```typescript
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    radius: number;
    color: string;
    hasRing?: boolean;
  }
): void {
  // Draw ring behind planet if enabled
  if (options.hasRing) {
    drawRing(ctx, options.x, options.y, options.radius, options.color);
  }
  
  // Draw planet (existing code)
  // ...
}
```

---

## Definition of Done

- [ ] Ring rendering in `drawPlanet()`
- [ ] Rings visible in game when planet has `hasRing: true`
- [ ] Type check passes
