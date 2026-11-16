# Design-study skill set 2.0

Status: plan for review, revised 2026-11-16 (fourth revision). Step S1 is applied and
committed in `bdfc4759`; step S2 is applied and not yet committed.

Proposed 2026-11-15 in conversation: split the single design-study skill into a
conductor, working skills and reviewers, and write down how a study moves between
parts, including back from exploration to the question.

## Decisions so far, all 2026-11-16 in conversation

- **The spec is about the product.** From the product's side a study is an entry
  in a collection: a file, its metadata, its assets and the layout that renders it.
  The spec does not describe what a study says. The four-part structure, what each
  part contains, prose rules, end-state content and decision authority belong to the
  practice, which lives in the skills.
- **A study page is self-contained.** Separate review pages under `/lab/reviews`
  are a defect. A study leaves nothing outside its own file and asset folder.
- **Closing a study compacts it.** A closed study keeps the question, the decisions
  with their exact variants, the reasons, the media needed to read them, what was
  ruled out and why, and where the work went. The sequence of exploration steps is
  working material and is removed.
- **Older studies are historical artefacts.** They are not preserved in full.
  Compacting them and moving studies to a content collection are known debt.
- **The study skills are meant to leave this repo.** They name no instrument,
  layout, registry or path of this project. The Motion instrument and the Flight
  scene instrument have their own repo skills, which a study uses; the repo's own
  instructions say which ones apply here.
- **Study text is Markdown wherever it can be.** Studies are expected to become MDX.
  Forms the skills prescribe, such as the question-test stamp, are written as
  Markdown and need no component or script.
- **Each step is small, with its own value and its own check.** The split into
  skill folders comes late, as a move of text that is already right.

Related plans: the [move menu draft](2026-11-13-exploration-move-menu.md) is step S3
here. The [question rubric plan](2026-11-10-part-01-question-rubric.md) is already in
the skill as the question test. Findings A and B in the
[retro actions](2026-11-08-retro-actions.md) are the reason for steps S1 and S3.

## Where each kind of text lives

| Text                                                                               | Home                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| Routes, entry metadata, layout, asset location, scoped styles, keyboard and 1280px | `docs/specs/lab/design-studies/spec.md` |
| Which part is active, moves between parts, amending the question, end states       | Conductor skill                         |
| What a part contains, what it needs before it starts, how to do its work           | That part's working skill               |
| What a closed study keeps                                                          | Close skill                             |
| How to write study prose                                                           | `references/writing.md`, shared         |

No practice guide and no page template carry structure.

## State on 2026-11-16

- 49 studies in the registry: 28 accepted, 15 stopped, 6 open. All are `.astro`
  pages under `apps/web/src/pages/lab/studies` with a hand-kept registry in
  `apps/web/src/data/studies.ts`.
- 16 review pages under `apps/web/src/pages/lab/reviews`; 16 other source files
  link to them.
- The study spec is about 170 lines, of which roughly 25 describe the product.

## Two tracks

The skill track depends on nothing. The debt track waits on step S4, so that old
studies are compacted by the same rule new studies will use.

| Track | Steps                                                                             |
| ----- | --------------------------------------------------------------------------------- |
| Skill | S1 to S12                                                                         |
| Debt  | D1 compact closed studies; D2 retire review pages; D3 content collection; D4 spec |

## Skill track

### S1. Moves between parts and question amendment. Done

Applied 2026-11-16, committed in `bdfc4759`. `SKILL.md` has "Moving between parts"
with the table of moves and "Amend the question". When the question is known to be
wrong, the agent builds the next example on the amended question and says so in one
line; section 01 changes only when the designer accepts that example. When the
question may be wrong, the agent says so and keeps proposing. A different subject
is a new study and nothing is built until the designer decides.

Checked with clean-context Sonnet agents given only the skill and the exploration
guide, one run per situation. The skill as it stood that morning failed the first
and third; the final text passed all five.

| Situation                                                          | Final text                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| A retained observation contradicts an item section 01 holds fixed. | Built the next example on the amended question and left section 01 until acceptance.        |
| One proposal rejected, one observation retained.                   | Replaced the proposal and left section 01 alone.                                            |
| The designer restates the subject as a different object.           | Built nothing and proposed ending the study and starting a new one.                         |
| The designer rejects an example built on an amended question.      | Discarded it, kept section 01 and built a new example on the question as written.           |
| Two replacements rejected, nothing retained.                       | Said in one line that the question may be wrong, offered to narrow or stop, proposed again. |

### S2. The question test leaves no review page. Done

Applied 2026-11-16, not yet committed. Three review pages were added on 2026-11-14
and 2026-11-15, one per new study; this stops new ones.

`references/question-test.md` now stamps the result at the end of section 01 as a
`<details>` block holding the reviewer's own table of metric, result and reason,
and one closing line saying whether the section was corrected, rerun or overridden.
The block is open while section 01 is active and closed from part 02 on; a rerun
replaces it. The reason for a declined finding and the unchecked items stay in
chat. No review page is created and nothing is linked. The study spec's clause
about the stamp no longer mentions a link.

Checked with two clean-context Sonnet agents given the skill, the question test and
a returned result with two findings, one corrected and one declined, one run each.

| Text                  | What the agent would write                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Before (that morning) | A review page, a link to it, a prose stamp, and the declining reason inside section 01.             |
| After                 | The correction and the stamp block in section 01, in the page's own markup. No other file, no link. |

The agent on the new text noted that none of the four closing lines names a
declined finding and used "Corrected after the test, not rerun."

### S3. Move menu in the exploration guide

Apply the [move menu draft](2026-11-13-exploration-move-menu.md) after an edit pass
for length, after its three open points are settled, and after its first pivot is
reconciled with "the question may be wrong" from S1. Check: for one question state
per group, a clean-context agent names a move from that group where today's text
does not.

### S4. Closing compacts the study

Rewrite the closing procedure in "Finish and verify" around the compact record: the
question, decisions with exact variants, reasons, the media needed to read them,
what was ruled out and why, and where the work went. Exploration steps, question-test
stamps and study-only apparatus are removed. Check: one closed study is compacted by
the rule, and a clean-context reader given only the compacted page states what was
decided, why, and what changed in the game or the Lab. This is the pilot for D1.

### S5. Content rules leave the spec

Every rule about what a study says moves from the spec into the skill: cycle zero,
the four-part outputs, "Current study presentation", the content half of "Ending a
study". The optional evaluation section and the skill's paragraph about it are
deleted. The spec keeps the product items in the table above, described for the
mechanism as it is today. Check: `pnpm check:contracts`; no sentence removed from
the spec is absent from the skill unless it is listed as deleted.

### S6. Entry and exit at the head of each part

Each part section of the skill gains two short lists: what must be on the page
before the part starts and what it leaves there. Check: for one existing page per
part, a clean-context agent given only that part's section states whether the part
can start.

### S6a. Repo-specific text leaves the study skills

Move every mention of this project's instruments, components and paths out of the
study skill: the Motion instrument and Flight scene paragraphs in part 02,
`StudyLayout`, `apps/web/src/data/studies.ts`, the links to this repo's spec and
`docs/design.md`, and the 1280px rule. They go to one short repo-side text that the
study skill is told to read when it exists (a section of the root agent
instructions, or a small repo skill). Check: a search of the study skill for
`apps/`, `docs/`, `Motion`, `Flight` and `StudyLayout` finds nothing, and a
clean-context agent given the study skill plus the repo-side text still names the
Flight scene instrument for a visual that needs flight context.

### S7. Split into skill folders

Create `study-frame`, `study-explore`, `study-deliver`, `study-close` and
`study-question-test` under `.agents/skills/`, each with frontmatter and its text
moved without rewording. `design-study/SKILL.md` keeps the conductor's text and
links each working skill, with the rule that a working skill returns to the
conductor at its exit. Delete `references/exploration.md` and
`references/question-test.md`; `references/writing.md` stays.

| Skill                 | Kind      | Owns                                                                                   |
| --------------------- | --------- | -------------------------------------------------------------------------------------- |
| `design-study`        | Conductor | Established reality, active part, moves, question amendment, end states, shared checks |
| `study-frame`         | Working   | Section 01 and page creation                                                           |
| `study-explore`       | Working   | Part 02 rounds and the move menu                                                       |
| `study-deliver`       | Working   | Parts 03 and 04                                                                        |
| `study-close`         | Working   | Compacting the study, retiring apparatus, registry status                              |
| `study-question-test` | Reviewer  | Whether a study can answer the question as written                                     |

`flight-scene-study` already exists and is unchanged; `study-explore` links to it.

Descriptions, so the right skill loads:

- `design-study`: "Run a design study end to end: decide which part is active, move
  between parts, amend the question, and end the study. Start here."
- `study-frame`: "Write or amend section 01 of a design study: purpose, tension and
  an answerable question. Used from design-study."
- `study-explore`: "Run part 02 exploration rounds of a design study: choose the
  move, build the example, replace rejected proposals. Used from design-study."
- `study-deliver`: "Assess readiness and size the work for an accepted design-study
  conclusion (parts 03 and 04). Used from design-study."
- `study-close`: "Close a design study: compact it to its decisions and evidence,
  retire study code, set the status. Used from design-study."
- `study-question-test`: "Clean-context review of whether a study can answer its
  question. Run by a reviewer with no part in the framing."

### S8. Repair links, in the same change as S7

Update the spec's ownership paragraph and every link to the deleted references and
moved headings. Find them when applying with
`grep -rn 'design-study/' --include='*.md' docs .agents`. On 2026-11-16 that gave
the study spec, `docs/factory-building-lessons/002-phased-design-studies.md`,
`docs/factory-report-design-study-form-drift.md` and two loop-evidence records.
Check: `pnpm check:contracts` passes, and a diff of old against new skill text
shows moves and link changes only.

### S9. End check, only if decided

A reviewer with no part in the study reads the compacted page against four metrics
and reports in chat. Nothing is stored.

| Metric      | Passes when                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| Decisions   | Each decision names its exact variant, the properties settled and what stays provisional.  |
| Evidence    | Each decision has the image, clip or values needed to read it, with its conditions.        |
| Consequence | A reader can say from the page what changes in the game or the Lab, or why nothing does.   |
| Apparatus   | No study-specific component, script or fixture remains without a named continuing purpose. |

### S10. Cold-start check

For each working skill, a clean-context agent is given one study page at that part
and only that skill plus the conductor, and states the next action and what it
would write to the page. A skill passes when the stated action matches its entry
and exit lists without the agent asking for context that is not on the page.

### S11. First study on the new set

The next study that is started uses the set as it is. No study is started for the
purpose of this plan.

### S12. Record

Add the split and its reasons to `docs/factory-building-lessons/` as a lesson
candidate for review, and mark this plan decided with a date.

## Debt track

None of these is applied without a separate go-ahead; D1 to D3 delete or rewrite
existing pages.

### D1. Compact the closed studies

Apply the S4 rule to the 43 accepted and stopped studies. Their exploration steps
were the source for the move analysis of 2026-11-13; any further study of past
explorations happens before this step. Git keeps every page as it was. Check: each
compacted page passes the S4 reader check on a sample, the Lab builds, and no
study-only component is left without a consumer.

### D2. Retire the review pages

Remove `apps/web/src/pages/lab/reviews` and the links to it. For closed studies this
falls out of D1, since compaction removes the stamps. For open studies the stamps
stay and the link goes. Check: no source file references `/lab/reviews`; the Lab
builds.

### D3. Studies as a content collection

Move studies to an Astro content collection of MDX entries. The registry fields
become frontmatter validated by the collection schema, and `data/studies.ts` goes.
Compacted studies are prose and static media, so they convert mechanically; open
studies keep their components. Check: every study URL resolves as before; the
listing shows the same titles and statuses.

### D4. The spec describes the collection

Rewrite the product items in the spec for the collection mechanism: routes, the
frontmatter schema with one line of meaning per status and phase value, what the
layout provides, the asset folder, scoped styles, keyboard and 1280px. Check:
`pnpm check:contracts`; every sentence describes something the Lab does.

## Decisions needed

- **Before S3:** the three open points in the move menu draft.
- **Before S4:** whether an accepted study's slices stay on the compacted page or
  only a link to where they were delivered.
- **Before S6a:** where the repo-side text lives, in the root agent instructions or
  in a small repo skill.
- **Before S7:** 03 and 04 as one skill or two (the plan uses one); skill names
  `study-*` or `design-study-*`.
- **Before D1:** a go-ahead to rewrite existing study pages, and whether any
  further analysis of past explorations is wanted first.
- **Open, no step waits on it:** whether S9 is built at all; a limit on amendments
  per study.

## Notes for whoever applies this

- `.claude/skills` is a link to `.agents/skills`, so one copy serves both.
- Sandboxed shell commands cannot write under `.agents/skills`; use the file
  editing tools there.
- Other sessions edit the skill and the spec. Section headings are used above in
  place of line numbers for that reason.
- S7 and S8 are safest as one commit with no other changes in the tree, because
  every session shares this checkout.
