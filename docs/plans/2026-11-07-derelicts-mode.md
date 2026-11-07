# Derelicts mode integration

## Status and scope

In progress, 7 November 2026. The owner requested this plan and discussion of damage
policy before implementation, then accepted staged shedding with energy released
at destruction, then authorized implementation one atomic commit at a time. Remaining
decisions will be resolved just in time for their dependent implementation slices.

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

## Acceptance contract

- Both entries use the active Hangar build and system choices, with fresh sessions
  and unchanged setup on return.
- Practice has a fixed star-and-planet layout, full health/energy throughout,
  normal physical interactions, no encounters, score or failure, and no Reset.
- Derelicts has normal survival failure and resources; generated systems fall
  back to the default system when generation is unavailable.
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
| 8   | `feat(hangar): expose practice and derelicts launches`   | Finish explicit launch choices, generated-system fallback, mode-specific results and return paths. Reconcile obsolete Hangar copy/criteria and study references to encounter testing in practice. Verify complete keyboard/touch journeys and simultaneous-breakup performance.                 |

Dependencies: 1 precedes mode work; 3 precedes 4; 5 and damage-policy agreement
precede 6; 6 precedes 7; 8 integrates the complete slices. Existing combat can serve
as an intermediate implementation in 3–4; it is not acceptance of generic artwork
or four-piece breakup as the finished mode.

## Open decisions

1. **Damage details (before commit 6):** the policy is accepted below. Finalize
   shedding thresholds and contact/release sequencing when implementing physical
   progression; proposed starting values below remain provisional.
2. **Colour treatment:** bake selected colours into flat hull planes (recommended)
   or explicitly approve a scoped hue-overlay exception to docs/design.md.
3. **Collision implementation:** choose fitted shapes and swept collision handling
   for long shards, hull gaps and partially attached structures. No circular-only
   authoritative proxies. Verify contact at encounter speeds.
4. **Arrival tuning:** initial interval distribution and concurrent-body budget;
   no elapsed-time ramp or ship-relative positioning. Inspect generated-system
   readiness before deciding integration details; retain default fallback.
5. **Experience acceptance:** measure multiple simultaneous breakups and review
   readability at 100–500 u/s. Automated tests do not accept visual fidelity.

## Accepted damage policy

Owner decision, 7 November 2026: staged shedding with containment loss and energy
release at destruction, following the recommendation and study 02.7 B. No early
energy release from a surviving wreck. This makes accumulated damage visible
while retaining destruction as the event that releases the energy. Player kill
attribution still independently governs the score bonus; environmental destruction
does not become a player kill merely because energy is released.

Resolve remaining decisions just in time, before their dependent slices. Do not
reopen the selected policy as part of threshold tuning. Implementation must update
the owning Derelicts spec alongside the behavior.

### Proposed implementation details

Use cumulative damage rather than hit count or hit location.

Proposed starting thresholds: release the selected tip, side section and lower
end at 20%, 40% and 60% of initial hull damage; containment fails at 100%. Keep
85 wreck hull, 100 rail damage and 5 laser damage as existing provisional tuning.
That means shedding at 20, 35 and 55 accumulated damage with laser pulses, and
destruction at 85. These percentages remain provisional implementation tuning;
the staged-shedding/energy-at-destruction policy above is accepted.

A single lethal hit crosses every threshold in one simulation step: release all
eight pieces once and eject energy immediately. Do not insert artificial delays
or grant a dying wreck additional invulnerability to showcase the animation.
Early pieces use their independent fragment health; shedding does not subtract
extra hull from the parent. A detached piece no longer collides as attached hull.
All parts inherit parent motion plus the selected B release motion.

Direct ship contact retains the mode contract's destruction and 30 damage;
environmental destruction earns no kill bonus. Exact contact sequencing must
avoid charging the same contact for both the wreck and newly released shards.
Confirm the release/drop behavior for environmental destruction and exits during
policy discussion; do not infer rewards for despawning bodies.

## Verification and completion

Run focused simulation/schema tests with each slice and browser journeys when
entry/UI changes. Use repository-required checks from docs/development.md before
completion. Report failed, skipped and unavailable checks explicitly. Review Lab
references at widths of at least 1280px; flight additionally retains landscape
phone controls. Record human review and measured frame-time/body/effect budgets.
Preserve all existing plans. No push, publication or external feedback is included.
