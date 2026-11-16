# Flight scene instrument

Design record: study `flight-scene-instrument-2026-11-10`
(`/lab/studies/flight-scene-instrument-2026-11-10`). A configured use of the
[Motion instrument's](../motion-instrument/spec.md) burns and time controls,
drawn through the [render contract](../../game/render/spec.md)'s layers.

## Context

A study about a ship, its effects or its weapons has to show the thing in
flight. The Flight scene instrument is the shared way to do that: one ship
flies one of the Motion instrument's fixed burns through the production
simulation, and the result is drawn through the game's own layers and frame
passes, so a study judges what play would show. It shows one ship; a study that
compares two embeds two instruments. A study that proposes a light for an engine
supplies it as a [study light](#study-light), the one thing in the scene that is
not the game's.

## Architecture

### Document

`FlightSceneDocumentSchema` in `apps/web/src/lib/flight-scene/config.ts` parses
an agent-supplied document; the starter is `STARTER_FLIGHT_SCENE` in
`starter.ts`. The schema is strict: unknown fields are refused.

| Field     | Meaning                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `loadout` | The ship: a game `LoadoutSchema` loadout (`packages/mode-a`).                                                    |
| `start`   | Optional `{x, y, rotation, velocity?}`; starts at rest unless velocity is supplied. Absent: where a run starts.  |
| `targets` | Wrecks placed in the arena, `{x, y}` in world units. Default none.                                               |
| `held`    | Optional `{distance, shardLife}`, both positive; defaults 140 units and 2 seconds.                               |
| `follow`  | `{near, far}` zoom of the two follow views, positive with `near < far`; defaults 1.6 and 4.                      |
| `opening` | `{burn, view, tick}`: what is shown on opening; defaults `course`, `follow`, 180. The tick lies within the burn. |

### Staged impulses

A document may supply `impulses`, default empty: up to sixteen strict objects
with `tick` (an integer from 1 through the burn's final tick) and finite,
nonnegative `backwardMomentum`. At the named post-step tick boundary, the
instrument subtracts momentum divided by the assembled ship's production mass
along its current forward axis. Rotation and angular velocity are unchanged.
Events at the same tick add. This is an explicitly staged experiment condition,
not a production weapon, spending rule or change to gravity/friction.

Drawing never applies impulses. Backward seek or restart reconstructs the flight,
so each event occurs once in that replay and never accumulates from inspection.
An absent or empty list retains the original flight. Configured study light may
place an active eruption on LFX and reduced emission history on FX; the shared
surface still owns world-space decay. This does not select a projector recipe.

The default zoom and held values are working values, not tuned ones.

### Engine

- `flight.ts`: `FlightRun` is the simulation half and needs no canvas. It builds
  a production `Simulation` with Derelicts rules, the encounter held off, and
  the document's loadout and start; it advances one tick at a time from the
  burn's input program and seeks to an instant.
- `scene.ts`: `FlightScene` adds the camera, the persistent FX history and the
  drawing through `drawFlightFrame` onto the three layer canvases.
- `light.ts`: the study light's types, and `studyLightState`, which reads the
  engines' state from the simulation.
- `index.ts` is the public surface; code outside the folder imports from it.

### Component

`apps/web/src/components/lab/flight-scene/FlightSceneInstrument.svelte` takes
`config: unknown`, `label?`, and optional inputs from whoever mounts it:
a `pane` snippet, a `light` (a [study light](#study-light)), `targets` (which
targets are staged; the document's default when absent), `layers` (which
layers are shown; all by default) and `tuning` ([part tuning](#part-tuning)), plus `planet` and `planetAppearance` ([planet encounters](#planet-encounters--15-november-2026)). It parses the document once; an invalid
document renders a visible message listing the issues in place of the scene. A
change to `config` after mount is ignored. The scene fills the 1440 × 900
logical screen, drawn at render width 1728 (16:10 at the game's 1080 height).
Burn and time float over the screen's lower edge and the view switch is at the
top left.

The shared burger pane occupies the smaller golden-ratio share of its positioned
CSS container: `1 / φ² ≈ 38.1966%` of the container's width, leaving approximately
61.8034% of the scene exposed. Its border-box width follows that container on resize,
not the viewport or the instrument's fixed logical drawing width. It remains
right-aligned, full-height and internally scrollable.

The menu (the Motion instrument's overlay pane, top right) belongs to the study
or Lab page that mounts the instrument. Its content is the `pane` snippet and
nothing else: the instrument has no menu controls of its own, and without a
`pane` there is no menu. A study puts the controls its question needs there, so
the scene keeps the whole screen. The pane receives a read-only (frozen) copy
of the document; a study's own values live in the study's own state and reach
the instrument only through `light`, `targets`, `layers` and `tuning`.

The figure exposes `data-rendered`, `data-drawn-tick`, `data-drawn-view`,
`data-drawn-burn`, `data-burn`, `data-playing` and `data-tick` for tests.
`data-drawn-view` carries the view id: `game`, `follow` or `follow-far`.
`data-study-light` is present while a study light is shown.

### Using it

- In the Lab: `/lab/flight-scene` mounts the instrument with the starter
  document through `FlightSceneLab.svelte`. That page supplies its own menu:
  the target choice, a switch for each layer and a switch for an example study
  light. These are the Lab page's controls, showing what a study can put in the
  menu; they are not part of the instrument.
- In a study page with no controls: `<FlightSceneEmbed config={document}
  label="…" />` from `components/lab/flight-scene/FlightSceneEmbed.astro`. It
  sits in the shared `InstrumentBand`
  (`components/lab/instrument/InstrumentBand.astro`), which the Motion
  instrument's embed uses too: the full window, snapping into place.
- A study that needs its own menu or its own light cannot pass a Svelte snippet
  or a function through an `.astro` file. It writes a small Svelte component
  that renders `FlightSceneInstrument` with a `pane` snippet or a `light`, and
  places that component inside `<InstrumentBand>`. That wrapper needs its own
  client directive (for example `client:visible`) and at least one prop;
  `FlightSceneEmbed` supplies a directive only for its own route.

## Time model

A burn is 14 s at 60 ticks a second, with no randomness: the same document, burn
and instant always give the same flight. The scene plays at real time and jumps
anywhere on the slider. A forward jump flies the ticks between; a backward jump,
another burn, another view, another target choice, another study light or other
part tuning flies the burn again from tick 0. A jump paints the
whole flight's light into the persistent FX history, because that history is
what the flight so far has left on the light surface.

## Views

- Game: the game's own camera, framed on the ship with its settings.
- Follow: the ship held at the centre at `follow.near`.
- Follow far: the ship held at the centre at `follow.far`.

The light surface follows the camera, so choosing another view flies the burn
again.

## Staging

The game has no staging code. The instrument writes to simulation fields the
game already reads, from the Lab side: it pushes wrecks into the salvage bodies,
sets the ship's start pose and keeps the next encounter from arriving. The
`targets` input chooses among the target modes the document supports
(`targetModes`).

- None: no wrecks.
- Placed (offered when `targets` is not empty): a wreck at each target.
- Held ahead (offered when `held` is present): one wreck held `distance` units
  ahead of the ship, moving with it, and replaced when it breaks, so a forward
  weapon has a target for the whole burn.

The default choice is Placed when targets exist, else Held ahead, else None.

### Held target and shard expiry

The game keeps a broken wreck's shards for good. A wreck replaced all burn would
bury the scene, so the instrument gives each shard of the held wreck the game's
own expiry (`life`) of `shardLife` seconds. The shards of placed wrecks keep the
game's behaviour and remain.

## Layers

World, FX and LFX are drawn on the three production layer canvases
(`FlightLayers.svelte`). The `layers` input hides any of them; hiding a layer
changes its visibility, not whether its history is kept.

## Study light

A study about an engine's light has to show a light the game does not draw yet.
A study light (`StudyLight` in `light.ts`) is the study's own drawing for the
engine parts it names:

| Field      | Meaning                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `label`    | Shown on the scene, so study drawing is never taken for the game's.                                |
| `replaces` | Engine parts whose production plume stays dark.                                                    |
| `fx`       | Optional. Paints fresh emission into the persistent FX surface, once a tick, in world units.       |
| `lfx`      | Optional. Paints live light on LFX for the frame shown, after the game's LFX pass, in world units. |

Both painters receive the state at that tick: the ship's pose and velocity, and
each main engine's part, mount key, nozzle position, thrust direction, seconds
held, charge progress and the output the game's plume would be painted with.
The state is read from the simulation's read-only `emitters` and
`engineSeconds`.

- The FX painter enters through the production frame's `lightOverlay`, inside
  the same surface pass as the game's light, so it fades, blooms and is
  reprojected as the game's light is. It should respect the pass's opacity,
  view culling and budget.
- For replaced parts the instrument steps the simulation's plume again each
  tick with those engines at no output. The plume holds current outlets only;
  the ship's motion, energy and every other outlet are unchanged.
- A study may pass another light, or none, after mount, for example from a
  choice in its own `pane`; the scene keeps its instant and flies the burn again.
  With no light the scene shows the game's own light on the same flight.
- While a study light is shown, the scene carries a caption naming it.
- Ship, stabilizers, weapons, fade, bloom and layer order stay the game's.

## Part tuning

A study about a delayed or pulsed engine may need to fly it with other values.
`tuning` takes the same experiment-wide values the Motion instrument exposes
for Fission and Plasma (`thrust`, `speedContribution`, `chargeSeconds`,
`pulsePeriod`, `pulseOn`). The flight runs on tuned copies of the parts, staged
on the simulation's `parts` before the burn; the game's definitions are never
changed, and a flight with no tuning runs on the game's own. A study light's
engine state reports the tuned charge length. Other values after mount fly the
burn again to the same instant.

## Fidelity and cost

Measured with `tests/review/flight-scene-fidelity.spec.ts` (run with
`pnpm exec playwright test -c playwright.capture.config.ts
tests/review/flight-scene-fidelity.spec.ts`), which writes
`test-results/flight-scene-fidelity.json`. Figures below are from 11 November
2026, headless Chromium, a 1440 × 900 window.

- **A jump equals play.** At twelve instants of B1, six in Follow and six in
  Game, the frame reached by a jump and the frame reached by playing from the
  start differ in no pixel on any of the three layers. Both paint light once per
  tick. The game paints light once per drawn frame, so the instrument shows the
  picture of a game running at one frame per tick; it does not reproduce what
  uneven frames do to the light.
- **Bloom keeps its size against the picture.** The bloom is a filter on the FX
  layer in the layer's layout pixels. The instrument's screen is 1440 layout
  pixels wide whatever size it is fitted to, so its blur is always 14.4 render
  pixels, the same as the game's flight screen in a 1440-pixel-wide window. The
  game's own blur against its picture changes with the window's width; the
  instrument's does not.
- **Cost.** In headless Chromium a jump from the start to the end of a burn took
  5.2 s (median of five), and a page with four instruments drew a frame every
  100 ms while one of them played. Headless Chromium rasters canvases without
  the graphics card, so these are upper figures; they were not measured in a
  desktop browser.

## Contract

### Definition of Done

- The schema accepts a valid document and refuses an invalid one, including
  unknown fields, out-of-range values, too many targets and a `start` without
  `rotation` (unit test).
- The component shows an invalid document's issues in place of the scene.
- The simulation half runs without a canvas; flying to the same instant twice,
  or after a backward jump, gives the same ship pose and velocity, tick count and
  salvage bodies as a fresh flight (unit test).
- A live held wreck stays within the Light Ion Cannon's reach across a burn;
  held shards expire after their lifetime and placed shards remain.
- The document determines which target choices exist.
- The Lab page offers the document's target choices with its default chosen;
  the component keeps the `data-*` attributes above.
- Without a `pane` the component shows no menu.
- A pane receives a read-only copy of the document (unit test).
- The four dated study examples keep rendering on the shared engine.
- The Lab shows the instrument in its default setting as a reference page:
  three layers with their own blend modes, the bloom filter, jump, play and
  pause, each view, each layer switch.
- A study page embeds the instrument through `FlightSceneEmbed`, hydrated and
  filling the band.
- The instrument's fidelity to play, its bloom size against the game's and
  its cost are measured and recorded (measurement script).
- The study light's state reports a delayed engine's charge rising with no
  output, then output at full charge.
- A replaced part's plume stays dark while other outlets stay lit, and the
  flight is the same with and without a study light (unit test).
- Tuning a delayed part's charge moves its release, reaches a study light's
  engine state and leaves the game's parts unchanged; an untuned flight runs on
  the game's own parts (unit test).
- The Lab page's study light switch shows the light's caption and flies the
  burn again at the same instant.

### Regression guardrails

- The instrument draws only through the production frame passes; it has no
  drawing of its own for ships, effects or weapons. A study light is the
  study's drawing, labelled on the scene, and it never changes the flight.
- Production code does not know the instrument: staging stays on the Lab side.
- Part tuning never changes the game's part definitions.
- Tests assert relations (same instant, same state; reach; expiry), not pinned
  geometry, colours or tuning.

### Scenarios

```gherkin
Scenario: Open a configured scene
  Given a document with a loadout, targets and a held wreck
  When a study embeds the instrument
  Then the scene shows the opening burn, view and time in the game's layers
  And the menu holds only what the study put there

Scenario: Jump back in time
  Given a burn flown to 10 s
  When the time is set to 3 s
  Then the burn is flown again from its start
  And the scene equals a fresh flight to 3 s, with the light of the whole flight

Scenario: Change view
  Given the Follow view at 3 s
  When Game is chosen
  Then the burn is flown again to 3 s under the game camera

Scenario: Hold a target ahead
  Given Held ahead is chosen
  When the burn plays
  Then a wreck stays the configured distance ahead of the ship
  And a broken wreck is replaced
  And its shards are gone after the configured lifetime

Scenario: Show a study's light for an engine
  Given a study light that replaces the Plasma engine's light
  When the burn plays
  Then the Plasma engine's production plume is not painted
  And the study's light is painted in its place, labelled as the study's
  And every other light and the flight itself are the game's

Scenario: Compare with the game's light
  Given a scene showing a study light
  When the study stops passing its light
  Then the burn is flown again to the same instant
  And the scene shows the game's own light

Scenario: Refuse a bad document
  Given a document with a negative held distance
  When the instrument opens
  Then it shows the issue and no scene
```


## Planet encounters — 15 November 2026

Study flight never adds manual piloting. The shared fixed burns, timeline, views
and burger pane remain the interaction model. Studies extend shared staging instead
of introducing their own flight controls.

The strict document accepts optional `planet` staging: `reference: "practice-venus"`,
a finite `orbitAngle` (default zero), and optional `atmosphere` with positive world-unit
`depth` and nonnegative `dragRate` in inverse seconds. This selects a Practice
simulation with its Sun and the current Venus body's radius, orbit, speed and mass;
other planets are removed. Wreck targets/held staging cannot be combined with this
mode. Documents without `planet` preserve the existing Derelicts scene.

`start.velocity` optionally supplies finite world-space x/y velocity in u/s;
omitting it retains the original at-rest start. Fixed burn inputs remain unchanged.
Atmospheric drag is an explicit experimental rule, not production behavior. Each
post-step tick damps planet-relative velocity exponentially by dragRate × overlap
density × dt. Density increases from zero when the ship's collision circle reaches
the outer edge to one at solid contact. Air translates with orbital velocity; winds
and co-rotation are omitted. No atmospheric damage is added. Production gravity,
engine rules, collision and hull damage remain active.

`FlightSceneInstrument` accepts an optional `planet` override, validated through
the full document schema. An invalid override reports an error and is not applied.
Changes replay from the start to the selected burn/time, reconstructing drag exactly
once per tick. Backward seek reconstructs the same state as a fresh flight.

Optional `planetAppearance` supplies a label and World/LFX painters receiving frozen
copies of the staged planet, ship, Sun and simulation seconds. This replaces the
staged body's drawing without permitting painters to change flight state. Without
it the production body drawing remains. Appearance changes redraw the same instant;
material rotation derives only from simulation time. Options belong in the existing
pane; the wrapper does not supply another timeline or flight loop.

The rock-atmospheres study is the first configured use. The canonical Flight scene
Lab also offers a planet encounter to expose the shared staging capability.

### Star colour inspection — 16 November 2026

Optional reactive `starAppearance` supplies strict six-digit hex `color` and
`glowColor`, validated by `StarAppearanceSchema`. The scene redraws the same
burn/time with the production standard star painter. An override uses the
standard body rather than the yellow-family palette; clearing it restores the
original painter and palette. This is a display override only: the simulation's
star, mass, radius, fields, collection, damage and flight state are untouched.
Planet appearance callbacks receive the displayed star colours in their frozen
snapshot. They decide whether to respond; this input does not automatically
relight materials. The canonical Flight scene page offers Stock/Warm/Cool.
`data-star-color` reports the supplied display body colour when present.


### Atmospheric study light and reactive approach — 16 November 2026

The optional `start` prop accepts the existing strict `StagedStartSchema` pose
and velocity. Like `planet`, it is validated in the complete document and a change
replays the selected burn to the selected tick without resetting the view. Invalid
staging is reported instead of silently applied. The canonical Flight scene planet
example offers Reference/Deeper start positions. The rock-atmospheres study supplies
Outside/Skim/Deeper approaches through this shared input rather than another loop.

`StudyLightState.ship.radius` supplies the simulation collision radius. For a
staged atmosphere, optional `atmosphere` contains current overlap `density`, world-unit
`clearance`, planet-relative `vx`/`vy` in u/s, and the unit direction towards
the body as `inwardX`/`inwardY`. Without an atmosphere it is absent.
These are copied numeric presentation values; study light cannot change gameplay.
Effects can emit through the existing budgeted `StudyLight.fx` callback into the
shared persistent surface, which owns pause, reset, seek and decay. This capability
adds no temperature, dose, damage or new simulation rules. The heat study uses it
for a provisional visual cue, with a filled planet-facing LFX contact highlight; engine output remains the game's own.
