# Specification: Monorepo Migration & Architecture

## 1. Overview
We are transitioning "Void Drift" from a monolithic single-page application (SPA) into a **Monorepo** structure. This change resolves architectural friction where developer tools (Asset Gallery) and Design System workbenches were awkwardly fighting for space within the optimized Game Loop environment.

This migration prepares the project for its long-term vision: a robust Game Engine core consumed by a feature-rich Production Site.

## 2. Motivation
- **Separation of Concerns**: The Game Engine should essentially be a library. The Production Site (Marketing, Lobby, Gallery) is the consumer.
- **Routing**: We stop hacking hash-routers into the game loop. The site handles routing (Home, Gallery, About) natively.
- **Performance**: The game bundle strictly contains the game. Admin/Dev tools are tree-shaken out or exist in separate apps.
- **Scalability**: Allows adding other apps later (e.g., a simplified mobile controller web-remote, or an admin dashboard).

## 3. Architecture

### 3.1 Workspace Structure (PNPM)
We will use `pnpm workspaces`.

```
/
├── pnpm-workspace.yaml
├── package.json        # Root scripts (turbo/build orchestration)
├── packages/
│   └── engine/         # The Core Logic (Physics, Renderer, Audio, Input)
│       ├── src/
│       │   ├── lib/    # Pure math, physics, canvas draw functions
│       │   └── index.ts # Extracts: GameLoop class, drawShip(), Types
│       └── package.json
├── apps/
│   └── web/            # The Production Site (Astro + Svelte)
│       ├── src/
│       │   ├── components/ # Svelte UI Components
│       │   ├── layouts/    # Astro Layouts
│       │   ├── pages/
│       │   │   ├── index.astro       # The Game (Imports Engine)
│       │   │   └── gallery.astro     # The Workbench (Imports Engine Assets)
│       └── package.json
```

### 3.2 `packages/engine`
This is the heart of Void Drift. It should be "UI Agnostic".
- **Responsibility**: Physics simulation, Input normalization, Canvas rendering logic (pure functions), Game Loop timing.
- **Exports**:
  - `GameLoop` (class)
  - `Renderer` (class)
  - `Input` (class)
  - `drawShip`, `drawAsteroid` (pure functions)
  - `CONFIG` (constants)

### 3.3 `apps/web` (Astro)
A static-first site that rehydrates Svelte components.
- **Framework**: Astro + Svelte Integration.
- **Routing**: File-system based (`src/pages/*`).
- **Pages**:
  - `/`: Mounts the `<GameWrapper />` Svelte component which initializes the `GameLoop` from `packages/engine`.
  - `/gallery`: Mounts the `<Gallery />` Svelte component which imports `drawShip` and allows parameter tuning.

## 4. Migration Strategy

### Phase 1: Workspace Setup
1.  Create `pnpm-workspace.yaml`.
2.  Move current `src/*` logic into `packages/engine`.
3.  Adjust `packages/engine/package.json` to be a library (export types/main).

### Phase 2: Web App Initialization
1.  Initialize `apps/web` as a fresh Astro project.
2.  Install `@astrojs/svelte`.
3.  Add dependency: `"void-drift-engine": "workspace:*"`.

### Phase 3: Router Removal
1.  Delete `HashRouter` and `App.svelte` routing hacks.
2.  Create `apps/web/src/pages/index.astro` -> Loads Game.
3.  Create `apps/web/src/pages/gallery.astro` -> Loads Gallery.

### Phase 4: Verification
1.  Verify `pnpm dev` starts the Astro site.
2.  Verify Game works at root.
3.  Verify Gallery works at `/gallery`.

## 5. Success Criteria
- [ ] Project root contains clearly defined `apps/` and `packages/`.
- [ ] `packages/engine` builds successfully as a library.
- [ ] `apps/web` consumes `packages/engine`.
- [ ] Browsing `localhost:3000/gallery` shows the workbench.
- [ ] Browsing `localhost:3000/` plays the game.
