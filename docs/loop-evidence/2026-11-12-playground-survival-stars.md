# Playground Survival stars — implementation closure

Closed 12 November 2026. Scope: enable the existing seeded yellow-family G-class
stars in Playground Survival while retaining ranked Survival's legacy Sun and
`ion-storm` board. This records implementation evidence, not release readiness.

## Decision and delivered change

The designer authorized: “ranked uses 0.6.0 lauch era rules, other modes can take
in experimental or upcoming features.” This establishes the ranked baseline and
permits unranked evolution; it does not automatically enable every experiment.
The subsequent “close loop” requests this record, not publication or playtest
acceptance.

Direct inspection at closure found the implementation still uncommitted over
`6c252c591348741126c764ee49096f4c8d722688`, in a shared dirty checkout containing
concurrent controls and rock-planet study work. Relevant changes:

- [Flight settings](../../packages/mode-a/src/lib/schemas/flight.ts) validate
  `experimental`, defaulting to Off for older inputs.
- [FlightDeck](../../apps/web/src/components/FlightDeck.svelte) passes the captured
  run setting into simulation creation, including resets.
- [Simulation](../../packages/mode-a/src/lib/simulation.ts) selects the existing
  yellow-family profile for Survival only with Playground On. Derelicts and
  Gauntlet retain their seeded profiles; Practice retains its fixed G7 profile.
- [Regression guard](../../packages/mode-a/src/lib/simulation.test.ts) checks
  Playground's seeded star and deterministic replay alongside legacy Survival.
- [Playground](../specs/game/experimental/spec.md),
  [star](../specs/game/world/star/spec.md) and
  [release rules](../development.md#release)
  contracts describe the selection and ranked boundary.

No gravity/friction constants, challenge identifier or Firestore rules were
changed by this loop. The existing client-side ranked eligibility and submission
checks were inspected during implementation; Playground remains ineligible.

## Checks observed in this chat

Environment: local macOS checkout, pnpm/Vitest and Playwright Chromium. Commands
ran against the dirty working tree above, not an isolated committed revision.
Their terminal outputs are the evidence source; no immutable source fingerprint
or dedicated verification report was captured.

| Command                                                                       | Observed outcome                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec biome check --write` on the four changed implementation/test files | Passed; no fixes applied.                                                                                                                                                                  |
| `pnpm test`                                                                   | Passed: 49 files, 189 tests.                                                                                                                                                               |
| `pnpm exec playwright test tests/browser/active-ship.spec.ts`                 | Passed: 2 existing browser checks covering active-ship persistence/ranked launch and blocked unsanctioned launch. These do not directly inspect the new star in a rendered Playground run. |
| Initial `pnpm check:types`                                                    | Failed on an accessibility warning in concurrent `RockColour023.svelte` work.                                                                                                              |
| Initial `pnpm exec tsc -p tsconfig.check.json`                                | Failed on a stale thrust-pad helper import after the concurrent controls move, with a consequent implicit-any error.                                                                       |
| Repeated `pnpm check:types`                                                   | Passed after removing the invalid canvas role and updating the helper import to `components/controls/thrust-pads`; Astro and Svelte reported zero errors/warnings.                         |
| Repeated `pnpm exec tsc -p tsconfig.check.json`                               | Passed.                                                                                                                                                                                    |
| `git diff --check` during implementation                                      | Passed before the final helper import repair.                                                                                                                                              |

The two incidental check repairs were limited to concurrent markup/imports.
Full verification, production build, backend rules/competition suites and visual
capture were not run in this loop. No tests were rerun solely for closure.

## Publication and evidence limits

At closure the relevant changes remain local working changes, with no local
commit for this loop. No push, deployment or live verification was performed.
Public availability was discussed as the intended release path, not delivered.

The implementation preserves the legacy ranked star selection. A comprehensive
comparison of all current ranked gameplay against tag `v0.6.0` was not performed;
the 0.6.0 baseline is an explicit decision, not proof of complete equivalence.
No human playtesting result or visual acceptance was supplied. No balance claim
is established. The shared working tree has no immutable tested snapshot, so
these results cannot certify subsequent concurrent edits. This record preserves
the essential command outcomes without treating mutable test output as a retained
run-specific artifact. No signals, lessons or process changes are inferred.
