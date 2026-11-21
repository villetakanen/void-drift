# Instrument parts page refactor · 21 November 2026

## Intent and boundary

The owner asked for `/lab/ds/instrument-parts` to become a proper design-system
reference for instrument-scoped parts, kept together because their contracts
make sense in the context of an instrument. The owner approved naming the
parameter surface `SideSheet` and requested one long page rather than one page
per part. Earlier in the loop, the owner asked to move the old
`/lab/instrument-parts` page to MDX and fix its heading structure.

The owner said: “I don't want to have a page for each of these things, because
these are only used inside an instrument, and not, like, across the app.” On the
component rename: “Yeah, make it real. Approved.”

## Changes delivered

- Replaced the old `.astro` reference page with
  [`instrument-parts.mdx`](../../apps/web/src/pages/lab/ds/instrument-parts.mdx).
  It has one H1, sections for shared instrument parts and display parts, API
  tables, and Svelte examples. The display section distinguishes PathPane,
  TimeGraph and Legend from parts used across multiple instrumentation views.
- Added [`InstrumentPartsExample.svelte`](../../apps/web/src/components/lab/InstrumentPartsExample.svelte)
  for the live examples. The single page documents SideSheet, BurnRow,
  PathPane, TimeGraph and Legend.
- Renamed `OverlayPane.svelte` to
  [`SideSheet.svelte`](../../apps/web/src/components/lab/instrument/SideSheet.svelte)
  and updated Lab and study imports. Its public props and opening, dismissal,
  and focus-return behavior were retained.
- Folded the former Graphs page into Instrument parts. Removed
  `apps/web/src/pages/lab/graphs.astro`, `apps/web/src/components/lab/LabGraphs.svelte`,
  and `apps/web/src/components/lab/MotionInstrumentParts.svelte`; removed the
  Graphs navigation entry and moved its source references to the combined page.
- Updated the Lab registry, design-system contract, side-sheet contract,
  Motion instrument spec and contract checker. No redirect was added for the
  old routes `/lab/instrument-parts` and `/lab/graphs`.

## Evidence and checks

Checks ran in the local macOS shared checkout against a dirty worktree based on
HEAD `3a19a9bf0f714be9a46b0202208f96128d552297`. No commit contains these
changes. Other files were also dirty; their changes are not attributed to this
loop. Command output was observed in the conversation and was not saved as a
separate report.

| Invocation / source | Observed outcome |
| --- | --- |
| `pnpm --filter web build` | Passed; Astro built 123 pages. |
| `node scripts/check-contracts.mjs && git diff --check` | Passed; registry reported 16 Lab pages, 10 shared parts and 4 earlier-address pages. |
| Initial `pnpm exec biome check` on the target files | Failed with format/import-order diagnostics in 3 files. `pnpm exec biome check --write` applied targeted formatting; the final check passed on 4 files with no fixes. |
| `pnpm check:specs docs/specs/factory/design-system` | Passed, 0 findings. |
| `pnpm check:specs docs/specs/factory/design-system/side-sheet` | Passed, 0 findings. |
| `pnpm check:specs docs/specs/lab/motion-instrument` | Passed, 0 findings. |
| `pnpm check:specs docs/specs/lab/gravity-tuning` | Failed with 16 format findings: missing YAML frontmatter and expected headings. The legacy spec structure was not migrated. |

In Chrome on the shared preview at `/lab/ds/instrument-parts`, the page showed
the new heading hierarchy and all five examples. Opening the side sheet showed
the host content; Escape closed it and focus returned to the open button. One
initial browser snapshot after route changes showed a 404, followed by the
rendered page in the same navigation call; a later reload also showed the page.
The cause of that first snapshot is unknown. The browser screenshot and
accessibility output were not retained as files.

No unit or end-to-end test suite was run. The Gravity tuning spec check is the
only recorded check failure. No human playtest or design acceptance of the
finished page is recorded beyond the owner's scope and rename decisions.

## Publication and evidence gaps

The page is available in the local shared preview only. No commit, push,
deployment or hosted verification was performed. The old routes were removed;
their 404 behavior was not separately checked. Historical loop records and
plans may still name the former routes and component; they were not rewritten.
