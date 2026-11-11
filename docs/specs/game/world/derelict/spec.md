# Derelict

## Blueprint

### Context

A derelict is a drifting wreck that crosses a star system. It is an
opportunity and a hazard at once: it can be shot apart, it holds energy the
pilot can collect, and it and its pieces damage a ship that touches them.

This contract says what a derelict is in any mode. When and how often
derelicts arrive belongs to the mode: [Survival](../../survival/spec.md) and
[Derelicts](../../derelicts/spec.md) each have their own arrivals.

### Architecture and boundaries

- **Simulation.** `packages/mode-a/src/lib/salvage.ts` owns derelicts, their
  pieces and energy cells: motion, contact, damage, breakup and collection.
  Their tuning and events are validated in
  `packages/mode-a/src/lib/schemas/salvage.ts`, and all values live there.
- **Shape.** `packages/mode-a/src/lib/derelict-geometry.ts` owns the wreck's
  shape and its pieces. `derelict-collision.ts` builds collision from that
  same shape, and `derelict-renderer.ts` draws it.
- **Neighbours.** [Parts](../../parts/spec.md) own how weapons fire and spend
  energy. [Gravity](../gravity-field/spec.md) owns the pull. The
  [effects contract](../../../factory/effects/spec.md) owns light and impact
  effects, which never change an outcome.

### Rules

- **One body, then pieces.** A derelict enters intact. As it takes damage it
  sheds pieces, a few at a time, and when it is destroyed the rest separate.
  Every piece exists once: nothing is duplicated at destruction.
- **Pieces are hazards.** Every piece is a physical body from the moment it is
  released. It can be shot, it damages a ship it touches, and it is consumed by
  that contact.
- **What is drawn is what collides.** A wreck and each piece collide with the
  shape that is drawn, gaps included. A wreck that has shed a piece no longer
  collides or draws there.
- **Contact.** A ship that hits a wreck takes damage once for that contact, and
  pieces born from that hit do not damage the ship again until they have
  separated from it.
- **Energy.** A derelict holds energy. Destroying it with a weapon or by
  ramming releases one energy cell. Collecting the cell adds energy up to the
  ship's capacity and consumes the cell even when the ship is full. Cells
  cannot be shot.
- **The environment gives nothing.** A derelict destroyed by the star or a
  planet, one that leaves the system, and one that expires release no cell and
  count as no kill, even after the player damaged it.
- **Gravity.** The star and planets pull derelicts, pieces and cells exactly as
  they pull a ship, whatever their kind or mass. Paths bend, and contact with
  the star or a planet destroys them.
- **System edge.** A piece that crosses the edge reappears on the opposite
  side, as a ship does, and stays until something destroys it. An intact
  derelict or a free cell that crosses the edge is gone.
- **Order within a step.** The earlier contact wins. At the same instant, the
  environment, expiry or exit wins over the player.
- **Deterministic.** Derelicts, breakup and drops follow the run's seed and
  inputs; drawing and effects change none of it.

## Contract

### Definition of Done

- D1: A derelict sheds pieces as cumulative damage passes its thresholds
  and releases the remaining pieces once at destruction, with no duplicates.
- D2: Collision for a wreck and for each piece uses the drawn shape, and a
  released piece's material is removed from the parent.
- D3: Destroying a derelict with a weapon or by ramming releases exactly one
  energy cell, even when several hits land together.
- D4: Destruction by the star or a planet, expiry and exit release no cell
  and count as no kill.
- D5: Collecting a cell adds energy up to capacity once and consumes it;
  weapons do not affect cells.
- D6: A ship takes wreck contact damage once per contact, and piece contact
  damage once with the piece consumed.
- D7: Gravity accelerates wrecks, pieces and cells as it does a ship,
  independent of kind and mass.
- D8: A piece wraps at the system edge and persists; an intact derelict and
  a free cell are removed there.
- D9: Within a step the earlier contact wins, and the environment wins a
  tie with the player.
- D10: Pause freezes derelicts, pieces, cells and their events; a fresh run
  starts with none.

### Regression guardrails

- One shape definition serves drawing and collision.
- Effects and drawing never change damage, energy, kills or motion.
- A derelict's behaviour is the same in every mode; only arrivals differ.
- The same seed and inputs give the same derelicts, breakup and drops.

### Scenarios

```gherkin
Feature: Derelict

  Scenario: A wreck comes apart under fire
    Given an intact derelict
    When my weapons damage it
    Then it sheds pieces as the damage grows
    When it is destroyed
    Then its remaining pieces separate
    And it releases one energy cell

  Scenario: The environment gives nothing
    Given a derelict I have damaged
    When it falls into the star
    Then no energy cell is released
    And it does not count as my kill

  Scenario: Pieces are dangerous
    Given a piece drifting in the system
    When my ship touches it
    Then my hull is damaged once
    And the piece is gone

  Scenario: Collecting energy
    Given a free energy cell
    When my ship touches it
    Then my energy rises, up to my ship's capacity
    And the cell is gone

  Scenario: Pieces stay in the system
    Given a piece moving toward the system edge
    When it crosses the edge
    Then it reappears on the opposite side
```
