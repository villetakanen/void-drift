---

generated: { by: codex/gpt-6.2, at: "2026-11-21T19:23:59+00:00" }
verified:
- by: "human:ville-takanen"
  at: "2026-11-21T19:26:34+00:00"
---

# Sky instrument

## Blueprint

### Context

At `/lab/sky-instrument` a designer can compare intermediate reaches of the Milky Way with the same dust and framing, then vary dust independently. The opening view uses the fixed Sol recipe. [Distant flight sky](../../game/render/flight-sky/spec.md)

### Architecture

The Lab Tools registry links the instrument. The screen composes existing standard instrument parts: [SideSheet](../../factory/design-system/side-sheet/spec.md) holds the Sightline controls over the full-width preview and comparison area, and [RingSlider](../../factory/design-system/inputs/spec.md) supplies the continuous parameter controls. The screen owns its local sightline and input state; these shared contracts own the parts’ interaction and presentation.

Sky generation follows the [distant flight sky contract](../../game/render/flight-sky/spec.md): the shared [Sol recipe and system sightline selection](../../../../packages/mode-a/src/lib/flight-sky.ts), [seed schema](../../../../packages/core/src/lib/schemas/flight-sky.ts) and [tile generator](../../../../packages/core/src/lib/assets/flight-sky.ts) supply the sky material. The shared [preparation helper](../../../../apps/web/src/lib/assets/flight-sky/prepare.ts) runs its worker for the selected sky and lower-resolution comparison images. Each preview uses a clipped, browser-scaled repeat of one prepared image through the local SkyView and shared [tile presentation helper](../../../../apps/web/src/components/sky-tile.ts). Controls inspect local parameters and report preparation status.

[Lab instrument](../../../../apps/web/src/components/lab/sky-instrument/SkyInstrument.svelte) · [Image preparation worker](../../../../apps/web/src/lib/assets/flight-sky/prepare.worker.ts)

### Constraints

- The five comparison images use shape values 0, 0.25, 0.5, 0.75 and 1, with identical dust and framing.
- The full preview supports continuous reach adjustment, independent dust seed, heading, pattern scale and camera travel.
- The Lab supports widths of 1280 CSS pixels and above. Controls support keyboard use.

## Contract

### Definition of Done

- A designer can load a system by seed, inspect intermediate values, and restore the Sol view.
- Selecting a comparison opens that breadth in the full preview.
- Presentation adjustments reuse the existing image.

### Regression guardrails

- Invalid seeds leave the last valid selection intact.
- Rapid edits present the latest request. Leaving releases worker and image resources.
- Instrument controls affect only the Lab.

### Scenarios

```gherkin
Scenario: Compare one dust structure
  Given the instrument opened at Sol
  When the designer selects a comparison or adjusts reach
  Then the full preview shows that reach with the same dust seed and placement

Scenario: Inspect a generated system
  Given a valid system seed
  When the designer loads it twice
  Then shape, dust and placement recur
  And applying only a dust seed preserves the shape and placement

Scenario: Pan a prepared sky
  Given the preview has finished preparing
  When the designer changes heading, scale or camera travel
  Then the same prepared image is presented with the new transform

Scenario: Recover the reference
  Given a modified sky
  When the designer restores Sol
  Then the reference shape, dust, heading, scale and camera travel return

Scenario: Invalid and superseded requests
  Given a visible sky
  When the designer enters an invalid seed or replaces a pending selection
  Then invalid input is identified and only the latest valid request can replace the preview
```
