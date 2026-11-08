# Effects framework: triage and implementation alternatives

2026-11-03. Development/architecture investigation, not a design study.
Working tree based on `b21de8e`, with extensive pre-existing changes including the
new `FlightFx`, gravity collection and fitting artwork. Runtime and test files were
not changed by this investigation. Measurements describe this local working tree,
not a deployed release. The proposed replacement is specified in
[Arcade effects layer](../specs/factory/effects/spec.md).

## Acceptance contract for this investigation

Identify the rendering change and distinguish evidence from hypotheses; examine
engine/gravity behavior and existing tests; compare implementation alternatives;
record functional and performance requirements. Preserve the owner's priority:
fast, fun, sharp, sparkly, deliberately quirky effects. Implementation technology
can change. A complete replacement and visual acceptance are subsequent work.

## Findings

1. **The new common compositor changes every fitted ship.** FlightDeck previously
   called `simulation.plume.draw(context)` after drawing the ship. It now calls
   `FlightFx.draw`, including ships with no gravity coil. The latter uses a
   1920×1080 intermediate surface in normal play, additive blending within that
   surface and ordinary alpha compositing over the world.
2. **The existing ion painter is expensive under the new composition.** It rebuilds
   four linear gradients per world-space trail mark and uses a 9px shadow on one
   band. Our four-engine fixture retains 156 marks: 624 gradients per frame. The
   two-coil gravity overlay adds 333 radial gradients at the sampled time. Simple
   coordinate maths is not the main measured problem here.
3. **Ablation isolates an interaction, not a general failure of Canvas.** Keeping
   the intermediate layer but removing shadow blur, or keeping shadows but
   replacing additive blending with source-over, eliminates the extreme slowdown.
   Both ingredients together are the demonstrated pathological combination in this
   browser. Browser-internal implementation details were not traced.
4. **Appearance changed without repainting the engine recipe.** Marks calibrated
   for normal alpha overlap now accumulate additively. The captured new path is
   visibly brighter at overlapping jets. This is an unretuned change in rendering
   behavior; exact old pixels are not the owner's replacement requirement.
5. **Rendering stalls can slow actual game progression.** FlightDeck caps elapsed
   frame time at 0.1 seconds. A roughly 0.77-second render allows at most about
   six simulation ticks on the next callback, discarding most elapsed real time.
   The renderer also blocks timely input processing. This explains a plausible
   route from the regression to sluggish play; raising the catch-up cap would not
   fix the expensive drawing and could make responsiveness worse.
6. **Collector absence can have a separate explanation.** Builder Test flight
   sets `planets.length = 0`; collection requires a planetary influence field.
   Starter fleets also contain no gravity coils. Deposited energy, including full
   storage behavior, intentionally governs the current fade. These are distinct
   from the rendering regression; this investigation does not change their rules.
7. **Tests can freeze the wrong thing while missing the compositor.** The ion pixel
   comparison covers its isolated demo painter, not the new FlightDeck `FlightFx`
   path. Passing it cannot prove either play fidelity or performance.

Source anchors:

- `apps/web/src/components/FlightDeck.svelte`: fixed-step loop and layer order.
- `packages/mode-a/src/lib/gravity-fold-fx.ts`: intermediate surface and fold grains.
- `packages/core/src/lib/effects/engine-plume.ts`, `ion-beam.ts`: trail state/painter.
- `packages/mode-a/src/lib/simulation.ts`, `gravity-collection.ts`: output and activity.

## Local measurements

Environment: local macOS ARM64 host, Playwright Chromium headless
156.0.8078.4, software rendering path, DPR 1, 1920×1080 backing canvas displayed at
1280×720. Browser rendering behavior need not match the user's hardware-accelerated
browser. No claim of mobile performance or a deployed-game benchmark.

Single-ship fixture: real starter Fighter with two gravity coils substituted into
hull slots, four ion engines, 120 real simulation ticks, then a frozen frame at
1.5× camera scale. Forced fold opacity/direction isolates painting from collection;
the underlying test-flight fixture has no planets. Each variant draws the same
simple background, star and ship. Timings are whole draw-call submission duration,
not isolated FX duration and not a CPU+GPU completion measure. Frame intervals are
also recorded, without per-frame pixel readback. No runtime source was patched.

| Drawing path                                     | Median submission, two rounds | Observation                                |
| ------------------------------------------------ | ----------------------------- | ------------------------------------------ |
| World/ship only                                  | 0.2 ms                        | Baseline                                   |
| Previous direct engine painter                   | 1.1–1.2 ms                    | Normal alpha overlap                       |
| Current common FX, gravity disabled              | 768.6–773.6 ms                | Severe regression without gravity          |
| Current common FX, two active folds              | 778.9–780.8 ms                | Gravity is a smaller added cost            |
| Common FX, engine shadow blur disabled           | 3.3–3.4 ms                    | Additive layer retained                    |
| Common FX, addition replaced by source-over      | 5.8–5.9 ms                    | Shadow blur retained                       |
| Sharp lines drawn directly in last world pass    | 0.3 ms                        | No gradients, shadows or full-surface copy |
| Same sharp lines through intermediate FX surface | 1.2–1.3 ms                    | Separation adds cost in this fixture       |

The initial long measurement was stopped because of the slow path. The completed
comparison used two rounds of 12 measured frames after three warm-up frames per
variant; slow-path frame intervals were roughly 767–783 ms. Ablations used two
rounds of 25 measured frames after five warm-up frames. Sharp-line comparisons used
two rounds of 100 measured frames after twenty warm-up frames; p95 was 0.3–0.4 ms
for the direct version, with approximately 16.7 ms frame intervals.

A second **synthetic busy-effects fixture** repeats six four-engine plume sets
(936 live trail marks, two strokes each), adds two stations' sixteen total arc
waves, sixteen missiles' 64 total trail segments, and twelve fires' 96 total
sparks. It uses one frozen simulation's plume data replicated spatially, not six
independent simulations or complete station/missile gameplay. It measured
**0.7–0.8 ms median, 0.9–1.0 ms p95, 0.9–1.0 ms maximum** submission across two
100-frame samples. Frame intervals remained around 16.7 ms. This supports the
approach; it does not complete the sustained moving-scene or physical-device gates.

Local ignored evidence (essential results retained above):

- `artifacts/fx-triage-2026-11-03/probe.mjs`, `measurements.json`
- `artifacts/fx-triage-2026-11-03/ablation.mjs`, `ablation.json`
- `artifacts/fx-triage-2026-11-03/sharp.mjs`, `sharp.json`
- `artifacts/fx-triage-2026-11-03/busy.mjs`, `busy.json`
- Captures beside them: `direct.png`, `isolated.png`, `fold.png`,
  `direct-sharp.png`, `isolated-sharp.png`, `busy-direct-sharp.png`.

## Alternatives

| Option                                                             | What it offers                                                        | Cost/limitation                                                                                            | Assessment                                                                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Final Canvas 2D pass with lines/arcs/dots and small cached sprites | Shared top layer; saturated, sharp interference; simple bounded maths | Blends directly with the world; cannot independently post-process all FX later                             | Recommended first implementation; measured prototype has substantial headroom                                     |
| Separate Canvas 2D effects surface                                 | Independent scale, composition and optional feedback persistence      | Surface clearing/copying/compositing costs; screen-space feedback needs deliberate camera/wrap handling    | Valid if a required visual behavior earns its measured cost; do not carry old shadow-heavy marks across unchanged |
| Batched GPU renderer and optional low-resolution light target      | Many effects, palette/feedback tricks, controllable composition       | More setup, GPU resource/context lifecycle and backend complexity                                          | Escalate if the bounded 2D approach misses the agreed scene budget or desired expressive behavior                 |
| WASM/Rust for effect state, paired with one of the renderers       | A replaceable computation implementation when updates dominate        | Does not by itself remove the measured expensive drawing combination; per-mark boundary calls can add work | Profile first; consider bulk buffers if computation becomes the bottleneck                                        |

CSS composition is also an implementation option, not an exemption from measurement.
The owner permits technology iteration; no alternative is ruled out by language.
Do not build four backends now. Keep the input boundary small enough to replace one.

## Recommended structure and initial recipes

Mode A exposes read-only delivered output, transforms and events. A small effects
runtime owns bounded transient state; a renderer consumes it and paints the final
world pass. Reuse the existing game clock, camera and mount definitions. Resolve
mounts when the loadout changes rather than rebuilding them for each frame. Reuse
fixed-capacity storage; avoid a generic scene graph or per-effect framework.

The large logical overlay is the instrument: effects may interfere and saturate.
Layer order and work budgets are deliberate; the exact emergent image is not.

- Engines: a bright short core line, a narrow colored stroke, sparse sparks and
  short released segments. Strength follows delivered output. Do not stamp dozens
  of blurred complete beams simply to approximate glow.
- Gravity collectors: a few expanding broken rings or half-circle waves, drifting
  away from the active core/field direction; optional bright ticks at the ring.
  Radius, phase, offset and fade are cheap functions of age. This is a proposed
  recipe, not a prescribed contour, color or new collection rule.
- Missiles: a hot point, a short segmented trail and a bounded burst at impact.
- Fire/stations: palette-cycled dots, short strokes, rings and occasional sparks.
  Coarse stepping and additive overload may be the desirable part of the effect.

Pure phase-based waves need no particle simulation. Detached debris uses a small
bounded lifetime pool. Shared capabilities need not force every effect into the
same particle representation. Keep important activation cues when the global
budget reduces decorative work. Review overlaps in motion and at gameplay scale.

## Test changes proposed with the replacement

| Existing check                                                                                                   | Recommended treatment                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/browser/ion-effects.spec.ts`: exact production/frozen-reference PNG equality                              | Retire the equality gate. Keep optional captures and controls/lifecycle smoke checks.                                                                                              |
| `packages/core/src/lib/effects/ion-beam.test.ts`: exact rectangle/ellipse counts and shadow colors               | Remove painter recipe assertions; preserve meaningful world-heading, source identity and release/lifetime behavior.                                                                |
| `packages/mode-a/src/lib/gravity-coil.test.ts`: every frozen study face/color/order and exact drawing operations | If core artwork is changed, retire these fidelity locks. Keep fitting, schema, persistence, stats and usable mount geometry checks. Static body art is separate from transient FX. |
| `tests/browser/alpha.spec.ts`: full flight canvas screenshot                                                     | Retain captures as review evidence; remove transient painter fidelity from the gate when implementing the replacement. Preserve replay/import/death/input behavior tests.          |
| `tests/browser/local-session.spec.ts`: image changes after chassis selection                                     | Not a frozen appearance requirement; keep a meaningful control-wiring check without prescribing particular pixels.                                                                 |
| Engine, gravity-collection, replay, power, controls and lifetime tests                                           | Keep; these protect behavior rather than a specific rendering recipe.                                                                                                              |

Do not replace deleted pixel assertions with an equally rigid list of drawing calls.
Performance profiling is needed in addition to bounded-allocation/count checks.
No existing test was removed, relaxed or baseline-updated during triage.

## Verification and remaining work

- Passed: 26 unit tests across engine plume, ion painter behavior, ion output,
  ion flight and gravity collection (five files).
- Passed: landscape touch activation, simultaneous controls, cancellation and blur.
- Failed twice: standard-flight keyboard/pause browser test times out at the paused
  tick assertion. It remains a real unresolved check; the renderer continues to
  redraw frozen expensive plumes while paused, but this run does not conclusively
  establish the entire timeout cause. Do not count keyboard/pause as verified.
- Diagnostic fixtures emitted no page errors. Captures were inspected; they show
  the brighter current blend, not proof of an approved replacement appearance.
- Not run: full verification, build, backend/Firebase gates and physical-device
  performance. This is investigation/specification, not a verified gameplay patch.
- The spec skill's ASDLC article tools were unavailable; repository contracts and
  inspected runtime are the specification evidence.

Next bounded implementation: build the common cheap primitive pass, migrate engines
and collector activity to it, add the moving busy-scene diagnostic, and adjust the
identified appearance locks together with the painter change. Then verify controls,
state/lifecycle, sustained frame pacing and human play experience. Preserve current
energy/force rules. No publication or commit was made by this investigation.

## Spec review against current ASDLC guidance — 2026-11-03

Reviewed the live [The Spec](https://asdlc.io/patterns/the-spec/) and
[Living Specs](https://asdlc.io/practices/living-specs/) pages (updated 2026-10-05),
[Spec-Driven Development](https://asdlc.io/concepts/spec-driven-development/), and
[Gherkin](https://asdlc.io/concepts/gherkin/). The earlier investigation lacked the
article tools; this review accessed the official published guidance directly.

The model separates feature state from implementation tasks. The Blueprint retains
context, dependencies, contracts and architectural boundaries. The Contract defines
observable acceptance, stable invariants and behavioral scenarios. Constraints are
positive rules. Named Gherkin scenarios distinguish setup, trigger and outcome;
putting prose under a Scenarios heading alone does not provide that structure.

Applied to this feature:

| Review finding                                                           | Disposition                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent, architecture, diagnostics and migration were mixed               | Restructured the active spec into Blueprint and Contract. Current code mechanics, profiling findings and proposed migration remain in this investigation.                                                         |
| Architectural boundaries were under-specified                            | Retained gameplay/effects ownership, package dependency direction, input schemas, shared play/Lab composition and backend freedom in the spec.                                                                    |
| The global Canvas rule conflicted with owner-approved technology freedom | Updated `docs/architecture.md` with a scoped FX exception; no replacement backend is declared adopted.                                                                                                            |
| Three prose scenarios combined unrelated behaviors                       | Added named/tagged Gherkin scenarios mapped to FX-01 through FX-08, including activation, starvation/release, collector activity, pause/reset, time, transforms/wrap, replay isolation, overload and performance. |
| Appearance and automated correctness had blurred boundaries              | Human experience scenarios are tagged `@manual`; performance requires profiling. These are specifications, not newly installed executable tests.                                                                  |
| Historical rendering prescription occupied the active spec               | Moved it verbatim into `docs/archive/sfx-canvas-legacy.md`, keeping a dated deprecation and backlink.                                                                                                             |
| The spec contained one-off test-retirement instructions                  | Kept those tasks in this investigation; the spec retains the durable distinction between behavioral checks and human visual judgment.                                                                             |
| Performance wording lacked a clear acceptance interpretation             | Defined p95 FX cost below 3 ms and heavy-scene p95 frame interval at most 33.34 ms, with maxima/stalls separately reported. Desktop/mobile profiles and sustained evidence remain outstanding.                    |

The repo's established flat `docs/specs/` layout is retained. Backend comparisons
remain proposals, not ADRs for decisions that have not been made. No new process,
test runner or mandatory pixel comparison is introduced by this documentation review.

### Sustained performance procedure to implement

A proposed first acceptance run warms up for five seconds, then records at least
sixty seconds per documented desktop/mobile profile. Exercise the six-ship fixture
while moving/turning, entering/exiting collector fields, firing missiles, producing
bursts and overlapping fires. Record pause/resume/reset separately from steady play.
Report whole-frame intervals and FX update/submission costs plus browser raster/GPU
profiling; account for pipeline overlap when attributing cost. A short callback is
only one part of the evidence. Repeat significant spikes and capacity stress.

This procedure and the initial extra-entity counts are engineering proposals.
Reference hardware, browser versions and sustained-run implementation are still to
be selected; they limit a performance acceptance claim, not review of the spec.
