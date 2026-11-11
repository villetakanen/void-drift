# Game Screen

## Blueprint

### Context

Flight in every mode (Survival, Practice and Derelicts) occupies the same
self-contained game screen. Desktop and iPad landscape players receive a play area that uses their whole screen, dependable controls
and a deliberate way to pause and leave. Browser dimensions affect presentation,
never the run.

### Architecture and boundaries

- `apps/web/src/components/FlightDeck.svelte` composes the screen and connects its
  availability to the simulation loop, input and renderer.
- `apps/web/src/lib/game-screen.ts` defines the stage, gutter and active-area
  geometry.
- `packages/mode-a/src/lib/flight-frame.ts` defines the in-flight frame's
  canvas passes and their draw order; the screen draws the frame through it.
  [Render](../render/spec.md) owns that model.
- `apps/web/src/pages/index.astro`, `apps/web/src/layouts/Layout.astro` and
  `packages/core/src/lib/styles/flight.css` provide viewport containment.
- This contract owns screen geometry, layer placement, browser interaction
  containment, the aspect gate and access to navigation during flight, in every
  mode and from either launch source (title screen or Hangar).
- [Survival](../survival/spec.md) owns resources, death and scoring eligibility;
  [camera](../camera/spec.md) owns world framing and zoom within the active area;
  [controls](../controls/spec.md) owns command mappings, input aggregation and
  the appearance and arrangement of the thrust pads within the side gutters;
  [dialogs](../dialogs/spec.md) owns modal behavior and focus management.
  The deck's instruments own their values and appearance; this screen places
  them. The [world HUD](../../../architecture.md#canonical-feature-names) is drawn
  with the world and belongs to the features that draw it.
- [Landing page](../landing-page/spec.md) owns the title composition and launch;
  [Test flight](../test-flight/spec.md) owns Practice rules and its return to
  the Hangar through Pause.
- Screen availability is transient UI state, not a saved game or scoring field.

### Screen and interaction

- The stage fills the safe viewport at any aspect ratio of 4:3 or wider,
  ultra-wide included. Its logical height is 1080; its logical width follows the
  viewport ratio. Device pixel density affects sharpness, not geometry.
- Gutters are fixed in CSS pixels: 180 at each side and 48 at top and bottom,
  at every stage size. The active area is the centred rectangle inside them:
  the safe viewport less 360 CSS px in width and 96 CSS px in height. The screen
  exposes the active area in both CSS pixels and logical units.
- The rendered scene fills the whole stage, behind every gutter. The active area
  is the camera-fitting boundary, not a rendering clip.
- The side gutters hold the thrust pads; thrust touches register only on those
  pads, at the bottom of each side gutter. At the top, the left gutter holds the
  hull and power instruments and the right gutter the survival time with the
  running [Survival score](../survival/spec.md) below it. With
  [Playground](../experimental/spec.md) On, the scoring-off notice takes
  the score's place.
- At a safe viewport height of 700 CSS px and above, the side gutters hold
  their instruments, deck buttons and full-height pads without overlap.
- Just above each pad assembly sits one deck button: Pause on the left, and a
  Weapons button on the right that shows whether weapons are active or
  disabled. Each is white text in the pad marking type with a 1 CSS px white
  border and no fill. Weapons is disabled in every mode and drawn at 50%
  opacity.
- The top and bottom gutters hold information, such as key hints, the version
  and the logo. The bottom gutter holds the mode label and the mode's status
  lines: `G CLASS / SHARED CHALLENGE` for a ranked run, `GOD MODE` for
  Practice, `UNRANKED` for any other run (which runs are ranked follows the
  [game contract](../spec.md)), and engine feedback. No chrome covers the active area.
- Every flight mode fills the browser viewport with no header, footer, page
  navigation or page scrolling; the deck is the only
  chrome. Play works within ordinary browser chrome, with browser fullscreen
  optional, and respects device safe areas.
- Touch targets keep at least 44 CSS pixels and are laid out in CSS pixels,
  never by scaling a whole DOM scene.
- During active flight, the screen exposes gameplay controls and Pause.
  Links to other pages and return/abort actions live in paused or completed-run
  UI. Keyboard focus reaches only visible controls during play.
- Touching, holding or dragging the live play surface and its controls operates
  the game without selecting text, invoking a text/image callout, dragging page
  content, scrolling or triggering page zoom. Containment is scoped to play;
  editable dialog fields keep normal text entry and selection.
- Independent simultaneous touches work, and release, cancellation, lost pointer
  capture and loss of focus clear held commands. Pausing or blocking the screen
  clears input before another simulation step runs.
- A viewport narrower than 4:3 blocks flight and shows a rotate-to-continue
  message, on initial entry, on resize or rotation, and during the arrival
  countdown.
- While blocked, paused or hidden, simulation time, resources, score time,
  countdown and simulation-driven effects stay frozen. Returning to a 4:3 or
  wider viewport, or to the foreground, needs a deliberate Resume for an
  interrupted run; the run is preserved with no elapsed wall-clock time or stale
  held input replayed.
- The aspect gate takes precedence over Resume. A blocked screen shows no live
  flight controls beneath its overlay.

## Contract

### Definition of Done

- [ ] Every flight mode fills the viewport without a header, footer or document
  overflow.
- [ ] At 4:3 and every wider ratio, ultra-wide included, the stage fills the
  safe viewport with a logical height of 1080 and a logical width that follows
  the viewport ratio.
- [ ] Side gutters are 180 CSS px and top and bottom gutters 48 CSS px at every
  stage size; the active area is the safe viewport less 360 × 96 CSS px, exposed
  in CSS pixels and logical units, centred, and independent of the rendering
  bounds.
- [ ] A viewport narrower than 4:3 blocks flight and countdown, clears input,
  and shows the rotate-to-continue message before further simulation advancement.
- [x] Active play exposes no focusable page navigation; Pause and completed-run
  actions provide deliberate exits, preserving the correct launch-source return.
- [ ] Two-thumb pad input works without selection, callouts or document
  gestures on iPad Safari; cancellation and lost capture leave no stuck thrust.
- [ ] Each side gutter holds its thrust pads at the bottom, its deck button
  just above them (Pause left, Weapons right) and its instruments at the top
  (hull and power left, time and score right); the bottom gutter holds the mode label and
  status lines; no deck part covers the active area.
- [ ] At a safe viewport height of 700 CSS px and above, each side gutter's
  instruments, deck button and full-height pads do not overlap.
- [ ] Pause toggles pause as Escape does; Weapons is disabled and drawn at 50%
  opacity in every mode; both keep at least 44 CSS px of height.
- [ ] The mode label reads `G CLASS / SHARED CHALLENGE` for a ranked run,
  `GOD MODE` for Practice and `UNRANKED` for any other run.
- [ ] Restoring a 4:3 or wider viewport, or the foreground, preserves the run and
  requires Resume, without a time jump or stale thrust.
- [ ] Pause and game-over dialogs retain keyboard focus behavior and editable
  initials; gameplay gesture containment does not interfere with those fields.

### Regression guardrails

- Resizing preserves the seed, world state, resources and elapsed run time.
- Keyboard and simultaneous touch remain real inputs to the same simulation.
- Screen geometry changes leave physics, ranking and launch behavior unchanged.
  The camera consumes the active area; subject selection, zoom levels and
  framing policy stay in the camera contract.
- Lab studies remain developer surfaces with their own 1280 px minimum; it does
  not constrain the production screen.

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
  Then the stage fills the viewport at 4:3
  And each side gutter stays 180 CSS px and each top and bottom gutter 48 CSS px
  And the active area is the viewport less 360 by 96 CSS px
  And run state remains unchanged

Scenario: Ultra-wide fills the screen
  Given a 2560 by 1080 viewport
  When a run starts
  Then the stage fills the viewport without side bars
  And the active area widens with the viewport while the gutters keep their width

Scenario: Deck at the design floor
  Given a 1280 by 700 viewport
  When a run starts
  Then each side gutter shows its instruments, deck button and full-height pads
  And none of them overlap one another or the active area
  And the mode label sits in the bottom gutter

Scenario: Narrow while thrusting
  Given a landscape iPad run with both engines held
  When the viewport becomes narrower than 4:3
  Then the run freezes and both held commands clear
  And a rotate-to-continue message covers the play surface
  When a 4:3 or wider viewport is restored
  Then the same run remains paused until Resume
  And resuming requires fresh engine input

Scenario: Background during arrival
  Given a run is in its arrival countdown
  When the page becomes hidden
  Then the countdown and world remain frozen
  When the page becomes visible at 4:3 or wider and the player resumes
  Then the countdown continues from its held position
```

## References

- [In-game controllers study](../../../../apps/web/src/pages/lab/studies/in-game-controllers.astro)
  supplies the CSS-pixel gutter model and the thrust-pad design that the
  controls contract places in the side gutters.
- [ASDLC Living Specs](https://asdlc.io/practices/living-specs/) and
  [The Spec](https://asdlc.io/patterns/the-spec/) guide the separation of durable
  screen behavior from implementation tasks and independently evolving features.
