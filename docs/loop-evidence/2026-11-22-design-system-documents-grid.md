# Design system Documents grid

Evidence record, 22 November 2026.

## Intent and human feedback

The designer requested a parent-width document grid for Design System main content: 67ch prose, a smaller golden-section gutter, and an outside track for the remaining width. Default blocks span all three tracks; tables span the first two and asides use the gutter. Below the fit threshold, content stacks in source order. After the initial implementation report, the designer replied “yes! exactly this.” That feedback precedes the typography, panel and editorial work.

The designer then asked for shared prose typography owned by the layout rather than the grid, replied “good,” and requested the standard panel treatment for asides. After the panel change, they said the Surfaces page was “almost there” but asked for writing and examples modeled on Page header, then requested the same editorial pass for Documents grid. No post-rewrite acceptance or human verification event was recorded.

## Delivered

Implementation commit `c597da2097be6d945b799a20ef2ca5d25186fcb9`, based on `8cafa66c`:

- [Shared grid CSS](../../packages/core/src/lib/styles/documents-grid.css) and [Design System layout](../../apps/web/src/layouts/DesignSystemLayout.astro) supply the width query, 16px padding and gaps, three tracks, and the flex fallback. The layout opts MDX into shared prose treatment and styles direct authored asides as standard panels without styling shell rails or nested examples.
- [Documents grid](../../apps/web/src/pages/lab/ds/documents-grid.mdx) demonstrates the gutter note, two-track table, full-width header example and narrow fallback. [Surfaces](../../apps/web/src/pages/lab/surfaces.mdx) keeps its URL, pairs the standard and flat panels, and retains the live dialog in [LabSurfaces](../../apps/web/src/components/lab/LabSurfaces.svelte).
- The [Documents grid](../specs/factory/design-system/documents-grid/spec.md), [Typography](../specs/factory/design-system/typography/spec.md) and [Surfaces](../specs/factory/design-system/surfaces/spec.md) contracts describe the ownership split. Two pre-existing loop records entered the whole-checkout snapshot but are outside this loop.

## Checks and observations

- **Worker handoffs, successive dirty-tree states on `8cafa66c`:** focused grid, typography and surfaces spec lint passed; broader Design System spec lint reported pre-existing metadata findings. The worker reported `pnpm --filter web check` and `pnpm check:contracts` passing after the final editorial pass. These were not runs against a deployed build.
- **Worker handoffs, local shared preview (`localhost:4321`):** Chromium showed Documents grid stacked at 1280px and using the gutter and two-track table at 1920px. The narrow demonstration stacked at both widths. Surfaces was checked at 1280×1000 and 1600×1000 for aside placement, Escape settings, focus confinement and return, hidden deck and inert stage. Earlier wrapper checks reported 12px of vertical scroll on Game field backdrop at 1280×800; no correction or final recheck was reported. Firefox and WebKit were not verified. No durable browser transcript or capture was supplied for this loop.
- **Direct pre-commit checks, final dirty tree:** whole-tree `pnpm lint` passed. The first `pnpm check:contracts` run failed 1 of 21 factory tests because the stalled-emulator test could not read its `emulator-stopped` marker. The immediate rerun passed all 21 without source edits; its output was written to temporary `/tmp/void-drift-doc-grid-contracts.log`. Staged whitespace and commit hooks passed for the landed commit. The cause of the first test failure was not investigated.

## Publication

- **Commit and push:** `git push` reported `8cafa66c..c597da20 main -> main` on `origin`.
- **Deployment and live verification:** neither was performed or evidenced. Browser checks used only the local preview.
