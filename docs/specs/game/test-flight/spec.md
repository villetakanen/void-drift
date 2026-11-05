# Weapons and salvage in Test flight

Status: implemented for an alpha trial, 2026-11-03. Automated correctness,
visual inspection, performance measurements and owner acceptance are separate evidence.
Weapon feel and survival balance remain provisional.

## Context

Fit a railgun or rotating point-defence laser in the Hangar, launch Test flight,
break a passing derelict, approach through its fragments and collect energy.
Return to change fittings or reset to compare the same opening encounter.
The owner selected automatic firing, short laser pulses, a 10-energy weapon
reserve, physical fragment hazards, and both automatic and summoned passes.

## Architecture

- `packages/mode-a/src/lib/schemas/salvage.ts` owns validated weapon and encounter
  tuning. Shot energy is separate from propulsion `PartSchema.draw` and engine
  endurance estimates. Saved fitting IDs and loadout versions are unchanged.
- `packages/mode-a/src/lib/salvage.ts` owns deterministic targeting, turret motion,
  rounds, bodies, damage, energy, bounded events and encounter timing. Simulation
  creates it only for a validated fitted `testFlight`; it advances in the existing
  four substeps per 60 Hz tick, after propulsion receives its energy allocation.
- `FlightTickInput.sendDerelict` is an optional one-tick scenario command.
  `ReplayInputSchema` accepts it on a chunk, consumed on that chunk's first tick.
  Old recordings remain valid; `fire` stays false because weapons fire automatically.
- Shared `buildMounts`, `weaponPose` and `drawBuild` own slot transforms, muzzle
  positions and optional runtime laser angles. No mount-authoring feature is added.
- `salvage-renderer.ts` draws physical objects and fresh weapon light. `FlightFx`
  uses the shared persistent surface and a bounded spark pool. Rendering cannot
  change combat outcomes. `/lab/entities/ship` previews shared fittings and turret
  angles; `/lab/builder` runs the same trial; `/lab/fx?weapons=1` adds the production
  weapon path to the mixed diagnostic workload.
- `FlightDeck` composes drawing, collection feedback, pause/reset and Send derelict.
  No backend, account, network service or persistent encounter state is involved.

## Contract

### Weapons

- Railguns fire from their muzzle along the world-space slot direction when a
  target within 600 u is predicted to enter a ±8° firing arc, or the fixed trajectory
  already predicts a physical hit. Motion prediction uses relative velocity at the
  target's forward crossing plane. The arc grants firing permission; it never steers
  the barrel or slug. Near misses are intentional. The star blocks acquisition.
  A round inherits ship velocity at firing and travels until its first physical
  hit or the system boundary, without a range-based lifetime or homing.
  Swept relative collision resolves hits between simulation steps.
- Each rail shot recoils opposite its firing direction for 0.22 s with 0.34 of
  one Light ion engine's force, scaled by current build mass and the flight's ion
  acceleration setting. This is an external force with no engine speed cap or
  additional energy cost. Simultaneous guns add their recoil; subsequent turning
  does not redirect it. Recoil translates the ship without adding torque.
- A real rail collision with a body or star emits a circular expanding impact
  plume and radial sparks at the swept contact point. Misses have no impact plume.
  Ship–derelict collisions use the same plume at their contact point.
  The shared persistent FX surface owns its fading light.
- Lasers rotate independently through 360°, at a finite rate, and pulse only when
  aligned. Incoming fragments whose predicted trajectory contacts the ship within
  three seconds have priority, then intact wrecks, then other fragments.
  Keep a valid target within the same priority; choose new targets by threat time
  or distance, breaking ties by stable entity ID. A pulse damages its first hit.
  The beam is bright red with a narrow lighter core; its range is 160 u.
- Each mount has independent cooldown/aim state. Defensive lasers receive weapon
  energy before railguns; stable mount order settles remaining contention. Spend
  only for a delivered shot whose full cost leaves at least 10 energy units.
  Engine and life-support use of that reserve remains unrestricted.
- Shots ignore their owning ship and energy cells. The star blocks laser fire and
  absorbs rail rounds. Unavailable energy prevents firing, while turret tracking
  itself is free. No separate fire control is needed on keyboard or touch.

Initial values are tunable constants, not accepted balance:

| Item     | Initial settings                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Railgun  | 100 damage, 3 energy, 0.6 s cooldown, 600 u/s muzzle speed, 600 u acquisition, ±8° arc; 0.34-ion recoil for 0.22 s |
| Laser    | 5 damage, 0.5 energy, 0.25 s cooldown, 160 u range, 360°/s tracking, 2° tolerance                                  |
| Derelict | 85 hull, 18 u radius, 40 u/s relative crossing speed, 18 s lifetime, 30 contact damage                             |
| Fragment | Four per wreck, 12 hull, 5 u radius, 60 u/s radial scatter, 12 s lifetime, 5 contact damage                        |
| Cell     | 30 energy, 6 u radius, 20 s lifetime                                                                               |

A rail hit destroys an intact derelict. A laser needs 17 pulses for a derelict
and three for a shard; a single stationary laser is not guaranteed to finish a
passing wreck within its shorter range. Approach and stay close, or combine guns.
[DEPRECATED 2026-11-03] The first trial used exact-hit-only rail triggering,
20 damage, 900 u/s slugs with a 600 u lifetime, 240 u laser range, 30-hull wrecks
and 5-hull shards. Owner playtest feedback selected the values above.

### Encounter and flight

- Test flight retains the small sun, no planets, real propulsion/charging/damage
  and no game over. Its starting position is now 85 units outside the sun's
  influence radius. The old start inside the well flung an idle ship past the
  first encounter before weapons could be compared; gravity constants are unchanged.
- The first pass arrives at 3 s, then every 18 s. Begin 150 u ahead and 220 u to
  alternating sides, with a crossing velocity relative to the ship at spawn.
  If unsafe at the arena edge/star, try the mirrored side and then the two rear
  offsets; skip a pass if no candidate is safe.
- Wrecks, fragments, cells and rounds move ballistically in this trial. Wrecks
  and cells inherit the source velocity; fragments add seeded radial scatter.
  They disappear at arena exit or star contact and never wrap. Existing player
  wrapping remains, with no swept collision or pickup across its teleport.
- Destruction, including hull contact, produces exactly one group of four physical
  fragments plus one cell. Hitting a wreck deals 30 hull damage once and produces
  the same circular plume as a rail hit. Fragment contact deals 5 damage once and consumes the
  fragment. Shooting fragments creates only cosmetic feedback, with no further drops.
- Cell contact adds energy up to build capacity and consumes the cell, even if
  capacity is already full. Cells cannot be shot and have no attraction mechanic.
  Brief feedback reports the actual energy gained.
- At most two encounter groups can remain active, including their fragments/cells.
  Automatic arrivals skip at capacity; nothing queues. Rounds are bounded to 64,
  current visual event records to 128, and shared weapon sparks to 256.
- Send derelict schedules one attempt on the next tick, starts a one-second summon
  cooldown and reschedules the next automatic pass 18 s later. Disable the action
  while paused, outside play, with a pending command, at capacity or on cooldown.
- Pause freezes gameplay and light. Reset creates fresh state, restores resources,
  clears events and light, and repeats the seeded encounter sequence. Returning to
  the Hangar preserves the fitted ship. Empty energy or zero hull does not end a trial.

### Regression guardrails

- Ordinary survival, including fitted custom survival, has no active weapons or
  salvage encounters. Score rules and competition namespaces are unchanged.
- Existing two-control flight, pointer cancellation, blur pause, saved loadouts,
  pause/reset and builder return remain functional. No new dependencies are needed.
- Shared fitting artwork, actual muzzle position and runtime turret orientation
  remain consistent between Hangar, game and Lab. FX density cannot alter gameplay.

### Acceptance scenarios

1. Fit a railgun, launch, observe a fixed-direction slug break the opening wreck
   with a circular impact plume, then thrust into its drifting cell. Hull hazards
   remain physical and the HUD reports actual energy gained. Fit a laser to observe
   red tracking pulses; stay within range for 17 pulses to break an intact wreck.
2. Fit both types. An incoming fragment interrupts a laser's wreck target while
   the rail remains tied to its mount. With scarce energy, defensive pulses take
   priority and neither gun spends the 10-unit reserve.
3. Pause after summoning: bodies, cooldowns, resources and effects freeze. Reset
   and replay the same controls/command ticks: state and encounter results match.
4. Return to the Hangar and launch custom survival: the fittings are preserved,
   but weapon energy, encounter spawning and Send derelict are inactive.

Verification owners: `salvage.test.ts` covers geometry, interception, prioritization,
resources, drops, collision, limits, replay and all five chassis. Browser
`salvage.spec.ts` covers the actual fitting/flight/collection/reset/return journey
and landscape input. Review `salvage.spec.ts` captures desktop and landscape
encounters separately from correctness. Full repository verification remains the
delivery gate. Human judgments on readability, weapon feel and the desire to repeat
the pass are not inferred from passing tests; survival reward balance is deferred.
