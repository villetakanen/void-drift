# Ship slot language — loop evidence

Closed 2026-10-31. Scope: slot-state study, accepted appearance, four-type
compatibility mapping and local builder integration. Source: this chat and the
repository observations below. Closure collects evidence; it does not promote lessons.

## Decisions and delivery

- Four primary states combine empty/filled with selected/unselected. A linked
  secondary cannot be selected independently; linking is not engine-specific.
- Accepted appearance: 54×64 reference fill, 4-unit fill-to-border gap, 1.5-unit
  border; retain mount angles. Empty fill is 35% acid lime with void-dark border;
  filled fill is 35% void-dark with acid-lime border. Dashed borders and connectors
  follow that same border color.
- Empty-slot E/W/Q/+ symbols use 70% opacity. Number labels retain ivory text on
  35% dark backing. Vertical type text runs upward from the lower-left corner,
  matches the border and has no backing.
- Approved types: Engine E accepts engines; Weapon W accepts weapons; Equipment Q
  accepts weapons/utilities; Universal + accepts all. Side/hull/aft mounts map to
  Engine/Equipment/Universal. Existing part IDs and saves remain compatible.
- Slots appear only in the builder; flight shows hull and equipped items.
- The initial limited playground was expanded after feedback, then controls for
  settled properties were removed. Number labels were retained after an explicit
  correction to the proposed replacement with vertical text.

Delivered sources: [study](../../apps/web/src/pages/lab/studies/ship-slot-language.astro),
[preserved appearance](../../apps/web/src/components/studies/SlotStatesAccepted021.svelte),
[builder](../../apps/web/src/components/ShipBuilder.svelte),
[renderer](../../packages/mode-a/src/lib/build-renderer.ts),
[slot contract](../../packages/mode-a/src/lib/schemas/loadout.ts), and
[contract tests](../../packages/mode-a/src/lib/slot-types.test.ts).
The study's four numbered parts record framing, exploration, readiness and delivery.

## Verification and revision evidence

At closure HEAD is `1bf9908c1aa9ed7be8b3f6b2d9d90618139457ae`; the working tree
contains extensive uncommitted slot, ship and engine work. No isolated slot commit
was produced in this chat. Later changes to shared files cannot all be attributed
to this loop. No push or deployment was performed by this chat; external publication
status was not inspected.

During delivery, tool outputs in this chat recorded passing contracts, commit-history
checks, lint, types, unit tests and build. The first browser attempt failed to bind
its local port. An overlapping test run encountered a missing trace artifact; a clean
full rerun passed all 15 browser tests. After Heavy Corvette framing was corrected,
its targeted browser test passed again, as did types and build. Java was unavailable
for the original rules/competition gates; that unified run failed. Screenshots of
Fighter and Heavy builder rendering were inspected. Human acceptance of the study
appearance does not establish acceptance of every delivered chassis layout.

A **later** saved [verification report](../../artifacts/verification/latest.json),
directly inspected at closure, records all nine gates passing on 2026-10-31,
17:09–17:11 Helsinki time, Node v24.14.0, darwin/arm64, at the same HEAD with dirty-tree
fingerprint `0d7b5401a3fbc13bf5e7e9960e9df39f8e97d1688caa76eff889ed2c9f079c6a`.
It reports unchanged source during that run. This is subsequent evidence, not a
retroactive pass for the original loop. Current status differs from its captured
status; the current tree is not certified by that report. Individual log files are
mutable and may have been overwritten by newer runs. No tests were rerun for closure.

## Human feedback and observed writing issues

At closure the owner described the process as working “quite well” and “very cool
and nice.” The criticism concerned the study-page writing: “discussion from the
agent to me” instead of “design study documentation,” and “very sloppy and very
verbose.” The owner described decisions, agreements and exploration as shared work,
potentially involving a team, rather than work attributed solely to the owner.
This feedback concerns the process and documentation; it is not a blanket product
or release acceptance.

Direct source inspection found examples in the study page:

- Process narration: “The first controls coupled fill and border colors too tightly”.
- Reader-directed instructions: “Choose a numbered slot” and “Compare all three chassis”.
- Actor-centered delivery narration: “The owner authorized implementation”.
- Temporal mixing: “Both side buttons are selectable today” remains under historical
  adaptations, alongside text reporting the non-selectable secondary's delivery.
- The page still reports unavailable Java and failed verification from this loop,
  while the later saved report records a pass. These observations belong to different runs.

These are attributable findings, not a diagnosis of their cause or an adopted writing
policy. Closure does not rewrite the study, modify skills or generalize a lesson.

## Evidence limits

The accepted reference preserves source defaults; temporary playground settings were
not saved. Earlier narrow-screen inspection timed out. Ignored screenshots, reports
and test artifacts are mutable local files, not durable release evidence. The latest
report covers a broader dirty tree than this loop. The exact tested slot revision
cannot be reconstructed from a dedicated commit. Documentation validation alone
was performed for this closure record.
