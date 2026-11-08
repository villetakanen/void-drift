# Derelicts design study — stopped

Date: 2026-11-06 (Europe/Helsinki). Outcome: **failed design loop; stopped,
not doable in this cycle**, at the owner's explicit request. No design was accepted.
This is not a finding that the feature is technically infeasible.

## Intent and boundary

Develop derelict look, feel, story and function from the current test-flight
encounter and a supplied Split Spine image. Established intent: remnants of a
broken megastructure sent toward known systems, passing border to border;
destruction creates physical splinters and releases an energy fragment to chase.
The current near-ship spawn and lifetime were distinguished from the intended
border-to-border journey. Production behavior was not changed by this study.

## Delivered work and decisions

- [Study page](../../apps/web/src/pages/lab/studies/derelicts-2026-11-06.astro)
  and [registry](../../apps/web/src/data/studies.ts): problem opening, exploration,
  now stopped. Readiness and scope were not reached.
- [Procedural sketch component](../../apps/web/src/components/studies/DerelictConstruction.astro):
  final 02.3 construction and hypothetical continuation, retained as an unaccepted attempt.
- [Supplied reference](../../apps/web/public/studies/derelicts-2026-11-06/reference.png)
  retained as inspiration, not an instruction or accepted energy-fragment design.
- 02.1 compared a backbone and cross ties. The owner said the original's almost
  blade-like shape language had been lost, and connections/background needed to
  be dark and below the shapes and fragment. Replaced drawings; retained findings.
- 02.2 used tapered parts over a dark bed. The owner said the nature and desired
  feel had not been defined and the loop was close to failing. Replaced drawings;
  retained the framing issue.
- Before 02.3, the owner agreed to explore the proposed character: a torn piece
  of something immense, still held together by a structure surviving its purpose.
  02.3 drew parallel ribs, unequal tears and a dark lower body. Agreement to this
  exploration was not acceptance of its resulting artwork.
- Final owner assessment: “Ok, this loop failed.” Instruction: “close loop and
  mark study as not doable to end”. Study status uses the supported `stopped` value.

## Revision and verification evidence

Closure inspection found HEAD `09ab3e2ea4eda4c00610c098af7cc9016e8481f0` with a dirty
working tree including many unrelated, pre-existing edits. Study work remains
local working changes; no study commit, push, deployment or live verification was
performed in this conversation.

Pre-closure SHA-256 identities (not whole-tree verification identifiers):

- Sketch component: `3b4ed4cd21b1d95f25983a7891d465b72fca4e76e24ca65a518addefced4f4f9`.
- Study page: `b941318f72407284870337904fcec00a06d9a7770beabfab6293b8216d890393`.

Earlier tool results in this conversation, on the evolving local working tree:

- `pnpm --filter web check`: passed at opening, 02.1, 02.2 and 02.3;
  final exploration run reported 201 files, zero errors, warnings or hints.
- Targeted `pnpm exec biome check ... --write`: passed for study files, applying
  formatting. These checks establish source correctness, not design acceptance.
- Local Playwright Chromium screenshots at 1280px: captured and visually inspected
  for each round. 02.3 reported document width 1280 and the older 02.1 disclosure
  closed. Opening keyboard check focused the Lab navigation link.
- Initial restricted Chromium launch failed with macOS permission denial;
  subsequent authorized launch succeeded. The failure is not counted as a pass.
- Full repository, gameplay, collision, breakup and release suites were not run
  for this static design study. Human design assessment was failure despite the
  successful page checks.

Closure changes are limited to outcome text, registry status and this record.
Only targeted formatting validation is run for closure; previous checks are not
rerun to reconstruct historical evidence.

## Evidence limits

Conversation tool outputs are the source for the historical check results; no
standalone check logs or full working-tree fingerprints were retained. Screenshots
remain temporary at `/tmp/derelicts-021.png`, `/tmp/derelicts-022.png`,
`/tmp/derelicts-023-form.png` and `/tmp/derelicts-023-origin.png`; they were present
at closure but are not durable repository artifacts. Earlier replaced geometry
is not retained in source. Final source and supplied reference remain inspectable.

No accepted fragment form, flight behavior, collision shape, destruction sequence
or implementation scope resulted. No general lesson, signal, process change or
recommendation is derived by this closure record.
