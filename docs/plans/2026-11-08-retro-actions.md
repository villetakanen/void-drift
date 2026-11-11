# Retro actions, 0.5.6 to 0.6.0

Working board for acting on the findings of the
[retrospective held 8 November 2026](../reviews/2026-11-08-retro-0-6-0/README.md).
Each item names the finding it serves, what to do, and its state. A loop that
takes an item moves it to done in the same commit as the change, with the
commit hash. Items marked "decision" wait for the designer; do not act on
them without an answer.

The board holds findings, actions and their state. Evidence lives in the
review and its appendices; what the designer said lives in the loop records,
as human feedback. Neither is copied here.

## Purpose

A retro cycle does two things together: it teaches the team what the records
show, and it makes the changes that learning calls for, telling the designer
each time. Exploring a finding without making its change, or making a change
without exploring its finding, is half the work. Record each change next to
the finding it came from, with the date the designer approved it.
(Restated 8 November 2026; the earlier explore-only rule is withdrawn.)

## How to continue

Parked 8 November 2026 with the tree committed and the designer in the loop.
A session that resumes this board works like this:

1. **Read first**: this board; the designer's findings and their
   [evidence](../reviews/2026-11-08-retro-0-6-0/designer-findings-evidence.md);
   the [loop record](../loop-evidence/2026-11-08-retro-exploration.md) for
   what the designer has said so far; `development.md` "Shared checkout".
2. **Work with the designer, one question per turn.** The designer speaks to
   the session; answers are testimony, not decisions, until the designer
   decides. Record a decision on the board with its date. Do not write the
   designer's words down verbatim anywhere; a reading goes into the loop
   record as short attributed paraphrase.
3. **Per item**: say what it is and what caused it, then decide together:
   won't fix, defer, or do. For a do, show the exact diff and apply on the
   designer's go. Move the item to Done with its commit hash. Items 2, 3, 4
   showed the shape: spec material is corrected just in time, trivia is
   won't fix.
4. **Priority one (A, B, C)** is the point of the cycle. Each is explored but
   has no cause agreed and no action. Take one at a time to its root cause
   with the designer; where the cause needs the wider team, say so and record
   the question instead of inventing an answer. When last asked, the designer
   took B first.
5. **Commits** save the whole shared checkout (see `development.md`); format
   and check the whole tree before committing; one headline change per commit;
   nothing is pushed without the designer's word.
6. **Keep the loop record current**: changes delivered with hashes, checks
   run, feedback as paraphrase. Close it with the close-loop skill when the
   designer ends the cycle.
7. **Words**: "the designer", never "owner"; plans are never offered for
   deletion; playtesting by people is never asked for or recorded.

State at parking: Done and won't-fix items are in the tables below. Open:
7, 8, 10 (harness, one bounded change each, each with a failing-then-passing
check) and 12 (waits on B). Deferred to the 0.6.0 retro: 14. The stash of
5 November is kept by the designer's decision.

State on 11 November 2026, after reading the eleven loop records closed since
parking (8 to 11 November): A, B and C below carry what those records show;
item 12 is superseded; items 7, 8 and 10 are still open; the
[later findings](#seen-in-the-loop-records-8-to-11-november-2026) have no
agreed action. Nothing in this update is a new decision except item 12.

## The designer's findings, priority one

Stated by the designer on 8 November after the review (spoken note, quoted in
[the retro README](../reviews/2026-11-08-retro-0-6-0/README.md#the-designers-findings)).
Evidence gathered for each on 8 November:
[designer-findings-evidence](../reviews/2026-11-08-retro-0-6-0/designer-findings-evidence.md).
The designer's readings: [loop record](../loop-evidence/2026-11-08-retro-exploration.md).

- **A. Exploration stops when it turns into discussion.** Exploration is
  confirming guesses and guessing again when wrong; studies fail when they
  loop over details that do not answer the design question. The team is
  better at spotting it, not always in time. Explored once. Two design-study
  changes, 9 November 2026: a new proposal is a new answer; a stall offers to
  narrow the question. Root cause not yet agreed.
  State 11 November 2026: the render performance bench and the flight scene
  study explored as intended. The ship slots study stopped in part 02 with a
  different shape: a step's outcome was recorded with details the designer had
  not given, and two remarks were followed by three rebuilds, one after a
  request for advice only. The review of the point defence study found the
  same family in parts 03 and 04: background context in the study, givens
  presented as open choices, repetition. The skill does not cover recording
  more than was judged. No action agreed.
- **B. No rubric for the design question itself.** The biggest finding: the
  team often fails to see that a question is too winding, or missing
  fundamentals, for the study format to answer at all. Logged as model or loop
  failure, it is a missing way to evaluate part 01. Explored twice. Three
  design-study changes, 9 November 2026: an answerability test before part 02,
  fixed and open parts named, a stall offers to narrow the question.
  State 11 November 2026: a
  [three-metric rubric](2026-11-10-part-01-question-rubric.md), still a
  proposal outside the skill, has run on three studies (flight scene, actions,
  ship slots) by clean-context reviewers. Each run found false or wrong
  claims about the code that the author's own check had passed. On ship slots
  it passed a question that the designer then stopped because another study
  had to answer first, and it confirmed a claim against code that implements
  a defect. No corrected section has been re-tested; corrections lengthen the
  opening. Adopted 11 November 2026 as the design-study skill's question
  test, with a fail heard and not blocking, no required re-test, the length
  target kept, and two additions from the ship slots run: an unfinished study
  owning part of the answer fails One subject, and a fixed item resting only
  on current behaviour is a finding to confirm. Uncommitted. Not yet run in
  its adopted form.
- **C. The design system is bypassed.** In studies and screens, components
  were invented in place instead of flagging that the design system lacks
  them or that the agent did not know how to use it. Explored once; the
  designer confirms the pattern is the bench controls.
  State 11 November 2026: the actions study was accepted on 11 November; its
  scope moves about fifteen Lab components onto the shared button and turns
  switch-like bench buttons into switches or toggles
  ([handoff](2026-11-11-actions-implementation-handoff.md)). Its first slice
  is in `d29128b`, whose message does not name it, and the handoff calls it
  unverified. The study has no loop record. The remaining slices are not
  started.

The numbered items below are priority two: technical findings, open, none
deferred (8 November 2026).

## Done

| Item                                                                                      | Finding | Commit           |
| ----------------------------------------------------------------------------------------- | ------- | ---------------- |
| Repair 133 missing Markdown link targets, skills included                                 | 5       | `5223ffb`        |
| Contracts gate fails on a missing link                                                    | 5       | `d8f98b9`        |
| Track `docs/loop-evidence/artifacts/` (anchored ignore)                                   | 6       | `fa5ad4f`        |
| Two-space indentation; gate regexes indentation-agnostic                                  | 5       | `3d51381`        |
| `main` fast-forwarded to `v0.5.6`, pushed, protected                                      | 8       | no commit (refs) |
| Hosted CI removed, required check dropped                                                 | 9       | `09d57d9`        |
| 0.6.0 scope recorded                                                                      | state   | `b3c1e51`        |
| Human experience review out of scope: `AGENTS.md`, `design.md`, `development.md` reworded | tension | `dbe1968`        |
| Retire "owner": three skills, current docs, specs and code comments                       | 6       | `1c0a4ec`        |
| Retire "owner": fourteen Lab study and review pages                                       | 6       | `99f6317`        |
| Shared checkout practice: `AGENTS.md`, `development.md`, commit skill, factory spec       | 13      | `387ac28`        |
| Ref cleanup: five merged worktrees, thirteen merged branches, stash                       | 11      | no commit (refs) |
| Design study: answerability test before part 02                                           | B       | `e93f02e`        |
| Design study: question names what is fixed and what is open                               | B       | `e135244`        |
| Design study: each open-question proposal is a new answer                                 | A       | `e85709e`        |
| Design study: a stall offers to narrow the question                                       | A, B    | `24f114d`        |

To the designer these are four tasks, not seven: link repair with its gate,
evidence and formatting, releases and CI, the 0.6.0 note (8 November).

## Open: plain fixes

Documents only. Pathspec commits.

1. **Plan status lines** (finding 5). Dropped 8 November 2026: a plan is a
   map, not the territory, and a status line on it means nothing. Never
   delete a plan.
2. **Factory definition of done** (finding 5). Won't fix, 8 November 2026:
   spec material is corrected just in time, when the spec is next worked on.
3. **Stale spec status lines** (finding 5). Won't fix, 8 November 2026: same
   reason as item 2.
4. **Recover `docs/releases/0.5.3.md`** (finding 5). Won't fix, 8 November
   2026: trivial.
5. **Human experience review is out of scope** (tension). Done 8 November
   2026; see the Done table.
6. **Retire "owner"**. Done 8 November 2026; see the Done table. Code and
   document ownership keeps the word; historic records, archives and audits
   stay as written. Not a retro finding: the team asked for this before the
   retro; the word marks text not written by a person and names no one when
   several people write into one agent.

## Open: harness, one bounded change each

No new machinery, no CI. Each change ships with a failing-then-passing check.

7. **Retain evidence by default** (finding 6). `scripts/verify.mjs --retain
   <loop-slug>` copies `report.json` and failed-stage logs into
   `docs/loop-evidence/artifacts/<loop-slug>/`. State 11 November 2026: not
   built. None of the eleven loops since kept evidence in that folder; two of
   them ran the verify script at all. The gaps the records name are subagent
   reports and screenshots, which this change would not keep.
8. **Preflight** (finding 3). Before gates run, name a held browser port and
   its process, missing Java, missing Chromium, a stale `.vite` cache. Fail
   with the name, not a timeout.
9. **Close-loop record formatting** (finding 5). Covered by item 13, 8 November
   2026: the commit skill formats and checks the whole tree before any commit,
   records included. No change to the close-loop skill.
10. **Landing clock race** (finding 2). `tests/browser/landing.spec.ts` is
    intermittent on `clock.pauseAt`; make it deterministic without raising
    timeouts.

## Open: needs the designer

11. **Ref cleanup** (finding 4). Done 8 November 2026: five merged worktrees
    under `.claude/worktrees` (10.5 GB) and thirteen merged local branches
    removed; the stash of 5 November was kept: only 14 of 199 added lines are in the tree. Kept: the unmerged camera
    branches and worktree, the `codex/archive-*` and `codex/release-0.5.3`
    branches, the Codex plasma worktree. Cause: no rule said a worktree is
    removed once its delta has returned; `development.md` now does.
12. **Study harness replay** (finding 1). Lessons 001/002 say "adopted, not
    validated". Decide whether to run the evaluation protocol in
    `docs/factory-building-lessons/design-study-evaluation.md` before the
    point-defence study, and against which model. Superseded, 11 November
    2026: the point-defence study has run, and the part 01 rubric is being
    tried on real studies instead (see B).
13. **Shared checkout practice recorded** (finding 4). Done 8 November 2026;
    see the Done table. The checkout is shared by every session and tool on
    purpose, and the designer monitors the work through the git pane; the rules
    told agents to commit by path, which emptied the pane of meaning. Now stated
    in `AGENTS.md`, `development.md`, the commit-messages skill and the factory
    spec.
14. **Root `artifacts/` retention** (finding 6). 2.9 GB of ignored local
    verification runs. Deferred to the 0.6.0 retro, 8 November 2026.

## Seen in the loop records, 8 to 11 November 2026

Read on 11 November 2026 from the eleven records closed since parking. Each
is a finding with no agreed action; the evidence is in the records named.

15. **Evidence kept in the repo before a loop closes** (finding 6). Decided
    8 November; followed by none of the eleven loops. The decision is written
    in the retro README only, not in the close-loop skill. See item 7.
16. **Whole-tree commits** (finding 4). Three loops committed by path or by
    hunk after 8 November (point defence implementation, derelicts S1, flight
    scene). Whole-tree commits `84e304a`, `1358e15`, `570ab80` and `d29128b`
    carry other sessions' work under messages that do not name it.
17. **Formatter reverts** (finding 4). In two loops (derelicts S1, Lab game
    modes) the formatter was run over the tree and its changes to files of
    other sessions were undone with `git checkout`; whether uncommitted edits
    were lost is unknown.
18. **No full verification since 0.5.6** (finding 2). 83 commits; every loop
    closed on partial checks on a dirty tree.
19. **One unexplained test failure** (finding 2): the factory emulator test
    failed with a missing file on a temp path in two loops (9 November). Four
    other failures in the records are explained and are not findings: a
    closed laptop lid (armed-practice salvage, per the designer, 11 November
    2026), machine load, another session's write reloading the dev server,
    and one that passed on rerun. A test failing while several sessions write
    is expected; it is rerun.
20. **Checks relayed, not inspected.** Four loops delegated implementation and
    review to subagents; the main session recorded their check results from
    their reports. One unit test count differed between reports (405 and 407)
    and was not explained.
21. **Study lessons held in one tool's memory** (finding 7). Lessons from the
    11 November studies (build one example and replace it on failure, the
    short opening, interpreting dictated input) were saved to Claude's memory,
    which the other tools working the repo do not read.
22. **Untracked loose ends.** The page review asked for on the point defence
    study; Plan view scaling weapons and utilities down to fit their slot; the
    Hangar not explaining a blocked launch. None is in a plan or spec.

Items 2 and 3 above: specs no longer carry checkboxes or status lines since
11 November 2026 (`AGENTS.md`, the spec skill), so both are moot.

## Not actions

Tensions the retro left open that need a definition, not a fix: lesson
promotion timing, rejected-work handling (delete, archive or freeze), tone of
voice. Listed in the retro README.
