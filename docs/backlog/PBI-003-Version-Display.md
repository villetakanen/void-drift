# PBI-003: Version Display

**Status:** TODO
**Priority:** Low
**Parent:** Version 0.0.2

## 1. Goal
Display the current application version (from `package.json`) in the UI to help users and testers identify which deployment they are running.

## 2. Requirements
- **Source:** Read `version` from `package.json`.
- **Format:** Display as `α [version]` (e.g. `α 0.0.2`).
- **Position:** Bottom Right corner of the screen.
- **Style:** Small, subtle, semi-transparent (consistent with `ui-overlay`).

## 3. Implementation Plan
1.  **Vite Config:** Use `define` to expose the version string globally as `__APP_VERSION__` (Best practice to avoid bundling the whole package.json).
2.  **TypeScript:** key `src/vite-env.d.ts` to include `declare const __APP_VERSION__: string;`.
3.  **UI:** Update `App.svelte` to render the version string.

## 4. Acceptance Criteria
- [ ] Bottom right shows `α 0.0.2` (or current version).
- [ ] Updating `package.json` updates the UI after build/restart.
