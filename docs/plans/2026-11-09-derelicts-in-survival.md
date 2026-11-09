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

Only hazards stay in the system (decided 9 November 2026):

- Derelict shards (released pieces) stay in the system: at the edge they
  reappear on the opposite side with the same velocity and heading, as the
  ship does. Shards never expire; they stay until destroyed.
  Gravity eventually pulls them into a planet or the sun, which destroys
  them.
- An intact derelict, damaged or not, as long as it has not broken, leaves the
  system at the edge.
- Freed energy cells leave the system at the edge.
- Intact derelicts and cells keep their life timers; leaving at the edge is an
  added way out.

### Gravity and occupancy, in survival and Derelicts mode (2026-11-09)

- Everything passing through the system feels gravity, as the ship does;
  only planets do not. That includes derelicts, shards and energy cells.
- A full system takes no new derelict: a scheduled arrival while every group
  is occupied is skipped. Survival allows 8 groups; Derelicts mode, a bashing
  mode, allows 16.

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

- Shards wrap at the system edge with velocity and heading kept; intact
  derelicts (damaged or not) and freed energy cells leave. Applies to both
  modes.
- Update the derelicts spec's exit and lifetime rules.
- Checks: a piece crossing the edge reappears opposite with its velocity; a
  derelict and a cell crossing it are removed with no score or drop.

### S3b. Salvage gravity and Derelicts-mode occupancy (mode-a, small; needs S3)

- Derelicts, shards and cells take the ship's gravity model each step; no
  gravity constant changes. Seeded runs stay deterministic.
- Derelicts mode allows 16 groups. Survival's 8 lands with its config in S4.
- Update the derelicts spec's motion and occupancy rules.
- Checks: a body near the sun or a planet accelerates towards it and is
  destroyed on contact; Derelicts mode accepts a ninth group and skips an
  arrival at sixteen.

### S4. Derelicts in survival (mode-a and web, medium; needs S1–S3b)

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

1. **Hits from experimental weapons.** Rail and laser runs are unscored for the
   leaderboard; do their hits still count toward the shown score?
2. **Energy tuning.** With Light ion at 1.75 E/s (uncommitted in the tree on
   9 November), two weapons, a 10% floor and 100 E, the Wasp's fire budget is
   small. Check in play after S4; derelict cells (30 E) are the refill.

## Order

S1, S2 and S3 in parallel. S3b after S3. S4 after S1–S3b. S5 after S4.
