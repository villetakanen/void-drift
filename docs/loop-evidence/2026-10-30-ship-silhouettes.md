# Ship silhouettes study — loop evidence

Study closed: 2026-10-30. The original record below covers study and planning only.
The appended integration closure records the subsequent implementation and push.
Earlier conversation claims are preserved as prior-session evidence.

## Intent and decisions

The study sought three recognizable ship silhouettes through hull form, component
placement, and engine angles, first in the designer and then in flight. Detailed
part styling was outside the original scope. Source: this chat and the
[study page](../../apps/web/src/pages/lab/studies/ship-silhouettes.astro).

- 01 framing was approved. 02.1 was retained as a useful illustration of the problem;
  the user explicitly said no design decision should be based on it.
- Fighter exploration progressed through pointed forms, low-poly surfaces, clipped
  wings, cockpit treatments, and slots. Several cockpit rounds were rejected.
  The cockpit was ultimately settled as the black forward reference shape.
- The user accepted 02.9: “this is perfect. This is the design of the fighter.”
  The accepted composition is the clipped-tip Lance, black forward cockpit, enlarged
  stacked hull slots, central aft pair, and rotated side engines partly outside
  the chassis. Source: conversation; preserved in
  [FighterSlots](../../apps/web/src/components/studies/FighterSlots.astro), compact variant.
- Scout explorations used roadster, cockpit-first boat, Wasp, and classic spacecraft
  references. The user found the first Wasp arrangement better than preceding
  attempts, but rejected its coffin-like body and window. No Scout design was accepted.
- On stopping, the user said “to the point of 2.9, we got good results” and described
  the later work as a “complete loop mode.” These are the user's assessments of
  this study, not an established explanation of why the iterations failed.
- The user directed the next integration to use the Fighter and disable Scout and
  Heavy Corvette selection in the ship designer until their designs are resolved.
  Preserve the game's usable color theme. No other chassis design was accepted.
- The assistant initially interpreted “go” as implementation. The user asked why
  parts 03 and 04 were missing. Only code inspection had happened; the assistant
  then completed readiness and integration planning instead.

## Delivered local changes

The study page contains 01, exploration examples through 02.11, 03 readiness, and
04 integration planning. Its outcome notice links directly to 02.9, 03, and 04.
Metadata is closed / integration, meaning exploration is stopped and a plan is
written, not that game integration is delivered. Rejected examples are historical
material; their presence does not imply acceptance. Some superseded components
remain unused on disk, and selected earlier sheets have archive routes.

The plan identifies shared Fighter geometry, renderer/selection/plume alignment,
Fighter-only designer availability, preservation of all saved builds, theme
readability, and verification in the shared Lab builder and custom flight.

No production renderer, simulation, builder behavior, or saved-loadout contract was
changed during this loop. No local commit, push, deployment, or live release
verification was performed for this study. At closure, HEAD is
`dc2bb2ccd5f36bc662499e9a87c765c9c76f001c`; study files are uncommitted/untracked.
The separate untracked engine-effects evidence record was pre-existing and is not
part of this closure.

## Inspected findings and limits

Read-only inspection of `ShipBuilder.svelte`, `FlightDeck.svelte`,
`mode-a/lib/build-renderer.ts`, `build-flight.ts`, and `schemas/loadout.ts` found:

- Builder and custom flight share `drawBuild`; current Fighter slot counts match
  02.9. Saves store part selections by slot, rather than drawing coordinates.
- The study uses about 66.8° for side engines; current Fighter calculations use 26°.
  Drawing, exhaust, force direction, and turning geometry need alignment during
  integration. No new handling was implemented or tested.
- Current selection targets and fitting footprints differ from the study. Tight
  aft-slot selection and the larger hull need inspection at production scales.
- Custom rendering hard-codes colors; stock rendering accepts a profile tint. A
  search found no implemented team/faction system in the inspected source. Earlier
  assistant wording about “team identity” was corrected to the game's visual theme.
- Existing browser coverage expects all three chassis to be selectable; the plan
  calls for updating that contract while retaining saved-build preservation checks.

These findings establish implementation work to assess, not proof of visual
fidelity, acceptable flight feel, or completion of the original three-ship goal.

## Verification evidence

Environment: local macOS workspace, pnpm project version 0.4.0-alpha.1; development
preview at `http://localhost:4321`. Commands ran against the dirty local study tree,
not a committed study revision. Source: tool outputs in this conversation.

| Check                                                                                                              | Recorded result                | Scope / evidence                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec biome check --write apps/web/src/pages/lab/studies/ship-silhouettes.astro apps/web/src/data/studies.ts` | Passed; one file formatted     | Final 03/04 update; conversation command output                                                                                     |
| `pnpm check && pnpm build`                                                                                         | Passed, exit 0                 | Final 03/04 update; session 57489. Astro: 54 files, zero errors/warnings/hints; build: 22 pages                                     |
| Browser inspection                                                                                                 | Observed                       | IAB tab 2 accessibility tree contained 03 and 04 in full; screenshot inspected 03 heading, paragraph spacing, and readiness content |
| Full `pnpm verify`, unit, browser regression, rules, competition gates                                             | Not run for this study closure | No game implementation delivered                                                                                                    |
| Integrated Fighter visual / flight review                                                                          | Not performed                  | Study acceptance is not production acceptance                                                                                       |

Earlier exploration checks were reported as passing in the conversation, but this
record anchors its check summary to the final 03/04 run. No tests were rerun solely
for closure. The check output and screenshots are conversation evidence; no durable
standalone screenshot or full verification report was saved for the final study run.

Closure-time SHA-256 of the sorted study source paths and bytes (metadata, page,
Fighter/Scout components, silhouette comparison, archive Astro pages):
`9453f622a00e3fbeaf9197b34e03c14ab0cd9b238c45618cae206850c9e7a307`.
This is a closure snapshot, not a fingerprint captured by the test runner.

## Remaining evidence gaps

The original three-ship objective is incomplete. Scout and Heavy Corvette are
unresolved. Fighter integration, production-scale fitting and color review,
collision/visual alignment, and handling review remain outstanding. Parts 03 and
04 are written assessments and a plan; they have not received a separate explicit
user approval in this conversation. No study-quality rubric assessment or general
process lesson is inferred by this closure.

## Integration and tuning closure — 2026-10-30

### Scope and delivered revision

The owner requested implementation of the study's readiness/integration outcome.
Commit `d1484e8413f5d18093d4d8a03fb7fa5174d08001` delivers the shared Fighter
renderer, builder selection geometry, propulsion geometry, exhaust alignment,
Fighter-only designer availability, saved-build preservation, tests, specs, and
supporting study evidence. Earlier uncommitted study files were included as the
referenced design evidence. The separate engine-effects closure file is excluded.

The initial integration reproduced 02.9, including its approximately 66.8° side
angle. In subsequent flight review, the owner found that angle too wide, considered
alignment with the long hull edge, then explicitly retained the original production
26° angle. The owner next requested inward placement: side mounts moved from
(-12, ±18) to (-12, ±15), retaining size and fore–aft position. Following “it still
does not rotate fast enough?”, Fighter's direct angular response was multiplied by
2.5. The default fission build now estimates 96.6°/s turning and 339.7 units/s²
paired forward acceleration. These values describe this implementation; they are
not general design targets. See the ship-builder specification and `fighter.ts`.

The conservative 31.2-unit circular collision envelope includes the longer nose.
Study sketches retain earlier orientations as historical evidence. Earlier
comparisons that consumed live Fighter mounts now use frozen pre-integration
geometry so production changes do not alter those comparisons.

### Checks and identity

Directly inspected `artifacts/verification/latest.json` and its logs at closure.
The final `pnpm verify` ran 22:26:32–22:28:02 Europe/Helsinki on 30 October 2026,
against dirty base revision `dc2bb2ccd5f36bc662499e9a87c765c9c76f001c`.
It reported `sourceUnchanged: true` and `passed: true`. Before staging, a fresh
calculation matched its complete source fingerprint:
`4615afc6dc358c926b2fe937b45121a604a71053d93ee66b96d5dc202e9a3c2d`.
That snapshot includes the then-untracked evidence files; it is not the Git tree
hash of the implementation commit. This closure text was added afterward.

Environment: macOS arm64, Node v24.14.0, pnpm workspace 0.4.0-alpha.1, Chromium,
and the existing temporary Java 21 runtime at `/private/tmp/void-drift-java21/`.

- Passed: contracts, commit-history lint, source lint, strict types, production build.
- Passed: 55 unit tests, 11 browser tests, 9 Firestore rules tests, and the one
  two-pilot emulator competition test. Logs are under `artifacts/verification/`.
- Browser evidence covers fitting, independent aft selection, saved unavailable
  chassis, corrupt storage recovery, flight/reset/return, and stock regressions.
- Agent visual inspection covered desktop and narrow builder layouts and flight
  rendering. Captures: `artifacts/builder-desktop.png` and
  `artifacts/builder-flight.png`. These are local, ignored, overwriteable artifacts.
- Earlier runs failed: local-port restrictions blocked browser/emulator startup;
  an evidence-table formatting issue failed lint; a later run during ongoing
  edits failed the flight-tick browser assertion and competition timed out with
  missing trace artifacts. Those failures are not counted as passes. The final
  serial run above passed after the last gameplay edit.
- The first commit attempt failed the 100-character body-line limit. Wrapping the
  message resolved it; the commit-message hook passed for the delivered commit.

No game tests were rerun solely to fill historical gaps during closure. Only the
closure documentation is validated in this closing step.

### Human feedback and findings

After the initial implementation the owner said “this is really good,” then
requested the engine-angle, position, and turning changes above. After the final
tuning the owner said “good enough to kind of release for Alpha 0.2.” This records
the owner's assessment of this iteration, not a completed release or an independent
collision-fairness/performance assessment.

The owner questioned why the builder appeared under developer tooling. Direct code
inspection found `/builder` is the player route, linked from the main menu, and
`/lab/builder` composes the same component with a Lab label. The assistant had
repeatedly supplied the Lab link. Both currently include a Flight Lab header link.
The assistant proposed removing that link from the player header; no navigation
cleanup was implemented in this loop.

### Publication and remaining limits

Implementation commit `d1484e8` was pushed successfully to `origin/feat/0-4-0`
during this closure; the push output confirmed `dc2bb2c..d1484e8`. This evidence
record is a separate documentation commit. No version bump, tag, hosting deployment,
or live release verification was performed. Package version remains 0.4.0-alpha.1;
the owner's Alpha 0.2 wording is retained above without implying versioned delivery.

Scout and Heavy Corvette designs remain unresolved. Collision fairness and physical
mobile performance have no separate human acceptance evidence. Local verification
logs and images may be overwritten; their essential results and tested identity
are recorded above. No lessons, signals, skill changes, or process rules are
inferred from this closure.
