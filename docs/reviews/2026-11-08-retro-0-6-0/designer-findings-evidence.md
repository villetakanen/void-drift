# Evidence for the designer's findings

Gathered on 8 November 2026 from the loop records, the skills, the design
system specification and the studies folder, in the exploration session that
followed the review. Evidence only: the designer's readings of it are human
feedback in the session's loop record,
[2026-11-08-retro-exploration.md](../../loop-evidence/2026-11-08-retro-exploration.md).
Counts are direct inspection of the tree at `a6a6dd7` on `feat/0-5-0`, with
another session's uncommitted in-game-controllers files present and excluded
where a first-commit date is used.

## A. Exploration stops when it turns into discussion

- The designer names a loop in ten of twelve stopped-study records
  (`2026-10-29-planet-roles-cycle.md`, `2026-11-01-lab-instrument.md`,
  `2026-11-01-path-instrument-closure.md`,
  `2026-11-06-derelict-draft-two-closure.md`, and the list in
  [loops A §2.1](loops-2026-10-29-to-11-02.md#2-recurring-issues)).
- The useful output sits early in each record: "the only usefull excample was
  the first" (planet-roles); 02.2 "the last step that produced value"
  (open-frame-machinery); "to the point of 2.9, we got good results"
  (ship-silhouettes).
- After a rejected guess, the agent's next turn was often not a new guess. The
  records quote "how about asking them?" (path-instrument), "concrete answers
  on the page rather than more process explanations" (ship-utility-language),
  "neither recovery response delivered a replacement visual artifact"
  (derelict-draft-two).
- Silent: no record describes what was visible in the turn before the
  designer called the loop.

## B. No rubric for the design question itself

### What the contracts say

- The design-studies specification asks part 01 for "an answerable question"
  (`docs/specs/lab/design-studies/spec.md`, four-part outputs).
- The design-study skill advances from part 01 when "substantive agreement or
  a clear instruction to explore suffices"
  (`.agents/skills/design-study/SKILL.md`). Neither text tests whether the
  question can be answered by a study.
- The evaluation protocol (`docs/factory-building-lessons/design-study-evaluation.md`)
  has eight rubric items on purpose grounding, unknowns, alternatives, method
  limits, concrete examples, surviving agreements, phase advancement and early
  exposure of understanding. None judges part 01's question. The designer set
  the rubric aside for this finding (loop record, human feedback).

### What the records say

- The question is named as the cause in two closures: path-instrument ("this
  topic is either too broad, or then the design study is too nuanced",
  `2026-11-01-path-instrument-closure.md`) and suns ("the first one, zero one,
  should never proceed unless we have a clear problem worth studying"; "No
  skill, standing process or section-01 gate was changed by closure",
  `2026-11-07-suns-closure.md`). LHI Wasp's section 01 "framed a mechanic the
  owner considered settled as the unknown" (`2026-11-01-lhi-wasp-study.md`).
- The ten studies registered `stopped` in `apps/web/src/data/studies.ts` are
  otherwise logged as loops, model fault or context failure.

### What the stopped studies' openings say

Section 01 of each stopped study's page, read side by side. All ten read as
finished problem statements; none flags itself as too large.

| Study                 | Opening carries                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| derelicts-2026-11-06  | "the object's identity and that encounter's legibility together"                                                                                                       |
| open-frame-machinery  | one construction to "unite storage, solar charging, gravity charging and repair"; three of the four never received an example (`2026-11-02-utilities-failed-study.md`) |
| ship-utility-language | "Identifying a device's exact function or subtype is a later concern"                                                                                                  |
| path-instrument       | a contract for a measuring tool ("the instrument is a fixed way of measuring"), not a design question                                                                  |
| plasma-behaviour      | two rewards; "Plasma might offer either or both"                                                                                                                       |
| utilities-2026-11-02  | no section 01 text extractable from the page                                                                                                                           |
| energy-support        | one object, one question                                                                                                                                               |
| gravity-coil          | one object, one question                                                                                                                                               |
| ship-silhouettes      | one question, three ships                                                                                                                                              |
| derelict-draft-two    | one object, one question                                                                                                                                               |
- Silent: nothing records what the designer saw in an opening at the moment
  of agreeing to explore it. The designer stated the same (loop record).

## C. The design system is bypassed

### Records

- No loop record names a component invented in place. The two design-system
  loops (`2026-11-03-square-switch.md`, `2026-11-01-s3-colour-roles.md`) build
  the system itself. The six review appendices do not mention the pattern.

### Code

The input primitives are `Toggle` and `RingSlider` (1 November) and `Switch`
(3 November) under `apps/web/src/components/inputs/`, shown on `/lab/inputs`.
The design system specification forbids trivial component wrappers for
buttons; a native button with the `.btn` classes is correct use.

| Measure, `apps/web/src/components/studies/`        | Files |
| -------------------------------------------------- | ----- |
| Study files (`.svelte` and `.astro`)               | 172   |
| Import any shared primitive                        | 20    |
| Use `RingSlider`                                   | 8     |
| Draw a native `<input type="range">`               | 40    |
| of which first committed on or after 2 November    | 18    |
| Use `Switch`                                       | 2     |
| Draw a native `<input type="checkbox">`            | 36    |
| of which first committed after 3 November          | 4     |
| Native `<button>` with no `.btn` class in the file | 26    |
- The fiddler, suns and in-game-controllers studies import the primitives; the
  gravity FX, derelict-three, ion and lab-instrument studies do not.
- The design-study skill does not mention the design system, the
  shared-components skill or `/lab/inputs`; its only reuse rule is "reuse
  production simulation code".
- First-commit dates come from `git log --diff-filter=A --follow`; files first
  committed on 1 November are ambiguous against primitives added the same day
  and are not counted as "after".
