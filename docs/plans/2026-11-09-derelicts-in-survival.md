# Derelicts in survival

Deliverable 2 of [0.6.0 "The ion storm"](2026-11-08-ion-storm-0-6-0.md), scoped
in conversation on 9 November 2026. Status: plan recorded; no slice started.

## Decisions (2026-11-09)

### Default Wasp

The Wasp on the landing screen and the Wasp a new player flies carry the same
fitting:

- 1 light ion cannon (`light-ion-cannon`) and 1 ion point defence
  (`ion-point-defence`) in the two hull mounts,
- 1 light ion engine (`ion`) aft,
- ion stabilizers, as today.

This replaces the gravity coil in today's starter Wasp and the empty left hull
slot of the decorative landing-screen Wasp.

### Derelict arrivals in survival

These are survival's own encounter rules. The Derelicts mode keeps its own,
with more and faster derelicts; it stays as a Hangar launch for development
and for fun.

- First derelict at 3 gameplay seconds, then one every 5–10 seconds.
- Entry speed 50–150 u/s.
- Each derelict enters at 40–50° to the system boundary (equally, 40–50° off
  the inward radial), to either side.
- Each derelict enters narrow point first: its forward tip faces its direction
  of travel at entry.
- Each derelict rotates at 1°/s, left or right, chosen per derelict.

### System edge, in survival and Derelicts mode

- Derelict debris (released pieces) wraps at the system edge, as the ship does.
- A derelict whose energy has not been released leaves the system at the edge.
- Released energy leaves the system at the edge.

### Weapon energy floor, in every mode

No weapon fires while the ship holds less than 10% of its energy capacity.
This replaces the cannon's and point defence's "no reserve" rule and the
rail/laser ten-unit reserve.

### Survival score

- 1 point per full second survived; partial seconds do not count.
- 1 point per point-defence or cannon hit on a derelict or a derelict piece.
- 0 points for destroying a derelict.
- 20 points per derelict energy cell the player collects.
- The running score shows during flight in the right gutter, below the
  seconds.

### Leaderboard

- 0.6.0 clears the leaderboard: a new `CHALLENGE` id.
- Rows carry score and time. The board sorts by score by default; the player
  can re-sort by time on the client.

## Today, for reference

- Wasp has two equipment hull mounts and one aft engine slot, so the fitting
  fits without chassis changes. `starterLoadout("wasp")` fits a gravity coil;
  `BuildStoreSchema` defaults the Wasp to `defaultLoadout` (empty).
- Derelicts mode: first arrival at 3 s, gaps 6–12 s, speed 100–500 u/s, heading
  within ±60° of inward radial, random initial rotation, wreck spin 0.3 rad/s
  one way, 30 s wreck life, 12 s piece life, 20 s cell life, 8 group cap. Every
  body crossing the 1200 u system radius is removed (`exit`). Score = seconds +
  10 × kills, never persisted.
- The ship wraps at the 1200 u system radius.
- Cannon and point defence have no energy reserve; rail and laser keep 10
  energy units after a shot.
- Survival: no derelicts. The leaderboard stores `seconds` (int, 1–3600) under
  `CHALLENGE = "arrival-3"`; Firestore rules require `seconds` and accept an
  update only when `seconds` grows. Any Hangar loadout makes the run unscored.

## Slices

### S1. Default Wasp fitting (mode-a and web, small)

- `starterLoadout("wasp")` and the `BuildStoreSchema` Wasp default become the
  fitting above. Existing saved builds keep what the player saved.
- The decorative landing-screen Wasp shows the same two hull parts.
- Update the [landing page spec](../specs/game/landing-page/spec.md) (decorative
  Wasp, PRESS START ship) and the starter text in the
  [Hangar spec](../specs/game/hangar/spec.md).
- The stock-Wasp survival run stays scored; the `loadout` check in
  `FlightDeck.svelte` must not treat the new default as a custom loadout.
- Checks: a fresh profile launches the fitted Wasp from PRESS START.

### S2. Weapon energy floor (mode-a, small; parallel with S1)

- One firing gate in `salvage.ts`: below 10% of capacity, no weapon fires,
  takes power or starts a cooldown.
- Update the [cannon](../specs/game/light-ion-cannon/spec.md),
  [point defence](../specs/game/ion-point-defence/spec.md) and
  [derelicts](../specs/game/derelicts/spec.md) weapon rules.
- Checks: at just under and at 10% for each weapon, and for ships of different
  capacity.

### S3. System edge (mode-a, small; parallel with S1)

- Pieces wrap at the system edge; intact derelicts and energy cells leave.
  Applies to both modes.
- Update the derelicts spec's exit and lifetime rules.
- Checks: a piece crossing the edge reappears opposite with its velocity; a
  derelict and a cell crossing it are removed with no score or drop.

### S4. Derelicts in survival (mode-a and web, medium; needs S1–S3)

- Survival runs the salvage encounter with its own config: 3 s first arrival,
  5–10 s gaps, 50–150 u/s, 40–50° entry to either side, forward tip aligned to
  velocity at entry, ±1°/s spin. The Derelicts mode config is unchanged.
- Encounter config gains the entry-angle band, the initial-orientation rule and
  a per-wreck spin; sign and angle come from the trajectory stream so runs stay
  seeded.
- Spec: survival owns its encounter rules; the derelicts spec keeps the shared
  wreck, piece, cell and weapon rules.
- Checks: ranges for interval, speed and entry angle; heading equals velocity
  direction at entry; spin magnitude 1°/s with both signs over a seeded run;
  moving the player changes no arrival; the Derelicts mode config is unchanged.

### S5. Survival score and leaderboard (mode-a, web, Firebase; needs S4)

- Score = `floor(seconds)` + point-defence and cannon hits on derelicts and
  pieces + 20 × collected derelict cells.
- The running score sits below the seconds in the right gutter.
- `HighScoreSubmissionSchema` gains `score`; Firestore rules validate it and
  update a player's row only when `score` grows. New `CHALLENGE` id.
- The leaderboard sorts by score; a client-side control re-sorts by time.
- Spec: survival scoring and the leaderboard contract.
- Checks: the formula on a seeded run; the rules emulator accepts a valid score
  and rejects a lower update and a missing field; both sort orders.

## Open points

1. **Wreck and cell lifetime.** Derelicts leave at the edge. Do intact
   derelicts and cells still expire on a timer (30 s and 20 s today), or only
   by leaving? At 50 u/s a 40–50° chord (about 1700 u) takes about 34 s.
2. **Piece lifetime.** Wrapping pieces never leave on their own. Keep the 12 s
   piece life?
3. **Hits from experimental weapons.** Rail and laser runs are unscored for the
   leaderboard; do their hits still count toward the shown score?
4. **Energy tuning.** With Light ion at 1.75 E/s (uncommitted in the tree on
   9 November), two weapons, a 10% floor and 100 E, the Wasp's fire budget is
   small. Check in play after S4; derelict cells (30 E) are the refill.

## Order

S1, S2 and S3 in parallel. S4 after all three. S5 after S4.
