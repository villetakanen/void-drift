---

## generated: { by: codex/gpt-6, at: "2026-11-19T13:55:56+00:00" }

# Handoff for the Lab game field

The [field sky contract](../specs/game/render/flight-sky/spec.md) applies anywhere the Lab shows the game area. Practice fixes the sightline inputs to Sol. A reproducible encounter can fix its seed. Both use the production field. An experiment that explicitly compares sky materials can replace the material for that experiment.

## Why the Lab diverged

[FlightLayers](../../apps/web/src/components/FlightLayers.svelte) mounts the sky only when a caller passes it. Independently, [drawFlightFrame](../../packages/mode-a/src/lib/flight-frame.ts) defaults to an opaque void and the old starfield. [FlightDeck](../../apps/web/src/components/FlightDeck.svelte) coordinates the image, camera and transparent World clear. Mounting the same canvases in a bench therefore does not reproduce the player field.

## Work to pick up

1. Give game-field callers one shared way to mount the prepared sky and render a transparent World. Move the existing selection, preparation, cancellation and positioning behind that boundary. A caller supplies its system or Practice reference, camera and local pass filters. Keep the lower-level layer host available to instruments that exercise individual layers. Migrate play and the first Lab consumer together so the shared path has two real callers.
2. Migrate the following views through that boundary. Trace embeds of the Flight scene instrument before switching defaults.

   | View                                                                                                                                        | Current behaviour and intended input                                                                                                                                           |
   | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | [Flight scene](../../apps/web/src/lib/flight-scene/scene.ts)                                                                                | The default frame draws the legacy stars. Take the scene's system or the Sol reference for Practice. Preserve the explicit experimental sky painter on scenes that declare it. |
   | [System instrument](../../apps/web/src/lib/system-instrument/scene.ts)                                                                      | Its pass filter explicitly includes the void and starfield. Use the system seed selected in the instrument.                                                                    |
   | [Planet Inspector](../../apps/web/src/lib/planet-inspector/scene.ts)                                                                        | Its pass filter also includes both. Use the source system for the inspected body. Preserve the same sky through radius, HUD and time changes.                                  |
   | [Gauntlet](../../apps/web/src/components/lab/GauntletBench.svelte) and [Targeting](../../apps/web/src/components/lab/TargetingBench.svelte) | Both call the default frame. Take the existing encounter's system and camera. Keep targeting traces, encounter controls and timing intact.                                     |
   | [Controls](../../apps/web/src/components/lab/LabThrustPads.svelte)                                                                          | A local canvas draws stars behind the real pads. Use a stationary production sightline for the flight-gutter preview.                                                          |
3. Correct the [Render model reference](../../apps/web/src/components/lab/FrameReference.svelte) to show the browser sky below World and indicate when the legacy passes run. Inspect the Render model and Render performance fixtures separately. A synthetic blend or timing workload owns the stimulus it measures. For a fixture kept on historical stars, name the comparison it preserves. Check dated study embeds against their recorded comparisons.

## Acceptance

Match a generated seed and camera pose in play and the System instrument, and match a Practice pose in play and Flight scene. Verify the same image placement through movement, resize and reverse seek without preparing again. Change the selected system while preparation is pending and verify that only the current system appears. In each migrated field check that World clears transparently, distant stars produce no per-frame Canvas draws, and overlays, pass timing and controls still work. Exercise the declared experimental sky and the synthetic measurement fixtures separately. Use Lab viewports at least 1280 px wide.
