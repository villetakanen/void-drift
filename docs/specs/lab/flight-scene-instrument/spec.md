---
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:39:05Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-27T06:51:02Z"
---

# Flight scene instrument

## Context

A designer inspects what happens to one ship at a known instant of flight. Two independent scenes let the designer compare the same burn under different conditions.

## Blueprint

The instrument flies a [Motion instrument](../motion-instrument/spec.md) fixed burn through the production simulation and frame passes. The [Lab](../spec.md) stages the encounter and presents the result; it does not supply manual flight controls or a second flight model.

### Architecture

- The [scene document schema](../../../../apps/web/src/lib/flight-scene/config.ts) defines supported combinations, units, defaults and bounds. The instrument reads the document once at mount. Reactive staging overrides use the same validation; invalid staging shows its issues instead of a partial scene and clears the target hull readout.
- The canvas-independent [flight run](../../../../apps/web/src/lib/flight-scene/flight.ts) applies burn inputs to the staged simulation. A scene uses the Practice system, isolates its Venus encounter, or stages salvage without unrelated encounters. Placed wrecks retain their world positions until disturbed; a held wreck follows the ship and is replaced after breakup. Only held wrecks' shards expire on the staged timer. Optional atmospheric drag acts on velocity relative to the orbiting planet, in proportion to hull overlap, without adding atmospheric damage.
- The [scene renderer](../../../../apps/web/src/lib/flight-scene/scene.ts) reconstructs the camera and persistent emission for the displayed tick. It uses the [game field](../../game/render/game-field/spec.md) for the sky (Sol for Practice and isolated encounters, the source seed for generated systems) unless an experiment supplies a screen-space sky behind the arena. Production frame passes own layering, blend modes and bloom.
- The [instrument](../../../../apps/web/src/components/lab/flight-scene/FlightSceneInstrument.svelte) owns burn selection, timeline, zoom and readouts. It reports current and maximum hull for the first placed target, or null when unavailable. The [Lab page controls](../../../../apps/web/src/components/lab/flight-scene/FlightSceneLab.svelte) configure the reference scene. A [document-only embed](../../../../apps/web/src/components/lab/flight-scene/FlightSceneEmbed.astro) needs no menu. A study wrapper owns its reactive choices and supplies trusted callbacks or a menu pane; the pane receives a frozen document. It scrolls internally and occupies the rightmost 1/φ² of its container. Selectable summary text with units stays clear of the controls.

### Constraints

**Replay.** Playback advances in real time at 60 simulation ticks per second. Seeking forward applies intervening inputs and events in order; pausing or redrawing does not advance behaviour or accumulate light. Restarting, switching burns or seeking backward reconstructs motion, salvage, experiment state, camera and visible light history from a fresh run. Fixed ticks reproduce the flight, not uneven display timing.

Changing a staged condition (including target mode, spin, loadout, start or planet), tuning, study light or experiment replays the selected burn to the selected tick in the current view. Changing body appearance or layer visibility redraws that instant without discarding hidden history.

**Camera.** AUTO delegates framing to the [production camera](../../game/camera/speed-camera/spec.md) at the actual layout scale. The explicit 1×, 2×, 4× and 8× views centre the ship without automatic zoom or hull containment: each world unit spans `0.5 × magnification` CSS pixels regardless of layout width, device pixels or render resolution. Changing view reconstructs camera and light history from the start under the new projection without changing burn, time or playback. Resizing preserves the selected view.

**Events.** A staged opening rest withholds thrusters, not the other systems. A staged impulse acts after its specified step: backward momentum along the ship's current axis changes velocity according to fitted mass. Impulses on the same tick add without changing rotation or spin. These are encounter conditions, not weapon rules. For [Fission](../../game/fission-engine/spec.md), inspection uses the simulation's actual ignition tick, recorded nozzle pose and contact outcome; neither throttle nor painted light stands in for an event. Culling or hiding an effect never removes a simulated contact.

**Experiments and appearance.** Substitutions are labelled and local to the scene. The following interfaces have different authority:

- [Tuning and study light](../../../../apps/web/src/lib/flight-scene/light.ts): tuning applies to copies of parts before flight. A study light reads copied ship and outlet state, including actual charge and output, and overlap and relative motion when an atmosphere is staged. It replaces only nominated plumes without changing motion or energy. Fresh emission joins the budgeted, fading world-space FX history; live light draws after the game's LFX pass.
- [Body appearance](../../../../apps/web/src/lib/flight-scene/planet.ts): a planet painter receives frozen body, ship and displayed Sun data and simulation time. It replaces only the selected body's World and optional LFX drawing, with bounds covering the whole composition. Production identity and world labels remain. A star palette override changes the standard star painter, not physics or other bodies' lighting unless their painters use the displayed colours. Clearing an override restores stock drawing.
- A trusted [experiment](../../../../apps/web/src/lib/flight-scene/experiment.ts) validates its own options and creates fresh state after staging. It steps once after each production tick while the ship remains alive. It owns its objects and contact decisions and can apply damage to registered salvage through production impact and breakup. Its World and LFX painters read state; fresh FX shares the existing budget. Hiding or repainting an occupied mount changes artwork, not fitted behaviour. Replacement artwork uses mount-local builder coordinates and retains flight scale, orientation and hull occlusion. Executable callbacks are not document fields.

## Scenarios

```gherkin
Feature: Flight scene instrument

  Scenario: Revisit a contact
    Given a staged burn in which an emitted effect hits a target
    When the designer seeks back before emission and returns to contact
    Then the target hull and light history match a fresh run to that tick

  Scenario: Resize a paused close-up
    Given a paused explicit zoom view
    When the scene resizes to another supported Lab width
    Then the ship remains centred at the same instant
    And the same world span measures the same distance in CSS pixels

  Scenario: Reject incompatible staging
    Given a scene document that requests wrecks in a planetary encounter
    When the designer opens the scene
    Then the instrument shows the staging issue instead of flying the encounter
```
