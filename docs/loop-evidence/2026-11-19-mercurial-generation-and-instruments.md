# Mercurial generation and instruments · 19 November 2026

## Intent and accepted decisions

Close the bounded 0.7 work delivering a shared generated mercurial planet in
Survival, Derelicts and Gauntlet, shared appearance, a minimal System instrument,
and Mercurial family inspection. The owner then requested plan reconciliation,
commit and push.

The owner chose replacement rather than an additional planet, permitted removal
of obstructing stock planets, chose seeded radii 16–36u, and retained the one
accepted mineral outlook for this release. The owner added Mercurial to the
Inspector and required System controls over the canvas, design-system buttons,
and a visible warp boundary. The approved gravity amendment is a fixed 75% core
and 25% radius-squared contribution, calibrated to 27u and mass 870. The earlier
fixed generated mass 1450 is superseded, not a surviving mode distinction.

## Delivered changes and revisions

- `3dd987a7` integrates the generator, appearance adapter, System instrument,
  Inspector family and owning contracts, together with other shared-checkout work.
- `5670d389` corrects generated family staging and adds Inspector state/replay
  checks. These commits were inspected directly at closure.
- The closing snapshot, based on `5670d389` plus the session's working tree,
  applies the core-led mass profile to body and well in generated play, Practice
  and Inspector radius edits/seeks, removes duplicate moon-mass settings, and
  adds mass/pull parity tests. It also fixes Inspector selection details,
  System normal-action buttons, overlay layout and full warp-boundary framing.
- The [completed plan](https://github.com/villetakanen/void-drift/blob/9e1e7a2e861ba43db58b536339421da586e3e928/docs/plans/2026-11-19-generated-mercurial-planet.md)
  summarizes final scope and links the owning contracts. It supersedes the
  earlier plan's pending-slice wording; Git retains its delivery notes.

The commit-messages skill requires a whole-checkout snapshot. Concurrent Milky
Way study assets/components/registry work and design-study skill wording are
included in that snapshot but are outside this mercurial loop's conclusions.

## Development checks

These outcomes were reported and inspected in this conversation on dirty working
snapshots based on the two revisions above. They are not results for a tagged
release. No test was rerun solely to reconstruct missing historical evidence.

| Snapshot / command                                                                                                        | Outcome                                                  | Source and limit                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Generator: mode-a Vitest run                                                                                              | 45 files, 250 tests passed                               | Terra report, independently repeated by Sol; original output is in the conversation, with no dedicated retained report. |
| Generator review                                                                                                          | Two passes; no remaining actionable findings on pass two | First-pass Survival-fixture and Practice-constant-coupling findings were corrected; bounded generator review only.      |
| Shared appearance: `pnpm exec vitest run`                                                                                 | 72 files, 375 tests passed                               | Session output; source log `/tmp/mercurial-appearance-unit.log` is temporary.                                           |
| Inspector collateral: `pnpm exec vitest run`                                                                              | 73 files, 378 tests passed                               | Session output and `/tmp/mercurial-inspector-unit.log`; temporary.                                                      |
| Core gravity: `pnpm exec vitest run`                                                                                      | 74 files, 386 tests passed                               | `/tmp/mercurial-core-unit-final.log`, inspected during development; temporary.                                          |
| Core gravity: `pnpm check:types`, `pnpm check:contracts`, `pnpm build`                                                    | Passed                                                   | `/tmp/mercurial-core-types.log`, `/tmp/mercurial-core-contracts.log`, `/tmp/mercurial-core-build.log`; temporary.       |
| Overlay: `pnpm exec vitest run packages/mode-a/src/lib/flight-frame.test.ts packages/mode-a/src/lib/solar-system.test.ts` | 2 files, 13 tests passed                                 | Conversation tool output; no separate retained log.                                                                     |
| Overlay: `pnpm check:types`, `pnpm check:contracts`, touched-file Biome and `git diff --check`                            | Passed                                                   | `/tmp/system-overlay-types-final.log`, `/tmp/system-overlay-contracts.log` and conversation output; temporary.          |

An early System factory-runner check failed on a missing temporary
`emulator-stopped` marker; an unchanged rerun passed all 15 runner tests. The
record does not treat that as a backend integration pass. Implementation tests
initially exposed obsolete fixed-mass/roster assumptions; tests were amended to
the selected contracts before the passing runs above.

## Browser observations and owner feedback

Browser review covered generated Derelicts material/HUD, named Mercury,
Survival/Gauntlet/Practice launch and pause, and System seed behavior, invalid
input retention, repeatability, randomization, resize and material fallback.
Inspector review exercised radius endpoints, held tick/orbit, backward seek,
reset and named Mercury isolation. Later browser inspection on the existing
4321 server measured body/well masses 728.878600823, 870 and 1039.166666667 at
16/27/36u and equal Mercury/family wells at 27u, without page errors.

Final System inspection at 1280px and 1440px showed floating normal actions and
the complete warp circle; Generate and Randomize responded. Temporary captures
include `/tmp/system-instrument-overlay-1280.jpg` and
`/tmp/system-instrument-overlay-1440.jpg`. These were inspected in the session
but are not versioned assets and may disappear. Automated checks, visual
inspection and owner feedback remain separate evidence.

The owner said the Inspector worked as expected and mercurials were as expected,
then confirmed the corrected System instrument worked as expected. These are
UI acceptance statements for the inspected tools, not gameplay or balance
playtesting records. No human gameplay playtesting is recorded here.

A reported Inspector hang was observed as failed JavaScript hydration. The
session found two existing listeners on 4321 serving different dependency hashes,
stopped the older duplicate, and observed working controls after reload. This
sequence is recorded without claiming a general causal diagnosis. At the
owner's later explicit request all Astro processes were stopped; the owner
restarted from Zed. The final UI correction used that existing 4321 server and
changed no server processes.

## Closing snapshot validation

Whole-tree formatting and commit validation are performed for the explicitly
requested closing commit, separately from the historical slice evidence above.
`pnpm exec biome check --write . --error-on-warnings` checked 1130 files,
formatted two and passed. `pnpm verify:quick` then passed all selected checks:
contracts (including 15 factory-runner tests), lint, types and unit tests (74
files, 386 tests). This is partial verification: build, browser, backend and
commit-history stages were not selected by the quick runner.

The [retained report](2026-11-19-mercurial-generation-verification.json) is copied
from `artifacts/verification/2026-11-19T06-24-36.635Z-saaMwS/report.json`, not
`latest.json`. The run was on macOS arm64, Node v24.14.0, based on `5670d389`,
from 06:24:36–06:25:11 UTC (08:24–08:25 Helsinki). It records source fingerprint
`9325d987e86ce787af9611d2cfb06358814a3ce97dca826348f6c7aa368a9089`,
`sourceUnchanged: true` and `selectedChecksPassed: true`. Its `passed: false`
means it is not a full-verification pass. Configured browser URLs in the report
are unused defaults; the quick run started no browser or development server.
The original per-stage logs remain in that specific ignored local artifact
directory and are not retained in Git. Final documentation-only edits add this
result and its report after the tested snapshot; runtime source is unchanged.

## Publication and evidence limits

The earlier integration commits and the closing amendment are on `feat/0-7-0`.
The closing commit contains this record and the reconciled plan. Commit and
push are requested closing operations, with the final revision and result
reported in the closing chat; this record does not pre-certify their success.
No production deployment or live verification is performed by closure.

Temporary logs/captures are local evidence only; this tracked record retains
essential results and their limits. No full `pnpm verify` release certification,
backend integration rerun, iPad touch verification or performance certification
is supplied by this closure. Those gaps are not silently marked passed.
