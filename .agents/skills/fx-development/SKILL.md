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

## Wire the real effect

- Identify its gameplay cause, source transform, attached/detached behavior and
  lifetime. Use delivered output and actual collection/events, not button state.
- Keep gameplay authoritative. Decoration consumes state and uses the game's pause,
  resume, reset and wrap lifecycle. Detached marks live in world space.
- Locate the production owner before changing a Lab demo. Core owns reusable FX;
  mode supplies game meaning; screens compose them. Share mount geometry and timing.
- Use the common scene pass and its reserved activation/decorative allowances.
  Bound storage, emission and queued work; keep important cues when decoration drops.
- Reuse storage and precompute stable geometry. Inspect the complete drawing path:
  even native Canvas operations can become costly through blur, blending or copies.

## Measure and judge separately

Exercise the production path in the mixed-effects Lab and in play. Measure sustained
movement, turns, overlaps and bursts at the workload in the spec. Record browser,
hardware, backing resolution, frame intervals, update/submission costs and raster/
compositor evidence. A single frozen frame or short callback is partial evidence.

Tests protect activation, source/coordinate meaning, lifetime, lifecycle, bounded
work and unchanged gameplay. Use captures and human play review for sparkle, colour,
interference and character. Retire obsolete painter-equality assertions when changing
their intended contract; retain the behavioral coverage they were mixed with.

Report measured performance, automated correctness and owner acceptance separately.
Update the living spec for changed contracts; keep diagnosis, competing approaches
and historical recipes in supporting documents.
