# Specification: Monorepo Migration & Architecture

**Status:** ✅ COMPLETED (2024), 📝 UPDATED for v0.2.0 package split  
**Outcome:** SUCCESSFUL - Clean monorepo structure operational

> **Note (v0.2.0):** The original `packages/engine` is being split into `packages/core` + `packages/mode-a` per PBI-021. This document reflects the planned structure.

## 1. Overview
This specification documented the transition of "Void Drift" from a monolithic single-page application (SPA) into a **Monorepo** structure. The migration is now complete.

**Achievement:** Developer tools (Asset Gallery) and Design System workbenches are now cleanly separated from the optimized Game Loop environment, establishing a robust Game Engine core consumed by a feature-rich Production Site.

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
│   ├── core/           # @void-drift/core - Shared physics, entities, assets
│   │   └── src/lib/
│   │       ├── physics/    # Newtonian motion, gravity, collision
│   │       ├── entities/   # Ship, Star, Planet, Input
│   │       ├── assets/     # Procedural draw functions
│   │       ├── schemas/    # Core schemas (Position, Velocity, etc.)
│   │       └── config.ts   # PHYSICS constants
│   │
│   ├── mode-a/         # @void-drift/mode-a - Survival game logic
│   │   └── src/lib/
│   │       ├── schemas/    # GameState, Resources, DeathCause
│   │       ├── game-loop.ts
│   │       ├── death.ts
│   │       └── config.ts   # SURVIVAL_CONFIG
│   │
│   └── mode-b/         # @void-drift/mode-b - Multiplayer (future)
│       └── src/lib/
│           ├── schemas/    # Lobby, Player, Weapon
│           └── sync.ts     # Firestore state sync
│
├── apps/
│   └── web/            # The Production Site (Astro + Svelte)
│       ├── src/
│       │   ├── components/ # Svelte UI Components
│       │   ├── layouts/    # Astro Layouts
│       │   ├── pages/
│       │   │   ├── index.astro       # The Game (Imports core + mode-a)
│       │   │   └── lab/              # The Workbench (Imports core assets)
│       └── package.json
```

**Package Ownership:**
- `core` — Shared code used by all game modes (physics, entities, assets)
- `mode-a` — VOID DRIFT survival-specific logic (resources, death, timer)
- `mode-b` — VOID BRAWL multiplayer-specific logic (future)

### 3.2 `packages/core`
Shared game logic used by all modes. Should be "UI Agnostic".
- **Responsibility**: Physics simulation, Input normalization, Canvas rendering logic (pure functions), entity management.
- **Exports**:
  - `Ship`, `Star`, `Planet` (entity classes)
  - `Camera`, `Renderer` (rendering)
  - `Input` (input handling)
  - `applyGravity`, `handleCollision` (physics functions)
  - `drawShip`, `drawStar`, `drawPlanet` (asset functions)
  - `PHYSICS_CONFIG` (constants)

### 3.3 `packages/mode-a`
Survival game logic specific to VOID DRIFT.
- **Responsibility**: Game state, resources, death detection, timer.
- **Exports**:
  - `GameState`, `Resources`, `DeathCause` (schemas)
  - `updatePower`, `updateHull` (resource functions)
  - `checkDeath`, `handleDeath` (death logic)
  - `updateTimer` (timer logic)
  - `SURVIVAL_CONFIG` (constants)
- **Depends on**: `@void-drift/core`

### 3.4 `apps/web` (Astro)
A static-first site that rehydrates Svelte components.
- **Framework**: Astro + Svelte Integration.
- **Routing**: File-system based (`src/pages/*`).
- **Pages**:
  - `/`: Mounts the `<GameWrapper />` Svelte component which initializes the game using `@void-drift/core` and `@void-drift/mode-a`.
  - `/lab`: Mounts asset workbench components which import from `@void-drift/core`.

## 4. Migration Strategy (COMPLETED)

### Phase 1: Workspace Setup ✅
1. ✅ Created `pnpm-workspace.yaml`.
2. ✅ Moved `src/*` logic into `packages/engine`.
3. ✅ Configured `packages/engine/package.json` as a library.

### Phase 2: Web App Initialization ✅
1. ✅ Initialized `apps/web` as Astro project.
2. ✅ Installed `@astrojs/svelte`.
3. ✅ Added dependency: `@void-drift/engine` with workspace protocol.

### Phase 3: Router Removal ✅
1. ✅ Removed hash-based routing hacks.
2. ✅ Created `apps/web/src/pages/index.astro` (Game).
3. ✅ Created `apps/web/src/pages/gallery.astro` (Gallery).

### Phase 4: Verification ✅
1. ✅ `pnpm dev` starts Astro at `localhost:4321`.
2. ✅ Game works at root route.
3. ✅ Gallery works at `/gallery` route.

### Phase 5: Cleanup ✅
1. ✅ Removed legacy root `src/` directory.
2. ✅ Removed legacy `index.html` from root.
3. ✅ Removed legacy `vite.config.ts` from root.

## 5. Success Criteria - ALL MET ✅
- [x] Project root contains clearly defined `apps/` and `packages/`.
- [x] `packages/engine` exports core game logic successfully.
- [x] `apps/web` consumes `@void-drift/engine` via Vite alias.
- [x] Browsing `localhost:4321/gallery` shows the workbench.
- [x] Browsing `localhost:4321/` plays the game.
- [x] Zero TypeScript errors or warnings.
- [x] Root directory contains only configuration files.

## 6. Current State (Post-Migration)

> **v0.2.0 Update:** Package structure is being updated from single `engine` to `core` + `mode-a` split. See PBI-021 for migration details.

### Directory Structure (Target v0.2.0)
```
void-drift/
├── pnpm-workspace.yaml    ✅
├── package.json            ✅
├── biome.json              ✅
├── AGENTS.md               ✅
├── docs/                   ✅
│   ├── specs/
│   ├── backlog/
│   └── project-vision.md
├── packages/
│   ├── core/               ✅ @void-drift/core (shared)
│   │   └── src/lib/
│   │       ├── physics/       (Physics, Camera, collision)
│   │       ├── entities/      (Ship, Star, Planet, Input, Renderer)
│   │       ├── assets/        (drawShip, drawStar, drawPlanet, etc.)
│   │       ├── schemas/       (core Zod schemas)
│   │       └── config.ts      (PHYSICS_CONFIG)
│   │
│   └── mode-a/             ✅ @void-drift/mode-a (survival)
│       └── src/lib/
│           ├── schemas/       (GameState, Resources, DeathCause)
│           ├── game-loop.ts   (survival loop, timer)
│           ├── death.ts       (checkDeath, handleDeath)
│           └── config.ts      (SURVIVAL_CONFIG)
│
└── apps/
    └── web/                ✅ Production Site
        ├── src/
        │   ├── components/    (GameWrapper, HUD, GameOver, Settings, etc.)
        │   ├── layouts/       (Layout.astro)
        │   ├── pages/         (index.astro, settings.astro, lab/)
        │   ├── lib/           (stores/settings.ts)
        │   └── styles.css     (Design System Tokens)
        ├── astro.config.mjs
        └── package.json
```

### Core Package (`@void-drift/core`)
- **Build Strategy:** Consumed as TypeScript source via Vite alias (no intermediate build).
- **Exports:** Ship, Star, Planet, Camera, Renderer, Input, Physics functions, asset drawing functions.
- **Dependencies:** Zod.
- **Location:** `packages/core/src/`

### Mode-A Package (`@void-drift/mode-a`)
- **Build Strategy:** Consumed as TypeScript source via Vite alias (no intermediate build).
- **Exports:** GameState, Resources, DeathCause schemas, updatePower, updateHull, checkDeath, SURVIVAL_CONFIG.
- **Dependencies:** `@void-drift/core`, Zod.
- **Location:** `packages/mode-a/src/`

### Web Application (`apps/web`)
- **Framework:** Astro + Svelte 5 (Runes).
- **Routing:** File-system based (`/` → game, `/gallery` → workbench).
- **Build Command:** `pnpm --filter web build`
- **Dev Server:** `pnpm dev` (proxies to `pnpm --filter web dev` at port 4321).

## 7. Known Deviations from Original Plan

### Core/Svelte Decoupling
- **Vision:** `packages/core` should be pure Logic/Types (Framework-agnostic).
- **Reality:** `packages/core` is now framework-agnostic (no Svelte dependency).
- **Rationale:** Clean separation allows core physics to be used in any context.
- **Mode-A:** Also framework-agnostic. Svelte reactivity lives in `apps/web` only.

### Build Strategy
- **Vision:** Packages compile to distributable JS/TS declarations.
- **Reality:** Consumed directly as TypeScript source via Vite alias.
- **Rationale:** Simplifies development. Astro's Vite config resolves `@void-drift/core` and `@void-drift/mode-a` to source.
- **Trade-off:** Web app cannot use pre-built packages (acceptable for monorepo workflow).

## 8. Lessons Learned

1. **Workspace Protocol Works:** Using `"@void-drift/core": "workspace:*"` in `apps/web/package.json` correctly resolves to local package.
2. **Vite Aliases Essential:** Astro config needs explicit alias to resolve bare imports: `@void-drift/core → ../../packages/core/src/index.ts`.
3. **No Root Code:** Keeping root directory clean prevents "context amnesia" where agents forget which app they're working in.
4. **Lab Separation:** Moving lab to its own route (`/lab`) eliminated hash-routing hacks and improved developer experience.
5. **Package Split Benefits:** Separating core from mode-specific logic prevents cross-contamination between game modes.

## 9. Maintenance Notes

- **Adding New Core Exports:** Update `packages/core/src/index.ts` to export new APIs.
- **Adding New Mode-A Exports:** Update `packages/mode-a/src/index.ts` to export new APIs.
- **Adding New Routes:** Create new `.astro` files in `apps/web/src/pages/`.
- **Core Schemas:** Define in `packages/core/src/lib/schemas/` for shared types.
- **Mode-A Schemas:** Define in `packages/mode-a/src/lib/schemas/` for survival-specific types.
- **Design Tokens:** Maintain in `apps/web/src/styles.css` (single source of truth for CSS variables).

---

**Migration Status: COMPLETE AND STABLE** 🎉  
**Ready for:** v0.0.5 (Networking/Lobby) or Product Vision Pivot
