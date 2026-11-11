# Ships

## Blueprint

### Context

A ship is a hull that the player fits with [parts](../parts/spec.md). The hull
fixes what the Hangar cannot change: its shape, mass, slots, base speed and how
it turns. The fitting decides the rest. Ships differ so that choosing one is a
real choice about how to fly.

The game is in alpha and shows every ship being designed. This contract says
what a ship is. It keeps no list of ships: the catalog in code is the list, and
ships come, change and go there without changing this contract. The Wasp is the
one ship named in the game's contracts, because a new player
[starts with it](../active-ship/spec.md).

### Architecture and boundaries

- **Catalog.** `CHASSIS` in `packages/mode-a/src/lib/schemas/loadout.ts` holds
  every hull, validated by `ChassisSchema`. `SHIP_IDENTITY` in
  `packages/mode-a/src/lib/config.ts` holds each ship's names. These are the
  only definitions of which ships exist and what their values are.
- **Slots and drawing.** `buildMounts` and `drawBuild` in
  `packages/mode-a/src/lib/build-renderer.ts` give each hull its slots and its
  appearance, for the Hangar and for flight alike.
- **Derived figures.** `buildStats` in `loadout.ts` derives mass, energy
  capacity, draw, acceleration, turn rate and cruise ceiling from a hull and its
  fitting. Derived values are never stored.
- **Flight.** `packages/mode-a/src/lib/build-flight.ts` turns input into engine
  commands and energy demand for the fitted ship. Flight always flies a hull
  with a fitting.
- **Neighbours.** [Parts](../parts/spec.md) own what can be fitted and where.
  The [active ship](../active-ship/spec.md) owns which ship is flown and how it
  is kept. [Playground](../experimental/spec.md) owns which ships
  are sanctioned and what that allows. The [Hangar](../hangar/spec.md) owns choosing and fitting
  on screen. [Survival](../survival/spec.md) owns what ends a run.

### Rules

- **The hull is fixed.** A hull sets its mass, base speed, size, the number and
  slot type of its slots, its engine layout and its stabilizer arrangement. The
  player changes none of these.
- **Required engines.** Every hull has required main-engine slots that are
  always fitted, so every ship can fly. A linked pair of engines is one
  choice. Other slots may be empty.
- **One derivation.** The figures the Hangar shows and the ship that flies come
  from the same derivation of the same hull and fitting. More fitted mass means
  less acceleration and slower turning.
- **Cruise ceiling.** A ship's powered cruise ceiling is its hull base speed
  plus the contribution of every installed main engine. An installed engine
  counts whether or not it is firing, powered or commanded. Parts that are not
  engines, empty slots and stabilizers add nothing.
- **Approaching the ceiling.** Forward acceleration tapers linearly to zero at
  the ceiling, and every engine on the ship uses the same ceiling. Propulsion
  never reduces speed the ship already has: coasting and gravity can carry it
  above the ceiling, and braking and steering stay available there.
- **Energy.** Every ship stores energy, spends it on life support at a constant
  rate and collects it from the star. Engines and stabilizers draw while they
  work; weapons draw per shot. Parts can add storage or collection. Stored
  energy never exceeds the ship's capacity, and a run starts with it full.
- **Stabilizers.** Stabilizers are a ship option, not a part. They are on by
  default and the player may switch them off, except on a hull that has them
  built in, where they are always on. They draw energy in proportion to use.
- **Linked engines.** Each ship has a linked-engines choice, off by default. Off:
  aft engines fire when both inputs are held. On: aft engines fire on either
  input. No input commands no aft thrust.
- **Sanctioned or unsanctioned.** Each ship is one or the other, as
  [Playground](../experimental/spec.md) defines.

## Contract

### Definition of Done

- Every hull's values pass `ChassisSchema`, and a fitting that does not match
  its hull's slots is rejected by `LoadoutSchema`.
- The cruise ceiling is hull base speed plus every installed main engine's
  contribution; an installed engine counts while inactive, and parts that are
  not engines and stabilizers add nothing.
- Every engine on a ship accelerates toward the same ceiling.
- A ship above its ceiling keeps its speed, and can still brake and steer.
- More fitted mass lowers acceleration and turn rate.
- Flight, Hangar estimates, exhaust and collision use the same slot
  geometry for a hull.
- A hull with built-in stabilizers has them on whatever is stored; other
  hulls keep the player's choice, on by default.
- With linked engines on, every aft engine fires on either input with
  matching energy draw; with it off, on both inputs only.
- A ship cannot thrust on energy it does not have, and uses incoming charge
  while controls are held.
- The Hangar shows the cruise ceiling with its hull and engine parts, and
  each engine's contribution.

### Regression guardrails

- The catalog is the only list of ships; no contract, screen or test keeps its
  own.
- Derived figures are computed from the hull and fitting, never stored.
- Propulsion never clips existing speed, so gravity assists stay possible.
- Changing a ship's values is a catalog change; gravity and friction constants
  are not part of a ship.

### Scenarios

```gherkin
Feature: Ships

  Scenario: Installed engines set one ceiling
    Given a ship with two kinds of main engine fitted
    When its figures are derived
    Then the cruise ceiling is the hull base speed plus every engine's contribution
    And every engine accelerates toward that ceiling

  Scenario: An idle engine still counts
    Given a fitted engine that is not firing
    When another engine fires
    Then the ceiling still includes both engines

  Scenario: Gravity carries a ship past its ceiling
    Given a ship moving faster than its cruise ceiling
    When the player coasts, brakes or steers
    Then propulsion does not reduce its speed to the ceiling
    And braking and steering still work

  Scenario: Heavier fittings fly heavier
    Given a ship in the Hangar
    When the player fits a part with mass
    Then its estimated acceleration and turn rate fall
    And the ship flies with those figures

  Scenario: Built-in stabilizers stay on
    Given a hull with built-in stabilizers
    And a stored fitting that has stabilizers off
    When the fitting is loaded
    Then the stabilizers are on
```
