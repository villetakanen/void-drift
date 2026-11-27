---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-27T08:22:58Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-27T06:17:47Z"
---

# Fission engine

## Context

A pilot fitting Fission trades smooth thrust for committed kicks and dangerous exhaust.

## Blueprint

One paid ignition both kicks the carrier and launches exhaust from each firing nozzle. A withheld ignition does neither.

### Architecture

| Owner | Responsibility |
| --- | --- |
| [Loadout catalogue and fitted stats](../../../../packages/mode-a/src/lib/schemas/loadout.ts) | `fusion` is the saved part ID. The catalogue owns mass, ceiling contribution and ignition settings; [Parts](../parts/spec.md) shows energy per ignition. [`ENGINE_ART.fusion`](../../../../packages/mode-a/src/lib/engine-art.ts#L626) defines the body. Under [Playground rules](../experimental/spec.md), the fitting flies unscored with Playground on and stays fitted but blocks launch with Playground off. |
| [Build flight](../../../../packages/mode-a/src/lib/build-flight.ts) | Keyboard and landscape touch route through the same [ship controls](../ships/spec.md). Each firing nozzle supplies a fixed impulse: fitted mass determines velocity gain, and mount angle and lever determine side thrust and spin within the turn limit. The structural ceiling limits the combined push, not each nozzle separately. |
| [Fixed-tick simulation](../../../../packages/mode-a/src/lib/simulation.ts) | The simulation checks ignition only on the first substep of each tick. All Fission nozzles commanded together by one linked drive wait until every one is ready and the whole group is affordable. Life support and working continuous loads, including stabilizers, take priority over ignition; weapons draw afterward. Each paid nozzle supplies its tick and world pose to contact and rendering. |
| Simulation contact | Each fired nozzle launches two thin fronts across its exhaust fan at nominal spark-tip speed and reach. Each front sweeps moving bodies, including fast crossings and body extent at fan edges, and hits each eligible body at most once. Destroyed bodies are ineligible. Neither radiation nor painted forks determine damage. |
| [Fitted outlets](../../../../packages/mode-a/src/lib/build-renderer.ts#L725) and [flight passes](../../../../packages/mode-a/src/lib/flight-frame.ts#L148) | At the ignition pose a white aft flash softens without lighting hull outside its cone. A narrow white lance lengthens and thins; pale tips fork into unequal branches. Fading green tracks stay at emission coordinates on FX; live tips and flash draw on LFX. |

The [render model](../render/spec.md) processes elapsed emission and ageing once across skipped frames and neither on zero ticks. Effect bounds determine visibility, not carrier position. Outlets share history and budgets without per-engine canvases or per-frame pixel processing.

### Constraints

Available energy for ignition is current funded headroom: the battery after collection and load debits actually applied on the first substep, less the gross reserve for life support and working continuous loads on the remaining substeps. Later solar or gravity collection is not credited toward the purchase: the impulse can change what the ship collects, and battery capacity can limit what it keeps. An exact group price in that headroom pays in full; later collection only affects the battery when it occurs and cannot trigger another ignition check in the same tick.

In [Gauntlet](../gauntlet/spec.md), Fission is for the fitted Playground player against stock enemies. The stock NPC pilot does not support Fission fittings.

## Scenarios

```gherkin
Feature: Fission engine

  Scenario: Linked pair waits for recovery
    Given a held drive commands two Fission nozzles and can afford both
    When one is ready but the other is recovering
    Then neither fires and no ignition energy is spent
    When both are ready and their combined push fits below the ceiling
    Then both fire together

  Scenario: Linked pair waits for payment
    Given a held drive commands two ready Fission nozzles
    And the first-substep funded headroom can pay for one ignition but not both
    When the drive requests ignition
    Then neither fires and no ignition energy is spent
    When the held drive is checked on a tick with exactly the group price in funded headroom
    Then both fire immediately
    And normal depletion rules apply if the battery empties

  Scenario: Collection beyond the ignition check cannot fund the kick
    Given a ready drive at the edge of a collection field
    And its first-substep funded headroom is below the ignition price
    When later collection would cover the difference if the ship stayed in the field
    Then the drive does not ignite this tick

  Scenario: Ignition takes priority over a ready weapon
    Given a ready commanded drive and a ready weapon with a valid shot
    And either action is affordable but the weapon would be below its firing threshold after ignition
    When the tick resolves both requests without later collection restoring enough energy to fire
    Then the drive ignites and the weapon does not fire

  Scenario: Final partial kick
    Given only part of the group's combined push fits below the structural ceiling
    When the group ignites
    Then the push reaches the ceiling without exceeding it
    And each nozzle pays its full price and emits its full blast

  Scenario: Steering at or above the ceiling
    Given a ready drive at or above its ceiling
    When its kick cannot contribute without increasing speed
    Then the kick is withheld without payment or blast
    When its kick would redirect or brake without increasing resultant speed
    Then it may ignite without clipping away existing coasting speed

  Scenario: Release during recovery
    Given a commanded nozzle ignites as soon as it is ready and funded
    When the pilot releases and presses again during recovery
    Then the completed kick remains and recovery is not shortened
    And the held command repeats when the nozzle is ready and funded again

  Scenario: Automatic braking does not trigger ignition
    Given a linked Fission drive is ready and fully funded
    When the pilot releases the drive command and automatic braking engages
    Then no nozzle ignites and no ignition energy is spent

  Scenario: Two fronts cross a target
    Given a nozzle ignites with weapons off and the carrier moves away
    When the first front launches at ignition and the second on the following tick
    Then both travel from the recorded ignition pose
    And a hostile craft surviving both crossings takes one hit per front attributed to the carrier
    And counter-sparks travel from each contact toward the nozzle while the green residue is harmless

  Scenario: Protected and offscreen bodies
    Given exhaust crosses the carrier, friendly or recoverable drones and an intact damageable derelict
    When the blast is offscreen or its marks are dropped
    Then the carrier and those drones take no exhaust damage
    And the derelict takes the same front damage as if the blast were drawn
```
