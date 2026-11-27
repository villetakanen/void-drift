---
generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-26T14:42:08Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-26T14:46:14Z"
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

The drone can sustain a turn. Its angular acceleration, braking torque and maximum turn rate are each three times those of a stabilized Fighter. Its full forward acceleration is 90 u/s² and its speed envelope is 279 u/s.

At detonation the drive cuts out. A white flash lights the full 180 u radius immediately, catching the sides of nearby hulls that face the blast. The flash is softer on the second simulation tick and then ends. Only radiation and contact with the expanding particle wave deal blast damage.

The blast sends green forked tracks across FX history, with pale tips on LFX. When the wave reaches a hull, sparks fly back towards the blast. Both effects use the [selected spark treatment shown in the carrier view](../../../../apps/web/src/content/lab/studies/drone-launcher-2026-11-25.mdx#powered-intercept).

## Scenarios

```gherkin
Feature: Drone Launcher

  Scenario: Four ready launchers share three airborne slots
    Given a carrier has four ready launchers, weapons permission, sufficient energy and no airborne drones
    When an enemy enters launch range
    Then three drones launch immediately for a total of 6 energy
    And each firing mount begins its own 3 s reload
    And the fourth launcher cannot release another drone while all three are airborne

  Scenario: Powered flight arms the drone
    Given a drone has just left the rail
    When it coasts after ejection
    Then its fuse remains unarmed
    When its main drive first produces thrust
    Then the ion plume lights and the fuse arms

  Scenario: An enemy interrupts the return to the carrier
    Given a drone is returning to its carrier
    When an enemy enters pursuit range before the drone touches the carrier
    Then the drone immediately switches to pursuing the enemy even if its carrier is closer
    And touching the carrier during pursuit gives no energy refund

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

  Scenario: A drone warps across the system boundary
    Given an airborne drone approaches the same warp boundary used by ships
    When it crosses the boundary
    Then it emerges where a ship making the same crossing would emerge and continues flying with its velocity preserved
    And bodies between the departure and arrival points register no contact with the drone during the warp

  Scenario: Any enemy ship can trigger the armed fuse
    Given an armed drone is pursuing one enemy and its carrier is clear of the radiation radius
    When another enemy ship’s hull comes within 25 u of the drone
    Then the drone detonates

  Scenario: Terrain forces a detonation beside the carrier
    Given an armed drone is within 25 u of an enemy ship’s hull and its carrier is within the 35 u radiation radius
    When the drone closes on that hull
    Then it holds fire and keeps pursuing
    When it strikes a planet's surface or enters a sun's danger zone
    Then it detonates and every damageable body within 35 u, including its carrier, takes 30 radiation damage immediately

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
    When its armed fuse comes within 25 u of the target hull
    Then the drone detonates
    And a surviving target caught by both radiation and wave takes 33 damage in total
```
