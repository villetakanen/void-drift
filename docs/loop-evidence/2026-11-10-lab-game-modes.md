# Loop evidence: Lab game modes and stale pages

Collected 10 November 2026 at the end of the session that did the work. All
observations below are from that session's direct inspection unless attributed.

## Intent and scope

- Starting point: the handoff brief
  [`docs/plans/2026-11-10-brief-lab-flight-tools.md`](../plans/2026-11-10-brief-lab-flight-tools.md)
  at `4020683` on `feat/0-5-0`. The brief's own text said its lists came from
  "a quick grep, not a full audit".
- Request (paraphrase): fill the file with the current idea for fixing the Lab;
  judge each Lab tool by whether a game developer sees something on it; the
  default for every screen is delete, rescue is secondary and only if simple
  and without the game modes; each page to be deleted must be opened on
  localhost for inspection first.
- Decision, 10 November 2026, on `/lab/ship-propulsion`, quoted: "is game dev
  lab stuff, yes -> likely needs to be also on the spec level, but this is
  higher level presentation, and prose on the same. i.e. explaining the things
  in a way, they are easier to discuss. outside of that, delete."
- The session read "outside of that, delete" as the other five pages on its
  delete list. Planets and Resources, which it had presented as undecided with
  a lean to keep, were left in place. That reading was stated back and not
  contradicted; it was not explicitly confirmed either.
- Then: "Commit the working tree changes with a sensible message."

## Changes delivered

Commit `1358e15` (`refactor(lab): remove game modes and stale pages from the
Lab`), parent `4020683`, 44 files.

- Deleted pages: `/lab/builder`, `/lab/landing`, `/lab/flight`,
  `/lab/ion-engines`, `/lab/buttons`. Deleted component:
  `IonSizesAccepted024.svelte`.
- `ShipBuilder.svelte` lost its `lab` prop; `lab-pages.ts` lost four entries,
  `aliasOf` and `listedLabPages`.
- Links to the deleted pages in Lab pages, components and studies repointed to
  `/hangar`, `/lab/inputs` or `/lab/fx`. In studies only `href` values changed.
- Tests retargeted: `builder.spec.ts`, `scout.spec.ts`,
  `hangar-opening.spec.ts`, `buttons.spec.ts`, `ion-effects.spec.ts`,
  `tests/review/captures.spec.ts`, `tests/review/landing.spec.ts`. Removed:
  the retired-redirect test in `alpha.spec.ts`, and the redirect and alias
  cases in `lab-pages.test.ts`.
- `scripts/check-contracts.mjs` gained a check that no tracked file under
  `apps/web/src/pages/lab`, `components/lab` or `components/studies` imports
  `FlightDeck`, `ShipBuilder`, `TitleScreen`, `GameWrapper` or
  `submitHighScore`.
- Specs and docs edited: Lab (both Definition of Done boxes ticked, one
  guardrail reworded), Hangar, landing page, design system, workbench,
  `docs/architecture.md`, `docs/development.md`, and the plan itself.
- The commit also contains another session's uncommitted work present in the
  shared checkout: a `studies.ts` entry, `FlightScene021.svelte`,
  `flight-scene.ts` and the study page
  `flight-scene-instrument-2026-11-10.astro`. This session ran the formatter on
  `FlightScene021.svelte` and did not otherwise inspect that work. The session's
  pre-commit status listing filtered out study pages, so the study page was not
  seen before staging.

## Checks

Environment: macOS (Darwin 25.6.0), Node v24.14.0, pnpm 10.33.0, local dev
server on port 4330 running throughout. All runs were on the dirty tree that
became `1358e15`, except where noted. No verification report directory was
produced; outputs exist only in the session transcript.

| Command                                                                                           | Outcome                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                                                       | Passed before commit, after formatting four files (the plan, the Hangar spec, `ShipBuilder.svelte`, and the other session's `FlightScene021.svelte`).                      |
| `pnpm check:types`                                                                                | First run failed: `hangar.astro` `client:only` not assignable after the `lab` prop was removed. Passed after adding the `_props` declaration used in `GameWrapper.svelte`. |
| `node scripts/check-contracts.mjs`                                                                | First run failed on a Hangar spec link to the deleted `lab/builder.astro`. Passed after the spec edit; new check reported 322 Lab files, none importing a game mode.       |
| `pnpm check:contracts`                                                                            | Passed (15 factory tests).                                                                                                                                                 |
| `pnpm test`                                                                                       | Two runs. First: 2 test files failed, 488 of 490 tests passed; failures not identified. Second: `packages/mode-a/src/lib/survival-score.test.ts` timed out at 5000 ms.     |
| `pnpm vitest run packages/mode-a/src/lib/survival-score.test.ts`                                  | Passed, 8 tests, run alone.                                                                                                                                                |
| `pnpm playwright test` on `builder`, `scout`, `hangar-opening`, `alpha`, `buttons`, `ion-effects` | 13 passed. Run before one test title in `scout.spec.ts` was renamed; not rerun after.                                                                                      |
| `curl` status of routes                                                                           | 404 for the five deleted routes; 200 for `/lab`, `/lab/ship-propulsion`, `/hangar`, `/lab/inputs`.                                                                         |
| lefthook pre-commit (biome) and commit-msg                                                        | Passed on commit.                                                                                                                                                          |

Not run: the full browser suite, `tests/review` captures (two files edited),
`pnpm verify`, backend and rules tests.

## Publication

- Local commit: `1358e15` on `feat/0-5-0`.
- Push: none. Deployment: none. Live verification: none.

## Findings

- Import tracing from every `pages/lab/**/*.astro` file at `4020683` found
  `FlightDeck` or `ShipBuilder` reachable only from `lab/builder.astro` and
  `lab/landing.astro`. The brief listed eight studies as mounting them; a grep
  showed those studies contain the names in prose or links only. The tracing
  script did not follow imports into `packages/`.
- `/lab/builder` rendered the Hangar with Test flight, Start survival and
  Derelicts controls; `/lab/landing` rendered the title menu with Press Start
  (screenshots in the session, not retained).
- `biome check --write` on `scripts apps/web/src tests` reformatted three files
  this session had not edited (`GravityPanel.svelte`, `MountPlanner.svelte`,
  `PincerSlotStudy.svelte`). They were reverted. With the session's changes
  stashed, `pnpm lint` reported no errors on the tree.
- The browser console on `/lab` showed one "Failed to load resource … 404"
  entry after the deletions. Its source was not identified; other tabs had
  been open on deleted routes.
- The browser pane was narrower than 1280px; pages marked keep were judged
  from code, specs and page text, and the 38 study pages were not opened
  individually.

## Evidence gaps

- No retained artifacts: screenshots, test output and the import-tracing script
  lived in the session and its scratchpad only.
- The two failing files in the first `pnpm test` run are unknown.
- No check was run at commit `1358e15` itself other than the commit hooks.
- At collection time the checkout again had uncommitted changes from other
  work (specs, plans, the flight-scene study); they are outside this loop.
- Whether Planets and Resources were meant to be deleted is unresolved.
