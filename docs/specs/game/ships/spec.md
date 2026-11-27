---
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:24:07Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-27T06:24:07Z"
---

# Ships

## Context

A ship is the craft a pilot brings to a fight. Its hull gives it a recognisable shape and a layout of mounts. What the pilot fits, and where, changes how that craft moves and fights. Flying it well means learning what this particular ship can do.

## Blueprint

A ship flies with its hull’s fixed layout and the capabilities derived from its current fitting.

### Architecture

[`CHASSIS`](../../../../packages/mode-a/src/lib/schemas/loadout.ts) is the hull catalog; `ChassisSchema` validates its entries. In the same module, `LoadoutSchema` rejects incompatible fittings and `buildStats` computes ship figures from the fitting rather than storing them. [`SHIP_IDENTITY`](../../../../packages/mode-a/src/lib/config.ts) supplies the names. [Build flight](../../../../packages/mode-a/src/lib/build-flight.ts) translates control input into engine commands and energy demand.

[`buildMounts` and `drawBuild`](../../../../packages/mode-a/src/lib/build-renderer.ts) share slot geometry and appearance across Hangar and flight. Flight, estimates, exhaust and collision use the same geometry. The chassis catalog records each linked pair's schematic crossbar along ship-local +x in `slotLinkLines`, keyed by the secondary mount: every production pair has an explicit finite position, and unlinked ships have an empty map. These positions do not affect flight or saved fittings.

[Parts](../parts/spec.md) own fitting compatibility; [active ship](../active-ship/spec.md) owns selection and persistence; [Playground](../experimental/spec.md) owns sanctioning; [Hangar](../hangar/spec.md) owns fitting on screen; [Survival](../survival/spec.md) owns run endings. Engine-specific operation belongs to Parts and the [Fission engine](../fission-engine/spec.md).

### Constraints

| Subject | Rule |
| --- | --- |
| Hull and slots | The player cannot change a hull's mass, base speed, size, slots, engine layout or stabilizer arrangement. Required main-engine slots are always fitted; a linked pair is one choice. Other slots may be empty. |
| Mounts | An engine sits at its slot plus its part mount point and any hull alignment; exhaust starts at the drawn nozzle. Hulls do not maintain engine-ID alignment lists. |
| Equipment | The hull determines each equipment mount's position and whether its part draws above or beneath the hull. Hangar, Lab and flight respect that order. |
| Derived figures | Hangar and flight use the same hull and fitting derivation. More fitted mass lowers acceleration and turn rate. The derivation gives the cruise ceiling and each engine’s contribution. |
| Ceiling | Powered cruise ceiling is hull base speed plus every installed main engine's contribution, whether firing, powered or commanded. Empty slots, non-engine parts and stabilizers add nothing. |
| Propulsion | Continuous forward acceleration tapers linearly to zero at the shared ceiling. Propulsion never clips existing speed: coasting and gravity can carry a ship above the ceiling, and braking and steering remain available. Gravity and friction constants are not ship values. |
| Energy | Ships start full, store energy up to capacity, spend energy on life support at a constant rate and collect from the star. Parts can add storage or collection. Ships cannot thrust on energy they lack and can use incoming charge while controls are held. |
| Stabilizers | Optional stabilizers default to on and honor the player's saved on/off choice when a fitting loads. Built-in stabilizers stay on regardless of the stored choice. They draw in proportion to use. |
| Linked engines | For hulls with linkable aft engines, the choice is off by default. Off, aft engines are commanded by both inputs held; on, either input commands them. No input commands no aft thrust. Commanded engines still need power. |
| Stabilizer geometry | Flight and Lab use the hull’s [stabilizer mounts](../../../../packages/mode-a/src/lib/stabilizers.ts) for outlet placement and exhaust direction. Turn assistance is subject to the fitting, available energy and turn limit. |

## Scenarios

```gherkin
Feature: Ships

  Scenario: Equipment keeps its mount in flight
    Given a ship with an equipment slot fitted
    When the pilot takes that build from the Hangar into flight
    Then the part appears at the position its hull defines for that slot in both views
    And it draws on the same side of the hull artwork, above or beneath it as that mount requires

  Scenario: Installed engines set one ceiling
    Given a ship with two kinds of main engine fitted, one idle
    When its figures are derived
    Then the ceiling includes the hull base speed and both engine contributions
    And the ceiling and contributions shown in the Hangar match the build flown

  Scenario: Gravity carries a ship past its ceiling
    Given a ship moving faster than its cruise ceiling
    When the player coasts, brakes or steers
    Then propulsion does not clip its speed to the ceiling
    And braking and steering remain available

  Scenario: Heavier fittings fly heavier
    Given a ship with an empty compatible slot in the Hangar
    When the player fits a part with mass in that slot
    Then its estimated acceleration and turn rate fall
    And the ship flies with those figures

  Scenario: Built-in stabilizers stay on
    Given a hull with built-in stabilizers and a stored fitting with them off
    When the fitting is loaded
    Then the stabilizers are on

  Scenario: Stabilizers assist a turn and brake on release
    Given a hull configured for stabilizer-assisted turning and spin braking, with its stabilizers on and powered
    When the pilot commands a turn
    Then the outlets assigned to that turn fire from their hull-defined mounts to reinforce it
    When the input is released
    Then the stabilizers brake spin without reversing it

  Scenario: Linked drive commands
    Given a hull with linkable aft engines and linked engines switched on
    When either input is held
    Then aft engines are commanded subject to energy and engine readiness
    When neither input is held
    Then no aft thrust is commanded
```
