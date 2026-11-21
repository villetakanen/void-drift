---
title: "Spec: Gauntlet"
status: draft
generated:
  by: "openai-codex/gpt-6-luna"
  at: "2026-11-19T21:40:00+02:00"
verified:
  - by: "openai-codex/gpt-6"
    at: "2026-11-19T17:43:55+02:00"
  - by: "openai-codex/gpt-6.1-terra"
    at: "2026-11-19T21:31:01+02:00"
  - by: "openai-codex/gpt-6"
    at: "2026-11-19T21:48:28+02:00"
---

# Gauntlet

## Blueprint

### Context

Gauntlet is an experimental Hangar combat entry and the first caller of the
shared [enemy AI](../enemy-ai/spec.md). Its seven-arrival encounter is a bounded
combat test, not a future mode or progression design.

### Architecture

Living pirate actors supply the pirate entries in [flight contacts](../render/flight-contacts/spec.md).

- `Simulation` owns the encounter clock, arrival issuance, actors, combat and
  result. The enemy AI owns objective planning and recovery; Scout-specific
  actuation remains with its implementation.
- Actor identity, allegiance, lifecycle, result and profile data are validated
  by Zod schemas in `packages/mode-a/src/lib/schemas/gauntlet.ts`.
- Shared combat uses ordinary weapons, obstruction, energy and contact rules.
  The mode remains unscored and uses the shared countdown.

### Constraints

- A Hangar launch starts a fresh encounter with the selected player build, a
  seeded yellow-family star (36–140 u), and seven hostile charcoal Scout
  arrivals using Light Ion side engines, a Plasma Rifle in the top slot and a
  Light Ion Cannon in the aft slot. All ships start with full normal hull and energy.
- The first Scout starts at the opening. Combat's first simulation tick at
  `FIGHT` is time zero; subsequent arrivals are scheduled at 10, 20, 30, 40, 50
  and 60 seconds of active simulation time. Pause freezes this clock.
- The run seed selects a yellow-family star size from 36–140 u using the same
  profile as Derelicts. Its appearance, gravity, collection and danger fields
  follow that size; the World HUD shows its `G4`–`G14` denomination. The same
  seed selects the mercurial radius and retained planets' starting orbital
  phase. Placement and removal of conflicting stock planets follow the shared
  [system contract](../world/systems/spec.md), as in Survival and Derelicts.
- Each arrival is deterministic from run seed and arrival index and enters with
  clearance from all live bodies. Issued arrivals are tracked independently of
  living enemies. Each actor has stable identity and private pilot, weapon and
  effect state, and a distinct planning slot.
- Opening weapon lock applies only to the player character (PC), and releases
  when the PC's own entry completes. An enemy with a valid firing solution may
  fire during that lock, including while approaching. Ordinary range,
  obstruction, energy and weapon-readiness rules still apply. Reinforcement
  arrival does not alter other actors' firing eligibility or existing shots.
- Clearing all living enemies before the seventh arrival does not end the run.
  After all seven have entered, destroying the final living enemy wins unless
  the player dies in that same tick. Player death ends the encounter after
  same-tick damage resolution; simultaneous final-roster clearing is mutual
  destruction. Friendly fire uses normal rules. Ship contact uses shared collision
  circles, a 0.25 restitution bounce and 5 hull points of damage to each ship.
  Self-targeting and damage after destruction are excluded.
- Relaunch creates a fresh clock, roster and combat state. Gauntlet never scores
  or submits a leaderboard result, returns to the Hangar, and shows the shared
  countdown in the space-purple treatment with `3`, `2`, `1`, then `FIGHT`.

## Contract

### Definition of Done

- A fresh launch creates seven individually identified enemies across the
  defined schedule, with deterministic cleared arrivals.
- Active simulation time pauses with the game, and roster issuance is not
  inferred from living-enemy count.
- The PC opening lock is independent of enemy firing; enemy valid shots and
  existing combat continue under ordinary rules.
- Victory, player loss and mutual destruction follow the same-tick rules above,
  including early field clearing before all arrivals.
- The seeded system, pause, countdown, Hangar return and unscored behaviour
  remain coherent with the game contracts.

### Regression guardrails

- Enemies use the [Enemy AI contract](../enemy-ai/spec.md); encounter scheduling,
  actor identity and victory stay owned by Gauntlet.
- Weapons, friendly fire, contact, obstruction and damage resolution use shared
  production systems.
- Every relaunch resets all encounter state and reproduces arrivals for the
  same seed.
- Gauntlet remains unranked and does not alter Survival scoring.

### Scenarios

```gherkin
Feature: Gauntlet

  Scenario: Seven scheduled arrivals
    Given a fresh Gauntlet run at FIGHT
    When active simulation time reaches 0, 10, 20, 30, 40, 50, and 60 seconds
    Then the first Scout arrives at time zero
    And Scouts two through seven arrive at the corresponding later deadlines
    And pausing across a deadline does not advance the arrival clock

  Scenario: Deterministic arrival clearance
    Given two runs with the same seed
    When each reaches the same arrival index
    Then the arriving enemy has the same identity and entry configuration
    And it has clearance from live bodies

  Scenario: PC-only opening weapon lock
    Given the PC is completing its own entry
    And an enemy has a valid firing solution
    When the enemy is ready and has sufficient energy
    Then the enemy may fire under ordinary range and obstruction rules
    And the PC remains locked until its own entry completes
    When the PC completes its own entry
    Then it may fire under the ordinary weapon rules

  Scenario: Reinforcement during combat
    Given existing actors are exchanging fire
    When a reinforcement arrives
    Then their firing eligibility and emitted projectiles continue unchanged

  Scenario: Clearing before the final arrival
    Given all currently living enemies are destroyed before arrival seven
    When the next scheduled arrival is due
    Then the encounter continues and issues that arrival

  Scenario: Final encounter outcomes
    Given all seven enemies have entered
    When the last living enemy is destroyed
    Then the player wins unless the player dies in the same tick
    And simultaneous player death and final enemy destruction is mutual

  Scenario: Player loss before the final arrival
    Given fewer than seven enemies have entered
    When the player dies
    Then same-tick damage resolves and the encounter ends in player loss

  Scenario: Fresh unscored relaunch
    Given a Gauntlet encounter ended
    When the player returns to the Hangar and launches again with the same seed
    Then the clock, roster and combat state are fresh
    And the arrival sequence is deterministic
    And no score is shown or submitted
```
