# PBI-011: Polish Live Docs & Cleanup

**Status:** ✅ COMPLETED
**Priority:** Medium
**Parent:** Phase 3 (Wrap-Up)
**Completed:** 2024

## 1. Problem
The project has successfully migrated to a Monorepo structure (Phase 3), but the documentation and root directory state have lagged behind.
- **Root Clutter:** The root directory still contains Phase 1 source files (`src/`, `index.html`) which confuse the architecture.
- **Outdated Specs:** Specifications like `scaffold-project.md` describe the old single-repo structure. `design-system-core.md` may reference ambiguous paths due to the clutter.

## 2. Requirements

### 2.1. Root Directory Cleanup ✅
- ✅ Verified that all necessary logic from root `src/` has been ported to `apps/web/src` or `packages/engine`.
- ✅ Deleted `src/`, `index.html`, `vite.config.ts`, `app.css` from the root.
- ✅ Ensured the root only contains Monorepo config (`package.json`, `pnpm-workspace.yaml`, `.gitignore`, `docs/`, `AGENTS.md`, etc.).

### 2.2. Update `scaffold-project.md` ✅
- ✅ Rewritten to describe the **current** Monorepo scaffolding.
- ✅ Explains the `apps` vs `packages` structure.
- ✅ References the tooling (Biome, Astro, Svelte 5) as currently implemented.

### 2.3. Update `design-system-core.md` ✅
- ✅ Ensured all file path references point to `apps/web/src/...`.
- ✅ Clarified where Design Tokens live (`apps/web/src/styles.css`).

### 2.4. Spec Status Update ✅
- ✅ Marked `monorepo_migration.md` as **COMPLETED**.
- ✅ Ensured `project-vision.md` reflects the "Known Deviations" (already updated).

### 2.5 Update `AGENTS.md` ✅
- ✅ Updated "Project Structure" section (Sec 6) to show the Monorepo structure (`packages/` and `apps/`).
- ✅ Updated "Command Registry" (Sec 4) to reflect pnpm workspace commands.
- ✅ Ensured "Tech Stack" (Sec 2) mentions the Monorepo.

### 2.6 Update `README.md` ✅
- ✅ Replaced default Vite template artifact with project-specific README.
- ✅ **Header:** "Void Drift - Newtonian Chaos in a Shared Browser Tab".
- ✅ **Quick Start:** Instructions to install `pnpm`, run `pnpm install`, and `pnpm dev`.
- ✅ **Architecture:** Brief mention of `apps/web` (Game Site) and `packages/engine` (Core Logic).

## 3. Acceptance Criteria - ALL MET ✅
- [x] Root directory is clean of source code (no `src/`, no `index.html`).
- [x] `pnpm dev` in root correctly starts the `apps/web` via pnpm workspace filter.
- [x] `docs/specs/scaffold-project.md` accurately describes the Monorepo structure.
- [x] `docs/specs/design-system-core.md` references correct paths.
- [x] `AGENTS.md` accurately reflects the project structure and pnpm commands.
- [x] `README.md` provides correct project info and start-up instructions.

## 4. Completion Notes

All documentation has been updated to reflect the current v0.0.4 monorepo architecture. The following specs were polished:

1. **monorepo_migration.md** - Marked as COMPLETED with detailed post-migration state
2. **scaffold-project.md** - Updated to reflect current structure and mark items complete
3. **game-engine-phase1.md** - Updated paths and marked Phase 1 as complete
4. **design-system-core.md** - Corrected paths and documented token system
5. **gallery_and_assets.md** - Updated routing from hash-based to file-system routing
6. **controls-system.md** - Documented mobile and desktop implementations
7. **star_mechanics.md** - Marked complete with implementation details
8. **planet-mechanics.md** - Marked complete with orbital mechanics details

Root directory is now clean with only configuration files. All source code properly organized in `apps/` and `packages/` directories.

