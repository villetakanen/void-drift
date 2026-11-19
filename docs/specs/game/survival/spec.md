---
title: "Spec: Survival"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:17:46+02:00"
verified:
  - by: "codex/gpt-6"
    at: "2026-11-19T20:57:31+02:00"
---

# Spec: Survival

## Blueprint

### Context

Survival is the mode for ranked play. The pilot competes for a score under
the client's ruleset, with time alive contributing to that score. Ranking
eligibility and the Playground exception belong to the [game contract](../spec.md).

The pilot arrives in a star system and manages hull and energy. The star
provides energy, pulls the ship and can destroy it. Drifting derelicts offer
energy and scoring opportunities at the cost of weapon energy and collision
risk. A run ends when the ship is lost; its result includes the time survived
and, for a ranked run, its score.

### Architecture

[`Simulation`](../../../../packages/mode-a/src/lib/simulation.ts) advances the run
in fixed steps and calculates resources, endings, time and score. Rendering
and effects display that state without changing it. Scoring events and point
values are defined there in `survivalScore`.

Survival, Derelicts and Gauntlet use the same
[seeded solar-system generator](../../../../packages/mode-a/src/lib/solar-system.ts).
Survival's derelict arrival settings are separate from Derelicts mode's, in
[`SURVIVAL_ENCOUNTER`](../../../../packages/mode-a/src/lib/schemas/salvage.ts).

### Constraints

- **A fresh system.** Every Survival launch gets a fresh seed. The seed decides
  the yellow-family star profile, mercurial radius, retained planets' starting
  orbital phase and where the ship enters the shared default system.
- **Arrival.** The ship arrives at the edge of the system, already moving
  inward at speed. The world is shown and held still for a 3, 2, 1 count, and
  GO releases play. Time, resources and score do not advance during the count;
  pause and a hidden page hold it. Controls held through an uninterrupted
  count apply at release. The shared [screen input-clearing rules](../game-screen/spec.md)
  apply during arrival as during play; an interruption requires fresh input.
- **Two resources.** The ship has hull and energy. A run starts with both full.
  Energy follows the [ship's energy rules](../ships/spec.md).
- **Hull loss.** Hull is lost to exposure close to the star, to collisions with
  planets, and to contact with derelicts and their pieces.
- **Endings.** A run ends on contact with the star, when hull reaches zero, or
  when energy reaches zero. When more than one applies in the same step, the
  cause is the first of these in that order. The run records its cause.
- **Time.** The run's time is gameplay time: it stops while paused and when the
  run ends. Its contribution to score uses whole gameplay seconds;
  partial seconds do not count. The point rate lives in the scoring code.
- **Derelicts.** Derelicts arrive on their own throughout a run. They are
  rare and slow, not targets to practise on: the first comes early in a run at
  a seeded time, later ones come much further apart, and only one derelict is
  in play at a time, its pieces included. An arrival due while one is in play
  is skipped. Derelicts cross the system on paths that do not depend on where
  the player is or how they move, and are the same for the same seed. A run
  can be survived without touching one.
- **Score.** The simulation computes the score from what happened in the run,
  by its code-owned formula. Rendering never counts toward it. For a ranked
  run, the running score shows during flight and the final score on run
  complete, as the
  [game screen](../game-screen/spec.md) and the [game contract](../spec.md)
  state.
- **Same run everywhere.** Survival is the same from the title screen and from
  the Hangar, and for every ship.

## Contract

### Definition of Done

- S1: Every Survival launch uses a fresh seed; the same seed gives the same
  shared solar system, entry and derelict arrivals.
- S2: The ship enters at the system edge moving inward at speed.
- S3: The world holds still through a 3, 2, 1 count with time, resources and
  score not advancing; pause and a hidden page hold the count; GO releases
  play with continuously held controls applied, subject to the shared screen
  input-clearing rules.
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
  seed and inputs, and its time term counts whole gameplay seconds only.
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

  Scenario: Ranked competition
    Given Playground is Off and my fitting is eligible for ranked play
    When I launch Survival from the title screen or Hangar
    Then the run is ranked under my client's ruleset
    And its running score and final score use the code-owned scoring formula

  Scenario: Whole gameplay seconds contribute to score
    Given a ranked Survival run with no scoring events except time alive
    When gameplay advances through a partial second and then a whole second
    Then the partial second adds no time points
    And the whole second contributes the amount defined by the scoring code
    When I pause
    Then time and score stop advancing until Resume

  Scenario: Controls held until GO
    Given a Survival arrival countdown
    When I hold thrust continuously through GO without interruption
    Then the world and resources stay frozen until GO
    And that thrust applies when play begins

  Scenario: Interrupted arrival clears input
    Given I hold thrust during a Survival arrival countdown
    When the screen is paused, hidden or blocked by the aspect gate
    Then the countdown freezes and held input clears under the shared screen rules
    When the screen is available and I resume
    Then the countdown continues from its held position
    And the ship receives no thrust at GO unless I press it again

  Scenario: Score comes from the simulation
    Given a Survival run with a known seed and inputs
    When the run is replayed
    Then the score is the same
```
