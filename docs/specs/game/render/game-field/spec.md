---

title: "Spec: Game field"
status: approved
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T17:23:00+02:00"
verified:
- { by: "codex/gpt-6", at: "2026-11-19T16:49:19+02:00" }
- { by: "human:ville.takanen", at: "2026-11-19T17:24:03+02:00" }

---

# Spec: Game field

## Blueprint

### Context

The game field is the visible world presented from the camera’s viewpoint:
sky, bodies, ships and effects. It brings these elements together into a
spatially coherent picture, where their position, depth, movement and light
can be understood together.

### Architecture

The field composes the scene using the rendering machinery defined in the
[Render spec](../spec.md).
It takes scene state, a [camera viewpoint](../../camera/spec.md), dimensions
and prepared materials, and composes these parts from back to front:

| Part                                 | Contents                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [Distant sky](../flight-sky/spec.md) | Background and distant landmarks.                                                                                  |
| World composition                    | Two visual layers: **World HUD** (names, orbits, gravity boundaries) and **World** (bodies, ships, solid objects). |
| Accumulated effects                  | Light showing activity over time.                                                                                  |
| Live light                           | Light and shade at the current instant.                                                                            |

World HUD retains its specified screen-space legibility; bodies cover orbit,
gravity and leader lines beneath them. Render defines the detailed drawing order.
Controls and cockpit instruments are outside the field, even when overlaid.

### Constraints

- Parts share one scene and viewpoint.
- Composition reads scene state without changing it.

## Contract

### Definition of Done

- The ordered composition presents one coherent picture, with distinct World
  HUD and World layers and spatially aligned objects and effects.

### Regression guardrails

- The picture is independent of the surrounding page background.
- Camera and dimension changes preserve feature appearance and HUD legibility.

### Scenarios

```gherkin
Scenario: Compose the scene
  Given a scene with sky, bodies, World HUD and effects
  When the field renders
  Then the sky covers the field behind the world
  And bodies cover orbit, gravity and leader lines beneath them
  And accumulated effects and live light complete the picture
  And scene state remains unchanged

Scenario: Change the view
  Given a composed field
  When the camera moves, zoom changes or the field resizes
  Then objects and their effects remain aligned and World HUD remains legible
  And the sky covers the field with its specified depth behaviour

Scenario: Isolate the composition
  Given identical fields over different page backgrounds
  When they render
  Then their pictures match
```
