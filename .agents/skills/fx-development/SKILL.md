---
name: fx-development
description: Implement, tune or diagnose Void Drift game effects and their shared rendering pipeline. Use for engine light, gravity effects, trails, sparks, fire, impacts and effects performance in play or the Lab.
---
# FX development

Read the [render model](../../../docs/specs/game/render/spec.md),
[FX spec](../../../docs/specs/game/render/fx.md),
[LFX spec](../../../docs/specs/game/render/lfx.md) and
[effects spec](../../../docs/specs/factory/effects/spec.md).
Inspect the current layer configuration for blending, filters and persistence.
Use [shared-components](../shared-components/SKILL.md) for ownership and composition.

## Design through the layers

Design the source mark together with the layer that presents it. Shapes, colour,
opacity and falloff combine with accumulation, blending and filtering to make
the visible effect. The source may look different from the finished picture.

- **FX** accumulates light in world space. Overlap, shared decay, screen blending
  and the shared bloom filter shape its appearance. Inspect repeated emission
  as well as a single mark.
- **LFX** redraws current light without history. Its hard-light blend interacts
  with the colours beneath it, with no default bloom. Saturated fills alone
  do not guarantee brightness; dark source channels can darken the scene.

Choose either layer or both for the effect. Use shapes, gradients, strokes,
sprites or cached stamps as needed. Let the browser blend, scale and filter;
never loop over pixels per frame.

Existing effects offer examples, not a required recipe. When changing an
existing effect, check its specific appearance spec. Ion's accepted core,
halo and transparent end belong to one emitted mark; that treatment does not
prescribe other engines or weapons.

## Inspect in flight

Use the shared Flight scene through [lab-instruments](../lab-instruments/SKILL.md)
to inspect activation, movement, sustained emission
where relevant, and cessation at flight scale. Inspect the source separately
when diagnosing how accumulation, blending or filtering changes it.

Judge appearance in the composed scene. If an effect looks pasted on, examine
its source and layer treatment before adding detail.

## Keep history in the surface

Stamp new light into the shared persistent surface. The image holds painted
history and decays with game time. Keep emitter state and moving particle
storage bounded; do not retain individually aged trail marks for redrawing.

Paint the complete light treatment intended to accumulate. Cache repeated
source construction and precompute stable geometry. Canvas buffers and their
count remain implementation choices.

Preserve the surface lifecycle:

- Camera movement keeps painted light at its world position.
- Wrap starts emission at the new position without connecting it to old light.
- Pause adds no light and causes no decay.
- Reset clears history and pending effects.
- Seek replays painting as well as simulation state.

## Connect to the game

Use simulation state, including charge and delivered output, and actual events
to drive effects, rather than button state. Follow shared mount geometry, timing
and game time. Drawing reads state; it does not change gameplay.

Find the production owner before changing a Lab demo. Core owns reusable effects,
mode supplies gameplay meaning, and screens compose them. Studies use the shared
production frame and layers while keeping experimental recipes in study code.

Use the common surface and its source and decorative stamping allowances.
Bound storage, emission and queued work. Cull offscreen emission, avoid
backlogs, and preserve important cues when decoration is dropped.

Reuse storage. Inspect the full drawing path for costs from blur, blending
and image copies, including work performed by the browser.

## Verify behavior and performance

Check activity, placement, shared decay, pause/reset/wrap/seek behavior,
bounded work and unchanged gameplay.

For performance work, exercise the production path in the mixed-effects Lab
and in play. Use the workload and budget in the effects spec, including
sustained movement, turns, overlaps and bursts. Report browser, hardware,
backing resolution, sample duration, frame intervals, update/submission costs
and raster/compositor evidence. A frozen frame or short callback measurement
cannot establish sustained performance.

Keep automated correctness, measured performance and visual judgment separate.
Correctness checks do not establish appearance or designer acceptance.

Change shared specs only within the authorized scope. Keep experimental
choices and historical findings in the study.
