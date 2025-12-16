# PBI-010: Netlify Deployment Readiness

**Status:** Done
**Priority:** Medium
**Role:** @DevOps / @Lead
**Parent:** Phase 1 (Foundation)

## 1. Goal
Ensure the monorepo is ready for seamless deployment to Netlify. The build process must be triggered from the root and produce a static asset bundle that Netlify can serve without requiring a `netlify.toml` configuration file.

## 2. Requirements

### 2.1. Build Script
-   The root `package.json` must have a `build` script.
-   Running `pnpm build` at the root must successfully build the `apps/web` application.
-   The command should trigger the Astro build process (`astro build`).

### 2.2. Static Output
-   The web application (`apps/web`) must be configured to output a static site (Astro default).
-   Ensure the final build artifacts are located in a standard directory (e.g., `apps/web/dist`) that can be easily configured in the Netlify UI (Publish directory).

### 2.3. Netlify Config File
-   Create a `netlify.toml` file in the root.
-   Configure the build command and publish directory to ensure zero-config deployment for new users/forks.

## 3. Implementation Tasks
- [x] Verify/Update root `package.json` `build` script to execute `pnpm --filter web build`.
- [x] Verify `apps/web/astro.config.mjs` is set for static output (default).
- [x] Create `netlify.toml` with `command = "pnpm build"` and `publish = "apps/web/dist"`.
- [x] Run `pnpm build` locally to confirm `apps/web/dist` is created and contains `index.html`.


## 4. Acceptance Criteria
- [ ] Running `pnpm build` in the root directory succeeds without errors.
- [ ] A `dist` directory is generated in `apps/web` containing the compiled static site.
- [ ] The build output includes the generated `index.html` and assets.
