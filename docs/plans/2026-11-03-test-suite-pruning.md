# Deterministic gate and test-suite pruning plan

Date: 2026-11-03. Status: pruning implemented; original audit retained below,
with implementation and verification outcomes at the end. Dialog redesign is deferred.
Requested outcome: remove low-value testing and repeated work while retaining checks
that detect meaningful regressions. This is an implementation plan, not authorization
to retire supported game behavior or historical Lab surfaces.

## Acceptance contract

- Inventory the existing gate chain and all unit, browser, rules and factory suites.
- Distinguish demonstrated defects, redundant coverage, implementation coupling,
  useful boundary checks and gaps. Do not equate a large test count with waste.
- Give each removal a surviving owner for its behavior, or document the explicit
  retirement of that behavior. Replace weak assertions before deleting them.
- Reduce maintenance friction and expensive browser work without weakening input,
  persistence, simulation, access control or verification-report integrity.
- Keep deterministic correctness, human appearance/feel review and measured
  performance separate. No new dependency is required by this plan.
- Stage changes in bounded slices, validate each slice, then run full verification
  on an unchanged candidate. Report failures and unavailable checks honestly.

## Audit baseline and conclusion

Three parallel read-only audits covered unit tests, browser tests, and gate/backend
infrastructure. The main audit inspected current code, ran verification and checked
retained release/failure evidence. No coverage percentage or mutation score was
collected; findings below are based on assertion inspection and recorded execution.

Audited revision: `0f3414fd3980c50b12422eef4e9db50db1a7a8f3`, initially clean,
branch `feat/0-4-0`. Local environment: Node `24.14.0`, pnpm `10.33.0`,
darwin/arm64; Firebase commands use the repository's Java 21. CI uses Node 22,
Linux and Java 21, so local timings are not CI benchmarks.

| Surface             | Current inventory                            | Assessment                                                |
| ------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Full verification   | 9 named stages                               | Keep the coverage families; optimize work inside them     |
| Unit                | 145 cases, 32 files, 2,581 source lines      | Mostly useful and cheap; prune weak or coupled assertions |
| Offline browser     | 39 tests, 14 files                           | Largest consolidation opportunity                         |
| Competition browser | 1 multi-identity journey                     | Unique integration value; expensive completion fixture    |
| Firestore rules     | 10 named cases, many negative inputs         | Keep security and compatibility boundaries                |
| Factory runner      | 5 cases                                      | Small and valuable; retain                                |
| Review captures     | 18 call sites, 26 captures when loops expand | Evidence collection, not visual pass/fail assertions      |

Fresh full verification passed on unchanged source, with no skipped stages:
`artifacts/verification/2026-11-03T14-11-35.210Z-SNpeB2/report.json`.
Source fingerprint: `d71c928f75fb2443b241bc03a9badb284f5aac7f876bd1283ef9290cabe17f60`.
All 145 unit cases, 39 offline browser cases, 10 rules cases, one competition
journey and five factory cases passed.

| Stage              | Result | Elapsed |
| ------------------ | ------ | ------- |
| `check:contracts`  | Passed | 2.60 s  |
| `check:commits`    | Passed | 0.65 s  |
| `lint`             | Passed | 0.53 s  |
| `check:types`      | Passed | 15.87 s |
| `test`             | Passed | 1.81 s  |
| `build`            | Passed | 9.10 s  |
| `test:browser`     | Passed | 63.16 s |
| `test:rules`       | Passed | 6.75 s  |
| `test:competition` | Passed | 60.92 s |

Total stage time: **161.4 seconds**. Offline browser plus competition: **76.9%**.
The slowest offline cases were the builder preservation/unranked-death journey
(10.2 seconds) and the three-hull ion settings/capture journey (9.7 seconds).
The three synthetic Canvas surface cases took approximately 0.2 seconds each.

The first audit attempt,
`artifacts/verification/2026-11-03T14-10-19.112Z-Iu3nUX/report.json`, failed because
local server binding was denied (`listen EPERM`). Browser, rules and competition
never reached assertions; the other six stages passed. The successful retry used
local-server permission, with no source changes or assertion modifications.
Reports are ignored local artifacts; the outcomes and timing summary above are
retained here. The final report predates this plan-only edit and does not claim to
verify subsequent changes.


The main recommendation is **prune repeated browser execution and brittle or
non-functional assertions, rather than aggressively deleting unit coverage**.
The retained successful run immediately before the audit
(`artifacts/verification/2026-11-03T14-07-51.044Z-iMoLgY/report.json`) spent about
160.9 seconds across stages: browser 63.9 seconds, competition 59.7 seconds,
types 16.0 seconds, build 9.1 seconds, rules 6.8 seconds, contracts/factory 2.7 seconds,
units 1.6 seconds and commit validation 0.6 seconds. Browser plus competition were
approximately 77% of that run. These are historical observations, not predicted savings.

There is positive evidence for retaining integration coverage. The first 0.5.0
release verification exposed an absent optional saved value bound to Switch and
a control clicked before hydration; it also exposed an obsolete test locator.
See [release evidence](../releases/0.5.0.md). The
[FX repair record](../loop-evidence/2026-11-03-fx-surface-repair.md) documents the
rounding-residue defect and competition timeouts. This supports keeping save/UI
and real Canvas semantics while reducing locator/artwork coupling and rendering work.

## What the gates should own

| Gate / infrastructure       | Decision                           | Reason and bounded change                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `check:contracts`           | Keep, clarify scope                | Context-link existence and CSS/Canvas parity catch drift across representations. Document size/scope warnings remain advisory, per the existing owner decision. Do not expand them into more prose policy gates.                                                                                       |
| Token/font parity           | Keep, eventually simplify parsing  | Source-format regexes are brittle, but equality between CSS and Canvas values is a real contract. Changing extraction must still detect a missing mirror entry and mismatched value. Do not replace this with a literal snapshot of the palette.                                                       |
| Theme-color assertions      | Retain pending focused replacement | `check-contracts.mjs:99–111` hard-codes two representations of the accepted void color. A shared/generated source or semantic conversion would permit palette changes without editing an oracle; do not add a color library just to remove two assertions. Current spec explicitly names these values. |
| Factory tests               | Keep all 5 intents                 | Partial/full distinction, failed exit status, source mutation and port validation protect trust in every other result. Roughly seconds, not the dominant cost.                                                                                                                                         |
| `check:commits`             | Keep                               | Syntax/hygiene rather than gameplay reliability; cheap and explicitly required. Hook catches messages before commit; history check catches bypassed hooks. Different enforcement points are useful.                                                                                                    |
| Biome lint                  | Keep                               | Formatting plus static rules; not duplicated by runtime tests. Avoid a second overlapping lint tool.                                                                                                                                                                                                   |
| Astro / Svelte / TypeScript | Keep all three families            | Installed Astro checker excludes `.svelte`; Svelte diagnostics and workspace-only TS have distinct reach. Investigate overlap only with a file-coverage map and injected type errors. A successful build does not replace type checks.                                                                 |
| Unit tests                  | Keep fast default                  | Shared behavior and invalid-input matrices belong here. Remove low-value bodies, not entire categories.                                                                                                                                                                                                |
| Production build            | Keep                               | Catches bundling/static-route failures that source checks miss. Connect representative journeys to the built output in a later slice.                                                                                                                                                                  |
| Browser gameplay            | Consolidate                        | Own actual input, hydration, persistence, focus, browser rendering semantics and application wiring. Move numerical matrices to units; remove repeated full lifecycle journeys.                                                                                                                        |
| Rules + competition         | Keep both, share infrastructure    | Negative access rules cannot be proved by happy-path UI. Competition proves auth/client/write/read wiring. Reuse one emulator lifecycle with independent results.                                                                                                                                      |
| CI workflow                 | Deduplicate obsolete work          | Push and pull-request events currently overlap and lack cancellation. Define an event policy for PR heads versus branch verification; cancel superseded runs without canceling the only required current result. Keep publication verification intact.                                                 |

Two small correctness gaps should be resolved while changing this machinery:

1. `docs/development.md` says type warnings fail, but `apps/web/package.json` uses
   bare `astro check`; the installed checker defaults to errors as the failing
   severity. Set the intended warning threshold explicitly, then prove it with a
   temporary diagnostic fixture. Keep the existing Svelte warning failure behavior.
2. `tsconfig.check.json` includes package and application TS but not
   `tests/browser`, `tests/firebase` or the Playwright configurations. Browser test
   transpilation is not type checking. Include the harness in a suitable existing
   TS check, fixing genuine diagnostics instead of adding broad exclusions.

Strengthen two existing factory cases while touching them: the “retains logs”
case should read an actual run-local log/report, and the full-mode case should
assert command identities rather than only `steps.length === 9`. These fit the
existing scenarios; they do not justify a new suite of report-format snapshots.

Do not create a more elaborate verification framework for this cleanup. Keep the
one-command full run, explicit quick/partial mode, source fingerprint, unique run
directories and logs. If backend stages share a process, keep separate names,
durations and exit statuses; startup failure must leave both unavailable/failed,
never passed. Always stop owned emulators, including failed runs; never attach to an arbitrary existing instance. Continue collecting the other applicable results after one failure.

## Unit-suite pruning

### First changes: remove false confidence and artwork locks

| Evidence                                                                                                              | Change                                                                                                                                                   | Coverage that must survive                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/lib/physics/Physics.test.ts:122,132,143` calculates expected arithmetic without calling production | Replace three self-calculated bodies with a small table calling exported `getPlanetInfluenceRadius`                                                      | Ordinary mass-derived radius, lower clamp, upper clamp; a changed production formula must fail                                          |
| `packages/mode-a/src/lib/simulation.test.ts:147` mutates radius and only checks untouched well fields                 | Replace passive checks with the explicit-well override case of the real radius function; retain one integration assertion for Simulation's use if needed | Explicit reach independent of physical radius, including actual consumption of that reach                                               |
| `scout.test.ts:28` copies roughly 74 lines of vertices, colors and coordinates                                        | Delete copied artwork assertions after retaining geometry relationships                                                                                  | Cockpit/weapon clearance, collision enclosure, mirror relationships, nozzle/emitter placement; silhouette fidelity stays human-reviewed |
| `slot-types.test.ts:48` asserts exact `fillRect`/`fillText` counts                                                    | Replace counts with a meaningful flight-versus-builder overlay assertion                                                                                 | Flight omits fitting labels/selection overlays while equipped casings remain; a painter refactor should pass                            |
| `plasma-study.test.ts:32–33`, `plasma-escape.test.ts:46` assert cached array identity                                 | Remove reference-identity requirements unless caching has an explicit performance contract                                                               | Equal results and independent tuning effects; changing cache strategy alone should pass                                                 |

Paths in the following inventory are relative to `packages/core/src/lib` or
`packages/mode-a/src/lib`, except the named highscore schema. It covers all 32 files.

| Unit suite(s)                                                              | Cases             | Disposition                                                                                                                                                                                                    |
| -------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core `physics/Physics`                                                     | 11                | Replace the 3 self-calculated bodies; keep production force/power behavior. Custom Vec2 tests are low priority, not inherently tautological.                                                                   |
| core `physics/Camera`, `Engine`, `Resistance`, `WellCurve`, `planets`      | 4 + 2 + 2 + 2 + 2 | Keep conversion, hysteresis, taper, legacy resistance and well boundaries. Assert moon retrograde behavior on generated planets rather than only configuration.                                                |
| core `effects/arcade-fx`                                                   | 2                 | Keep bounded work, reserved capacity, expiry/reset.                                                                                                                                                            |
| core `effects/engine-plume`, `ion-beam`                                    | 4 + 3             | Consolidate overlapping outlet lifecycle setup; preserve both `step`/`stepMounted`, release, zero-dt, reset, invalid input, style and world-space placement.                                                   |
| core `ui/typography`                                                       | 1                 | Keep tiny font-string behavior check; CSS parity tests a different boundary.                                                                                                                                   |
| mode-a `simulation`                                                        | 15                | Keep death/freeze/reset, replay, contacts and wrap. Replace passive reach check; distinguish supported stock configuration from current assembled game defaults.                                               |
| `build-flight`                                                             | 14                | Keep power gating, gravity, overspeed and actual propulsion. Consolidate storage/default/geometry/replay setup where shared ownership is clear.                                                                |
| `scout`, `cruiser`, `wasp`                                                 | 11 + 3 + 5        | Use a compact common geometry table, preserving Scout forward torque/clearance and Wasp single-engine, forced stabilizers and migration exceptions. Remove art-coordinate snapshots, not per-hull regressions. |
| `engine-identities`, `ion-flight`                                          | 6 + 8             | Keep charge/recovery, mixed-family speed, angular motion and stabilizer effects. Merge schema default cases; streamline long-loop assertion overhead.                                                          |
| `gravity-collection`, `gravity-coil`, `potential-well`                     | 11 + 1 + 2        | Keep overlap, caps, fade, no-force effect, survival, compatibility and resource properties. Merge repeated starting-full/idle-drain checks with build-flight storage cases.                                    |
| `fx-integration`, `ion-effects`                                            | 2 + 1             | Keep render-detail/overload simulation isolation, wrap outlet behavior and mount-family style assignment.                                                                                                      |
| `slot-types`, `starter-fleet`, `ship-identity`                             | 3 + 2 + 3         | Keep fitting compatibility, actual starter fleet and identity contract. Replace painter counts; prose parsing in trait checks may later become structured comparisons.                                         |
| `mount-planner`, `schemas/flight`, `packages/mode-a/src/schemas/highscore` | 7 + 1 + 1         | Keep invalid inputs, stale baselines, mirror/link consistency, zoom bounds and malformed/retired score tolerance.                                                                                              |
| `lab-instrument`                                                           | 9                 | Keep schema, burns, finite/deterministic paths, tuning propagation. Its study-versus-production comparison uses separate implementations and is not a tautology.                                               |
| `force-composition`, `plasma-escape`, `plasma-study`                       | 2 + 3 + 2         | Mark historical-study ownership; remove cache-identity coupling. Keep in the full run until surface retirement or proven dependency-based selection is agreed.                                                 |

Further consolidation rules:

- Storage ownership: one table for ordinary/heavy/combined reserves and unchanged
  life-support drain; keep independent incoming-power and empty-power checks.
- Defaults ownership: one loadout-schema table for absent/default/explicit/invalid
  stabilizer flags, preserving Wasp's forced-on exception and old-store migration.
- Replay ownership: share only short setup/comparison helpers. Retain feature state
  for angular motion, plasma/fusion timing and collection fade. Identical paired
  runs prove repeatability, not correct motion; keep independent behavioral oracles.
- Long loops: `ion-flight.test.ts:100` invokes matchers on 20,000 steps for each of
  three hulls. Track the minimum and assert it at the end to retain any-reversal
  detection. Other 10,000–30,000-step speed tests cover different exploits; shorten
  only after proving an equivalent boundary/convergence scenario.
- Legacy is not automatically dead: `simulation.test.ts` often uses `stockSettings`,
  while real play uses assembled `gameSettings`/`starterLoadout`. Map import and
  compatibility consumers before retiring legacy cases; retain a current-default
  simulation path. Do not remove `Resistance` merely because newer engines taper.
- The stopped plasma study still has live consumers. Its seven cases occupy 180
  lines, but removing them from full verification now offers little measured speed
  benefit. A separate study command may aid ownership; it must not silently omit
  coverage for shared physics changes. Retiring a published study is a scope decision.

## Browser-suite pruning

### Retained ownership by file

All paths below are in `tests/browser` unless stated otherwise. These are proposed
ownership changes; preserve unique assertions before removing an original test.

| File                                 | Disposition                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alpha.spec.ts`                      | Own launcher/input/pause, shared touch safety and Flight Lab import/replay/death/zoom. Keep representative reload-default check; avoid repeating full pause/input cycle for every hull. Add Wasp to short launcher wiring coverage.                                                                                                                                      |
| `local-session.spec.ts`              | Fold its all-ship startup loop into alpha. Keep unavailable leaderboard, keyboard ship-selection and one meaningful ship-Lab drawing smoke.                                                                                                                                                                                                                              |
| `builder.spec.ts`                    | Own fitting/persistence, corrupt/old saves, mirrored and tightly spaced mounts, custom unranked completion, plasma feedback and return/reset. Merge repeated Corvette lifecycle and heavy-well flight into the representative journeys. Move linked setting into the shared settings journey.                                                                            |
| `scout.spec.ts`                      | Keep Scout deep-link, save layout, unique mounts and builder-to-flight handoff. Remove repeated exhaustive fitting matrix already covered by schemas; consolidate duplicate multi-touch/cancel/blur while retaining alternate-entry reachability. Keep invalid deep-link recovery.                                                                                       |
| `ion-flight.spec.ts`                 | One representative settings/turn/release integration journey that persists an explicit off choice as well as on; retain meaningful linked-engine and stabilizer persistence/propagation. Merge Lab import/replay into alpha. Remove right/both capture-only phases and exhaustive per-hull captures from the default gate.                                               |
| `control-default.spec.ts`            | Keep inversion default, explicit opt-out and reload persistence; this is different from ion stabilization.                                                                                                                                                                                                                                                               |
| `gravity-coil.spec.ts`               | Keep distinct coil fitting/persistence and production flight wiring; numerical collection belongs in units. Do not count mere activity labels as proof of appearance.                                                                                                                                                                                                    |
| `lab-instrument.spec.ts`             | Merge starting-document assertions into burn-change journey. Keep edited-value propagation and pane focus/Escape/hydration regression. Its 45% pane width is explicitly specified, so retain that assertion unless intent changes. Keep a lightweight published-reference smoke; drop exact decorative gradient/count assertions only where no contract depends on them. |
| `mount-planner.spec.ts`              | Keep edit/handoff/undo/invalid import, designer link, responsive reachability and view-mode invariance. The current “landscape touch” test uses desktop clicks at 1180×820; rename it accurately or add actual touch input if required. Reduce repeated full screenshots; share setup without making state-dependent tests.                                              |
| `buttons.spec.ts`                    | Keep keyboard activation/focus, busy/disabled behavior, token propagation, responsive overflow and reduced motion. Replace incidental exact colors, opacity and outline offsets with meaningful state/visibility checks where appropriate; keep documented target sizes.                                                                                                 |
| `dialogs.spec.ts`                    | Retain stage isolation, Escape and focus return during pruning. The owner disputed the prior non-modal intent and wants real dialogs to trap focus, but explicitly deferred that fix pending opening-screen composition. Do not add tests that bless header access as a permanent requirement.                                                                           |
| `ion-effects.spec.ts`                | Keep one control-to-effect lifecycle wiring smoke; move the human review capture to the capture command.                                                                                                                                                                                                                                                                 |
| `fx.spec.ts`                         | Keep mixed production scene activation/pause/reset/bounded work/presentation-off and context-state restoration/read-only simulation. Replace the 150 ms sleep with an observable state or controlled clock.                                                                                                                                                              |
| `fx-surface.spec.ts`                 | Keep all 3 synthetic Canvas cases: accumulation, pause/camera mapping, display-rate decay, teleport discontinuity, reset and complete transparency during ongoing emission. These pixel probes check browser compositing semantics, not art fidelity.                                                                                                                    |
| `tests/firebase/competition.spec.ts` | Keep two genuinely separate authenticated browser identities completing real runs, submitting and a third reading both scores. Optimize the fixture, not the assertions or access boundary.                                                                                                                                                                              |

Seven concrete consolidations yield a **working target of 39 to about 32 offline
journeys**, before filling important gaps. This is a planning estimate, not a quota:

1. Local-session all-ship loop into alpha launcher coverage, retaining inverted ArrowLeft mapping, menu/timer and page-error assertions.
2. Scout's duplicate full touch lifecycle into shared touch coverage plus its existing handoff.
3. Ion Flight Lab export/import/replay into alpha's Lab round-trip.
4. Heavy-well standalone flight into the representative fitted-power journey.
5. Corvette full flight lifecycle into multi-chassis preservation/tight-mount coverage.
6. Instrument starting-document smoke into burn-change coverage.
7. Linked-engine persistence into representative flight-settings coverage.

Do not turn these into one giant end-to-end test. Independent behaviors should
retain clear failure names and isolated setup. Reducing inner loops, screenshots
and long waits matters more than reducing the number of named tests.

### Separate human capture from correctness

There are no `toHaveScreenshot`/`toMatchSnapshot` assertions in the current browser
suites. Remove unused `tests/browser/baselines/flight-trial.png` and
`snapshotPathTemplate` after confirming no remaining consumer. This does not remove
a functioning pixel-equality gate.

Move the 26 deliberate review captures into a small opt-in `test:capture` path
(proposed name). Keep fixed viewport, seed, time and scenario identifiers, especially
for visual work. Keep automatic screenshots and traces on test failure. Use run-local
attachments/output paths instead of overwriting `artifacts/ion-*.png` and similar
shared filenames. Moving captures is a cost hypothesis, not a measured speedup.

In particular, `ion-flight.spec.ts:42–46` advances right/both input solely for
screenshots. It does not assert the claimed behavior in those phases. Remove that
work from the correctness journey; rely on the retained propulsion matrices and
add an input-to-simulation assertion only where browser wiring lacks an owner.

### Fix determinism and coverage gaps while consolidating

- Introduce one small context fixture for local-only networking and page-error
  collection. Current guards cover only some suites; the competition reader also
  lacks its writers' guard. Apply the offline guard to every created context and
  an explicit emulator allowlist to competition. Preserve absent live credentials
  and the `demo-void-drift` project.
- The two repeated standard-flight loops both omit Wasp. Cover its launcher-to-
  movement wiring once; unit tests already cover its distinct steering model.
- Touch tests currently prove pad classes, cancel and blur, but do not assert
  resulting simulated motion. Add a controlled tick/trajectory or thrust-response
  observation to the surviving real multi-touch scenario. Shared classes alone
  are insufficient evidence that touch reaches the simulation.
- `data-x`, `data-y` and `data-spin` come from Simulation and are useful wiring
  probes. They do not prove a canvas painted; canvas visibility does not either.
  Preserve a drawing smoke and the real Canvas semantic tests, alongside human review. In `local-session.spec.ts:55`, a nonempty `toDataURL()` also succeeds for a blank canvas; replace that readiness assertion with bounded nonblank drawing evidence, without an artwork golden.
- Retain save regression cases for absent optional fields and corrupt/obsolete
  storage; these recently found real bugs. Prefer accessible control names and
  hydrated readiness over longer timeouts and CSS-shape selectors.
- Add one focused submit-failure/retry case when restructuring leaderboard tests.
  Existing unconfigured-state and successful competition checks do not cover a
  failed configured write. Keep it isolated and deterministic; avoid a large mock matrix.
- Preserve bounds tests for all zoom counts in cheap schema/unit checks, but reduce
  browser work to boundary configuration, representative preview and shared-link
  round-trip. Do not repeat every view change when it uses the same handler.

### Reduce expensive run completion

`builder.spec.ts:137–143` waits up to 20 wall seconds for custom survival death.
Use a controlled clock and a validated short real-input completion fixture, retaining
the unranked/no-submit assertion and return-to-builder behavior.

Competition similarly spends much of its work rendering while mocked time advances.
`page.clock.runFor(1000)` executes animation frames; FlightDeck uses a fixed
1920×1080 backing surface. A smaller viewport alone does not solve this.

First derive a short, legitimate deterministic input sequence using the shared
Simulation and replay it through real browser keyboard input for each pilot.
Preserve actual completion, score calculation, authentication, save and independent
readback. Measure before changing more infrastructure. If necessary, separately
evaluate coarser browser frame scheduling while retaining the same fixed simulation
steps and result, and leave normal-frame gameplay smoke in place. A single giant
`fastForward` is not equivalent: FlightDeck clamps each frame's delta to 0.1 seconds.
Do not inject scores, skip directly to game-over, change physics constants, disable
validation or raise deadlines to manufacture a faster/passing competition result.

## Backend and execution efficiency

Keep all ten rules-test intents. Client schemas and Firestore rules defend different
boundaries; mirroring an invalid input here is warranted. Parameterize the gravity/
ion challenge cases if it simplifies maintenance, retaining legacy isolation,
cross-challenge rejection, cross-owner rejection and monotonic updates. Do not
collapse the negative cases into the successful competition test. Extend existing
cases with equal-score update rejection, explicit list limit 21 rejection,
unauthenticated direct-get rejection and wrong-namespace read rejection. These
exercise currently uncovered branches of the existing rules, not new policy.

The two package commands currently start Firestore twice. Share one
Firestore+Auth lifecycle for a full run, executing rules then competition with a
clean/reset database between them. Rules tests seed documents; leaving them behind
can contaminate leaderboard results. Keep standalone commands for focused work and
preserve independent logs/statuses. Start/stop savings are unmeasured and cannot
be assumed equal to the whole rules-stage time. Emulator ports still prevent
concurrent backend runs; browser port overrides do not isolate them.

The browser configuration currently starts an Astro development server even after
the build gate. Later, run ordinary user journeys against the built preview to
exercise the deliverable. Keep direct-source `/@fs/` imports in a small dedicated
browser harness until they can run against an explicit built test entry. Simply
switching every test to preview would break the Canvas tests. This is an artifact-
coverage improvement, not a prerequisite for removing obvious redundant assertions.

Avoid premature broad parallelism. First remove duplicate work and shared output
paths. Then benchmark a small worker increase for isolated offline browser files.
Do not run emulator suites concurrently or claim software-rendered browser timing
as physical-device performance. Preserve `reuseExistingServer: false`, zero retries,
port validation and the ban on silently refreshing expected results.

## Implementation slices and validation

| Slice                                                 | Scope                                                                                                                                           | Completion evidence                                                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Remove invalid oracles                             | Radius-function cases, passive well assertion, Scout artwork copy, Canvas call counts, cached-array identity; unused screenshot baseline/config | Focused suites pass; real radius/overlay regressions still fail; harmless artwork or cache refactor no longer forces expectation rewrites                       |
| 2. Separate captures and consolidate browser journeys | Move review captures; seven ownership merges; shared network/error fixture; Wasp and touch-response gaps; deterministic builder completion      | Before/after behavior matrix, focused browser results, retained failure artifacts and measured timings; no unique persistence/input/accessibility behavior lost |
| 3. Optimize backend verification                      | Short real-input competition fixture, shared emulator lifecycle and isolation, small submit-failure/retry case                                  | Ten rules intents retained, two real completed submissions and third-reader check pass; each backend stage can still fail independently                         |
| 4. Simplify remaining unit setup                      | Geometry/storage/default/replay overlap; long-loop matcher overhead; study ownership annotations                                                | All supported hull and feature-specific cases retained; table names identify failures; no elaborate abstraction solely to lower line count                      |
| 5. Tighten execution/documentation                    | Astro warning threshold, harness TS coverage, CI cancellation/event policy; optionally preview-backed user journeys after separate harness work | Injected warnings/type errors fail; CI required status remains available; preview routes boot; report semantics unchanged                                       |
| 6. Compare and close                                  | Review reduced suite, update authoritative docs and final full run                                                                              | No hidden skips, no source changes during final run, per-stage results and bounded runtime comparison recorded                                                  |

For each slice, maintain a short mapping of removed assertion → surviving test
and contract. Use existing descriptions and simple tables, not a new coverage
registry system. An assertion with no owner is either retained or explicitly
retired with its behavior.

Use a bounded set of temporary defects in an isolated copy to establish that key
retained checks work: wrong radius clamp/override, bypassed empty-power gating,
wrong torque sign, lost touch forwarding, absent saved optional flag handling,
missing FX cleanup and allowed cross-owner score writes. Pick defects relevant to
the slice; demonstrate red then restored green. Do not commit mutation code or add
a permanent exhaustive mutation gate. A pruned suite passing only unchanged code
is not sufficient evidence of retained regression sensitivity.

Measure per-stage and slowest browser-case times on the same machine/runtime,
without concurrent build/test work. One before/after comparison supports an initial
decision; repeat a small bounded sample only for noisy or consequential optimizations.
Keep cold/warm setup effects visible. Proposed performance objective: materially
reduce browser/competition wall time (aim for roughly 25% of combined cost if the
fixture changes support it), while keeping quick verification near its current cost.
This is a hypothesis to evaluate, not a gate or a promised result. Reject changes
that only lower case count or move required work out of the reported full run.

Update [development](../development.md) and
[factory contract](../specs/voice-led-factory.md) alongside implemented command,
report, capture or gate changes. Update relevant feature specs only where intended
behavior changes. Keep this plan as a proposal until its slices actually land;
do not report a new pruning policy as an adopted lesson.

## Explicitly retained boundaries

- Formatting, strict types, build and behavior tests detect different failure classes.
- Quick verification remains partial; selected success is never a full pass.
- Fixed-seed replay, death/reset, empty-power gating, wrapping and contact physics stay.
- Keyboard, simultaneous touch/cancel/blur, dialog focus and saved settings stay.
- Supported loadout/schema migration, mount constraints and current fleet wiring stay.
- FX bounded work, game-time lifecycle, Canvas-state isolation and simulation isolation stay.
- Access-rule rejection and real multi-identity leaderboard integration stay.
- Human feel/fidelity review and physical-phone performance remain separate and open.

The safe first outcome is a smaller, more purposeful browser suite and more honest
unit oracles, with all major gate families intact. Study retirement, advanced
change-selection, new dependencies and redesigned game behavior are outside this cleanup.

## Implementation outcome — 2026-11-03

The owner authorized implementation after this audit. The changes implement the
bounded pruning slices; the optional experiments listed below remain deferred.
The owner separately corrected dialog intent, then explicitly deferred the modal fix because the opening menu relies on external header navigation. No production behavior, physics constants or dependencies changed in this pruning implementation.

The owner also explicitly clarified that arbitrary tuning and art values must not
be frozen by tests. The final pass removes remaining shipped-capacity, mass, speed,
engine-timing and geometry snapshots, including mass literals in browser locators.
Tests instead compare configured data with the consuming simulation/UI, test
behavioral relationships, or supply deliberate numeric fixtures. A tuning change
alone should not require updating an expected-value snapshot. Schema compatibility,
invalid-input boundaries, conservation/resource rules and lifecycle isolation remain.

| Slice              | Implemented result                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit assertions    | 145 → 142 cases; 2,581 → 2,665 lines after the final explicit-fixture pass. Fewer arbitrary oracles, with some longer but independently meaningful fixtures. Real radius calls replace self-calculated assertions; simulation now consumes changed planet geometry. Artwork copies, exact painter counts and cache identity locks are replaced by behavior/relationship assertions. |
| Unit consolidation | Shared geometry cases retain Scout/Fighter/Corvette emitters, torque and collision wiring. Storage/default/lifecycle overlap is consolidated; braking retains its full step horizon with an accumulated minimum. Wasp exceptions, studies, legacy paths and feature-specific replays remain.                                                                                        |
| Browser journeys   | 39 → 32 offline journeys through the seven planned folds. Current coverage adds Wasp launcher/movement, touch-to-simulation response, explicit stabilizer off/on persistence, nonblank drawing and shared context network/error checks. Stage isolation remains covered; modal enforcement is deferred separately.                                                                  |
| Review capture     | `pnpm test:capture` owns five scenarios producing 26 run-local images. The unused golden and snapshot-path configuration are removed. Failure screenshots/traces remain in correctness tests.                                                                                                                                                                                       |
| Backend            | Full verification and `pnpm test:backend` share one owned emulator lifecycle while retaining independent rules/competition outcomes. Competition clears prior fixtures, completes short legitimate scored runs through real inputs, retries an intentionally rejected write, then verifies independent readback.                                                                    |
| Gate integrity     | Factory cases read retained evidence and identify exact commands; backend failures remain independently visible. Astro warnings now fail; browser/capture/configuration TypeScript is included. CI cancels obsolete same-event/ref runs.                                                                                                                                            |

Removed coverage has the following surviving owners:

- Radius arithmetic and passive well fields → production radius boundary table and
  actual two-radius simulation comparison.
- Scout art copy and duplicate Scout/Corvette geometry → relational hull checks,
  shared all-chassis emitter/torque/collision table and retained Scout clearance.
- Canvas call counts → fitting changes the drawing, flight has no fitting labels
  or selection overlay, builder emits type/index labels and responds to selection.
- Battery/default/plume duplicate setup → storage table, all-chassis migration table
  and lifecycle case covering pause, invalid output, release, reset and bounds.
- Main-game loop and duplicate touch → canonical alpha launcher/touch journeys;
  control inversion and Scout builder handoff remain independently covered.
- Ion Lab round-trip → alpha Lab import/replay; ion settings own explicit off/on,
  linked flags and real turn/release behavior.
- Repeated heavy-well/Corvette/linked-setting journeys → representative fitted-power,
  cross-chassis mount preservation and ion settings journeys respectively.
- Instrument initial smoke → burn-change journey; edited graph propagation and
  pane focus/hydration cases remain separate.

The existing dialog spec claimed non-modal behavior was owner-approved. The owner
challenged that attribution as likely agent drift and explicitly confirmed that all
dialogs must trap focus until closed. The permanent opening menu currently depends on external header navigation, so
applying that rule alone would block Hangar, High Scores and Options. The owner
explicitly deferred the modal fix until that composition is redesigned. Existing
behavior remains during pruning; tests retain stage isolation and focus return,
without declaring external header access a permanent intended contract. See the
[separate redesign plan](2026-11-03-opening-screen-dialog-boundary.md).

### Regression-sensitivity evidence

Seven temporary unit defects in an isolated copy were all detected: incorrect
radius clamp, ignored explicit reach, bypassed empty-power gating, reversed torque,
missing builder labels, hidden fitting drawing and broken FX reset. The final baseline and
restored targeted runs both passed 57 cases. Evidence is retained locally under
`artifacts/test-pruning/unit-probes-final/` (the earlier probe run is also retained).

A separate isolated browser defect kept pad state active but replaced controls sent
to simulation with idle input. The retained touch journey failed on unchanged ship
position; the restored test passed. See `artifacts/test-pruning/touch-mutation.log`
and `touch-mutation-results/`. These were bounded audit probes, not new permanent
mutation gates; no injected defect was applied to the main working tree.

### Deliberately retained or deferred

- All major gate categories and all supported study/legacy unit suites remain.
  More replay/helper abstraction did not offer a clear maintenance benefit.
- Push and PR runs remain separate: they verify different refs, and removing one
  without a repository branch-policy decision can lose required coverage. Obsolete
  runs within each event/ref are canceled.
- Production-preview browser migration, worker-count tuning and semantic theme-color
  derivation remain later experiments. Existing source-harness imports, single worker,
  zero retries and parity checks remain; no performance gain is claimed for them.
- Human fidelity, gameplay balance and physical-device performance were not reviewed.


### Final verification and measured result

The final pruning snapshot passed all nine required stages with no skipped stages
and no source changes during the run: 142 unit cases, 32 offline browser journeys,
10 rules cases, one multi-player competition journey and seven verification-harness
cases. Strict types, warning checks, formatting, contracts, commit checks and build
also passed. The report records Node 24.14.0 on darwin/arm64 and base revision
`0719198a2de41bddd9dce9e92dea84d2a512bc0f`.

- Final report and logs: `artifacts/verification/2026-11-03T14-55-24.896Z-BAyq9l/`.
- Source fingerprint: `bccef82cd13f0792b87a948e9ee3fdf03e4041f17f0b4bb342b7d99a4776d0bc`.
- Original full baseline: `artifacts/verification/2026-11-03T14-11-35.210Z-SNpeB2/`.
- Final optional capture run passed all five scenarios and produced 26 distinct
  images, with attachment/report copies stored separately:
  `artifacts/review/2026-11-03T14-57-04.583Z-217afd75-4df3-447e-9f83-73460c9e43a6/`.
  These are review materials; generating them does not establish visual approval.

| Measured work                                     |   Before |   After |
| ------------------------------------------------- | -------: | ------: |
| Full verification wall time                       | 161.50 s | 68.03 s |
| Offline browser stage                             |  63.17 s | 29.07 s |
| Backend total, including emulator startup/cleanup |  67.67 s | 15.19 s |
| Unit stage                                        |   1.81 s |  0.94 s |
| Contracts plus verification-harness tests         |   2.60 s |  4.35 s |

The full run was about 58% shorter in this local comparison. The backend before
value sums the two separately managed emulator stages; the after value is the
single inclusive lifecycle duration. After pruning, rules took 1.33 s and competition
8.35 s inside that lifecycle, with 5.51 s of setup/cleanup overhead. Do not add the
inclusive lifecycle duration to the child suite times again. Harness checks became
slightly slower because they now exercise failure and timeout handling. These are
single-run observations on the same machine/runtime, not a controlled CI benchmark;
cache and machine load also affect the result.

Concurrent Fiddler, design-study and release-tooling work was present in the shared
workspace. Verification therefore used an isolated copy containing only the pruning
changes, preserving that unrelated work. The initial isolated attempt accidentally
included only part of the concurrent release work and failed the contracts stage;
its failure report is retained at
`artifacts/verification/2026-11-03T14-43-13.930Z-0B8mZm/`. Correcting that snapshot
boundary and using Node 24 produced the passing runs; no gate was weakened. The
final result qualifies the pruning snapshot, not every concurrent change in the
shared workspace. This evidence-only section was appended after the full run.

Dialog production code remains unchanged. The opening-screen/dialog redesign is
explicitly deferred under the owner's decision, and no modal fix is included here.
