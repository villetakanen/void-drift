---

generator_model: GPT-6 (Codex)
reviewer: Ville Takanen
review_done: true
---

# Targeting bench

## Blueprint

### Context

The Targeting bench at `/lab/targeting` measures the cost of real mounted weapons choosing and firing on moving ships. It opens from the Lab Tools group on viewports at least 1280 CSS pixels wide. Its controlled encounter makes the same work repeatable across fittings and targeting revisions. The [targeting contract](../../game/targeting/spec.md) defines the intended single-pass algorithm. The bench also runs the current production selector so its cost can be measured before that algorithm changes.

### Architecture

`apps/web/src/data/lab-pages.ts` registers the route and `apps/web/src/pages/lab/targeting.astro` mounts the bench. `apps/web/src/components/lab/TargetingBench.svelte` owns the controls, displayed samples and frame presentation. `apps/web/src/components/lab/targeting-bench.ts` supplies the deterministic encounter to production combat in `packages/mode-a/src/lib/salvage.ts` and the flight passes in `packages/mode-a/src/lib/flight-frame.ts`.

Sixteen fitted Wasps fly at even intervals around one ring in clear space. Their positions, velocities and headings follow a deterministic flight path. Each Wasp faces the chord toward the Wasp ahead, placing a real hostile body within a forward cannon's trigger rectangle and reach. Every other living Wasp is an eligible opponent. The flight path supplies no target ID, trigger or scripted shot. Turrets choose independently from their actual mount pivots. Fixed guns can discharge and miss from an offset muzzle.

Two fitting controls choose the weapon in each of the Wasp's two combat mounts for the entire fleet. Available choices use working, slot-compatible production weapons. Two Light Ion Cannons give 32 forward guns, a cannon and Ion Point Defence give 16 of each, and two Ion Point Defences give 32 turrets. A fitting change or reset starts the chosen workload from the same initial state, clears expired effects and discards earlier timing samples.

The bench owns the choreography, camera framing and test conditions. It passes current body geometry, velocity, identities, shooter exclusions and fitted mount poses to the production weapon scheduler at production combat step duration. Turrets turn, guns acquire and fire, power is debited, weapons cool down, and the first physical contact determines damage under flight rules. The production flight frame and layer passes draw the actual Wasp builds, mounted weapons, barrel headings, beams and contact effects. A bench overlay can show observed targeting decisions; it cannot supply decisions to the simulation.

### Constraints

- **Sustained fire.** Keep all 16 hulls in play and replenish ship power for repeatable pressure. Shots still resolve, incur their usual cost and produce their physical contacts. Replenishment and hull protection belong to this workload alone.
- **Live damage.** Apply normal damage and funding. Destroyed ships leave the candidate population and stop firing. The original surviving ships stay on their prescribed paths. The display reflects the resulting decline in active bodies and mounts.

## Contract

### Definition of Done

Report active ships and mounts, firing activity, acquisition body visits, candidate/request comparisons, acquisition time, physical-contact time, whole combat or simulation time, and presented frame interval. Label timing scopes and units, sample count or window, and whether counts are per substep or totals. Compare p95 values over an identified sampling window after warm-up. Sum visits and comparisons across the fleet for a complete combat substep. The current selector may make many visits per body; report its actual work. An eventual one-pass selector visits at most 16 candidate bodies per populated substep in this ring. Different pivot comparisons can still exceed 16.

Read counters where production code actually examines candidates and resolves contacts. Measurements of weapon work exclude ring choreography, instrumentation UI and rendering, with frame interval reported separately. Target trace overlays start off and can be switched on for diagnosis. Reset the samples when workload conditions change. Record compared fitting, workload, revision, build configuration, device and browser with any retained baseline so later runs are comparable.

### Regression Guardrails

- The normal Lab entry opens a moving ring with 16 Wasps and 32 fitted combat mounts. Both fitting choices alter actual mounted execution and visible weapon drawings.
- In sustained fire each of the three comparison fits produces live discharges across the fleet and measurable selection work while 16 ships remain available. In live damage a destroyed ship drops from subsequent acquisition and the population readout changes.
- A turret can lock an eligible neighbor other than its predecessor. A target absent from the current roster cannot be offered on the next substep. Overlays and camera position have no effect on the simulated choices.
- A reset with the same settings reproduces geometry, initial resources and combat outcomes at equal simulated time. Timing samples belong only to the selected run.
- The timing view distinguishes repeated candidate visits from per-request comparisons. Adding turrets cannot be reported as evidence of a single pass unless the visit counts come from the selector itself.

### Scenarios

```gherkin
Scenario: Benchmark 16 turrets and 16 fixed guns
  Given the two fleet fittings are Ion Point Defence and Light Ion Cannon
  When sustained fire advances through warm-up and measurement
  Then 16 live Wasps operate 32 production mounts
  And the readout reports measured visits, comparisons, discharge activity and timings

Scenario: A ship is destroyed during a live run
  Given live damage is enabled and the ring has started firing
  When a Wasp loses its remaining hull
  Then it stops firing and leaves the next substep's candidate population
  And the displayed ship and mount counts reflect its loss

Scenario: A changed fitting starts a comparable sample
  Given the mixed fleet has recorded measurement samples
  When the operator changes the second slot to match the first
  Then the ring starts again with the new fitting and initial resources
  And the measurement window contains only samples from the new run
```

[Lab conventions](../spec.md) · [Production Gauntlet bench](../gauntlet-bench/spec.md) · [Flight render model](../../game/render/spec.md)
