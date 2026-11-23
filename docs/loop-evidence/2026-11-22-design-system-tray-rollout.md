# Design system Tray rollout

Evidence record, 22 November 2026.

## Intent and human feedback

The user asked: “there's now http://localhost:4321/lab/ds/tray - lets make it real on ds itself.” This authorized applying the selected Option A reference (`c4830f4b99416afd08b05e110c3d3063121ae8fb`) to the Design system itself, not migrating Lab, Design studies or game navigation. It was a request to implement, not post-change human acceptance; none is recorded. The [21 November Lab tray cleanup](2026-11-21-lab-tray-design-system.md) is a separate loop.

## Delivered

Work started at `9fd97337afaa39ba37c6a502dcb11d0f3add8d3f` with unrelated Plasma archive edits already in the working tree. The rollout diff shows:

- [Tray.svelte](../../apps/web/src/components/Tray.svelte) renders native links on the server without hydration in both the [Design system layout](../../apps/web/src/layouts/DesignSystemLayout.astro) and the [framed example](../../apps/web/src/pages/lab/ds/tray.mdx). Option A uses a base surface with neutral resting text, selected text and a leading edge for the current page, a hover wash, and a separate keyboard focus outline.
- The layout resolves the current destination from the [registry](../../apps/web/src/data/lab-pages.ts), keeps the header above the 250px independently scrolling rail, and preserves the footer destinations. The [Design system overview](../../apps/web/src/pages/lab/ds/index.mdx) now lists Tray in the component catalog rather than in a separate reference section. The Lab index picks up the registry entry through its existing projection; Lab and Design studies navigation did not change.
- The [Tray](../specs/factory/design-system/tray/spec.md), [colour](../specs/factory/design-system/colour/spec.md), and [parent Design system](../specs/factory/design-system/spec.md) contracts record the shared component, the scoped neutral-link exception, and catalog discovery.

## Checks and observations

- **Worker handoff, local rollout working tree based on `9fd97337`:** `pnpm check:types`, `pnpm lint`, `pnpm check:contracts`, and `git diff --check` passed. The prior spec phase reported 21 passing factory tests. The individual Tray and colour `pnpm check:specs` runs passed; the Design system subtree run reported 10 pre-existing provenance findings, so it was not a clean subtree pass. Raw check output was not retained with this record.
- **Worker handoff, same rollout on the shared preview (`http://localhost:4321`):** an ephemeral Chromium run with JavaScript disabled at 1280×800 and 1440×900 reported the correct current link in the live rail on Overview, Tray, and all four earlier addresses (`/lab/tokens`, `/lab/typography`, `/lab/surfaces`, `/lab/logomark`). Tab/Enter activation, visible focus and hover, independent rail and stage scrolling, and stable header geometry were reported. The worker reported a pixel-for-pixel match of the framed demo to the prior Option A.
- **Coordinator review during rollout:** directly reviewed the diff, server-rendered output (no duplicate IDs), and the 1280×800 screenshot. At closure, the two saved viewport images were inspected: both show the header above the rail and stage, with Tray marked current in the rail and demo. The saved Option A before/after PNGs also have identical SHA-256 hashes. Static captures do not establish the interaction results reported above.

Local evidence, ignored by Git and not guaranteed to persist: [1280×800 capture](../../artifacts/tray-rollout/tray-1280x800.png), [1440×900 capture](../../artifacts/tray-rollout/tray-1440x900.png), Option A [before](../../artifacts/tray-rollout/option-a-before.png) and [after](../../artifacts/tray-rollout/option-a-after.png), and [pre-rollout header geometry](../../artifacts/tray-rollout/header-before.json). No durable browser transcript is available. Historical checks were not rerun for closure.

## Publication

- **Local commit:** Before this record was added, the working tree was clean on `main`. `git show --stat HEAD` and the scoped diff show the rollout files in `8cafa66c10c89757553edd1b56ed555699df5a3e` (`chore(lab): archive the Plasma behaviour study`). The Plasma retirement shares that commit but is not part of this loop.
- **Origin publication:** The locally inspected remote-tracking ref `refs/remotes/origin/main` pointed to the same full commit as `HEAD`. This is local evidence of publication to origin, not a fresh remote query or a record of who pushed or when.
- **Deployment and live verification:** Neither is evidenced. The shared-preview observations were local, not checks of a deployed site.
