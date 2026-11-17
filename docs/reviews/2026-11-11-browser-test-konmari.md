# Browser-test KonMari

Applied the [browser-test skill](../../.agents/skills/browser-test-konmari/SKILL.md)
to all 41 offline browser files present at the start, with separate review of
built-release smoke, backend journeys and opt-in captures.

The decision rule is protection worth maintaining, not proof that an implementation
works. Requiring a browser, having a spec, exercising a distinct option, or avoiding
exact pixels does not earn a test a place. The principal fee is tokens, attention
and edits on otherwise harmless changes; execution time is secondary.

The reviewed suite goes from 134 cases in 41 files to 21 cases in 15 files,
removing 4,904 of its 5,827 lines.
Whole demonstration scenarios are removed rather than relocated into new unit or
capture tests. No product feature, acceptance behaviour or required gate is retired.
The skill and factory verification contract now state this distinction; Lab specs
retain their behaviour without promising browser automation for each demonstration.

## Retained guards

Paths below are relative to `tests/browser/`.

| File                        | Retained risk; maintenance removed                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `active-ship.spec.ts`       | Saved active fitting survives real hydration/reload and reaches title launch; turning preview off preserves the saved ship while blocking ineligible launch. Retains deliberate keyboard chassis selection in this real journey. Removes portrait/layout/hint tests, artificial in-run store mutation, repeated native touch fitting and offline unranked completion already guarded at the backend boundary. |
| `alpha.spec.ts`             | Representative boot, real keyboard/touch reaching propulsion, release/cancel, focus loss and paused time. Removes default capacity/stabilizer configuration assertions. Different physical input paths remain because stuck or disconnected input is consequential.                                                                                                                                           |
| `builder.spec.ts`           | A fitted build survives reload, reaches actual Practice capacity and survives abort; corrupt browser storage recovers through application startup. Removes slot/catalog tours, repeated flight physics/Practice rules, legacy-storage demonstration and long duplicate completion.                                                                                                                            |
| `control-default.spec.ts`   | A persisted opt-out reaches production controls, guarding a preference that could appear saved while flight uses defaults.                                                                                                                                                                                                                                                                                    |
| `controls.spec.ts`          | Touches in the central flight area must not fire engines: reproduces the old half-screen-input regression. Removes the additional keyboard mapping demonstration.                                                                                                                                                                                                                                             |
| `derelicts-score.spec.ts`   | Derelicts completes without local score changes or score actions, freezes the result and starts fresh. This protects an unranked mode boundary distinct from Experimental Survival's backend no-write guard.                                                                                                                                                                                                  |
| `dialogs.spec.ts`           | Actual pause traps/restores focus and isolates the stage. Removes the Lab's configurable demonstration of the same modal component.                                                                                                                                                                                                                                                                           |
| `flight-deck.spec.ts`       | Losing actual pointer capture clears a held action: prevents sticky propulsion without a pointer-up event. Removes deck geometry, presentation defaults, pad mapping matrices, labels and duplicate pause demonstrations.                                                                                                                                                                                     |
| `fx-surface.spec.ts`        | Synthetic guards for the custom history algorithm: accumulation, pause, camera reprojection, refresh-rate independence, discontinuities and absence of periodic history clearing. These are subtle image-memory regressions, not browser CSS tests or artwork pins; the probes are small and independent of changing art.                                                                                     |
| `fx.spec.ts`                | Production drawing restores Canvas state and leaves gameplay state unchanged on a real context. Removes the mixed Lab's overload/control demonstration.                                                                                                                                                                                                                                                       |
| `game-screen.spec.ts`       | Aspect interruption preserves countdown and clears held input; background suspension requires deliberate resume without catch-up. Removes stage/layout matrices, CSS configuration and duplicate turn/brake tests.                                                                                                                                                                                            |
| `launch-navigation.spec.ts` | One representative real death, return and fresh run catches a broken end/reset path. Removes source/transition permutations, native score-page links and duplicate active-ship handoff.                                                                                                                                                                                                                       |
| `mount-planner.spec.ts`     | User-edited document survives export/load, undo and invalid import. Removes view/framing and mirror-link interaction demonstrations; retains the risk of silently losing a designer's edited document.                                                                                                                                                                                                        |
| `part-cards.spec.ts`        | Switching preview off preserves the blocked fitting; keyboard replacement makes launch eligible, while activating a disabled part cannot replace it. Removes geometry, prose and native touch demonstration.                                                                                                                                                                                                  |
| `scout.spec.ts`             | Editing and reloading one ship preserves unrelated saved builds. Reduces the long Scout tour to one save-integrity relation; removes slot counts, fitting matrices, movement/Practice and invalid-query demonstrations.                                                                                                                                                                                       |

## Removed files

A deleted test is not a claim that its feature is no longer required. The deliberate
gaps below accept that obvious surface failures can be noticed when using the
surface; there is no requirement to automate every criterion.

| File                              | Why it does not earn ongoing maintenance; remaining protection or gap                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions-language.spec.ts`        | Classes and nonempty CSS tokens pin implementation. No automatic action-style parity guard remains.                                                                                                                                                                                                                                                                        |
| `buttons.spec.ts`                 | Native activation, demonstration pending state and styling/token propagation do not need their own browser gate. Actual keyboard flight and blocked fitting journeys remain; showcase styling is an intentional gap.                                                                                                                                                       |
| `camera.spec.ts`                  | Resize/fit geometry demonstrates a visible layout outcome. Existing camera/simulation unit guards remain; no browser viewport matrix is retained.                                                                                                                                                                                                                          |
| `derelict-artwork.spec.ts`        | Hull size and a particular aperture pixel freeze artwork. Opt-in derelict captures remain; the aperture image is no longer a correctness assertion.                                                                                                                                                                                                                        |
| `derelict-energy.spec.ts`         | A Lab specimen's pulse/energy picture is visible during use. Salvage unit guards own release/lifecycle; specific hollow-square artwork is not automatically guarded.                                                                                                                                                                                                       |
| `derelict-shedding.spec.ts`       | Lab damage buttons repeat production damage rules. `salvage.test.ts` guards threshold shedding, one-time release and contact damage; specimen button wiring is a deliberate gap.                                                                                                                                                                                           |
| `derelicts-entry.spec.ts`         | Fitted-ship handoff is guarded by retained real launch journeys. The browser schedule test recomputes expected timing with the simulation it is checking; scheduling belongs to existing unit guards. No separate early-encounter UI demonstration remains.                                                                                                                |
| `flight-scene-instrument.spec.ts` | Seeking, switching, layer controls and historical embeds demonstrate a designer instrument, not an additional shipping safety boundary. Flight-scene unit guards retain deterministic backward replay, read-only documents and simulation isolation. Existing opt-in fidelity captures inspect the scene and historical embeds. Per-control hydration is a deliberate gap. |
| `gauntlet.spec.ts`                | Launch attributes, Lab rendering/input/reset and countdown colour demonstrate the new mode and bench. Existing Gauntlet unit guards own encounter results/ranking. No old single-pirate specimen browser gate remains. Concurrent replacement tests are reported separately below.                                                                                         |
| `gravity-coil.spec.ts`            | Another catalog id's fit/reload/flight repeats the generic save/handoff guard. Pure collection rules remain in unit coverage; no part-by-part browser matrix.                                                                                                                                                                                                              |
| `gravity-tuning.spec.ts`          | Graph/specimen presence, native editing and drag-to-document are tooling demonstrations. Existing gravity/instrument/schema guards remain; the Lab's individual bindings are an intentional gap.                                                                                                                                                                           |
| `hangar-opening.spec.ts`          | Opening, native navigation, header/tabs geometry and setting demonstrations repeat retained startup/storage/eligibility journeys. Legacy redirect/query variants and exact responsive header layout are deliberate browser gaps.                                                                                                                                           |
| `ion-cannon.spec.ts`              | Part-specific fitting repeats save/handoff. The study encounter and muzzle pixels demonstrate a weapon whose rules have existing `ion-cannon.test.ts` guards. Generic production FX state isolation remains; per-weapon art/lifecycle pixels are no longer browser assertions.                                                                                             |
| `ion-effects.spec.ts`             | Historical ion preset-button tour; the existing opt-in ion capture remains.                                                                                                                                                                                                                                                                                                |
| `ion-flight.spec.ts`              | Per-setting reload and braking demonstration repeats generic storage handoff and simulation rules. No separate browser matrix for stabilizer/linked settings.                                                                                                                                                                                                              |
| `lab-instrument.spec.ts`          | Burn controls, graphs, pane focus and a reference-page tour prove the Lab's implementation. Instrument/schema unit guards remain; individual Lab UI bindings are deliberately not automated.                                                                                                                                                                               |
| `landing.spec.ts`                 | Animation, hints, native menu links and geometry demonstrate the title surface. Boot and input remain in `alpha.spec.ts`, active fitting in `active-ship.spec.ts`, and actual pause/aspect state in `game-screen.spec.ts`. Title decoration, menu permutations and hint/orientation messaging are deliberate gaps.                                                         |
| `local-session.spec.ts`           | Offline boot is already exercised with live configuration blanked by retained journeys. Canvas-change and unavailable-score-page demonstrations add little; the exact unavailable message and specimen picker are no longer guarded.                                                                                                                                       |
| `plasma-thrust.spec.ts`           | Historical comparison and charging pixels are expressive image demonstrations. Existing simulation charge rules and generic Canvas history/isolation guards remain; particular charge artwork/mount pictures are not browser gates.                                                                                                                                        |
| `point-defence.spec.ts`           | Catalog fitting, repeated encounter presets and weapon pixels duplicate the unit rule guards and generic save/FX boundaries. `point-defence.test.ts` owns retention, first contact and energy; per-weapon light appearance and preset selector wiring are deliberate gaps.                                                                                                 |
| `render-model.spec.ts`            | Exhaustive blend/filter selectors mostly prove CSS accepts the chosen value and controls bind as implemented. Custom Canvas history/isolation remains guarded elsewhere; render-model controls/presentation recipes are intentionally inspected through use and existing opt-in evidence.                                                                                  |
| `render-performance.spec.ts`      | Workload arrays, recipes and measurement-bench controls demonstrate the instrument. Existing shared budget/history guards remain; the bench's accounting/export/lifecycle UI is an explicit automation gap. A working correctness test never established device performance.                                                                                               |
| `salvage.spec.ts`                 | Repeated Practice resource rules and touch/reset journey. Existing simulation rules plus retained Practice handoff, real touch and fresh-run reset cover the important boundaries; no separate armed-Practice UI matrix.                                                                                                                                                   |
| `suns.spec.ts`                    | Painter interception, DPR/style pins and Lab energy-control demonstrations. Existing collection/gravity/instrument unit guards remain; visible Sun artwork and individual export-control bindings are deliberate gaps.                                                                                                                                                     |
| `tabs.spec.ts`                    | Framework-like widget variant matrix and geometry. Deliberate manual selection is exercised on the actual Hangar in `active-ship.spec.ts`; unused demonstration variants do not need a browser contract of their own.                                                                                                                                                      |
| `thrust-pads.spec.ts`             | Lab pad mapping, state picker and touch demonstrations repeat production input guards. Real touch reaches propulsion in `alpha.spec.ts`; capture loss is isolated in `flight-deck.spec.ts`. Lab-only selector/seam interaction is a deliberate gap.                                                                                                                        |

## Separate suites and shared-checkout limits

- `scripts/release-smoke.mjs` stays: a development-server pass cannot establish
  that the built release boots, loads its assets and accepts input. Its existing
  screenshots remain prepared-artifact evidence, not an expanded review suite.
- `tests/firebase/competition.spec.ts` stays: ranked flights, rejected-write retry,
  saved flown fitting, an independent leaderboard reader and no unranked write
  establish a real service boundary. Offline assertions cannot replace it.
- The existing seven `tests/review/` files stay opt-in. No new capture suite or
  unit tests were added to preserve discarded demonstrations.
- Another session added `tests/browser/gauntlet-pair.spec.ts` during this review.
  Its two in-flight cases were inspected but left untouched under the shared-tree
  rule. They are outside the original 134-case inventory; the final current-suite
  run includes them alongside the 21 retained guards.
  They contain the same kind of launch/configuration and Lab demonstration checks
  discussed here and need review when that session finishes its implementation.
- Other sessions' game, rendering and study edits remain untouched. Tests report
  observations of this working checkout; they do not establish a stable release.

## Verification

The [final browser run](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/current-results.json)
passed all 23 discovered cases in 102.7 seconds: the 21 retained guards plus the
two concurrently added Gauntlet cases. No skips or retries. All 15 reviewed test
files stayed unchanged during that run; the other session edited its new
Gauntlet file while verification was running. This is working-checkout browser
evidence, not full stable-candidate verification or a release result.

- Biome passed for all 15 retained files; strict browser/workspace TypeScript
  passed. Skill validation and diff whitespace checks passed.
- The contract script passed after the documentation edits, with the existing
  81-line AGENTS.md warning. The earlier contracts gate also passed its 15 factory
  regression tests; factory implementation was not changed.
- The unit run had 185 passes and one five-second timeout in
  `fx-integration.test.ts` while browser checks were active. Its focused rerun
  passed in 1.76 seconds with the same timeout and assertions. The full unit run
  remains recorded as failed, not retrospectively relabelled a pass.
- Backend/rules, built-release smoke, production build and full `pnpm verify`
  were not rerun. Their runners and gate membership were not changed.
- Earlier exploratory runs were interrupted; one shortened damage assertion
  failed on DOM whitespace and was repaired before that demonstration was
  ultimately removed. A shared Playwright output collision invalidated another
  exploratory run. The final run uses an isolated port and output directory.

The earlier retained-guard run took about 90 seconds. A historical full browser
stage took 438.3 seconds, but there was no fresh controlled before/after benchmark.
No token savings, churn rate, false-failure reduction or causal speedup is claimed.
The concrete maintenance reduction is 26 removed demonstration files and 4,904
fewer lines in the reviewed suite; the remaining failure risks are named above.
