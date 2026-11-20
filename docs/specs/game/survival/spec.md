---
title: "Spec: Survival"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T20:34:27+00:00"
verified:
  - by: "codex/gpt-6"
    at: "2026-11-19T20:35:41+00:00"
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
and effects display that state without changing it. The simulation exposes the total through `survivalScore`.

Survival, Derelicts and Gauntlet use the same
[seeded solar-system generator](../../../../packages/mode-a/src/lib/solar-system.ts).
Ranked Survival uses `RANKED_SURVIVAL_ENCOUNTER` and unranked Survival uses
`SURVIVAL_ENCOUNTER` from the [encounter configuration](../../../../packages/mode-a/src/lib/schemas/salvage.ts).

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
  partial seconds do not count.
- **Ranked derelicts.** The seed schedules the first arrival 5–40 gameplay
  seconds after GO and each subsequent attempt 5–40 gameplay seconds after
  the previous attempt. A living wreck, including one that has shed shards,
  occupies the single slot. Skip an occupied deadline and sample the next
  interval. Once the wreck leaves or breaks up, the next deadline can admit
  another even while shards, cells or a pirate remain. Entry paths are seeded
  independently of player movement. Unranked Survival retains its existing
  first window, longer repeat interval and salvage-group limit.
- **Ranked pirate.** The first armed [Gauntlet Scout](../gauntlet/spec.md)
  arrives exactly 45 gameplay seconds after GO. Its fitting, pilot and entry
  use the Gauntlet Scout behavior. Its death or outward crossing of the system
  boundary starts a seeded 45–60 gameplay second wait for the next Scout.
  An arriving or active Scout occupies the single pirate slot independently
  of derelicts. The run continues until the player dies.
- **Score.** Ranked Survival awards 1 point per whole gameplay second alive and
  20 per cell collected. Destroying an intact derelict earns 10, a shard earns
  2 and a pirate earns 50. Each body scores once when the player's weapon or
  ram deals the finishing damage. Hits, shard separation and destruction by
  another actor or the environment each earn zero points. For a ranked
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
- S8: Ranked derelict deadlines fall in the seeded 5–40 second window for
  both first arrival and repeats. Each deadline admits at most one living wreck.
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

  Scenario: Ranked wreck occupancy
    Given a ranked Survival run reaches GO
    When the first seeded deadline falls 5 to 40 gameplay seconds later
    Then one derelict arrives
    When another deadline falls while that wreck is alive
    Then the arrival is skipped and a fresh 5 to 40 second interval begins
    When the next deadline finds only shards, cells and a pirate
    Then one new intact derelict arrives alongside them

  Scenario: Seeded arrivals
    Given two ranked runs with the same seed
    When their players fly differently
    Then the attempted deadlines and entry paths agree
    And each run admits a wreck according to its own occupancy

  Scenario: Recurring ranked Scout
    Given a ranked Survival run has reached GO
    When 45 gameplay seconds have elapsed
    Then the first Gauntlet Scout arrives
    And no other Scout arrives while it is present
    When it dies or crosses the system boundary outward
    Then one replacement arrives 45 to 60 gameplay seconds later
    And replaying the same seed and inputs reproduces that timing

  Scenario: Ranked competition
    Given Playground is Off and my fitting is eligible for ranked play
    When I launch Survival from the title screen or Hangar
    Then the run is ranked under my client's ruleset
    And its running score and final score use the ranked Survival awards

  Scenario: Whole gameplay seconds contribute to score
    Given a ranked Survival run with no scoring events except time alive
    When gameplay advances through a partial second and then a whole second
    Then the partial second adds no time points
    And the whole second contributes 1 point
    When I pause
    Then time and score stop advancing until Resume

  Scenario Outline: Credit the finishing blow once per destroyed body
    Given I am playing ranked Survival
    When a <cause> destroys a <body>
    Then that destruction adds exactly <points> points

    Examples:
      | cause         | body     | points |
      | player weapon | derelict | 10     |
      | player ram    | shard    | 2      |
      | player weapon | pirate   | 50     |
      | pirate weapon | derelict | 0      |
      | solar impact  | pirate   | 0      |

  Scenario: Salvage outcomes add up
    Given I have survived 12 whole seconds in ranked Survival
    When my shots hit and destroy one intact derelict and two of its shards
    And I collect its cell with no other scoring events
    Then my score is 46 including zero points for hits and shard separation

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
