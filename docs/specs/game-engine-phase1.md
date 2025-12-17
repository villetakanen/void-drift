# Specification: Game Engine Phase 1 (The Vibe Check)

**Feature:** Physics Engine & Rendering Basics
**Status:** ✅ COMPLETED (2024)
**Owner:** @Lead
**Implementer:** @Dev
**Current Version:** 0.0.4

## 1. Goal
Implement the core game loop and physics engine to prove the "high inertia / drift" gameplay feel. The player must be able to fly a ship using differential thrust controls on a wrapped canvas.

## 2. Technical Constraints
- **Performance:** Zero garbage collection in the main loop. Reuse vectors/objects.
- **Rendering:** `CanvasRenderingContext2D` (No WebGL for now, keeping it simple/retro).
- **Physics:** deterministic simple Newtonian physics (Velocity += Acceleration).
- **Architecture:** Decouple `Update` (Physics) from `Draw` (Render).

## 3. Data Structures (`packages/engine/src/lib/schemas/game.ts` & `packages/engine/src/lib/engine/Physics.ts`)

### 3.1. Primitives
*Note: Although we use Zod for network boundaries, inside the hot loop we use raw classes/structs for speed.*

```typescript
// packages/engine/src/lib/engine/Physics.ts
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

**Implementation Status:** ✅ `Vec2` class implemented with full vector math operations.

## 4. Implementation Steps

### 4.1. The Loop (`packages/engine/src/lib/engine/Loop.ts`) ✅
Create a class `GameLoop` that handles:
- `requestAnimationFrame`
- Delta time calculation (`dt`).
- Fixed timestep for Physics (e.g., 60Hz) vs Unlocked Frame Rate for Render.

### 4.2. Input Handling (`packages/engine/src/lib/engine/Input.ts`) ✅
- Listen for `keydown` / `keyup` (Codes: `KeyA`, `KeyD`, `Space`).
- Normalize inputs into a simple state object:
  ```typescript
  {
    leftThruster: boolean;  // A
    rightThruster: boolean; // D
    fire: boolean;          // Space
  }
  ```

### 4.3. Physics Logic (`packages/engine/src/lib/engine/Physics.ts`) ✅
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

### 4.4. Rendering (`packages/engine/src/lib/engine/Renderer.ts`) ✅
- Clear Canvas.
- Save Context.
- Translate to `ship.pos`.
- Rotate to `ship.rotation`.
- Draw distinct Triangle ship (Concept: "Paper Airplane" shape).
  - Draw flames if thrusters are active.
- Restore Context.

### 4.5. Integration (`apps/web/src/components/GameWrapper.svelte`) ✅
- Mount `<canvas>` with 16:9 viewport constraint.
- Initialize `GameLoop` on component mount.
- Handle window resize (maintain aspect ratio, letterbox as needed).
- **Current Implementation:** Uses Astro + Svelte 5 (Runes) architecture.

## 5. Tuning Constants (`packages/engine/src/lib/config.ts`) ✅
Start with these values and tweak for "Vibe":
- `SHIP_DRAG`: 0.98 (Air resistance factor per frame, or 0.5 per second).
- `ROTATION_SPEED`: 3.0 (Radians per second).
- `THRUST_FORCE`: 100.0 (Pixels/sec^2).

## 6. Verification ✅
1. ✅ Open App at `localhost:4321`.
2. ✅ Press 'A': Ship spins Clockwise (differential thrust).
3. ✅ Press 'D': Ship spins Counter-Clockwise.
4. ✅ Press 'A+D': Ship moves forward (both thrusters = linear thrust).
5. ✅ Release keys: Ship continues drifting (Newton's 1st Law).
6. ✅ Fly off edge: Ship wraps to opposite side (antipodal wrapping in circular arena).

**Status:** All core mechanics verified and operational.

## 7. Post-Implementation Notes

### Additional Features Implemented
- **Camera System:** Added `Camera` class for smooth viewport tracking (PBI-013).
- **Circular Arena:** Changed from rectangular wrapping to circular topology (R=1200px).
- **Starfield:** Procedural background stars for parallax movement cues.
- **Mobile Support:** Touch zones for left/right thrust on mobile devices.
- **Design System:** Full CSS token system in `apps/web/src/styles.css`.

### Performance Achievements
- **60 FPS:** Maintained on desktop and modern mobile devices.
- **Zero GC:** No object allocation in render loop.
- **Bundle Size:** Engine package remains lightweight (~50KB uncompressed).

### Architecture Evolution
- Engine consumed as TypeScript source (no intermediate build step).
- Vite alias resolves `@void-drift/engine` to `packages/engine/src/index.ts`.
- Clean separation between game logic (engine) and presentation (web app).

---

**Phase 1 Status: COMPLETE AND STABLE** 🎉  
**Next Phase:** v0.0.5 (Networking) or Product Vision Pivot
