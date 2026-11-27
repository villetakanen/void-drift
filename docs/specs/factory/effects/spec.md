---
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:51:34Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-27T06:54:00Z"
---

# Arcade effects layer

## Context

A pilot can tell which engine is firing, where a shot landed and whether a collector is working, even when their light overlaps. Designers see the same sharp, sparkly, electric 1990s picture in flight and in the Lab. Saturation, stepping and interference are part of its character.

## Blueprint

Light shows what the simulation delivered, at the mount or event that produced it; drawing never changes the outcome.

### Architecture

Mode A supplies delivered output, charge, collection, mount poses and timed contacts. [FlightFx](../../../../packages/mode-a/src/lib/gravity-fold-fx.ts) turns them into light using [core effect painters](../../../../packages/core/src/lib/effects/). The painters own stamp recipes, timing and tuning. Flight and the [mixed-effects Lab](../../../../packages/mode-a/src/lib/fx-bench.ts) use the same production painters and mount geometry. The [render model](../../game/render/spec.md) owns placement, layering and the lifecycle of [painted history](../../game/render/fx.md) and [live light](../../game/render/lfx.md).

| Source | What the pilot sees |
| --- | --- |
| Ion engines | A luminous parallel-sided core, coloured halo and transparent end form one plume. Light Ion is mint-cyan; Heavy Ion is cooler, wider and longer. Straight burns can band; turns leave a continuous trail. |
| Plasma engine | A bead tightens and brightens at the charging outlet, leaving a faint trace. It disappears when charging stops. Discharge produces a bright lobed ball and sparks; the ball flares, then settles with delivered thrust. |
| [Fission engine](../../game/fission-engine/spec.md) | Each firing nozzle gives a white flash and lance with pale forking tips; the green tracks stay behind. A withheld ignition leaves no new blast. |
| Wasp and Fiddler stabilizers | Exhaust from the working mounts shows the direction opposite the turning or braking torque they produce. |
| Gravity collector | Light fades in at the collecting mount and points with the influencing planet's field. |
| Derelicts | The same rotating square halo marks contained and released energy. Wrecks, fragments and cells remain visible without it. |
| Weapons | A laser pulse has saturated red edges and a brighter narrow core. The [ion cannon](../../game/light-ion-cannon/spec.md) and [point-defence turret](../../game/ion-point-defence/spec.md) flash blue with a transparent tip along their respective muzzle headings. Only dispersed light lingers. |
| Arrival | Green stencil numerals and GO mark the frozen countdown; a green line streams aft opposite velocity and fades as flight begins. |

### Constraints

Effects work, storage and pending events are bounded across the scene. Effects outside the view cost no emission work. Under load, secondary decoration yields to current source cues, not the other way around. Input, forces, resources, damage and replay do not depend on the effects budget.

The production budget is **p95 below 3 ms for the entire active scene's effects**: updates, drawing submission and attributable raster and compositor work together. Ordinary play targets 60 fps (16.67 ms); the sustained heavy fixture has a p95 frame interval of at most 33.34 ms without relaxing the effects budget.

The reference fixture has six four-engine ships, two stations, sixteen missiles and twelve fires at 1920×1080 backing resolution. These are rendering loads, not gameplay limits. Comparisons keep the production allowances in force through sustained movement, turns, overlap and bursts:

| Workload | What the measurement distinguishes |
| --- | --- |
| Baseline | Simultaneous ion and plasma plumes among the other scene effects, without weapon encounters. |
| Mixed engines | Several mounts on one hull fire different engines together, so steady plumes and discrete bursts compete for the same budget. |
| Fission-heavy | Synchronized multi-nozzle Fission bursts amid other engines expose ignition-frame spikes that quiet intervals can hide. |
| Weapons | Alternating lasers, point-defence turrets and simultaneous twin cannons beside working collectors. Sustained Weapons results are reported separately against the same whole-scene budget. |

Performance evidence names the desktop and representative **physical mobile** hardware, browser, displayed and backing resolutions, workload and burst, warm-up and sample durations. It reports p50, p95 and maximum frame and effects timings, repeated spikes and stalls, with CPU/GPU traces. The [profile script](../../../../scripts/profile-fx.mjs) provides reproducible desktop and mobile-emulation runs; emulation is not physical-device evidence, and callback timing alone does not measure the whole scene. The [isolated render bench](../../lab/render-performance/spec.md) measures painting independently of the mixed production scene.

## Scenarios

```gherkin
Feature: Arcade effects layer

  Scenario: Input stays held after delivery stops
    Given an engine plume and an active collector are visible on a moving ship
    When thrust delivery and energy collection stop while thrust input remains held
    Then neither mount emits fresh light and the existing trails fade where they were painted

  Scenario: A derelict loses containment
    Given a player hit ruptures an intact derelict
    When the energy square moves away
    Then one release pulse expands at the original rupture instead of a generic break flash
    And ordinary impacts do not displace that active cue
    But environmental removal produces no release pulse

  Scenario: An obstruction crosses a live ion flash
    Given an ion mount has discharged and its flash is still visible
    When a nearer obstruction crosses the ray from the current muzzle
    Then the flash clips to the obstruction without extending past the original discharge or applying another hit
    And when the flash ends no solid ray remains in its trail

  Scenario: A contact leaves an impact cue
    Given a rail fixture crosses a derelict's path
    When the simulation reports a swept contact
    Then a circular plume expands and sparks emerge at the contact point
    But a near miss or an expired slug leaves no impact there
```
