# Shared page header loop — 2026-11-21

## Intent and decisions

Source: the closing session's conversation account, supplied by the coordinating
agent. This record covers the shared header reference, its examples and frame,
Hangar adoption, then Lab/Studies adoption and peer navigation.

- The designer supplied Hangar as the visual model and requested an MDX reference.
  A premature wider rollout was backed out after the designer restricted the work
  to the Design system; wider adoption was subsequently authorized in stages.
- Design system, Lab and Studies are peers despite their URL nesting. Package
  restructuring was deferred.
- Identity stays left and controls right in one row, without responsive wrapping.
  Site identity uses lead size; the optional `// pageName` uses body size. When a
  page name is present, the site name links to its overview. Identity is plain
  text or links, not a document heading.
- The MDX page owns its H1/H2 structure, three labelled examples without a width
  slider, input reference and consumed-token table. ComponentFrame has its own
  MDX reference, fills its container, establishes an inline-size CSS container,
  and uses a standard light dashed border with no fill. Hosts own padding:
  2× grid vertically and 4× horizontally (8px/16px).
- Hangar subsequently adopted the component. Its approved page padding is
  24px/36px with a 16px section gap, preserving its content.
- Lab's shared header belongs right of the tray, not across the whole page.
  Studies keeps its article H1, status and question below the shared header.
  Each development site links to the other two, omitting itself: `DS` →
  `/lab/ds`, `lab` → `/lab`, `studies` → `/lab/studies`.

## Revisions and inspected sources

Direct inspection at closure found branch `feat/0-7-0` at
`3a19a9bf0f714be9a46b0202208f96128d552297`, with its local remote-tracking ref
`origin/feat/0-7-0` at the same commit. No remote fetch was performed.

| Revision | Scope and publication evidence |
| --- | --- |
| `fa4c4758af6061dcb6fcdfd5414c91ea2b1e1312` | Shared Design system/header reference and rollback snapshot. Commit exists locally; push reported in the session. The commit also contains earlier loop records outside this loop. |
| `3a19a9bf0f714be9a46b0202208f96128d552297` | Hangar adoption and spacing, with header/Hangar contracts. Commit exists locally; push reported in the session and local tracking ref matches. |
| Uncommitted after `3a19a9bf` | Lab/Studies adoption and peer crosslinks. Current source was inspected; it is not asserted to be the exact snapshot of earlier checks. |

Inspected source: [shared header](../../apps/web/src/components/PageHeader.svelte),
[ComponentFrame](../../apps/web/src/components/lab/ComponentFrame.svelte),
[header reference](../../apps/web/src/pages/lab/ds/page-header.mdx),
[Hangar](../../apps/web/src/components/ShipBuilder.svelte),
[header contract](../specs/factory/design-system/page-header/spec.md),
[Hangar contract](../specs/game/hangar/spec.md), and the three layouts below.
These support the current composition and spacing described above.

The six-file adoption scope was dirty at closure. SHA-256 values identify the
inspected files only; concurrent changes elsewhere and overlapping edits are not
attributed to this loop or certified by earlier checks.

| File | SHA-256 at closure inspection |
| --- | --- |
| [DesignSystemLayout](../../apps/web/src/layouts/DesignSystemLayout.astro) | `51af478dbc28c8de83528830e3679f693d4bb03844d45a3961228f8735cc2a1d` |
| [LabLayout](../../apps/web/src/layouts/LabLayout.astro) | `87261efa985ae1f2fdf247b23e2855d4075030bd43a98d517ca9f6159d75a915` |
| [StudyLayout](../../apps/web/src/layouts/StudyLayout.astro) | `047babbe1954857ada269c6eca39542553afaa1501a060095b306a4b565de8b1` |
| [Header contract](../specs/factory/design-system/page-header/spec.md) | `d7e4912ab451a3b9b289b220e315b4e26b8c4314e11158de76ef3100811c36fe` |
| [Lab contract](../specs/lab/spec.md) | `4951d520aff2d5ad57ab5438e2b0ba7862d0b681f8cd2bbccb309d02dea5026a` |
| [Studies contract](../specs/studies/spec.md) | `e4411cc3c64aa491fea91e4a67e6dfa6b703eb832c96ac35dbc200fcdf8ca12c` |

## Checks and observations

The retained [quick verification report](../../artifacts/verification/2026-11-21T18-25-48.666Z-JjbqZC/report.json)
was inspected directly. It ran 18:25:48–18:26:13 UTC on macOS arm64, Node
v24.14.0, at `fa4c4758` with dirty ShipBuilder, header contract and Hangar contract.
Its source fingerprint was
`f195716475e71895571b800f5f9b74f9373a6cb8ae2c81102ebbd0174ba50f8a`;
`sourceUnchanged` was true. This predates the Hangar commit and does not claim a
clean committed revision was tested.

| Command/result | Evidence |
| --- | --- |
| `pnpm run check:contracts`, `pnpm run lint`, `pnpm run check:types`, `pnpm run test`: passed, exit 0 | Retained report, with per-command logs in that run directory. |
| `check:commits`, `build`, `test:browser`, `test:rules`, `test:competition`: skipped | Report marks the run partial, selected checks passed, overall `passed: false`. |
| First snapshot formatting, lint, types and hooks: passed | Worker report relayed by coordinating agent; exact commands/logs unavailable here. |
| Latest crosslink checks: Astro 284 files, zero diagnostics; affected header/Studies specs zero findings; contracts 18 tests passed; diff whitespace clean | Worker report relayed by coordinating agent; exact commands and tested dirty-tree fingerprint unavailable. |
| Lab subtree: 37 legacy findings, none on edited root; earlier global check: 168 legacy issues | Session reports, not rerun or independently classified at closure. These are not clean whole-repository spec results. |

Browser findings below are the coordinating agent's session reports from the
shared preview at 1280px viewport width, not independently repeated during
closure. Captures were ephemeral tool output with no retained image files.

- All three header examples were inspected; computed lead/body sizes were
  19.2px/15.2px. Equal example frames and subsequently 8px/16px padding were checked.
- Hangar header and content aligned at x=36 and right edge=1236. Header top was
  y=24, height 44px; chooser began at y=84. Playground persisted through reload
  and was restored Off; Settings and return navigation were exercised.
- Lab header was at x=266, y=8 after a shared-preview restart. A long Studies
  title concerning offscreen rendering fit the header; article content remained.
- Latest peer navigation was exercised through Lab → DS → studies → Lab,
  confirming the requested labels and destinations.

## Feedback, publication and limits

The designer said “This is very good” about the simplified examples and “Good”
about aligned Hangar. These are scoped design comments from the session, not
acceptance of other pages or evidence of general usability.

The two snapshots above were reported pushed. Later Lab/Studies adoption and
crosslinks remain uncommitted at this inspection. No deployment was requested or
performed for this loop; the preceding 0.7.0 release record is unrelated. There is
no live-production verification for these changes.

Historical browser captures and detailed latest-check logs are unavailable in
this record. The retained quick report is a local artifact and may not travel
with the tracked document. Concurrent work makes the current whole dirty tree
an unsuitable identity for earlier checks. Closure ran no product tests and
changed only this evidence document; it establishes no release-readiness or
broader acceptance claim.
