# Engine Effects — study and alpha patch 0.3.5

Closed 30 October 2026. Evidence collection only; no new lessons or process changes
are inferred by this record. Sources: this conversation, the revisions below, and
local artifacts inspected at closure. No tests or production actions were rerun for closure.

## Intent and owner decisions

Make flying visually engaging through filled glowing surfaces inspired by late-1990s
and early-2000s vector effects. The owner explicitly distinguished this from drawing
lines. Scope included engine appearance, fading world-space residue, and rendering.

- 02.1 established the liked glowing-surface direction.
- 02.2 explored angled engines and a continuous tail. The owner liked the angled
  plumes but found the residue, flat release edge, and instant flame loss unsuitable.
  This experiment remains unresolved and preserved, not accepted as the solution.
- 02.3 emitted complete surfaces that continue fading after release. Owner response:
  “YES! thats it”. This accepted the lifecycle, not final tuning.
- 02.4 connected plume size to delivered engine thrust. The owner requested no
  additional thrust at approximately 750 units/s. The implemented starting rule is
  directional; it preserves faster existing motion and allows braking/sideways thrust.
  It does not impose a total-speed ceiling through all manoeuvres.
- The owner clarified four study parts: design problem, exploration, readiness as
  feasibility in the current setting, and integration as the how/why implementation
  plan. The quality rubric is separate. The skill, specification, and study were
  corrected during this loop; this is an explicit owner decision, not an inferred lesson.
- The owner stressed early-alpha scope: good enough to implement and learn from,
  without specifying the eventual product. Configurability and final tuning were
  removed as prerequisites.
- “commit, push, implement (after push) … approved as is” authorized the sequence.
  After implementation, “this is good, release as new patch version” authorized release.
  These comments do not establish measured device performance or universal fidelity.

## Delivered revisions

- `989304f9a39f1082e65304dcf8d6b68fdb3c26f7`: approved study, preserved examples,
  separate quality assessment, and four-part workflow corrections. Committed and
  pushed before implementation began.
- `97190680057ae27c85e1bd4c9b7cb7e6c60f4ace`: shared plume lifecycle and drawing,
  per-engine output, provisional 750 directional cutoff, tests, updated visual
  baseline/specification, and workspace version 0.3.5. Committed and pushed.

Implementation replaces FlightDeck's line trace and separate attached flame in both
Lab and game. Core effects own complete surfaces; simulation time advances a bounded
collection. Release stops emission, pause freezes aging, reset creates an empty
collection, and wrapping never connects distant emissions. Area follows normalized
engine output independently of gravity. Existing study examples remain references.

Traceable sources:
[study](../../apps/web/src/pages/lab/studies/engine-effects.astro),
[plume](../../packages/core/src/lib/effects/engine-plume.ts),
[physics](../../packages/core/src/lib/physics/Physics.ts),
[simulation](../../packages/mode-a/src/lib/simulation.ts),
[alpha specification](../specs/playable-alpha.md).

## Verification evidence

Final `pnpm verify`: **passed**, 12:25:57–12:27:16 UTC on 30 October 2026.
The report identifies base revision `989304f`, with the implementation/version working
changes subsequently committed as `9719068`; it is not a post-commit test run.
Source fingerprint: `2d4d616d63222df5e519e7ff68ae73f24d90bcf133e7cbcd334e7a8f1449748f`.
The report records `sourceUnchanged: true`. Environment: Darwin arm64, Node v24.14.0,
pnpm workspace, temporary official Temurin Java 21.0.13 runtime, browser and Firebase
emulator servers enabled.

All commands passed: `check:contracts`, `check:commits`, `lint`, `check:types`,
`test` (42 tests), `build`, `test:browser` (8 tests), `test:rules`, and
`test:competition`. Commands ran through `pnpm run` under the verification runner.
The release commit's commit-message hook also passed.
Report: `artifacts/verification/latest.json`; individual logs are in that directory.

Earlier runs were not complete passes: formatting failed and was repaired; local
browser server startup was blocked by permissions; backend checks lacked Java.
The first executable browser run after implementation had seven passes and one
visual-baseline failure. The agent inspected the new flight image, updated the
baseline for the intended exhaust/trajectory change, and reran all eight browser
checks successfully. Screenshot tolerance was not changed. Earlier aggregate logs:
`/tmp/engine-study-verify.log`, `/tmp/engine-implementation-verify.log`,
`/tmp/engine-browser.log`; baseline update: `/tmp/engine-baseline.log`.
Later successful runs are separate evidence, not retroactive passes for those runs.

## Publication and live verification

Local HEAD and remote-tracking `origin/feat/0-4-0` were both `9719068` at closure;
the working tree was clean before adding this record. Push success was observed
in the release turn. No additional remote query was made for closure.

`pnpm exec firebase deploy --only hosting --project void-drift-alpha` completed
successfully. Log inspected: `/tmp/void-drift-035-deploy.log`. Hosting destination:
https://void-drift-alpha.web.app. No Firestore rules deployment was part of this patch.

The release turn downloaded live HTML and assets: HTML matched the local release
build; `package.Bofzob7x.js` contained 0.3.5; `FlightDeck.nOE2Dwls.js` matched the
verified local flight bundle. The first check looked for the version/FlightDeck
reference in HTML and found neither; subsequent inspection found the version in
its generated JavaScript module. This was asset verification, not a post-deployment
manual gameplay or live score-submission test.

## Limits and retention

Human full-scene feel beyond the owner's “this is good” feedback, physical-phone
performance, and sustained frame rate were not established. Tuning remains provisional.
The four-part workflow's general effectiveness was not established by these changes.

Verification reports, test output, built files, and temporary downloads are local,
ignored or replaceable artifacts; future runs may overwrite them. Essential outcomes
and identities are summarized here. Deployment and live-fetch files under `/tmp`
are temporary. The screenshot baseline is tracked in the release revision.
This closure record is local documentation and was not included in the deployed patch.
