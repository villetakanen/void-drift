# PBI-001: Physics Tuning & Controls

**Status:** TODO
**Priority:** High
**Parent:** Phase 1 (Engine)

## 1. Problem
The current physics implementation is too rigid.
- **Controls:** Pressing only Left or Right only rotates the ship in place. In a real differential thrust system, firing one engine should push the other side forward, resulting in movement + rotation.
- **Speed:** There is no speed cap, leading to uncontrollable velocity.
- **Drift:** The ship has 0 friction, making it drift forever without stopping.

## 2. Requirements

### 2.1. Single-Engine Thrust (Arcade Differential)
- **Current Behavior:** `Left Key` -> Rotate Right.
- **New Behavior:** `Left Key` -> Rotate Right AND Apply Forward Thrust (e.g. 50% of main thrust).
  - Logic: If you fire only the LEFT engine, the ship pivots pivot point is center, pushing the right side forward.
  - Result: The ship should spiral if you hold one key.

### 2.2. Max Velocity
- Implement a hard or soft cap on velocity magnitude.
- `CONFIG.MAX_SPEED`: Start with `500` pixels/sec.
- Logic: `if (vel.mag() > MAX_SPEED) vel.normalize().mult(MAX_SPEED)`

### 2.3. Inertia Damping (Space Drag)
- Implement linear or exponential drag to slow the ship down over time when no thrust is applied.
- `CONFIG.SHIP_DRAG`: Start with `0.98` (per second or per frame, TBD).
- Logic: `vel.mult(1 - DRAG * dt)` or similar time-based decay.

## 3. Acceptance Criteria
- [ ] Holding 'A' makes the ship circle/spiral clockwise while moving forward.
- [ ] Holding 'D' makes the ship circle/spiral counter-clockwise while moving forward.
- [ ] Ship never exceeds a defined maximum speed.
- [ ] Releasing all keys causes the ship to eventually come to a stop (or near stop).
