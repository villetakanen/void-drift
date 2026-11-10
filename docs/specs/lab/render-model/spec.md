# Render model

## Context

The Render model Lab is a small workbench for understanding the actual rendering
layers: what each holds, how painted light fades, and how the browser combines
colours across layers. It provides a shared picture for discussing and testing
the renderer's Hi-Fi Lo-Fi character.

The workbench has two selectable pictures: a rotating production Wasp and the
original coloured circles. It runs no game simulation, flight program,
encounters or ship controls. The Wasp stays at the pane centre and rotates at
the assembled ion maximum turn rate (180 degrees/second, a two-second turn).
Production mounted main and direction-matched stabilizer plumes continuously
stamp FX history. Three production ion-beam marks point right in fixed screen
space: one through the centreline and two just outside the Wasp's sweep above
and below. They flash for the production 80 ms window on a 1/3-second cadence;
their dispersed marks also stamp into FX history. This is a rendering fixture,
not flight certification.

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
- The pane stays in view while scrolling the controls.
- Rotating Wasp is the default sample: one production-built Wasp at flight
  scale in World, production mounted engine and stabilizer plume stamps in FX,
  and three production ion-beam marks in LFX. The beams stay horizontal and
  point right while the ship turns, flashing on the production cadence. Their
  dispersed marks also stamp into FX. Circles remains selectable as the original
  colour comparison sample.
- Changing sample clears all layer images and FX history and paints the chosen
  sample fresh. It retains blend, visibility, filter and paused/running settings.
- Each layer has a visibility control and a blend selector: Normal, Add, Screen,
  Multiply and Hard light. Add maps to CSS `plus-lighter`. Initial settings use
  production layer blends, with FX CSS blur 2px and LFX no filter. A blend or visibility change immediately affects the
  composite, even while paused, without clearing, repainting or advancing time.
- FX and LFX each have an independent native presentation filter: None, Blur,
  Brightness, Noise distortion, Offset, Offset spread or Expand, plus one
  amount control. The UI labels blur radius, displacement scale, offset, spread
  and expand radius in CSS pixels; brightness shows its multiplier. CSS filters are used for
  blur/brightness; inline SVG filters provide static seeded turbulence,
  displacement, offsets, spread merge and morphology. Filter changes preserve
  held pixels and do not advance time. FX defaults to CSS blur 2px; LFX defaults
  to None. This FX blur is scoped to the render-model workbench.
- Paint adds one fresh set of FX stamps and shows the World and LFX sample marks.
  It works while paused as an explicit painting action; subsequent paused frames
  add nothing. Repeated Paint actions can demonstrate accumulation.
- Run advances the presentation clock, rotates the Wasp and stamps its current
  plume pose into the persistent FX surface. Ion beams pulse into LFX and add
  dispersed light during each flash. Pause freezes angle, pulse phase and
  history. World redraws at the held pose; LFX remains in fixed screen space.
- Clear empties all sample marks and FX history immediately, even while paused.
  The pane stays empty until Paint; visibility and blend selections are retained.
- The page opens paused with a sample already painted, ready for blend comparison.
- Brief plain-language explanations identify World as ordinary drawing, FX as
  accumulated fading light, and LFX as fresh light with no retained image.
  Labels distinguish a layer's blend with the layers beneath it from FX decay.

Controls are deliberately limited to the questions above. Colour pickers, zoom,
resolution and Deck overlays remain outside this experiment. All layers remain
at production resolution. Pass lists, source-file inventories, timing tables and scripted flight
are not part of the workbench.

## Contract

### Definition of Done

- [x] The page shows the production three-layer stack in one isolated pane,
  with visible overlapping test marks and no game simulation.
- [x] Each layer's visibility and all five blend choices affect CSS immediately
  while paused, preserving its backing pixels and other layer settings.
- [x] Artwork uses shared production painters; sample switching clears history and
  repaints while retaining presentation settings.
- [x] FX and LFX have independent native filters, default None; changing a filter
  changes presentation while paused without changing backing pixels or time.
- [x] Paint emits into the shared FX surface; successive painting accumulates
  light, Run fades it, and Pause keeps its pixels stable.
- [x] World and LFX retain their current sample while FX fades; LFX retains no
  previous image when redrawn.
- [x] Clear removes all marks and history while paused or running; Paint after
  Clear starts fresh, and experiment settings survive Clear.
- [x] The page is usable at 1280px and wider, with labelled keyboard-accessible
  controls and concise explanations of the visible experiment.
- [x] The artwork pane remains visible while scrolling filter controls.
- [x] Rotating Wasp stays centred, completes a two-second full turn, emits the
  production main and direction-matched stabilizer plumes into persistent FX,
  and holds angle/history on Pause; three production beams remain fixed and
  point right, flashing at 3 Hz for 80 ms in LFX with dispersed FX stamps.
  Production LHI stabilizer outputs select the exhaust pair whose moment
  opposes turn direction.
- [x] Existing play retains its production layer defaults and rendering
  behaviour (`tests/browser/alpha.spec.ts`); the Flight scene study uses its
  separately scoped layer instrument.

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

Scenario: Rotate the Wasp fixture
  Given the paused Wasp sample
  When Run advances by one full turn
  Then the hull returns to its starting angle at the same centre
  And each mounted plume pose has been stamped into persistent FX history
  And the three LFX beams remain fixed and point right
  When Pause is selected
  Then angle and FX history stop changing
```
