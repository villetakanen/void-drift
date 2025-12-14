# Specification: Universal Input System

**Feature:** Input handling for Desktop and Mobile (Touch)
**Status:** DRAFT
**Owner:** @Lead
**Implementer:** @Dev

## 1. Goal
Abstract physical hardware inputs (Keyboard, Touch) into a normalized `InputState` used by the Game Engine. This ensures the Physics Loop relies only on "Intent" (Drift Left, Drift Right, Thrust) rather than specific key codes.

## 2. Architecture

### 2.1. The `InputState` Interface (The Truth)
The engine only cares about these booleans.
```typescript
interface InputState {
  leftThruster: boolean;  // Active if KeyA or Left Touch
  rightThruster: boolean; // Active if KeyD or Right Touch
  fire: boolean;          // Active if Space or Double Tap
}
```

## 3. Desktop Schema (Keyboard)
*Status: Implemented*
- **Left Thruster:** `KeyA`, `ArrowLeft`.
- **Right Thruster:** `KeyD`, `ArrowRight`.
- **Fire:** `Space`, `Enter`.

## 4. Mobile Schema (Touch)
*Status: Planned (v0.0.2)*

### 4.1. Split-Screen Zones
The screen is vertically divided into two touch zones.
- **Zone Left:** `x < window.innerWidth / 2`
- **Zone Right:** `x >= window.innerWidth / 2`

### 4.2. Logic
- **`leftThruster`:** TRUE if *any* active touch point is in **Zone Left**.
- **`rightThruster`:** TRUE if *any* active touch point is in **Zone Right**.
- **Result:**
  - One finger on Left -> Left Thruster.
  - One finger on Right -> Right Thruster.
  - Two fingers (one Left, one Right) -> Both Thrusters (Forward).

### 4.3. Double Tap (Fire)
- **Detection:** If a `touchstart` event occurs within `300ms` of the previous `touchstart`.
- **Action:** Set `fire = true` for a single frame (or short duration).

### 4.4. UX Requirements
- **Prevent Default:** Must call `event.preventDefault()` on `touchstart`, `touchmove`, `touchend` to prevents iOS/Android scrolling, zooming, or text selection.
- **Visual Feedback:**
  - When Zone Left is active -> Show a semi-transparent white overlay (10% opacity) on the left side.
  - When Zone Right is active -> Show a semi-transparent white overlay (10% opacity) on the right side.

## 5. Implementation Strategy (`src/lib/engine/Input.ts`)

Refactor the `Input` class to handle multiple event listeners.

1.  **State Management:**
    - Maintain a Set of active `touchIds` mapped to tracking data if necessary, or simply iterate `e.touches`.
2.  **Loop Integration:**
    - The `Input` class updates its public `state` property in real-time.
    - The `GameLoop` reads this dirty state every frame.
    - *Note:* Do not reset state at frame end; state remains active as long as keys/fingers are down.

## 6. Verification Plan
1.  **Desktop:** Regression test `WASD`.
2.  **Mobile (Simulator):**
    - Open Chrome DevTools -> Device Mode.
    - Click Left Side -> Ship rotates Right.
    - Click Right Side -> Ship rotates Left.
    - *Note:* Multi-touch is hard to test in standard mouse devtools without dedicated emulation or physical device testing.
3.  **Mobile (Physical):**
    - Deploy to local network / host.
    - Test "Thumbs" playstyle.
