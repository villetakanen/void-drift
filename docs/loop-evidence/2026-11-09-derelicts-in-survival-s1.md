# Derelicts in survival: plan and S1 starter Wasp, 9 November 2026

Record of one session on `feat/0-5-0`, started 9 November 2026 with HEAD at
`1f8b40e`; HEAD at closure is `af5ed3a`. The loop planned 0.6.0 deliverable 2
("Derelicts in the main game") and delivered slice S1 of that plan. The
designer asked for the loop to be closed.

## Intent and scope

- Opening request: "look at 0.6.0 plan, lets think what to touch next". The
  session's status read of the plan reported deliverable 1 (point defence) as
  shipped and deliverables 2–4 as not started, and suggested starting with
  deliverable 3. The designer chose instead: "lets tackle derelicts in survival."
- Designer decisions, in the order given (quoted or closely paraphrased):

| Subject           | Decision                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Default Wasp      | Landing screen and new players: Wasp, 1 light ion cannon, 1 ion point defence, 1 light ion engine                 |
| Survival arrivals | "one/5-10s, entering 50....150u/s the narrow point first, rotating 1deg/s left or right"                          |
| Survival score    | "1p for 1s, only full seconds count"; 1p per hit on a derelict or derelict part; 20p per derelict energy captured |
| Leaderboard       | 0.6.0 "_clears the top-list_"; sorted by score by default, re-sortable client-side on time                        |
| Modes             | Derelicts mode keeps its own rules and speeds; "still usable for game devs, and for people who want to have fun"  |
| System edge       | Debris "should warp"; a derelict with unreleased energy leaves the system; same for energy                        |
| Entry             | "A derelict should enter 40-50 deg angle"; "first derelict in 3s is cool"                                         |
| Hits              | Point defence or cannon, on a derelict or a derelict piece, 1p each                                               |
| Kill / energy     | Derelict kill 0p, energy capture 20p                                                                              |
| Running score     | During flight, below seconds, in the right gutter                                                                 |
| Weapon energy     | "no weapons should ever fire, if ship has less than 10% energy. this might not have been clear this far."         |
| Method            | "use subagent, sonnet or lower, to deliver the code. use a subagent to review it. at most 3 loops of tat. do s1"  |
| Commit            | "Commit S1 files" (selected from the offered choice to commit only S1 files)                                      |
- The plan's wording "40–50° to the boundary (equally, 40–50° off the inward
  radial)" is the session's reading of the entry decision, recorded in the plan
  as such; the designer did not restate it.

## Changes delivered

- `docs/plans/2026-11-09-derelicts-in-survival.md`: decisions, five slices
  (S1 default Wasp, S2 weapon energy floor, S3 system edge, S4 survival
  encounter, S5 score and leaderboard) and four open points. Committed in
  `af5ed3a`.
- S1, local commit `af5ed3a` "feat(wasp): fit the starter Wasp with ion cannon
  and point defence", 21 files:
  - `starterLoadout("wasp")` hull `["ion-point-defence", "light-ion-cannon"]`;
    `BuildStoreSchema` and `defaultBuilds()` Wasp default use it.
  - `TitleScreen.svelte` draws `starterLoadout("wasp")`.
  - New `apps/web/src/components/studies/starter-wasp-fixture.ts`
    (`studyStarterWasp()`, the previous starter Wasp with a Gravity coil in
    hull[0]); nine dated study components use it instead of `starterLoadout`.
  - Spec text: game, landing page, Hangar, light ion cannon, ion point defence.
  - Tests: `starter-fleet.test.ts` (new cases), `gravity-coil.test.ts` (Wasp
    baseline from `defaultLoadout`), `point-defence.test.ts` (starter guardrail
    excludes the Wasp).
- Process: implementation by a Sonnet subagent; review by a separate Sonnet
  subagent; one fix round; second review reported clean. Two of the three
  allowed rounds were used.
- The session itself edited one landing-page guardrail clause before commit
  (removed "as is any run that flies the stock fitting"), because Hangar runs
  are unscored in `FlightDeck.svelte`.

## Checks

| Check                                                | Outcome                                                                                                            | Tree                                                          | Source                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------- |
| `pnpm test`                                          | passed, 56 files / 407 tests                                                                                       | dirty shared working tree, before and after fix round         | implementer and reviewer reports        |
| `pnpm check:types`                                   | passed, 0 errors 0 warnings                                                                                        | dirty shared working tree                                     | implementer and reviewer reports        |
| `biome check apps packages`                          | clean after fix round                                                                                              | dirty shared working tree                                     | implementer report                      |
| `pnpm lint`                                          | failed, reported only on untracked `public/ion-weapons.svg` (another session's)                                    | dirty shared working tree, first round                        | implementer report                      |
| `pnpm check:contracts`                               | exit 1: contract script passed; factory-test step `ENOENT` for `emulator-stopped` on a temp path; not investigated | dirty shared working tree, first round                        | implementer report                      |
| `npx vitest run` on the index snapshot               | passed, 56 files / 407 tests                                                                                       | `git checkout-index` copy of the staged S1 tree (= `af5ed3a`) | direct, this session                    |
| lefthook pre-commit biome and commit-msg             | passed                                                                                                             | `af5ed3a`                                                     | direct, commit output                   |
| Title screen in browser, 1280×800, `astro dev` 4330  | Wasp drawn with a weapon on each wing                                                                              | dirty shared working tree                                     | direct screenshot, not retained in repo |
| Type check on the index snapshot                     | not run (tsconfig path error in the copy)                                                                          | —                                                             | direct                                  |
| `pnpm build`, `test:browser`, `test:rules`, `verify` | not run                                                                                                            | —                                                             | implementer report                      |
| Fresh-profile flight from PRESS START                | not run                                                                                                            | —                                                             | —                                       |

## Publication

- Local commit `af5ed3a` on `feat/0-5-0`. Not pushed, not deployed.
- Uncommitted at closure, attributed to other sessions: `docs/architecture.md`,
  `docs/design.md`, `docs/development.md`, the landing-page and game specs
  (non-S1 parts), propulsion, survival and star specs, `LIGHT_ION_DRAW` in
  `loadout.ts`, `standard-sun.test.ts`, `public/`. S1 hunks of the mixed files
  were committed by writing index blobs from HEAD plus S1 edits.

## Findings

- Review round 1 (reviewer report) listed: stale Gravity coil text in
  `docs/specs/game/spec.md`; cannon and point-defence specs saying starter
  outfits are unchanged; nine dated study components whose Wasp output changed
  through `starterLoadout("wasp")`, one showing two cannons
  (`IonCannonFlight.svelte`); weak assertions in `starter-fleet.test.ts`;
  `CHALLENGE` unchanged while the scored stock Wasp changed; non-S1 content in
  the landing-page spec diff. The first four were fixed; the `CHALLENGE` item
  was left to S5; the landing-page content belonged to another session.
- Reviewer report: the PRESS START run passes no `loadout` prop, builds
  `gameSettings("wasp")` from `starterLoadout`, and is treated as ranked.
- Implementer and reviewer reports: weapons fire only when `Simulation`
  creates `SalvageSystem`, which happens only in `mode === "derelicts"`; in
  survival the fitted weapons add mass (+9 net over the Gravity coil, per
  reviewer) and collision radius but do not fire until S4.
- Reviewer report: `components/lab/LabDerelict.svelte` (entity page, not a
  study) now draws the new starter Wasp.
- The implementer ran `biome check --write` over `apps/web/src`, which
  reformatted four unrelated files; it reverted them with `git checkout`.
  `git status` taken earlier in the session showed no other-session edits in
  those four files; whether another session edited them between that status
  and the revert is unknown.
- The working tree contains a Light ion draw of 1.75 E/s from another session;
  its effect on the armed Wasp's fire budget is not measured (plan open point 4).

## Evidence gaps

- Subagent check results are their reports; their command output is not
  retained.
- The browser screenshot was not saved to the repository.
- No type check, browser test, rules test or build was run against `af5ed3a`
  alone.
- Plan open points 1–4 are unanswered at closure.
