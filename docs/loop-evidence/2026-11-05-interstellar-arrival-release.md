# Interstellar arrival and 0.5.4 release

Closed at the owner's request on 5 November 2026 (Europe/Helsinki).

## Intent and owner decisions

Use the accepted countdown study to make Survival feel like flying into the system
from interstellar space: three seconds before release, a fresh run seed, a random
point around the rim, a heading interpreted as 37 degrees off inward, and speed 600.
The owner subsequently moved the countdown from the ship to the screen centre and
requested an Android-green line behind the ship to show its approach.

The owner said “superb” after the speed-line delivery, then requested a patch release.
This is positive conversational feedback on that delivery; the conversation does
not identify a device, play duration or separate balance/fidelity assessment.
The release scope was clarified to include the accepted propulsion rebalance and
startup polish. Gravity was already in 0.5.3; it was retained without new tuning.

## Delivered changes and revisions

- Existing propulsion implementation: `1d80106027821893055bffedd790f4c02296ea0f`.
  Hull base speed plus installed main-engine contributions defines the powered
  cruise ceiling, retaining braking, steering and overspeed momentum.
- `ba81172`: arrival implementation, shared countdown outlines/painter and speed-line
  painter, version 0.5.4, contracts, release notes and browser/backend adjustments.
- `e8cbd2ec804dcf99236becb7444167185a71ef8c`: reproducible arrival fixtures for score
  verification; final tested and published revision.

Survival starts at radius 1180 inside the 1200 wrap boundary, at speed 600 with
heading and velocity 37 degrees off inward. The centred 3, 2, 1 / GO count holds
simulation ticks and resources; reduced motion retains the count without flicker.
The rear speed line points opposite velocity and fades over 1.5 seconds of flight.
Lab and builder Test flight retain their previous starts; custom Survival uses the
arrival. Scores use `arrival-1`, separating these rules from prior challenges.

The release was built in `/private/tmp/void-drift-release-054`, on
`codex/release-0.5.4`, from the existing committed propulsion work. It excluded the
uncommitted directional-speed experiment and pending spec relocation. Small
formatting repairs needed by the release gates were included. Relevant follow-up
fixes were copied into the original workspace without committing its other changes.
Before this evidence-only closure commit, the original workspace was on `9298ee9`
with staged relocations and working edits;
it is not the clean tree used for release verification.

Current workspace contracts: [Survival](../specs/game/survival/spec.md),
[effects](../specs/factory/effects/spec.md), and [play](../specs/game/spec.md).
The release commit uses their original pre-relocation paths.
[Release notes](../releases/0.5.4.md) describe the shipped scope.

## Verification and repairs

Reports below were directly inspected during closure; no gameplay checks were rerun
for closure. Commands ran on macOS arm64, Node 24.14.0, Chromium and local Firebase
emulators using the repository's Java 21 runtime.

Early implementation checks passed 229 unit tests and type checks. Earlier type
errors in the countdown import and FX clock reference were repaired. Initial release
verification failed formatting and a score fixture still using `ion-1`; restricted
local-port access also prevented browser/emulator checks. These were failures or
unavailable checks, not passes. Later runs used the required local-server access.

The first accessible full run passed 38 browser tests and failed the custom-Survival
fixture's old short-death expectation. That fixture was updated to wait for the count
and actual game over. A subsequent score test exceeded its 60-second limit while a
random arrival coasted. Production simulation identified short seeded arrivals
(Scout 158, Corvette 80); the test fixes only the single-word arrival random value,
checks the resulting seed and predicted death tick, and retains score-write retry and
shared-read assertions. Gameplay randomness remains in production.

The final clean candidate passed `JAVA_HOME=tools.local/java21/jdk/Contents/Home
pnpm verify`: contracts, commit syntax, lint, types, 229 unit tests, production build,
39 browser tests, 12 Firestore rule tests and the two-pilot competition test. No
stages were skipped; source remained unchanged.
[Full report](../../artifacts/verification/2026-11-05T13-22-17.904Z-UQT3JB/report.json).
Source fingerprint: `f0641ca1ce330cb03be21f33d57183918a6bb08ee3ccd97e2c71ff08d6c7dc6e`.

`pnpm release:prepare` and `pnpm release:check` passed. The production browser smoke
passed and the prepared source fingerprint matched full verification.
[Preparation report](../../artifacts/prepared-releases/2026-11-05T13-24-57.295Z-gFVCr5/report.json).
Artifact fingerprint: `8f474afd0f56b8d0170817b914375f555ee64bd6a59a33d15b18cc2ac66a7bfb`.

## Publication and live evidence

- Local release commits were created on `codex/release-0.5.4`.
- Successful push output was observed for that branch and tag `v0.5.4`. At closure,
  the local tag and remote-tracking branch both resolve to `e8cbd2e`. No network
  fetch was performed solely for closure.
- `pnpm release:publish` deployed the checked bundle, Firestore rules and indexes
  to the existing Firebase project at 15:26 Helsinki time on 5 November.
  [Publication report](../../artifacts/prepared-releases/2026-11-05T13-24-57.295Z-gFVCr5/publication-NSKv6z/report.json).
- Separate live Chromium checks passed for version 0.5.4, countdown ticks held at
  zero, flight and keyboard input, pause, the FX Lab, anonymous authentication and
  leaderboard reads. No production score was submitted.
  [Live report](../../artifacts/live-0.5.4/report.json) and
  [countdown capture](../../artifacts/live-0.5.4/countdown.png).

The publication report deliberately retains `liveVerified: false`; the later live
report supplies that separate evidence. The assistant also inspected a local
1280×800 capture of the centred countdown and approach line before publication.
That observation is not an owner fidelity assessment.

## Evidence limits

Final verification, prepared bundle/publication and live artifacts were copied into
the original workspace's ignored `artifacts/` tree. They are local evidence, not
tracked backups. Earlier failed reports and focused checks remain in the temporary
release worktree or `/tmp/release054-*` logs and may be lost when temporary files
are removed. The release commits/tag are pushed; the original workspace has not
been merged to that release branch. Physical-phone performance, sustained FX timing
and repeat-run balance were not assessed in this loop. Closure promotes no lessons
or process changes and does not add product acceptance beyond the feedback above.
