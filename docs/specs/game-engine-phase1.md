# Specification: Game Engine Phase 1 (The Vibe Check)

**Feature:** Physics Engine & Rendering Basics
**Status:** DRAFT
**Owner:** @Lead
**Implementer:** @Dev

## 1. Goal
Implement the core game loop and physics engine to prove the "high inertia / drift" gameplay feel. The player must be able to fly a ship using differential thrust controls on a wrapped canvas.

## 2. Technical Constraints
- **Performance:** Zero garbage collection in the main loop. Reuse vectors/objects.
- **Rendering:** `CanvasRenderingContext2D` (No WebGL for now, keeping it simple/retro).
- **Physics:** deterministic simple Newtonian physics (Velocity += Acceleration).
- **Architecture:** Decouple `Update` (Physics) from `Draw` (Render).

## 3. Data Structures (`src/lib/schemas/game.ts` & `src/lib/engine/Physics.ts`)

### 3.1. Primitives
*Note: Although we use Zod for network boundaries, inside the hot loop we use raw classes/structs for speed.*

```typescript
// src/lib/engine/Physics.ts
export class Vec2 {
  constructor(public x: number, public y: number) {}
  // Methods: add, sub, mult, mag, normalize (mutate self where possible)
}

export interface GameObject {
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  rotation: number; // Radians, 0 = Facing East
  radius: number;
}
```

## 4. Implementation Steps

### 4.1. The Loop (`src/lib/engine/Loop.ts`)
Create a class `GameLoop` that handles:
- `requestAnimationFrame`
- Delta time calculation (`dt`).
- Fixed timestep for Physics (e.g., 60Hz) vs Unlocked Frame Rate for Render.

### 4.2. Input Handling (`src/lib/engine/Input.ts`)
- Listen for `keydown` / `keyup` (Codes: `KeyA`, `KeyD`, `Space`).
- Normalize inputs into a simple state object:
  ```typescript
  {
    leftThruster: boolean;  // A
    rightThruster: boolean; // D
    fire: boolean;          // Space
  }
  ```

### 4.3. Physics Logic (`src/lib/engine/Physics.ts`)
Implement `updateShip(ship: GameObject, input: InputState, dt: number)`:
1. **Rotation:**
   - If `leftThruster`: `rotation += ROT_SPEED * dt`
   - If `rightThruster`: `rotation -= ROT_SPEED * dt`
   *Note: Differential thrust usually means Left Engine pushes Right side -> Turn Right.*
2. **Thrust:**
   - If `leftThruster && rightThruster`: Apply force vector in direction of `rotation`.
   - `acc = forwardVector * THRUST_POWER`
3. **Integration:**
   - `vel += acc * dt`
   - `pos += vel * dt`
   - `acc = 0` (reset for next frame)
4. **Wrapping:**
   - If `pos.x > width` -> `pos.x = 0`
   - If `pos.x < 0` -> `pos.x = width`
   - Same for Y.

### 4.4. Rendering (`src/lib/engine/Renderer.ts`)
- Clear Canvas.
- Save Context.
- Translate to `ship.pos`.
- Rotate to `ship.rotation`.
- Draw distinct Triangle ship (Concept: "Paper Airplane" shape).
  - Draw flames if thrusters are active.
- Restore Context.

### 4.5. Integration (`src/App.svelte`)
- Mount `<canvas>`.
- Initialize `GameLoop` on mount.
- Handle window resize (update canvas dimensions).

## 5. Tuning Constants (`src/lib/config.ts`)
Start with these values and tweak for "Vibe":
- `SHIP_DRAG`: 0.98 (Air resistance factor per frame, or 0.5 per second).
- `ROTATION_SPEED`: 3.0 (Radians per second).
- `THRUST_FORCE`: 100.0 (Pixels/sec^2).

## 6. Verification
1. Open App.
2. Press 'A': Ship spins Clockwise?
3. Press 'D': Ship spins Counter-Clockwise?
4. Press 'A+D': Ship moves forward?
5. Release keys: Ship continues drifting (Newton's 1st Law)?
6. Fly off edge: Ship appears on opposite side?
