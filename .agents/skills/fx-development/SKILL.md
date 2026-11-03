---
name: fx-development
description: Implement, tune or diagnose Void Drift game effects and their shared rendering pipeline. Use for engine light, gravity effects, trails, sparks, fire, impacts and effects performance in play or the Lab.
---
# FX development

Read `docs/specs/sfx-canvas.md` for the current behavior, scene budget and acceptance
contract. Use `.agents/skills/shared-components/SKILL.md` for shared ownership and
composition. The spec owns requirements; this skill guides how to work on them.

## Treat rendering as an instrument

Cheap rendering methods supply the character: hard strokes, small sprites, palette
changes, arcs, saturation and interference. Develop the quirks through play instead
of gradually replacing them with expensive smooth light. The appearance is tunable;
a previous painter or screenshot is evidence, not a permanent recipe.

Choose technology from measurements and the desired result. Start with existing
shared primitives when suitable. A GPU/WASM/CSS alternative is useful when it solves
a demonstrated bottleneck or expressive need; a language change alone does not make
browser rasterization cheaper.

## Use the persistent light surface

The accumulated image holds visual history. Stamp only new light into the shared
scene surface; overlap adds brightness and the whole image decays with game time.
Keep emitter state and any genuinely moving particles small and bounded. Do not
reintroduce per-engine trail-mark lists with their own ages and redraw loops, or
replace the surface with a fresh drawing-order pass.

Cache a complete luminous stamp when its appearance needs repeated work. Ion's
accepted core, colour, halo and transparent end belong to the same stamp. Inspect
the preserved 02.3/02.4 references before changing that identity; an attached rod
plus faint residue was rejected. Recipes can evolve while preserving this intent.

Camera movement, pause, reset and seek belong to the surface lifecycle. Paused
frames must neither fade nor add brightness; seeking must replay painting as well
as state. The current Canvas buffers are replaceable implementation details.
Browser-transformed or tiled surfaces remain candidates to measure, not requirements.

## Wire the real effect

- Identify its gameplay cause, source transform, emission behavior and
  motion. Let the shared surface own painted-light persistence. Use delivered output and actual collection/events, not button state.
- Keep gameplay authoritative. Decoration consumes state and uses the game's pause,
  resume, reset and wrap lifecycle. Painted light stays at its world position;
  wrap stamps at the new position without joining the two locations.
- Locate the production owner before changing a Lab demo. Core owns reusable FX;
  mode supplies game meaning; screens compose them. Share mount geometry and timing.
- Use the common surface and its reserved source/decorative stamping allowances.
  Bound storage, emission and queued work; keep important cues when decoration drops.
- Reuse storage and precompute stable geometry. Inspect the complete drawing path:
  even native Canvas operations can become costly through blur, blending or copies.

## Measure and judge separately

Exercise the production path in the mixed-effects Lab and in play. Measure sustained
movement, turns, overlaps and bursts at the workload in the spec. Record browser,
hardware, backing resolution, frame intervals, update/submission costs and raster/
compositor evidence. A single frozen frame or short callback is partial evidence.

Tests protect activation, source/coordinate meaning, shared decay, lifecycle, bounded
work and unchanged gameplay. Use captures and human play review for sparkle, colour,
interference and character. Retire obsolete painter-equality assertions when changing
their intended contract; retain the behavioral coverage they were mixed with.

Report measured performance, automated correctness and owner acceptance separately.
Update the living spec for changed contracts; keep diagnosis, competing approaches
and historical recipes in supporting documents.
