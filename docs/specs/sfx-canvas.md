# Arcade effects layer

Updated 2026-11-03. **Status: implemented for alpha 0.5.0; owner experience and
physical-device performance acceptance pending.** The shared direct Canvas pass,
bounded trails/sparks and gravity arcs now run in play and Lab. Automated behavioral
evidence and measured desktop results are separate from those remaining acceptances.
[Investigation, alternatives and migration](../plans/2026-11-03-fx-framework-triage.md).

## Blueprint

### Context

The effects layer is a fast, expressive instrument above the game world. Sharp,
sparkly, electric 1990s effects embrace the character of inexpensive rendering:
saturation, stepping, jaggedness and interference can be desirable. Engines,
gravity collectors, station activity, missiles, fire and impacts share that visual
language and a scene-wide budget. Stations, missiles and fires define the scaling
workload here; their gameplay implementation belongs to their own features.

### Architecture

- **Gameplay owns causes.** `packages/mode-a/src/lib/simulation.ts` supplies delivered
  engine output, collection activity, transforms and game time. Effects consume
  those facts and own presentation state. Collector eligibility and energy remain
  owned by `packages/mode-a/src/lib/gravity-collection.ts` and the simulation;
  the [collection adoption record](../history/ship-builder.md#gravity-collection-and-flight-fx--adopted-2026-11-03)
  preserves the existing rule's rationale.
- **Core owns reusable effects capabilities.** The current entry points are
  `packages/core/src/lib/effects/arcade-fx.ts`, `engine-plume.ts` and `ion-beam.ts`; the current
  mode adapter/compositor is `packages/mode-a/src/lib/gravity-fold-fx.ts`.
  Dependency direction remains web → mode/core and mode → core.
- **Web composes the scene.** `apps/web/src/components/FlightDeck.svelte` combines
  simulation, camera, world and effects. Play and Lab use shared production effects.
  `/lab/fx` composes six production simulations through `mode-a/lib/fx-bench.ts`.
  Their logical layer sits above world geometry and ships, below readable HUD and
  controls. Physical canvases and renderer APIs are implementation choices.
- **Data boundaries stay explicit.** Inputs are anchored by `FlightSettingsSchema`
  in `packages/mode-a/src/lib/schemas/flight.ts`, `LoadoutSchema` in
  `packages/mode-a/src/lib/schemas/loadout.ts`, and `GravityCollectionSchema` in
  `packages/mode-a/src/lib/gravity-collection.ts`. Define changed external/config
  contracts in Zod before consumers; parse them on entry. Internal data is typed.
- **Backend choice remains open.** Alpha 0.5.0 uses a direct Canvas 2D pass with
  solid strokes and phase-driven arcs, avoiding the former offscreen blur/blend path.
  JavaScript, GPU rendering, WASM/Rust and CSS alternatives remain judged by this contract. The FX exception to the
  current Canvas convention is recorded in [Architecture](../architecture.md).
  Implementation alternatives and their tradeoffs live in the investigation.

### Constraints

- **Output fidelity:** effect activity follows actual delivered output and gameplay
  events. An emitter identifies its source, transform, activity and lifecycle.
- **Time and space:** effects advance with game time. Attached cues follow mounts;
  detached trails retain their world-space motion and lifetime. Camera transforms
  apply consistently. Arena wrapping is a discontinuity with explicit trail reset.
- **Simulation authority:** gameplay results and input semantics are invariant under
  changes to effect density, appearance or backend. Replay reproduces game state;
  incidental sparkle patterns may vary.
- **Bounded load:** scene-wide limits bound active effects, memory and queued work.
  Essential activation cues take priority over secondary decoration when saturated.
- **Artistic freedom:** rendering quirks are judged in play. The contract fixes
  behavior and quality targets; recipes, palettes and overlap pixels remain tunable.

## Contract

### Definition of Done

These criteria persist across implementations. Tags in the scenarios trace back to
these identifiers; unchecked items represent outstanding acceptance work.

- [ ] **FX-01 — Composition:** shared play/Lab effects appear above the world while
  HUD and controls remain readable and operable. Human inspection verifies layering.
- [x] **FX-02 — Activity:** engine and collector cues represent delivered output,
  transition on release/inactivity, and expire according to their configured fade.
- [x] **FX-03 — Lifecycle:** pause, resume and reset preserve game-time semantics;
  equal elapsed game time gives equal effect lifetime at 30 and 60 fps.
- [x] **FX-04 — Placement:** source cues follow turning mounts, detached marks retain
  world-space motion, and camera/wrap transitions preserve the stated behavior.
- [x] **FX-05 — Isolation:** identical gameplay inputs yield identical gameplay state
  across supported effects settings, including presentation disabled.
- [x] **FX-06 — Capacity:** overload stays within declared scene work/memory limits
  while retaining essential cues and accepting keyboard/touch input normally.
- [ ] **FX-07 — Performance:** the mixed-scene workload meets the budget below on
  named reference environments, with sustained frame pacing and profiling evidence.
- [ ] **FX-08 — Experience:** the owner reviews a playable mixed scene and records
  whether its effects feel sharp, sparkly, electric and readable at gameplay zoom.

### Performance acceptance

**Under 3 ms for the entire active scene's FX work** is the target. The measurement
criterion is p95 below 3 ms, with p50, maximum and repeated spikes reported. Include
updates, submission and attributable raster/compositor work; profile the CPU/GPU
pipeline as well as callback duration. Frame pacing targets 60 fps (16.67 ms),
with 30 fps (33.33 ms) acceptable under heavier load; the FX budget remains 3 ms.
For the sustained heavy fixture, p95 frame interval is at most 33.34 ms; maxima
and stalls are reported separately. Ordinary play is assessed against the 60 fps target.

The reference workload includes four to six ships with simultaneous plumes plus
stations, missiles and fires. The initial fixture uses six four-engine ships, two
stations, sixteen missiles and twelve fires at a 1920×1080 backing resolution.
Counts and resolution define a reproducible acceptance fixture, not gameplay caps.

Each report identifies hardware, browser, displayed/backing resolution, workload,
warm-up/sample duration and p50/p95/max frame/effects timings. Exercise sustained
movement, turning, overlap and bursts. Name a desktop and representative physical
mobile profile before claiming performance acceptance. The mixed scene and reproducible
`node scripts/profile-fx.mjs` procedure are implemented. Desktop Chromium and
mobile viewport emulation on Apple silicon provide partial evidence; a representative
physical phone and isolated attributable GPU cost remain unverified. The earlier
frozen synthetic benchmark is evidence of feasibility only.

### Regression Guardrails

- Gameplay forces, resources, damage, controls and replay remain governed by their
  existing contracts while effects change.
- Play and Lab resolve the same production definitions and mount geometry.
- Pausing freezes effect age; resuming continues from that age; resetting starts
  an empty presentation lifecycle. Expired/off-screen work respects the work budget.
- Automated checks verify activity, lifecycle, geometry and bounded behavior.
  Human review verifies expressive appearance; captures support that review.
  Gherkin below specifies behavior, not exact drawing calls or pixel equality.

### Scenarios

These are behavioral specifications, not installed executable test bindings.
`@manual` identifies human review; `@performance` requires profiling evidence.
The coverage map below links automated scenarios to their checks; manual and
performance acceptance remains separate from executable assertions.

```gherkin
Feature: Fast, expressive arcade effects

  @FX-01 @manual
  Scenario: Effects overlap the world in both play and Lab
    Given the same active loadout and gameplay moment in play and Lab
    When effects overlap a ship and the world beneath the HUD
    Then both views use the shared effect definitions and mount placement
    And the effects appear above the world and ship
    And the HUD remains readable and its controls operable

  @FX-02
  Scenario: An engine delivers thrust and then stops
    Given an engine has started delivering thrust
    When the next frame is rendered
    Then a thrust cue appears at that engine's outlet
    When delivered thrust becomes zero even if its input remains held
    Then new active thrust emission stops
    And released marks expire within their configured lifetime

  @FX-02
  Scenario: A fitted collector starts receiving energy
    Given a fitted gravity collector is inside planetary influence
    And storage has room for collected energy
    When the simulation deposits gravity-collected energy
    Then its cue fades in at that collector's mount
    And its field direction follows the influencing planet

  @FX-02
  Scenario Outline: A gravity collector stops receiving energy
    Given a fitted collector has an active collection cue
    When <cause>
    Then its activity fades out within the configured collection fade time
    And the fade retains the last active field direction
    Examples:
      | cause                                      |
      | the ship leaves planetary influence        |
      | other supply fills all available storage   |

  @FX-03
  Scenario: Pause and resume preserve effect age
    Given active and released effects are visible
    When the game pauses for five seconds of wall time
    Then their age and animation phase remain at the paused game time
    When the game resumes for one simulation tick
    Then effects advance by one simulation tick

  @FX-03
  Scenario: Reset clears the previous presentation
    Given a run contains active effects and pending bursts
    When the run is reset
    Then its old marks and pending bursts are cleared
    And the new run's effects respond to the new run's state

  @FX-03
  Scenario: Lifetimes remain consistent at different display rates
    Given two effects have the same configured lifetime and starting state
    When equal game time passes with rendering at 30 and 60 frames per second
    Then both effects have advanced by the same elapsed game time
    And both expire at the configured lifetime

  @FX-04
  Scenario: Turning and camera changes preserve spatial meaning
    Given a turning ship has an attached cue and a released trail
    When the ship turns and the camera pans or changes zoom
    Then the attached cue follows its current mount
    And the released trail follows its world-space motion through the same camera

  @FX-04
  Scenario: Arena wrap resets trail continuity
    Given a ship has an active trail
    When the ship wraps to the opposite side of the arena
    Then its pre-wrap trail continuity is cleared
    And new marks begin at the wrapped source position

  @FX-05
  Scenario: Effects settings preserve gameplay results
    Given identical simulation settings and a recorded input sequence
    When it is replayed with full, reduced and disabled effects
    Then gameplay state is identical at corresponding simulation ticks

  @FX-06
  Scenario: A burst arrives when the effects budget is full
    Given the declared scene effects capacity is already in use
    When another burst occurs while the player operates an engine
    Then decorative work is reduced or replaced within the capacity
    And essential engine activation feedback remains available
    And the input is processed by the normal simulation update
    And queued work and memory remain within their declared limits

  @FX-07 @performance
  Scenario: The sustained mixed scene stays within its effects budget
    Given the reference workload and a documented reference environment
    When ships turn and move while plumes, station effects, missiles and fires overlap
    Then p95 whole-scene effects cost is below 3 milliseconds
    And p95 frame interval is at most 33.34 milliseconds
    And the report compares frame pacing with the preferred 60 fps target
    And the report includes raster/compositing evidence and maximum observed costs

  @FX-08 @manual
  Scenario: Review the character of the combined effects in play
    Given the mixed scene is playable at normal gameplay zoom
    When the owner observes firing, coasting, turning and overlapping effects
    Then the review records judgments on sharpness, sparkle, electric character and readability
    And those judgments determine experience acceptance
```

## Implementation and evidence — 0.5.0

Current implementation limits are 1,024 decorative requests and 128 reserved
activation cues per scene pass. Each ship has at most eight outlets and 320 stored
trail marks; the shared burst pool holds 256 sparks and never queues overflow.
The diagnostic fixes the number of ships/entities; these limits are implementation
choices under FX-06, not permanent art recipes or new game population limits.

| Contract            | Evidence                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FX-02               | `gravity-collection.test.ts`, `build-flight.test.ts`, core `ion-beam.test.ts`: delivered output, full storage/influence transitions and released-mark expiry           |
| FX-03               | Core `ion-beam.test.ts`, `arcade-fx.test.ts`; browser `fx.spec.ts`, `alpha.spec.ts`, `ion-effects.spec.ts`: game-time lifetime, pause/reset, replay and bounded bursts |
| FX-04               | Core `ion-beam.test.ts`, mode `fx-integration.test.ts`, browser `alpha.spec.ts`: mount/world meaning, wrap reset and camera controls                                   |
| FX-05               | Mode `fx-integration.test.ts`, browser `fx.spec.ts`: identical gameplay with decoration disabled/overloaded; draw reads state and restores its Canvas context          |
| FX-06               | Core `arcade-fx.test.ts`, browser `fx.spec.ts` and `alpha.spec.ts`: reserved activation under overload, bounded pools and keyboard/multitouch operation                |
| FX-01, FX-07, FX-08 | Review captures, sustained traces and remaining acceptance in the [0.5.0 release record](../releases/0.5.0.md)                                                         |

Visual equality checks for engine painters, gravity-coil faces and the combined
flight canvas have been retired. Functional fitting, collection, flight and
lifecycle checks remain. Historical studies are references; they do not constrain
the new effects. [FX development skill](../../.agents/skills/fx-development/SKILL.md)
guides future agents through this model without copying the specification.

## Supporting records

- [Investigation, alternatives, verification and migration](../plans/2026-11-03-fx-framework-triage.md)
  holds code-level diagnosis, measurements, candidate designs and proposed test changes.
- [DEPRECATED 2026-11-03: historical rendering proposal](../archive/sfx-canvas-legacy.md)
  preserves the superseded dual-canvas recipe outside the active contract.
- Reviewed against ASDLC's [The Spec](https://asdlc.io/patterns/the-spec/),
  [Living Specs](https://asdlc.io/practices/living-specs/) (both updated 2026-10-05),
  and [Gherkin](https://asdlc.io/concepts/gherkin/), checked 2026-11-03.
  The repository's established `docs/specs/` layout is retained.
