# Route: from one canvas to the layered renderer

Written 10 November 2026 on `feat/0-5-0`, after `f9fc929`. It records a
conversation about the render model and a proposed way from today's code to
it. The intended contract is drafted in
[the render spec](../specs/game/render/spec.md); this is the plan to reach it.
Check both against the code before acting.

## What we found

- The intended renderer was always layered canvases composited by the browser,
  with CSS blend modes and other browser natives producing the 1990s effects.
- The code draws everything onto one canvas. The light surface's history lives
  in hidden canvases and is copied onto that canvas each frame with the canvas
  composite operation `lighter`. No CSS blending is used in flight.
- Nothing in the specs described a render model, so the difference went
  unnoticed. The [stamp gaps blocker](2026-11-10-fx-stamp-gaps-blocker.md)
  surfaced it.

## Decided in the conversation, 10 November 2026

- The render model gets its own game spec, `docs/specs/game/render/spec.md`.
- The stack, bottom to top: World with World HUD (normal, immediate), FX (add,
  persistent, fades), LFX (hard-light, could be screen, immediate), Deck.
- Distortion is CSS only and super cheap.
- Derelict apertures become a cut in the FX layer, since the stack has no solid
  layer above light.
- The whole concept is demo-scene style abuse of the engine: as demos once drew
  with sound circuits, the game abuses CSS and other browser natives for its
  effects. The render spec states it as "The demo-scene method".

## Assumed or likely, not decided

- The ship and derelicts are on World; sparks stay on FX.
- The countdown is on FX today. It might need to be split between LFX (the
  live glyph) and FX (its afterglow); open, said by the designer on
  10 November.
- Every layer has a resolution setting, full by default. Not decided: "dunno,
  sounds good".
- The zoom range the light rules must hold over will likely run from the
  study's 4× out to the whole system in view, even where that is larger than
  today's range. The render spec is drafted to that range; the camera spec does
  not yet describe it.

## Left open on purpose

- Whether solid things are interpolated between ticks. No need to speculate;
  the render spec takes no position.

## Why the way out is short

- Every draw onto the flight canvas goes through `FLIGHT_PASSES`
  (`packages/mode-a/src/lib/flight-frame.ts`). Layers are a property added
  there.
- `FxSurface.draw` already takes the canvas it composes into and an `additive`
  flag. Given its own cleared canvas with `additive` off, CSS does the adding
  and its internals stay as they are.

## Route

Each step is usable before the next.

1. **Settle the spec.** Decide what is still listed as assumed or likely.
2. **Split the canvases with no visible change.** `FLIGHT_LAYERS`, a layer on
   each pass, one canvas per layer in an isolated stage, FX blended by CSS at
   full resolution. The aperture pass becomes a cut. The existing browser
   tests are the check that the picture holds.
3. **Fix the stamp gaps** as the blocker plan describes. The fix paints into
   the FX layer in either model. Doing it after the split means the trail is
   judged on the real layer.
4. **Rebuild the render model page on real layers:** hide, solo, blend,
   resolution and filter per layer as element settings.
5. **Tune the look** as design work: LFX hard-light against screen, FX
   resolution and pixelation, CSS filters.
6. **Move studies and Lab benches** that draw the frame themselves onto the
   shared stage, starting with the flight-scene study, which is the blocker's
   reproduction.

## Step 2 as built, 10 November 2026

- `FLIGHT_LAYERS` and a layer on every pass in `flight-frame.ts`; the stage's
  canvases are `apps/web/src/components/FlightLayers.svelte`, used by
  `FlightDeck` and the render model page. FX and LFX are composited by CSS
  `plus-lighter` inside an isolated stack.
- **LFX is add today, not hard-light.** The ion beams were already drawn with
  the canvas `lighter` operation, so `plus-lighter` is what keeps the picture.
  Hard-light against screen is still step 5.
- **Apertures:** the black hollow centre is now a World pass after the ship,
  and the FX layer is cut with the same shape.
- **Picture check:** the render model scene was captured at five fixed ticks
  before and after, 410 293 pixels each. Two ticks match within one colour
  level. Three differ on 41 to 179 pixels, all at aperture rims: light is now
  removed before it is added, where before black was painted over light that
  had already clipped to white, so rim pixels under saturated light are
  brighter than they were.
- **Found on the way:** the sun's field rings size their dashes from the
  canvas's CSS width (`drawSunFields`), so the same frame draws different
  dashes in a differently sized element. The comparison had to correct for a
  2px border.
- **Not done here:** studies and Lab benches that draw the frame themselves
  (`FxBench`, the flight-scene study) still use one canvas.

## Risks and unknowns

- **iPad Safari performance** with full-screen blended canvases. Desktop frame
  time can be measured on `/lab/fx`; a device has not been measured.
- **Blend mode support.** `plus-lighter` matches the current `lighter`
  exactly; which browsers we need have it is unverified. `screen` is the
  fallback and looks different.
- **Hard-light artwork.** Dark or saturated LFX pixels darken what is beneath,
  so LFX drawings must be transparent wherever they should have no effect.
- **Pixel-reading tests** see one layer at a time, not the composite.
- **Title fade and stage opacity** must keep working with blended children.

## Not in this route

- Moving or cleaning the effects spec, which still sits under `factory/` and
  carries status notes. It should follow once the render spec holds.
