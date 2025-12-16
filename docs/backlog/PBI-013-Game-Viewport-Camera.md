# PBI-013: Game Viewport & Camera Polish

**Status:** TODO
**Priority:** High
**Parent:** Phase 4 (QoL)

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
- [ ] Game is constrained to a 16:9 box.
- [ ] Resizing window does not stretch sprites or reveal extra map area (just changes scale).
- [ ] Camera follows player smoothly.
- [ ] Logo is visible in the HUD.
