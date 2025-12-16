# Feature: Game Viewport & Camera

## Blueprint

### Context
To ensure a consistent competitive experience across different screen sizes and devices (Ultrawide vs. Mobile), the gameplay area must be constrained to a fixed aspect ratio (16:9). The Camera ("Director Mode") must intelligently frame the action within this container, rather than simply showing the entire canvas.

### Architecture
- **Container:** A centered CSS container maintaining 16:9 ratio.
- **Canvas:** Renders at internal resolution (e.g., 1920x1080) and scales via CSS transfer.
- **Camera Logic:**
  - `Camera.pos`: Interpolated focus point (center of all ships).
  - `Camera.smoothing`: Hard-locked (1.0) to ship center. Movement conveyed via starfield parallax.
  - `Camera.zoom`: Dynamic zoom based on bounding box of action.
- **HUD:** Overlays the canvas (HTML/Svelte layer).
- **Starfield:** World-space procedural stars to provide movement cues.

### Anti-Patterns
- **Do NOT** allow the canvas to stretch to fill the window indiscriminately.
- **Do NOT** put HUD elements inside the Canvas rendering loop.
- **Do:** Lock the camera to the player center for consistent feedback (parralax stars provide movement cues).

## Contract

### Definition of Done
- [ ] Game renders inside a 16:9 container that fits within the browser window (letterboxing if needed).
- [ ] Resizing the window scales the container but does NOT change the visible game world area.
- [ ] Camera smoothly follows the player (Single Player) or the group centroid (Multiplayer).
- [ ] Game Logo (`$\emptyset \cdot \Delta$`) is visible in the top-left or top-center of the HUD.

### Regression Guardrails
- **Topology:** Circular Arena (Radius 1200px). Crossing the boundary wraps to the antipodal point (opposite side).
- **Performance:** Camera math must run every frame without allocation.

### Scenarios
**Scenario: Resizing Components**
- Given the game is running on a desktop
- When I resize the browser window to be very narrow
- Then the Game Container shrinks to fit width
- And the Aspect Ratio remains 16:9 (black bars on top/bottom)

**Scenario: Camera Tracking**
- Given the player is at position (0,0)
- When the player thrusts to (1000, 1000)
- Then the Camera view pans smoothly to keep the ship in frame
- And the Stars/Background parallax scroll correctly
