# Derelicts

## Blueprint

### Context

Derelicts is the mode for shooting. [Derelicts](../world/derelict/spec.md)
pour into the system fast, several at a time, with their debris, so the player
gets to shoot a great deal and to see what their weapons do. Nothing shoots
back. The only danger is the player's own flying: hitting a wreck, a piece, a
planet or the star, or running out of energy.

The situation is deliberately artificial: the derelicts are the whole point of
the mode. What the player takes from a run is the kills. The mode has no
score.

Derelicts is a mode of its own, as the [game contract](../spec.md) lists it.

### Architecture and boundaries

- **Mode.** `FlightSettingsSchema` in
  `packages/mode-a/src/lib/schemas/flight.ts` names the mode.
  `packages/mode-a/src/lib/simulation.ts` runs it.
- **Arrivals.** `ENCOUNTER` in `packages/mode-a/src/lib/schemas/salvage.ts`
  holds this mode's arrival tuning, validated by its schema and separate from
  Survival's. It is runtime configuration.
- **Screen.** `apps/web/src/components/FlightDeck.svelte` provides flight,
  pause, game over and the return.
- **Neighbours.**
  - The [derelict contract](../world/derelict/spec.md) owns what a derelict,
    a piece and an energy cell are.
  - [Parts](../parts/spec.md) own weapons.
  - [Survival](../survival/spec.md) owns the endings this mode shares.
  - The [Hangar](../hangar/spec.md) owns the launch, and the
    [active ship](../active-ship/spec.md) what is flown.
  - The [game contract](../spec.md) owns modes, return and ranking.

### Rules

- **Entry.** Derelicts starts from the Hangar and flies the active ship in its
  fitting. Every launch gets a fresh seeded system and arrives as a Survival
  run does.
- **Nothing shoots back.** Nothing in the mode attacks the player. The ship is
  lost only through its own contact with something, or by running out of
  energy.
- **Arrivals.** Derelicts arrive on their own at the system edge, often and
  fast, so that several are usually in the system at once, at a steady rate
  that does not change as the run goes on. Their paths
  are set by the seed and never depend on where the player is or how they
  move. The number present at once is limited; an arrival that finds the limit
  reached is skipped, with no backlog.
- **Flight.** Energy, hull, damage and weapons work as in any flight. There is
  no protection: the [Survival endings](../survival/spec.md) end the run.
- **No score.** The mode shows no score during flight or at game over. Game
  over states the time survived and the number of derelicts the player
  destroyed, as plain facts without points. Nothing from a run is saved,
  submitted or carried to a later run.
- **Pause and return.** Pause freezes the run; Resume continues it. Abort and
  game over return to the Hangar with the ship unchanged. There is no reset
  during a run, and a later launch starts fresh.

## Contract

### Definition of Done

- [ ] M1: The Hangar's Derelicts action flies the active ship in its fitting in
  a fresh seeded system.
- [x] M2: Derelicts arrive at the system edge under `ENCOUNTER`, independent of
  the player's position and motion and deterministic for a seed.
- [x] M3: The arrival rate does not change with elapsed time, and an arrival is
  skipped without backlog while the limit of derelicts present is reached.
- [ ] M4: Star contact, zero hull and zero energy each end the run with game
  over.
- [ ] M5: The mode shows no score in flight or at game over; game over states
  the time survived and the derelicts the player destroyed; nothing is
  submitted or stored.
- [ ] M6: Pause freezes arrivals and the run; Resume continues; Abort and game
  over return to the Hangar with the ship unchanged; no reset is offered.
- [x] M7: Changing this mode's arrival configuration leaves Survival's
  unchanged, and the reverse.

### Regression guardrails

- Derelicts stays a mode of its own, with its own arrival configuration.
- Nothing in Derelicts attacks the player.
- Derelicts has no score, and nothing in it reaches the leaderboard.
- No arrival is aimed at, or placed relative to, the player.
- A run changes nothing that outlasts it.

### Scenarios

```gherkin
Feature: Derelicts mode

  Scenario: Starting from the Hangar
    Given a fitted active ship
    When I start Derelicts from the Hangar
    Then I fly that ship in a fresh system
    And derelicts begin to arrive at the system edge

  Scenario: Arrivals do not follow me
    Given two Derelicts runs with the same seed
    When I fly them differently
    Then the same derelicts arrive at the same times on the same paths

  Scenario: The run can be lost
    Given a Derelicts run in progress
    When my hull or my energy reaches zero, or I touch the star
    Then the run ends with game over
    And it states my time and the derelicts I destroyed
    And no score is shown

  Scenario: Abort returns to the Hangar
    Given a Derelicts run in progress
    When I pause and abort
    Then I am back in the Hangar with my ship unchanged
    When I start Derelicts again
    Then the run starts fresh
```
