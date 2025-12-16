# Feature: Universal Input System

## Blueprint

### Context
To support both competitive Desktop play and accessible Mobile play, inputs must be normalized into an abstract "Intent" state. The physics engine should not know whether a "Left Turn" came from a keyboard or a touchscreen.

### Architecture
- **Data Model:**
  ```typescript
  interface InputState {
    leftThruster: boolean;
    rightThruster: boolean;
    fire: boolean;
  }
  ```
- **Store:** `lib/engine/Input.ts` (Svelte Store or Class).
- **Mapping:**
  - Desktop: WASD / Arrows.
  - Mobile: Split-screen Touch Zones.

### Anti-Patterns
- **Do NOT** handle events (keydown/touchstart) inside the `GameLoop`. They must be handled in an `Input` manager that updates state.
- **Do NOT** allow default browser behaviors (scrolling, zooming) on the game canvas.
- **Do NOT** use `click` events for mobile steering; use `touchstart`/`touchend` for zero latency.

## Contract

### Definition of Done
- [ ] `InputState` interface is defined in `packages/engine`.
- [ ] Desktop keys (A/D) correctly toggle `leftThruster`/`rightThruster`.
- [ ] Mobile touch zones (Left/Right half) correctly toggle `leftThruster`/`rightThruster`.
- [ ] Double-tap on mobile triggers `fire`.

### Regression Guardrails
- **Latency:** Input processing must happen before the physics update in the same frame.
- **Multi-Touch:** The system must support at least 2 simultaneous touch points (for dual thrust).
- **Stuck Keys:** State must clear correctly when keys/touches are released (even if focus is lost).

### Scenarios
**Scenario: Dual Thrust (Desktop)**
- Given I am pressing 'A' (Left)
- When I also press 'D' (Right)
- Then `InputState` shows `{ leftThruster: true, rightThruster: true }`
- And the Ship accelerates forward

**Scenario: Touch Drift (Mobile)**
- Given I touch the left side of the screen
- When I hold my finger there
- Then `InputState.leftThruster` is `true`
- And the Ship rotates right (spirals)

**Scenario: Prevent Scroll**
- Given I am on a mobile device
- When I drag my finger across the canvas
- Then the browser does NOT scroll or refresh the page
