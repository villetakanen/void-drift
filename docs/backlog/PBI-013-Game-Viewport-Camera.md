# PBI-013: Game Viewport & Camera Polish

**Status:** DONE
**Priority:** High
**Parent:** Phase 4 (QoL)
**Completed:** 2024

## 1. Context
Currently, the game canvas stretches to fill the entire window. This causes consistency issues (ultrawide advantage) and UI layout bugs at extreme sizes. The camera is also static or basic.

We want to enforce a cinematic 16:9 viewport and implement a "Director Mode" camera.

## 2. Requirements

### 2.1. 16:9 Container
- Wrap the game canvas in a `div` that maintains a strict 16:9 aspect ratio.
- The container should scale to fit the window (maxWidth/maxHeight 100%) but letterbox (black bars) if ratios mismatch.
- **Reference:** `docs/specs/game-viewport.md`

### 2.2. Camera Director
- Implement a `Camera` class in `packages/engine`.
- Logic: `target = ship.position` (for single player).
- Smoothing: Use a damped spring or lerp (`cam.pos += (target - cam.pos) * 0.1`) to prevent jitter.

### 2.3. Logo Overlay
- Add the Void Drift Logo ($\emptyset \cdot \Delta$) to the top-left of the HUD layer.
- Ensure it uses the Design System font (`Noto Sans Math`).
- **Reference:** `docs/specs/design-system-core.md`

## 3. Acceptance Criteria
- [x] Game is constrained to a 16:9 box.
- [x] Resizing window does not stretch sprites or reveal extra map area (just changes scale).
- [x] Camera follows player smoothly.
- [x] Logo is visible in the HUD.

## 4. Implementation Notes

### Camera System
- Created `Camera` class in `packages/engine/src/lib/engine/Camera.ts`
- Maintains fixed logical resolution (1920x1080)
- Smooth interpolation using damped spring (`smoothing * dt * 60`)
- Provides world-to-screen and screen-to-world coordinate conversion
- Camera follows ship position with configurable smoothing factor (0.1)

### Viewport Container
- `GameWrapper.svelte` now wraps canvas in a 16:9 container
- Container scales dynamically to fit window while maintaining aspect ratio
- Letterboxing (black bars) applied when window ratio doesn't match 16:9
- Canvas renders at logical 1920x1080 resolution, CSS scales to fit container

### Renderer Updates
- Added `beginCamera()` and `endCamera()` methods to `Renderer`
- Camera transform applied via `ctx.save()` and `ctx.restore()`
- All game objects rendered in camera space
- HUD elements remain in screen space (HTML overlay)

### HUD Overlay
- Logo (∅·Δ) positioned top-left using Noto Sans Math font
- Uses design system tokens (`--color-neon-blue`, `--spacing-md`)
- Controls hint and version display positioned absolutely
- Touch feedback zones maintained within game container

### Physics & Arena Updates (Deviations)
- **Circular Arena:** Changed from rectangular wrapping to a circular arena (Radius 1200px / Diameter 2400px).
- **Antipodal Wrapping:** Ships crossing the boundary teleport to the opposite side, preserving momentum vector (projective plane topology).
- **Event Horizon:** Added visual boundary line at R=1200.

### Camera Tuning
- **Locked Mode:** Camera is hard-locked to the ship (Smoothing = 1.0) to facilitate precise control.
- **Warp Snap:** Camera instantly teleports if distance > 1000px (detects arena wrap) to prevent disorienting pans.
- **Starfield:** Added procedural background stars to provide parallax movement cues since the ship is static in the frame.

### Build Configuration
- Removed build script from engine package (consumed as source via Vite alias)
- Web app builds successfully with new Camera system
- Zero TypeScript errors
