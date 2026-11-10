# Render model

## Context

The render model page is where the people building the game look at how a
flight frame is put together and talk about it: which passes exist, in what
order they draw, which coordinate space each one lives in, how each is
composited and what sits above the canvas. It shows the game's own frame, taken
apart, so a conversation about the render architecture points at the thing
itself instead of at a description of it.

It is a presentation and an instrument. It decides nothing: a change to the
render model is made in the [render](../../game/render/spec.md) contract and
the frame definition, and the page
then shows it.

## Architecture

### What it shows

The [render](../../game/render/spec.md) contract owns the model: frame time,
spaces, pass kinds and the in-flight frame's pass order. The page draws through
the game's `drawFlightFrame` and lists the game's `FLIGHT_PASSES`
(`packages/mode-a/src/lib/flight-frame.ts`), using its `include` and `observe`
options. A pass added, removed or reordered there changes the game and the page
together. The page restates none of the model's rules.

The title backdrop is a different frame and is outside this page.

### The scene

One production `Simulation` in Derelicts mode with a fitted, armed ship and
wrecks supplied by the page, flown by a fixed input program, framed by the
production `Camera` with the simulation's own camera settings and drawn by the
production `Renderer` and `FlightFx` on a 1920 by 1080 logical canvas. The
scene restarts when the run ends or its program completes. Nothing is scored or
saved.

### The page

`/lab/render-model`, named "Render model" in the Lab's Tools group, for
viewports 1280px wide and up. The component is
`apps/web/src/components/lab/RenderModel.svelte`.

- **Frame:** the live canvas.
- **Passes:** one row per entry of `FLIGHT_PASSES`, in draw order, numbered,
  showing its name, space, composite operation, description, source file and
  recent draw time. Each row has a visibility toggle and a Solo control. Solo
  shows that pass alone on the void; choosing it again returns to the toggled
  set. A build-up control draws the first _n_ passes, so the frame can be
  walked from the void to the complete image.
- **Transport:** Run or Pause, Step one simulation tick while paused, and
  Restart.
- **Frame loop:** the order of one animation frame: input, fixed-step
  simulation, camera, the canvas passes, then the page elements above the
  canvas.
- **Above the canvas:** the page-element layers that stack over the frame (the
  deck, dialogs and status messages) with their `--layer-*` tokens and the
  values read live from `packages/core/src/lib/styles/tokens.css`.

With the Void pass hidden nothing clears the canvas, so each frame draws over
the last; that is what the pass is for, and the page shows it.

Visibility, Solo and build-up change only which passes draw. The simulation,
the camera and every drawn pass's own output are unaffected. A hidden light
surface accumulates no history; shown again, it starts from fresh emission.

Draw times are measurements on the viewing machine, for comparing passes with
each other. They are not a performance contract; the effects layer owns its
own.

## Contract

### Definition of Done

- [x] `/lab/render-model` lists one row per pass in draw order and draws a
  running frame (`tests/browser/render-model.spec.ts`).
- [x] Hiding a pass, Solo and build-up change which passes are reported as
  drawn while the simulation's tick count keeps advancing
  (`tests/browser/render-model.spec.ts`).
- [x] The page is listed in `apps/web/src/data/lab-pages.ts` under Tools with
  source `production`.

### Regression guardrails

- The pass list on the page is read from `FLIGHT_PASSES`; the page holds no
  pass names, order or descriptions of its own.
- The page imports no game mode (`scripts/check-contracts.mjs`).
- The page's controls never change the simulation's state or the game's frame.
- Layer values shown for page elements are read from the tokens, never typed
  into the page.

### Scenarios

```gherkin
Scenario: Read the frame's order
  Given the render model page
  When it loads
  Then the passes are listed in the order the game draws them
  And the canvas shows the complete running frame

Scenario: Look at one pass alone
  Given the complete running frame
  When the developer chooses Solo on the light surface
  Then only the light surface draws, on the void
  And the simulation keeps running
  When the developer chooses Solo on it again
  Then the previously visible passes draw again

Scenario: Walk the frame from the void
  Given the build-up control at its first step
  When the developer advances it one step at a time
  Then each step adds the next pass in draw order
  And the last step shows the complete frame

Scenario: Hide a pass
  Given the complete running frame
  When the developer hides the starfield
  Then every other pass draws as before
  And the starfield reports no draw time

Scenario: The run ends
  Given the scene's ship is lost
  When the next frame is drawn
  Then the scene restarts from its beginning
```
