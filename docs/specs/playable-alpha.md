# Playable alpha contract

Status: implementation in progress, 2026-10-28. Scope approved in the voice-led rebuild conversation.

## Architecture

`packages/mode-a/src/lib/simulation.ts` owns a fixed 60 Hz survival simulation.
Game and Flight Lab share this simulation and the core renderer/input/camera.
`schemas/flight.ts` validates Lab settings and replay inputs; ship tuning uses the
existing ship-profile schema. Gravity and engines follow the accepted 29 October gravity study integration below.

All ranked runs use challenge `gravity-1`, seed 2026, a G-class star, and stock profiles.
Scoring is casual client-reported survival time, clearly labeled: Firestore rules
validate ownership, shape, version and bounds, but do not prove an honest simulation.
Each anonymous player keeps one best score per ship. Different balance versions
use separate boards. Lab runs and imported tuning cannot submit ranked scores.
Firebase Auth and Firestore replace Supabase. Paths are
`artifacts/{appId}/scores/{challenge}_{uid}_{shipId}`. Offline play remains available.

## Contract

- Three ships apply thrust, turning, hull and power-drain multipliers.
- Fixed-step replay reproduces world state for identical validated settings and inputs.
- Keyboard A/D or arrows activate differential engines; both produce forward thrust.
- Landscape touch buttons support simultaneous presses, release/cancel and blur reset.
- Start, pause/resume, death and restart work without page reload or service credentials.
- Camera frames ship and star, fits their extents with padding, snaps between discrete zoom levels, and snaps
  framing at antipodal arena wrap while preserving ship velocity.
- Flight Lab shares production flight, offers tuning, seed, restart, pause, step,
  deterministic scripted replay, and JSON import/export with validation errors.
- Firebase rules reject unauthenticated, other-owner, malformed, mismatched-document,
  wrong-challenge, out-of-bounds, decreasing-score, extra-field and deletion writes.
- Browser checks cover real displacement, all ships, touch release/cancel, pause,
  Lab reproduction, death/restart, and unavailable leaderboard behavior.
- Unit tests, Svelte/types, lint, build, browser and Firebase rule checks pass together.
- Live release requires a selected Firebase project and deployment evidence.

## Scenarios

Given a stock ship, when both engines fire for 120 fixed steps, it moves and consumes
power according to that profile. Resetting and replaying reproduces the same state.
Given a ship crosses the arena edge, it reappears inside the opposite boundary with
inward momentum; the camera immediately reframes without a long pan.
Given invalid Lab JSON, importing it shows an error and preserves the current trial.
Given Firebase is absent, the game remains playable and shared scores explain their
unavailability. Given valid configuration, separate anonymous players can compete.

## Stepped zoom — patch 0.3.1

Game and Lab render a fixed 1920×1080 logical view, scaled proportionally to fit.
The shared camera defaults to five geometrically spaced levels from whole-system
view (the 1200-unit-radius arena plus padding) to 1.6× close view. Automatic framing
selects the closest level that fits ship and star with padding. Both zoom directions
snap immediately, recentering on their midpoint; panning between changes remains
smooth. Zoom-in requires 8% spare room to prevent threshold flicker. Wraps reset
framing immediately. This supersedes the earlier continuous zoom behavior.

FlightSettingsSchema validates an integer zoomSteps from 4 through 11; older JSON
and trial links without it default to five. Lab exposes the count with Apply & reset,
active level/scale, and an immediate manual preview of every level while paused or
flying. Preview is Lab-only and resets to automatic on reset/import/replay. JSON
and shareable links retain the configured count. Invalid imports preserve the trial.

Trails remain world-space samples, transformed together with the ship and planets.
Changing zoom does not clear trails, advance simulation time, or restart effects.

Acceptance: test counts 4 and 11 through apply, preview, export and shareable links;
reject fractional/out-of-range counts; exercise snapping in both directions,
threshold stability, coordinate round-trips, and existing keyboard/touch controls.
Human review of reorientation and preferred level count remains pending.

## Player navigation and version labels — patch 0.3.2

Player-facing navigation exposes play, scores and settings. Flight Lab is a developer
tool reached directly at `/lab/flight` or through the Lab navigation, with a return
link to play. Game and leaderboard labels use the web package version (0.3.2),
independently of the internal `alpha-1` scoring challenge identifier.

## Gravity well integration — 29 October 2026

Game and Flight Lab use four physics substeps per 60 Hz replay tick. Suns and
planets use a bounded inverse-square pull: strength / 6 × ((reach / distance)² − 1),
zero at and beyond reach. Existing body sizes and reaches are preserved. The G sun
starts at 4× its previous strength (accepted range 4×–10×). Planets use independent
well strength 600, equivalent to acceleration 300 at half reach; this is provisional.

All three ships have two engines, each supplying half of combined thrust. The
forward component of velocity along the push direction reduces effectiveness by
1 / (1 + (max(0, velocity · direction) / 600)²). Braking and perpendicular thrust
retain full effectiveness. Profile multipliers remain. There is no passive drag
or hard speed cap; gravity is independent of engine taper. The 600 units/s engine
scale is an initial estimate, not a maximum velocity or established play balance.

Legacy study comparisons retain their explicit old resistance/curve configuration.
New scores use gravity-1 and separate document IDs; existing alpha-1 records remain.
A deployment must include the updated rules before new scores can be submitted.
Existing replay inputs are deterministic under this revision but trajectories differ
from alpha-1; cross-version replay equivalence is not promised.

Automated correctness checks cover directional thrust, coasting, steering, escape,
collision and replay. Human review is explicitly outside integration scope and
happens afterward on the built alpha. Study trajectories cannot establish playtest
results. Physical sizing, new reach rules and visual danger cues are deferred.
