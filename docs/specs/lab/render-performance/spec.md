# Render performance bench

## Context

`/lab/render-performance` is a linked Lab Tools instrument for measuring overlapping
production rendering, using [Render model](../render-model/spec.md) as its visual
reference. It targets viewports 1280px wide and up. It runs a rendering fixture,
without simulation, gravity, encounters or gameplay controls. Hi-Fi Lo-Fi light,
CSS composition and production emission budgets remain intact.

## Architecture

The bench composes `FlightLayers.svelte`: one World canvas, one FX canvas and one
LFX canvas, with the Deck represented by ordinary DOM above the canvas stack.
There is one animation clock and one production `FxSurface` for the entire scene,
including its scene-wide budget and bounded reusable history buffers. Scenario
instances hold emitter state only. Shared fixture logic in
`apps/web/src/components/lab/render-model-fixture.ts` supplies production Wasp
geometry, mounts, direction-correct plumes and horizontal ion beam drawing to
both instruments. The [render contract](../../game/render/spec.md) and
[effects contract](../../factory/effects/spec.md) own rendering semantics.

The stage and each layer's backing dimensions stay fixed at 1920×1080 times the
production layer resolution, independent of workload and device pixel ratio.
All layers use identical cell transforms. One scenario uses the workbench's
7.5× sample scale at the stage centre; 25 scenarios use a 5×5 grid at 1.5×,
with fixed cell centres. The smaller scenario scale fits five cells per axis;
the canvas resolution and CSS stage size do not change with the workload.

## Behavior

- Default workload: 25 stationary Wasps rotating at the production assembled
  ion turn rate, alternating continuous rear ion and plasma plumes, with
  direction-correct stabilizer plumes. The single scenario uses ion. Each scenario has three fixed horizontal right-pointing ion beams:
  centre, above and below the hull sweep. All begin synchronized, using the
  production 3 Hz cadence, 80 ms immediate LFX flash and persistent FX dispersal.
- World blends normally. FX uses Screen and defaults to the shared Turbulent
  bloom preset: 12 CSS px glow, 16 CSS px distortion and 90% strength. Its filter
  selector offers None, Blur 2px, Distort 2px and Turbulent Bloom. Distort uses
  the Render model's static seeded SVG turbulence/displacement treatment at
  displacement scale 2 CSS pixels. Turbulent Bloom uses the same shared filter
  definition as the Render model: preserve the source and screen an
  RGB-attenuated, statically displaced and blurred copy. Its three values are
  included in copied results; the bench has no bloom editor. LFX uses Hard
  light without a filter. FX history fades toward black with elapsed scene time,
  with no periodic cleanup or residue threshold.
- Controls are workload (1 or 25), Run, Pause, Reset, FX filter, hardware
  label and Copy results. There are no editor controls or budget overrides.
- The initial scene is painted and paused with the production FX presentation
  default. Run has one active rAF chain; repeat
  Run cannot create another. Pause freezes emission, rotation, pulse phase and
  decay. Hidden documents suspend the same clock, excluding hidden time without
  catch-up on return. Unmount cancels the loop and removes listeners.
- Reset clears history, emitter state, clock and measurements while retaining
  workload, filter and hardware label. Workload changes reset the scene and all
  measurements, retaining running state. Filter changes retain the scene and
  reset measurements. Resume and visibility return restart warm-up and rolling
  timing continuity so inactive intervals never become frame samples.

## Measurements

Visible measurements refresh at a bounded UI rate, without pixel readback or
synchronous GPU work in the measured path. The first two active seconds after
measurement reset or resumption are warm-up and are excluded. Timing uses a
rolling ten-second active-time window:

- FPS is the rate of presented-frame callbacks (`requestAnimationFrame`),
  calculated from measured callback intervals. It is not proof of GPU completion.
- Median and p95 frame intervals use the actual callback timestamps, without
  clamping slow frames. JavaScript update/drawing-submission median and p95 use
  `performance.now()` around scene update and Canvas submissions, excluding
  summary calculation. This does not include complete GPU/compositor cost.
- Attempted, accepted and dropped stamps are counted at the actual shared
  budget's `take` boundary, including reserved source/decorative allowances.
  The identity attempted = accepted + dropped holds. Totals and elapsed measured
  time accumulate only in measured active intervals, separately from rolling
  timing statistics. Limits are the unchanged production defaults.
- Copy results provides a selectable text fallback and includes workload,
  measured elapsed time, sample/window information, viewport and stage CSS size,
  every backing resolution, DPR, browser user-agent without fingerprinting,
  hardware label, blend/filter settings, timing statistics, and stamp totals.
  Geometry/environment changes restart measurement to prevent mixed summaries.
- Results explicitly require a visible ordinary browser on the target hardware.
  Automated/headless runs establish correctness only. One machine cannot
  establish a universal result. No renderer optimization is part of this bench.

## Contract

### Definition of Done

- Tools navigation and Lab index link the dedicated URL; the Lab spec links
  this living spec.
- Both workloads draw the real shared fixture using exactly three visible
  canvases, one scene surface, one clock and unchanged backing sizes.
- Shared transforms align hulls, plumes and all three beams per scenario;
  production timing and default layer presentation are preserved.
- Pause, reset, repeated Run, background suspension and unmount obey lifecycle.
- Warm-up/inactive intervals are excluded; settings changes reset measurements;
  slow callbacks remain represented and timing storage is bounded.
- Stamp reports count real accepted and rejected production budget requests,
  including saturation, without increasing limits or thinning the workload.
- Copyable results include reproducibility context and timing limitations.
- Correctness checks, visible-browser measurements and visual judgement are
  reported separately; affected shared consumers are exercised.

### Regression guardrails

- No per-cell canvases, history surfaces, frame loops or independent recipes.
- No gameplay/tuning changes, new dependencies or silent performance adaptations.
- No GPU-completion or universal performance claim from callback measurements.

### Scenarios

```gherkin
Scenario: Compare scene density
  Given the default 25-scenario workload after warm-up
  When the tester selects 1 scenario
  Then stage and backing dimensions stay unchanged
  And scene history and measurements restart using the same effect recipe

Scenario: Hold and resume a burst
  Given a running synchronized flash
  When Pause is selected or the document becomes hidden
  Then hull pose, pulse phase and history remain frozen
  When running resumes visibly
  Then time continues without an inactive interval or catch-up burst
  And warm-up excludes resumption effects from timing summaries

Scenario: Saturate the shared budget
  Given enough simultaneous stamp requests to exhaust the production allowance
  When the shared surface emits
  Then rejected requests appear in the dropped count
  And attempted equals accepted plus dropped
  And neither production limits nor the workload changes
```
