# Design-study skill set 2.0

Status: plan for review, revised 2026-11-16. Nothing here is applied.

Proposed 2026-11-15 in conversation: split the single design-study skill into a
conductor, working skills and reviewers, and write down how a study moves between
parts, including back from exploration to the question.

Revised 2026-11-16 after two decisions in conversation:

- The study spec describes the artefact: the study page, the registry, the review
  pages and the repository after a study closes. Each sentence in it can be checked
  from those by someone who did not watch the study. How a study is conducted
  belongs to the skills. The first version of this plan put part transitions, the
  amendment procedure and the end check into the spec; they now go to the skills,
  and procedure the spec already holds moves out.
- The steps are ordered so that each one is a small change with its own value and
  its own check. The split into folders comes late, as a move of text that is
  already right.

Related plans: the [move menu draft](2026-11-13-exploration-move-menu.md) is step 3
here. The [question rubric plan](2026-11-10-part-01-question-rubric.md) is already in
the skill as the question test. Findings A and B in the
[retro actions](2026-11-08-retro-actions.md) are the reason for steps 1 and 3.

## Where each kind of text lives

| Text                                                                                 | Home                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------- |
| What the page, registry, review pages and repository must show                       | `docs/specs/lab/design-studies/spec.md` |
| Which part is active, which part can follow which, amending the question, end states | Conductor skill                         |
| What a part needs on the page before it starts and what it leaves                    | Top of that part's working skill        |
| How to do the work of a part                                                         | That part's working skill               |
| How to write study prose                                                             | `references/writing.md`, shared         |

No practice guide and no page template carry structure. A guide would be a third
copy that no skill is forced to load. A template describes the page, so it follows
the spec and cannot say when a part is complete.

## The skill set at the end of the plan

| Skill                 | Kind      | Owns                                                                                                                                 | Text comes from (current section headings)                                                                                                  |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `design-study`        | Conductor | Starting from established reality, active part, moves between parts, question amendment, end states, checks that apply to every part | Intro, "Start from established reality", "Moving between parts" (step 1), the first paragraph of "Finish and verify" and its closing checks |
| `study-frame`         | Working   | Section 01 and page creation                                                                                                         | "01 / Develop the problem"                                                                                                                  |
| `study-explore`       | Working   | Part 02 rounds                                                                                                                       | "02 / Explore", all of `references/exploration.md`                                                                                          |
| `study-deliver`       | Working   | Parts 03 and 04                                                                                                                      | "03 / Assess readiness", "04 / Size the work"                                                                                               |
| `study-close`         | Working   | Consolidating findings, capturing evidence, retiring study code, registry status                                                     | The closing procedure in "Finish and verify"                                                                                                |
| `study-question-test` | Reviewer  | Whether a study can answer the question as written                                                                                   | `references/question-test.md`                                                                                                               |
| `study-end-check`     | Reviewer  | Whether a closing study leaves a usable record                                                                                       | New, only if decided (step 8)                                                                                                               |

`flight-scene-study` already exists as its own skill and is unchanged;
`study-explore` links to it. `references/writing.md` stays under `design-study/`.

## Steps

### 1. Moves between parts and question amendment, in the current skill

Applied 2026-11-16, not committed. Three files in `.agents/skills/design-study/`:

- `SKILL.md` has a new section "Moving between parts" with the table of moves and
  "Amend the question", placed before "01 / Develop the problem". The wording was
  shortened from the first proposal after a clean-context edit pass.
- `references/exploration.md`, "Discard and replace": the sentence about two
  consecutive rejected replacements now points to "Amend the question".
- `references/question-test.md`, "After the run": a corrected section is run again
  when the question was amended during exploration.

The amendment part was rewritten the same day after discussion. When the question
is known to be wrong (an observation contradicts a fixed item, a hypothesis failed,
the designer restates the purpose), the agent builds the next example on the
amended question and says so in one line; section 01 changes only when the designer
accepts that example. When the question may be wrong (two replacements rejected
with nothing retained, an open item that cannot be shown and judged), the agent
says so in one line and keeps proposing on the current question. A different
subject is a new study and nothing is built until the designer decides.

Check, run 2026-11-16 with clean-context Sonnet agents given only `SKILL.md` and
the exploration guide, one run per cell. "Before" is the skill as it stood that
morning; the last two situations were only run on the final text.

| Situation                                                          | Text before                                                             | Final text                                                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A retained observation contradicts an item section 01 holds fixed. | Built another example on the old premise and left section 01 as it was. | Built the next example on the amended question, said what it sets aside, left section 01 until acceptance. |
| One proposal rejected, one observation retained.                   | Replaced the proposal.                                                  | Replaced the proposal and left section 01 alone.                                                           |
| The designer restates the subject as a different object.           | Rewrote section 01 into the new subject in the same round.              | Built nothing and proposed ending the study and starting a new one.                                        |
| The designer rejects an example built on an amended question.      | Not run.                                                                | Discarded it, kept section 01 and built a new example on the question as written.                          |
| Two replacements rejected, nothing retained.                       | Not run.                                                                | Said in one line that the question may be wrong, offered to narrow or stop, and proposed again.            |

### 2. The spec says what an amended page shows

Add to "Current study presentation" in the study spec:

```markdown
When the question changes during exploration, section 01 states the current
question and carries the question-test result for it. The exploration step whose
example was built on the changed question opens with one dated line saying what
changed and why. Earlier
steps that no longer bear on the question are marked as observations outside it.
```

Add one scenario: "Given the question changed during exploration, the page states
the current question, its test result, and where and why it changed."

Check: `pnpm check:contracts`; the three sentences can each be verified on a page.

### 3. Move menu in the exploration guide

Apply the proposed text from the [move menu draft](2026-11-13-exploration-move-menu.md)
after its three open points are settled. Check: a clean-context agent given a
question state names a move from the matching group, for one state per group.

### 4. Procedure leaves the spec

Sorted by section of the study spec as it stands on 2026-11-16:

| Section                           | Stays                                                                                                                                                                       | Moves to the skill                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context and ownership             | All; the pointer is updated in step 7                                                                                                                                       | None                                                                                                                                                                               |
| Contract (bullets)                | URLs, registry validation, Flight scene instrument use, scoped styles, stable URL and recorded decisions, slices as separate work, keyboard and 1280px support              | "reviewed separately from gameplay feel" (the conductor's closing checks already say it)                                                                                           |
| Cycle zero                        | "Earlier artifacts remain separately available, and rejected drafts stay out of the new page."                                                                              | The rest, to "Start from established reality", which today only points at it                                                                                                       |
| Four-part outputs                 | The table; evidence must support the claim; unsupported parts left unfilled; a study does not authorize implementation or publication; the `docs/design.md` flag in part 04 | "Uncertainty is a normal input. Desired intent comes from the design inquiry; current code informs feasibility" (already in "01 / Develop the problem"); "and in the chat handoff" |
| Current study presentation        | All but the last paragraph's middle                                                                                                                                         | "Explicit requests for conceptual discussion, stopping, preservation or reframing govern" and the pointer to replacement procedure (already in the exploration guide)              |
| Ending a study                    | Status meaning, the three end states and what each leaves, the durable record, repository state after close                                                                 | The "Reached after" column, which duplicates the conductor's table from step 1                                                                                                     |
| Optional study-quality evaluation | The review location `/lab/reviews/<study-slug>`, already stated under presentation                                                                                          | The whole section is deleted; see decisions                                                                                                                                        |
| Scenarios                         | First, third and fourth                                                                                                                                                     | The second is reworded to end on "shared production behavior is unchanged until implementation is authorized"; the fifth is deleted                                                |

The skill's last paragraph about the whole-study evaluation is deleted with the
section. `docs/factory-building-lessons/design-study-evaluation.md` stays as a
historical record that the spec stops linking to.

Check: `pnpm check:contracts`; every sentence left in the spec can be verified from
a page, the registry, a review page or the tree; no sentence removed from the spec
is absent from the skill unless the table above says it is deleted.

### 5. Entry and exit at the head of each part

Each part section of `SKILL.md` gains two short lists: what must be on the page
before the part starts, and what it leaves there. The content is the "Needs on the
page" and "Leaves on the page" columns of the part table in the first version of
this plan. Check: for one existing page per part, a clean-context agent given only
that part's section states whether the part can start.

### 6. Split into skill folders

Create `study-frame`, `study-explore`, `study-deliver`, `study-close` and
`study-question-test` under `.agents/skills/`, each with frontmatter and the text
listed in the skill set table, moved without rewording. `design-study/SKILL.md`
keeps the conductor's text and gains a table linking each working skill, with the
rule that a working skill returns to the conductor at its exit. Delete
`references/exploration.md` and `references/question-test.md`.

Descriptions, so the right skill loads:

- `design-study`: "Run a design study end to end: decide which part is active, move
  between parts, amend the question, and end the study. Start here."
- `study-frame`: "Write or amend section 01 of a design study: purpose, tension and
  an answerable question. Used from design-study."
- `study-explore`: "Run part 02 exploration rounds of a design study: choose the
  move, build the example, replace rejected proposals. Used from design-study."
- `study-deliver`: "Assess readiness and size the work for an accepted design-study
  conclusion (parts 03 and 04). Used from design-study."
- `study-close`: "Close a design study: consolidate findings, capture evidence,
  retire study code, set the registry status. Used from design-study."
- `study-question-test`: "Clean-context review of whether a study can answer its
  question. Run by a reviewer with no part in the framing."

### 7. Repair links, in the same change as step 6

Update the spec's ownership paragraph to name the skill set, and repair every link
to the two deleted references and to moved headings. Found on 2026-11-16 with
`grep -rn 'design-study/' --include='*.md' docs .agents`:

- `docs/specs/lab/design-studies/spec.md` (ownership paragraph)
- `docs/factory-building-lessons/002-phased-design-studies.md` (five links)
- `docs/factory-report-design-study-form-drift.md` (one link with a heading anchor)
- `docs/loop-evidence/2026-11-03-factory-harness-amendments.md` and
  `docs/loop-evidence/2026-11-11-design-study-writing-and-closure.md` (links to the
  exploration guide)

Run the grep again when applying; other sessions add records. Check: `pnpm
check:contracts` passes, and a diff of old against new skill text shows moves and
link changes only.

### 8. End check, only if decided

Create `study-end-check/SKILL.md`: a reviewer with no part in the study checks the
closed page and the registry against four metrics, with the question test's output
format. The result is heard and does not gate anything. It is stored at
`/lab/reviews/<study-slug>` with the question-test result.

| Metric      | Passes when                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decisions   | Each decision names its exact variant, the properties settled and what stays provisional.                                                                         |
| Evidence    | Each retained observation has the image, clip or values needed to interpret it, with its conditions; evidence gaps are stated.                                    |
| Consequence | A reader can say from the page what changes in the game or the Lab: the slices for an accepted study, the reason for a ruled-out one, what blocked a stopped one. |
| Apparatus   | No study-specific component, script or fixture remains without a named continuing purpose.                                                                        |

The spec gains one sentence under presentation: a closed study's review page may
hold an end-check result beside the question-test result.

### 9. Cold-start check

For each working skill, a clean-context agent is given one study page at that part
and only that skill plus the conductor, and states the next action and what it
would write to the page. Pages: Run status (frame), Plasma projector (explore), LHI
Fiddler (deliver, read-only), Stellar encounters (close, read-only). A skill passes
when the stated action matches its entry and exit lists without the agent asking
for context that is not on the page. Gaps go back into the skill.

### 10. First study on the new set

The next study that is started uses the set as it is. Its close-loop record notes
which skill each part loaded and any point where the agent lacked a rule. No study
is started for the purpose of this plan.

### 11. Record

Add the split and its reasons to `docs/factory-building-lessons/` as a lesson
candidate for review, and mark this plan decided with a date.

## Decisions needed

None blocks steps 1 and 2.

- **Before step 3:** the three open points in the move menu draft.
- **Before step 4:** whether the optional evaluation section is deleted with
  nothing in its place, or replaced by the end check in step 8. The plan deletes it
  in step 4 either way and treats step 8 as optional.
- **Before step 6:** 03 and 04 as one skill or two (the plan uses one,
  `study-deliver`); skill names `study-*` or `design-study-*`.
- **Open, no step waits on it:** a limit on amendments per study. The plan sets
  none because no record supports a number.

## Notes for whoever applies this

- `.claude/skills` is a link to `.agents/skills`, so one copy serves both.
- Sandboxed shell commands cannot write under `.agents/skills`; use the file
  editing tools there.
- The skill and the spec both had uncommitted edits from another session on
  2026-11-16 (the Flight scene instrument text). Section headings are used above in
  place of line numbers for that reason.
- Steps 6 and 7 are safest as one commit with no other changes in the tree, because
  every session shares this checkout.
