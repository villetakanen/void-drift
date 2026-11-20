---
title: "Spec: Gauntlet bench"
status: draft
generated:
  by: "openai-codex/gpt-6-luna"
  at: "2026-11-19T21:31:01+02:00"
verified:
  - by: "openai-codex/gpt-6"
    at: "2026-11-19T13:15:02+02:00"
  - by: "openai-codex/gpt-6.1-terra"
    at: "2026-11-19T21:31:01+02:00"
---

# Spec: Gauntlet bench

## Blueprint

### Context

The Gauntlet bench at `/lab/gauntlet` lets a designer inspect and play the
production encounter through its simulation and render stack. It is a Lab
example, not the production flight shell or the contract for Gauntlet itself.
The Lab targets viewports at least 1280 CSS pixels wide.

### Architecture

The Lab registry and page mount `GauntletBench.svelte`, which creates and
advances the production `Simulation` in Gauntlet mode. The simulation owns the
seven-enemy roster, pilot plans, weapons and encounter result. The bench supplies
player thrust input, resets the encounter and presents state, including each
arrived enemy's hull, energy and objective. It renders with the production
flight layers and effects.

### Constraints

- The example uses a Scout and seed `248901`, and reset reproduces its initial
  encounter configuration.
- The bench runs the production Gauntlet simulation and does not script enemy
  flight, combat or outcomes.
- The camera frames the player and all remaining opponents together.
- The status panel identifies every arrived enemy and shows its hull, energy and
  current objective, including when pursuit changes to solar recovery.
- The bench runs only on Lab viewports at least 1280 CSS pixels wide.

## Contract

### Definition of Done

- The Lab Tools group links to `/lab/gauntlet` as a production example.
- The encounter presents the player and all arrived hostile Scouts through the
  production simulation and ordered flight render passes.
- A designer can steer left or right by keyboard or pointer controls and reset
  to a fresh initial encounter.
- Status shows encounter state, elapsed simulation time, the player's hull, and
  each arrived enemy's hull, energy and objective.
- Finishing stops simulation advancement until reset; the bench submits no
  leaderboard result.

### Regression guardrails

- Production simulation determines enemy arrival, AI, fire, damage and results.
- Destroying an enemy does not conflate its state with other actors; every
  arrived enemy remains individually inspectable.
- Reset clears simulation and flight effects before creating a fresh instance
  with the same configuration.
- Player thrust input releases on pointer release, leave or cancellation;
  keyboard input clears when the window loses focus.
- Scene and status readouts include all active actors and fit the supported
  viewport.

### Scenarios

```gherkin
Scenario: Start the Lab encounter
  Given a designer opens the Gauntlet bench at a supported viewport width
  When the bench mounts
  Then the production simulation runs the player and scheduled enemy roster
  And the flight layers render the encounter
  And status identifies every arrived enemy and its hull, energy and objective

Scenario: Inspect recovery
  Given an arrived enemy changes from pursuit to solar recovery
  When the status panel updates
  Then that enemy's displayed objective reports recovery
  And its energy value updates independently

Scenario: Steer and reset
  Given the encounter is running
  When the designer holds left or right thrust by keyboard or pointer
  Then the player receives that thrust on simulation steps
  When the designer releases the control or resets
  Then thrust is no longer applied
  And reset clears effects and starts a fresh seeded encounter

Scenario: Encounter ends
  Given the production simulation records a Gauntlet result
  When the result is displayed
  Then simulation steps stop until reset
  And no leaderboard score is submitted
```

[Lab conventions](../spec.md) · [Production Gauntlet](../../game/gauntlet/spec.md) · [Enemy AI](../../game/enemy-ai/spec.md) · [Flight render model](../../game/render/spec.md)
