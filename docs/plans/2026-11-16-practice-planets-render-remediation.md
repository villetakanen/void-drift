# Practice planets: render model remediation

Status: plan, 2026-11-16. Step 3 is now a reversible trial in Practice; the other
steps are not applied. It follows a review of how
Practice Mercury and Venus are drawn against the render model in
`docs/specs/game/render/`. The planets stay. This plan brings them inside the model
so that a later planet can be added as data.

The steps that change a spec need a decision first. They are listed under "Decisions", with what
is decided, proposed and still open.

## What the review found

Measured on 16 November 2026 on one Mac, with the production passes and the Practice
simulation on a 1920 × 1080 stage, one tick per frame, 240 frames per case. Script
time only.

| Case                                       | Whole frame | Planets pass |
| ------------------------------------------ | ----------- | ------------ |
| Both planets on screen, ticking            | 3.96 ms     | 3.86 ms      |
| Both planets off screen, ticking           | 3.96 ms     | 3.86 ms      |
| Close on Venus at 3.2 px/u, ticking        | 3.94 ms     | 3.86 ms      |
| On screen, paused                          | 0.11 ms     | 0.01 ms      |
| On screen, stock discs instead of painters | 0.10 ms     | 0.01 ms      |

| Part                           | Mercury        | Venus          |
| ------------------------------ | -------------- | -------------- |
| Surface reprojection, per tick | 1.96 ms        | 2.02 ms        |
| Body draw                      | under 0.001 ms | under 0.001 ms |
| Atmosphere arc                 | none           | under 0.001 ms |
| Light pass, mask cached        | 0.001 ms       | 0.004 ms       |
| HUD pass                       | 0.007 ms       | 0.005 ms       |

A light mask that is not cached costs 0.32 ms to build. A stock planet with its HUD
costs 0.002 ms.

Findings, most serious first:

1. Game code reprojects every pixel of each planet's surface on every tick.
   `SphericalSurface.draw` in `packages/core/src/lib/assets/spherical-surface.ts`
   loops over 192 × 192 pixels with trigonometry and bilinear blending, called from
   the planets pass in `packages/mode-a/src/lib/flight-frame.ts`. The render spec
   says "No game code blends, blurs, scales or distorts pixels" and "Game code draws
   marks: shapes, images and cached stamps". Mercury is about 54 px across at
   1 px/u, and one tick moves its surface about 0.09 px at the disc centre.
2. The render spec's "Named Practice planets" section describes this implementation,
   names two planets inside the general model, and states no rule a third planet
   could be checked against.
3. Mercury and Venus have a HUD of their own. Their orbit, gravity boundary and label
   are drawn in stage pixels by two passes of their own, in token colours. Every
   other planet gets a faint solid orbit and a cyan ring from the stock planet draw,
   in world units and hard-coded colours, with no label. No spec says planets share
   one HUD; the planets spec says other planets keep the flat-disc presentation.
4. Nothing skips a body that is outside the camera's view. No rule covers it.
5. Planet identity is hard-coded in the frame: `FlightFrame.mercury` and
   `FlightFrame.venus`, branches on `id === "venus"` and `id === "moon"`, four
   passes per planet pair, and the display names as string literals in pass code.
6. Production Mercury loads three PNGs of 2.1 to 2.3 MB each from
   `/studies/mercury-2026-11-12/` and uses one. The provenance file beside them says
   "Unaccepted visual hypotheses; not production assets". The material preparation
   and both painter constructors live in `apps/web/src/lib/assets`, and the deck, the
   Lab preview and the Flight instrument each wire the painters separately.
7. The light mask is rebuilt per pixel for each of 256 Sun angles with 24 kept, so
   every new angle is a rebuild. The mask for any angle is the angle-zero mask
   rotated, which the canvas can do. Each planet holds its own cache of identical
   masks.
8. The light pass draws an opaque grey disc on the live-light layer, whose dark half
   darkens accumulated light and anything drawn over the body. The layer spec says
   the layer holds fresh light. This was reasoned from the blend order and not seen
   on screen.
9. Smaller inconsistencies: Mercury loses its HUD and label while its image loads or
   if it fails, and Venus does not; Mercury's projected surface is one shared object
   and Venus's is per flight; the planets pass and the Venus light pass name the
   wrong source file; the light passes sit among World passes in a list whose comment
   says it is grouped by layer.

## What to keep

- A body on World and a directional mask on the live-light layer, sharing one unit
  disc. `RockBodyPainter.body` is a single image draw.
- The three HUD primitives in `packages/core/src/lib/assets/world-hud.ts`: stage
  pixels, token colours, about 0.006 ms per planet.
- Surface phase from simulation ticks, so a paused frame shows the same picture.
- Atlases built once at load, and the stock disc when material setup fails.
- Venus's atmosphere arc, which is one native stroke.
- The pass-list substitution the Lab uses to swap a body painter.

## Steps

Each step is one change that can be reviewed and landed alone. Steps 3, 5 and 8 need no
decision and can go first.

### 1. Write the rules for world bodies into the specs

Replace "Named Practice planets" in `docs/specs/game/render/spec.md` with rules for
any world body, and update `docs/specs/game/world/planets/spec.md` to match. The
content comes from the open decisions. Proposed rules:

- Per-frame work for a body is drawing cached stamps and shapes. Per-pixel work
  happens at load.
- A pass does no work for something outside the camera's view.
- Every planet has the same World HUD, drawn by one pass.
- A pass is not specific to a named entity. Identity and appearance come from data.
- How a body is composed: unlit parts on World, such as surface and clouds, in
  order, and one light-and-dark stamp on the live-light layer, drawn first there.
- The live-light layer's own text, which says it holds fresh light, updated to
  include a body's shade.
- Which uses of the browser's image drawing count as drawing marks, so that scaling
  strips is allowed and looping over pixels is not.
- Production loads nothing from study folders. Painters and their material
  preparation live in the shared engine.

Touches: the two specs, and `docs/specs/lab/render-model/spec.md` if the frame
reference changes. Size: small once decided. Depends on: step 3 and the open questions.

### 2. One planet HUD for all planets

- Add a display name to the planet data, schema first.
- Add one HUD pass that loops over every planet and calls the existing primitives.
- Remove the two per-planet HUD passes, `drawPracticePlanetHud`, and the HUD half and
  `worldHud` switch of `Renderer.drawPlanet`.
- Update the Flight instrument, which removes the two HUD passes by id in
  `apps/web/src/lib/flight-scene/scene.ts`.

This changes how Survival and Gauntlet look. It also removes the Mercury fallback
mismatch. Touches: planet schema, `flight-frame.ts`, `Renderer.ts`, the Flight instrument,
the planets spec. Size: small to medium. Depends on: step 1.

### 3. Draw the rotation with the browser

An earlier version of the Mercury work drew the rotation with the browser; it was
never committed and is lost, so this rebuilds it. It is built in the shared engine,
beside the per-pixel projection, not on a Lab page. A sphere turning on its axis is
a flat map scrolling sideways, squeezed toward the edges. It is drawn with image
draws only: the visible half of the map in vertical strips of varying width into a
small buffer, then that buffer row by row, each row scaled to the circle's width at
that height. The map's rows are spaced for the sphere once, at load. That is about
150 image draws per body and no loop over pixels.

Before step 4 relies on it, measure: what it costs per frame at 54 px, 323 px and
800 px across; what it looks like next to today's surface, including seams between
strips; and whether a second map with holes, for clouds, draws the same way over
the first. Touches: core assets. Size: small. Depends on: nothing.

If it does not hold, the fallback is frames baked ahead of time, with the sizing
worked out on 16 November: one set per speed camera level, about 24 MB for Mercury
and 54 MB for Venus at 4 px/u with 128 frames per turn.

### 4. Stop the per-tick reprojection and shade each part

Replace the per-pixel projection with the method step 3 settles. Keep the shade as
one stamp on the live-light layer, but build it once and turn it with the canvas to
face the Sun, shared by all bodies. Remove the 256-angle mask cache.

This is the step that removes about 3.9 ms per frame. Touches:
`spherical-surface.ts`, `rock-body.ts`, `cloud-body.ts`, the planets pass.
Size: medium. Depends on: steps 1 and 3.

### 5. Skip bodies outside the view

Test each body's bounds, including its light mask and atmosphere, against
`camera.getViewRect()` before any work for it. The HUD pass decides separately, since
an orbit can cross the view when its planet does not. Touches: the planets and light
passes. Size: small. Depends on: nothing.

### 6. General body passes driven by data

Replace `FlightFrame.mercury` and `FlightFrame.venus` with a set of body appearances
keyed by planet identity, and the four planet-specific passes with one body pass and
one body-light pass. Remove the mode and id branches from the frame. Wire the
appearances in one place that the deck and the Flight instrument share.
Correct the pass source fields and the list's ordering comment. Touches:
`flight-frame.ts`, `FlightDeck.svelte`, the Flight instrument.
Size: medium. Depends on: step 1. Easier after step 2.

### 7. Move material ownership into the engine

Move material preparation and painter construction out of `apps/web/src/lib/assets`
into the shared engine's assets. Ship Mercury's surface as one small prepared atlas
outside the studies folder, and stop fetching the two unused images. Touches:
`apps/web/src/lib/assets`, core assets, public assets. Size: small to medium.
Depends on: nothing; the art decision is made.

### 8. Remove the Practice planets page

The Lab page `/lab/entities/planet/practice` is a mistake: no such page should be
specified or built (decided 2026-11-16). Remove the page, its component
`apps/web/src/components/lab/PracticePlanets.svelte`, its entry in
`apps/web/src/data/lab-pages.ts`, the link in `LabPlanetMain.svelte`, and the
sentences that call it canonical in the render spec and the planets spec. Two dated
study pages and one review link to it; those links will break and are left for
whoever reviews those pages. Size: small. Depends on: nothing.

## Collateral: name the Flight instrument

Not a render fix. It is recorded here because the review ran into the naming.

Decided 2026-11-16:

- The component is the Flight instrument.
- The Lab page that demonstrates it is the Lab Flight instrument.
- A study that uses it has a Flight instrument.

Today the repo says "Flight scene instrument" in 27 files and "Flight scene" for the
Lab page's title and its address, `/lab/flight-scene`. "Flight instrument" appears
in 3 files.

What the rename touches:

- The Lab page: its title in `apps/web/src/data/lab-pages.ts`, the page
  `apps/web/src/pages/lab/flight-scene.astro` and its address.
- The spec `docs/specs/lab/flight-scene-instrument/spec.md`, its folder name, and
  the specs that link to it, including the render spec and the Motion instrument
  spec.
- The skill `.agents/skills/flight-scene-study`.
- The code: `apps/web/src/lib/flight-scene`, `apps/web/src/components/lab/flight-scene`,
  the wrapper `apps/web/src/components/studies/flight-scene.ts`, and names such as
  `FlightScene`, `FlightSceneInstrument` and `FlightSceneDocumentSchema`.
- The remaining files that mention the name, apart from dated material.

Also decided 2026-11-16:

- The rename is full: the displayed name, the folder names and the code identifiers
  all change.
- The Lab page's address is `/lab/flight-instrument`.
- Dated material is left as written: dated study pages, reviews, loop records and
  dated plans keep the old name. Where a dated study page links to the Lab page or
  imports the code, the link and the import are updated so the page still works;
  its prose is not.

Size: medium. Depends on: nothing, and nothing in the steps above depends on it.

## Order

1. Steps 3 and 5 now.
2. The open questions, then step 1.
3. Steps 2 and 4, in either order.
4. Step 6.
5. Steps 7 and 8 at any point.

## Checks

- Re-run the frame measurement after step 3 and after step 6: the planets pass and
  the whole frame, on screen, off screen and paused.
- Measure through the production passes with `drawFlightFrame`'s `observe`, which
  reports each pass's draw time. The Flight instrument stages a planet through
  those passes, and `/lab/render-model` lists the passes read from code.
- The existing frame tests in `packages/mode-a/src/lib/flight-frame.test.ts` cover
  pass order and layers, and hold through every step.

## Decisions

Decided 2026-11-16:

- One planet HUD for all planets in every mode, in the style Mercury and Venus have
  now. This was the intent of the planet HUD work.
- Names. A star is named by its type, followed by its name if it has one, such as
  G7 Sun. A planet with a name of its own shows that name and no number. A planet
  without one takes its star's name, or the star's type if the star has no name, a
  full stop, and its position counted from the centre. Named planets count in that
  position. A G7 star named Sun with four planets reads: Mercury, Venus, Sun.3,
  Mars. The first planet of an unnamed G11 star is G11.1.
- Authored raster art is acceptable for a production planet.
- The speed camera's zoom levels are meant to be 0.5, 1, 2 and 4 px/u. Today they
  are about 0.47 to 3.75 px/u. That fix has its own plan,
  [speed camera entrance and zoom levels](2026-11-16-speed-camera-entrance-and-zoom-levels.md),
  and is outside this plan's steps.
- A planet's light and dark side is one stamp on the live-light layer, as Mercury
  and Venus have it today. It may darken whatever is beneath it: over the void it
  changes nothing, and over a ship it reads as the planet's shadow. It is drawn
  first on that layer, so beams and halos are drawn over it. It follows that the
  parts of a body on World, such as surface and clouds, are drawn without light or
  shade of their own, so nothing is shaded twice.
- The cost rule is a method rule: no looping over pixels per frame, and no work for
  bodies outside the view. It is not a millisecond budget.

Proposed, not decided:

- Rotation is drawn with the browser's image drawing, as step 3 tries. This
  replaces the earlier baked-frames proposal, which is kept only as the fallback.

## Step 3 trial, 2026-11-16

The Practice deck opts Mercury and Venus into core's `StripSphericalSurface`.
The previous projector remains available; study consumers keep their previous
implementation. No Lab page was added or changed. This is the rotation trial
only, without culling, new body passes, HUD changes or asset migration.

The candidate keeps the 192px surface buffer and uses 64 column image draws,
then 192 row image draws per changing phase (256 total, rather than the estimated
150). Latitude resampling and strip geometry are prepared once. It uses the
accepted atlases, simulation phase and existing World/LFX painters.

Local headless Chromium measurement, 30 warm-up and 240 measured redraws per case;
script time for Mercury projection plus drawing to the stated destination size:

| Diameter | Existing per-pixel | Native image draws |
| -------- | ------------------ | ------------------ |
| 54px     | 2.07 ms            | 1.00 ms            |
| 323px    | 2.45 ms            | 0.90 ms            |
| 800px    | 1.98 ms            | 0.90 ms            |

A separate production-pass comparison on a 1920×1080 canvas measured the planets
pass at 5.71 / 3.51 ms (existing / candidate) at 1 px/u, and 5.05 / 2.05 ms at
3.2 px/u. Runs varied; these are same-run comparisons, not directly comparable to
the original review's timings or a guarantee of browser raster/compositing cost.

Five evenly spaced phases of the accepted Mercury atlas were visually compared
at 323px: the mineral arrangement and turn direction are retained, with a slightly
different sampled limb. A transparent test map retained both clear and visible
areas, and a full-turn return reproduced the same image. Practice was launched
through the Hangar with no browser errors; pause held ticks and the World image
unchanged, and Resume advanced ticks again. TypeScript and the frame-pass tests
passed. The broader Svelte check still reports two implicit-any errors and 34
warnings in four untouched rock-study components.

This remains a trial for review in actual Practice. iPad cost and the sustained
raster/compositing cost are unmeasured; offscreen culling is still separate work.

## Not checked by the review

- Cost on an iPad or any machine other than the one Mac.
- Raster and compositing time.
- The game itself in Practice; the production passes were measured in a harness on a
  Lab page.
- The darkening of ships or light over a planet body, on screen.
- The fallback paths in a real failure.
- The quilting code beyond its header, and the Practice planet tests.
