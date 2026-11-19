---

title: "Spec: Sky instrument"
status: draft
generated: { by: codex/gpt-6, at: "2026-11-19T11:13:02+00:00" }
verified: [{ by: codex/gpt-6, at: "2026-11-19T11:17:49+00:00" }]
---

# Spec: Sky instrument

## Blueprint

### Context

At `/lab/sky-instrument` a designer can compare intermediate reaches of the Milky Way with the same dust and framing, then vary dust independently. The opening view uses the fixed Sol recipe. [Distant flight sky](../../game/render/flight-sky/spec.md)

### Architecture

The Lab Tools registry links the instrument. The page composes the shared sightline selector and procedural image generator. A worker prepares the selected sky and lower-resolution comparison images. Each preview uses a clipped, browser-scaled repeat of one prepared image. Controls inspect local parameters and report preparation status.

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
