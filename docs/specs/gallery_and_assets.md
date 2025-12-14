# Specification: Internal Asset Gallery & Design System Workbench

## 1. Overview
The **Asset Gallery** is a hidden developer tool accessible via `/#gallery`. It serves as a workbench to develop, test, and tune procedural graphics and UI components in isolation from the main game loop.

## 2. Goals
1.  **Visual Verification**: Instantly view assets (ships, asteroids, effects) and UI components (buttons, HUDs) without navigating gameplay.
2.  **Parameter Tuning**: Tweak procedural generation parameters (colors, dimensions, variance) in real-time.
3.  **Design System Compliance**: Ensure all UI elements adhere to the "Void" aesthetic (managed by @Designer).
4.  **Performance**: Isolate heavy rendering logic for profiling.

## 3. Architecture

### 3.1. Route Handling
- **Mechanism**: Hash-based routing in `App.svelte` to avoid server-side config changes.
- **States**:
  - `window.location.hash === ""` -> **Game Mode** (Regular user experience).
  - `window.location.hash === "#gallery"` -> **Gallery Mode**.
- **Implementation**:
  - `App.svelte` listens for `hashchange`.
  - On `#gallery`, it unmounts the `GameLoop` and mounts `Gallery.svelte`.

### 3.2. Directory Structure
```
src/
  lib/
    assets/           # Procedural drawing logic (Pure Functions)
      index.ts        # Exports
      ship.ts         # drawShip(ctx, state)
      asteroid.ts     # drawAsteroid(ctx, seed)
      grid.ts         # drawBackgroundGrid(ctx)
    debug/
      Gallery.svelte  # Main Workbench Container
      Controls.svelte # Knobs/Sliders UI
      Canvas.svelte   # Isolated Rendering Context
```

### 3.3. Asset Interface (The "drawable" contract)
All procedural assets must accept a `CanvasRenderingContext2D` and a configuration object.
```typescript
type DrawFunction<T> = (ctx: CanvasRenderingContext2D, x: number, y: number, props: T) => void;
```

## 4. Features

### 4.1. The Workbench UI (`Gallery.svelte`)
- **Layout**: CSS Grid/Flex.
  - **Left Sidebar**: "Asset Picker" (List of available components/assets).
  - **Center**: "Stage" (Canvas or DOM container).
  - **Right Sidebar**: "Inspector" (Tunable controls for the selected asset).

### 4.2. Tunable Controls ("Knobs")
- **Boolean**: Checkbox (e.g., `showHitbox`).
- **Range**: Slider (e.g., `scale` 0.5 - 2.0).
- **Color**: Hex/RGB picker (e.g., `primaryColor`).
- **Action**: Button (e.g., `regenerateSeed`).

### 4.3. UI Component Laboratory
- In addition to Canvas assets, the Gallery must render HTML/Svelte UI components.
- **Example**: Displaying the `HealthBar` or `GameOverScreen` with mock data.

## 5. Implementation Plan

### Phase 1: Foundation (The Skeleton)
1.  Create `src/lib/debug/Gallery.svelte`.
2.  Refactor `App.svelte` to handle the `#gallery` route.
3.  Ensure `npm run dev` supports hot-reloading the gallery.

### Phase 2: Decoupling (The Refactor)
1.  Extract `drawShip` from `Renderer.ts` into `src/lib/assets/ship.ts`.
2.  Ensure `Renderer.ts` imports and uses the new `drawShip`.
3.  Add `Ship` to the Gallery with rotation controls.

### Phase 3: Expansion (Design System & UI)
1.  **Design System Module**:
    - **Palette Viewer**: Visual grid of all CSS variables (`--color-neon-blue`, etc.) to verify contrast and harmony.
    - **Typography**: Test bench for all font sizes (`h1` - `h6`, `p`, `mono`) and weights.
    - **Components**: Interactive states for Buttons, Panels, and Dialogs.
2.  **Screen Preview**: Mount full screens (e.g., `GameOverScreen`) with mock data.

## 6. Success Criteria
- [ ] User can visit `localhost:5173/#gallery` and see the workbench.
- [ ] User can see the Ship spinning in the gallery.
- [ ] User can change the Ship's color via a control panel.
- [ ] Main game still works perfectly at `localhost:5173/`.
