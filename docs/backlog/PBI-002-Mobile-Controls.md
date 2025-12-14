# PBI-002: Mobile Touch Controls (Alpha)

**Status:** TODO
**Priority:** High
**Parent:** Version 0.0.2 (Mobile Alpha)
**Spec:** `docs/specs/controls-system.md`

## 1. Goal
Enable playability on mobile devices by implementing the "Split Screen" touch control scheme defined in the Input System Specification. This is the core deliverable for v0.0.2.

## 2. Requirements

### 2.1. Touch Zone Logic
- **Left Zone (0 to 50% width):** Active touches here trigger `leftThruster`.
- **Right Zone (50% to 100% width):** Active touches here trigger `rightThruster`.
- **Multi-Touch:** Testing with two thumbs (one in each zone) must trigger BOTH thrusters (Forward movement).

### 2.2. Visual Feedback
- **Overlay:** Add a UI layer in `Joystick.svelte` (or `App.svelte`) that renders visual indicators.
- **Indicators:**
  - `div.zone-feedback-left`: Highlights left side (white 10% opacity) when active.
  - `div.zone-feedback-right`: Highlights right side (white 10% opacity) when active.

### 2.3. Browser Quirks (Critical)
- **Prevent Defaults:**
  - `touch-action: none` CSS on the canvas/container.
  - `e.preventDefault()` on `touchstart`, `touchmove`, `touchend` to stop scrolling, zooming, and text selection.
  - **Meta Tag:** Ensure `user-scalable=no` is present in `index.html`.

### 2.4. Orientation Enforcement
- **Requirement:** Game must be played in **Landscape Mode**.
- **Visual:** If the device is in Portrait (width < height), show a full-screen overlay asking the user to "Please Rotate Device".
- **Logic:** `App.svelte` should check `window.innerWidth < window.innerHeight` on resize and toggle the overlay.

## 3. Implementation Plan
1.  **Modify `index.html`:** Add mobile viewport meta tags.
2.  **Update `Input.ts`:**
    -  Add `touchstart`, `touchend`, `touchcancel` listeners.
    -  Implement the "Set of Active Touch IDs" or iterate `e.touches` logic.
    -  Map touches to Zones.
3.  **Update `App.svelte` / UI:**
    -  Pass `input.state` to the UI layer (reactively if possible, or via loop sync).
    -  Render feedback divs based on input state.

## 4. Acceptance Criteria
- [ ] Tapping Left side rotates ship Right (and applies thrust).
- [ ] Tapping Right side rotates ship Left (and applies thrust).
- [ ] Holding both sides moves ship Straight.
- [ ] No scrolling or zooming occurs when frantically tapping.
- [ ] Visual overlay lights up corresponding to the active zone.
