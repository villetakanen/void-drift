---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-23T13:11:45+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-23"
---

# World-body rendering

## Blueprint

### Context

Planets should read as complete, sunlit bodies as pilots pass them. A shared
composition keeps their appearance consistent between flight and inspection
without making the frame loop prepare materials or draw bodies outside the view.

### Architecture

The [planet appearance adapter](../../../../../apps/web/src/lib/assets/planet-appearances.ts)
binds prepared painters to the retained system outside the frame loop. Material
selection uses internal identity and validated appearance data; callbacks are
keyed by the body's unique positive full-system `systemPosition`. Filtering
preserves ordinals. When the roster or prepared materials change, callers bind
against the current roster. Callers release prepared painters on teardown and
dispose results that finish after teardown.

The `planets` pass draws each body's parts back to front on World. Ground has
the body's radius, a partly transparent upper surface may extend beyond it,
and haze and rims use native shapes or gradients. The [planet contract](../../world/planets/spec.md)
owns family-specific compositions. Each turning surface uses a prepared map and
its own simulation-time period. Ground samples even ticks and an upper surface
samples odd ticks; unchanged projections can be reused at repeated or paused
samples.

One prepared light-and-dark stamp per visible body turns toward the star on
LFX and covers the outermost surface. [LFX](../lfx.md) owns stamp parameters
and their preparation and reuse. The [World layer](../world.md) owns the HUD,
which draws before the planets pass and has independent visibility.

### Constraints

- Simulation bodies and painters are separate. An appearance draws from current
  geometry, star position, camera and ticks without changing simulation state.
- When material preparation is missing or fails, the regular body pass draws
  the stock fallback; physics and HUD stay available. A body without a light
  callback contributes no body-light stamp.
- Appearance bounds are finite, ordered, inclusive world coordinates for the
  complete World and optional LFX parts. The passes test each independently
  before doing surface or light work. Stock bounds include the visible outline;
  composed bounds include any visible atmosphere and strokes.
- Production uses prepared production materials, including authored surface maps,
  not study assets. The frame draws prepared maps and stamps without rebuilding
  pixel data.

## Contract

### Definition of Done

- The same body data and prepared materials select the same World and LFX
  painters in play and inspection. A material binding is independent of draw
  order, display name and filtered list index.
- Visible surfaces turn independently of the orbit and of each other, while
  the light stamp stays aligned to the star.

### Regression guardrails

- Repeating a paused tick at unchanged view and material settings reuses the
  surface projection. The same inputs at the same tick yield the same surface
  regardless of how many frames preceded it.
- The frame passes draw bodies from appearance data, not planet-specific pass IDs.

### Scenarios

```gherkin
Scenario: Independent ground and cloud motion
  Given a visible body with a partly transparent upper surface
  When simulation ticks advance
  Then the ground shows through cloud openings
  And each surface turns at its own rate while lighting stays aligned to the star

Scenario: Cull a body without hiding its orbit
  Given the complete World and light bounds of a planet are outside the view
  And its orbit crosses the view
  When the frame is drawn
  Then neither body painter runs and the orbit remains visible

Scenario: Preserve a visible edge
  Given a body's outline or atmospheric stroke touches the view
  When the frame is drawn
  Then the World body painter runs

Scenario: Material preparation fails
  Given a retained planet whose material could not be prepared
  When the shared frame draws that planet
  Then its stock body and HUD remain available and its physics are unchanged
```
