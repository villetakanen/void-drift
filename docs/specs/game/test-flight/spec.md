# Practice

## Blueprint

### Context

Practice is the mode for flying. The player takes the ship they prepared in the
Hangar into a fixed system and simply flies it: tries manoeuvres, feels how the
fitting handles, and comes back to the Hangar knowing what to keep or change.

The ship cannot be lost. It keeps its real handling and its real physical
contact with the star and planets, but hull and energy stay full, so nothing
ends the session except the player.

Practice is a mode of its own, as the [game contract](../spec.md) lists it.

### Architecture and boundaries

- **Mode.** `FlightSettingsSchema` in
  `packages/mode-a/src/lib/schemas/flight.ts` names the mode, and still reads a
  legacy `testFlight: true` as Practice.
  `packages/mode-a/src/lib/simulation.ts` runs it.
- **Screen.** `apps/web/src/components/FlightDeck.svelte` provides flight,
  pause and the return.
- **Neighbours.** The [Hangar](../hangar/spec.md) owns the launch, and the
  [active ship](../active-ship/spec.md) what is flown.
  [Ships](../ships/spec.md) own handling and energy. The
  [game contract](../spec.md) owns modes and return.

### Rules

- **Entry.** Practice starts from the Hangar and flies the active ship in its
  fitting, with its real mass, thrust and handling.
- **A fixed system.** Every entry uses the same star-and-planet system and the
  same starting conditions. Play begins at once.
- **Real flight.** Controls, movement, gravity and contact with the star and
  planets work as in any flight. Contact never repositions the ship.
- **Nothing runs out.** Energy stays full at the ship's capacity and never
  limits an engine or a system. Hull stays full; nothing damages it.
- **Nothing ends it.** There is no failure and no game over.
- **Nothing arrives.** No derelicts or other encounters appear.
- **No score.** Practice shows no score or result, and nothing from a session
  is saved, submitted or carried over.
- **Pause and return.** Pause freezes the session; Resume continues it. Abort
  returns to the Hangar with the ship unchanged. There is no reset during a
  session, and a later entry starts fresh.

## Contract

### Definition of Done

- [ ] P1: The Hangar's Practice action flies the active ship in its fitting
  with its real mass, thrust and handling.
- [x] P2: Every entry starts in the same system with the same conditions,
  whatever the seed, and with full energy and hull.
- [ ] P3: Sustained use of engines and systems leaves energy full and never
  causes a shortage.
- [x] P4: Contact with the star and planets keeps normal motion, leaves hull
  full, ends nothing and does not reposition the ship.
- [ ] P5: No derelicts or encounters appear.
- [ ] P6: Pause freezes the session; Resume continues it; Abort returns to the
  Hangar with the ship unchanged; no reset is offered, and a later entry starts
  fresh.
- [ ] P7: Practice shows no score, offers no submission and stores nothing.

### Regression guardrails

- Practice stays a mode of its own, with its own fixed system.
- The ship in Practice has the same handling as in every other mode.
- Nothing in Practice can end the session but the player.
- Practice has no score, and nothing in it reaches the leaderboard.

### Scenarios

```gherkin
Feature: Practice

  Scenario: Try a fitting
    Given I changed a fitting in the Hangar
    When I start Practice
    Then I fly that ship with that fitting

  Scenario: The ship cannot be lost
    Given a Practice session
    When I fly into the star
    Then my hull and energy stay full
    And the session continues

  Scenario: Same place every time
    Given I aborted a Practice session
    When I start Practice again
    Then I start in the same system with the same conditions

  Scenario: Abort returns to the Hangar
    Given a Practice session
    When I pause and abort
    Then I am back in the Hangar with my ship unchanged
```
