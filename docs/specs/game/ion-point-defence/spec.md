---
generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-26T13:28:47Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-26T13:29:55Z"
---

# Ion Point Defence

## Context

Pilots fit a turret that tracks nearby material and fires a short instant ray from the [Light Ion Cannon](../light-ion-cannon/spec.md) family. Its form, mounting, turning and rhythm come from the accepted [Ion Point Defence study](../../../../apps/web/src/pages/lab/studies/ion-point-defence-2026-11-08.mdx).

## Blueprint

### Architecture

The [Hangar](../hangar/spec.md) offers the 10-mass `ion-point-defence` in weapon, equipment and universal slots. Support and engine slots reject it. Version-2 fittings persist and launch without migration. On a new device only the Wasp starts with one. The builder lists 8–24 damage/s, three shots/s, 200 units and 0.1p/shot.

`point-defence-art.ts` supplies Canvas, catalogue SVG and build rendering with one centre pivot and channel-tip muzzle. The [concept SVG](../../../../apps/web/public/studies/ion-point-defence-2026-11-08/concept.svg) retains the cannon’s barrel width, colours and crossbar with a shorter barrel, channel and side housing. Six rim slots and one pale index mark turn with the barrel on two concentric discs, 8 units across in flight. Base lighting stays fixed to the ship. Preview and Plan use the mount direction. Flight uses each mount’s simulated angle and hull layering, including fully hidden turrets.

`schemas/salvage.ts` defines weapon tuning. `salvage.ts` resolves turning and funded shots using the cannon’s instant-contact query with turret reach. `salvage-renderer.ts` supplies the light profile to `FlightFx`. Disabling effects preserves gameplay. The [equipment encounter](../../../../apps/web/src/pages/lab/utility-artwork.astro) and study show switching, tracking beyond reach, first contact, ship rotation and a hidden Scout turret. The mixed-effects Lab Weapons workload runs turrets beside cannons.

### Constraints

Each pivot tracks within 300 units to the closest visible collision point of a live wreck, fragment, eligible enemy ship or hostile [drone](../drone-launcher/spec.md). For wrecks and fragments use remaining polygon material. Stars and planets block the pivot-to-point segment. Collectible energy is transparent to acquisition and fire. [Fleet targeting](../targeting/spec.md) captures each pivot’s target and aim point before firing, selecting the nearest candidate and resolving ties by lower object ID. Keep an eligible target until a challenger is at least 10 units closer.

Turn towards the captured bearing by at most 180°/s × dt relative to the ship, compensating for hull rotation within that limit. Hold the angle without a target. Start and reset at the mount direction.

A ready turret within 2° of the bearing fires only if the first physical contact from its muzzle along the barrel is damageable and within 200 units. Each shot checks the world left by earlier shots, stops at first contact even on another body, applies integer damage once and starts the impact plume there. A blocked or empty ray spends nothing and starts no cooldown.

| Muzzle-to-contact distance | Damage |
| --- | --- |
| 0 to <50 | 8 |
| 50 to <100 | 6 |
| 100 to <150 | 4 |
| 150 to 200 inclusive | 2 |

Each shot debits 0.1p and starts that turret’s ⅓-second cooldown (0.3p/s continuously firing). Idle and tracking draw zero. [Shared weapon operation](../parts/spec.md#weapon-operation) governs Auto, the reserve and funding order after life support and engines. Lasers keep their threat priority and saved rail guns stay inert. Keyboard and landscape touch use the normal flight loop and gravity and friction retain their tuning.

For 80 ms, topmost light follows the current muzzle and heading even beneath a hull. Clip the cached 200-unit blue cannon profile with its transparent tip to the lesser of discharge distance and current obstruction. This visual query deals no damage. The cannon retains its 300-unit profile. Only the 65% dispersal enters persistent FX under the shared [decay, pause, camera, wrap and reset rules](../../factory/effects/spec.md).

## Scenarios

```gherkin
Feature: Ion Point Defence

  Scenario: The turret switches to a clearly closer target
    Given a turret retaining a fragment 80 units away
    When a hostile drone’s collision geometry comes within 70 units with a clear line
    Then the turret selects the drone and turns towards it at no more than 180°/s
    And fires only once its barrel is within 2° of the drone’s aim point

  Scenario: A target beyond reach is tracked without firing
    Given a ready turret whose only candidate lies 250 units away
    When updates run with enough power
    Then the turret aligns with the candidate
    And no discharge, power debit or cooldown occurs until first contact is within 200 units

  Scenario: A planet blocks the shot
    Given a fragment within 200 units whose closest point is behind a planet
    When the firing update runs
    Then the fragment is not a candidate and the turret does not fire

  Scenario: Defence draws power before guns
    Given a ready cannon and an aligned turret with a target in reach and 10.15p available in Auto
    When the firing update runs
    Then the turret fires and leaves 10.05p
    And the cannon remains ready without starting its cooldown

  Scenario: Power funds only one turret
    Given two ready, aligned turrets with targets in reach and 10.15p available in Auto
    When the firing update runs
    Then the first turret in mount order fires and leaves 10.05p
    And the second remains ready without starting its cooldown
```
