# Two-pirate Gauntlet and 0.6.1 publication

Closed 11 November 2026. Evidence collection only; no lessons or process changes
are established by this record.

## Intent and decisions

Extend the first pirate encounter at `335da098` to exactly two independently
simulated pirates. Preserve the charcoal Scout fit, normal starting resources,
predictive pilot, separated arrivals and purple `3`, `2`, `1`, `FIGHT` countdown.
Both pirates intentionally target the player. One pirate's death must leave the
encounter running; victory requires both destroyed, with player defeat and
simultaneous endings retained. Progression, waves and multiplayer were excluded.

The designer explicitly permitted friendly fire: “It's okay if the pirates shoot
each other, as long as they try to shoot ... the player.” This is a combat decision,
not a requirement to prevent allied interception.

The designer then authorized 0.6.1 publication from the Hangar, describing the
feature as experimental and requesting no further gameplay expansion. Survival's
`ion-storm` challenge remained unchanged. No human playtesting record was collected.

## Delivered changes and review

Release commit `d718d29bfd169bae421410246cbfb168ed6b21bb` contains the two-actor
collection, independent resources/pilots/weapons/effects, player-directed aiming
with physical friendly fire, contacts, encounter endings, rendering, hostile cues,
pause/return/reset and production-system Lab wiring. Prediction retains scratch
state and the world advances planet time once per authoritative substep. Pilot
planning retains an eight-tick cadence, offset four ticks between pirates.

Sources: [Gauntlet contract](../specs/game/gauntlet/spec.md),
[Lab contract](../specs/lab/gauntlet-bench/spec.md),
[simulation](../../packages/mode-a/src/lib/simulation.ts),
[weapon system](../../packages/mode-a/src/lib/salvage.ts),
[simulation guards](../../packages/mode-a/src/lib/gauntlet.test.ts) and
[browser integration](../../tests/browser/gauntlet-pair.spec.ts).

Luna high implemented; Terra medium performed focused review in two correction
rounds. Conversation review reports identified weapon-clock cadence, destroyed
actor participation, missing pirate contacts, compressed target-index identity,
point-defence ally acquisition and incomplete same-substep retaliation snapshots.
Corrections added behavioral guards for player targeting despite a closer ally
and a real lethal exchange. Terra's final report found no further blocking core
issues; it did not claim to run gates. The coordinator inspected shared boundaries
and the captures. These review observations are attributed to this conversation,
not a separately retained review transcript.

The commit is a whole-checkout snapshot and also includes other sessions' Lab
studies and browser-test maintenance. Later study edits were excluded by verifying
and preparing the saved commit in `/private/tmp/void-drift-release-0.6.1`.

## Verification evidence

All full runs used `pnpm verify`, Node 24.14.0 on Darwin arm64, Chromium browser
checks and the repository's Java 21 runtime for demo Firebase emulators. The
linked reports preserve exact dirty-tree fingerprints and individual command logs.

- [20:54 run](../../artifacts/verification/2026-11-11T20-54-32.677Z-SKjx9Y/report.json),
  dirty `335da098`: failed lint and source stability. Localhost `EPERM` prevented
  browser startup and emulator stages; those are unavailable checks, not passes.
  Contracts, commit checks, types, unit tests and build passed.
- [20:56 run](../../artifacts/verification/2026-11-11T20-56-11.799Z-3zHKce/report.json),
  dirty `335da098`: every check except lint passed, including 186 unit tests,
  23 browser checks and backend suites. Two other-session documentation-formatting
  errors and changed source prevented an overall pass.
- [21:04 run](../../artifacts/verification/2026-11-11T21-04-55.841Z-qcz50w/report.json),
  shared checkout at `d718d29`: lint/types failed while a new study was being
  written; source changed. Other stages passed. This was not release evidence
  for a stable candidate.
- [21:07 isolated run](../../artifacts/verification/2026-11-11T21-07-59.851Z-3dUc84/report.json),
  clean `d718d29`: all required gates passed, no skipped stages, source unchanged.
  This includes 186 unit tests, 23 browser checks, contracts, commit syntax, lint,
  strict types, production build, Firestore rules and competition. Source identity:
  `4764e4f568362880a328e97b81ca33c204df1dd25c127fb275b51c6d3dbd3e9e`.

The developer separately reported ten focused Gauntlet unit guards and two focused
browser checks passing before release. The final full reports provide retained
suite evidence; the focused command output is in the conversation. Browser guards
cover two actors, pause tick freeze/resume, return/relaunch and Lab reset/readouts.

## Publication states

- Local commit: `d718d29` on `main`.
- Push: this session's `git push --atomic` output confirmed `main` advancing from
  `335da098` to `d718d29` and creation of annotated tag `v0.6.1`.
- Preparation: [bundle report](../../artifacts/prepared-releases/2026-11-11T21-13-02.336Z-HA7RkM/report.json)
  records a clean checkout, matching verified source identity and passed offline
  smoke in Chromium 156.0.8078.4. `pnpm release:check` passed.
- Deployment: [publication report](../../artifacts/prepared-releases/2026-11-11T21-13-02.336Z-HA7RkM/publication-l4jbQP/report.json)
  records `deployed` at 21:14:24.723 UTC. Artifact identity:
  `9620911fdedc20262df3b04d0867d251f8edb67d83966f6293b55fbe4931d473`.
- Live verification: [separate report](../../artifacts/live-0.6.1/report.json)
  passed at 21:14:45.391 UTC: version, Hangar launch with two pirates, countdown,
  keyboard flight, pause, FX/Gauntlet Labs, anonymous authentication and leaderboard
  reads. No page errors or production score submissions were recorded. The deploy
  report's `liveVerified: false` is unchanged; this separate report supplies evidence.
- The publication command returned the [GitHub release](https://github.com/villetakanen/void-drift/releases/tag/v0.6.1).
  [Release notes](../releases/0.6.1.md) retain the publication summary.

## Measurements, observations and limits

The [planning measurement record](../reviews/2026-11-11-gauntlet-two-pirates.md)
reports five warmed samples: median 67.59 ms for eight single-pirate plans and
130.22 ms for sixteen two-pirate plans. This was local Node planning work on a
fixed state, not sustained browser frame timing; CPU model was unavailable.
No raw timing dataset or durable executable probe is retained with that record.

Chromium captures at 1440×900 were inspected during development. The production
capture showed one hostile in-frame and the second pirate's offscreen cue; an
earlier statement that both were in-frame was corrected. The Lab framed all three
ships and both pirate hull readouts. Both temporary capture files were present
at closure: `/private/tmp/gauntlet-pair-production-1440x900.png` and
`/private/tmp/gauntlet-pair-lab-1440x900.png`.

Full verification and publication artifacts were copied into the shared checkout's
ignored `artifacts/` directory. Those reports, live captures and temporary checkout
are local evidence, not durable backups. Essential outcomes are summarized here.
Performance on physical devices, sustained rendering cost and difficulty balance
are not established by these checks. Closure made no production changes, reran
no gameplay checks and derived no signals or standing requirements.
