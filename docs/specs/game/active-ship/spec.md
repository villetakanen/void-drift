# Active ship

## Blueprint

### Context

The player flies one ship at a time: the active ship. It is what the title
screen shows and what every launch flies. The Hangar is where the player makes
a ship active and fits it; nothing else changes it. A new player must be able to
fly at once, so a new device starts with one fitted ship.

### Architecture and boundaries

- **What it is.** The active ship is a chassis plus that chassis's fitting.
  Each chassis keeps its own fitting; switching the active ship away and back
  restores the fitting the player left on it.
- **Contract.** Loadouts are validated by `LoadoutSchema` and stored per chassis
  by `BuildStoreSchema` (`packages/mode-a/src/lib/schemas/loadout.ts`). The
  stored active chassis is part of that Zod contract, defined there before any
  consumer reads it.
- **One owner in the web app.** A single shared module reads and writes the
  active ship and the per-chassis fittings for the title page and the Hangar.
  `TitleScreen.svelte`, `GameWrapper.svelte`, `FlightDeck.svelte` and
  `ShipBuilder.svelte` read it; only the Hangar writes it.
- **Neighbours.** [Hangar](../hangar/spec.md) owns how ships are chosen and
  fitted on screen. [Experimental mode](../experimental/spec.md) owns which
  ships and parts may be chosen and when launch is unavailable for experimental
  content. The [game contract](../spec.md) owns modes, ranking and launch
  sources. [Title screen](../landing-page/spec.md) owns how the ship is drawn.

### Rules

- **New device.** The active ship is the Wasp with a light ion cannon and an ion
  point defence in its hull mounts, one light ion engine and stabilizers on
  (`starterLoadout("wasp")` in code). Every other ship starts with only its
  required engines fitted and its optional mounts empty.
- **Making a ship active.** Choosing a ship in the Hangar makes it the active
  ship at once, with no Apply or confirm step. Opening `/hangar?chassis=<id>`
  with a valid, available ship chooses it the same way; an invalid or
  unavailable id leaves the active ship unchanged.
- **Fitting.** Changing the active ship's fitting in the Hangar changes the
  active ship at once.
- **Always flyable.** Required engines are always fitted: they can be swapped
  but never removed. Optional mounts may be empty. Every valid active ship can
  fly.
- **Every launch flies it.** PRESS START, Survival from the Hangar, Practice and
  Derelicts all fly the active ship in its fitting. Launch availability for
  experimental content follows [Experimental mode](../experimental/spec.md).
- **Title screen.** The title screen shows the active ship in its fitting.
- **Persistence.** The active ship and every chassis's fitting are kept in this
  browser across visits. A missing store gives the new-device state. A stored
  value that fails its schema falls back to the new-device state for what failed
  and keeps every fitting that parses. Without browser storage the game runs on
  the new-device state in memory, and the Hangar's save status says that
  choices will not be kept.
- **Stable during a run.** The active ship never changes during a run, and a
  run's ship is fixed when it starts.

## Contract

### Definition of Done

- [ ] A1: `BuildStoreSchema` holds the active chassis alongside the per-chassis
  fittings; an existing `void-drift-builds-v3` store migrates with every
  fitting kept and the Wasp active.
- [ ] A2: A new device's active ship is the Wasp with light ion cannon, ion
  point defence, one light ion engine and stabilizers; every other chassis has
  only its required engines fitted.
- [ ] A3: Choosing a ship in the Hangar, by pointer, keyboard or a valid
  `chassis` query, makes it active with no further action; an invalid or
  unavailable query leaves the active ship unchanged.
- [ ] A4: Returning to the title screen shows the active ship in its fitting,
  and PRESS START flies it.
- [ ] A5: Survival from the Hangar, Practice and Derelicts fly the active ship
  in its fitting.
- [ ] A6: Required engines cannot be removed from any ship; every stored fitting
  that parses is flyable.
- [ ] A7: The active ship and each chassis's fitting survive a page reload;
  switching away and back restores a chassis's fitting.
- [ ] A8: A corrupt store falls back per failed value and keeps every fitting
  that parses; unavailable storage leaves the game playable in memory, and the
  Hangar's save status says choices will not be kept.

### Regression guardrails

- One module owns the active ship in the web app; no page keeps its own copy.
- The title screen and the launched run always show and fly the same ship and
  fitting.
- Making a ship active never changes another chassis's fitting.
- Storage failures never block starting, playing or finishing a run.

### Scenarios

```gherkin
Feature: Active ship

  Scenario: A new player can fly at once
    Given a device with no stored ships
    When I open the title screen
    Then the Wasp is shown with its light ion cannon, ion point defence and light ion engine
    When I press Start
    Then I fly that Wasp

  Scenario: Choosing a ship makes it active
    Given I open the Hangar
    When I choose the Scout
    And return to the title screen
    Then the title screen shows the Scout in its fitting
    And PRESS START flies the Scout

  Scenario: Fittings stay with their ship
    Given I fitted the Fighter and then chose the Wasp
    When I choose the Fighter again
    Then the Fighter has the fitting I left on it

  Scenario: Every launch flies the active ship
    Given the Scout is the active ship
    When I start Practice or Derelicts from the Hangar
    Then the run flies the Scout in its fitting

  Scenario: Required engines stay
    Given any ship in the Hangar
    When I try to empty a required engine mount
    Then the engine can only be swapped, not removed

  Scenario: A corrupt store keeps what it can
    Given the stored active chassis is not valid
    And the Scout's stored fitting is valid
    When I load the game
    Then the Wasp is the active ship
    And the Scout keeps its fitting
```

### Open decisions

- **Restoring a fitting.** Whether the player can return a ship to its
  new-device fitting from the Hangar.
