# Arcade effects layer

Updated 2026-11-03. **Status: persistent-surface correction implemented and locally verified;
owner builder playtest visually positive; performance acceptance pending.** The owner
rejected the 0.5.0 engine appearance and clarified that the accumulated image must
hold the history. The direct pass and per-engine trail histories shipped in 0.5.0
are superseded. [Correction plan](../plans/2026-11-03-fx-surface-correction.md).

## Derelict contained energy

Intact derelicts and released energy squares stamp the same cached rotating-square
halo into the persistent surface through `stampWeaponLight`, using visibility and
source budgets. Hull fills remain flat; energy light is independent decoration.
FlightDeck and the mixed FX Lab restore square apertures after compositing.

A player-caused containment loss emits one validated `energy-release` event at the
fixed rupture centre and actual contact time. Its shared world-unit pulse expands
for 0.28 gameplay seconds, then the surface owns remaining light decay. It replaces
the generic player-break flash and does not follow the ejected square. Active
release cues retain priority over ordinary impact events in the bounded ring. Environmental
removal, expiry, exit and fragments produce no energy-release cue. Pause adds no
emission or decay; reset discards the old history. The canonical Derelict Lab uses
these same production causes and painters.

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
  `packages/core/src/lib/effects/fx-surface.ts`, `arcade-fx.ts`, `engine-plume.ts`
  and `ion-beam.ts`; the current
  mode adapter/compositor is `packages/mode-a/src/lib/gravity-fold-fx.ts`.
  Dependency direction remains web → mode/core and mode → core.
- **Web composes the scene.** `apps/web/src/components/FlightDeck.svelte` combines
  simulation, camera, world and effects. Play and Lab use shared production effects.
  `/lab/fx` composes six production simulations through `mode-a/lib/fx-bench.ts`.
  The persistent light surface sits above world geometry and ships, below readable
  HUD and controls. Emitters stamp fresh light; overlapping light adds; one shared
  game-time decay fades the accumulated image. Engine trail marks are not retained
  as individually aged and redrawn objects. Buffer count and renderer APIs remain
  implementation choices.
- **Data boundaries stay explicit.** Inputs are anchored by `FlightSettingsSchema`
  in `packages/mode-a/src/lib/schemas/flight.ts`, `LoadoutSchema` in
  `packages/mode-a/src/lib/schemas/loadout.ts`, and `GravityCollectionSchema` in
  `packages/mode-a/src/lib/gravity-collection.ts`. Define changed external/config
  contracts in Zod before consumers; parse them on entry. Internal data is typed.
- **Backend choice remains open.** The correction uses reusable Canvas 2D history
  buffers, cached complete ion stamps and phase-driven gravity arcs. Gradients are
  generated only when building the stamp cache; there is no live blur pass.
  JavaScript, GPU rendering, WASM/Rust and CSS alternatives remain judged by this contract. The FX exception to the
  current Canvas convention is recorded in [Architecture](../architecture.md).
  Implementation alternatives and their tradeoffs live in the investigation.

### Constraints

- **Output fidelity:** effect activity follows actual delivered output and gameplay
  events. An emitter identifies its source, transform, activity and lifecycle.
- **Time and space:** effects advance with game time. Fresh stamps follow current
  mounts. Accumulated light remains at its painted world position and shares the
  surface decay; it carries no per-mark velocity. Camera changes preserve this
  placement. Arena wrap starts stamping at the new location without a connecting
  streak; previous light fades at its old location. Reset clears the whole surface.
- **Simulation authority:** gameplay results and input semantics are invariant under
  changes to effect density, appearance or backend. Replay reproduces game state;
  incidental sparkle patterns may vary.
- **Bounded load:** scene-wide limits bound active effects, memory and queued work.
  Current source stamps take priority over secondary decoration when saturated.
  Moving sparks may retain bounded motion state; their painted trails live in the image.
- **Artistic freedom:** rendering quirks are judged in play. The contract fixes
  behavior and quality targets; recipes, palettes and overlap pixels remain tunable. The accepted ion reference
  supplies its parallel luminous core, coloured halo and transparent end, with
  Light mint-cyan and Heavy cooler, longer and wider. A separate attached rod and
  faint residue does not represent that accepted identity.

## Contract

### Definition of Done

These criteria persist across implementations. Tags in the scenarios trace back to
these identifiers; unchecked items represent outstanding acceptance work.

- [ ] **FX-01 — Composition:** shared play/Lab effects appear above the world while
  HUD and controls remain readable and operable. Human inspection verifies layering.
- [x] **FX-02 — Activity:** engine and collector cues represent delivered output,
  stop new stamping on release/inactivity, and leave light to the shared decay.
- [x] **FX-03 — Lifecycle:** pause, resume and reset preserve game-time semantics;
  equal elapsed game time gives equivalent shared decay at 30 and 60 fps.
- [x] **FX-04 — Placement:** source stamps follow turning mounts, accumulated light retains
  its painted world position, and camera/wrap transitions preserve this meaning.
- [x] **FX-05 — Isolation:** identical gameplay inputs yield identical gameplay state
  across supported effects settings, including presentation disabled.
- [x] **FX-06 — Capacity:** overload stays within declared scene work/memory limits
  while retaining essential cues and accepting keyboard/touch input normally.
- [ ] **FX-07 — Performance:** the mixed-scene workload meets the budget below on
  named reference environments, with sustained frame pacing and profiling evidence.
- [ ] **FX-08 — Experience:** the owner reviews a playable mixed scene and records
  whether its effects feel sharp, sparkly, electric and readable at gameplay zoom.
  Owner builder playtest on 2026-11-03 approved the ion/gravity appearance as matching
  the intended effect; the entire diagnostic workload has not had owner review.

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
- Pausing freezes accumulated light without adding more brightness. Resume uses
  elapsed game time; reset empties presentation state. Off-screen emission is culled.
  Display frames skipped between updates do not create an emission backlog.
- Playback/seek in the Lab replays painting as well as simulation for the visible
  history interval; simulation state alone cannot reconstruct an accumulated image.
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

  @FX-02 @FX-03
  Scenario: Sources share accumulated light
    Given two sources stamp light onto the same part of the effects surface
    When the surface is presented above the world
    Then their overlapping light adds brightness
    When both sources stop stamping
    Then their combined image fades through the same decay operation
    And neither source retains or redraws its painted trail marks

  @FX-02 @FX-03
  Scenario: Old light disappears during continuing emission elsewhere
    Given one source has stopped stamping and another keeps emitting
    When the shared image history has passed its expiry bound
    Then the old source leaves no residual colour or opacity
    And the active source remains visible

  @FX-02
  Scenario: An engine delivers thrust and then stops
    Given an engine has started delivering thrust
    When the next frame is rendered
    Then a thrust cue appears at that engine's outlet
    When delivered thrust becomes zero even if its input remains held
    Then new active thrust emission stops
    And all previously stamped engine light follows the shared surface decay

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
    Then new collector stamping stops
    And its accumulated light decays at its painted world position and direction
    Examples:
      | cause                                      |
      | the ship leaves planetary influence        |
      | other supply fills all available storage   |

  @FX-03
  Scenario: Pause and resume preserve accumulated light
    Given active and released effects are visible
    When the game pauses for five seconds of wall time
    Then the accumulated image neither fades nor gains brightness
    And source animation phase remains at the paused game time
    When the game resumes for one simulation tick
    Then effects advance by one simulation tick

  @FX-03
  Scenario: Reset clears the previous presentation
    Given a run contains active effects and pending bursts
    When the run is reset
    Then its accumulated image and pending bursts are cleared
    And the new run's effects respond to the new run's state

  @FX-03
  Scenario: Decay remains consistent at different display rates
    Given two light surfaces have the same starting image and decay setting
    When equal game time passes with rendering at 30 and 60 frames per second
    Then both images have decayed by the same elapsed game time within raster precision
    And a quiet surface eventually clears completely

  @FX-04
  Scenario: Turning and camera changes preserve spatial meaning
    Given a turning ship has fresh stamps and accumulated light
    When the ship turns and the camera pans or changes zoom
    Then fresh stamps follow the current mount
    And accumulated light remains at its painted world position through the camera

  @FX-04
  Scenario: Arena wrap does not bridge the arena
    Given a ship has an active trail
    When the ship wraps to the opposite side of the arena
    Then fresh stamps begin at the wrapped source position
    And previous light fades at its old world position
    And no stroke connects the two locations

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

## Implementation and evidence — surface correction

One scene owns two rolling history images and one reusable reprojection buffer
(about 24.9 MB of raw RGBA storage at 1920×1080, excluding browser overhead).
Both images use the same decay. Each receives fresh stamps for a 0.5-second window;
old windows are retired wholesale, so even 8-bit rounding residue is gone within
one second of its last stamp while other sources keep firing. This is bounded image
history, not per-source/mark histories. Stationary-camera images fade in place;
camera movement combines reprojection and decay in a copy. Their combined light is
added over the world. The shared half-life is 0.1 seconds; a wholly quiet surface
also clears after 0.8 seconds. These are tunable
implementation values. Different frame rates need not produce identical overlap pixels.

Limits remain 1,024 decorative and 128 source requests per advancing scene frame.
Each ship holds at most eight current engine outlets, with no historical marks.
The moving spark pool holds at most 256 particles; their trail is image persistence.
Ion stamps are cached by style. These capacities do not set game population limits.

- Core outlet tests cover delivered output, mount transforms, pause/reset and bounds.
- Browser `fx-surface.spec.ts` checks additive accumulation, shared decay, pause,
  camera movement, reset and discontinuous placement with synthetic stamps. These
  are compositing semantics, not screenshot or art-recipe equality assertions.
- Existing mode/browser checks cover gameplay isolation, collection, replay, overload,
  keyboard/touch and production Lab consumers. Appearance remains human-reviewed.
- Sustained traces, final verification and owner feedback are recorded in the
  [repair evidence](../loop-evidence/2026-11-03-fx-surface-repair.md).
  The 0.5.0 timing results do not certify the changed rendering path.

[DEPRECATED 2026-11-03] The direct-pass implementation shipped in 0.5.0 retained
320 individually aged trail marks per ship and separate attached beams. It did not
implement the owner's intended persistent surface. Its checks and measurements
remain historical evidence in the [0.5.0 release record](../releases/0.5.0.md).
The [FX development skill](../../.agents/skills/fx-development/SKILL.md) guides agents
through the agreed model. Preserved study painters are comparison evidence outside
production; visual equality gates remain retired.

## Supporting records

### Weapon trial — 2026-11-03

The [weapons and salvage trial](weapons-and-salvage.md) adds simulation-owned
rail rounds, rotating laser pulses, impact/destruction events and energy collection.
`FlightFx` stamps their fresh light into the existing surface and consumes events
into one shared weapon spark pool (capacity 256). Physical wrecks, fragments and
cells are world objects, visible independently of cosmetic effects. Existing
source/decorative budgets and pause/reset/camera semantics apply. Current pulse
events expire after 0.2 seconds and are bounded to 128; they are not trail histories.
Laser pulses use a saturated red outer stroke and a brighter narrow core. Rail
collisions and ship–derelict contacts stamp the same circular plume expanding from the actual swept contact point
for 0.2 seconds and feed the same bounded spark pool. Expired slugs and near
misses cannot trigger that plume. Pause/reset semantics apply to both effects.

The mixed Lab's Weapons toggle, also `/lab/fx?weapons=1`, fits alternating lasers
and rails beside the six ships' gravity collectors and shows real encounters.
The default reference workload suppresses encounter spawning. Weapon-mode traces
must be identified separately from earlier reference-workload measurements.

- [Investigation, alternatives, verification and migration](../plans/2026-11-03-fx-framework-triage.md)
  holds code-level diagnosis, measurements, candidate designs and proposed test changes.
- [DEPRECATED 2026-11-03: historical rendering proposal](../archive/sfx-canvas-legacy.md)
  preserves the superseded dual-canvas recipe outside the active contract.
- Reviewed against ASDLC's [The Spec](https://asdlc.io/patterns/the-spec/),
  [Living Specs](https://asdlc.io/practices/living-specs/) (both updated 2026-10-05),
  and [Gherkin](https://asdlc.io/concepts/gherkin/), checked 2026-11-03.
  The repository's established `docs/specs/` layout is retained.

## Arrival countdown

Saira Stencil 700 outlines paint Android-green ignition numerals through the shared
essential FX allowance. A presentation clock advances during the frozen count, then
continues with simulation time. The countdown and GO are stamped at the centre of the gameplay viewport,
independent of ship position. Residual light follows the shared surface decay.

An Android-green speed line extends backward from the arriving ship's rear,
opposite its velocity. It is visible throughout the countdown and fades over the
first 1.5 seconds of flight. Its length scales with speed, capped at 420 world
units. It uses the shared essential allowance and persistent light decay; pause
and reset follow the existing surface lifecycle. It does not affect physics.
