---

title: "Spec: Targeting bench"
status: draft
generated:
by: codex-cli/0.162.1
at: "2026-11-19T12:25:16+02:00"
verified: []
legacy:
generator_model: GPT-6 (Codex)
reviewer: Ville Takanen
review_done: true
---

# Spec: Targeting bench

## Blueprint

### Context

The Targeting bench at `/lab/targeting` measures the cost of real mounted weapons choosing and firing on moving ships. It opens from the Lab Tools group on viewports at least 1280 CSS pixels wide. Its controlled encounter makes the same work repeatable across fittings and targeting revisions. The [targeting contract](../../game/targeting/spec.md) defines the intended single-pass algorithm. The bench measures the production selector across all shooters under a reproducible load.

### Architecture

The [Lab registry](../../../../apps/web/src/data/lab-pages.ts) registers the route and the [targeting page](../../../../apps/web/src/pages/lab/targeting.astro) mounts the bench. The [bench component](../../../../apps/web/src/components/lab/TargetingBench.svelte) owns the controls, displayed samples and frame presentation. The [encounter](../../../../apps/web/src/components/lab/targeting-bench.ts) supplies the deterministic workload to [production combat](../../../../packages/mode-a/src/lib/salvage.ts) and the [flight passes](../../../../packages/mode-a/src/lib/flight-frame.ts).

Eight Wasps and eight Fighters alternate on three deterministic closed paths. Six fly the tilted ellipse on the left, six fly the broad horizontal ellipse on the right, and four fly a smaller circle between the two ellipses. Each flight path crosses the other two in world space. The ships arrive at those crossings at different times. Path speeds and starting positions define a repeatable schedule. At every point in flight the distance between two live ship centres exceeds the sum of their fitted collision radii. This includes encounters between loops and the closest neighboring ships on each loop, for every offered weapon pair. The camera frames the fleet together. Relative motion brings other ships into and out of range and firing alignment. A mount can change target or spend time without a lock while its neighboring mount continues tracking. Every other live ship remains eligible regardless of its loop. Choreography supplies motion and heading. Ships on the two outer loops face along their direction of travel; ships on the inner circle face 60 degrees outward from their direction of travel. All target identities, triggers, locks and discharges come from the production game rules.

The bench opens with a Plasma rifle in Slot 1 and a Light Ion Cannon in Slot 2 so the charge is visible beside ion fire. Both selectors apply across the fleet. Wasps carry them in the two hull sockets; Fighters carry them in the two aft sockets, in the same slot order. Available choices use slot-compatible production weapons. The Plasma rifle uses its production automatic charge cycle. Its trace runs from the real muzzle to the captured centre of its selected ship. Lock intervals measure acquisition, whether or not the mount can afford to charge or release. The bench separately reports funded releases, material interceptions, full-range eruptions, and vent cycles from the production scheduler. Each ship supplies its start and end position for the combat substep. Target selection and instant beams sample the end pose, while stream contact uses the full swept interval. A stream can miss the moving target that triggered it or strike an intervening ship. The contact counter increments once at the first material surface reached. A clear barrel line produces a full-range eruption. Both resolve the production three-band blast. Detached heads continue their motion when their emitter is destroyed. Two Light Ion Cannons give 32 forward guns, a cannon and Ion Point Defence give 16 of each, and two Ion Point Defences give 32 turrets. A fitting change or reset starts the chosen workload from the same initial state, clears expired effects and discards earlier timing samples.

The default formation is Three loops. Held approach uses a trailing Fighter and a leading Wasp on a shared orbit. Their separation closes and opens while the trailing Fighter faces ahead toward the leader. A sufficiently long, affordable lock permits a rifle to charge, release, recover and charge again under the same weapon rules as Three loops. Opponents, contacts and firing opportunities come from the live geometry. Grazing approach places a Wasp inside the Fighter’s acquisition sector with a clear barrel line. This lets the pilot watch a full-range eruption under the same weapon rules. Target and blast traces optionally show the three damage radii around the actual eruption. The camera, both fitting choices and the sustained/live damage options work in all three formations. Changing formation resets the encounter and measurements.

The bench owns the choreography, camera framing and test conditions. It passes current body geometry, velocity, identities, shooter exclusions and fitted mount poses to the production weapon scheduler at production combat step duration. Turrets turn, guns acquire and fire, power is debited, weapons cool down, and weapons resolve damage under their production flight rules. The production flight frame and layer passes draw the actual fitted ships, mounted weapons, barrel headings, engine plumes, beams and contact effects. Each live ship runs a reproducible burn through its fitted main engine emitters and production plume update and drawing passes. Scripted kinematics preserve the three loops while those effects run. A destroyed ship ceases engine emission. A bench overlay can show observed targeting decisions; it cannot supply decisions to the simulation.

### Constraints

- **Sustained fire.** Keep every starting hull in the selected formation in play and replenish ship power for repeatable pressure. Shots still resolve, incur their usual cost and produce their physical contacts. Replenishment and hull protection belong to this workload alone.
- **Live damage.** Apply normal damage and funding. Destroyed ships leave the candidate population and stop firing. The original surviving ships stay on their prescribed paths. The display reflects the resulting decline in active bodies and mounts.

## Contract

### Definition of Done

#### Measurement

- Report active ships and mounts, firing activity, acquisition body visits, candidate/request comparisons, acquisition time, physical-contact time, whole combat or simulation time, and animation callback interval. Label timing scopes and units, sample count or window, and whether counts are per substep or totals. Compare p95 values over an identified sampling window after warm-up. Sum visits and comparisons across the fleet for a complete combat substep. The fleet selector visits at most 16 candidate bodies per populated substep in this encounter. The selection detail readout reports mean active requests, exact material tests and visibility tests over the same window. Different pivot comparisons can still exceed 16.
- **Encounter preparation** is elapsed simulation tick time minus measured combat and plume-update time. It includes scripted motion, power updates, sampling overhead and shared roster preparation across the tick's four combat substeps.
- **Roster preparation** directly measures shared roster construction, including creation of live ship adapters, per fleet combat substep. Report roster build and adapter counts at the same scope. The full fleet prepares at most 16 ship adapters for all shooters combined. Roster preparation is already included in encounter preparation; report its p95 separately rather than adding the two timings.
- Acquisition and physical-contact timings are included in total combat CPU time. Report plume update time and whole flight-frame drawing CPU time, including its FX pass contribution. Label the timed pass coverage where a pass draws multiple effects. Frame interval measures the time between animation callbacks. The browser may rasterize and present later. The FX submission measurement covers the persistent FX layer passes. Live light (LFX) and layer clearing contribute to the whole Canvas submission measurement. Samples must identify whether they cover one fleet substep, a simulation tick or a rendered frame. Nested measurements and separately calculated percentiles do not add up to an elapsed frame.
- Count an entry as a body visit when a selector examines it, including a shooter excluded by policy. Count a comparison when that entry passes shooter policy and is evaluated for a weapon request. These counts measure scanning and selection work, distinct from building the roster.
- Read counters where production code actually examines candidates and resolves contacts. Measurements of weapon work exclude flight-path choreography, instrumentation UI and rendering, with frame interval reported separately. Target trace overlays start off and can be switched on for diagnosis. Toggling traces clears only browser-frame timing samples; the encounter, simulation samples and counters continue. Changing the fitting, formation or damage mode starts a fresh encounter and clears both timing windows. Record compared fitting, workload, revision, build configuration, device and browser with any retained baseline so later runs are comparable.
- A comparison attributing a frame difference to selection alone keeps contact, firing, camera, visible ship counts and plume/weapon effects matched. One possible control captures target selections and aim points from the same deterministic substeps and replays them while normal firing, contact and rendering continue. Verify matching discharge, contact, live-ship and active-emitter counts before interpreting a difference. A run with weapons disabled measures the combined cost of removing shots and their effects. When a matched control is unavailable, report the observed scopes and leave any whole-frame attribution open.
- With a rifle fitted, record every uninterrupted same-target interval per mount from reset. Loss of a target or replacement by another ID ends the interval. Count completed intervals shorter than 0.7 s separately from those lasting at least 0.7 s. Report intervals already active on the first observed substep and ending later separately. Ongoing intervals stay open when the bench pauses or a measurement ends. A refit or reset begins a fresh observation window.

### Regression guardrails

- The normal Lab entry opens three moving loops with eight Wasps, eight Fighters and 32 fitted combat mounts. Both fitting choices alter actual mounted execution and visible weapon drawings.
- In Three loops with Sustained fire, each of the three comparison fits produces live discharges across the fleet and measurable selection work while 16 ships remain available. In live damage a destroyed ship drops from subsequent acquisition and the population readout changes.
- Mounts can select opponents from any loop, switch between eligible ships and lose a target as the flight paths open out. A target absent from the current roster cannot be offered on the next substep. Overlays and camera position have no effect on the simulated choices.
- A live frame renders fitted engine light and exhaust with the weapon effects. Trace visibility and the choice of weapon mix preserve the prescribed engine workload for each surviving ship.
- Geometry verification shows each pair of paths crosses spatially and checks hull separation over the complete repeating flight schedule using production fitted collision radii. Between-sample verification includes a conservative bound on relative ship motion. An unconstrained closest-distance check between the paths would incorrectly count ships arriving at different times as colliding.
- A reset with the same settings reproduces geometry, initial resources and combat outcomes at equal simulated time. Timing samples belong only to the selected run.
- The timing view distinguishes repeated candidate visits from per-request comparisons. Adding turrets cannot be reported as evidence of a single pass unless the visit counts come from the selector itself.

### Scenarios

```gherkin
Scenario: Crossings produce long and short rifle opportunities
  Given the three-loop fleet carries two Plasma rifles per ship in sustained flight
  When the encounter advances for 60 simulation seconds
  Then the production scheduler records both funded releases and vent cycles
  And ships traverse their shared crossing points at different times

Scenario: Benchmark 16 turrets and 16 fixed guns
  Given the two fleet fittings are Ion Point Defence and Light Ion Cannon
  When sustained fire advances through warm-up and measurement
  Then 16 live ships operate 32 production mounts
  And fitted main engines visibly emit their production plumes
  And the readout reports measured visits, comparisons, discharge activity and timings

Scenario: Roster building is included in encounter preparation
  Given a sampled simulation tick builds a shared roster during combat substeps
  When the timing samples are recorded
  Then roster construction is timed per combat substep
  And the tick's encounter preparation includes those builds but excludes measured combat and plume updates

Scenario: Different weapon ranges on one Wasp
  Given sustained fire with a laser and an Ion Point Defence turret on each ship
  When the three loops carry opponents into and out of the two mounts' tracking ranges
  Then a mount can switch between two live opponents
  And there are intervals where one mount has no target while the other tracks

Scenario: A ship is destroyed during a live run
  Given live damage is enabled and the fleet has started firing
  When a Wasp loses its remaining hull
  Then it stops firing and leaves the next substep's candidate population
  And the displayed ship and mount counts reflect its loss

Scenario: Sustained fire protects the starting ships in a paired approach
  Given Held approach starts with one Fighter and one Wasp in Sustained fire
  When a shot that would destroy one of them in live damage makes contact
  Then the contact is recorded and both starting ships remain in play

Scenario: A released stream outlives its emitter
  Given a trailing Fighter has released a stream at the moving lead ship
  When the Fighter is destroyed before the stream arrives
  Then the released head continues on its launch trajectory
  And its first contact with the lead ship increments the fleet contact counter once

Scenario: A changed fitting starts a comparable sample
  Given the mixed fleet has recorded measurement samples
  When the operator changes the second slot to match the first
  Then the three loops start again with the new fitting and initial resources
  And the measurement window contains only samples from the new run

Scenario: Toggling traces isolates the overlay's frame cost
  Given the encounter has recorded browser-frame and combat timing samples
  When the operator toggles target and blast traces
  Then the browser-frame timing window starts fresh
  And the encounter continues with its existing combat samples and counters
```

[Lab conventions](../spec.md) · [Production Gauntlet bench](../gauntlet-bench/spec.md) · [Flight render model](../../game/render/spec.md)
