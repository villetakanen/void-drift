# Game screen and steering — loop evidence

Closed locally on 2026-11-05 (Europe/Helsinki). This record collects evidence;
it does not establish human acceptance or release readiness.

## Intent and decisions

The user requested a usable, immersive Survival screen following the front-page
uplift, with header removal as the primary change. Accepted scope:

- A focused [Game Screen contract](../specs/game/game-screen/spec.md), separate
  from Survival rules, camera policy, controls, HUD and dialog behavior.
- Adaptive 16:9–4:3 stage, constant logical height 1080, side gutter bounds of
  180 logical units each (one sixth of stage height), scaled with the stage.
- Navigation behind Pause or completed-run UI; touch gesture containment;
  portrait/background suspension, cleared held input and deliberate Resume.
- Preserve control appearance and arrangement. The user explicitly confirmed:
  “not touching camera here is okay for the scope.” Active-area camera fitting
  remains separate work. Test flight retains its toolbar.
- After reporting unresponsive steering, the user requested life support at
  **1.5 energy/s**, then a commit and push.

## Delivered revision

[782f2389dfb84863be337eccc0aaa9c2c17a4342](https://github.com/villetakanen/void-drift/commit/782f2389dfb84863be337eccc0aaa9c2c17a4342)
contains the screen implementation, focused contract, browser/capture coverage,
and shared life-support calculation across simulation, propulsion and Hangar
estimates. The simulation uses the same constant for supply and engine demand.
Wasp tests cover actual left/right turning and braking after key release.

The commit excludes pre-existing directional-speed trial code, release version
edits and unrelated evidence/planning files. It includes formatting-only cleanup
and assertions updated for the removed header and accepted life-support rate.

At closure, direct repository inspection found HEAD at `fbce5cc`, after `612fc5f`
and `782f238`. Those later starter-Wasp and landing-menu changes are outside this
loop. The working tree still contains unrelated pending work. This record does
not transfer the checks below to those later revisions.

## Human feedback and observed behavior

- The user reported: “the ‘turn’ eys light up, ship does not respond”. This is
  feedback about steering, not general visual acceptance of the new screen.
- Source inspection found the shared drain at 0.8 while simulation supply and
  engine-demand calculations still used literal 3. New simulation tests for
  both Wasp steering commands failed with zero rotation before the correction
  and passed after both calculations used the shared constant.
- Earlier tests exercised forward thrust and pad activation; the added browser
  tests exercise each arrow key's resulting spin and braking after release.
- Agent inspection of desktop, iPad-sized, phone, portrait and pause captures
  found the screen contained and controls visible. This was not physical-device
  testing or human approval of feel/fidelity.

## Verification evidence

Recorded full runs used Node v24.14.0 on darwin/arm64, Chromium, local browser
servers and Java 21 Firebase emulators. Reports identify dirty working trees on
base `3b572e7`, including unrelated pending edits; they are not clean-checkout
certification of `782f238`. Full-run commands used the repository Java 21 runtime
via `JAVA_HOME` and `PATH` with `pnpm verify`.

| Evidence                                                                                           | Outcome and qualification                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Initial full run](../../artifacts/verification/2026-11-05T17-34-04.930Z-R8v1HO/report.json)       | Failed: lint, 3 unit tests and 4 browser tests. Contracts, commit checks, types, build, rules and competition passed.                                                                                                                  |
| [Steering-fix full run](../../artifacts/verification/2026-11-05T18-14-00.622Z-pAi0Ol/report.json)  | Passed every gate, source unchanged. At the then-current 0.8 drain: 232 unit tests and 54 browser tests passed. Fingerprint `93f21d954026402843ae3bba2519a4fb5a4042307718485ae8da1c08f5adfe67`.                                        |
| `pnpm verify`, run `2026-11-05T18-22-15.911Z-awUTZl`                                               | Interrupted after unit tests exposed two assertions still expecting 0.8. Final report unavailable. Assertions changed to 1.5 and the focused Potential Well tests passed.                                                              |
| [Final 1.5 full attempt](../../artifacts/verification/2026-11-05T18-23-23.365Z-LNJ1co/report.json) | Overall failed: browser server port 4322 was occupied. Every other gate passed, no skipped steps, source unchanged. Fingerprint `ab65cfd0b32b7ea95dc27fda8c77308f8bfbeb18d5b0c46d6a2f6462da28c5ac`.                                    |
| Subsequent `pnpm test:browser` at 1.5                                                              | Session tool output: 53 passed, one Hangar test timed out after returning unexpectedly to the builder. The commit hooks ran during this run; the assistant attributed the interruption to that timing, without a separate causal test. |
| `pnpm test:browser tests/browser/builder.spec.ts --grep "preserves other chassis"`                 | Session tool output: the failed Hangar test passed on retry (1 passed). No source fix was made for that timeout.                                                                                                                       |
| Commit hooks                                                                                       | Pre-commit formatting passed. First commit message failed the line-length rule; wrapped message passed and commit `782f238` was created.                                                                                               |

The final chat statement “checks passed after one browser-test retry” refers to
combined command outcomes. There is **no single all-passing full verification
report at 1.5** in this loop. The prior all-passing report is at 0.8.

Other intermediate session outcomes: sandbox server startup was denied, one
capture attempt encountered an occupied port, and one browser rerun was stopped
after Vite returned stale dependency responses during a concurrent build. These
were failed/interrupted attempts, not passes. A baseline temporary checkout with
the original FlightDeck reproduced the three earlier simulation failures and the
stabilizer browser failure. Their eventual correction is covered by the passing
steering-fix report above; baseline reproduction output survives in this conversation.

## Visual artifacts and retention

[Capture directory](../../artifacts/review/2026-11-05T17-33-07.199Z-80473bcd-2bbc-49ba-863f-4446a12cc3dd/results/game-screen-Survival-scree-25c66-ktop-tablet-and-phone-sizes-chromium/)
contains desktop, iPad-sized, phone, portrait and pause screenshots from
`pnpm test:capture tests/review/game-screen.spec.ts` (passed on port 4344).
These captures predate the final steering correction and 1.5 setting.

Verification reports were inspected directly during closure. Captures were viewed
during implementation; their directory was checked during closure. Standalone browser retries and the baseline reproduction are supported by prior
session tool output; mutable Playwright output is not treated as a durable copy
of those runs. Artifact directories are ignored local files, not a backup.

## Publication and remaining limits

- Local commit: `782f238`, directly inspected during closure.
- Push: session `git push origin HEAD:feat/0-5-0` succeeded; subsequent
  `git ls-remote` returned the same full revision for `origin/feat/0-5-0`.
  This is the historical push result, not a claim about the remote's current tip.
- Deployment and live verification: neither performed by this loop.
- Physical iPad Safari selection/callout behavior and sustained device performance
  remain unverified. Automated touch evidence is Chromium-based.
- No final human visual/feel acceptance was recorded. Later code and dirty-tree
  changes require their own evidence.

No lessons, signals, standing process changes or follow-on requirements are
inferred by this closure.
