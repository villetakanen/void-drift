# Retro actions, 0.5.6 to 0.6.0

Working board for acting on the findings of the
[retrospective held 8 November 2026](../reviews/2026-11-08-retro-0-6-0/README.md).
Each item names the finding it serves, what to do, and its state. A loop that
takes an item moves it to done in the same commit as the change, with the
commit hash. Items marked "decision" wait for the designer; do not act on
them without an answer.

Status: open; started 8 November 2026.

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

Documents only. No decision needed. Pathspec commits.

1. **Plan status lines** (finding 5). Five plans contradict the tree:
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
4. **Recover `docs/releases/0.5.3.md`** (finding 5) from branch
   `codex/release-0.5.3` into the tree, unchanged.
5. **`AGENTS.md` experience-review line** (tension). Replace "Human experience
   review assesses feel and fidelity separately from automated correctness"
   with the decision of 8 November: playtests by people happen outside the
   repo process, never gate it, and no agent requires or expects such reports.
   Keep `AGENTS.md` under 80 lines.
6. **Retire "owner"** (tension) in the three skills (`close-loop`,
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
