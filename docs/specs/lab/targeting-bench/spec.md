---

generator_model: GPT-6 (Codex)
reviewer: Ville Takanen
review_done: true
---

# Targeting bench

## Blueprint

### Context

The Targeting bench at `/lab/targeting` measures the cost of real mounted weapons choosing and firing on moving ships. It opens from the Lab Tools group on viewports at least 1280 CSS pixels wide. Its controlled encounter makes the same work repeatable across fittings and targeting revisions. The [targeting contract](../../game/targeting/spec.md) defines the intended single-pass algorithm. The bench measures the production selector across all shooters under a reproducible load.

### Architecture

`apps/web/src/data/lab-pages.ts` registers the route and `apps/web/src/pages/lab/targeting.astro` mounts the bench. `apps/web/src/components/lab/TargetingBench.svelte` owns the controls, displayed samples and frame presentation. `apps/web/src/components/lab/targeting-bench.ts` supplies the deterministic encounter to production combat in `packages/mode-a/src/lib/salvage.ts` and the flight passes in `packages/mode-a/src/lib/flight-frame.ts`.

Sixteen fitted Wasps follow three deterministic closed paths. Six fly the tilted ellipse on the left, six fly the broad horizontal ellipse on the right, and four fly a smaller circle inside the right ellipse, offset toward its left end. The sweep of the left ellipse approaches the right-hand group. At every point in flight the distance between two live ship centres exceeds the sum of their fitted collision radii. This includes encounters between loops and the closest neighboring ships on each loop, for every offered weapon pair. The camera frames the fleet together. Relative motion brings other ships into and out of range and firing alignment. A mount can change target or spend time without a lock while its neighboring mount continues tracking. Every other live ship remains eligible regardless of its loop. Choreography supplies motion and heading. Ships on the two outer loops face along their direction of travel; ships on the inner circle face 60 degrees outward from their direction of travel. All target identities, triggers, locks and discharges come from the production game rules.

Two fitting controls choose the weapon in each of the Wasp's two combat mounts for the entire fleet. Available choices use working, slot-compatible production weapons. Two Light Ion Cannons give 32 forward guns, a cannon and Ion Point Defence give 16 of each, and two Ion Point Defences give 32 turrets. A fitting change or reset starts the chosen workload from the same initial state, clears expired effects and discards earlier timing samples.

The bench owns the choreography, camera framing and test conditions. It passes current body geometry, velocity, identities, shooter exclusions and fitted mount poses to the production weapon scheduler at production combat step duration. Turrets turn, guns acquire and fire, power is debited, weapons cool down, and the first physical contact determines damage under flight rules. The production flight frame and layer passes draw the actual Wasp builds, mounted weapons, barrel headings, engine plumes, beams and contact effects. Each live Wasp runs a reproducible burn through its fitted engine emitter and production plume update and drawing passes. Scripted kinematics preserve the three loops while those effects run. A destroyed Wasp ceases engine emission. A bench overlay can show observed targeting decisions; it cannot supply decisions to the simulation.

### Constraints

- **Sustained fire.** Keep all 16 hulls in play and replenish ship power for repeatable pressure. Shots still resolve, incur their usual cost and produce their physical contacts. Replenishment and hull protection belong to this workload alone.
- **Live damage.** Apply normal damage and funding. Destroyed ships leave the candidate population and stop firing. The original surviving ships stay on their prescribed paths. The display reflects the resulting decline in active bodies and mounts.

## Contract

### Definition of Done

Report active ships and mounts, firing activity, acquisition body visits, candidate/request comparisons, acquisition time, physical-contact time, whole combat or simulation time, and animation callback interval. Label timing scopes and units, sample count or window, and whether counts are per substep or totals. Compare p95 values over an identified sampling window after warm-up. Sum visits and comparisons across the fleet for a complete combat substep. The fleet selector visits at most 16 candidate bodies per populated substep in this encounter. The selection detail readout reports mean active requests, exact material tests and visibility tests over the same window. Different pivot comparisons can still exceed 16.

Time encounter preparation, including creation of the shared ship adapters, separately from the production weapon scheduler. Acquisition and physical-contact timings are included in total combat CPU time. Report plume update time and whole flight-frame drawing CPU time, including its FX pass contribution. Label the timed pass coverage where a pass draws multiple effects. Frame interval measures the time between animation callbacks. The browser may rasterize and present later. The FX submission measurement covers the persistent FX layer passes. Live light (LFX) and layer clearing contribute to the whole Canvas submission measurement. Samples must identify whether they cover one fleet substep, a simulation tick or a rendered frame. Nested measurements and separately calculated percentiles do not add up to an elapsed frame.

Report roster builds, live ship adapters and roster preparation time per fleet substep. The full fleet prepares at most 16 ship adapters for all shooters combined. Count an entry as a body visit when a selector examines it, including a shooter excluded by policy. Count a comparison when that entry passes shooter policy and is evaluated for a weapon request. This distinguishes the cost of preparing the encounter from the cost of scanning it for targets.

Read counters where production code actually examines candidates and resolves contacts. Measurements of weapon work exclude flight-path choreography, instrumentation UI and rendering, with frame interval reported separately. Target trace overlays start off and can be switched on for diagnosis. Reset the samples when workload conditions change. Record compared fitting, workload, revision, build configuration, device and browser with any retained baseline so later runs are comparable.

A comparison attributing a frame difference to selection alone keeps contact, firing, camera, visible ship counts and plume/weapon effects matched. One possible control replays target selections and aim points previously captured from the same deterministic substeps while normal firing, contact and rendering continue. Verify matching discharge, contact, live-ship and active-emitter counts before interpreting a difference. A run with weapons disabled measures the combined cost of removing shots and their effects. When a matched control is unavailable, report the observed scopes and leave any whole-frame attribution open.

### Regression Guardrails

- The normal Lab entry opens three moving loops with 16 Wasps and 32 fitted combat mounts. Both fitting choices alter actual mounted execution and visible weapon drawings.
- In sustained fire each of the three comparison fits produces live discharges across the fleet and measurable selection work while 16 ships remain available. In live damage a destroyed ship drops from subsequent acquisition and the population readout changes.
- Mounts can select opponents from any loop, switch between eligible ships and lose a target as the flight paths open out. A target absent from the current roster cannot be offered on the next substep. Overlays and camera position have no effect on the simulated choices.
- A live frame renders fitted engine light and exhaust with the weapon effects. Trace visibility and the choice of weapon mix preserve the prescribed engine workload for each surviving ship.
- Geometry verification covers the entire continuous paths and all relative phases, using production fitted collision radii. Any sampled clearance result includes a conservative bound on the distance between samples.
- A reset with the same settings reproduces geometry, initial resources and combat outcomes at equal simulated time. Timing samples belong only to the selected run.
- The timing view distinguishes repeated candidate visits from per-request comparisons. Adding turrets cannot be reported as evidence of a single pass unless the visit counts come from the selector itself.

### Scenarios

```gherkin
Scenario: Benchmark 16 turrets and 16 fixed guns
  Given the two fleet fittings are Ion Point Defence and Light Ion Cannon
  When sustained fire advances through warm-up and measurement
  Then 16 live Wasps operate 32 production mounts
  And fitted main engines visibly emit their production plumes
  And the readout reports measured visits, comparisons, discharge activity and timings

Scenario: Different weapon ranges on one Wasp
  Given sustained fire with a laser and an Ion Point Defence turret on each Wasp
  When the three loops carry opponents into and out of the two mounts' tracking ranges
  Then a mount can switch between two live opponents
  And there are intervals where one mount has no target while the other tracks

Scenario: A ship is destroyed during a live run
  Given live damage is enabled and the fleet has started firing
  When a Wasp loses its remaining hull
  Then it stops firing and leaves the next substep's candidate population
  And the displayed ship and mount counts reflect its loss

Scenario: A changed fitting starts a comparable sample
  Given the mixed fleet has recorded measurement samples
  When the operator changes the second slot to match the first
  Then the three loops start again with the new fitting and initial resources
  And the measurement window contains only samples from the new run
```

[Lab conventions](../spec.md) · [Production Gauntlet bench](../gauntlet-bench/spec.md) · [Flight render model](../../game/render/spec.md)
