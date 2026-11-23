---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-23T13:11:45+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-23"
---

# Render

## Blueprint

### Context

Flight should look rich without making every effect expensive to draw. The game
uses the browser like a demo uses its hardware: simple marks become expressive
through native blending, scaling and filters. Pixelation, banding and hard
blends can give the picture character rather than being defects to smooth away.
Sharing this model lets the Lab reproduce the look and cost of play.

### Architecture

[Flight frame](../../../../packages/mode-a/src/lib/flight-frame.ts) declares the
canvas layers (`FLIGHT_LAYERS`) and ordered passes (`FLIGHT_PASSES`). Each pass
names its layer and draws either in world units under the [camera](../camera/spec.md)
transform or in logical stage pixels without it. The [game screen](../game-screen/spec.md)
fits the stage to browser CSS pixels. Backing resolution is a layer setting,
independent of pass coordinates.

FlightDeck draws through the [shared game field](game-field/spec.md), which
selects the background policy before dispatching passes. With a prepared sky,
World clears to transparency and the stock void and starfield passes are skipped.
The Lab can select, time or substitute passes without changing production defaults.

The flight stage isolates the composition from the page behind it:

| Bottom to top | Contents | Default blend |
| --- | --- | --- |
| [Distant sky](flight-sky/spec.md) | Prepared background | normal |
| [World](world.md) | Solids and World HUD | normal |
| [FX](fx.md) | Current image of accumulated light | screen |
| [FX glow](fx.md#low-res-css-glow) | Derived copy of the finished FX image | screen |
| [LFX](lfx.md) | Live light from current state | hard-light |
| [Contacts](flight-contacts/spec.md) | Screen-fixed SVG cues | normal |
| Deck | Page controls and instruments | normal |

The fixed 1/60 s simulation tick advances independently of display frames.
A frame draws current state on World and LFX; accumulated FX accounts for the
simulation interval since the previous frame. A zero-tick interval adds or ages
no simulation-driven light. View and canvas geometry can still change.
The frame's FX canvas is cleared before drawing; the history lives in the FX
presentation surface, not in the frame canvas or simulation.

### Constraints

- Game code draws shapes, images and prepared stamps; the browser composites
  layers using CSS blend, scale, filter and opacity. Pixel preparation happens
  outside the frame loop.
- All solid artwork is on World. [World-body](world-bodies/spec.md) lighting
  draws first on LFX so live beams and halos can draw over it.
- The derived glow copies the finished FX canvas after all passes, including
  aperture cuts. That is the only copy between displayed layers.
- Rendering reads simulation state. Presentation history and pass selection
  have no effect on the simulation.

## Contract

### Definition of Done

- Eligible passes draw in declared order on their declared layers and in their
  declared spaces. The browser presents the layers in stack order.
- World and live light reflect current state. Accumulated light represents the
  elapsed tick interval and holds on a stationary pause.

### Regression guardrails

- Play draws the eligible production passes without inspection filters or timing.
- Changing layer resolution does not require changing any pass.
- The same inputs give the same run whether all, some or no passes are drawn.

### Scenarios

```gherkin
Scenario: Draw a frame over the prepared sky
  Given a shared field with a prepared sky
  When the frame is drawn
  Then the stock background passes are skipped and World is transparent behind its marks
  And world passes use the camera while stage passes do not

Scenario: Present several simulation ticks
  Given three simulation ticks have advanced since the previous frame
  When the frame is drawn
  Then World and live light reflect the latest tick
  And accumulated light covers all three ticks

Scenario: Present no simulation ticks
  Given no simulation tick has advanced since the previous frame
  When the frame is drawn
  Then no simulation-driven light is emitted or aged

Scenario: Inspect a subset of passes
  Given a Lab frame configured to select and observe eligible passes
  When the frame is drawn
  Then only the selected passes draw and report timings in declared order
  And the simulation is unchanged
```
