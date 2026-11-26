---

generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-26T13:25:12Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-26T13:27:13Z"
legacy:
  generator_model: "GPT-6 (Codex)"
  reviewer: "Ville Takanen"
  review_done: true
  review_note: "Review marked complete; no review date recorded."

---

# Mounted weapon targeting

## Context

Players and opponents need predictable mounted weapon fire as ships, fittings and fragments multiply. All shooters acquire at one instant per combat substep, independent of camera, render rate and effects settings.

## Blueprint

### Architecture

[Simulation](../../../../packages/mode-a/src/lib/simulation.ts) owns the combat clock and encounter roster. Each live ship has one physical adapter and stable ID. Refresh membership, geometry, motion, poses and blockers each substep. Across substeps retain targets by ID only.

[Targeting](../../../../packages/mode-a/src/lib/targeting.ts) registers all firing, tracking, launcher and drone pursuit requests before visiting bodies. Each request supplies shooter, eligible opponents, origin, orientation, reach and any previous target. Cooling point defence can still track. During each body visit, reject impossible candidates before exact tests and share matching requests and geometry. Ready Light Ion Cannons on one chassis share a trigger. Turrets use their own pivots.

Selection returns a trigger or stable target ID and captured aim coordinate. Piloting runs separately. [Salvage](../../../../packages/mode-a/src/lib/salvage.ts) handles aiming, power, cooldowns and attributed damage in defence-before-guns and mount funding order. Each discharge resolves from its actual muzzle against current damageable bodies, derelict material and celestial blockers. The shooter excludes itself from acquisition and contact. Other ships can intercept even when allied.

### Constraints

Apply each weapon’s visibility rule from its specified origin. Skip blocked candidates and collectibles. Encounter eligibility, priority classes and deterministic tie breaks apply to production and offline reference selection. Permuting body order preserves the result. Production may estimate overlap, distance, aim point and threat time.

| Weapon | Reference selection |
| --- | --- |
| [Light Ion Cannon](../light-ion-cannon/spec.md) | Trigger on visible damageable material touching the closed forward rectangle. Test ship circles against the rectangle, wrecks and fragments against [remaining material](../../../../packages/mode-a/src/lib/derelict-collision.ts). An offset muzzle may miss. |
| [Ion Point Defence](../ion-point-defence/spec.md) | Nearest visible eligible material to the pivot, lower ID on ties. Keep an eligible target until a challenger is at least 10 units closer. |
| Laser | Prioritise an incoming fragment on a collision course, then a wreck, then another eligible contact. Retain an eligible target in the winning class. Otherwise rank by threat time or distance as applicable, then stable ID. |
| [Plasma rifle](../plasma-rifle/spec.md) | Retain a visible eligible ship or wreck centre inside the fixed muzzle sector. Otherwise choose by distance, then stable ID. |
| [Drone Launcher](../drone-launcher/spec.md) | Check launch eligibility from the carrier. In flight, retain an eligible enemy in pursuit range. On first acquisition or target loss, choose the nearest eligible enemy in range from the drone’s centre, lower ID on ties. The launcher spec defines ranges and fallback. |

With B encounter bodies, all requests together make at most B acquisition visits per substep, counting visits wherever candidates are enumerated. Comparisons can scale with bodies times requests. Never rebuild candidate arrays per mount. Empty Practice or disabled-only fittings require no acquisition work. With zero requests, acquisition visits, comparisons and candidate preparation are zero. Charge preparation needed solely for physical queries to physical work. An entirely idle substep may skip the roster.

At the production simulation boundary record roster builds, live adapters and preparation time, active requests, visits, comparisons, exact material and visibility tests, temporary allocations and acquisition time. Measure physical contact and visual beam clipping separately.

Compare equal seeded baseline workloads on the same device and build settings with matching ships, fittings and body populations. Include an empty encounter, dense fragments with multiple mounts and two-opponent [Gauntlet](../gauntlet/spec.md) with quarter-step combat. Report device, body and mount counts, median and p95 acquisition and total simulation times, and real-flight p95 frame interval. Numeric limits live with the implementation.

On identical seeds, compare production with the exact offline reference for missed or extra triggers, target switches, aim direction and acquisition time. Distinguish close calls from systematic misses, target chatter and shots through gaps when choosing the least costly acceptable approximation. Run the reference only offline.

## Scenarios

```gherkin
Feature: Mounted weapon targeting

  Scenario: Two turrets per Wasp
    Given 16 Wasps with two tracking turrets each and no other bodies
    When the fleet acquires targets
    Then one roster with at most 16 live adapters serves all 32 mounts in at most 16 visits
    And turrets at different pivots can select different bodies

  Scenario: Cannon reference geometry at the boundary
    Given a ready cannon with one visible candidate
    When a ship circle touches the rectangle tangentially or overlaps its rear edge
    Then the reference triggers
    But a circle just outside the far corner or a wreck with only empty space inside does not trigger

  Scenario: An earlier discharge destroys the selected body
    Given several mounts captured a trigger or aim point before firing
    When the first discharge breaks the target apart
    Then later mounts use their captured result without searching again
    And a funded, aligned cannon spends its normal shot cost even on a miss
    And a contact-dependent turret still checks its barrel line
    And new fragments can intercept immediately and become acquisition candidates next substep
```
