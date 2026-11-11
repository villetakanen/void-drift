# Active ship

## Blueprint

### Context

The player flies one ship at a time: the active ship. It is what the title
screen shows and what every launch flies. The Hangar is where the player makes
a ship active and fits it; nothing else changes it.

A new player must be able to press Start without visiting the Hangar first. For
that reason alone the Wasp comes fitted. It is not a suggested build, and no
ship has a default fitting the player can return to.

### Architecture and boundaries

- **What it is.** The active ship is a chassis plus that chassis's fitting.
  Each chassis keeps its own fitting; switching the active ship away and back
  restores the fitting the player left on it.
- **Contract.** Loadouts are validated by `LoadoutSchema` and stored per chassis
  by `BuildStoreSchema` (`packages/mode-a/src/lib/schemas/loadout.ts`). The
  stored active chassis is part of that Zod contract, defined there before any
  consumer reads it.
- **One owner in the web app.** `apps/web/src/lib/stores/ship-setup.ts` reads and writes the
  active ship and the per-chassis fittings for the title page and the Hangar.
  `TitleScreen.svelte`, `GameWrapper.svelte`, `FlightDeck.svelte` and
  `ShipBuilder.svelte` read it; only the Hangar writes it.
- **Neighbours.** [Ships](../ships/spec.md) and [parts](../parts/spec.md) own
  what a ship and a fitting are. [Hangar](../hangar/spec.md) owns how ships are
  chosen and fitted on screen. [Playground](../experimental/spec.md) owns which
  ships and parts may be chosen and when launch is unavailable for experimental
  content. The [game contract](../spec.md) owns modes, ranking and launch
  sources. [Title screen](../landing-page/spec.md) owns how the ship is drawn.

### Rules

- **New player.** With nothing stored, the active ship is the Wasp, fitted with
  a light ion cannon, an ion point defence and one light ion engine, so that
  PRESS START flies an armed ship at once. Every other ship can fly, because its
  required engines are fitted; what else it carries is catalog data, not part of
  this contract.
- **Making a ship active.** Choosing a ship in the Hangar makes it the active
  ship at once, with no Apply or confirm step. Nothing outside the Hangar's
  chooser, including a link or a query, changes the active ship.
- **Fitting.** Changing the active ship's fitting in the Hangar changes the
  active ship at once.
- **Always flyable.** Required engines are always fitted: they can be swapped
  but never removed. Optional mounts may be empty. Every valid active ship can
  fly.
- **Every launch flies it.** PRESS START, Survival from the Hangar, Practice and
  Derelicts all fly the active ship in its fitting. Launch availability for
  experimental content follows [Playground](../experimental/spec.md).
- **Title screen.** The title screen shows the active ship in its fitting.
- **Persistence.** The active ship and every chassis's fitting are kept in this
  browser across visits. A stored value that fails its schema is replaced by
  what a new player would have for that value, and every fitting that parses is
  kept. Without browser storage the game runs in memory from the new player's
  ships, and the Hangar's save status says that choices will not be kept.
- **Stable during a run.** The active ship never changes during a run, and a
  run's ship is fixed when it starts.

## Contract

### Definition of Done

- [x] A1: `BuildStoreSchema` holds the active chassis alongside the per-chassis
  fittings; an existing `void-drift-builds-v3` store migrates with every
  fitting kept and the Wasp active.
- [x] A2: With nothing stored, the active ship is the Wasp with a light ion
  cannon, an ion point defence and one light ion engine, and every other ship
  in the catalog is flyable.
- [x] A3: Choosing a ship in the Hangar, by pointer, keyboard or touch, makes it
  active with no further action; a `chassis` query leaves the active ship
  unchanged.
- [x] A4: Returning to the title screen shows the active ship in its fitting,
  and PRESS START flies it.
- [x] A5: Survival from the Hangar, Practice and Derelicts fly the active ship
  in its fitting.
- [x] A6: Required engines cannot be removed from any ship; every stored fitting
  that parses is flyable.
- [x] A7: The active ship and each chassis's fitting survive a page reload;
  switching away and back restores a chassis's fitting.
- [x] A8: A corrupt store falls back per failed value and keeps every fitting
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
    When I choose another ship
    And return to the title screen
    Then the title screen shows that ship in its fitting
    And PRESS START flies it

  Scenario: Fittings stay with their ship
    Given I fitted one ship and then chose another
    When I choose the first ship again
    Then it has the fitting I left on it

  Scenario: Every launch flies the active ship
    Given a ship other than the Wasp is the active ship
    When I start Practice or Derelicts from the Hangar
    Then the run flies that ship in its fitting

  Scenario: Required engines stay
    Given any ship in the Hangar
    When I try to empty a required engine mount
    Then the engine can only be swapped, not removed

  Scenario: A corrupt store keeps what it can
    Given the stored active chassis is not valid
    And another ship's stored fitting is valid
    When I load the game
    Then the Wasp is the active ship
    And the other ship keeps its fitting
```
