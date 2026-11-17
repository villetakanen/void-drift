# Render

## Blueprint

### Context

During flight the game shows one picture many times a second from a simulation
that advances in fixed steps. The picture is a stack of layers the browser
composites. Game code draws marks onto layers; the browser's own blending,
scaling and filters, used the way a demo abuses its machine, turn those marks
into the game's 1990s effects. This
contract says what the layers are, what is drawn on each and in what order, how
a drawn frame relates to simulation time, and what a layer may remember. It is
the shared model the screen, the camera and the effects are specified against,
and the one people point at when they discuss how the game renders.

### Architecture and boundaries

- `packages/mode-a/src/lib/flight-frame.ts` defines the in-flight frame:
  `FLIGHT_LAYERS`, the ordered layers, `FLIGHT_PASSES`, the ordered passes with
  the layer each draws on, and `drawFlightFrame`, which draws them.
- `apps/web/src/components/FlightLayers.svelte` is the stage's canvas stack:
  one canvas per layer, composited by CSS.
- `apps/web/src/components/FlightDeck.svelte` runs the frame loop, hosts the
  layers and draws the in-flight frame only through `drawFlightFrame`.
- `apps/web/src/components/studies/flight-scene.ts` uses the same layer stack
  and ordered frame passes for the Flight scene instrument; its replay paints
  historical light through the shared FX pass.
- This contract owns frame time, the spaces, the layer model and the order of
  layers and passes.
- [Camera](../camera/spec.md) owns the world-to-stage transform.
  [Game screen](../game-screen/spec.md) owns the stage, its fit to the viewport
  and the deck's placement. [Effects](../../factory/effects/spec.md) owns light:
  what emits it, how it accumulates and decays, its budget, and the look each
  light layer's blend, resolution and filter are tuned to. Each pass's
  appearance belongs to the feature that draws it.
- The title backdrop is a separate frame owned by the
  [title screen](../landing-page/spec.md).
- The [render model page](../../lab/render-model/spec.md) shows this model in
  the Lab.

### The demo-scene method

The renderer treats the browser as the machine a demo is written for. Demo
coders made hardware do what it was not built for, such as drawing with sound
circuits. Here the browser's page machinery is that hardware: blend modes,
filters, image scaling, transforms and opacity, all built for laying out
documents, are used to make cool, expressive graphics with inexpensive methods.
This is the Hi-Fi Lo-Fi intent: use the artefacts of cheap rendering as part of
the picture's character.

- **Natives first.** An effect is looked for first in a browser native used
  sideways. Drawn code is the last resort, for what no native can do.
- **Cheap is the look.** The artefacts of doing it cheaply (stepping, banding,
  pixelation, hard blends) belong to the style and are kept, not corrected.
- **Game code draws marks:** shapes, images and cached stamps, onto a layer's
  canvas. Having the browser scale and draw images counts as drawing marks;
  looping over pixels per frame does not.
- **The browser composites:** a layer's blend mode, its scaling from its own
  resolution to the stage, its filter and its opacity are CSS on the layer's
  element.
- **No game code blends, blurs, scales or distorts pixels.** The one thing
  drawn code does to an existing image is fade the FX layer's history, because
  the browser has no native that accumulates.
- **A native changes how a layer is shown, never what the layer holds.**

### World bodies

A world body is a planet or another natural body in flight. Every body is drawn
the same way; what differs between bodies is data.

- **Parts on World.** A body is a stack of parts, such as a surface, clouds and an
  atmosphere, drawn far to near on World. Each part is drawn without light or
  shade of its own.
- **Light and dark on LFX.** Each body's light and dark side is one stamp on LFX,
  turned to face its star and sized to cover its outermost surface. The shared `body-light` pass draws these stamps before
  every other LFX pass, so beams and
  halos are drawn over it. It may darken whatever lies beneath it; over a ship
  this reads as the body's shadow.
- The stamp has incoming-light intensity, shadow intensity and incident-light
  temperature parameters. At incoming intensity 1, shadow intensity 1 and the
  neutral 5800 K reference, its original grayscale baseline is unchanged. The
  shared production and Inspector defaults are incoming intensity 1.35, shadow
  intensity 1.35 and neutral-reference temperature 5800 K.
  Incoming intensity scales only values above the hard-light neutral 0.5;
  shadow intensity scales only values below it. Temperature tints only the
  bright side, relative to 5800 K; every tinted bright channel stays at or
  above 0.5. The temperature mapping is a display approximation, not
  colorimetry or a stellar spectrum.
- Bodies with the same prepared parameter tuple share one stamp. Star direction
  changes only the Canvas transform, never the stamp's pixels. Preparation
  finishes before frame drawing; drawing only looks up and draws a prepared
  stamp and never creates or rebuilds a pixel mask. Prepared storage contains
  the production default and tuples with active users; it releases custom
  tuples when their users stop needing them.
- **Surfaces.** A body has one or two turning surfaces. The lower surface is the
  ground and has the body's radius. An upper surface lies over it, may be partly
  transparent and may have a larger radius than the body; its map carries its
  opacity. Anything else in the stack, such as haze or an atmospheric arc, is
  drawn with native shapes and gradients, not as a turning surface.
- **Rotation.** Each surface's turn comes from simulation ticks on its own
  period, independently of the other surface, its orbit and its light. A
  turning surface is drawn with the browser's image drawing from a map prepared
  at load. It is sized to its own diameter on screen and redrawn only when that
  surface has visibly moved. The same tick gives the same picture, whatever
  frames were drawn before it.
- **Cost.** No game code loops over pixels per frame; pixel work happens at load.
  Visibility uses each body's complete visual bounds. A stock or fallback disc
  includes half its outline stroke, `max(1, radius × 0.06) / 2` world units;
  Venus's body bounds also include half its atmosphere stroke,
  `max(0.65 / zoom, radius × 0.065) / 2` world units; a body with an atmosphere
  includes everything drawn out to its air's edge; a light stamp uses its disc
  radius. The `planets` pass draws the complete body composition when its combined
  visible bounds intersect or touch the view, and skips body, surface and
  atmosphere drawing when they are wholly outside. The light pass draws when its
  stamp bounds intersect or touch the view, and skips it when wholly outside.
  A body appearance supplies inclusive world-coordinate bounds for its complete
  World composition and, when it supplies a light callback, its LFX composition.
  Bounds must be finite and ordered; invalid appearance bounds are a development
  error. Missing appearance data uses the stock body; a body without a light
  callback contributes no light stamp.
  World HUD visibility is independent: an orbit or gravity boundary that crosses
  the view remains visible when its body's visual bounds are outside.
- **World HUD.** Every planet has the same orbit, gravity boundary and upright
  name. One shared screen-space `world-hud` pass draws these marks for the full
  planet list after the star and before the planets pass. Bodies therefore cover
  orbit, gravity and leader lines. The existing world-space `sun-fields` pass
  draws the star's field rings and designation before `world-hud`.
- World HUD strokes are 1 CSS px and all World HUD text is 14 CSS px, independent
  of camera zoom and canvas backing resolution. Each pass derives its drawing
  scale from the canvas's displayed CSS size and current transform once, then
  shares it across its marks. Production stages preserve a uniform CSS scale.
- Planet identity and full-system ordinal come from validated HUD identity data.
  A name is drawn as supplied; an unnamed planet uses its star's name, otherwise
  denomination or type, followed by `.` and its outward ordinal. Named planets
  occupy an ordinal. The full system assigns ordinals before any instrument
  filters the list, so filtering never renumbers a planet. See the
  [planet contract](../world/planets/spec.md#names).
- **Identity.** No pass is written for a particular body. A typed runtime map
  associates appearances with each simulation body's validated, unique
  full-system `systemPosition`; filtering or replaying a simulation preserves
  the association. Missing ordinals cannot select a custom appearance and use
  stock drawing. The `planets` and `body-light` passes read the map and draw each
  body's ordered World parts and optional LFX part.
- **Ownership.** Body painters and their material preparation live in
  `packages/core`. Play loads no asset from a study folder. A surface map may be
  authored raster art.
- **Failure.** When a body's material cannot be prepared, the stock body is drawn
  with the same World HUD, and the simulation is unaffected.

### Time

- **Tick:** one fixed simulation step of 1/60 s. Game time is the tick count
  times the step. Only ticks change the simulation.
- **Frame:** one drawing of the layers, at whatever rate the display allows.
- **Interval:** each frame presents the game time between the previous frame
  and itself. An interval holds zero, one or several ticks, six at most.
- **Current state:** what has a position now (the world, the ship, the
  derelicts, live light) is drawn from the simulation's current state.
- **Everything in between:** accumulated light accounts for the whole interval,
  including where its sources were during it.
- **Empty interval:** a frame with no tick, as when paused, shows the same
  picture. Nothing moves, emits or fades.

### Spaces

| Space  | Unit                                               | Used for                        | Conversion owned by        |
| ------ | -------------------------------------------------- | ------------------------------- | -------------------------- |
| World  | World units                                        | The simulation and world passes | Camera, to stage           |
| Stage  | Logical pixels, 1080 high, width by viewport ratio | The layers and screen passes    | Game screen, to CSS pixels |
| Screen | CSS pixels                                         | The deck                        | The browser                |

A pass draws in exactly one space: `screen` passes draw in stage pixels with no
transform, `world` passes draw under the camera transform.

### Layers

A layer is one element in the stage. The stage is its own blending group:
layers blend with the layers beneath them in the stage and with nothing behind
it. Every canvas layer covers the whole stage and declares:

- **Blend:** the CSS blend mode it is composited with.
- **Memory:** `immediate` or `persistent`.
- **Resolution:** its canvas size as a fraction of the stage. The browser
  scales it to the stage.
- **Filter:** an optional CSS filter.

The in-flight stack, bottom to top:

| Layer | Holds                                  | Blend      | Memory     |
| ----- | -------------------------------------- | ---------- | ---------- |
| World | Everything solid, and the World HUD    | normal     | immediate  |
| FX    | Accumulated light that fades           | screen     | persistent |
| LFX   | Live light, fresh every frame          | hard-light | immediate  |
| Deck  | Page elements: instruments, pads, rows | normal     | none       |

Layer-specific contracts live in [World](world.md), [FX](fx.md), and
[LFX](lfx.md). Blend and resolution defaults are declared in `FLIGHT_LAYERS`;
presentation filters are owned by `apps/web/src/components/FlightLayers.svelte`
and judged by looking. Changing them changes no pass behavior. World defaults
to normal with no filter. FX defaults to CSS `screen` with the shared Turbulent
bloom filter (12 CSS px glow, 16 CSS px distortion, 90% strength). LFX defaults
to CSS `hard-light` with no filter. FX remains at full stage resolution.

Three rules follow from the stack:

- Solid things are drawn on World only. Nothing solid sits above light.
- Where something solid must stay readable through accumulated light, the FX
  layer is cut there so World shows through.
- The deck is above every canvas layer and outside the camera transform.

An **immediate** layer is cleared and redrawn every frame from the simulation's
state, the camera and game time. The same state gives the same layer.

A **persistent** layer keeps its image between frames. That image is
presentation state: it is built only from what the simulation did, is anchored
to the world so camera movement does not displace it, and is discarded when the
run resets. It meets three rules:

- **Interval coverage:** it presents the whole interval. A source that moved
  during the interval leaves its mark along the path it took, not only where it
  ended.
- **Rate independence:** the same ticks give the same image, within the
  tolerance of 8-bit colour, whether they arrive one per frame or several.
- **Breaks:** a discontinuity in the simulation (arena wrap, reset, a source
  switching on) is a break in the mark. Nothing is drawn across it.

These rules apply at the zooms used by play and explored in the Lab. Zoom limits
remain exploratory: Follow 4× is a Lab hypothesis and reproduction view, not a
guaranteed maximum, and the whole-system view is not a guaranteed minimum. FX
remains full resolution while those limits are explored.

### The in-flight frame

`FLIGHT_PASSES` in `packages/mode-a/src/lib/flight-frame.ts` is the list of passes.
Each entry names its layer, its space and what it draws. The
[render model page](../../lab/render-model/spec.md) lists them beside its workbench.

- Array order is draw order within each layer.
- Within World, passes draw far to near: the void, the background, the world's
  bodies, then the ship.
- A new pass takes the position its depth gives it in that order.

### Authority

Rendering reads the simulation and writes none of it. Drawing every layer, some
layers or none leaves the run identical, tick for tick. A persistent layer's
image never feeds back into the simulation.

### Inspection

`drawFlightFrame` accepts `include`, which selects the passes that draw, and
`observe`, which receives each drawn pass and its draw time. The game uses
neither: it draws every pass, unobserved.

## Contract

### Definition of Done

- `FLIGHT_PASSES` holds its passes with unique ids, and `drawFlightFrame`
  draws them in array order.
- Each pass draws on its own layer, world passes under the camera transform
  and screen passes without it.
- `drawFlightFrame` with `include` draws exactly the included passes, in
  order, and reports exactly those to `observe`
  (`packages/mode-a/src/lib/flight-frame.test.ts`).
- `FlightDeck.svelte` draws the in-flight frame only through
  `drawFlightFrame`.
- `FLIGHT_LAYERS` holds World, FX and LFX in stack order, each with its
  blend, memory and resolution, and every pass names one of them.
- The stage hosts one canvas per layer, in stack order, each composited by
  its declared CSS blend mode inside an isolated stage.
- No pass draws another layer's image onto its own, and no game code sets a
  canvas composite operation to blend one layer with another.
- The FX layer is cut over derelict apertures, and no solid pass draws
  above it.
- Gauntlet draws each living hostile fitted ship and weapon pose through the shared
  build renderer, with its charcoal Scout palette defined by that renderer.
- Each offscreen hostile Gauntlet actor has a screen-fixed bearing cue; the cue
  does not alter camera or simulation state.
- A layer's resolution can be changed without changing any pass.
- A frame with an empty interval leaves the FX layer's image unchanged
  (`tests/browser/fx-surface.spec.ts`).
- Interval coverage: a source that crosses several times its own width
  during one interval leaves light along the whole path between its two
  positions.
- Rate independence: the same ticks presented one per frame and two per
  frame give the same FX image, within tolerance.
- Breaks: after an arena wrap or a reset, no light lies between the old
  position and the new one.
- Changing which effects draw leaves the simulation's state identical
  (`packages/mode-a/src/lib/fx-integration.test.ts`).
- Every planet in every mode shows the same World HUD elements, drawn by one
  pass.
- No pass id and no pass code names a particular planet.
- The `body-light` pass draws each body's light and dark stamp before every other
  LFX pass.
- The `world-hud` pass draws every planet's HUD before the planets pass draws any body.
- World HUD strokes remain 1 CSS px and text remains 14 CSS px at every zoom.
- A frame in which every body's visual bounds are outside the view does no body,
  surface, atmosphere or light drawing. World HUD marks crossing the view remain
  visible independently.
- A paused frame redraws no body surface.
- A body with two surfaces turns each on its own period: advancing the
  simulation by one period of either surface returns that surface to the same
  picture while the other has moved.
- The frame cost of a body with two surfaces is measured with `observe` on
  screen, off screen and close up, beside Mercury and Venus.

### Regression guardrails

- A layer and a pass exist in one place, `flight-frame.ts`. Nothing else in the
  game draws onto the flight layers.
- An immediate layer keeps no image, buffer or history between frames.
- Persistent state is never read by the simulation.
- Blend, scale and filter are CSS on a layer's element, never drawn code.
- The game's frame takes no `include` or `observe`.
- No game code reads or writes individual pixels per frame.
- A body's parts on World carry no light or shade of their own.

### Scenarios

```gherkin
Scenario: A frame presents one tick
  Given the simulation advanced one tick since the last frame
  When the frame is drawn
  Then World shows the world and the ship in their current state
  And FX holds the light emitted during that tick

Scenario: A frame presents several ticks
  Given the display fell behind and three ticks passed since the last frame
  When the frame is drawn
  Then World shows the world and the ship in their current state
  And FX matches what three single-tick frames would have built

Scenario: A frame presents no tick
  Given the game is paused
  When a frame is drawn
  Then every layer is the same as in the last frame

Scenario: A source moves fast across its own beam
  Given an engine burning while its ship turns
  When the frames of the turn are drawn
  Then the engine's fading light on FX is one continuous trail

Scenario: The ship wraps across the arena
  Given an engine burning as the ship crosses the arena boundary
  When the next frame is drawn
  Then light fades at the old position and starts at the new one
  And no light joins the two

Scenario: Light over a derelict
  Given accumulated light covering a wreck
  When the frame is drawn
  Then the wreck's aperture shows the World layer, with no light over it

Scenario: A planet turns
  Given a planet in view while the simulation advances
  When frames are drawn
  Then its surface turns with simulation time
  And its light and dark side keeps facing the star

Scenario: Clouds turn over the ground
  Given a planet with a ground surface and a partly transparent cloud surface
  When frames are drawn while the simulation advances
  Then the ground shows through the openings in the clouds
  And the clouds turn at their own rate over the ground

Scenario: A planet is outside the view
  Given a planet's complete visual bounds are outside the camera's view
  When a frame is drawn
  Then no planet body, surface, atmosphere or light is drawn
  And any orbit or gravity boundary crossing the view remains visible

Scenario: A planet's visual edge touches the view
  Given the body outline or atmospheric stroke touches the camera's view
  When a frame is drawn
  Then the planet is drawn without clipping its visible edge

Scenario: A layer's look is changed
  Given the FX layer at full resolution with no filter
  When its resolution is halved and a filter is set
  Then the picture changes
  And the image the FX layer holds follows the same rules as before
```

### Configured Lab painters

A configured Lab flight can supply its own ordered pass list to `drawFlightFrame`.
The frame retains layer clearing, camera transforms, resolution and observation for
those passes. Omitting a custom list uses the production passes. A study can replace
a solid-body painter and add its matching LFX painter without changing play’s defaults.
