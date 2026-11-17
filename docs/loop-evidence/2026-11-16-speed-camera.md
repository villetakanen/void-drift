# Speed camera implementation loop — 2026-11-16

## Scope and decisions

Implement the experimental personal Speed camera preference in playable flight,
then amend its presentation and camera behaviour through the decisions in this
chat. The owner closed the loop after selecting a 1.5-second inward wait.
Human playtesting observations are not recorded here, following
[AGENTS.md](../../AGENTS.md). This is an implementation/evidence record, not
product acceptance or a release-readiness finding.

Decisions made during the loop, with superseded approaches distinguished:

- Keep the persisted preference Off by default, independent of Playground,
  simulation, scoring and submitted score data. Legacy valid control choices
  survive the new field; unavailable storage leaves in-memory settings usable.
- The initial Pause switch was removed after correction of the specification.
  Options is the only setting location; Pause retains actions/navigation and
  its existing Settings link, Resume and focus behaviour.
- Continuous inward easing was replaced with timed cuts. The final relative
  levels are 1×, 2×, 4×, 8×; earlier five-level spacing is superseded. The final
  wait is **1.5 active simulation seconds per eligible cut**, replacing 2 seconds.
  Acceleration, lost eligibility, candidate changes and lifecycle resets retain
  their cancellation rules. No inward creep, skipped levels or cut fade.
- Outward zoom uses a continuous, damped ease-in/ease-out response. Final demand
  is 8× through 100 u/s, 4× at 200, 2× at 300 and 1× at 400, with geometric
  interpolation. A 600 u/s arrival is already wide. These are camera thresholds,
  not ship-physics changes. Earlier demand curves are superseded, including the
  requirement that speed multiplied by desired zoom always increases.
- Directional placement and the later boundary-only free region were superseded
  by motion matching plus residual centring. Velocity changes allow transient
  off-centre travel; constant travel eventually centres the moving ship. The
  camera estimates pan travel from successive positions, clearing history on
  reset/wrap. Containment takes precedence; cuts anchor the ship on screen.
- ZOOM appears below Hull and Power in the left gutter when Speed camera is On.
  Only 1×, 2×, 4×, 8× are shown. Nearest-level rounding was superseded: hold 8×
  until actual 4× is reached, then 4× until 2×, then 2× until 1×.
- No Lab study was created. Unrelated shared-checkout work remained outside scope.

## Delivered source and identity

Work remains an uncommitted delta on `main`, based on
`49c2db95f240c59c05acd5b3ea4d601bc3ef0295`. That revision alone does not identify
the implementation; the checkout contains concurrent, unrelated changes.

The loop's source/test snapshot at closure has SHA-256
`ebfa1a312fd6c15cbb55411e1d2ebbfd99f43bf369ff7185181c796a53939759`.
It covers the following files, sorted by repository-relative path, hashing
`path + NUL + file bytes + NUL` for each. It is a selective snapshot, not a
whole-checkout fingerprint or a verification certificate.

- [Camera and shared transform](../../packages/core/src/lib/physics/Camera.ts)
- [Camera regression guards](../../packages/core/src/lib/physics/Camera.test.ts)
- [Settings schema](../../packages/mode-a/src/lib/schemas/settings.ts)
- [Settings persistence](../../apps/web/src/lib/stores/settings.ts)
- [Settings recovery guards](../../apps/web/src/lib/stores/settings.test.ts)
- [FlightDeck wiring and readout](../../apps/web/src/components/FlightDeck.svelte)
- [Options](../../apps/web/src/components/Settings.svelte)
- [Speed camera control composition](../../apps/web/src/components/Settings.svelte)
- [Preference browser journey](../../tests/browser/control-default.spec.ts)
- [Pause isolation, focus and navigation guard](../../tests/browser/dialogs.spec.ts)
- [Competition journey](../../tests/firebase/competition.spec.ts)
- [Competition predictor](../../tests/helpers/competition-flight.ts)

The competition predictor was also corrected to use the journey's Playground-On
rules instead of predicting its end time under Playground-Off rules. This changed
its test setup, not gameplay.

A prompt for the active speccing session was supplied in chat after the final
wait change. Direct closure inspection of the
[speed-camera spec](../specs/game/camera/speed-camera/spec.md) finds the 1.5-second
wait, final speed bands, moving-ship centring, Options-only access and discrete
upper-held readout present. Closure itself does not amend contracts.

## Verification evidence

The saved verification reports identify Node v24.14.0 on darwin/arm64.
Browser checks used local Chromium/Playwright with owned servers; backend checks
used demo Firebase emulators and the repository Java 21 runtime. Local preview
inspection is separate from production verification.

| Evidence and identity                                                                                                                                                                                            | Outcome and limits                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Earlier full verification](../../artifacts/verification/2026-11-16T07-10-30.841Z-Pq6qws/report.json), dirty base revision above; fingerprint `624c9b557619ece82ff60f608c520f290b7334d84562cabea3d14e70188be954` | Failed. Contracts, commits, lint, 202 unit tests, build and 13 Firestore rule tests passed. Types failed. Browser suite: 24 passed, Gauntlet countdown timed out. Competition: ranked journey passed, Playground-On completion failed. Source changed during the run (`sourceUnchanged: false`); this is not final-candidate evidence. |
| [Later quick verification](../../artifacts/verification/2026-11-16T08-35-08.081Z-t8sWpt/report.json), dirty base revision above; fingerprint `b457d5593ca35c4b09fc4f42a48cc74a552fb741d380c12a8810ef656d5abc2c`  | Partial verification failed, with source unchanged during that run. Contracts and 220 unit tests passed. Lint and types failed. Build, browser, commit, rules and competition stages were skipped by quick mode. This predates the final 1.5-second change.                                                                            |
| Final timing edit: `pnpm exec vitest run packages/core/src/lib/physics/Camera.test.ts apps/web/src/lib/stores/settings.test.ts`                                                                                  | Chat tool result reports 26 passed: 24 camera and 2 settings tests. Covers 1.5-second timing, cancellation, lifecycle, containment, anchored cuts, speed bands, moving-ship centring and readout boundaries. No separately saved run fingerprint/stdout artifact; summary retained here from the tool result.                          |
| Final timing edit: scoped `pnpm exec biome check --write` on Camera source/tests; `pnpm exec tsc -p tsconfig.check.json`; `git diff --check`                                                                     | Tool results exited zero. Formatting reported no fixes. Standalone TypeScript passing is distinct from the failing repository-wide Astro/Svelte gate. No separately retained logs or source fingerprint for these commands.                                                                                                            |
| Focused browser command before the final timing edit: `PLAYWRIGHT_PORT=4362 pnpm exec playwright test tests/browser/control-default.spec.ts tests/browser/dialogs.spec.ts tests/browser/game-screen.spec.ts`     | Chat tool result reports all 6 passed. Exercises preference migration/persistence, denied storage, Pause focus/navigation and aspect/suspension behaviour. Predates 1.5 seconds; not rerun solely for closure.                                                                                                                         |
| `pnpm build` before the final timing edit                                                                                                                                                                        | Direct inspection of temporary log `/tmp/speed-camera-close-bands-build.log` confirms 105 pages built successfully. Not a prepared release; no final-timing build identity was captured.                                                                                                                                               |

Directly inspected failure details from the later quick run:

- [Lint log](../../artifacts/verification/2026-11-16T08-35-08.081Z-t8sWpt/lint.log):
  formatting failure in the concurrent rock-atmospheres study page.
- [Type log](../../artifacts/verification/2026-11-16T08-35-08.081Z-t8sWpt/check-types.log):
  `practice.astro` rejects `client:load` on `PracticePlanets`; an authored-materials
  function also has an async-conversion hint. No clean repository-wide type gate
  is established for this loop.
- [Unit log](../../artifacts/verification/2026-11-16T08-35-08.081Z-t8sWpt/test.log):
  52 files, 220 tests passed in that shared snapshot; the total includes other work.

Earlier follow-ups reported by chat tool results: the Gauntlet check passed in
isolation; the Playground-On journey failed again before its predictor correction
and passed after that correction. Those focused results do not rewrite the failed
full report. Their standalone stdout was not retained in a run-specific artifact.
A factory watchdog also failed during an intermediate quick run and passed on
its isolated contracts rerun; later saved contracts checks passed. No general
cause or reliability conclusion is inferred from these sequences.

## Publication and evidence gaps

- This chat performed no commit, push, deployment or production/live verification.
  The production state is not established by this record.
- No clean full verification exists for the final 1.5-second implementation.
  Earlier successful checks must retain their tested-source qualifications.
- Ignored verification artifacts and temporary logs are local evidence, not a
  durable backup. Essential outcomes are summarized above; some standalone
  checks have only the chat tool transcript as their source.
- Human playtesting evidence and experience acceptance remain outside the repo.
  No signal, lesson, process change or next-loop recommendation is adopted here.
- Closure added this record and validated its local links/whitespace only. It
  did not rerun gameplay checks to fill historical gaps or alter production code.
