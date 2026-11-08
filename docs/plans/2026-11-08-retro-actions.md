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

## The designer's findings, priority one

Stated by the designer on 8 November after the review (spoken note, quoted in
[the retro README](../reviews/2026-11-08-retro-0-6-0/README.md#the-designers-findings)).
Evidence gathered for each on 8 November:
[designer-findings-evidence](../reviews/2026-11-08-retro-0-6-0/designer-findings-evidence.md).
The designer's readings: [loop record](../loop-evidence/2026-11-08-retro-exploration.md).

- **A. Exploration stops when it turns into discussion.** Exploration is
  confirming guesses and guessing again when wrong; studies fail when they
  loop over details that do not answer the design question. The team is
  better at spotting it, not always in time. Explored once. No action yet.
- **B. No rubric for the design question itself.** The biggest finding: the
  team often fails to see that a question is too winding, or missing
  fundamentals, for the study format to answer at all. Logged as model or loop
  failure, it is a missing way to evaluate part 01. Explored twice. No action
  yet.
- **C. The design system is bypassed.** In studies and screens, components
  were invented in place instead of flagging that the design system lacks
  them or that the agent did not know how to use it. Explored once; the
  designer confirms the pattern is the bench controls. No action yet.

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
| Human experience review out of scope: `AGENTS.md`, `design.md`, `development.md` reworded | tension | HEAD             |

To the designer these are four tasks, not seven: link repair with its gate,
evidence and formatting, releases and CI, the 0.6.0 note (8 November).

## Open: plain fixes

Documents only. Pathspec commits. Items marked **quick win** were marked
decided by the session of 8 November that wrote this board; the designer has
confirmed item 6.

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
6. **Retire "owner"** (quick win) in the three skills (`close-loop`,
   `shared-components`, `fx-development`) and in current docs (`development.md`,
   `design.md`, specs). Historic records and plans stay as written. Not a retro
   finding: the team asked for this before the retro; the word marks text not
   written by a human and names no single person when many people write into
   one agent (8 November 2026).

## Open: harness, one bounded change each

No new machinery, no CI. Each change ships with a failing-then-passing check.

7. **Retain evidence by default** (finding 6). `scripts/verify.mjs --retain
   <loop-slug>` copies `report.json` and failed-stage logs into
   `docs/loop-evidence/artifacts/<loop-slug>/`.
8. **Preflight** (finding 3). Before gates run, name a held browser port and
   its process, missing Java, missing Chromium, a stale `.vite` cache. Fail
   with the name, not a timeout.
9. **Close-loop record formatting** (finding 5). The close-loop skill runs
   `biome format --write` on the record it writes before reporting.
10. **Landing clock race** (finding 2). `tests/browser/landing.spec.ts` is
    intermittent on `clock.pauseAt`; make it deterministic without raising
    timeouts.

## Open: needs the designer

11. **Ref cleanup** (finding 4). Sixteen merged local branches, the merged
    worktrees under `.claude/worktrees` (11 GB), stash `0.5.0 wip before spec
    relocation`. Present the exact list; delete only what is approved. The
    unmerged `claude/camera-*` branches and the Codex worktree stay.
12. **Study harness replay** (finding 1). Lessons 001/002 say "adopted, not
    validated". Decide whether to run the evaluation protocol in
    `docs/factory-building-lessons/design-study-evaluation.md` before the
    point-defence study, and against which model.
13. **One checkout per session** (finding 4). Whether to adopt it as a rule.
14. **Root `artifacts/` retention** (finding 6). 2.9 GB, 152 runs, ignored.
    Whether to prune runs older than the last release.

## Not actions

Tensions the retro left open that need a definition, not a fix: lesson
promotion timing, rejected-work handling (delete, archive or freeze), tone of
voice. Listed in the retro README.
