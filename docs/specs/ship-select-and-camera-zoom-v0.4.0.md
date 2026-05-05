# Feature: Camera Zoom + Ship Select (v0.4.0)

**Status:** PLANNED  
**Target Version:** 0.4.0

## Blueprint

### Context
v0.4.0 focuses on two UX upgrades that directly improve replayability and readability:
- **Camera Zoom:** players can tune world scale for comfort and tactical awareness.
- **Ship Select (3 variants):** players can choose a handling profile that matches playstyle.

These features should preserve 60 FPS targets and remain fully mobile compatible.

### Architecture

#### 1. Schema-First Ship Profiles

Create schema and typed config in `packages/mode-a/src/lib/schemas/ship-profile.ts`.

```typescript
import { z } from "zod";

export const ShipProfileSchema = z.object({
  id: z.enum(["scout", "balanced", "tank"]),
  name: z.string().min(1),
  thrustMultiplier: z.number().positive(),
  turnMultiplier: z.number().positive(),
  hullMultiplier: z.number().positive(),
  powerDrainMultiplier: z.number().positive(),
  zoomDefault: z.number().positive(),
  tint: z.string(),
});

export type ShipProfile = z.infer<typeof ShipProfileSchema>;
```

Expose a readonly `SHIP_PROFILES` map and parse once at startup.

#### 2. Camera Zoom System

Add zoom controls to `packages/core/src/lib/physics/Camera.ts`:
- `currentZoom`
- `targetZoom`
- `minZoom`, `maxZoom`
- smoothing in `update(dt)`

Required methods:
- `setZoomTarget(value: number)`
- `adjustZoom(delta: number)`
- `setZoomImmediate(value: number)`
- `getZoom()`

Clamp range recommendation:
- `minZoom = 0.85`
- `maxZoom = 1.35`

#### 3. Input and UI Integration

In `apps/web/src/components/GameWrapper.svelte`:
- Desktop: map `-` / `=` (or wheel) to zoom out/in.
- Mobile: add two 44px touch-safe HUD controls (`-` and `+`).
- Add reset action (`0` key or center button) to return to profile default.

#### 4. Persistence

Extend settings schema/store to persist:
- `selectedShipId`
- `zoomPreference` (optional user override)

Apply selected ship + zoom default on game start/restart.

#### 5. Visual Differentiation (Procedural)

No external assets. Ship variants must be procedural:
- option A: profile-based tint + silhouette accent
- option B: profile-based fin/wing geometry toggles in `drawShip`

Keep allocation-free render behavior in frame loop.

### Initial Ship Profiles

| Ship | ID | Strength | Tradeoff |
|------|----|----------|----------|
| Scout | `scout` | Fast turn + thrust | Lower hull |
| Balanced | `balanced` | Even stats | No specialization |
| Tank | `tank` | Higher hull resilience | Slower turn/thrust |

### Anti-Patterns
- Do not instantiate temporary objects in render/update loops.
- Do not zoom HUD text/elements with world camera transform.
- Do not allow ship stats outside schema bounds.

## Contract

### Definition of Done
- [ ] Players can choose 1 of 3 ships before starting a run.
- [ ] Selected ship changes handling feel in first 10 seconds of play.
- [ ] Camera zoom works on desktop and mobile with smooth interpolation.
- [ ] Zoom and selected ship persist across reloads.
- [ ] 60 FPS remains stable on target mobile profile under heavy effects.

### Regression Guardrails
- **Physics:** Existing collision/gravity behavior remains deterministic.
- **UX:** Touch controls remain usable (min 44px targets).
- **Performance:** No measurable regressions compared to v0.3.0 baseline.
