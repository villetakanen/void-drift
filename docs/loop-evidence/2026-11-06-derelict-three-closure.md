# Derelict three — completed visual study

Date: 2026-11-06, Europe/Helsinki. Owner instruction: “this is done, finalize 03
and 04, then close loop.” Registry: **accepted**, phase **scope**. Acceptance
covers the selected visual direction and scoped handoff, not an unselected damage
policy, completed production implementation or verified release.

## Intent and delivered scope

Carry the supplied Inkscape silhouette and colours into a monumental broken
structure containing active energy, then explore physical shards and energy release.
Size was supporting evidence, not the study's purpose. Earlier aborted studies
remain intact.

[Study and finalized readiness/scope](../../apps/web/src/pages/lab/studies/derelict-three-2026-11-06.astro).
[Study-local examples](../../apps/web/src/components/studies/derelict-three/).
[Registry](../../apps/web/src/data/studies.ts).

Owner decisions from this conversation:

- The embedded and full-window flight examples were not useful for the controlled
  design comparison. Owner: “Playtest environments can not help here.” They were
  replaced with fixed-scale, in-page visual comparisons.
- On the controlled comparison: “now this is usefull.” Above 120 units was ruled
  out, then 80/100/120 and 100/110/120 comparisons narrowed the range. Owner:
  “110 looks good. Let's use that for now”. Extent remains a working value.
- Energy ejection was preferred: “eject is better.” The initial four-part fracture
  was not convincing; the owner requested 2–8 splinters and early shedding.
- Eight-piece progressive splintering received positive feedback, with early
  shedding requested beyond the front tips.
- “B · Distributed shedding is best here”: retain tip, side and lower-end
  shedding and B's motion, not C's extra drift/spin variation.
- “expanding pulse it is”: retain the pulse at energy release, not the flash.
- The final damage experiment compared all-at-once failure at 100, staged shedding
  with release at 100, and staged shedding with release at 80. No option was
  selected before the closure request. Neither these thresholds nor five equal
  hits are production balance requirements.

The page now records finalized feasibility, four dependency-ordered implementation
slices, the flat-fill/hue-overlay art-direction boundary, collision and damage
requirements, checks and remaining decisions. The current untracked
[Derelicts mode spec](../specs/game/derelicts/spec.md) was inspected at closure;
it independently records B and eight physical pieces. Its edits were not made in
this conversation and were preserved. Mode-entry/scoring rules are outside this loop.

## Retained evidence and conditions

Fixed references use the production ship painter at viewing scale 1.60 and
110-unit derelict extent. Browser inspection used widths of at least 1280 pixels.
Shard examples use production salvage translation/lifetime with study-local
fracture partitions and release schedules; no production destruction was changed.

Durable captures:

- [100/120 range precursor](../../apps/web/public/studies/derelict-three-2026-11-06/controlled-80-100-120.png).
- [Selected shedding comparison](../../apps/web/public/studies/derelict-three-2026-11-06/selected-shedding.png): B is the middle view, early shedding at 0.70 s.
- [Selected release pulse](../../apps/web/public/studies/derelict-three-2026-11-06/selected-pulse.png): right view, 1.08 s; containment loss at 1.00 s.
- [Unselected damage alternatives](../../apps/web/public/studies/derelict-three-2026-11-06/damage-options.png): same four 20-point hits, shown at 1.33 s.

The selected visual sequence sheds at 0.25, 0.45 and 0.65 s, ejects energy at
1.00 s and emits the pulse for 0.28 s. Seed 2026, fixed heading, eight regions,
B's velocity/spin and no per-replay random variation. These are reference
conditions, not agreed damage-trigger times. Human preference establishes visual
selection; automated checks do not establish feel, difficulty or physical fidelity.

## Revision, checks and publication

Closure HEAD: `09ab3e2ea4eda4c00610c098af7cc9016e8481f0`. All study changes remain
local working changes in a shared dirty tree with pre-existing unrelated edits.
No dedicated study commit, push, deployment or live deployment verification was made.

Evidence from tool results on evolving working changes:

- Focused Biome checks passed after edits throughout the study.
- `pnpm check:types` passed after the final damage component repair. Its temporary
  log `/tmp/derelict-damage-types.log` was directly read at closure: Astro and
  Svelte reported zero errors and warnings. Earlier checks failed on a no-props
  component signature, a captured initial prop warning, and constant-branch
  comparisons; those were repaired. These checks precede closure prose edits.
- `pnpm build` passed for earlier encounter versions; it was not rerun for the
  final damage example. It is not a final-state build pass.
- Local Chromium checks on the final damage example reported repeatable seeking,
  stable pause and no horizontal overflow at 1280 × 1080. Earlier cue checks
  reported repeatable seeking and no page errors. Rendered captures were inspected
  before presenting each replacement.
- An initial restricted Chromium launch failed with host permissions; later runs
  used approved local browser execution. One scripted slider fill failed on a
  fractional step; the step was corrected and subsequent seeking checked.
- Full verification, backend checks, gameplay collision validation, sustained
  performance and physical-device flight review were not run for this study.

Ignored `artifacts/derelict-three/` captures/scripts and temporary logs are local,
mutable evidence, not immutable revision-bound verification reports. There is no
full-tree fingerprint for earlier runs. Retained public captures preserve the
selected comparisons. Closure validates changed documentation only and does not
rerun historical tests to fill these gaps.

## Closure boundary

The owner called out repeated discussion without visible exploration, including
“we are about to loop” and “?”. Later in-page examples and explicit choices are
recorded above; they do not erase those assessments. No internal model-state
cause is established here. No lessons, signals or standing process changes are
inferred or promoted by this record.

Remaining decisions: damage thresholds/policy, collision geometry, production
colour treatment under flat-fill rules, and measured multi-encounter performance.
Use owning mode reward/collection rules unless separately changed. No further
visual direction or production authorization is inferred from closing the study.
