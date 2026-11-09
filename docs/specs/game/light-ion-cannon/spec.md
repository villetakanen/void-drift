# Light Ion Cannon

## Context

A baseline automatic directional weapon implements the accepted
[Light Ion Cannon study](../../../../apps/web/src/pages/lab/studies/light-ion-cannon-2026-11-08.astro).
The accepted form, mounting and firing identity remain fixed during integration.

## Architecture

`packages/mode-a/src/lib/schemas/loadout.ts` validates the genuine
`light-ion-cannon` part and version-2 saved fittings. Existing compatible weapon,
equipment and universal slots accept it; support and engine slots reject it.
`schemas/salvage.ts` owns the validated weapon definition and discharge event.
`ion-cannon-art.ts` owns the supplied paths, housing-centred anchor and channel-tip
muzzle. Canvas artwork, catalogue SVG and `build-renderer.ts` consume that owner.
One 16-unit flight extent uses the existing 0.65 builder-to-flight transform.
The fitting has 9 mass and zero idle draw. The starter Wasp fits one; no other chassis's starter outfit includes it.

`salvage.ts` owns acquisition, power, cooldown, physical contact and damage.
`salvage-renderer.ts` owns blue strike/dispersal artwork; `FlightFx` composes it
in play, the equipment encounter and the mixed-effects Lab. Presentation cannot
apply damage. Existing Hangar persistence and launch handoff carry the new part
without a storage migration.

## Contract

- An instant 200-unit ray fires at three shots/s from each ready cannon's own
  channel-tip muzzle along its fixed mount direction. There is no tracking or recoil.
- Damage uses actual muzzle-to-first-contact distance: [0,50) → 16;
  [50,100) → 12; [100,150) → 8; [150,200] → 4. Internal boundaries use the
  lower-damage band; the 200 endpoint is included. No damage beyond 200.
- The builder shows 12–48 damage/s per cannon, three shots/s, 200 units and
  0.2p/shot. Continuous firing is 0.6p/s per cannon; idle fittings consume none.
- A forward heading-aligned acquisition rectangle starts at the ship position and
  extends 200 units. Its width is the chassis hull width at the shared 0.65 flight
  scale, centred laterally; boundary contact counts.
  Live wrecks and fragments use their actual shared polygon collision geometry;
  collectible energy is transparent to acquisition and rays. Star and planet
  circles block acquisition and muzzle rays, taking precedence at equal contact.
- Actual damageable material intersecting the acquisition rectangle triggers the ready cannon volley.
  Acquisition clips actual material to the rectangle and checks unobstructed
  ship-to-contact segments to its vertices and centroid. All
  ready cannons are captured before its damage resolves. Each funded cannon fires
  even if an earlier shot destroys the trigger; each then queries its own first
  contact in the resulting world. A side cannon can miss and still pays.
- Allocation follows stable build-mount order. Each actual discharge debits 0.2p,
  including misses, and starts its own 1/3-second cooldown. A cannon can spend the
  last 0.2p; the rail/laser ten-power reserve does not apply to this part. Insufficient
  power stops funding the remaining ready cannons without starting their cooldowns.
  Rail and laser acquisition and reserve behavior retain their existing policy.
  Guns draw power after defence weapons, as the
  [point defence contract](../ion-point-defence/spec.md) orders it.
- First contact stops the ray, applies integer damage once, and starts the existing
  impact plume at that contact. A moving visible flash never sweeps further damage.
- For 80 ms after discharge, fresh topmost LFX follows the current muzzle and
  heading. Its length is capped by both discharge distance and current physical
  obstruction. A moving target can shorten the visible line; leaving that line
  cannot extend it through the original hit. This presentation query does no damage.
- Only the selected blue dispersal profile (65% core emission, softer core) stamps
  into persistent FX. The complete blue profile retains its transparent 200-unit
  tip; a hit clips it rather than stretching it. Cached profiles avoid per-frame
  gradient creation. Existing shared decay, pause, camera and reset semantics apply.

### Definition of Done

- [x] Automated tests cover real fitting/persistence, damage boundaries, triggering,
  paid offset misses, first contact, cooldown, scarce power and post-destruction volley.
- [x] Production LFX lifecycle and effects-disabled gameplay equivalence are checked.
- [x] A playable production encounter is inspectable in the equipment Lab and study.
- [ ] The designer accepts fitting fidelity, muzzle connection during movement, rhythm,
  impact and provisional combat balance after playing.
- [ ] Named sustained mixed-effects measurements establish the effects budget.

### Regression guardrails

Existing saves parse, the starter Wasp fits one cannon (other starter loadouts fit none), and keyboard/landscape touch
continue through the normal flight loop. Gravity and friction constants stay fixed.
Automated correctness and captures cannot establish human visual acceptance.

### Scenarios

```gherkin
Scenario: An off-centre fragment triggers offset misses
  Given two ready offset cannons and a fragment intersecting the ship acquisition rectangle while missing its muzzle rays
  When the firing update runs with enough power
  Then both cannons discharge from their own muzzles
  And each pays 0.2p even if its ray misses

Scenario: Power funds only one ready cannon
  Given two ready cannons and 0.3p available
  When a damageable object intersects the unobstructed forward acquisition rectangle
  Then the first cannon in mount order fires and leaves 0.1p
  And the second remains ready

Scenario: Turning during a hit flash
  Given damage was resolved at the first contact on discharge
  When the ship turns during the 80 ms flash
  Then the visible ray follows its current muzzle and clips at current obstruction
  And no additional damage occurs until another funded discharge
```
