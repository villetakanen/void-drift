# Playable alpha contract

Status: implementation in progress, 2026-10-28. Scope approved in the voice-led rebuild conversation.

Screen composition, viewport fitting and play availability follow
[Game Screen](game-screen/spec.md).

## Architecture

`packages/mode-a/src/lib/simulation.ts` owns a fixed 60 Hz survival simulation.
Game and production-backed Lab instruments share simulation and core rendering primitives.
`schemas/flight.ts` validates flight settings and replay inputs; ship tuning uses the
existing ship-profile schema. Assembled propulsion follows the shared
[ship propulsion contract](ship-propulsion.md); legacy stock trials retain their
separate physics. Gravity: [gravity-field.md](gravity-field.md).

All ranked runs use the current challenge `CHALLENGE` (`arrival-2`), a fresh per-run seed, a G-class star, and stock profiles.
Scoring is casual client-reported survival time, clearly labeled: Firestore rules
validate ownership, shape, version and bounds, but do not prove an honest simulation.
Each anonymous player keeps one best score per ranked ship, independently of other
players and crafts. Successful saving opens Top Scores, which displays the 30
longest times across crafts. The score heading, results and action strip share
one design-system panel; long boards scroll with the page and narrow tables
scroll within the panel. Equal or shorter runs retain the existing best. Different balance versions
use separate boards. Lab runs and imported tuning cannot submit ranked scores.
Firebase Auth and Firestore replace Supabase. Paths are
`artifacts/{appId}/scores/{challenge}_{uid}_{shipId}`. Offline play remains available.

## Contract

- Three ships apply thrust, turning, hull and power-drain multipliers.
- Fixed-step replay reproduces world state for identical validated settings and inputs.
- Keyboard A/D or arrows activate differential engines; both produce forward thrust.
- Landscape touch buttons support simultaneous presses, release/cancel and blur reset,
  with targets of at least 44 CSS pixels. Laptop/desktop keyboard play is the primary
  development experience. Controls give visible feedback when active.
- Start, pause/resume, death and restart work without page reload or service credentials.
- Camera frames ship and star, fits their extents with padding, snaps between discrete zoom levels, and snaps
  framing at antipodal arena wrap while preserving ship velocity.
- Firebase rules reject unauthenticated, other-owner, malformed, mismatched-document,
  wrong-challenge, out-of-bounds, decreasing-score, extra-field and deletion writes.
- Browser checks cover real displacement, all ships, touch release/cancel, pause,
  death/restart, and unavailable leaderboard behavior.
- Unit tests, Svelte/types, lint, build, browser and Firebase rule checks pass together.
- Live release requires a selected Firebase project and deployment evidence.

## Scenarios

Given a stock ship, when both engines fire for 120 fixed steps, it moves and consumes
power according to that profile. Resetting and replaying reproduces the same state.
Given a ship crosses the arena edge, it reappears inside the opposite boundary with
inward momentum; the camera immediately reframes without a long pan.
Given Firebase is absent, the game remains playable and shared scores explain their
unavailability. Given valid configuration, separate anonymous players can compete.

## Stepped zoom — patch 0.3.1

Stage geometry and the active-area boundary follow
[Game Screen](game-screen/spec.md); camera behavior is specified below.
The shared camera defaults to five geometrically spaced levels from whole-system
view (the 1200-unit-radius arena plus padding) to 1.6× close view. Automatic framing
selects the closest level that fits ship and star with padding. Both zoom directions
snap immediately, recentering on their midpoint; panning between changes remains
smooth. Zoom-in requires 8% spare room to prevent threshold flicker. Wraps reset
framing immediately. This supersedes the earlier continuous zoom behavior.

FlightSettingsSchema validates an integer zoomSteps from 4 through 11; older settings
without it default to five.

Trails remain world-space samples, transformed together with the ship and planets.
Changing zoom does not clear trails, advance simulation time, or restart effects.

Acceptance: reject fractional/out-of-range counts; exercise snapping in both directions,
threshold stability, coordinate round-trips, and existing keyboard/touch controls.
Human review of reorientation and preferred level count remains pending.

## Player navigation and version labels — patch 0.3.2

The [title screen](landing-page/spec.md) exposes PRESS START, Hangar, Top Scores,
Settings and Credits. PRESS START launches Wasp with a Gravity coil in its left
hull slot and its right hull slot empty; Hangar owns ship choice. Runs retain
their launch source for Abort and game-over return. Game and leaderboard labels use
the web package version independently of the internal scoring challenge identifier.

## Engine effects alpha — 30 October 2026 (historical painter)

The surface recipe below records the 0.3-era implementation. Alpha 0.5.0 replaces
its painting with the [arcade FX contract](sfx-canvas.md): sharp strokes, bounded
world-space trails and a shared final pass. The behavior and output ownership
remain; the old surface appearance is not an active constraint.

The game and former flight Lab used the Engine Effects study's complete glowing surfaces
instead of the position-line trace and attached flame. Core owns the drawing and
bounded surface collection; simulation time advances it, so pause freezes the effect,
reset creates an empty collection, and wrapping never joins distant emissions.
Release stops new emissions while existing surfaces drift and fade over 0.65 seconds.

The shared alpha cutoff is 750 units/s along the ship's facing direction, with a
linear taper. Each engine supplies half the combined thrust; plume area follows its
actual engine contribution, excluding gravity. Faster existing velocity is preserved;
braking and sideways thrust remain possible. This is not a total-speed ceiling.
Gravity and drag constants are unchanged. Angle, size, lifetime and cutoff are working
values, not a final product contract. Existing replay inputs now produce the updated
flight behaviour; recorded scores are not migrated by this change.

Preserved comparisons and rationale remain at `/lab/studies/engine-effects`. Human full-scene feel and physical-device
performance still need review.

### Builder continuity — 0.4.0

The assembled ship path shares production EnginePlume rendering and lifecycle,
with emitters placed at fitted nozzles. Alpha 0.5.0 uses the arcade FX painter in
both assembled and stock paths. Emitter geometry and gravity remain unchanged. [Hangar](hangar/spec.md) owns the custom-flight handoff and test-fixture
contract; shared engine decisions remain in the [ship-builder history](../history/ship-builder.md).

## Ship 05 flight trial — 3 November 2026

The Hangar includes LHI Fiddler. Its default assembled fit is four Light
ions, two Potential Wells in the lower pincer slots and a Gravity coil in the
centre slot below the chassis; the forward weapon/support slots start empty.
Fiddler runs are marked unranked and cannot submit to the existing challenge.
The Hangar can fit and test the same ship. Full geometry, fitting and linked-drive
behavior is specified in [Hangar](hangar/spec.md#fiddler-flight-trial--2026-11-03).

Run complete uses the shared dialog panel and one vertical action group: Save Score
is filled and primary when score submission is available; return to the launch source
and Top Scores are secondary actions.

## Landing system — 2026-11-03

Landing planets never have rings.

The production launcher follows the [title-screen composition](landing-page/spec.md):
a left-side menu panel and right-side hints over the shared dialog scrim. A separate
cosmetic system shows a random sun approximately at the centre of the bottom-right
quadrant, below the hints, and three planets orbiting with 120–240 second periods.
The system extends toward the upper-left corner, with its outer edge approximately
reaching that corner; this is best-effort visual placement, not an exact fit calculation. Sun class, planet
appearance, orbital phases and bounded orbit sizes vary per menu entry. Selection
and resize preserve that system. The sun stays below the right-side hints, while circular
outer orbits span the screen toward the upper-left. Planet sizes remain
substantial and independent of orbit framing; all are unringed. Outer orbits may crop;
the background fills the viewport independently of the centred 16:9 title content. No background ship, flight effects, arena
boundary or gameplay influence guides are drawn. The shared procedural artwork
and circular orbit update are reused; survival physics are not advanced.

Start fades to void for 150 ms, replaces the demo with a fresh seeded G-class
Survival run, and reveals it for 150 ms. A centred three-second 3, 2, 1 countdown
then holds the world, resources and score timer still. GO releases flight; controls
held through the count apply at release. Entry is at radius 1180, speed 600, heading
37 degrees off inward, with a green speed line behind the ship. Repeated activation
is ignored. Hidden pages and pause hold the count; blur leaves the new run paused.
Returning to the title creates a new menu system. Hangar Test flight starts directly;
Hangar Survival uses the arrival and returns to Hangar. Reduced motion keeps the
static menu, skips the crossfade, and retains the count without ignition flicker.

Automated checks establish generation bounds, orbital movement, reduced motion
and the fresh-run handoff; they do not establish human visual acceptance.
