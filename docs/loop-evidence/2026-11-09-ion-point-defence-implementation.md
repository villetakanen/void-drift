# Ion Point Defence specification and implementation, 9 November 2026

Record of the loop that turned the accepted
[Ion Point Defence study](2026-11-09-ion-point-defence-study.md) into the
[turret contract](../specs/game/ion-point-defence/spec.md) and a production part.
One session on `feat/0-5-0`, started at `e444389`. The loop's single commit is
`31121e5`. Other sessions committed `6709ed5` and `611e03e` during the loop,
and `1f8b40e` and `af5ed3a` after it.

## Intent and scope

- The request: specify the weapon in ASDLC style and implement it in the game.
  Spec work stays between the designer and the main session. Implementation runs
  as pairs of clean-context implement and review agents, at most three rounds.
- The main session read the study and its loop record, then put seven open
  choices with recommendations to the designer.
- The designer's decisions, in order:

| Step          | Decision                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Spec inputs   | "mass 10, size 8 as in study, aside from that, as proposed, write it"                                           |
| Spec          | "Start implementing"                                                                                            |
| After round 1 | "we can do 1 target for all ships rotating weapons if needed for perf" (conditional; not applied, see Findings) |
| Funding       | "life support, engines, defence weapons, guns -> this should be the energy draw que."                           |
| Reach edge    | "Muzzle decides" (the offered option: reach measured from the muzzle, not the pivot)                            |
| Index mark    | "Keep as in SVG" (mark stays hidden under the barrel's aft end)                                                 |
| Commit        | "Commit by pathspec"                                                                                            |
- The values accepted "as proposed": damage 8/6/4/2 in 25-unit bands; 0.1p per
  shot; no ten-power reserve; tracking within 200 units, firing within 100;
  closest point of collision geometry, energy excluded, star and planet blocking,
  lower-id ties; zero idle draw.
- The 10-unit target-retention margin was chosen by the main session when writing
  the spec and stated to the designer afterwards. No explicit decision on it is
  recorded. The same applies to aiming at the closest point instead of the centre.
- Explicitly left out of the spec: starter status, the economy, and a
  designer-acceptance Definition of Done item.

## Changes delivered

Commit `31121e5` "feat(weapons): add the Ion Point Defence turret", 20 files.
Inspected with `git show --stat`.

- The new turret contract `docs/specs/game/ion-point-defence/spec.md`.
- Turret sections in `docs/specs/game/hangar/spec.md` and
  `docs/specs/factory/effects/spec.md`. A power-order line in
  `docs/specs/game/light-ion-cannon/spec.md`.
- Part and weapon schemas, `point-defence-art.ts`, targeting and firing in
  `salvage.ts`, `derelictClosestPoint` in `derelict-collision.ts`, renderer and
  LFX changes, `PointDefenceEncounter.svelte` in the equipment Lab and the study
  page, and unit and browser tests.
- A behaviour change beyond the turret: weapons now resolve as defence
  (point defences, lasers) before guns (cannons, rails), each class in
  build-mount order. Before, cannons resolved first and rails always last.
- `loadout.ts` was staged hunk by hunk. Another session's `LIGHT_ION_DRAW` change
  in the same file stayed uncommitted. Inspected after the commit with `git diff`.

The spec was revised once in the loop, after round 1: the power order, the
reach wording and a new scenario. The targeting and firing Definition of Done box
was unticked for re-verification at that point.

Later, outside this loop: `af5ed3a` (another session) changed the regression
guardrails in the turret and cannon specs so that the starter Wasp fits one
point defence and one cannon.

## Implement and review rounds

All entries below are the agents' own reports. The main session did not inspect
them except where noted.

| Round | Implementer report                                                                                                                                                                                       | Reviewer verdict                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Four slices done and all six DoD boxes ticked. The run was cut off once by `ECONNRESET` and resumed with its context.                                                                                    | Another round. Open: how the cannon-to-turret funding queue should read, the 100–107-unit pivot/muzzle reach edge, the retention-boundary and planet-first-contact test gaps, and nits. Targeting cost judged comparable to the laser's. |
| 2     | Power reorder, the tests that were missing, pivot-inside-material hold, turret flash and dispersal fields, bench ids, and whitespace reverted.                                                           | Another round. One should-fix: guns did not resolve in mount order because an older sort put rails last.                                                                                                                                 |
| 3     | Rail-last sort removed. Tests added for both gun orders and for a turret kill leaving the cannon idle. LFX test now separates the 100-unit profile. Two mutation checks reported as failing as expected. | Accept. The reviewer's run was interrupted by a computer crash and resumed.                                                                                                                                                              |

## Checks

### Main session, on the dirty tree before the commit

HEAD `611e03e`, with the turret changes and other sessions' changes uncommitted.
macOS host. Run after round 3.

| Command                                                                                                              | Outcome                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm test`                                                                                                          | Passed: 56 files, 405 tests. The round 3 implementer reported 407; the difference is not established. |
| `npx vitest run packages/mode-a/src/lib/point-defence.test.ts`                                                       | Passed: 40 tests.                                                                                     |
| `pnpm check:types`                                                                                                   | Passed: 0 errors, 0 warnings.                                                                         |
| `npx biome check --error-on-warnings` on `packages/mode-a/src`, the encounter, Lab pages and the turret browser spec | Passed: 146 files.                                                                                    |
| `pnpm build`                                                                                                         | Exit 0.                                                                                               |
| `node scripts/check-contracts.mjs`                                                                                   | Passed.                                                                                               |
| Playwright `tests/browser/point-defence.spec.ts`, ports 4961/4962                                                    | 4 of 4 passed.                                                                                        |

Not run by the main session: repo-wide `pnpm lint`, `pnpm test:factory`, and the
full browser suite. The commit hook ran only the commit-message check, which passed.

### Reported by agents, not inspected by the main session

- Repo-wide `pnpm lint` failed in every round. The errors were in root
  `public/ion-weapons.svg` and, in round 3, also `docs/specs/factory/design-system/spec.md`.
  Both are outside the change.
- `pnpm test:factory` failed on "a stalled emulator lifecycle is stopped and
  reported without losing evidence" (ENOENT on `emulator-stopped`) in rounds 1
  and 2. Not reported in round 3.
- Intermittent browser failures:
  - `salvage.spec.ts` "armed practice has full resources…" failed in rounds 1–3.
    The agents attributed it to other sessions' changes, a cleared
    `test-results/` folder, or flakiness.
  - `point-defence.spec.ts:84` failed once in round 3. The round 3 reviewer
    attributed it to the dev server reloading the page mid-test, from a trace
    showing two document loads, and judged that `expect.poll` would not fix it.
    That cause is the reviewer's inference for line 84; it was observed directly
    only for the failure at line 104.

## Publication

- Local commit `31121e5` on `feat/0-5-0`.
- Not pushed, not released, not deployed, not verified live.

## Human feedback

- The designer chose not to move the index mark ("Keep as in SVG").
- The designer offered one shared target per ship "if needed for perf". The round
  1 reviewer reported no avoidable targeting cost, so it was not applied.
- The designer did not play or review the encounter in this loop. Turning feel,
  rhythm and balance remain unjudged by people here.

## Findings

- **F1, index mark hidden.** The round 1 implementer reported that the SVG's
  index mark sits under the barrel's aft end (barrel 7.0 source units aft against
  a 5.44 base radius), as in the study fixture. The designer kept it. The main
  session did not check it visually.
- **F2, power order changes existing weapons.** Lasers now draw before cannons,
  and rails resolve in mount order among guns. The round 3 reviewer reported that
  derelicts spec line ~192 ("Defensive lasers receive weapon energy before
  railguns") still holds. The cannon trigger is now evaluated after the defence
  class; this is documented by a unit test.
- **F3, collision radius.** Builds with a turret get a collision radius covering
  the turning barrel. No spec states this.
- **F4, targeting cost.** The round 1 implementer measured about 0.13 ms per
  turret per update in a worst case of 6 turrets near 72 bodies. Round 1 and
  round 2 reviewers judged the cost comparable to the laser's. No sustained
  effects-budget measurement was made.
- **F5, process interruptions.** Two agent runs were interrupted: one by a
  connection error, one by a computer crash. Both were resumed with saved context.
  Other sessions committed to the shared branch twice during the loop.
- **F6, spec choices not explicitly decided.** These were set by the main
  session and accepted without a separate answer: the 10-unit retention margin,
  aiming at the closest point, and lasers belonging to "defence weapons" under
  the designer's power-order statement.

## Evidence gaps

- The agents' transcripts and any captures exist only under the session's
  temporary task and scratchpad directories under `/private/tmp/claude-503/`,
  outside the repository. They are not retained.
- The main session saw only the agents' final reports. Their intermediate runs,
  the mutation checks and the measured timings were not inspected.
- No rendered captures of the turret or the encounter are in the repository.
- No check was run on the committed revision `31121e5` alone, without the other
  sessions' uncommitted work.
