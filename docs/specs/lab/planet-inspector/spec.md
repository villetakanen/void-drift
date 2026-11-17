# Planet Inspector

## Context

Planet Inspector shows planet rendering exactly as the game draws it: surface,
spin, Sun-facing light, atmosphere, orbit and world HUD. The standalone Lab page
is `/lab/planet-inspector`, opening paused on named Mercury. Named Venus is also
available. Studies embed the same instrument to examine a planet in motion or
at a reproducible instant. The inspector is the Lab's planet page.

The bench uses production renderers one to one. Its only local appearance
controls are three validated lighting parameters applied to the selected
production painter. One inspector shows one drawing. It offers no switch between
drawings, study painters or projector implementations. A comparison mounts two
instruments.
The [Lab contract](../spec.md) applies: this is a visual instrument with no
manual piloting or score submission. Ship approaches and contact experiments
belong to the [Flight instrument](../flight-scene-instrument/spec.md).

## Architecture

- `apps/web/src/pages/lab/planet-inspector.astro` hosts the page, listed in
  `apps/web/src/data/lab-pages.ts`.
- `apps/web/src/components/lab/planet-inspector/PlanetInspector.svelte` accepts
  `config: unknown`, an optional accessible `label` and an optional `pane` snippet.
  Its internal view owns the shared controls and composes the pane's content.
  `PlanetInspectorEmbed.astro` mounts it inside the shared `InstrumentBand`.
- `apps/web/src/lib/planet-inspector/index.ts` exposes validated configuration
  and the inspection scene. Each instance owns its simulation, clock, material
  projection, measurements and render resources.
- Named references resolve Practice definitions. `mercury` maps to internal
  identity `moon`; `venus` maps to `venus`. Radius, mass, orbit, spin period,
  materials and atmosphere remain production-owned. They are read from the
  game's definitions and factories, without a copied Lab preset.
- The scene calls `drawFlightFrame` from
  `packages/mode-a/src/lib/flight-frame.ts` with production passes unchanged,
  selecting them only with `include`. Ready materials are projected through the
  same shared production body-appearance adapter used by FlightDeck; the adapter
  supplies the generic `planets` and `body-light` passes with prepared World and
  LFX callbacks keyed by the selected planet's validated full-system ordinal.
  The Inspector does not substitute a pass or painter, wrap a surface draw call,
  copy an orbit formula or implement an inspection-specific visibility test.
- The production `Simulation` advances orbit and scene time. The Lab stages one
  selected planet and its Sun and excludes unrelated body/ship drawing.
  `FlightLayers.svelte` supplies production layer compositing. Shared HUD,
  material and light-mask ownership stays with production.

### Configuration

`PlanetInspectorDocumentSchema` in
`apps/web/src/lib/planet-inspector/config.ts` parses strict Zod objects before
consumption. Unknown fields, unsupported references and invalid numbers render
field-specific issues in place of the scene; they never silently select Mercury.

| Field                     | Contract                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `planet`                  | `{ kind: "named", name: "mercury" }` or `{ kind: "named", name: "venus" }`; default Mercury.       |
| `opening.orbitDegrees`    | Optional finite 0–360; absent uses the selected planet's Practice starting angle.                  |
| `opening.rotationDegrees` | Finite 0–360, default 0. Selects a tick within the named planet's first spin period of scene time. |
| `opening.zoom`            | `1`, `2`, `4`, `8` or `16`, default `1`.                                                           |
| `opening.playing`         | Boolean, default false.                                                                            |

`opening` is optional and defaults each field as above. Additional named planets
and a validated custom-definition branch are extensions; unsupported custom
selections are rejected. Configuration replacement opens at the new document's
initial state and releases the old scene. The named-planet choice in the pane
selects Mercury or Venus at that document's opening settings. Interaction state
is local; the document, game settings, persistence and Firestore are unchanged.
Lighting controls are local pane state and are not part of the Inspector
document.

## Inspection contract

### Picture and zoom

The selected planet stays centered, including during playback. The Sun remains
its light source even when outside the camera. Body, light, atmosphere, orbit,
gravity boundary, name and Sun indicators are drawn wherever the production
passes draw them. Venus includes its production atmosphere line.

The top-left Zoom switch offers **1×, 2×, 4×, 8×, 16×**. These are the
inspector's own levels: **0.5, 1, 2, 4, 8 CSS pixels per world unit**, respectively.
At every viewport size, the planet's on-screen diameter is
`2 × radius × CSS pixels per world unit`. Layers and the camera viewport follow
the scene element's own width and height on resize. The scene fills its area,
without a fixed aspect ratio, CSS scaling of the picture or letterboxing.
Changing zoom or resizing preserves simulation time and orbital angle, and keeps
the planet centered. The options pane shows the current CSS px/u.
World, FX and LFX visibility switches start enabled; a world-HUD switch selects
the production `sun-fields` and shared planet `world-hud` passes independently
of bodies. Planet HUD remains the shared stage-coordinate display even when a
material is still loading or unavailable. These controls change inspection
visibility.

### Scene time and staged orbit

The **Surface rotation** slider spans **0–360°**. It scrubs one spin period of
scene time, rather than overriding the surface. Its position maps to the nearest
simulation tick from zero through the selected planet's spin period:
`round(degrees / 360 × spinPeriodSeconds / STEP)`. The production simulation is
replayed when seeking backward and stepped forward when seeking ahead. Spin and
Sun animation follow that resulting tick. The currently staged orbital angle is
preserved across either seek direction. There is no independent spin-phase state.

The **Orbit** slider spans **0–360°** alongside Surface rotation. It sets the
planet's existing `orbitAngle` simulation field and uses the shared production
`updatePlanetOrbit(planet, 0)` rule to place it. Changing Orbit leaves scene time
and surface rotation unchanged. Both sliders pause playback when scrubbed and
show the resulting simulation values. Orbit uses the game's world-angle
convention: positive X at zero, increasing toward positive Y.

The two controls are independent: spin comes from scene time, and orbit angle
is staged simulation state. A staged combination is not a claim about the
unmodified Practice timeline. No render pass, orbit formula or production state
contract changes for the bench. At a full 360° surface turn, Sun animation
advances with time while the staged orbit is preserved. Scene seconds remain a
read-only value beside the controls; Orbit has its own slider value.

**Play/Pause** resumes or freezes the scene clock. Play advances scene time and
orbit from their current values with production steps at 1/60 second; both
sliders follow, wrapping across complete turns. Reset restores the document's
opening spin time, orbital angle, zoom and playback state. An omitted opening
orbit uses the planet's Practice starting angle, independently of opening spin
time. Repeated paused drawing advances no state. Equal named reference, tick
and staged orbit produce the same picture regardless of earlier drawn frames.

Play, Reset, the two sliders and scene-time readout float over the bottom of the
scene. They occupy no separate bar and have no raised background behind them.
Controls work by keyboard and pointer.

### Options and costs

The top-right shared `OverlayPane` contains the named-planet choice, visibility
controls, current scale, optional host pane snippet, and two live readouts:

- **Planets pass time:** milliseconds reported for the production `planets` pass
  by `drawFlightFrame.observe`, averaged over the last second of drawn frames.
- **Surface redraws per second:** actual completed projections over the same
  rolling second, read from the production surface's read-only `redrawCount`.
  The counter increments only when the surface redraws, including preparation;
  frame measurement counts the difference across drawing, excluding preparation.
  The inspector never wraps or replaces `draw` to count calls.

Visible instruments draw paused frames too, so both readouts remain available.
After a second of unchanged paused frames, redraws read zero; the pass-time
readout still measures the cached production pass. A paused zoom change can
cause one production surface resize/redraw. During the initial partial second,
the redraw rate is normalized to the measurement duration. Numbers measure
script cost, not browser raster/compositing cost or device-wide performance.

### Incident-light controls

The pane controls incoming-light intensity, shadow intensity and star-light
temperature on the selected production body painter. The shared strict
`RockBodyLightingSchema` in `packages/core/src/lib/schemas/rock-body-lighting.ts`
validates finite incoming and shadow multipliers from 0 to 2 and a finite
temperature from 3500 to 10000 K before preparation or state adoption. Initial
values are incoming 1.35, shadow 1.35 and 5800 K, matching the shared
production defaults. At canonical multipliers 1/1 and 5800 K, the original
grayscale baseline is unchanged.

Incoming intensity scales only bright-side stamp values above 0.5; shadow
intensity scales only dark-side values below 0.5. Star-light temperature tints
only incident light on the planet. It does not change the star's body, type,
designation or simulation properties. The displayed K, G, F and A classes are
approximate temperature bands: K from 3500 to 5000 K, G from 5000 to 6000 K, F
from 6000 to 7500 K, and A from 7500 to 10000 K, following the
[stellar classification temperature sequence](https://lweb.cfa.harvard.edu/~pberlind/atlas/htmls/note.html).
The color mapping is a visual approximation normalized to neutral at 5800 K;
it is not scientific colorimetry or a stellar spectrum. Bright channels stay
at or above 0.5, and both intensities at zero produce a neutral stamp.

Each slider update is validated and prepares the selected painter's replacement
stamp before the new setting is adopted. Drawing an unchanged paused scene then
shows the new light without advancing time or orbital angle and without
redrawing the surface. A failed update leaves the previous settings active.
Seek, zoom, play and pause preserve the lighting controls. Reset and changing
the named planet restore incoming 1.35, shadow 1.35 and 5800 K. Multiple Inspector
instances keep independent selected settings while sharing identical prepared
stamps. Prepared tuples are retained only while active painter instances use
them; disposed or late material results release their leases.

### Studies, failure and lifetime

Study embeds use the same production drawing and controls. A study needing a
pane mounts a Svelte wrapper; functions and snippets are not serialized through
Astro props. Two embeds own independent simulations, clocks and surfaces.
The Inspector provides only the three production lighting parameters above; it
does not offer a presentation replacement or drawing-selection switch.

Material preparation exposes loading and failure messages. On failure, the
production passes provide their existing stock-body fallback; the inspector
adds no substitute painter or HUD repair. A late asset result cannot attach to
a different selection or disposed scene.

Unmounting cancels animation scheduling and observers and releases instance
resources. Hidden or offscreen scenes suspend drawing and time advancement;
they do not catch up hidden wall time on return. The production render model
owns caching and culling. Use Svelte 5 runes, native CSS, shared controls and
tokens. The Lab supports viewports 1280px wide and above.

## Contract

### Definition of Done

- The Lab lists Planet Inspector and opens it paused on Mercury at 1×.
- Named Mercury and Venus resolve Practice state and unchanged production
  materials, including Venus's atmosphere line, through the shared production
  body-appearance adapter.
- `drawFlightFrame` receives no substituted passes or wrapped materials.
- Surface rotation scrubs one spin period of scene time while preserving the
  staged orbit. Orbit changes orbital angle while preserving scene time. Both
  sliders follow playback, and Reset restores both opening values.
- All five zoom levels measure 0.5, 1, 2, 4 and 8 CSS px/u, fill the scene
  through resize and keep the planet centered. Bottom controls overlay the scene.
- Both rolling cost readouts remain available during play and pause; unchanged
  paused drawing settles to zero surface redraws.
- Incoming intensity, shadow intensity and star-light temperature use the
  validated ranges and defaults; updates change paused planet lighting without
  advancing the simulation or redrawing its surface.
- Reset and planet selection restore lighting defaults; zoom, seek and playback
  preserve them. Separate Inspector instances keep independent settings.
- Multiple study embeds remain independent and offer one production drawing each.
- Invalid input produces visible issues, and asset failure uses production fallback.

### Regression guardrails

- The bench has no production simulation-state additions, painter or renderer
  copies, material draw wrappers, pass replacements or copied orbital integrator.
- Lighting controls parameterize the selected production painter only and do not
  change the star body, star type, designation, physics or orbital state.
- Drawing, the shared World HUD, light-mask owner and failure behavior remain
  production-owned. The Inspector selects the shared HUD passes and sets only
  its painter instance's validated light parameters. No game definitions,
  material ownership or score paths change for inspection.
- Keyboard controls and visible layout work at the Lab's 1280px minimum width.

### Scenarios

```gherkin
Scenario: Scrub a Mercury turn at a staged orbit
  Given Mercury is paused with Orbit set to 120 degrees
  When I set Surface rotation to 180 degrees
  Then scene time is at the nearest tick to half a Mercury spin period
  And the Sun animation follows that time while Orbit stays at 120 degrees
  When I set Orbit to 240 degrees
  Then scene time and Surface rotation stay unchanged

Scenario: Inspect Venus
  Given I select named Venus
  Then the production Venus body, atmosphere line, light and HUD are drawn
  When I scrub to 360 degrees
  Then one Venus spin period has elapsed and the Sun follows that time
  And the staged Orbit value is unchanged

Scenario: Inspect paused cost
  Given a loaded planet is paused and its scale is unchanged
  When a second of paused frames has been drawn
  Then Surface redraws per second reads zero
  And Planets pass time measures those cached production frames

Scenario: Change zoom at a held instant
  Given a planet is paused at an inspected tick
  When I select 16×
  Then one world unit measures 8 CSS pixels and the planet stays centered
  And scene time and orbital angle stay unchanged

Scenario: Reject an unsupported selection
  Given a document selects an unsupported named planet or custom definition
  When the document is parsed
  Then field-specific issues replace the scene
  And Mercury is not silently substituted
```
