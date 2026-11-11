# Active ship and Experimental delivery

Authorized 10 November 2026: implement recommendation one from the 0.6 review,
using Luna implementation and Terra review, at most three review rounds per
increment. This plan supersedes the execution slices in
[the earlier draft](2026-11-10-experimental-mode.md); current feature specs win.

## Acceptance

- A fresh device shows and flies the fitted Wasp. The Hangar alone chooses the
  active ship, and title and every launch use that ship and its kept fitting.
- Schema-defined catalog classes and Experimental state have one shared owner;
  existing v3 fittings migrate, corrupt values recover independently, and
  failed storage leaves usable in-memory play with truthful status.
- Off locks experimental catalog choices. Turning Off preserves fitted content
  and blocks every launch until the setup is eligible. Queries choose nothing.
- On unlocks the catalog, marks the real screens, and makes runs unscored with
  no submission. Off Survival is ranked from either launch source.
- Keyboard, pointer and iPad landscape touch remain usable. Required engines,
  paired mounts and per-ship flight options retain their contracts.
- Shared markers appear in the Lab. Wording is a live proposal for designer
  review; design acceptance is not inferred from automated correctness.

## Increments and review

1. Luna: catalog schema/classes, shared stored setup and setting, v3 migration
   and focused recovery tests. Terra reviews; Luna repairs findings.
2. Luna: Hangar/title/flight integration, gates and frozen run eligibility,
   score suppression, relevant browser regressions. Terra reviews and repairs.
3. Luna: shared marker and real-screen wording prototype, Lab demonstration,
   final integration and spec checkbox evidence. Terra reviews and repairs.

Parent coordinates each increment, inspects the result, and owns final checks.
Review is bounded to three rounds per increment; unresolved findings are reported
rather than hidden. No concurrent verification against changing source.

## Boundaries

No renderer edits, dependencies, physics tuning, release, push or publication.
Saved-score format and Firestore changes remain the next separate work item;
existing validation stays in force. Do not claim Experimental E10 complete while
its schema/rules requirement is outstanding. Do not claim wording E11 accepted.
Existing unrelated checkout changes are preserved; no whole-tree commit is planned.

## Verification

Focused schema/storage units, browser checks of active ship, reload, query,
experimental gating/recovery, actual launches and score suppression. Inspect
real title/Hangar/flight at desktop and iPad landscape, Lab at 1280px or wider.
Then run the recorded quick gates, build, full browser and backend/competition
checks as warranted by changed ranking. Record failures and unavailable checks
explicitly. Full release readiness is outside this increment.

## Progress

- Increment 1: Luna implemented catalog classes and shared storage; Terra round
  1 found three catalog classification errors and loss of successfully read
  fittings when the separate setting read failed. Both were repaired, with
  catalog-schema and asymmetric-read regression coverage. Terra round 2 found
  no remaining blocking S1 issues. Luna reported 52 affected unit tests, the
  workspace TypeScript check and focused Biome checks passing.
- Increment 2: integration underway. Existing browser/review fixtures now
  choose ships through the actual chooser and explicitly enable Experimental
  for unfinished catalog entries. Backend competition adds a Scout launched
  from the Hangar to exercise the newly ranked path.
- Marker proposal: shared `PreviewMarker` reads “IN DEVELOPMENT · NO SCORE” for a run and “IN DEVELOPMENT” for an item; the proposed
  score replacement is “No score for this run.” It has a canonical example on
  `/lab/inputs`. The run-status naming study remains open at problem phase;
  neither these words nor E11 are claimed accepted.


## Integration review and final checks

- Increment 2: Terra round 1 found stale launch help and incorrect flight-action
  order. Parent inspection also caught the old title geometry assumptions and
  the score-submission type boundary. Repairs preserve the original Wasp title
  scale/trail, use production geometry for other ships, keep Top Scores on all
  Survival completions, and parse submissions through the current score schema.
- An initial browser attempt timed out because the parent's helper scoped an
  ancestor-dependent locator inside a label. The helper was repaired. These
  were failed attempts, not passes. A later six-case run passed, including real
  Experimental completion and perturbing the live setup during title launch.
- Terra round 2 found no remaining blocking issues in integration, marker or
  Lab composition. Parent inspected desktop 1440×1000 and iPad landscape
  1180×820 title/Hangar captures with no page errors. A settled reload check
  confirmed that an Off experimental active ship remains selected and disabled.
- A separate iPad landscape touch check passed: choose Scout, fit Heavy Potential
  Well in View, launch Practice, abort, and retain the fitting and view state.
- The shared marker and disabled Toggle composition are demonstrated on
  `/lab/inputs`; the naming study remains open. Experimental E10 remains open
  for the separate saved-score schema/rules work, and E11 for designer naming
  acceptance. No release-readiness claim follows from the focused checks.
- Final whole-checkout verification follows these changes. Its retained report
  is the authority for passed, failed and skipped gates, not the focused checks.


## Whole-checkout verification findings

The first full run is retained in
[its report](../../artifacts/verification/2026-11-10T23-13-52.547Z-8S1WyV/report.json).
Contracts, commit syntax, types, units, build, all 15 Firestore rules cases and
both competition cases passed; browser checks had 114 passes and two failures.
The full run failed, including one Markdown table-formatting failure. It also
records `sourceUnchanged: false`: concurrent Flight scene changes entered the
shared checkout during verification. It is not a stable-candidate certificate.

The two browser failures exposed a stale three-second Survival arrival test
(the current encounter is seeded within its configured window) and title panel
height growth in portrait after adding the active-ship label. Both are repaired
without changing gameplay tuning, control sizes or layout tolerances. A focused
rerun verifies the repaired paths before repeating the full gates.

The expanded three-pilot competition case took 59.8 seconds against a 60-second
per-test budget. Its budget is 120 seconds for three real flights, auth, retry
and board inspection; its assertions and actual-run requirements remain intact.
The Experimental completion case passed in 20 seconds with no score-write request.

Final verification evidence is retained under `artifacts/verification/`; the chat
handoff links the specific final report. This plan records delivered scope and
known gaps, rather than standing in for a verification report. All delivery
changes remain local working changes; no release preparation or publication is
part of this work.


The portrait repair passed 15 focused title/active-ship checks; the repaired
Survival arrival cases passed separately. Terra's third integration review
reported no blocking findings. Parent visual inspection then caught wrapping of
PRESS START in the narrow primary button beside the marker. The final composition
keeps Start full width, places the marker immediately below it, and uses compact
shared spacing tokens at narrow widths. The acceptance remains native control
size, readable text and the unchanged 16:9 region, including Experimental states.
