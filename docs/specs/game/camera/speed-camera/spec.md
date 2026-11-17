# Speed Camera

## Blueprint

### Context

Speed camera is an experimental personal preference for live flight. It frames
the ship within a view whose scale responds to speed: slow flight brings the
view closer; fast flight opens it. Velocity changes allow transient off-centre
travel; following gradually matches actual motion and returns the ship to exact
screen centre during constant-velocity flight. The experiment asks whether this
makes flight easier to read while preserving the sensation of speed.

The star, enemies and other objects may leave the view. Only the player's ship
is a required framing subject. The tradeoff is less arena awareness in exchange
for a speed-responsive view around the ship. This feature is experienced in the actual game;
it requires no Lab study or study registry entry. Human playtesting stays outside
the repository and is not an acceptance gate or evidence requirement.

### Architecture and boundaries

- `packages/mode-a/src/lib/schemas/settings.ts` defines `speedCamera` as a
  boolean personal setting with default `false`. Changes to this data contract
  are schema-first.
- `apps/web/src/lib/stores/settings.ts` owns persistence under the existing
  `void-drift:settings` key and validates stored input through `SettingsSchema`.
  Older settings without this field retain their other valid choices and use Off.
- `apps/web/src/components/Settings.svelte` composes the shared Switch for the
  preference in Options.
  `apps/web/src/components/FlightDeck.svelte` selects camera behaviour from the
  live store; it does not expose a settings control.
- `apps/web/src/components/inputs/Switch.svelte` supplies the shared binary
  control in Options. The [design system](../../../factory/design-system/spec.md)
  owns its appearance and interaction.
- `packages/core/src/lib/physics/Camera.ts` owns framing and the shared camera
  transform. Speed camera consumes ship position, world velocity, elapsed
  simulation time and the active-area geometry supplied by FlightDeck.
- [Game screen](../../game-screen/spec.md) owns the active rectangle between
  gutters. It is not necessarily square. Camera offsets and safe bounds use
  this rectangle in logical units; rendering still fills the whole stage.
- [Options](../../options/spec.md) owns device persistence and fallback.
  [Camera](../spec.md) owns standard framing and shared rendering invariants.
  Speed camera changes presentation only, in every playable flight mode,
  independently of [Playground](../../experimental/spec.md).
- The preference is not a simulation setting, replay input, scoring field or
  Firestore field. It changes neither ranked eligibility nor submission.

### Preference and access

- Options shows **Speed camera**, marked **Experimental**, with an On/Off
  Switch and the explanation: “Zooms out with speed and shows more space ahead.”
- A fresh device starts Off. Off selects standard ship-and-star framing;
  On selects speed framing. The choice survives reloads and subsequent runs.
- Options is the only UI location for this preference. The Pause dialog contains
  no settings controls, including Speed camera. Its Settings navigation action
  leads to the separate Options page. Changing the preference requires no save
  action. Active flight keeps its existing controls.
- Pointer, keyboard and touch operate the switch. Its accessible name and
  checked state communicate the setting without relying on colour.
- Missing or invalid stored settings fall back safely according to Options;
  unavailable storage leaves the game playable with defaults.
- The feature exposes one binary choice. Curve, zoom and smoothing parameters
  belong to implementation tuning, rather than player-facing sliders.

### Zoom readout

- While Speed camera is On in flight, the left gutter shows ZOOM below its
  hull and power readouts, using the existing deck instrument treatment.
- The readout shows only `1×`, `2×`, `4×` or `8×`, relative to the widest
  speed-camera view. During continuous outward zoom it holds the upper label:
  `8×` until `4×` is reached, then `4×` until `2×`, then `2×` until `1×`.
  Exact levels show their own label; intermediate or decimal values and
  nearest-level rounding are never shown. Inward cuts show the reached level.
- This is a passive display. It changes neither the camera's actual scale nor
  its timing, follows the deck's pause visibility, and is absent when Speed
  camera is Off.

### Speed and zoom

- Speed is the magnitude of the ship's world velocity. Heading, thrust input,
  angular velocity and distance from the star do not directly select zoom.
  Wrapping the arena does not count as a burst of speed.
- At rest and at low speeds up to 100 world units per second, the desired view
  is the close view. This low-speed band makes the 8× cut eligible while small
  drift or gravity-driven motion remains, rather than requiring exact rest.
  Above it, desired visible world extent increases continuously and monotonically
  between finite close and wide limits. Desired magnification is 8× through
  100 units per second, 4× at 200, 2× at 300 and 1× at 400, with continuous
  geometric interpolation between those speed points. Thus each closer inward
  level can qualify throughout the speed range up to its corresponding point.
  The initial wide-view threshold is 400 world units per second, covering the
  usual 200–400 propulsion-speed range. The 600-unit-per-second
  starting velocity is already above that threshold and uses the widest demand.
  Speed above the threshold keeps the wide limit. This is camera tuning, not
  a ship speed limit or a change to the starting velocity.
- Outward zoom follows this continuous speed demand with ease-in and ease-out:
  a new outward movement starts with zero scale-change rate, builds gently and
  slows as it settles. It responds on the first active step without an eligibility
  delay, stays monotonic toward a fixed demand and never overshoots. Retargeting
  may stop widening but cannot introduce continuous inward motion.
  The outward response uses simulation time and freezes while simulation is
  stopped. The demand curve favours keeping close views available at propulsion
  speeds. During widening, screen-space travel rate may decrease as magnification
  falls; a monotonically increasing `speed × desired zoom` is not required.
- Inward zoom uses four geometric levels relative to the widest speed-camera
  view: `1×`, `2×`, `4×`, `8×`. These are relative magnifications, not absolute
  renderer zoom values. The closest level shows one eighth of the widest view's
  linear world extent, subject to hull containment.
- When speed demand permits a closer view, hold the current scale. The next
  candidate is the smallest inward level strictly above the current scale,
  including when outward zoom has left the camera between levels. A candidate
  is eligible only while its magnification is no greater than the continuous
  speed demand permits and it can contain the ship safely.
- The same candidate must remain eligible for 1.5 continuous seconds of active
  simulation time before one instantaneous inward cut. Reset the timer after
  each cut; reaching several eligible levels still requires a separate 1.5-second
  wait per level. Hold between cuts, without inward interpolation or a final
  continuous creep towards the demand. If no closer level is eligible, hold.
- Increasing speed cancels pending inward eligibility time. Losing eligibility
  or changing candidate also resets it. Sustained constant speed may qualify
  for an inward cut; acceleration cannot inherit a timer from earlier braking.
  A demand for a wider view starts smooth outward zoom immediately.
- Each inward cut is a direct scale change, with no blackout, flash or fade.
  Adjust camera position simultaneously so the ship retains its screen position
  across the scale change. Ordinary follow panning continues independently;
  containment corrections take precedence if the larger hull needs more room.
- The continuous demand curve is monotonic; the actual view is intentionally
  history-dependent because of holds and cuts. A single monotonic settled
  `speed × actual zoom` function is not required across inward step thresholds.
- The mapping uses shared world-speed units across ships. Changing chassis or
  loadout does not independently change framing at the same position and velocity,
  except where hull containment requires it.

### Ship placement and motion

- Speed selects zoom. Pan gradually matches the ship's actual motion while
  closing the remaining distance to screen centre. Heading does not select a
  target screen position, and camera motion never feeds back into the ship.
- Changes of velocity let the ship visibly leave centre. The camera gradually
  acquires matching velocity, initially at a response rate of 1.5 per simulation
  second. Pan estimates travel from successive ship positions over active
  simulation time; reset and wrap establish a fresh position baseline.
- Once velocity stays constant, including the 200–400 propulsion-speed range
  and 600-unit-per-second arrival, the camera catches up with that velocity and
  closes the remaining screen offset.
  The ship settles at the very centre while continuing to travel; there is no
  permanent offset proportional to its speed. This applies to diagonal travel too.
- Residual centring applies everywhere, initially at 0.5 per simulation second.
  For a stopped ship it halves the distance to centre in roughly 1.4 seconds.
  Braking and reversal discard camera travel that would outrun the new motion;
  a stationary target is approached without overshoot.
- The follow response uses simulation time and is frame-rate independent.
  Velocity matching and residual centring are separate, so changing speed can
  produce visible screen-space travel before the ship returns to centre.
  A subpixel residual settles exactly at centre once camera motion matches;
  following does not retain an asymptotic screen offset indefinitely.
- The active rectangle remains the containment boundary. There is no dead zone
  or permanently off-centre resting position. Safety corrections can move the
  view immediately to keep the hull in bounds.
- A new run, reset or wrap initially centres the ship at its resulting position.
  Subsequent changes of velocity can move the ship off-centre in any direction.
- Outward zoom is smooth and frame-rate independent. Zoom changes anchor the
  ship's current screen position independently of ordinary pan; containment
  corrections take precedence. Inward cuts retain their simulation-time eligibility.
- At constant velocity, scale and screen placement settle, with the ship at
  centre even when moving. A stopped ship also settles at centre.
  The camera does not rotate the world.
- On every rendered flight frame, the ship's body stays wholly within a safe
  inset of the active area. The inset includes the projected hull bounds and
  positive clearance from the gutters. Visibility takes precedence over
  easing during acceleration, reversal, resize and preference changes; effects
  such as exhaust are not part of this containment guarantee.
- If the current zoom leaves insufficient room for the ship and clearance,
  framing widens enough to fit before applying follow pan. Safety
  can override the ordinary close limit and pan placement.

### Transitions and lifecycle

- Changing the preference during a run preserves the current camera transform
  as the start of the transition. On the next active simulation steps, framing
  moves to the selected policy while maintaining ship visibility. Entering speed
  framing uses smooth outward zoom or timed inward cuts as appropriate, with a
  fresh inward timer; it does not introduce a continuous inward transition.
- Returning to standard framing allows intermediate scales during this
  transition. Once settled, standard discrete zoom and ship-and-star rules apply.
- While paused, hidden or aspect-blocked, camera motion freezes with simulation
  time. A preference change while paused is retained and applied on Resume;
  elapsed wall-clock time advances neither the transition nor inward eligibility.
  Resume continues any retained eligibility time unless the preference changed.
- A new run, reset or arena wrap reframes immediately at the ship's resulting
  position and velocity, clearing stale pan history and inward eligibility time.
  This discontinuity may initialise scale directly from continuous speed demand. It never sweeps across the
  arena to catch up with a discontinuous position change.
- Resizing recomputes placement from the new active bounds and restores safe
  containment immediately and clears inward eligibility time. Leaving speed
  framing also clears that timer. The existing aspect gate remains authoritative.
- All world passes use the same camera transform. World-fixed effects retain
  their positions and ages; the deck remains outside the transform. Background
  stars cover the full stage throughout outward zoom, inward cuts and transitions.

### Tuning boundaries

The widest world extent, safe clearance, outward easing, velocity-matching and
residual-centring rates are implementation tuning choices within this contract.
The speed-demand points are 8× through 100 u/s, 4× at 200 u/s, 2× at 300 u/s
and 1× at 400 u/s, with geometric interpolation between them.
Four relative levels spanning 1×–8× and 1.5 seconds of continuous eligibility per
inward cut define this experiment; changing them requires updating this contract.
Define tuning together with finite values and meaningful units. The initial
velocity-matching and residual-centring rates are adjustable within the containment
rule. These choices do not block implementation or add new settings. Changing
speed-selected zoom, motion matching with eventual exact centring, ship-only framing,
fixed world orientation or scoring independence changes the feature contract.

## Contract

### Definition of Done

- SC1: Options shows the shared, accessible Speed camera Switch, marked
  Experimental, and reads and writes the persisted preference. The Pause dialog
  contains no settings controls.
- SC2: Fresh and legacy settings select Off; a legacy valid Invert controls
  choice survives adding the missing field. Invalid storage cannot block flight.
- SC3: On widens smoothly from continuous speed demand and tightens only through
  the four specified relative levels. Each inward cut requires 1.5 continuous
  seconds of eligibility, advances one level and resets its timer. Acceleration
  cancels pending time; outward demand is never blocked by that timer.
- SC4: Velocity changes let the ship move visibly off-centre. With any constant
  velocity, including 400 and 600 world units per second and diagonal travel,
  the camera matches travel and returns the ship to centre without a permanent following
  offset. A stopped ship also reaches centre. Heading does not select pan.
- SC5: Constant velocity settles without oscillation. Equivalent elapsed
  simulation time gives equivalent camera response at different render rates.
- SC6: The ship body remains within the active-area safe bounds during ordinary
  flight, reversals, wraps, resizes and policy transitions at supported aspects.
- SC7: The camera reads the preference from the store without exposing it in
  Pause. Off restores standard framing after any policy transition.
- SC8: Pausing freezes camera motion; reset and wrap reframe without a sweep.
- SC9: Physics, inputs, replay outcome, scoring eligibility and submitted score
  data are independent of this preference in all flight modes.
- SC10: World and screen coordinates round-trip through outward zoom and inward cuts;
  effects stay world-anchored, background coverage is complete and deck geometry
  remains fixed.
- SC11: Inward cuts preserve the ship's screen position except for required
  containment corrections and introduce no blackout, flash, fade or inward easing.
- SC12: Pause freezes eligibility; reset, wrap, resize and policy changes clear
  it. Entering speed framing obeys the same inward hold-and-cut policy.
- SC13: With Speed camera On, ZOOM appears below Hull and Power in the left
  gutter and shows only 1×, 2×, 4× or 8×. Outward motion retains each upper label
  until the next lower level is reached. With Speed camera Off it is absent.
- SC14: Speed demand allows 8× through 100 u/s, 4× through 200 u/s and 2×
  through 300 u/s, reaching 1× at 400 u/s. The 600 u/s arrival uses widest demand
  without changing ship physics.

### Regression guardrails

- Default Off retains standard camera behaviour outside explicit transitions.
- Keyboard and iPad landscape touch controls remain connected to the game loop.
- Speed camera and Playground remain separate preferences with separate meaning.
- Camera state never feeds into simulation state or random-number consumption.
- The active area remains a fitting boundary, not a rendering clip.

### Scenarios

```gherkin
Scenario: Accelerate and coast
  Given Speed camera is On and the ship is at rest
  When the ship accelerates to the right and then coasts at constant velocity
  Then the view widens continuously within its limits
  And the ship can move off-centre while velocity changes
  And the camera gradually matches its travel and pans it back to centre
  And scale and centred placement settle while velocity stays constant

Scenario: Zoom labels hold until the next outward level
  Given Speed camera is On and the relative scale is 8×
  When outward zoom passes through 6×
  Then the left gutter still shows ZOOM 8× below Hull and Power
  When actual scale reaches 4×
  Then the readout shows 4× until actual scale reaches 2×
  And it then shows 2× until actual scale reaches 1×
  And it never shows a decimal value or rounds to the nearest level

Scenario: Constant diagonal travel settles at centre
  Given Speed camera is On and the ship travels at constant diagonal velocity
  When the camera matches its actual motion and closes the residual offset
  Then the ship reaches exact screen centre while continuing to travel
  And no directional offset, dead zone or permanent following lag remains

Scenario: Aim while drifting
  Given the ship is drifting right with Speed camera On
  When its heading changes without changing its velocity
  Then its zoom demand and follow-pan behaviour remain unchanged

Scenario: Brake to rest
  Given the ship is moving quickly with Speed camera On
  When its speed falls to zero
  Then the current scale holds for 1.5 seconds before cutting one level closer
  And each subsequent inward cut requires another 1.5 seconds
  And the stopped ship gradually drifts back to centre
  And centring continues until it settles at the very centre
  And each cut preserves its screen position unless containment requires correction

Scenario: Brief slowdown followed by acceleration
  Given an inward candidate has been eligible for less than 1.5 seconds
  When the ship accelerates again
  Then the pending inward timer resets and no delayed inward cut occurs
  And any demand for a wider view starts smooth outward zoom immediately

Scenario: Outward zoom stops between inward levels
  Given the current relative scale is 1.6× after outward zoom
  And continuous speed demand permits 2× but not 4×
  When speed stays constant for 1.5 seconds
  Then the camera cuts directly to 2× and resets the timer
  And it holds at 2× without creeping inward
  And there is no blackout or flash

Scenario: Pause does not qualify an inward cut
  Given an inward candidate has been eligible for one second
  When I pause for ten seconds and resume without changing the preference
  Then another 0.5 seconds of continuous eligibility is required before the cut

Scenario: Reverse suddenly
  Given the ship is moving quickly with Speed camera On
  When its velocity reverses
  Then the ship can travel back across the view without an assigned side
  And the view gradually matches its new travel and returns it to centre
  And the ship body remains within the safe active bounds on every frame

Scenario: Change the preference in Options
  Given I open Options
  When I turn Speed camera On and start a flight
  Then the flight uses speed framing
  When I open Pause
  Then the dialog contains no settings controls
  And Settings is a navigation action to the separate Options page

Scenario: Wrap at high speed
  Given Speed camera is On and the ship crosses the arena edge
  When the simulation wraps the ship
  Then the camera reframes immediately at the resulting position and velocity
  And the wrap produces neither a pan across the arena nor a false speed spike

Scenario: Load older settings
  Given stored settings contain a valid Invert controls choice and no speedCamera field
  When the game loads
  Then Speed camera is Off and the Invert controls choice is retained

Scenario: Recover from corrupted storage
  Given stored settings contain an invalid speedCamera value
  When the game loads
  Then schema validation supplies safe defaults with Speed camera Off
  And a flight can start normally

Scenario: Preserve ranked rules
  Given an eligible ranked Survival run with Playground Off
  When I enable Speed camera
  Then the run retains its scoring eligibility and simulation rules
  And the camera preference adds no field to score submission
```
