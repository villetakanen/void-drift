# Render model

## Context

The Render model Lab is a small workbench for understanding the actual rendering
layers: what each holds, how painted light fades, and how the browser combines
colours across layers. It provides a shared picture for discussing and testing
the renderer's Hi-Fi Lo-Fi character.

The workbench paints simple coloured marks. It runs no game simulation, flight
program, encounters or ship controls. A ship or planet may be useful as a drawing
sample in a later experiment; gameplay is not the subject of this page.

## Architecture

The [render contract](../../game/render/spec.md) owns the layer model.
`FLIGHT_LAYERS` in `packages/mode-a/src/lib/flight-frame.ts` supplies the production
stack and defaults. `apps/web/src/components/FlightLayers.svelte` supplies the
same isolated canvas stack used by play. Persistent FX uses the production
`FxSurface` from `packages/core/src/lib/effects/fx-surface.ts`, including its
emission budget and decay. The workbench supplies test marks and a presentation
clock, not an alternative accumulation algorithm.

World is cleared and redrawn with ordinary marks. FX receives fresh stamps and
retains their fading image. LFX is cleared and redraws its current marks without
image history. CSS on each canvas composites the layers; controls change how
the existing image is displayed, not the pixels already held by that layer.

The page owns temporary experiment settings. They do not change production
defaults or persist across reloads. Inputs use a finite set of supported choices;
there is no external configuration or storage contract.

## The workbench

`/lab/render-model` remains in the Lab's Tools group, for viewports 1280px wide
and up. `apps/web/src/components/lab/RenderModel.svelte` composes the workbench.

- One large pane shows World, FX and LFX in production stack order.
- A fixed set of overlapping coloured shapes makes individual colours and their
  intersections easy to compare. Each layer's marks and colour are identified
  beside the pane. Shapes and colours are simple experiment fixtures, not a
  permanent art recipe.
- Each layer has a visibility control and a blend selector: Normal, Add, Screen,
  Multiply and Hard light. Add maps to CSS `plus-lighter`. Initial settings use
  production defaults. A blend or visibility change immediately affects the
  composite, even while paused, without clearing, repainting or advancing time.
- Paint adds one fresh set of FX stamps and shows the World and LFX sample marks.
  It works while paused as an explicit painting action; subsequent paused frames
  add nothing. Repeated Paint actions can demonstrate accumulation.
- Run advances the presentation clock so FX fades. Pause freezes that clock and
  the accumulated image. World and LFX remain visible while FX fades away.
- Clear empties all sample marks and FX history immediately, even while paused.
  The pane stays empty until Paint; visibility and blend selections are retained.
- The page opens paused with a sample already painted, ready for blend comparison.
- Brief plain-language explanations identify World as ordinary drawing, FX as
  accumulated fading light, and LFX as fresh light with no retained image.
  Labels distinguish a layer's blend with the layers beneath it from FX decay.

Controls are deliberately limited to the questions above. Colour pickers, zoom,
resolution, filters, moving plumes and Deck overlays can be added when a specific
experiment calls for them. All layers remain at production resolution in this
version. Pass lists, source-file inventories, timing tables and scripted flight
are not part of the workbench.

## Contract

### Definition of Done

- [x] The page shows the production three-layer stack in one isolated pane,
  with visible overlapping test marks and no game simulation.
- [x] Each layer's visibility and all five blend choices affect CSS immediately
  while paused, preserving its backing pixels and other layer settings.
- [x] Paint emits into the shared FX surface; successive painting accumulates
  light, Run fades it, and Pause keeps its pixels stable.
- [x] World and LFX retain their current sample while FX fades; LFX retains no
  previous image when redrawn.
- [x] Clear removes all marks and history while paused or running; Paint after
  Clear starts fresh, and experiment settings survive Clear.
- [x] The page is usable at 1280px and wider, with labelled keyboard-accessible
  controls and concise explanations of the visible experiment.
- [x] Existing play and the Flight scene study retain their production layer
  defaults and rendering behaviour (`tests/browser/alpha.spec.ts` and
  `tests/browser/flight-scene.spec.ts`).

### Regression guardrails

- Shared layer and persistence owners provide the rendering machinery. The Lab
  supplies only marks, presentation time and temporary display settings.
- Hiding a layer changes its visibility, not whether its clock or history runs.
- An untouched paused frame neither emits nor fades. Explicit Paint and Clear
  are permitted edits to the paused picture.
- The page does not import or instantiate a game simulation or modify game data.
- Tests protect layer semantics and control behaviour; fixed art screenshots do
  not become a permanent recipe for the experiment.

### Scenarios

```gherkin
Scenario: Compare blending on a held picture
  Given the initial paused overlapping marks
  When Screen is changed to Hard light on LFX
  Then the browser recomposites the same layer images immediately
  And FX does not emit, fade or clear

Scenario: Observe persistent and fresh light
  Given freshly painted marks on all layers
  When Run advances presentation time
  Then FX fades through the production surface decay
  And World and LFX continue showing their current marks
  When Pause is selected
  Then the accumulated image stops changing

Scenario: Paint and clear while paused
  Given a paused picture with chosen layer blends
  When Paint is pressed again
  Then fresh FX light accumulates once
  When Clear is pressed
  Then all sample marks and FX history disappear
  And the selected blends remain unchanged
  When Paint is pressed
  Then a fresh sample appears without old history

Scenario: Hide a fading layer
  Given a running picture with fresh FX light
  When FX is hidden and presentation time passes
  And FX is shown again
  Then its image reflects the elapsed decay
  And hiding it has not paused or restarted its history
```
