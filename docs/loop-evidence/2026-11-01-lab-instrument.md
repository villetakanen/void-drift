# Lab instrument study and v1 — closure evidence

Closed 2026-11-01 by explicit owner instruction: "this is done, close loop". This is a
bounded evidence record. It does not state causes, lessons or process changes.

## Intent and scope

Owner brief (paraphrased from the first message): design a Lab component that studies
can also embed full-window with scroll snap, for comparing flight paths, engines and
hulls, because studies kept recreating such tools. First settle what it looks like,
what it contains and how its overlay pane works; then how it functions and how skills
call it. The brief carried the givens of a failed earlier study
(`docs/loop-evidence/2026-11-01-path-instrument-closure.md`).

Study page `apps/web/src/pages/lab/studies/lab-instrument-2026-11-01.astro`, route
`/lab/studies/lab-instrument-2026-11-01`, metadata in `apps/web/src/data/studies.ts`
(status `accepted`, phase `integration`).

## Sequence, owner decisions and feedback

Quotes are short owner extracts; paraphrases are attributed.

1. 01 and 02.1 (anatomy, pane from left or right). Owner: "Why are we like discussing
   givens? Why are we providing like design screens for givens?" The pane's mechanics
   were then recorded in 01 as a constraint (right edge, full height, starts hidden,
   menu button in the top-right corner). Owner later: the pane "doesn't need to like
   slide, just visible, not visible", placed on the container, unscaled.
2. Owner said the real design problem was a configuration that agents write, the
   designer tweaks and copies back. 02.2 defined a vehicle as a game loadout plus
   sparse changes. Owner: "Yes, build 02.2."
3. 02.3: owner asked for full-window embedding and a split between diagram controls
   (on the diagrams) and investigated values (in the pane). Owner: "These are very
   good. Now we're going forwards."
4. 02.4 toggle: first round redone at the owner's request ("something kind of was off
   in my prompt"); no-outline two-part toggle chosen; hover option D (faint lime tint)
   added at the owner's suggestion and accepted ("Yes, keep D").
5. 02.5 slider: owner rejected the first round ("it no longer looks like a slider in
   any of the examples"), a lime-free round ("too boring"), and accepted "B · Ring".
   Owner: "no step buttons, those were hallucinations."
6. Grid: owner asked whether elements sit on the 4px grid; then "the elements must fit
   to grid, their internals dont" and inline elements need not snap; vertical rhythm
   and grid-sized inline gaps kept.
7. 02.6 burns: owner defined three 14 s burns, chose lanes over hue, labels B1–B3, and
   soft white lit lanes ("soft white. this element is now decided."). Owner asked for
   the switcher to sit on the strip.
8. Owner: "we should not have adjusted 2.3 instrument, its historic, before this
   decision." Sections 02.1, 02.3 and later 02.7 and 02.8 were given frozen copies
   restored from this session's file-history snapshots.
9. Layout: owner recorded "the view has 2 columns, both 50%" with no header or footer.
   Two whole-screen look rounds of 02.8 were rejected ("provide nothing I can discuss
   or decide on"; "we stopped doing a component level thing and started putting it to
   some sort of a layout"). Owner then listed fixed givens for the path tool and a
   component-level comparison followed.
10. 02.8 path tool: owner set study-local elevation tokens, then lch steps
    (5.5% 10 290; 11% 15 290); black shadow edge and the instrument-display material
    accepted. 02.9: numbers on the display, moved by the owner to one larger line,
    bottom right.
11. 02.10–02.11: graph component redone after "these are graphs, they need
    measurements"; "the component is 1 graph, not 3"; composed view with burn row,
    time slider, legend; owner decision "all graphs are auto-scale, not fixed scale."
12. Owner proposed the pane overlay for v1: elevation 3 on "the same progression",
    45% wide, an 11% backdrop, content filled by agents. The value
    `lch(16.5% 20 290)` is the assistant's reading of "same progression", recorded as
    an assumption in 03. Owner on elevation 3 in place: "Yes, continue".
13. 03 and 04 written; owner: "04 seems to omit ds pages for the new comps"; 04 then
    gained design-system promotion and reference pages. Owner: "Build v1", then
    "Yes, continue" at both review points, then "Commit v1".

## Changes delivered

Local commit `c7e93758d7c0e73f819d9c1bd6288a9676c11df2` on `feat/0-4-0`,
"feat(web): add the Lab instrument for comparing vehicles", 63 files:

- `apps/web/src/lib/instrument/`: configuration schema, burns, calculation, starting
  document.
- `apps/web/src/components/lab/instrument/`: `LabInstrument`, `PathPane`, `TimeGraph`,
  `BurnRow`, `Legend`, `OverlayPane`, `DocumentPanel`, `InstrumentEmbed`.
- `apps/web/src/components/inputs/`: `Toggle`, `RingSlider`.
- `packages/core/src/lib/styles/tokens.css`: `--color-elev-1..3`,
  `--surface-display`, `--shadow-display`, `--color-backdrop`.
- Lab pages `/lab/instrument`, `/lab/inputs` (`/lab/buttons` kept as an alias),
  `/lab/graphs`, `/lab/instrument-parts`, `/lab/surfaces`; Lab nav updated.
- `docs/specs/lab-instrument.md` (new), sections in `docs/design.md` and
  `docs/specs/design-system-core.md`, one rule in
  `.agents/skills/design-study/SKILL.md`.
- Tests `packages/mode-a/src/lib/lab-instrument.test.ts`,
  `tests/browser/lab-instrument.spec.ts`.
- The study page and its study-local components, including frozen copies.

The commit left out `.claude/`, another session's LHI Wasp files and that session's
entry in `studies.ts` (staged with only this study's entry).

## Checks

Run from the repository root on the working tree shortly before the commit; the tree
also held another session's uncommitted LHI Wasp files. Local macOS shell.

- `pnpm exec vitest run`: 23 files, 107 tests passed (includes 9 new instrument tests).
- `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`:
  0 errors, 0 warnings.
- `pnpm check` (astro check): 0 errors, 0 warnings.
- `pnpm exec tsc -p tsconfig.check.json`: exit 0.
- `pnpm check:contracts`: passed.
- Playwright, full browser suite: 25 passed. Run with a scratch config on port 4326
  because port 4322 was held by another process; the config and results lived in the
  session scratchpad and are not retained.
- `tests/browser/buttons.spec.ts` first failed after the inputs page was added (three
  `status` roles from slider `<output>` elements); the slider readout became
  visual-only and the unchanged test passed.
- `pnpm lint` (repository-wide): **failed** on files outside this change
  (`WaspLowPolyVariants.astro`, `lhi-wasp.astro`; earlier also
  `docs/specs/design-system-core.md` and `packages/core/src/lib/styles/flight.css`).
  Biome checks scoped to this change's files passed.
- Not run: `pnpm verify`, `pnpm build`, Firebase-backed tests.
- Browser inspection in the in-app preview (local dev server, 1366 × 1024 emulation):
  rendering, real clicks, drags and key presses on each stage. The preview's
  screenshots were intermittently stale; positions were confirmed from the DOM.
- Unavailable: a physical iPad; no device review is recorded.

## Publication

Local commit only. Not pushed, not deployed, no live verification.

## Findings (observations only)

- The study went through 02.1–02.11; several rounds were redone or removed after owner
  feedback (items 1, 4, 5, 9, 11 above).
- Applying later decisions to a shared component changed earlier sections' examples
  until frozen copies were introduced (item 8).
- The dev server served stale page styles once (a restart fixed it) and was once
  stopped by the app mid-turn; a recurring console 500 was not traced to a resource.
- Another session edited the same checkout during the loop; its files were left
  uncommitted and untouched by the commit.

## Unknowns and evidence gaps

- iPad readability: the specification's last Definition of Done item stays open. The
  closing instruction "this is done" does not state whether a device review took
  place; the study is therefore left `accepted`, not `integrated`.
- The broken-document view is covered by schema unit tests only, not in a browser.
- Copy JSON was not exercised against a real clipboard.
- Calculation omits gravity, power limits and part mass or chassis changes (stated in
  the specification).
- Screenshots, Playwright traces and the scratch config are not retained.

## Later evidence (after closure)

- 2026-11-01, after the closure commit: asked whether the iPad review was done, the
  owner answered "Yes, reviewed" (an owner statement about readability on the iPad;
  no notes, device model or screenshots were given). On that basis the specification's
  last Definition of Done item was ticked and the study was marked `integrated`.
