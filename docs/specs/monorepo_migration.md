# Specification: Monorepo Migration & Architecture

**Status:** ✅ COMPLETED (2024)  
**Outcome:** SUCCESSFUL - Clean monorepo structure operational

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

### Directory Structure
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
│   └── engine/             ✅ @void-drift/engine
│       ├── src/
│       │   ├── lib/
│       │   │   ├── engine/    (Loop, Physics, Renderer, Camera, Input, Audio)
│       │   │   ├── schemas/   (Zod validation)
│       │   │   ├── assets/    (star.ts)
│       │   │   ├── renderers/ (ship.ts)
│       │   │   ├── config.ts
│       │   │   ├── store.ts
│       │   │   └── firebase.ts
│       │   └── index.ts       (Public API)
│       └── package.json
└── apps/
    └── web/                ✅ Production Site
        ├── src/
        │   ├── components/    (GameWrapper, Gallery, Controls, Logo, Canvas)
        │   ├── layouts/       (Layout.astro)
        │   ├── pages/         (index.astro, gallery.astro)
        │   └── styles.css     (Design System Tokens)
        ├── astro.config.mjs
        └── package.json
```

### Engine Package (`@void-drift/engine`)
- **Build Strategy:** Consumed as TypeScript source via Vite alias (no intermediate build).
- **Exports:** GameLoop, Renderer, Camera, Physics, Input, Audio, Zod schemas, config constants.
- **Dependencies:** Svelte 5 (Runes), Zod, Firebase.
- **Location:** `packages/engine/src/`

### Web Application (`apps/web`)
- **Framework:** Astro + Svelte 5 (Runes).
- **Routing:** File-system based (`/` → game, `/gallery` → workbench).
- **Build Command:** `pnpm --filter web build`
- **Dev Server:** `pnpm dev` (proxies to `pnpm --filter web dev` at port 4321).

## 7. Known Deviations from Original Plan

### Engine/Svelte Coupling
- **Vision:** `packages/engine` should be pure Logic/Types (Framework-agnostic).
- **Reality:** `packages/engine` currently depends on Svelte 5 (Runes) for reactive stores.
- **Rationale:** Accepted for rapid prototyping. Facilitates easy sharing of game state between engine and UI.
- **Future:** May decouple if we need to consume engine from non-Svelte contexts (mobile native, CLI tools, etc.).

### Build Strategy
- **Vision:** `packages/engine` compiles to distributable JS/TS declarations.
- **Reality:** Consumed directly as TypeScript source via Vite alias.
- **Rationale:** Simplifies development. Astro's Vite config resolves `@void-drift/engine` to `../../packages/engine/src`.
- **Trade-off:** Web app cannot use pre-built engine (acceptable for monorepo workflow).

## 8. Lessons Learned

1. **Workspace Protocol Works:** Using `"@void-drift/engine": "workspace:*"` in `apps/web/package.json` correctly resolves to local package.
2. **Vite Aliases Essential:** Astro config needs explicit alias to resolve bare imports: `@void-drift/engine → ../../packages/engine/src/index.ts`.
3. **No Root Code:** Keeping root directory clean prevents "context amnesia" where agents forget which app they're working in.
4. **Gallery Separation:** Moving gallery to its own route (`/gallery`) eliminated hash-routing hacks and improved developer experience.

## 9. Maintenance Notes

- **Adding New Engine Exports:** Update `packages/engine/src/index.ts` to export new APIs.
- **Adding New Routes:** Create new `.astro` files in `apps/web/src/pages/`.
- **Shared Types:** Define in `packages/engine/src/lib/schemas/` using Zod for runtime validation.
- **Design Tokens:** Maintain in `apps/web/src/styles.css` (single source of truth for CSS variables).

---

**Migration Status: COMPLETE AND STABLE** 🎉  
**Ready for:** v0.0.5 (Networking/Lobby) or Product Vision Pivot
