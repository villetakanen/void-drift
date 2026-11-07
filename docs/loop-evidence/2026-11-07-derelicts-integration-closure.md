# Derelicts integration — loop closure

Date: 7 November 2026, Europe/Helsinki.

## Intent and owner decisions

Separate fitted Test flight into safe practice and a playable Derelicts mode,
using the accepted wreck artwork and shared simulation, weapons and effects.
Implement in atomic commits, resolving dependent decisions as they arise.

- Owner accepted staged shedding with energy released at player destruction.
- Owner clarified that environmental destruction destroys contained energy and
  awards no kill bonus. This superseded the earlier proposed environmental drop.
- Owner requested an early Hangar entry so the intermediate mode could be played.
- Owner deferred generated solar systems because another agent is working on suns;
  generation must remain untouched by this loop.
- Owner identified final Hangar copy reconciliation as the final deliverable.
  Verification and experience review are evidence activities, not additional
  feature deliverables. This closure does not certify release readiness.

Sources: this conversation and the preserved
[implementation plan](../plans/2026-11-07-derelicts-mode.md).
Contracts: [Practice](../specs/game/test-flight/spec.md),
[Derelicts](../specs/game/derelicts/spec.md),
[Hangar](../specs/game/hangar/spec.md), and
[effects](../specs/factory/effects/spec.md).

## Delivered revisions

| Revision  | Delivered change                                                    |
| --------- | ------------------------------------------------------------------- |
| `33aaec2` | Explicit flight modes with legacy input compatibility.              |
| `9fc1eec` | Safe repeatable practice, full resources and no encounters/failure. |
| `0ad53ed` | Seeded independent boundary arrivals and encounter timing.          |
| `b171d89` | Early Derelicts launch from Hangar with the fitted ship.            |
| `e55fcad` | Player-kill attribution and frozen transient game-over score.       |
| `057a1ab` | Shared accepted wreck artwork and canonical Lab rendering.          |
| `536cef2` | Fitted material collisions, staged damage and physical shedding.    |
| `212aa42` | Moving hollow energy square and fixed player-destruction pulse.     |
| `5ff8834` | Final Hangar mode copy and completed plan with generation deferred. |

Direct inspection at closure confirmed these commits in local history. The final
copy commit changes five files, describing weapons as “Derelicts only” and
distinguishing safe Test flight, Derelicts and custom survival. No generation
implementation belongs to that commit. Pre-existing and concurrent Hangar, study,
instrument and sun work remains outside this loop's commits.

## Check evidence

Earlier slice outcomes and repaired failures are attributed to the implementation
plan; they were not rerun at closure. The following final-slice logs were directly
inspected at closure. They describe the dirty working tree that became `212aa42`,
alongside unrelated working changes, rather than a clean checkout of that commit.
Environment: local macOS workspace, Vitest 4.0.16 and Playwright Chromium; browser
server port 4362. No device-performance claim follows from these results.

| Command or check                                       | Outcome                                                                                                                                                        | Source                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm test`                                            | 274 tests across 47 files passed.                                                                                                                              | `/tmp/derelict-energy-unit-verified.log`                         |
| `pnpm check:types`; final `tsc -p tsconfig.check.json` | Passed; Astro/Svelte reported no errors or warnings.                                                                                                           | `/tmp/derelict-energy-types.log`, `/tmp/derelict-energy-tsc.log` |
| `pnpm check:contracts`                                 | Passed, including 14 factory tests; existing advisory link warnings remained.                                                                                  | `/tmp/derelict-energy-contracts.log`                             |
| Focused Playwright browser run                         | Four passed: square/pulse lifecycle, physical shedding, Hangar entry and frozen score.                                                                         | `/tmp/derelict-energy-browser.log`                               |
| `pnpm build`                                           | Passed; 70 pages built.                                                                                                                                        | `/tmp/derelict-energy-build.log`                                 |
| Production shedding capture                            | One passed; captures were inspected during implementation.                                                                                                     | `/tmp/derelict-energy-capture.log` and capture directory below   |
| Changed-file Biome and commit hooks                    | Passed for energy slice and final copy commit. Final copy's first hook failed on Markdown table spacing; formatting was corrected and the normal hooks passed. | Tool output in this conversation                                 |

The focused browser command selected `tests/browser/derelict-energy.spec.ts`,
`derelict-shedding.spec.ts`, `derelicts-entry.spec.ts` and `derelicts-score.spec.ts`.
The capture command selected `tests/review/derelict-shedding.spec.ts` with
`playwright.capture.config.ts`.

Capture directory:
`artifacts/review/2026-11-07T08-21-59.477Z-793e5a1d-3e7b-4073-90e0-78187522b149/`.
The behavioral Lab check used 1280px width; captures used 1440px. Implementation
inspection observed the hollow square moving away with the pulse at the rupture
point. This is agent inspection, not owner acceptance of visual feel.

Full `pnpm verify`, the complete browser suite and backend suites were not run for
the final slice. The plan reports repository-wide lint failures in unrelated study
SVGs and intermittent earlier factory shutdown-marker timeout failures followed
by successful isolated reruns. Those earlier observations were not reproduced at
closure. Sustained frame-time measurements and human in-flight acceptance remain
unavailable evidence, not unfinished implementation scope.

## Publication and feedback

Implementation commits were pushed to `origin/feat/0-5-0`. At closure, direct
inspection found both HEAD and the local remote-tracking ref at
`5ff8834fd1fe6dcd3c6c2f900bb4da8f7f206b4c`. The preceding explicit push returned
“Everything up-to-date.” Deployment and live verification were not established.

Owner feedback drove the environmental-energy correction and scope reduction
above. Requests to proceed and close the loop do not establish acceptance of
handling, readability, balance or sustained rendering performance.

## Evidence limits

Temporary logs and ignored capture artifacts can disappear; essential outcomes
are summarized here. No clean-tree full-verification report or deployed revision
was established for this closure. No tests were rerun to fill historical gaps.
This record collects evidence only; it introduces no lessons or process changes.
