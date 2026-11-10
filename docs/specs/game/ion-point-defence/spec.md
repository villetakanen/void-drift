# Ion Point Defence

## Context

A baseline automatic turret implements the accepted
[Ion Point Defence study](../../../../apps/web/src/pages/lab/studies/ion-point-defence-2026-11-08.astro).
It sits in a weapon slot, turns its round base towards the closest target and fires
a short instant ray of the [Light Ion Cannon](../light-ion-cannon/spec.md) family.
The accepted form, turning, firing rhythm and mounting remain fixed during integration.

## Architecture

`packages/mode-a/src/lib/schemas/loadout.ts` validates the genuine
`ion-point-defence` part in version-2 saved fittings. Existing compatible weapon,
equipment and universal slots accept it; support and engine slots reject it. The
fitting has 10 mass and zero idle draw. `schemas/salvage.ts` owns its validated
weapon definition: reach, tracking range, turn rate, alignment tolerance, cooldown,
damage bands, energy and retention margin are defined together.

`point-defence-art.ts`, beside `ion-cannon-art.ts`, owns the turret geometry
converted from the supplied
[concept SVG](../../../../apps/web/public/studies/ion-point-defence-2026-11-08/concept.svg):
the cannon's barrel width, colours and crossbar with the shorter barrel, channel and
side housing, on two concentric base discs scaled to an 8-unit flight diameter.
The base carries six rim slots and one pale index mark. The pivot is the base centre;
the channel-tip muzzle derives from the same geometry. Canvas artwork, catalogue SVG
and `build-renderer.ts` consume that owner. Production mount layering applies, so
mounts drawn beneath a hull partly or wholly hide the turret.

`salvage.ts` owns targeting, turning, power, cooldown, physical contact and damage.
The cannon's instant contact takes the part's reach rather than being duplicated.
Each turret's angle reaches `build-renderer.ts` through the existing per-mount
weapon angles. `salvage-renderer.ts` owns the 100-unit ion profile; `FlightFx`
composes it in play, the equipment encounter and the mixed-effects Lab. Presentation
cannot apply damage. Existing Hangar persistence and launch handoff carry the part
without a storage migration. The [Hangar](../hangar/spec.md) and
[effects](../../factory/effects/spec.md) contracts describe its fitting and LFX.

## Contract

### Form and turning

- Rim slots, index mark, barrel and housing turn together about the pivot. Base
  lighting stays fixed to the ship and does not turn with the turret.
- Preview and Plan draw the turret along its mount direction. In flight it is drawn
  at its simulated angle, under the same layering as other fittings.
- The turret angle is relative to the ship. Each update it turns towards the bearing
  of its target's aim point by at most 180°/s × dt, cancelling the ship's own
  rotation within that limit. Without a target it holds its current angle.
  Flight start and reset return it to the mount direction.

### Targeting

- Candidates are live wrecks and fragments within 200 units of the pivot, measured
  to the closest point of their actual shared polygon collision geometry. Collectible
  energy is never a candidate. A candidate needs an unobstructed segment from the
  pivot to that closest point; star and planet circles block it.
- The aim point is that closest point. The closest candidate is selected; equal
  distances resolve to the lower object id.
- A turret retains its current target while it remains a candidate, unless another
  candidate is at least 10 units closer. Each turret chooses independently.
- Candidates are tracked without firing until the barrel's first contact from the
  muzzle lies within reach, so the turret is already aimed when they arrive.

### Firing

- A ready turret fires when its barrel is within 2° of the aim point's bearing and
  the first physical contact along the barrel from its muzzle is damageable material
  within 100 units. Contact with a star or planet first, or no contact within
  100 units, means no discharge, no cost and no cooldown. Collectible energy is
  transparent to the ray.
- Damage uses actual muzzle-to-first-contact distance: [0,25) → 8; [25,50) → 6;
  [50,75) → 4; [75,100] → 2. Internal boundaries use the lower-damage band; the
  100 endpoint is included.
- First contact stops the ray, applies integer damage once and starts the existing
  impact plume at that contact. The contact may be material other than the target.
- Each discharge debits 0.1p and starts its own 1/3-second cooldown: three shots/s,
  0.3p/s continuous per turret, none while idle. The shared weapon energy floor
  gates every discharge: below 10% of the ship's energy capacity no turret fires,
  takes power or starts a cooldown (tracking stays free); at exactly 10% it may fire.
- Power is drawn in this order: life support, engines, defence weapons, guns.
  Defence weapons are point defences and lasers; guns are Light Ion Cannons and rails.
  Within an update, defence weapons resolve before any gun, each class in stable
  build-mount order, each shot querying contact in the world left by earlier shots.
  Each class draws on the power the earlier classes leave. Insufficient power stops
  funding the remaining turrets without starting their cooldowns.
- The builder shows 8–24 damage/s, three shots/s, 100 units and 0.1p/shot.

### Light

- For 80 ms after discharge, fresh topmost LFX follows the current muzzle and turret
  heading, also from a muzzle under the hull. Its length is capped by both discharge
  distance and current physical obstruction; this query does no damage.
- A cached 100-unit blue profile keeps the cannon's light profile and its own
  transparent tip; a hit clips it rather than stretching it. The cannon's 200-unit
  profile is unchanged. Only the 65% dispersal stamps into persistent FX under the
  shared decay, pause, camera, wrap and reset semantics.

### Definition of Done

- [x] Automated tests cover fitting acceptance and rejection, saved-build parsing,
  geometry–muzzle agreement and the turret drawn at its weapon angle.
- [x] Automated tests cover closest-target choice and ties, the retention margin,
  energy exclusion, star and planet blocking, turn-rate limits with a turning ship,
  2° gating, tracking beyond reach without firing, band boundaries, first-contact
  stopping, cooldown, scarce power across turrets and cannons, and pause or reset.
- [x] Production LFX lifecycle and effects-disabled gameplay equivalence are checked.
- [x] The Hangar offers the part with its builder text in compatible slots only.
- [x] A playable production encounter in the equipment Lab
  (`apps/web/src/pages/lab/utility-artwork.astro`) and the study shows target
  switching, a target out of reach, a hit stopped at first contact, a turning ship
  and a hidden turret on Scout.
- [x] The mixed-effects Lab Weapons workload includes turrets beside cannons.

### Regression guardrails

Existing saves parse; a new device's Wasp is fitted with one point defence and no other chassis is by default; the laser's threat priority,
the rail and the Light Ion Cannon keep their contracts. Keyboard and landscape touch
continue through the normal flight loop. Gravity and friction constants stay fixed.

### Scenarios

```gherkin
Scenario: The turret switches to a clearly closer target
  Given a turret retaining a fragment 80 units away
  When a wreck's collision geometry comes within 65 units with a clear line
  Then the turret selects the wreck and turns towards it at no more than 180°/s
  And fires only once its barrel is within 2° of the wreck's aim point

Scenario: A target beyond reach is tracked without firing
  Given a ready turret whose only candidate lies 150 units away
  When updates run with enough power
  Then the turret aligns with the candidate
  And no discharge, power debit or cooldown occurs until first contact is within 100 units

Scenario: A planet blocks the shot
  Given a fragment within 100 units whose closest point is behind a planet
  When the firing update runs
  Then the fragment is not a candidate and the turret does not fire

Scenario: Defence draws power before guns
  Given a ready cannon and an aligned turret with a target in reach and 0.15p available
  When the firing update runs
  Then the turret fires and leaves 0.05p
  And the cannon remains ready without starting its cooldown

Scenario: Power funds only one turret
  Given two ready, aligned turrets with targets in reach and 0.15p available
  When the firing update runs
  Then the first turret in mount order fires and leaves 0.05p
  And the second remains ready without starting its cooldown
```
