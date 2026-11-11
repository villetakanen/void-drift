# Survival

## Blueprint

### Context

Survival is the main game. The pilot arrives in a star system and stays alive
as long as they can. Energy runs down and the star is where it is collected,
but the star also pulls, burns and kills on contact. Derelicts drift through
now and then: shooting them and collecting what they release earns score and
energy, at the cost of weapon energy and the risk of a collision.

A run ends when the ship is lost. Its result is a score and the time survived.
Survival is the only mode whose runs can be ranked.

### Architecture and boundaries

- **Simulation.** `packages/mode-a/src/lib/simulation.ts` owns the run: its
  fixed step, resources, endings, time and score. Rendering and effects read
  it and change nothing.
- **Run state.** `packages/mode-a/src/lib/schemas/game-state.ts` validates the
  run's status, resources and the cause of its ending.
- **Encounters.** `SURVIVAL_ENCOUNTER` in
  `packages/mode-a/src/lib/schemas/salvage.ts` holds Survival's derelict
  arrival tuning, validated by its schema. It is runtime configuration.
- **Score.** `Simulation.survivalScore` is the one score formula. Its terms and
  point values are runtime configuration in code, not part of this contract.
- **Neighbours.**
  - The [game contract](../spec.md) owns launch, return, ranking and
    submission.
  - [Ships](../ships/spec.md) and [parts](../parts/spec.md) own energy, flight
    and weapons.
  - The [star](../world/star/spec.md), [gravity](../world/gravity-field/spec.md)
    and [planets](../world/planets/spec.md) own the world.
  - The [derelict contract](../world/derelict/spec.md) owns the derelict
    itself. [Derelicts mode](../derelicts/spec.md) is a different game with
    its own arrivals.
  - The [game screen](../game-screen/spec.md) and [dialogs](../dialogs/spec.md)
    own what is shown; [Playground](../experimental/spec.md) owns when
    a run is scored.

### Rules

- **A fresh system.** Every Survival launch gets a fresh seed. The seed decides
  the system and where the ship enters it.
- **Arrival.** The ship arrives at the edge of the system, already moving
  inward at speed. The world is shown and held still for a 3, 2, 1 count, and
  GO releases play. Time, resources and score do not advance during the count;
  pause and a hidden page hold it; controls held through the count apply at
  release.
- **Two resources.** The ship has hull and energy. A run starts with both full.
  Energy follows the [ship's energy rules](../ships/spec.md).
- **Hull loss.** Hull is lost to exposure close to the star, to collisions with
  planets, and to contact with derelicts and their pieces.
- **Endings.** A run ends on contact with the star, when hull reaches zero, or
  when energy reaches zero. When more than one applies in the same step, the
  cause is the first of these in that order. The run records its cause.
- **Time.** The run's time is gameplay time: it stops while paused and when the
  run ends. A score counts whole seconds only.
- **Derelicts.** Derelicts arrive on their own throughout a run. They are
  rare and slow, not targets to practise on: the first comes early in a run at
  a seeded time, later ones come much further apart, and only one derelict is
  in play at a time, its pieces included. An arrival due while one is in play
  is skipped. Derelicts cross the system on paths that do not depend on where
  the player is or how they move, and are the same for the same seed. A run
  can be survived without touching one.
- **Score.** The simulation computes the score from what happened in the run,
  by one formula. Rendering never counts toward it. The running score shows
  during flight and the final score on run complete, as the
  [game screen](../game-screen/spec.md) and the [game contract](../spec.md)
  state.
- **Same run everywhere.** Survival is the same from the title screen and from
  the Hangar, and for every ship.

## Contract

### Definition of Done

- S1: Every Survival launch uses a fresh seed; the same seed gives the same
  system, entry and derelict arrivals.
- S2: The ship enters at the system edge moving inward at speed.
- S3: The world holds still through a 3, 2, 1 count with time, resources and
  score not advancing; pause and a hidden page hold the count; GO releases
  play with held controls applied.
- S4: A run starts with full hull and full energy for the fitted ship.
- S5: Star contact, zero hull and zero energy each end the run and record
  their cause, with star contact first and hull before energy.
- S6: Exposure near the star and collisions with planets reduce hull.
- S7: Time freezes when the run ends and starts from zero on a fresh run.
- S8: Derelict arrivals follow `SURVIVAL_ENCOUNTER`, are deterministic for a
  seed, and do not change with the player's position or motion; the first
  falls in its seeded window, every later gap is longer than that window, and
  no arrival happens while a derelict or its pieces are in play.
- S9: The score equals `Simulation.survivalScore`, is deterministic for a
  seed, and counts whole seconds only.
- S10: The running score shows during a scored run and the final score on
  run complete.

### Regression guardrails

- The simulation alone decides resources, endings, time and score; nothing
  drawn changes them.
- One score formula serves the flight screen, run complete and submission.
- Changing what scores or how much needs a decision on the `CHALLENGE` board,
  as the [game contract](../spec.md) states.
- Survival's derelict arrivals and Derelicts mode's are separate
  configurations; changing one never changes the other.
- No arrival is aimed at, or placed relative to, the player.

### Scenarios

```gherkin
Feature: Survival

  Scenario: Arriving in a system
    When I start a Survival run
    Then my ship is at the edge of a fresh system, moving inward
    And the world holds still for a count of 3, 2, 1
    And my time, resources and score do not change until GO

  Scenario Outline: A run ends
    Given a Survival run in progress
    When <event>
    Then the run ends with the cause <cause>
    And the time stops

    Examples:
      | event                    | cause |
      | my ship touches the star | STAR  |
      | my hull reaches zero     | HULL  |
      | my energy reaches zero   | POWER |

  Scenario: Collecting energy at a price
    Given my energy is low
    When I fly close to the star
    Then my ship collects energy
    And close enough to the star my hull is damaged

  Scenario: Derelicts are rare
    Given a Survival run in progress
    When a derelict or its pieces are still in play
    Then no other derelict arrives
    And the next derelict comes much later than the first did

  Scenario: Derelicts do not depend on me
    Given two Survival runs with the same seed
    When I fly them differently
    Then the same derelicts arrive at the same times on the same paths

  Scenario: Score comes from the simulation
    Given a Survival run with a known seed and inputs
    When the run is replayed
    Then the score is the same
```
