# In-game camera framing

**Status:** owner decisions settled 2026-11-04; not started.

The in-game camera moves to dynamic zoom. On every frame it keeps these inside the
active camera box:

- the ship's full outline
- the centre of the closest gravity source: a moon, planet or the star
- when there is one, the target: the top entry of a prioritized list of field
  objects. It is not a weapon target. Today that means energy cells, then intact
  derelicts; enemies come later.

Today's camera frames the ship and the star inside the full view, and snaps between
stepped zoom levels (0.3.1). This plan replaces both behaviours in the game.

## Active camera box

The in-game controllers study (`/lab/studies/in-game-controllers`, part 02.2) defines
the box:

- It is the stage minus the side instrumentation margins (`M_x`) and the top and
  bottom margins (`M_y`).
- Space renders behind the margins, but HUD instruments and touch controls live there.
- The study is still open. The owner adopted its "Balanced" preset (220 / 64 logical
  px) as the game's first tuning values on 2026-11-04.
- The camera uses the current fixed 16:9 stage. The study's 16:9 to 4:3 envelope is
  out of scope.

## Owning specs

- New living spec `docs/specs/camera.md`, written with the `spec` skill. It owns
  framing, the box, zoom and wrap reframing, and the `camera` tuning section.
- `docs/specs/playable-alpha.md`: its camera lines and the 0.3.1 stepped-zoom
  section point to the new spec instead of defining camera behaviour.
- `docs/specs/gravity-field.md`: the tuning file and its section convention (read
  only).

## Acceptance

- **The box is a hard constraint.** Every rendered frame keeps the ship's outline,
  the gravity source's centre and the target inside the box. This holds through pan
  smoothing and zoom easing.
  - Padding sets the comfortable fit the camera eases towards. The box edge is the
    limit that is never crossed.
  - When easing would break the limit, the camera moves or zooms out that frame.
- **Every situation can be framed.** The widest zoom is computed from the box rather
  than the full view, so the whole arena always fits inside the box.
- **Gravity source.** The closest of the star, the planets and the moons, measured by
  centre distance. Every planetary body counts. The existing `gravitySource()` helper
  only counts planets whose influence radius contains the ship, so the camera
  doesn't reuse it as-is.
- **Target.**
  - Targets come from a prioritized list of field objects, independent of weapons
    and loadout.
  - Each list entry is an object kind with a proximity radius. The camera frames the
    nearest object of the highest-priority kind present within its radius.
  - The first list, in priority order: energy cells within 600 u, then intact
    derelicts within 600 u. Enemies join later by adding an entry; the camera code
    doesn't change.
  - With no target in range, the camera frames two subjects.
- **Stickiness.**
  - A new gravity source or target of the same kind replaces the current one only
    once it is clearly closer, by a tunable margin.
  - A target of higher priority replaces it at once.
- **Dynamic zoom.**
  - The zoom eases continuously towards the padded fit, on a log scale.
  - Zoom-out and zoom-in have separate response rates.
  - The zoom range runs from the whole arena down to today's closest level (1.6×).
  - Stepped levels and their settings are removed from the game.
- **Wrap** reframes immediately, as it does today.
- **Framing doesn't affect the simulation.** It reads simulation state and never
  changes it. Identical settings and inputs still produce identical world states,
  and challenge scoring is unaffected.
- **Tuning.** Production camera values live in a `camera` section of
  `packages/mode-a/src/lib/tuning.json`, owned by the camera spec:
  - box margins, padding, pan response and zoom rates
  - the stickiness margin
  - the target list with each kind's radius
- **Old trial JSON and links still load.** `FlightSettingsSchema` accepts and drops
  the old `zoomSteps` field.

## Slices

- [ ] 1. Spec:
  - Write `docs/specs/camera.md` with the contract above.
  - Point `playable-alpha.md`'s camera lines at it.
  - Add the historical banner to `game-viewport.md`. It still describes
    bounding-box zoom as current and has no banner, unlike `camera-system.md` and the
    v0.4.0 zoom spec.
- [ ] 2. Tuning:
  - Add a `CameraTuningSchema` and the `camera` section to `tuning.json`.
  - Make `FlightSettingsSchema.camera` drop `zoomSteps` and take its defaults from
    the tuning.
  - Tests: old JSON with `zoomSteps` parses, and invalid values are rejected.
- [ ] 3. Subject selection: a pure function in mode-a takes simulation state and the
  previous subjects and returns the next subjects. Unit tests cover:
  - the closest gravity source wins, whether it is the star, a planet or a moon
  - a target of higher priority beats a nearer one of lower priority, for example
    an energy cell beats a nearer derelict
  - objects outside their kind's radius, kinds not on the list and destroyed
    objects are ignored
  - selection doesn't depend on the loadout or on weapon state
  - stickiness: two nearly equal alternating candidates don't flip every tick
- [ ] 4. Camera: `Camera.frame()` takes a list of subjects (each a point with an
  extent), the box and the zoom rates. The stepped-level code is removed. Tests
  assert relations only:
  - In scripted flights covering a planet dive, a derelict pass, a wreck break, a
    wrap and a pass close to the star, every frame keeps the subjects inside the box.
  - Zoom stays inside its range, and at the widest zoom the arena fits inside the box.
  - For the same scale ratio, zoom-out settles sooner than zoom-in when its rate is
    higher.
  - Coordinates still round-trip between world and screen.
- [ ] 5. Game wiring:
  - `FlightDeck` passes the selected subjects and the tuning to the camera.
  - The Flight Lab's existing camera panel replaces its zoom-level controls with the
    new tuning values, so trials keep working.
  - Replace the stepped-zoom browser test in `tests/browser/alpha.spec.ts` with a
    check that play frames the ship inside the box. Keyboard and touch checks stay.
- [ ] 6. Evidence:
  - Run `FX_PROFILE_CAMERA=moving` profiles, recording the device and backend.
    Report them as measurements, not as gates.
  - Run the full verification.
  - Hand the owner a playable build to fly. Feel, including how HUD guides read over
    the art across zoom scales, is the owner's judgement and is not recorded here.

## Owner decisions

- **Zoom motion: decided 2026-11-04, continuous dynamic zoom.** Eased steps were
  considered and not chosen.
- **Gravity sources: decided 2026-11-04, the closest one.**
- **Target list: decided 2026-11-04.** 1. energy cells within 600 u; 2. intact
  derelicts within 600 u.
- **Box margins: decided 2026-11-04, the Balanced preset, 220 / 64 logical px.**

## Concurrent work

- **Tuning file.** `2026-11-04-gravity-field-lab.md` owns the tuning file's loader
  and `tuning:apply`, and `2026-11-04-lab-usability.md` adds ship sections. This
  plan only adds a `camera` section through the same loader. Re-read both before
  slice 2.
- **Flight Lab.** Read `FlightDeck.svelte` again before slice 5, since the Lab
  usability plan may touch the same page.
- **Other sessions.** Another session currently has uncommitted changes in the
  instrument, simulation, physics and gravity specs. This plan does not edit or
  commit them.
- **Gravity field Lab.** It can add Lab wells and run without a sun. The camera
  treats Lab wells as gravity sources there, and frames the ship and any target when
  there is no gravity source.
