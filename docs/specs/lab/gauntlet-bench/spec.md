---

title: "Spec: Gauntlet bench"
status: draft
generated:
by: "openai-codex/gpt-6"
at: "2026-11-19T13:13:50+02:00"
verified:
- by: "openai-codex/gpt-6"
  at: "2026-11-19T13:15:02+02:00"

---

# Spec: Gauntlet bench

## Blueprint

### Context

The Gauntlet bench at `/lab/gauntlet` lets a designer play the first pirate
encounter through the production simulation and render stack. It is a Lab
example, not the production flight shell or the contract for the Gauntlet game
mode. The Lab targets viewports at least 1280 CSS pixels wide.

### Architecture

The [Lab registry](../../../../apps/web/src/data/lab-pages.ts) registers the
route in Tools, and the [page](../../../../apps/web/src/pages/lab/gauntlet.astro)
mounts the [bench](../../../../apps/web/src/components/lab/GauntletBench.svelte).
The bench creates and advances a production
[Simulation](../../../../packages/mode-a/src/lib/simulation.ts) in Gauntlet
mode. That simulation owns the player, two hostile pirate actors, their pilot
plans, weapons and encounter result. The bench supplies player thrust input,
resets the encounter, and presents its state. It draws with
[`drawFlightFrame`](../../../../packages/mode-a/src/lib/flight-frame.ts),
`FlightLayers` and production flight effects.

### Constraints

- The Lab example uses a Scout and seed `248901`, and resets to the same initial
  encounter configuration.
- Each pirate acts and is damaged independently under the production Gauntlet
  simulation rules.
- The camera frames the player and all remaining opponents together.
- The bench runs only on Lab viewports at least 1280 CSS pixels wide.

## Contract

### Definition of Done

- The Lab Tools group links to `/lab/gauntlet` as a production example.
- The encounter presents one player Scout and two hostile pirate Scouts using
  the production Gauntlet simulation and ordered flight render passes.
- A designer can steer left or right with keyboard input or the on-screen
  pointer controls, and can reset to a fresh initial encounter.
- The status panel shows encounter state, elapsed simulation time, and a
  separate hull value for the player and each pirate.

### Regression guardrails

- Both pirates pilot and fire through the production simulation; the bench does
  not script their flight or combat outcomes.
- Destroying one pirate does not destroy the other. The simulation result is
  shown when the encounter ends, and the bench stops advancing the finished
  encounter until it is reset.
- Reset clears the current encounter and its flight effects before starting a
  fresh instance with the same initial configuration.
- Player thrust input is released when its pointer control is released, left,
  or cancelled, and keyboard input is cleared when the window loses focus.
- The scene and hull readouts include the player and both pirates while all
  three are active.

### Scenarios

```gherkin
Scenario: Start the Lab encounter
  Given a designer opens the Gauntlet bench at a supported viewport width
  When the bench mounts
  Then one player Scout and two hostile pirate Scouts are running in the
    production simulation
  And the flight layers render the encounter
  And the status panel shows all three hull values

Scenario: Steer the player
  Given the encounter is running
  When the designer holds left or right thrust by keyboard or pointer
  Then the player receives the corresponding thrust input on simulation steps
  And releasing the input stops applying that thrust

Scenario: Reset the encounter
  Given the encounter has advanced or one ship has taken damage
  When the designer selects Reset encounter
  Then the current simulation and its flight effects are cleared
  And a fresh encounter begins with one player Scout and two pirate Scouts
  And the displayed hull values return to their initial values

Scenario: A pirate is destroyed
  Given both pirates are active in the encounter
  When production combat destroys one pirate
  Then the other pirate remains independently active
  And the displayed hull values reflect each ship's state

Scenario: The encounter ends
  Given the encounter is running
  When the production simulation records a Gauntlet result
  Then the result is shown in the status panel
  And simulation steps stop until the designer resets the encounter
```

[Lab conventions](../spec.md) · [Production Gauntlet bench](../../game/gauntlet/spec.md) · [Flight render model](../../game/render/spec.md)
