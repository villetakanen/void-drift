# Game Screen

## Blueprint

### Context

Flight occupies a self-contained game screen. Desktop, iPad and landscape phone
players receive a bounded play area, dependable controls and a deliberate way to
pause and leave. Browser dimensions affect presentation rather than the run.

### Architecture and boundaries

- `apps/web/src/components/FlightDeck.svelte` composes the screen and connects its
  availability to the simulation loop, input and renderer.
- `apps/web/src/lib/game-screen.ts` defines the adaptive stage and gutter geometry.
- `apps/web/src/pages/index.astro`, `apps/web/src/layouts/Layout.astro` and
  `packages/core/src/lib/styles/flight.css` provide viewport containment.
- This contract owns screen geometry, layer placement, browser interaction
  containment, orientation gating and access to navigation during Survival.
  It also applies when Survival is launched from Hangar.
- [Survival](../survival/spec.md) owns resources, death and scoring eligibility;
  [camera](../camera/spec.md) owns world framing and zoom;
  [controls](../controls/spec.md) owns command mappings and input aggregation;
  [dialogs](../dialogs/spec.md) owns modal behavior and focus management.
  HUD instruments retain their own values and appearance; this screen only
  provides their placement bounds. Control appearance and arrangement within
  each gutter belong to the controls contract.
- [Landing page](../landing-page/spec.md) owns the title composition and launch;
  [Test flight](../test-flight/spec.md) owns training commands. Those commands
  are not Survival navigation. This spec does not require new routes or an
  application-wide SPA conversion.
- Screen availability is transient UI state, not a saved game or scoring field.
  Any future persisted or externally supplied screen data requires a schema
  before changing that data contract.

### Screen and interaction

- The stage has a constant logical height of 1080 and an aspect ratio clamped
  between 4:3 and 16:9: its logical width ranges from 1440 to 1920. It scales
  uniformly to fit the available safe viewport, centred with void-coloured bars
  outside those bounds. Device pixel density affects sharpness, not geometry.
- The rendered scene fills the stage, including behind its instrumentation.
  Each side has an instrumentation gutter equal to one sixth of the logical
  stage height: 180 logical units at height 1080. Gutters scale uniformly with
  the stage; 180 is not a fixed CSS-pixel width or a per-device breakpoint.
  The central active area is therefore 1560 units wide at 16:9 and 1080 units
  wide at 4:3. This screen adds no separate top/bottom gutter requirement.
- The active area is the camera-fitting boundary, not a rendering clip. Camera
  subjects and zoom selection belong to the camera contract; scene artwork,
  including stars and other objects outside the active area, continues behind
  the gutters to the stage edges. Camera integration consumes this boundary
  separately from the full rendering dimensions. Wiring those bounds into
  camera fitting is a separate camera change; the screen exposes them without
  changing subject selection, zoom levels or fitting policy.
- The game fills the available browser viewport, with no website header,
  footer or page scrolling. Browser fullscreen is optional; play works within
  ordinary browser chrome and respects device safe areas.
- Canvas, HUD and touch controls share the fitted play-area bounds. Instruments
  and controls remain anchored to that area through resize. Touch targets retain
  at least 44 CSS pixels and are not reduced by scaling an entire DOM scene.
- During active Survival, the screen exposes gameplay controls and Pause.
  Links to other pages and return/abort actions are available through paused or
  completed-run UI. Keyboard focus cannot reach hidden navigation during play.
- Touching, holding or dragging the live play surface and its controls operates
  the game without selecting text, invoking a text/image callout, dragging page
  content, scrolling or triggering page zoom. Containment is scoped to play;
  editable dialog fields keep normal text entry and selection.
- Independent simultaneous touches work, and release, cancellation, lost pointer
  capture and loss of focus clear held commands. Pausing or blocking the screen
  clears input before another simulation step can run.
- A viewport whose width is less than or equal to its height blocks flight and
  shows a rotate-to-landscape message. The gate applies on initial entry and
  rotation, including during the arrival countdown.
- While blocked, paused or hidden, simulation time, resources, score time,
  countdown and simulation-driven effects remain frozen. Returning to landscape
  or foreground requires deliberate Resume for an interrupted run; it preserves
  the run and does not replay elapsed wall-clock time or stale held input.
- A rotate gate takes precedence over Resume. Blocking the screen never exposes
  live flight controls beneath an interactive overlay.

## Contract

### Definition of Done

- [x] Survival fills the viewport without a header, footer or document overflow.
- [x] At 1920×1080, 1024×768 and 844×390 viewports, the stage is respectively
  1920×1080, 1440×1080 and 1920×1080 logical units, fitted without cropping.
- [x] Intermediate landscape ratios interpolate stage width; instrumentation
  gutters remain one sixth of stage height and the central active-area bounds
  are available independently of the full rendering bounds.
- [ ] Canvas, HUD and controls retain their common bounds across desktop, iPad
  landscape and landscape phone sizes, with usable safe-area-aware targets.
- [x] Active play exposes no focusable page navigation; Pause and completed-run
  actions provide deliberate exits, preserving the correct launch-source return.
- [ ] Two-finger engine input works without selection, callouts or document
  gestures on iPad Safari; cancellation and lost capture leave no stuck thrust.
- [x] Portrait entry and rotation freeze both flight and countdown, clear input,
  and show the orientation gate before further simulation advancement.
- [x] Landscape restoration and foreground restoration preserve the run and
  require Resume, without a time jump or stale thrust.
- [ ] Pause and game-over dialogs retain keyboard focus behavior and editable
  initials; gameplay gesture containment does not interfere with those fields.

### Regression guardrails

- Resizing preserves the seed, world state, resources and elapsed run time.
- Keyboard and simultaneous touch remain real inputs to the same simulation.
- Screen changes preserve camera policy, physics, ranking and launch behavior;
  available active-area bounds change with the adaptive stage width. The screen
  contract does not select camera subjects, zoom levels or framing algorithms.
- Lab studies remain developer surfaces; their viewport requirements do not
  restrict the production game's landscape phone support.

### Scenarios

```gherkin
Scenario: Pause before leaving
  Given Survival is running from the title screen
  Then only gameplay controls and Pause are available on the screen
  When the player pauses and chooses Abort
  Then the title screen returns without reloading the page

Scenario: Resize without changing the run
  Given a paused run in a 1920 by 1080 viewport
  When the viewport changes to 1024 by 768
  Then the stage becomes 1440 by 1080 logical units and fits the viewport
  And run state remains unchanged
  And the central active-area width becomes 1080 logical units
  And each side gutter remains 180 logical units wide
  And HUD and controls remain anchored inside the play area

Scenario: Rotate while thrusting
  Given a landscape iPad run with both engines held
  When the viewport becomes portrait
  Then the run freezes and both held commands clear
  And a rotate-to-landscape message covers the play surface
  When landscape is restored
  Then the same run remains paused until Resume
  And resuming requires fresh engine input

Scenario: Background during arrival
  Given a run is in its arrival countdown
  When the page becomes hidden
  Then the countdown and world remain frozen
  When the page becomes visible in landscape and the player resumes
  Then the countdown continues from its held position
```

## References

- [In-game controllers study](../../../../apps/web/src/pages/lab/studies/in-game-controllers.astro)
  supplies the 16:9–4:3 envelope and shared instrument-margin model adopted here.
  Side gutters are one sixth of stage height. Angled thrust-flap design and
  arrangement within the gutters belong to separate controls work.
- [ASDLC Living Specs](https://asdlc.io/practices/living-specs/) and
  [The Spec](https://asdlc.io/patterns/the-spec/) guide the separation of durable
  screen behavior from implementation tasks and independently evolving features.


## Standard-Sun field HUD — 2026-11-07

The world layer composes the shared `drawSunFields` renderer with live simulation
collection and applied Sun-damage rates. The [star contract](../world/star/spec.md)
owns colours, patterns, fills and the visual 2 CSS px solar inset. Strokes remain
1 CSS px after both camera transforms and stage scaling; display density changes
rasterization only. The overlay is painted into the existing canvas and introduces
no input surface, preserving keyboard and simultaneous landscape touch controls.
Collection activation is independent of net battery gain or capacity saturation.
