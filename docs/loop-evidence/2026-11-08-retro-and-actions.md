# Retrospective at 0.5.6 and the actions taken the same day

Closed at the designer's request on 8 November 2026 (Europe/Helsinki), in the
session that held the retrospective. Base revision `3b3eb94` on `feat/0-5-0`.

## Intent and scope

The designer asked for a retrospective across "all the lessons this far" as
0.6.0 closes: an overview of the state of the work, the developer tooling, the
harness and project health, with "the most pressing or repeating issues", in a
bespoke folder under `docs/reviews/`, using Haiku and Sonnet sub-agents to
digest material. After the review the designer asked for advice on how to
continue, answered clarity questions, and authorised a series of fixes. Late in
the session the designer said the conversation was "looping on completely
irrelevant questions" and asked to return to the retro; the final deliverable
was a prompt and a board "so that it is easy to start on a clean loop".

Designer decisions, in order, as stated in conversation:

- 0.6.0 "the ion storm" scope, given as a spoken list (stable ships Wasp, Scout,
  Fighter; light and heavy ion engines; light ion cannon and a rotating ion
  point-defence system; derelicts into the main game; Hangar selects the ship;
  experimental parts make a run unscored, visibly). Later: "stabilizers are no
  equipment, they are a ship option"; stable equipment is "the potential wells,
  and the gravity coil".
- Releases from `main`: "Release from main", fast-forward to `v0.5.6` and protect.
- Loop evidence retention: "Report plus key logs" inside the repo.
- Human experience review: the `AGENTS.md` line "is a complex misunderstanding";
  playtests by people "can not in any manner, let that tie our hands" and no
  agent should "require or expect such reports to be written to the repo".
- Memory: "we use multiple agents, not all claude. memory can not be used
  reliably. everything else is likely model misunderstanding or extrapolation".
- Point-defence system: "Design study first".
- The "deeper root cause" of 5 November: "those really relate to situations
  where we had two large design questions or something like that, and not like
  anything by the agent themselves at all".
- Formatting: "fix the biome, no tabs, but 2 spaces!".
- CI: "I cant remember comissioning one? could be a legacy CI"; then "trim";
  later, on the assistant's recommendation, "yes, please" to deleting it.
- "lets stop here, we are looping on completely irrelevant questions."
- "lets do a new cycle ... goal is to asses, and act on retro findings."

## Changes delivered

All on `feat/0-5-0`, each committed by pathspec; the other session's files
were never staged.

| Commit    | Change                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------- |
| `a25e3f6` | `docs/reviews/2026-11-08-retro-0-6-0/`: README overview plus six sub-agent digests             |
| `b3c1e51` | `docs/plans/2026-11-08-ion-storm-0-6-0.md`; decisions appended to the retro README             |
| `5223ffb` | Sonnet agent: 133 missing Markdown link targets repaired, 48 files, two skills included        |
| `d8f98b9` | Sonnet agent: contracts gate fails on a missing link; record `2026-11-08-link-repair.md`       |
| `fa5ad4f` | `.gitignore` anchored to `/artifacts/`; evidence folder excluded from Biome; report added      |
| `3d51381` | Biome two-space indentation; 641 files reformatted; two gate regexes made indentation-agnostic |
| `55761f5` | Retro README: `main` protection and the CI competition finding                                 |
| `2beaf81` | Workflow trimmed to `main`, tags, pull requests; docs updated                                  |
| `8078dc8` | Retro README issue 9: the unordered CI workflow                                                |
| `09d57d9` | Workflow deleted; required check removed; docs and retro updated                               |
| `9f002b3` | `docs/plans/2026-11-08-retro-actions.md` board; retro README links it                          |

Outside the repository: two memory files updated or added in the assistant's
memory directory (human review, memory unreliability). Branch protection on
GitHub `main` was set through `gh api` and then changed: first force-push and
deletion blocks, then a required `verify` check added, then the check removed.
Final state read back: `allow_force_pushes` false, `allow_deletions` false,
`required_status_checks` null, `enforce_admins` false.

## Checks

Environment: macOS arm64, Node 24.14.0, pnpm 10.33.0, Biome 2.6.3. All runs
are `pnpm verify:quick`, partial verification (contracts, lint, types, unit);
build, browser, rules and competition were not run in this loop.

| Report directory under `artifacts/verification/` | Revision  | Tree  | Outcome                                               |
| ------------------------------------------------ | --------- | ----- | ----------------------------------------------------- |
| `2026-11-08T10-42-14.671Z-tC6xpU`                | `3b3eb94` | clean | passed; 308 unit tests; 133 link warnings advisory    |
| `2026-11-08T11-15-38.346Z-iBrm3J`                | `5223ffb` | dirty | passed (Sonnet agent's run; gate edits uncommitted)   |
| `2026-11-08T11-18-46.203Z-O7LUmP`                | `fa5ad4f` | dirty | failed: contracts, colour-parity regex expected a tab |
| `2026-11-08T11-19-34.903Z-S3zVOt`                | `fa5ad4f` | dirty | passed after the regex fix; committed as `3d51381`    |

The dirty trees held the other session's in-game-controllers files in every
run after the first. No run was made on the final revision `9f002b3`.
`node scripts/check-contracts.mjs` printed `0 missing target(s)` after
`5223ffb` and at each later check (direct inspection). The pre-commit hook
rejected one commit attempt: the retained `report.json` under
`docs/loop-evidence/artifacts/` failed Biome formatting; resolved by excluding
that folder (`fa5ad4f`). The second `report.json` is retained in-repo at
`docs/loop-evidence/artifacts/2026-11-08-link-repair/`.

GitHub Actions (before deletion): of the last 50 runs, 20 failed, 10 cancelled,
20 passed (direct inspection with `gh run list`). Stages in the 20 failures:
competition 15, browser 11, lint 9; every failure after 5 November was
competition. Run 42461991028 (`3b3eb94`, 8 November) failed on
`tests/firebase/competition.spec.ts`: Playwright snapshot shows the flight at
"SURVIVAL 2.9s" when the 60 s test timeout hit; downloaded evidence in the
session scratchpad only. Run 42475369145 (`main` at `c0f0a59`) also failed on
competition. The same commit passed earlier from the `v0.5.6` tag (run
42461877351).

## Publication

- Local commits: the eleven above.
- Pushed: `main` `47e38a1..c0f0a59` (fast-forward to `v0.5.6`);
  `feat/0-5-0` `3b3eb94..2beaf81`, then `2beaf81..9f002b3`. The closure
  commit for this record is local only.
- No release prepared, no deployment, no live verification in this loop.

## Human feedback

- On the retro method and pace, after the CI thread: "we are looping on
  completely irrelevant questions. I cant understand the topic, and these turns
  just turn us away from the goal."
- On the stop: "ah, so I oversteered, by trying to stop a loop, after all."
- On the CI: "a key finding is that there is some CI that we have not ordered".
- On starting 0.6.0 work: "i dont see how starting work on 0.6 would
  contribute to retro related fixes here?"
- On perf machinery: "if we want to put in some machinery on perf testing,
  thats a big thing to do and maintain, while we still are in very early alpha".

## Designer's note after closure, 8 November

Added to the record after the first closure commit (`4f4749a`), from a spoken
note the designer pasted. Attributed statements:

- Purpose of the retro: "to improve the human team's understanding of the
  harness, the project, and everything here"; improvements "are done
  explicitly human in the loop. Not even like human on the loop"; "we tried to
  start doing fixes. Instead of trying to explore. Issues."
- Finding A: exploration "is a work where we confirm guess things, and they're
  right or wrong. And if they're wrong, we guess new things. We don't discuss.
  We don't explain"; studies fail because "we in the study start looping over
  insignificant details which do not answer the design study question".
- Finding B, "the biggest issue": "we fail to identify when the design question
  is such that the study format cannot answer it"; "often logged as model
  failure or loop failure" but in reality "missing any sense of a rubric, a
  way to evaluate the design question, the zero one at all".
- Finding C: "we failed to use the design system many times; the components
  are invented in place instead of flagging that is missing from the design
  system, or that the agent didn't know how to use the design system".
- "Everything else is like technical findings, which we might or want to learn
  from, but we don't even know if we want to address before, like, next
  version, and one after that."
- The designer's own assessment: "I should have pointed out my findings for
  the 0.5 work" at the start.

## Findings (observations)

- Sub-agent digests were used as the retro's evidence base. The assistant
  spot-checked the gate output (133 links), the branch position (`main` 195
  behind), the study registry counts (21/2/10) and the CI run outcomes
  directly; other figures in the six appendices are the sub-agents' reports.
- `.gitignore` `artifacts/` (unanchored) ignored `docs/loop-evidence/artifacts/`;
  the 7 November evidence files are tracked, so they were added past the rule.
- The contracts gate's colour-parity regexes assumed tab indentation
  (`scripts/check-contracts.mjs` lines 120 and 124 before `3d51381`).
- During the session another session modified, in this checkout,
  `in-game-controllers` study files; by closure the set had grown to three
  modified files, `studies.ts`, and two untracked bench components. Provenance
  not investigated.
- The workflow `.github/workflows/verify.yml` dated from `88f3fca` and
  `3041a80` (28 October). The factory spec's definition of done named CI; the
  designer did not recall commissioning it. The retro README records this as
  issue 9; the attribution of the pattern to "the factory invented a process"
  is the README's interpretation.
- The retro README's ranking and the "pressing issues" framing are the
  assistant's interpretation, requested by the designer as a retrospective.
- The 5 November "deeper root cause" is, per the designer, about scope in
  loops, not tooling; the assistant's earlier guess (shared checkout, ports)
  was not confirmed.

## Evidence gaps

- The sub-agents' transcripts and the downloaded CI run artifacts live in the
  session scratchpad and are not retained.
- Quick-verification reports are ignored local files except the one retained
  under `docs/loop-evidence/artifacts/2026-11-08-link-repair/`.
- No verification of any kind was run on `9f002b3` or on the reformatted tree
  after commit; the last passing run was a dirty tree at `fa5ad4f`.
- Deleted GitHub run logs remain on GitHub subject to its retention; the
  workflow file is gone from the tree, so no new runs will occur.
- Memory files are outside the repository and, per the designer, not reliable.
