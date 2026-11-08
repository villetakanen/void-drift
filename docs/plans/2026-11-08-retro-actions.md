# Retro actions, 0.5.6 to 0.6.0

Working board for acting on the findings of the
[retrospective held 8 November 2026](../reviews/2026-11-08-retro-0-6-0/README.md).
Each item names the finding it serves, what to do, and its state. A loop that
takes an item moves it to done in the same commit as the change, with the
commit hash. Items marked "decision" wait for the designer; do not act on
them without an answer.

Status: open; started 8 November 2026.

## Purpose and method, restated by the designer on 8 November

The retrospective exists to improve the human team's understanding of the
harness, the project and the work. Fixes are secondary, and they are made
human in the loop: each finding is explored with the designer before anything
is changed, and one approved change at a time. A session that reads this board
starts by exploring, not by fixing.

## The designer's findings, first

Stated by the designer on 8 November after the review (spoken note, quoted in
[the retro README](../reviews/2026-11-08-retro-0-6-0/README.md#the-designers-findings)).
These come before every item below.

- **A. Exploration stops when it turns into discussion.** Exploration is
  confirming guesses and guessing again when wrong; studies fail when they
  loop over details that do not answer the design question. The team is
  better at spotting it, not always in time.
- **B. No rubric for the design question itself.** The biggest finding: the
  team often fails to see that a question is too winding, or missing
  fundamentals, for the study format to answer at all. Logged as model or loop
  failure, it is a missing way to evaluate part 01.
- **C. The design system is bypassed.** In studies and screens, components
  were invented in place instead of flagging that the design system lacks
  them or that the agent did not know how to use it.

Everything else on this board is technical. It may wait for the next version
or the one after; take an item only when the designer says so.

## Done

| Item                                                      | Finding | Commit           |
| --------------------------------------------------------- | ------- | ---------------- |
| Repair 133 missing Markdown link targets, skills included | 5       | `5223ffb`        |
| Contracts gate fails on a missing link                    | 5       | `d8f98b9`        |
| Track `docs/loop-evidence/artifacts/` (anchored ignore)   | 6       | `fa5ad4f`        |
| Two-space indentation; gate regexes indentation-agnostic  | 5       | `3d51381`        |
| `main` fast-forwarded to `v0.5.6`, pushed, protected      | 8       | no commit (refs) |
| Hosted CI removed, required check dropped                 | 9       | `09d57d9`        |
| 0.6.0 scope recorded                                      | state   | `b3c1e51`        |

## Open: plain fixes

Documents only. Pathspec commits. Items marked **quick win** are decided
(8 November 2026) and may be taken on a single "go" from the designer, one
item per commit, without discussion. The others need evidence judgment and are
explored with the designer first.

1. **Plan status lines** (finding 5, quick win). Five plans contradict the tree:
   `2026-11-04-lab-usability`, `2026-11-05-game-and-lab-spec-trees`,
   `2026-11-04-camera-trial-2`, `random-star-systems`,
   `2026-11-04-motion-instrument-conformance`. Evidence per plan in
   [plans-specs-releases](../reviews/2026-11-08-retro-0-6-0/plans-specs-releases.md).
   Correct the status line to what the tree shows; never delete a plan.
2. **Factory definition of done** (finding 5). `docs/specs/factory/spec.md`
   says "implemented alpha gates" with 0 of 13 boxes checked. Check each box
   only with evidence (a script, a test, a record); leave unmet boxes
   unchecked and make the status line true.
3. **Stale spec status lines** (finding 5). `high-scores` and `ship-select`
   say PLANNED; `world/systems` DRAFT; four say COMPLETED (2024). Set each to
   what the tree and the release notes support. Specs carry no history.
4. **Recover `docs/releases/0.5.3.md`** (finding 5, quick win) from branch
   `codex/release-0.5.3` into the tree, unchanged.
5. **`AGENTS.md` experience-review line** (tension, quick win). Replace "Human experience
   review assesses feel and fidelity separately from automated correctness"
   with the decision of 8 November: playtests by people happen outside the
   repo process, never gate it, and no agent requires or expects such reports.
   Keep `AGENTS.md` under 80 lines.
6. **Retire "owner"** (tension, quick win) in the three skills (`close-loop`,
   `shared-components`, `fx-development`) and in current docs (`development.md`,
   `design.md`, specs). Historic records and plans stay as written.

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

## Exploration, 8 November 2026

Evidence brought by the assistant from the loop records; the reading is the
designer's, in the designer's words.

### A. Exploration stops when it turns into discussion

Evidence: the loop is named by the designer in ten of twelve stopped studies
(`2026-10-29-planet-roles-cycle.md`, `2026-11-01-lab-instrument.md`,
`2026-11-01-path-instrument-closure.md`, `2026-11-06-derelict-draft-two-closure.md`
and the list in loops appendix A §2.1); the value sits early in each ("the only
usefull excample was the first"); after a rejected guess the agent's next turn
was often not a new guess ("how about asking them?", "concrete answers on the
page rather than more process explanations", "neither recovery response
delivered a replacement visual artifact"). The records are silent on what was
visible in the turn before the designer called the loop.

The designer, on the sign that shows before the loop is named: "the model
answers to the chat and doesn't just continue the exploration. And then when
I answer to the chat, it again answers to the chat and doesn't continue the
exploration. If the agent then answers third time to the chat, instead of
continuing the exploration, or by deleting the previous step and claiming it
was a mistake, or no mistake was clearly flagged or removal of the step asked,
we are clearly in a loop state. It's not the only one, and this is not some
litmus test we can just run at that, but it's kind of the clearest pattern we
have."

On what the pattern is: "the agent starts defending its work and defending
its rationals instead of just understanding that in a creative process like
this, we fail forward, we don't care why we failed, let's just figure out
something else. [...] We never must start defending or feel defensive because
somebody is frustrated or something doesn't make sense. We just try something
else. [...] We're just throwing balls on the wall and see which one sticks. And
if they don't, that's nobody's fault."

No change named.
