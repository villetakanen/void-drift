# Feature: Universal Input System

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context
To support both competitive Desktop play and accessible Mobile play, inputs must be normalized into an abstract "Intent" state. The physics engine should not know whether a "Left Turn" came from a keyboard or a touchscreen.

**Achievement:** Cross-platform input system operational with keyboard (WASD/Arrows) and touch support.

### Architecture
- **Data Model:**
  ```typescript
  interface InputState {
    leftThruster: boolean;
    rightThruster: boolean;
    fire: boolean;
  }
  ```
- **Store:** `packages/core/src/lib/entities/Input.ts` (Input manager class).
- **Mapping:**
  - Desktop: WASD / Arrows.
  - Mobile: Split-screen Touch Zones.

### Anti-Patterns
- **Do NOT** handle events (keydown/touchstart) inside the `GameLoop`. They must be handled in an `Input` manager that updates state.
- **Do NOT** allow default browser behaviors (scrolling, zooming) on the game canvas.
- **Do NOT** use `click` events for mobile steering; use `touchstart`/`touchend` for zero latency.

## Contract

### Definition of Done
- [x] `InputState` interface is defined in `packages/core`.
- [x] Desktop keys (A/D or Arrow keys) correctly toggle `leftThruster`/`rightThruster`.
- [x] Desktop keys (A+D or both arrows) trigger forward thrust.
- [x] Mobile touch zones (Left/Right half) correctly toggle `leftThruster`/`rightThruster`.
- [x] Mobile touch feedback (visual highlight) indicates active zones.
- [x] Browser default behaviors (scroll, zoom) prevented on game canvas.

### Regression Guardrails
- **Latency:** Input processing must happen before the physics update in the same frame.
- **Multi-Touch:** The system must support at least 2 simultaneous touch points (for dual thrust).
- **Stuck Keys:** State must clear correctly when keys/touches are released (even if focus is lost).

### Scenarios
**Scenario: Dual Thrust (Desktop)** ✅
- Given I am pressing 'A' (Left)
- When I also press 'D' (Right)
- Then `InputState` shows `{ leftThruster: true, rightThruster: true }`
- And the Ship accelerates forward
- **Status:** VERIFIED - Differential thrust system operational

**Scenario: Touch Drift (Mobile)** ✅
- Given I touch the left side of the screen
- When I hold my finger there
- Then `InputState.leftThruster` is `true`
- And the Ship rotates right (spirals)
- **Status:** VERIFIED - Touch zones working on mobile devices

**Scenario: Prevent Scroll** ✅
- Given I am on a mobile device
- When I drag my finger across the canvas
- Then the browser does NOT scroll or refresh the page
- **Status:** VERIFIED - `preventDefault()` on touch events

## Current Implementation

### Input Manager (`packages/core/src/lib/entities/Input.ts`)
- **Architecture:** Framework-agnostic input manager class
- **Event Listeners:** Registered on window for keyboard, on canvas for touch
- **State Management:** Boolean flags for `leftThruster`, `rightThruster`, `fire`

### Desktop Controls
- **Primary:** WASD keys
  - `KeyA` → Left thruster (rotate clockwise)
  - `KeyD` → Right thruster (rotate counter-clockwise)
  - `KeyA + KeyD` → Forward thrust (both engines)
- **Alternative:** Arrow keys
  - `ArrowLeft` → Left thruster
  - `ArrowRight` → Right thruster
  - `Both Arrows` → Forward thrust
- **Fire:** `Space` key (reserved for future weapons)

### Mobile Controls (`apps/web/src/components/GameWrapper.svelte`)
- **Touch Zones:** Screen split into left/right halves
- **Visual Feedback:** Zones highlight with `rgba(0, 255, 255, 0.1)` on touch
- **Multi-Touch:** Supports simultaneous left+right for forward thrust
- **Events:** `touchstart`, `touchend`, `touchmove` with `preventDefault()`

### Portrait Mode Warning
- **Component:** `GameWrapper.svelte` includes orientation check
- **Behavior:** Full-screen overlay when device is in portrait
- **Message:** "VOID DRIFT - Please Rotate Device"
- **Styling:** Uses `--color-void` background with `--color-neon-blue` text

### Controls Hint UI
- **Desktop:** "WASD / Arrows to Thrust"
- **Mobile:** "Tap Sides to Thrust"
- **Location:** Bottom-center of HUD overlay
- **Styling:** Subtle text using `--color-text-dim` token

## Performance Characteristics
- **Input Latency:** <1ms (events processed before physics update)
- **Memory:** Zero allocations per frame (reuses state object)
- **Touch Sampling:** Native browser rate (60Hz+ on modern devices)

## Known Limitations
- **Fire Button:** Not yet implemented (reserved for future weapons system)
- **Gamepad Support:** Not implemented (future enhancement)
- **Keyboard Remapping:** Hardcoded keys (no user configuration yet)

---

**Input System Status: OPERATIONAL** 🎮  
**Platforms:** Desktop (keyboard) + Mobile (touch)
