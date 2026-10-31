# Ion engine visuals and 0.4.1 — loop evidence

Closed 2026-10-31 (Europe/Helsinki) at the owner's request. Scope: the fresh
`ion-engines-2026-10-31` study, its pivot to visuals, ion-only integration and
0.4.1 publication. This is separate from the earlier
[failed ion-stream study](2026-10-31-ion-stream-failure.md).
Sources: this conversation; the study and implementation at release commit
`a86640f9de98bf877845d636732ca0e5838f8ad4`; local verification and release artifacts
inspected during closure. No tests or production actions were repeated for closure.

## Intent, decisions and changes of direction

The original brief joined engine behavior and visual expression: precise directed
stream, decisive on/off, dependable baseline, and acceleration diminishing toward
an unresolved speed ceiling. The owner required the established ion color and
shared effects system, and said review questions belong in chat rather than in
the public study.

The narrow-plume exploration developed into a more linear beam. The owner rejected
02.2's separation of attached light from faint residual FX. In 02.3, complete beam
marks entered the shared world-space emission, drift and fade lifecycle. After
adding one aft engine and transparency toward the beam ends, the owner said
“Visuals now approved” and that the FX plane looked as imagined. Acceptance applied
to the second view, not the attached-beam comparison, and did not approve physics.

Subsequent mechanics graphs and four-Fighter replays investigated speed ceilings
and firing configurations. The owner then said “this is too complex. we are not
progressing,” requested reversal of everything after 02.3, and pivoted to visuals
only. Those mechanics sections and components were removed; no mechanics proposal
was adopted. The replacement 02.4 compared Light and Heavy ion effects.

The first size comparison used constant motion and full output. The owner reported
that the beams worked in 02.3 but no longer worked in that demo. The assistant
attributed the difference to changed mark overlap under the substituted motion
and output; this is the assistant's explanation, not a separately isolated causal
test. The comparison restored 02.3's motion/output sequence and rotation. The owner
responded “good” and requested a small color difference.

The owner approved the resulting pair and explicitly restricted integration to
ion engines. Light retains mint-cyan. Heavy uses cooler blue-cyan colored marks
and halo, a beam 1.4 times as long and 1.45 times as wide. Both retain the near-white
core, transparent tips, world-space residue and shared fade. The owner requested
parts 03/04, then implementation and publication as 0.4.1.

## Delivered implementation and scope

- Core `ion-beam.ts` contains the two visual styles and filled-mark painter.
  `EnginePlume` stores style per emitted mark, preserving identity after release
  or mount changes. Its existing default painter remains available.
- `buildPlumeEmitters` assigns styles only to `ion` and `heavy-ion`. Fusion,
  plasma and untyped legacy exhaust retain the generic painter. This integration
  changes no thrust, speed limits, mass, power, controls, gravity or friction.
- `/lab/ion-engines` uses the production painter and includes the frozen approved
  02.4 reference. The study preserves the earlier accepted 02.3 example.
  Design guidance and the ship-builder specification document the ion scope.
- Both comparison ships replay Light's output and motion to isolate appearance.
  Real fitted flight retains each engine's existing behavior; the comparison
  does not establish Heavy's handling or an engine balance decision.

The release commit also records previously uncommitted Scout, slot-language and
engine-catalog work. The [0.4.0 evidence record](2026-10-31-engine-identities.md)
states that baseline was already published from a dirty tree. During this loop,
the assistant asked about including it, then found that release record and
proceeded with the existing baseline. The owner's explicit “Include the existing
workspace changes” response arrived after deployment and confirmed that scope.
The whole 67-file commit must not be attributed solely to new ion work.

## Verification

The inspected [final report](../../artifacts/verification/latest.json) records
`pnpm verify` passing all nine stages from 19:09:20 to 19:11:02 Helsinki time:
contracts, commit checks, lint, types, unit tests, build, browser tests, Firestore
rules and competition. It records 81 unit tests and 17 browser tests in the
associated logs. Environment: Node v24.14.0, darwin/arm64; backend stages used an
existing temporary Java 21 runtime.

This run tested a dirty tree based on `1bf9908c1aa9ed7be8b3f6b2d9d90618139457ae`.
Its source fingerprint was
`16f71da4dbac39dde3bd6f66e8b1f1e938935f4c529646578557e27a4f156672`;
`sourceUnchanged` and `passed` are both true. Before deployment, a separate
fingerprint check confirmed that the committed source matched this verified tree.
Commitlint was run again after the release commit.

The new browser test compares both production canvases pixel for pixel with the
frozen reference at their initial paused frame. It does not compare the entire
animation. Unit checks cover default-painter equivalence, mixed styles, retained
world heading, residue expiry and per-mount assignment across all three chassis.
Browser inspection in this conversation showed rotation and the published effects;
that is separate from human assessment of gameplay fidelity.

Earlier attempts remain failures: a formatter discrepancy and a test-recorder
comparison of distinct gradient function objects failed the first integration
verification. They were corrected before the final passing run. Earlier study
checks encountered sandbox server-binding restrictions and missing Java on PATH;
later release checks used the available runtime and server permissions. A commit
attempt failed message line-length validation; the corrected commit passed. A
local tag created during that failed command sequence was corrected before push.
No test tolerances or visual baselines were relaxed.

## Publication states

- Local release commit: `a86640f9de98bf877845d636732ca0e5838f8ad4` on
  `feat/0-4-0`, with annotated tag `v0.4.1` resolving to it.
- Hosting deployment: the inspected [deployment log](../../artifacts/deploy-0.4.1.log)
  reports a successful Hosting-only release to `void-drift-alpha`. Firestore
  rules were not redeployed. A production-configured build preceded deployment.
- Live verification: the [release manifest](../../artifacts/release-0.4.1.json)
  records matching hashes for six live files: homepage, builder, ion Lab, study,
  version module and ion comparison module. Checks completed at 19:12:37 Helsinki
  time; this timestamp records verification completion, not the exact release instant.
  Browser checks showed version 0.4.1, rendered ion effects and loaded shared scores.
- Git publication: after the owner's subsequent “go,” the conversation's push
  output reports atomic publication of the branch and new tag to GitHub. Closure
  inspection finds `origin/feat/0-4-0` and the local tag resolving to the release
  commit. The manifest's earlier “not pushed” field predates that push and is stale;
  it is retained as historical evidence, not current Git status.

Live destinations: [game](https://void-drift-alpha.web.app/) and
[ion Lab](https://void-drift-alpha.web.app/lab/ion-engines).

## Limits and remaining unknowns

The owner approved the study visuals and authorized integration/publication.
No post-publication human gameplay assessment was supplied in this loop.
The pixel comparison establishes the initial reference frame, not all motion,
all zoom levels, physical mobile performance or every mixed-loadout appearance.
Live score reads and emulator competition passed; live score submission was not
performed during release verification. GitHub CI results were not inspected.

Verification logs, deployment logs and release manifests are ignored local
artifacts and may be overwritten or lost. Java was supplied from a temporary
path. Essential revision, fingerprint, outcomes and evidence limits are retained
here. This closure collects evidence only; it introduces no process lessons,
skill edits, new requirements or further product changes.
