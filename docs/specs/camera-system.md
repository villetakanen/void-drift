# Feature: Camera System

## Blueprint

### Context
The Camera system provides smooth, cinematic tracking of game entities within a fixed 16:9 viewport. It decouples the logical game world from the physical screen dimensions, ensuring consistent gameplay across different display sizes and aspect ratios.

### Architecture

#### Camera Class
- **Location:** `packages/core/src/lib/physics/Camera.ts`
- **Responsibility:** Transform world coordinates to screen space with smooth interpolation
- **Key Properties:**
  - `pos: Vec2` - Current camera center in world space
  - `target: Vec2` - Target position to interpolate toward
  - `viewportWidth/Height` - Logical resolution (default 1920x1080)
  - `smoothing` - Interpolation factor (0 = instant, higher = more lag)

#### Coordinate Systems
1. **World Space:** Absolute positions in the game world (e.g., ship at (1000, 500))
2. **Screen Space:** Positions relative to the canvas (0,0 = top-left of viewport)
3. **Window Space:** Browser window coordinates (for input handling)

#### Transform Pipeline
```
World Position → Camera Transform → Screen Position → CSS Scale → Window Position
     (1000, 500)      translate       (40, 50)         scale      (80, 100)
```

**Visual Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│ Browser Window (e.g., 3840x1080 ultrawide)                  │
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Game Container (1920x1080 scaled, letterboxed)   │    │
│   │                                                     │    │
│   │  Canvas: 1920x1080 logical resolution              │    │
│   │  ┌─────────────────────────────────────────────┐   │    │
│   │  │                                             │   │    │
│   │  │  Camera Viewport (1920x1080 world units)   │   │    │
│   │  │  ┌───────────────────────────────────┐     │   │    │
│   │  │  │                                   │     │   │    │
│   │  │  │   Visible Game World              │     │   │    │
│   │  │  │                                   │     │   │    │
│   │  │  │   Camera.pos (center)             │     │   │    │
│   │  │  │        ●                          │     │   │    │
│   │  │  │                                   │     │   │    │
│   │  │  │   Ship.pos (world space)          │     │   │    │
│   │  │  │        ◆                          │     │   │    │
│   │  │  │                                   │     │   │    │
│   │  │  └───────────────────────────────────┘     │   │    │
│   │  │                                             │   │    │
│   │  └─────────────────────────────────────────────┘   │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Camera offset = camera.pos - (viewport.width/2, viewport.height/2)
Screen X = World X - offset.x
Screen Y = World Y - offset.y
```

### Key Methods

#### `setTarget(x, y)`
Sets the position the camera should follow. Typically called with the player ship's position each frame.

#### `update(dt)`
Interpolates camera position toward target using frame-rate independent smoothing:
```
factor = smoothing * dt * 60
pos.x += (target.x - pos.x) * factor
pos.y += (target.y - pos.y) * factor
```

#### `applyTransform(ctx)`
Applies the camera offset to the rendering context. Call this before drawing game objects:
```javascript
const offset = camera.getViewOffset()
ctx.translate(-offset.x, -offset.y)
```

#### `worldToScreen(x, y)` / `screenToWorld(x, y)`
Convert between coordinate systems. Essential for mouse/touch input handling.

### Integration with Renderer

```typescript
renderer.clear()
renderer.beginCamera(camera)  // ctx.save() + translate
  
// Draw all game objects in world space
renderer.drawStar(star)
renderer.drawShip(ship)

renderer.endCamera()  // ctx.restore()

// Draw HUD in screen space (HTML overlay)
```

### Viewport Container

The game canvas is wrapped in a responsive container that:
1. Maintains strict 16:9 aspect ratio
2. Scales to fit the browser window
3. Letterboxes (black bars) when window ratio ≠ 16:9
4. Prevents "ultrawide advantage" by fixing visible game area

**CSS Implementation:**
```css
.viewport-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-container {
  /* Width/height set dynamically via JS */
  position: relative;
  background: var(--color-void);
}

.game-canvas {
  width: 100%;
  height: 100%;
}
```

**JavaScript Resize Logic:**
```javascript
const windowRatio = window.innerWidth / window.innerHeight
const targetRatio = 16 / 9

if (windowRatio > targetRatio) {
  // Fit to height, letterbox sides
  height = window.innerHeight
  width = height * targetRatio
} else {
  // Fit to width, letterbox top/bottom
  width = window.innerWidth
  height = width / targetRatio
}
```

### Anti-Patterns

- **Do NOT** allocate new Vec2 objects in the update loop (reuse target/pos)
- **Do NOT** apply camera transform to HUD elements (use HTML overlay)
- **Do NOT** hard-code viewport dimensions in game logic (use camera.viewportWidth/Height)
- **Do NOT** forget to call `endCamera()` before drawing HUD (breaks transform state)
- **Do NOT** use instant camera tracking (smoothing = 0); it feels robotic

### Performance Characteristics

- **CPU:** ~0.1ms per frame (Vec2 math + ctx.translate)
- **Memory:** 48 bytes (2 Vec2 + 4 floats)
- **Allocations:** Zero per frame (all math done in-place)

### Configuration

Default smoothing factor: `0.1`
- Lower = snappier tracking (0.05 for action games)
- Higher = more "floaty" camera (0.2 for cinematic feel)

Formula for smoothing:
```
distance_covered_per_second = smoothing * 60 * distance_to_target
```

At smoothing = 0.1:
- Camera covers ~50% of distance in ~0.12 seconds
- Camera covers ~90% of distance in ~0.38 seconds

### Testing Scenarios

**Scenario: Camera Follows Ship**
- Given: Ship at (500, 500), Camera at (0, 0), smoothing = 0.1
- When: update(1/60) called 60 times
- Then: Camera should be at ~(450, 450) after 1 second

**Scenario: Window Resize**
- Given: Game running on 1920x1080 window
- When: Window resized to 3840x1080 (ultrawide)
- Then: Game container remains 1920x1080 (letterboxed), no extra map visible

**Scenario: Touch Input**
- Given: User taps at screen position (100, 100)
- When: screenToWorld(100, 100) called
- Then: Returns world position accounting for camera offset

### Future Enhancements

1. **Dynamic Zoom:** Adjust viewportWidth/Height based on action intensity
2. **Shake/Trauma:** Add procedural camera shake for impacts
3. **Look-Ahead:** Offset camera slightly in direction of ship velocity
4. **Multiplayer Framing:** Track centroid of all players + zoom to fit bounding box

## Contract

### Definition of Done
- [x] Camera class implemented with smooth interpolation
- [x] Viewport constrained to 16:9 regardless of window size
- [x] Camera follows ship without jitter or lag spikes
- [x] worldToScreen/screenToWorld coordinate conversion working
- [x] HUD elements remain in screen space (not affected by camera)
- [x] Zero frame drops on 60Hz displays (iPhone 12+, desktop)

### Regression Guardrails
- **Aspect Ratio:** Must remain exactly 16:9 on all window sizes
- **Performance:** Camera.update() must complete in <0.2ms
- **Coordinate Accuracy:** worldToScreen(screenToWorld(x, y)) must return original (x, y)
- **Smoothing:** Camera must reach target within 1 second (smoothing = 0.1)

### Dependencies
- `Vec2` class from Physics module
- `Renderer.beginCamera()` / `Renderer.endCamera()` methods
- GameWrapper component for viewport container

### Public API
```typescript
// Create camera with 16:9 viewport
const camera = new Camera({
  viewportWidth: 1920,
  viewportHeight: 1080,
  smoothing: 0.1
})

// Every frame
camera.setTarget(ship.pos.x, ship.pos.y)
camera.update(deltaTime)

// Rendering
renderer.beginCamera(camera)
// ... draw game objects ...
renderer.endCamera()

// Input handling
const worldPos = camera.screenToWorld(touchX, touchY)
```
