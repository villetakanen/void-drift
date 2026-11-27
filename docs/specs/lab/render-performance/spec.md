---
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:54:13Z"
verified:
  - by: human:ville-takanen
    at: "2026-11-27T06:55:43Z"
---

# Render performance bench

## Context

Designers hold a frame to see what happens to a flash or trail under different FX treatments. Engineers run the same scene to distinguish the cost of presentation from the cost of painting more emitters. Tools navigation and the [Lab](../spec.md) index lead to `/lab/render-performance`.

## Blueprint

The bench scripts production drawing on a fixed stage without running flight simulation, gravity or encounters. Its controls change the comparison, not engine balance, gameplay availability or production allowances.

### Architecture

The [shared render fixture](../../../../apps/web/src/components/lab/render-model-fixture.ts) owns the rotating hull, mount geometry, direction-correct stabilizers and synchronized horizontal ion beams. The hull turns in place; the beams cross the centre and both sides of its sweep so a live flash and its lingering dispersal can be seen together.

The [bench](../../../../apps/web/src/components/lab/RenderPerformanceBench.svelte) places one centred fixture or a 5×5 grid on the same stage. All layers use the same cell transforms; backing sizes follow production layer scales, not device pixel ratio. The baseline shows ion alone in one cell and alternating ion and plasma plumes in the grid. At either density, engine selection compares sustained plumes with discrete bursts, including synchronized Fission ignition. The [effects spec](../../factory/effects/spec.md#constraints) owns the reference workloads and whole-scene budgets.

One clock and one production [FX surface](../../../../packages/core/src/lib/effects/fx-surface.ts) serve all cells, with shared bounded history and per-instance emitter state. [FlightLayers](../../../../apps/web/src/components/FlightLayers.svelte) composes World, Screen-blended FX, optional history-free glow, unfiltered Hard light LFX and the DOM Deck. The selector compares untreated FX, blur, distortion, Turbulent Bloom and the two [low-resolution glow treatments](../render-model/spec.md#lab-glow-treatments), with Low-res CSS glow selected initially.

### Constraints

The [metrics module](../../../../apps/web/src/components/lab/render-performance-metrics.ts) owns warm-up, the bounded rolling window and summary calculations. Callback FPS and median/p95 intervals use unclamped animation-frame timestamps. Median/p95 submission times cover synchronous JavaScript update and Canvas drawing together, excluding summary calculation. The readout refreshes separately from drawing, without pixel readback or waiting for GPU completion.

## Scenarios

```gherkin
Feature: Render performance bench

  Scenario: Compare engine bursts under load
    Given the default baseline grid has completed warm-up
    When I change the engine profile or scenario count
    Then history, emitters, clock and measurements restart without changing running state
    And the CSS stage size, backing dimensions and allowances stay fixed
    And the selected burst still fires at full density

  Scenario: Pause during a synchronized flash
    Given a visible running flash
    When I pause or hide the document
    Then pose, phase, emission and decay hold
    When visible running resumes
    Then a single frame chain advances without catch-up or an inactive sample
    And warm-up and the rolling window start again while cumulative measured time and stamp totals survive
    And repeated Run creates no additional chain
    When I leave the bench
    Then the frame loop and listeners are removed

  Scenario: Reset a run
    Given a configured scene with accumulated light
    When I reset
    Then history, emitters, clock and measurements restart with count, profile, filter and hardware label retained

  Scenario: Compare presentation on a held frame
    Given a paused flash with Turbulent Bloom selected
    When I select either low-resolution glow treatment
    Then the glow canvas copies the held FX at its own backing scale without advancing the scene
    And measurements restart as for any treatment change
    When I run the scene
    Then one downsample per frame follows FX drawing inside the measured submission interval
    When I return to Turbulent Bloom
    Then only the three painted layer canvases remain

  Scenario: Saturate the shared surface
    Given simultaneous source and decorative requests exceed the production allowance
    When the surface admits or drops each request during measurement
    Then attempted stamps equal accepted plus dropped at that boundary
    And neither workload nor allowance adapts

  Scenario: Identify a measurement
    Given a geometry or environment change restarts measurement
    When I edit only the hardware label
    Then scene and samples are retained
    When I copy results
    Then selectable fallback text identifies the label, count, engine profile, timing statistics, rolling span, sample count, cumulative measured active time and stamp totals
    And it identifies viewport, CSS stage and all backing sizes including glow, DPR, browser user-agent without fingerprinting, blend, filter and treatment parameters
    And it describes visible callback and submission timings on this hardware, not GPU completion or universal performance
    And headless correctness checks and visual judgement remain separate from ordinary-browser measurements
```
