# PBI-011: Polish Live Docs & Cleanup

**Status:** TODO
**Priority:** Medium
**Parent:** Phase 3 (Wrap-Up)

## 1. Problem
The project has successfully migrated to a Monorepo structure (Phase 3), but the documentation and root directory state have lagged behind.
- **Root Clutter:** The root directory still contains Phase 1 source files (`src/`, `index.html`) which confuse the architecture.
- **Outdated Specs:** Specifications like `scaffold-project.md` describe the old single-repo structure. `design-system-core.md` may reference ambiguous paths due to the clutter.

## 2. Requirements

### 2.1. Root Directory Cleanup
- Verify that all necessary logic from root `src/` has been ported to `apps/web/src` or `packages/engine`.
- Delete `src/`, `index.html`, `vite.config.ts`, `app.css` (if redundant) from the root.
- Ensure the root only contains Monorepo config (`package.json`, `pnpm-workspace.yaml`, `.gitignore`, `docs/`, `AGENTS.md`, etc.).

### 2.2. Update `scaffold-project.md`
- Rewrite this spec to describe the **current** Monorepo scaffolding.
- It should explain the `apps` vs `packages` structure.
- It should reference the tooling (Biome, Astro, Svelte 5) as currently implemented.

### 2.3. Update `design-system-core.md`
- Ensure all file path references point to `apps/web/src/...`.
- Clarify where Design Tokens live (`apps/web/src/styles.css`).

### 2.4. Spec Status Update
- Mark `monorepo_migration.md` as **COMPLETED** or archive it.
- Ensure `project-vision.md` reflects the "Known Deviations" (already updated).

### 2.5 Update `AGENTS.md`
- The "Project Structure" section (Sec 6) is completely wrong (shows single-repo structure). Update it to show the Monorepo structure (`packages/` and `apps/`).
- Update "Command Registry" (Sec 4) to reflect pnpm workspace commands (e.g., `pnpm dev` at root, or usage of filters).
- Ensure "Tech Stack" (Sec 2) mentions the Monorepo.

### 2.6 Update `README.md`
- The current README is the default Vite template artifact.
- Replace it with a project-specific README.
- **Header:** "Void Drift - Newtonian Chaos in a Shared Browser Tab".
- **Quick Start:** Instructions to install `pnpm`, run `pnpm install`, and `pnpm dev`.
- **Architecture:** Brief mention of `apps/web` (Game Site) and `packages/engine` (Core Logic).

## 3. Acceptance Criteria
- [ ] Root directory is clean of source code (no `src/`, no `index.html`).
- [ ] `pnpm dev` in root still correctly starts the `apps/web` (via turbo/pnpm filter).
- [ ] `docs/specs/scaffold-project.md` accurately describes the Monorepo structure.
- [ ] `docs/specs/design-system-core.md` references correct paths.
- [ ] `AGENTS.md` accurately reflects the project structure and pnpm commands.
- [ ] `README.md` provides correct project info and start-up instructions.

