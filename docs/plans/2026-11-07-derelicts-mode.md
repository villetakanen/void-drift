# Derelicts mode integration

## Status and scope

Implementation complete, 7 November 2026, with generated solar systems deferred by
owner decision. Final Hangar copy reconciliation completes the deliverables: weapon
labels identify Derelicts, and the launch explanation distinguishes practice,
Derelicts and custom survival. Existing launches, results and return paths are wired.

Solar-system generation is outside this completed scope while another agent works
on suns. Keep the current default environment; do not change generation or fallback
wiring here. Verification and experience review are evidence activities, not remaining
feature deliverables or an additional implementation slice. Historical evidence and
the original sequence below are retained.

### First slice evidence — committed and pushed as `33aaec2`

Explicit modes are implemented with legacy `testFlight` input compatibility and
explicit-mode precedence. Practice retains its previous behavior in this slice;
Derelicts is internal and not yet offered. Existing untracked study callers were
updated locally to explicit practice mode; those study files remain outside the
mode-refactor commit with the rest of the pre-existing study work.

Working-tree checks: 234 unit tests passed across 43 files; workspace types passed;
the focused browser fit/persist/fly/reset/return journey passed on port 4342.
Quick verification failed: repository lint includes pre-existing study SVG
accessibility/formatting failures, plus formatting issues in the new code that
were subsequently fixed. Contracts passed. This is partial evidence, not full
verification; build, full browser and backend suites were not run for this slice.

Separate the existing fitted test flight into safe practice and the Derelicts
survival/combat mode. Reuse shared simulation, weapons, salvage, input and effects.
Do not introduce a new package, change gravity/friction, implement Mode 3,
equipment progression or Experimental eligibility, or alter ranked Survival rules.

Authoritative contracts:

- [Practice](../specs/game/test-flight/spec.md)
- [Derelicts](../specs/game/derelicts/spec.md)
- [Hangar](../specs/game/hangar/spec.md)
- [Accepted visual study](../../apps/web/src/pages/lab/studies/derelict-three-2026-11-06.astro), especially 03 and 04
- [Study closure and owner decisions](../loop-evidence/2026-11-06-derelict-three-closure.md)

The study accepts the supplied hull/material direction, working 110-unit extent,
eight-piece B distributed shedding and motion, ejected hollow energy square and
0.28-second expanding release pulse. Its damage comparisons are unselected;
demonstration times and five equal hits are not gameplay balance requirements.

### Safe-practice slice

Practice now retains the default star and planets and fixed initial conditions,
full health/energy and unlimited engine availability through normal physical
interactions. The flight screen has no Reset, Send action or survival timer;
Pause/Resume/Abort preserves the build and re-entry starts fresh.

Existing salvage ownership moves to internal Derelicts mode here, before the
arrival rewrite in slice 3. Unit and FX fixtures explicitly recreate their former
isolated small-star scene; these fixtures do not define either mode's environment.
The accepted practice spec is adopted in this commit; unrelated Hangar opening,
routing and study work remains separate.

Working-tree evidence: 236 unit tests passed; workspace types, contracts and
changed-code lint passed. All ten affected browser journeys passed across the
completed checks and isolated rerun. The first run was interrupted after five
failures caused by outdated Vite dependencies during concurrent type checking;
a subsequent run passed nine of ten, with the new practice journey interrupted
by a development-server reload. Its isolated rerun and the touch check passed.
Two desktop/landscape-phone capture checks passed; images were inspected for
resource display, controls and pause composition. Human handling acceptance is
still outstanding. Full repository lint retains the previously observed study
SVG failures; full browser, build and backend gates were not run for this slice.

### Boundary-arrival slice

Replaced ship-relative passes with seeded inward boundary arrivals. Timing and
trajectory streams are independent of combat/breakup random consumption, and
capacity skips consume candidate paths without changing future deadlines. The
legacy manual-send replay field remains parseable but is ignored. The FX Lab
supplies explicit diagnostic targets so it does not depend on random arrivals.
Public Derelicts entry and generated-system wiring remain in slice 8.

Verification: all 240 tests in the full unit suite passed before the final
expiry-coverage addition; the six arrival tests then passed with that addition.
Workspace types and changed-file lint passed. Contracts initially failed in an
existing 300-ms emulator-timeout runner test (missing shutdown marker); an isolated
rerun passed all 14 factory tests with advisory existing Markdown-link warnings.
Practice and landscape-touch browser regressions passed (two tests). No source
changes were made to factory gates. Full repository lint retains the previously
observed study SVG issues; build, full browser and backend gates were not run.
Human flight balance/readability review remains pending the integrated mode.

### Early playable entry

Owner requested an early Hangar launch after slice 3, without waiting for scoring
or new game-over behavior. The Derelicts button passes the current build into the
existing flight screen in Derelicts mode. This advances only the launch wiring from
slice 8; generated systems, score presentation and the accepted artwork remain
pending their planned slices. Existing Pause/Abort and return behavior is retained.
Workspace types and a focused browser launch/encounter/abort/setup-retention check
passed. The launch is preserved in local commit `b171d89`.

### Run-score slice

Destruction records its typed cause at the point of removal. Player weapon and
ram wreck kills increment a separate exactly-once counter; fragments, environment,
expiry and exit do not. A validated frozen result captures gameplay seconds,
player kills and their total at Derelicts game over. FlightDeck shows this result
only in that dialog, with no live score/timer, submission or leaderboard action.
Survival's timer, result and submission rules remain separate.

Verification: all 246 tests across 45 files passed in the working tree; workspace
Astro/Svelte/TypeScript checks, contracts (14 factory tests) and changed-file lint
passed. Seven entry/Survival browser checks passed initially; the score assertion
failed on whitespace twice because the first edit did not match the formatted
source. After correcting that assertion, the full result/storage/fresh-run journey
passed. The rendered result dialog was inspected. Full repository lint retains
previously observed study SVG issues; full browser, build and backend gates were
not run. This is partial verification, not a release claim.

### Shared-artwork slice

Promoted the unchanged 41 source paths, sampled flat palette, eight B fracture
regions/motion and selected release-cue definition into mode-a. Normalized the
measured source extent to 110 world units (the study's nominal 110/140 scale was
about 0.35% smaller). The production intact hull and canonical Derelict Lab use
one cached painter; the square's light uses the existing persistent surface and
its black aperture is restored after compositing. Local study adapters also use
that shared painter and B reference; their broader uncommitted study work remains
outside this commit. Retained source captures preserve the prior hue treatment.

Physical collision proxies, four generic gameplay fragments, damage progression,
collectible visuals and live release-pulse triggering are deliberately unchanged
until slices 6–7. The visible 110-unit hull currently exceeds its old radius-18
collision proxy; this is a known trial limitation, not accepted collision fidelity.

Verification: 249 tests in 46 files passed; workspace types, contracts (14 factory
checks), changed-file lint and two focused browser checks passed. The initial type
check found the Astro no-props component signature issue; adding an explicit
optional label resolved it. Initial review capture rejected range value `0.70`;
normalizing it to `0.7` resolved the capture fixture. Canonical intact, early
shedding, release and separated captures and early/post-impact production FX
captures were inspected against the retained reference. Sustained performance and
human in-flight fidelity/balance review remain unmeasured/unaccepted. Full build,
full browser, backend and full repository lint were not run; existing study SVG
lint issues remain outside this commit. This is partial verification.

Canonical capture evidence:
`artifacts/review/2026-11-07T07-30-45.996Z-749ce8d2-8e2a-4ec3-a049-528cd6024e97/`.
Production FX capture:
`artifacts/review/2026-11-07T07-31-44.634Z-33db6763-815a-4af2-8c50-f14972fd4dcf/`.

### Fitted collisions and physical shedding slice

Implemented attached-mask and shard state, fitted material collision, threshold
shedding, eight-piece accounting and parent-relative B release. Drawings and
collision drop the same attached regions; released shards use the same source-site
pivots. Star/planet destruction loses energy with no score, per the owner's explicit
correction. Player destruction produces one cell. The Lab now has a real simulation
specimen for laser pulses, rail shots, ram, coasting and fitted-material inspection.

Newborn movement begins on the next fixed substep; release poses and impact plumes
use fractional contact. Terminal-time checks prevent a later gun or ram contact
from claiming a body that has already reached a hazard, expired or exited. Stable
independent rail processing is retained; this is not a global event solver.
Collectible appearance/ejection and the live selected release pulse remain slice 7.

Verification: the final full suite passed 271 tests across 47 files; after making
fragment count a schema literal, the 42 salvage tests passed again. Workspace
Astro/Svelte checks and the final TypeScript check passed. Changed-file lint and
four browser journeys passed (material aperture/size, staged damage/ram, entry and
score). Real-damage captures show three shed pieces, fitted overlay and eight
released physical pieces plus one player-drop cell. They were inspected; human
in-flight feel and sustained rendering performance remain unaccepted/unmeasured.

Repaired checks: the first type check found five nullable references in the Lab
specimen; narrowing to the local salvage instance fixed them. The first browser
run selected both Lab canvases; a label-based selector fixed the assertion. The
full suite exposed two boundary-entry regressions from floating-point rounding in
the new pre-contact exit check; a 1e-7-unit arena-edge tolerance fixed entry without
changing paths or spawn rules. A late contracts run hit the existing emulator
shutdown-marker timeout test; an isolated rerun passed all 14 factory checks.
No factory contracts were changed. Full repository lint retains existing study SVG
issues; full browser, production build and backend gates were not run.

Capture evidence:
`artifacts/review/2026-11-07T07-59-34.404Z-bafb93d2-b46e-4b4e-a53b-3aac0fa57f1f/`.
Indicative collision-only Vitest measurements were about 92 ms per 1000 static
casts and 96 ms per 100 difficult rotating grazes; these are not frame-time or
hardware acceptance measurements.

### Energy-square pickup and player release-pulse slice

Promoted source-centre and B ejection constants; player weapon/ram destruction
creates one moving square at the fractional rupture pose. It inherits wreck
velocity plus local (0, −45) u/s transformed by contact heading. The rotation anchor
retains that heading; shared π/6-per-second phase preserves continuity after release.
Pickup value/radius/lifetime stay 30/6/20; full-capacity pickups remain consumed.

The validated `energy-release` event retains the fixed rupture centre for the
shared 0.28-second world-unit pulse. The persistent surface owns afterglow. It
replaces the generic player-break flash; environmental destruction, expiry, exit
and fragment destruction create neither event nor collectible. Body, halo and black
aperture use the same cached painter in flight and the production Lab specimen.
The Lab adds short coasting to inspect the pulse separately from the moving square.

Verification: 274 unit tests across 47 files, workspace type checks, 14 factory
contract tests, changed-file Biome checks and the production build passed. Four
browser journeys passed: moving square/fixed pulse/hollow aperture/reset, physical
shedding, Hangar entry and frozen game-over scoring. The production specimen capture
passed and was inspected at 1440px; the behavioral Lab check uses 1280px.
Pause/fresh-run and saturated-event-ring coverage retain the release lifecycle.
The flight FX surface clears when the simulation instance changes.

Capture evidence:
`artifacts/review/2026-11-07T08-21-59.477Z-793e5a1d-3e7b-4073-90e0-78187522b149/`.
This is focused verification, not a full `pnpm verify` pass: the complete browser
suite and backend suites were not run for this slice. Repository-wide lint remains
affected by unrelated untracked study SVGs recorded in earlier slice evidence.
Captures do not establish owner acceptance of feel or sustained device performance.

## Acceptance contract

- Both entries use the active Hangar build and system choices, with fresh sessions
  and unchanged setup on return.
- Practice has a fixed star-and-planet layout, full health/energy throughout,
  normal physical interactions, no encounters, score or failure, and no Reset.
- Derelicts has normal survival failure and resources in the default star system.
  Generated solar systems are deferred to separate work.
- Wrecks enter at the system boundary at 100–500 u/s independently of the player.
  Random arrival timing has a steady distribution; no manual Send action exists.
- Score is gameplay seconds plus ten per player weapon/ram kill, counted once;
  environmental destruction, expiry, exits and fragments earn no bonus. Show the
  final score only at game over; do not persist or submit it.
- Pause freezes simulation and scoring; Resume continues; Abort returns to Hangar.
- Visible remaining hull and released shards have matching physical geometry.
  Release exactly eight physical pieces total and one collectible at containment
  failure, with the accepted motion and pulse.
- Keyboard and landscape touch remain usable. Human fidelity/feel review remains
  separate from automated correctness.

## Atomic commit sequence

Each commit includes its relevant spec changes and focused verification. Keep
intermediate revisions coherent; introduce new internal mode capabilities before
offering unfinished public entry points. Inspect the existing dirty tree and
establish ownership of baseline changes before staging any commits.

| #   | Commit                                                   | Deliverable and evidence                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `refactor(flight): define explicit flight modes`         | Define Zod mode selection before consumers; separate practice/derelicts/survival from launch source and eligibility. Migrate callers coherently while preserving baseline behavior. Check schema and existing flight regressions.                                                               |
| 2   | `feat(practice): implement safe repeatable flight`       | Fixed star-and-planet environment, unlimited resources without changing build physics, no salvage or death, pause/resume/abort and no Reset. Verify repeatable entry, hazardous contact and setup retention.                                                                                    |
| 3   | `feat(derelicts): add survival encounter sessions`       | Normal survival with shared combat; boundary arrivals independent of ship state at 100–500 u/s, randomized steady intervals and no manual sends. Verify seeded arrivals, survival failure and paused encounters.                                                                                |
| 4   | `feat(derelicts): track player kills and run score`      | Explicit destruction attribution, exactly-once bonuses, simulation gameplay clock and frozen result. Verify 60 seconds plus three player kills equals 90, environmental exclusions and no score writes.                                                                                         |
| 5   | `refactor(derelicts): share accepted wreck artwork`      | Promote shared hull, eight fracture regions, materials and release visual definitions; study and game use the same definitions. Resolve colour treatment first; compare intact/separated silhouettes and material continuity at fixed scale.                                                    |
| 6   | `feat(derelicts): implement physical damage progression` | After damage-policy agreement, define validated attached/released piece and containment state. Implement fitted collision geometry for remaining hull and shards, deterministic progression and exactly-once releases. Verify large hits, repeated hits, contact and environmental destruction. |
| 7   | `feat(derelicts): connect energy release and pulse`      | Trigger one moving square collectible and the selected expanding pulse at actual containment loss; retain B ejection and existing pickup amount/lifetime. Verify collection, capacity clamping, expiry, pause and replay.                                                                       |
| 8   | `docs(hangar): reconcile flight mode copy`               | Complete: launch choices, mode-specific results and return paths were delivered in earlier slices; reconcile final Hangar weapon labels and mode descriptions. Generated-system wiring is deferred to separate work.                                                                            |

Dependencies: 1 precedes mode work; 3 precedes 4; 5 and damage-policy agreement
precede 6; 6 precedes 7; 8 integrates the complete slices. Existing combat can serve
as an intermediate implementation in 3–4; it is not acceptance of generic artwork
or four-piece breakup as the finished mode.

## Resolved decisions and deferred work

1. **Damage details resolved in slice 6:** cumulative 20%/40%/60% damage releases
   B indices 0/6/3; destruction releases the rest exactly once. Ram-born pieces
   suppress the causal overlap until collective separation. Values remain initial
   balance tuning; the selected damage/energy policy is accepted.
2. **Colour treatment resolved in the artwork slice:** bake each plane's original
   hue treatment into a flat fill. Sample the mean RGB over the plane interior;
   retain the 41 source paths unchanged. No runtime hull hue overlay or gradient
   and no exception to docs/design.md. Energy light retains its separate halo.
3. **Collision implementation resolved in slice 6:** shared source fills are
   triangulated and clipped into convex material pieces. Precomputed region
   vertices and bounded lazy mask caches feed analytic linear casts and rotating
   casts with 0.0001-world-unit near-contact tolerance. Broad circles only reject.
   Actual contact timing orders world hazards, expiry/exit and player contacts.
4. **Arrival tuning resolved for slice 3:** first arrival at 3 seconds, independent
   uniform 6–12-second gaps, uniform boundary entries, inward headings within ±60°,
   uniform 100–500 u/s system speed, 30-second wreck expiry and eight groups.
   Skip arrivals at capacity without a backlog; separate seeded timing/trajectory
   streams from combat. These are provisional balance values for flight review.
   Generated-system integration is deferred to separate work while suns are being developed.
5. **Scope closure:** final Hangar copy is reconciled. Generated solar systems are
   deferred. No implementation decisions remain for this plan. Experience review
   and performance measurements remain separate evidence, not feature deliverables.

## Accepted damage policy

Owner decision, 7 November 2026: staged shedding with containment loss and energy
release at player-caused destruction, following the recommendation and study 02.7 B. No early
energy release from a surviving wreck. This makes accumulated damage visible
while retaining destruction as the event that releases the energy. Player kill
attribution still independently governs the score bonus; environmental destruction
awards no kill and destroys contained energy; it does not release a cell.

Resolve remaining decisions just in time, before their dependent slices. Do not
reopen the selected policy as part of threshold tuning. Implementation must update
the owning Derelicts spec alongside the behavior.

### Physical implementation decisions

Use cumulative damage rather than hit count or hit location.

Starting thresholds: release the selected tip, side section and lower
end at 20%, 40% and 60% of initial hull damage; containment fails at 100%. Keep
85 wreck hull, 100 rail damage and 5 laser damage as existing provisional tuning.
That means shedding at 20, 35 and 55 accumulated damage with laser pulses, and
destruction at 85. These percentages are initial implementation tuning;
the staged-shedding/energy-at-destruction policy above is accepted.

A single lethal player hit crosses every threshold in one simulation step: release all
eight pieces once and eject energy immediately. Do not insert artificial delays
or grant a dying wreck additional invulnerability to showcase the animation.
Early pieces use their independent fragment health; shedding does not subtract
extra hull from the parent. A detached piece no longer collides as attached hull.
All parts inherit parent motion plus the selected B release motion.

Direct ship contact retains destruction and 30 damage once. Ram-born material
arms only after collective separation. Owner correction in this slice explicitly
requires star/planet destruction to lose contained energy and award no kill; it
releases remaining physical material, not a cell. Expiry/exit add no new material
or drops. Earlier contact determines attribution; equal-time terminal contacts win.

## Verification and completion

Run focused simulation/schema tests with each slice and browser journeys when
entry/UI changes. Use repository-required checks from docs/development.md before
completion. Report failed, skipped and unavailable checks explicitly. Review Lab
references at widths of at least 1280px; flight additionally retains landscape
phone controls. Record human review and measured frame-time/body/effect budgets.
Preserve all existing plans. The owner explicitly authorized committing and pushing
each requested slice; publication and external feedback remain outside scope.
