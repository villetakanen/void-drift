# Feature: Project Structure & Scaffolding

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context
This specification defines the foundational architecture of the `void-drift` repository. We utilize a **Monorepo** structure to strictly separate the Game Engine (logic) from the Web Application (presentation). This separation ensures that the core physics and game loop remain framework-agnostic and testable, while the frontend can evolve independently.

**Achievement:** Clean monorepo structure is operational with zero configuration files in root source directories.

### Architecture
- **Package Manager:** `pnpm` (with workspaces enabled).
- **Structure:**
  - `apps/web`: The consumer application (Astro + Svelte 5).
  - `packages/engine`: The shared library (`@void-drift/engine`) containing physics, input, and render logic.
- **Dependencies:** 
  - `apps/web` depends on `packages/engine`.
  - `packages/engine` has minimal dependencies (Svelte, Zod, Firebase).

### Anti-Patterns
- **Do NOT** put source code in the root directory (Context Amnesia risk).
- **Do NOT** allow `packages/engine` to import from `apps/web` (Circular Dependency).
- **Do NOT** use `npm` or `yarn` lockfiles; strictly enforce `pnpm-lock.yaml`.

## Contract

### Definition of Done
- [x] `pnpm dev` at the root starts the `apps/web` development server (port 4321).
- [x] `pnpm -r build` successfully builds `apps/web` (engine consumed as source).
- [x] `packages/engine` exports strongly typed classes: `GameLoop`, `Renderer`, `Camera`, `Physics`, `Input`, `Audio`.
- [x] Root directory contains only configuration files (`package.json`, `pnpm-workspace.yaml`, `biome.json`, `netlify.toml`).

### Regression Guardrails
- **Zero-Root-Code:** No `.ts`, `.js`, `.html`, or `.css` files allowed in root (except config).
- **Linting:** `pnpm -r check` must pass without errors (Biome).
- **Type Safety:** All workspace references must use `workspace:*` or specific versions.

### Scenarios
**Scenario: Developer Setup** ✅
- Given a fresh clone of the repository
- When the developer runs `pnpm install`
- Then all dependencies for `apps/web` and `packages/engine` are installed
- And `pnpm dev` successfully starts the game at `localhost:4321`
- **Status:** VERIFIED - Works as specified

**Scenario: Dependency Isolation** ✅
- Given I am working in `packages/engine`
- When I try to import a UI component from `apps/web`
- Then the build or IDE should flag this as an error (cannot resolve path)
- **Status:** VERIFIED - Dependency graph is unidirectional (web → engine only)
