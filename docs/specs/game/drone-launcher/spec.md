---
generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-26T13:43:39Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-26T13:43:39Z"
---

# Drone Launcher

## Context

A pilot can fit a Drone Launcher to send an autonomous craft after an enemy. From the carrier the pilot can follow its rail departure, unpowered coast, ion-powered pursuit and fission burst. A drone that loses its target can return its build energy to the carrier.

## Blueprint

### Architecture

The encounter owns each launched drone as a damageable body with its own identity and a link to its carrier. The drone uses [shared targeting](../targeting/spec.md) to select and switch enemies. Combat resolves blast contacts on simulation time and reports detonation and hull-hit events to the [renderer](../render/spec.md).

### Constraints

| Fitting property | Value |
| --- | --- |
| Mass | 17.5 |
| Part category | Weapon. Fits any slot that accepts weapons under the [Parts fitting rules](../parts/spec.md#architecture). |
| Availability in 0.7.x | [Playground](../spec.md) only |

The launcher enters play ready. Launch requires weapons permission, 2 energy per drone and an enemy within 250 u of the carrier.

An enemy or carrier is within pursuit range when its centre is strictly less than 500 u from the drone’s centre. Derelicts are ineligible as pursuit targets. [Ion Point Defence](../ion-point-defence/spec.md) can acquire and hit a hostile drone.

At detonation the drive cuts out. The blast flashes and sends green forked tracks across FX history, with pale tips on LFX. When the wave reaches a hull, sparks fly back towards the blast. Both effects use the [selected spark treatment shown in the carrier view](../../../../apps/web/src/pages/lab/studies/drone-launcher-2026-11-25.mdx#powered-intercept).

## Scenarios

```gherkin
Feature: Drone Launcher

  Scenario: Four ready launchers share three airborne slots
    Given a carrier has four ready launchers, weapons permission, sufficient energy and no airborne drones
    When an enemy enters launch range
    Then three drones launch immediately for a total of 6 energy
    And each firing mount begins its own 5 s reload
    And the fourth launcher cannot release another drone while all three are airborne

  Scenario: Powered flight arms the drone
    Given a drone has just left the rail
    When it coasts after ejection
    Then its fuse remains unarmed
    When its main drive first produces thrust
    Then the ion plume lights and the fuse arms

  Scenario: An enemy takes priority over a closer carrier
    Given the only enemy is 400 u from the drone and its carrier is 100 u from the drone
    When the drone chooses whom to pursue
    Then it pursues the enemy

  Scenario: Only the carrier is within pursuit range
    Given the only enemy is 600 u from the drone and its surviving carrier is 400 u from the drone
    When the drone chooses whom to pursue
    Then it returns towards its carrier
    When the returning drone touches any part of the carrier's hull
    Then the drone disappears and the carrier recovers 2 energy once

  Scenario: Both ships are outside pursuit range
    Given the only enemy and the carrier are each 600 u from the drone
    When the drone chooses whom to pursue
    Then it drifts with its main drive off while its stabilizers settle its rotation

  Scenario: Terrain forces a detonation beside the carrier
    Given an armed drone is within 15 u of its target hull and its carrier is inside the 30 u radiation radius
    When the drone closes on the target
    Then it holds fire and keeps pursuing
    When it strikes a planet's surface or enters a sun's danger zone
    Then it detonates and every damageable body within 30 u, including its carrier, takes 30 radiation damage immediately

  Scenario: A moving hull crosses the expanding front
    Given a derelict is outside the radiation radius when the drone detonates
    And the particle wave starts at a radius of 14 u at detonation and expands linearly to 180 u over 44 simulation ticks at 60 Hz
    When its front reaches the moving derelict
    Then the derelict takes 3 damage even if no visible spark crosses it
    And each body the wave reaches takes this damage only once

  Scenario: Another drone is caught by an explosion
    Given a drone has all 4 health
    When only the wave of a detonation hits it
    Then it survives with 1 health
    When radiation from another detonation hits it
    Then it disappears without starting another explosion

  Scenario: The attack outlives the carrier
    Given an airborne drone is pursuing an enemy
    When its carrier is destroyed
    Then the drone continues pursuit
    When its armed fuse comes within 15 u of the target hull
    Then the drone detonates
    And a surviving target caught by both radiation and wave takes 33 damage in total
```
