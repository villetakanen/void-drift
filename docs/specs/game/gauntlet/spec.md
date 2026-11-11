# Gauntlet

## Context

Gauntlet is an experimental Hangar combat entry for trying a single physically
constrained opponent. This first encounter does not define a future mode or
progression.

## Contract

- Hangar launch starts a fresh run with the selected player build and one hostile
  Scout fitted with one Ion Point Defence, one Light Ion Cannon and two Light
  Ion engines. Both actors use the shared arena, gravity and flight physics.
- Both ships start with full normal hull and energy. Seeded, separated arrivals
  complete before either ship can fire. The pirate pilot uses bounded sampled
  commands and deterministic tie breaking.
- Existing fitted weapons can damage the opposing living ship through normal
  world obstruction and contact rules. Self-targeting and damage after
  destruction are excluded. Ships use their shared collision circles, a 0.25
  restitution bounce, and 5 hull points of contact damage each. Both ships'
  damage resolves before the encounter result, allowing mutual destruction.
- A destroyed pirate ends the encounter with a victory result. Player loss uses
  the normal failure flow. Pause freezes the run; return reaches the Hangar and
  relaunch creates fresh actor, weapon, AI and effect state.
- Gauntlet never scores or submits a leaderboard result. It shows the shared
  countdown in the space-purple treatment with `3`, `2`, `1`, then `FIGHT`.
- The Lab exposes the same production encounter at 1280px and wider.

## Scenarios

```gherkin
Scenario: Fresh Hangar encounter
  Given a selected player build in the Hangar
  When the player launches Gauntlet
  Then one fully fitted hostile Scout arrives in the same system
  And both ships remain unable to fire until the countdown ends

Scenario: Combat result
  Given the two ships are active in a Gauntlet encounter
  When a ship is destroyed
  Then all same-tick damage resolves before the result is chosen
  And both deaths report mutual destruction
  And the run offers return to the Hangar without a score action
```
