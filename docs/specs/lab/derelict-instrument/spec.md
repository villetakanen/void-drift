---
generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-24T12:31:26+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-24"
---

# Derelict instrument

## Blueprint

### Context

The Derelict page at `/lab/entities/derelict` gives developers one instrument
for inspecting the wreck and exercising its breakup. It is a Lab tool, not a
design study or a separate game mode.

### Architecture

The Derelict page hosts one instrument showing a staged encounter in the shared
flight simulation. A Wasp with a single ion point defence starts beside a
derelict; both start with zero linear velocity outside the gravity field, with thrusters
off during the encounter. The weapon fires and the simulation governs the
resulting motion, hits, breakup and ship contacts. Nothing is held in place.
The instrument uses the game's shared [derelict](../../game/world/derelict/spec.md)
behaviour and rendering, and shared [Lab](../spec.md) and
[Design system](../../factory/design-system/spec.md) components. It owns the
scenario, time control and local presentation; the game owns the behaviour.
An existing instrument may be reused if it supports this scenario.

### Constraints

- The page presents one coherent instrument view rather than separate specimens.
- Its test state stays local to the instrument.
- The Lab supports viewports at least 1280 CSS pixels wide.

## Contract

### Definition of Done

- The instrument shows one Wasp with one ion point defence firing at an intact
  derelict, both initially without linear velocity, in the shared flight simulation.
- The wreck and released pieces move freely and can interact with the weapon and
  ship according to the simulation. Destruction and energy release are visible.
- One time slider allows inspection of the encounter forward and backward; the
  same moment shows the same simulation state when revisited.
- A gauge overlaid on the view shows the derelict's remaining hull at the selected time.
- A rotational speed slider in the instrument pane sets the wreck's initial spin
  from 0 to 2 rad/s, defaulting to 0.3 rad/s, with value and units visible.
- The initial staging is identified as a test condition.

### Regression guardrails

- The instrument does not define a second breakup or collision model.
- Exercising the instrument changes neither production settings nor game results.

### Scenarios

```gherkin
Scenario: Inspect the breakup sequence
  Given a Wasp with one ion point defence and an intact derelict start without linear velocity outside the gravity field
  And the Wasp's thrusters are off
  When the weapon fires in the shared flight simulation
  Then I can observe hits, shedding, destruction and the released energy cell
  And the hull gauge shows the remaining hull at the selected time

Scenario: Observe moving pieces
  Given pieces have separated from the derelict
  When a piece moves into the Wasp or is hit by the weapon
  Then the shared flight simulation determines what happens
  And I can observe the result

Scenario: Revisit a moment
  Given the encounter has advanced past a moment in the breakup
  When I move the time slider back to that moment
  Then the scene and hull gauge show the same simulation state as before

Scenario: Change rotational speed
  Given the rotational speed is initially 0.3 rad/s
  When I change the rotational speed slider
  Then the displayed value in rad/s and the wreck's motion reflect the selected speed
  And revisiting a time shows the same state for that speed
  And the hull gauge remains visible within the flight screen below the view buttons

Scenario: Understand the test setup
  Given the instrument uses conditions specific to the test
  When I inspect the setup
  Then those conditions are identified
  And the test state remains local to the instrument
```
