# Gauntlet

## Context

Gauntlet is an experimental Hangar combat entry for trying two physically
constrained opponents. This first encounter does not define a future mode or
progression.

## Contract

- Hangar launch starts a fresh run with the selected player build and exactly
  two identical hostile charcoal Scout ships, each fitted with one Ion Point
  Defence, one Light Ion Cannon and two Light Ion engines. Each pirate owns its
  identity, loadout, hull, energy, pilot, weapons and effects. All three actors
  use the shared arena, gravity and flight physics.
- The run seed selects a yellow-family star size from 36–140 u using the same
  profile as Derelicts. Its appearance, gravity, collection and danger fields
  follow that size; the World HUD shows its `G4`–`G14` denomination.
- All ships start with full normal hull and energy. Seeded, separated arrivals
  complete before any ship can fire. Each pirate independently pilots with the
  same bounded sampled commands and deterministic tie breaking, targeting the
  player.
- Existing fitted weapons can damage living ships through normal world
  obstruction and contact rules. Pirate shots can hit the other pirate, causing
  normal friendly fire. Self-targeting and damage after destruction are
  excluded. Ships use their shared collision circles, a 0.25 restitution bounce,
  and 5 hull points of contact damage each. All same-tick damage resolves before
  the encounter result, allowing mutual destruction.
- Destroying one pirate leaves the encounter running. Destroying both pirates
  gives the player victory. Player loss uses the normal failure flow. Pause
  freezes the run; return reaches the Hangar and relaunch creates fresh actors,
  weapons, AI and effect state.
- Gauntlet never scores or submits a leaderboard result. It shows the shared
  countdown in the space-purple treatment with `3`, `2`, `1`, then `FIGHT`.
- The Lab exposes the same production encounter at 1280px and wider.

## Scenarios

```gherkin
Scenario: Fresh Hangar encounter
  Given a selected player build in the Hangar
  When the player launches Gauntlet
  Then two fully fitted hostile Scouts arrive in the same system
  And all three ships remain unable to fire until both pirate arrivals complete

Scenario: Star size follows the run seed
  Given two Gauntlet runs with the same seed
  Then their star size, gravity, collection and danger fields match
  And their yellow-family profile matches Derelicts with that seed

Scenario: Combat result
  Given two pirates and the player are active in a Gauntlet encounter
  When one pirate is destroyed
  Then the other pirate continues fighting the player
  When both pirates are destroyed
  Then all same-tick damage resolves before the result is chosen
  And the player wins unless the player dies in the same tick
  And the run offers return to the Hangar without a score action
```
