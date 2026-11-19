# System instrument

## Context

The Lab's System instrument inspects the default seeded solar system used by
Survival, Derelicts and Gauntlet. It shows the generated world at tick zero so
the Sun fields, mercurial placement and retained planet roster can be judged.
The [system contract](../../game/world/systems/spec.md) owns generation;
this instrument supplies its seed and displays its result.

## Architecture

- `apps/web/src/pages/lab/system-instrument.astro` hosts the Lab-only page in
  wide `LabLayout`, registered in `apps/web/src/data/lab-pages.ts`.
- `apps/web/src/components/lab/system-instrument/SystemInstrument.svelte`
  composes native seed input, shared action buttons and `FlightLayers`.
- `apps/web/src/lib/system-instrument/config.ts` defines its Zod document
  contract from `SolarSystemGenerationSchema`. The default seed is 2026.
- `apps/web/src/lib/system-instrument/scene.ts` creates a production `Simulation`
  in generated mode and renders its unchanged star and retained planets through
  `drawFlightFrame`. It uses the shared planet appearance adapter and production
  mercurial map, with the [render contract](../../game/render/spec.md)'s layers,
  field markings, body composition, culling and fallback.

## Contract

### Controls and state

- The page is titled System instrument. Its only authoring controls are one
  labeled Seed number field and two buttons, Generate and Randomize. It has no
  burger button, overlay pane, document editor, timeline, piloting or zoom input.
- The seed field and both actions float over the top of the full instrument
  viewport, with the displayed seed at the top right. They reserve no layout
  row and have no toolbar strip, raised container fill or divider behind them.
  Generate and Randomize use the design system's normal action variant
  (`.btn.btn-normal`), including its brackets, focus and unavailable states.
- Opening displays the system for seed 2026. Editing the field only changes the
  draft. Generate validates the draft integer in 1–2147483647 and replaces the
  preview with that seed's system. Enter submits Generate.
- Empty, fractional, nonfinite and out-of-range values produce an accessible
  field error and retain the last valid preview. Generation failure is visible
  and also preserves the last valid system. Errors clear on successful generation.
- Randomize chooses a valid seed different from both the displayed system seed
  and any valid draft, writes it to the field, and immediately regenerates.
  Browser randomness chooses only this input; world generation remains seeded
  and reproducible. Randomize recovers from an invalid draft.
- Read-only text identifies the displayed seed even while the draft differs or
  is invalid. Generating the same seed yields the same complete world.

### Preview and lifecycle

- The static overview shows the Sun, every retained planet, normal materials,
  body light, orbit/name/gravity HUD, Sun danger and charging boundaries, and
  the shared 1200u arena warp boundary.
  Removed planets have no preview entries. It draws no ship or gameplay effects
  and advances no simulation time or score.
- Generation and viewport resize automatically fit the complete system, including
  circular paths, field boundaries and the complete warp boundary, with space
  for HUD labels. Resize changes presentation only and preserves the draft,
  displayed seed and generated world.
- Material preparation happens outside drawing. Completion redraws the current
  system, including when the seed changed during loading. Failed material loading
  retains normal stock-disc fallback and HUD with a visible status message.
- Each instance owns its projection, painter and scene. Teardown disconnects
  resize handling and disposes resources; late material results do not attach
  to a disposed instance. No animation loop runs for the static preview.
- The Lab supports widths of 1280px and above. Controls use shared tokens,
  action-button styling, keyboard focus and accessible error association.

### Scenarios

```gherkin
Scenario: Reproduce a system
  Given the default seed is visible
  When I enter another valid seed without generating
  Then the previous system remains visible with its displayed seed
  When I select Generate
  Then the preview matches production generation for the entered seed at tick zero

Scenario: Recover from invalid input
  Given a valid preview
  When I generate with an empty or fractional seed
  Then a field error is shown and that preview is retained
  When I select Randomize
  Then a valid new seed appears in the field and its system replaces the preview

Scenario: Preserve a system through resize
  Given a generated preview
  When its viewport resizes within supported Lab widths
  Then the whole system is fitted without changing its seed or world state
```
