# Derelicts — Mode 2

## Purpose

Derelicts is a trial game mode: a playable survival experience whose gameplay
is being explored. The player flies their prepared ship through a star system,
survives its hazards and destroys passing derelicts to build a run score.
It is a game to play, rather than a facility for testing a build.

Time alive and derelicts destroyed both contribute to the result. Engaging a
wreck offers points and recoverable energy, while weapons consume power and
ramming or approaching debris exposes the ship to damage. Independently crossing
derelicts create opportunities the player can pursue or pass up. Random arrival
timing keeps the flow unpredictable without increasing spawn pressure over time.

The result belongs to this run. The game-over screen provides its score, without
persistent records, leaderboard competition or progression rewards.

## Ownership and entry

- The Hangar offers a Derelicts launch alongside Test flight and Start survival.
  It owns access and the active setup; this spec owns Derelicts rules.
- Enter with the active Hangar ship, fittings and system choices. Use its actual
  mass, thrust, handling and capacities, with normal fresh-run resources.
- Use the default star system.
- Mode 1 [flight practice](../test-flight/spec.md) has its own contract. Mode 3
  remains unspecified. Experimental equipment access is owned elsewhere and
  does not grant Derelicts leaderboard eligibility.

## Flight and encounters

This spec owns Derelicts mode's arrival rules below and the wreck, piece, energy
cell, weapon, system-edge and gravity rules shared with
[Survival](../survival/spec.md), which has its own arrival rules (rate, speed,
entry angle, orientation, spin and group limit).

- Normal energy consumption, charging, damage and survival ending conditions
  apply, as owned by [Survival](../survival/spec.md). There is no practice immunity:
  star contact, depleted hull and depleted power can end the run.
- Derelicts arrive automatically at the star-system boundary with initial speeds
  between 100 and 500 u/s in the system's frame of reference.
- Their paths cross the system independently of the player's position or motion;
  arrivals are not aimed at or positioned relative to the ship.
- Arrival intervals vary randomly around a steady rate. The arrival timing rule
  does not increase frequency as the run progresses. Initial timing uses the
  provisional values below.
- There is no player-controlled Send derelict action.
- Fitted weapons fire automatically using the weapon rules below. Destroyed
  derelicts produce physical fragments and collectible energy under the salvage
  rules below. Flight uses existing keyboard and landscape touch controls.

### Initial encounter tuning

- First arrival is at 3 gameplay seconds. Each subsequent gap is independently
  uniform from 6 to 12 seconds (mean 9), without elapsed-time scaling.
- Entries are uniform around the current system boundary (centre 960, 540;
  radius 1200 u). Heading is within ±60° of the inward radial direction; initial
  speed is independently uniform from 100 to 500 u/s in system coordinates.
  Paths are seeded and never rerolled around hazards or the ship; gravity
  bends them, so star or planet contact remains possible.
- A wreck enters with a random orientation and turns at 0.3 rad/s one way.
- Wrecks expire after 30 gameplay seconds unless destroyed or leaving at the
  system edge (see System edge). Ignoring gravity, a diameter crossing at the
  slowest speed takes 24 seconds.
- At most sixteen encounter groups coexist. Pieces and energy cells keep their
  originating group alive; a piece does so until it is destroyed. A scheduled
  arrival while full is skipped, without a backlog or immediate replacement
  when a group clears.
- Timing and trajectory randomness use separate seeded streams from combat and
  breakup randomness. A skipped arrival consumes its scheduled trajectory too,
  so budget contention does not shift later timing or candidate paths.
- Pause stops the encounter clock; a fresh run resets its seeded schedule.
  Legacy replay `sendDerelict` commands are accepted but have no gameplay effect.

These values are initial tuning, not accepted difficulty balance. The validated
encounter configuration `ENCOUNTER` in `packages/mode-a/src/lib/schemas/salvage.ts`
owns them; Survival's `SURVIVAL_ENCOUNTER` lives beside it.

## Ending and return

- Pause freezes gameplay and elapsed scoring time; Resume continues the run.
- Pause → Abort ends the run and returns to the Hangar.
- Normal survival failure enters game over, showing the final score before
  returning to the Hangar. Scoring stops when the run ends.
- There is no in-run Reset action.
- Return preserves the active setup. The run is transient; a later entry starts
  a new run, with no carried score or encounter state.

## Score and progression

- Final score = elapsed gameplay seconds + 10 × derelicts destroyed by the
  player's ship. Paused time contributes nothing.
- Player weapon kills and destruction by direct ship collision both count.
  Count each destroyed derelict once. Fragments award no additional points.
- Environmental destruction, leaving the system and expiry award no points.
  Merely damaging a derelict before the environment destroys it earns no kill.
- The game-over screen is the only score presentation. The score is not saved,
  submitted to a leaderboard or retained as a personal record.
- The mode grants no persistent rewards, progression or equipment ownership.
  Energy pickups affect only the current run.

## Visual direction and physical breakup

The accepted visual direction is **B · Distributed shedding** from
[the derelict study, section 02.5](../../../../apps/web/src/pages/lab/studies/derelict-three-2026-11-06.astro).
`apps/web/src/components/studies/derelict-three/ShardMotion.svelte` supplies the
B reference; C's additional varied drift and spin are not part of this choice.

- The intact derelict has a 110-world-unit overall extent. Preserve the reference
  hull geometry, material colours and hollow rotating energy square.
- Breakup uses eight unequal pieces. Early shedding is distributed across a
  forward tip, a side section and a lower end while energy remains contained.
  The remaining structure separates at destruction. Player-caused destruction
  releases the energy; star or planet destruction loses the contained energy.
  Preserve B's release order and motion.
- All eight pieces are physical hazards from release, not cosmetic debris.
  Early-shed pieces count toward the eight-piece total; final rupture does not
  create an additional set. Preserve the reference's accounting of hull material.
- Collision shapes must fit the visible hull and individual shards. The former
  uniform circular proxies do not define the accepted geometry.
- The study's timed demonstration establishes visual sequence, not damage
  thresholds. Cumulative damage releases B pieces 0, 6 and 3 at 20%, 40% and 60%
  of initial hull. With 85 hull and 5-damage laser pulses, release follows pulses
  4, 7 and 11; destruction follows pulse 17. A lethal hit releases all remaining
  pieces immediately, without a staged delay or duplicate pieces.

### Shared artwork

- `packages/mode-a/src/lib/derelict-geometry.ts` owns the unchanged source paths,
  flat per-plane colours, eight B fracture regions and reference release motion.
  Source paths have a measured 139.51844787597656-unit overall extent; the common
  scale normalizes that extent to 110 world units around source origin (101, 150).
- Production hull colours are baked flat fills sampled from each source plane's
  original hue treatment. Hulls have no runtime tint overlay or gradient. Energy
  keeps its luminous halo and independently rotating hollow square.
- `derelict-renderer.ts` caches the hull and energy stamp. Production salvage and
  the canonical [/lab/entities/derelict](../../../../apps/web/src/pages/lab/entities/derelict.astro)
  consume this painter. The Lab demonstrates B motion and the selected pulse as a
  visual reference; reference times do not define gameplay damage thresholds.
- Energy light uses the shared persistent FX surface and its source budget.
  Restore the square's black aperture after light compositing, including in the
  mixed FX Lab. Rendering does not change collision, damage, resource or scoring
  state. Shape-matched collision and physical shard release have their own
  acceptance criteria below.

### Fitted material and physical release

- `derelict-collision.ts` triangulates the source fill polygons and clips them by
  the eight shared fracture regions. Collision uses their material union, including
  gaps and missing regions; region envelopes and circular bounds only reject
  distant candidates. They do not establish a physical hit.
- `SalvageBodySchema` validates initial hull, released-piece bit mask, shard index,
  previous rotation and ram-contact suppression state before consumers change.
  A surviving parent loses each released region from both drawing and collision.
  A fragment rotates around its source-site pivot and uses that region's material.
- Released pieces inherit the parent's position, heading and translational
  velocity plus B's release impulse rotated into world space. Each fragment uses
  B's 0.8 rad/s spin, 12 hull and 5 contact damage; a piece has no lifetime.
- Motion: every derelict, piece and energy cell feels the ship's gravity field
  (see the gravity-field spec): per substep the sun's and each planet's pull
  accelerate it by the same `starPull` and `planetPull`, with no dependence on
  its kind or mass, before it moves on its new velocity. Planets themselves feel
  no gravity. Between substeps a body's path is a straight sweep along that
  velocity.
- Rail rounds, laser pulses, ship contact and star/planet contact use fitted
  sweeps. Linear casts are analytic; rotating near-contact casts have a bounded
  0.0001-world-unit numerical tolerance. Contact plumes and release origins use
  the swept contact and fractional parent pose.
- Earlier terminal contacts take precedence over later player hits. Equal-time
  environment, expiry or exit wins over player contact. Environmental removal
  gives no kill and no cell, even after player damage. Independent rail rounds
  retain stable array processing order rather than a global contact-event solver.
- New pieces are created at the contact pose and enter movement on the next fixed
  substep. They can make stationary ship contact immediately. A ram's newly born
  pieces suppress that same ship overlap collectively until separation; early-shed
  pieces and later separate contacts retain their normal damage.
- Expiry and system exit remove the parent without additional fragments or drops;
  previously released pieces keep their own collision state.
- System edge (radius 1200 u; the ship's wrap rule): a piece crossing it
  reappears on the opposite side with the same velocity and heading. Pieces never
  expire and stay until destroyed by a weapon, ship contact or contact with the
  star or a planet. An intact derelict, damaged or not, that crosses the edge
  leaves the system, as does a freed energy cell: removed with no score, drop or
  energy. A derelict and a cell also keep their lifetimes.
- The canonical Lab damage specimen uses production simulation and weapon hits,
  with optional fitted-material overlay. The separate timed reference remains a
  visual demonstration, not gameplay damage scheduling.

## Weapons

- Railguns fire from their muzzle along the world-space slot direction when a
  target within 600 u is predicted to enter a ±8° firing arc, or the fixed trajectory
  already predicts a physical hit. Motion prediction uses relative velocity at the
  target's forward crossing plane. The arc grants firing permission; it never steers
  the barrel or slug. Near misses are intentional. The star and planets block acquisition.
  A round inherits ship velocity at firing and travels until its first physical
  hit or the system boundary, without a range-based lifetime or homing.
  Swept relative collision resolves hits between simulation steps.
- Each rail shot recoils opposite its firing direction for 0.22 s with 0.34 of
  one Light ion engine's force, scaled by current build mass and the flight's ion
  acceleration setting. This is an external force with no engine speed cap or
  additional energy cost. Simultaneous guns add their recoil; subsequent turning
  does not redirect it. Recoil translates the ship without adding torque.
- A real rail collision with a body, star or planet emits a circular expanding impact
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
  energy before railguns; stable mount order settles remaining contention. No
  weapon fires while the ship holds less than 10% of its energy capacity (exactly
  10% may fire); below that floor a weapon takes no power and starts no cooldown.
  This one rule covers lasers, railguns, Light Ion Cannons and ion point defences in
  every mode. A shot must also be affordable: it is refused when the remaining
  power cannot fund it. Spend only for a delivered shot. Engines and life support
  may still draw below the floor.
- Shots ignore their owning ship and energy cells. The star and planets block laser fire and
  absorb rail rounds. Unavailable energy prevents firing, while turret tracking
  itself is free. No separate fire control is needed on keyboard or touch.

Initial values are tunable constants, not accepted balance:

| Item     | Initial settings                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Railgun  | 100 damage, 3 energy, 0.6 s cooldown, 600 u/s muzzle speed, 600 u acquisition, ±8° arc; 0.34-ion recoil for 0.22 s |
| Laser    | 5 damage, 0.5 energy, 0.25 s cooldown, 160 u range, 360°/s tracking, 2° tolerance                                  |
| Derelict | 85 hull, 30 contact damage                                                                                         |
| Fragment | Eight physical pieces per wreck; B reference shapes and motion; 12 hull, no lifetime, 5 contact damage             |
| Cell     | 30 energy, 6 u radius, 20 s lifetime                                                                               |

A rail hit destroys an intact derelict. A laser needs 17 pulses for a derelict
and three for a shard; a single stationary laser is not guaranteed to finish a
passing wreck within its shorter range. Approach and stay close, or combine guns.

## Salvage

- Player weapon or hull-contact destruction releases all remaining physical
  pieces (eight total including early shedding), plus one energy cell. Environmental
  star or planet destruction releases the remaining material but destroys the
  contained energy: no cell and no kill bonus. Expiry and exit create no new drops.
- Hitting a wreck deals 30 hull damage once and produces the same circular plume
  as a rail hit. Its newborn pieces do not charge the same overlapping ram again;
  they arm after separation. Other fragment contact deals 5 damage once and consumes
  the fragment. Shooting fragments creates feedback with no further drops.
- Cell contact adds energy up to build capacity and consumes the cell, even if
  capacity is already full. Cells cannot be shot and have no attraction mechanic.
  Brief feedback reports the actual energy gained.

### Energy release and feedback

- Player weapon and ram destruction create the collectible at the transformed
  contained-square centre, source (100.05, 154.15), at the fractional contact pose.
  Ejection inherits wreck velocity plus local (0, −45) u/s rotated by the wreck's
  heading. `DERELICT_ENERGY_SOURCE` and `DERELICT_ENERGY_EJECTION` own that reference.
- The free square uses the same cached artwork, scale and halo as contained energy.
  Its rotation anchor retains the wreck's contact heading; the shared time-driven
  phase continues independently at π/6 rad/s. The black aperture is restored after
  shared-light compositing. The physical square remains readable without its halo.
- One validated `energy-release` event records the fixed rupture centre and contact
  time. It stamps the selected expanding pulse for 0.28 gameplay seconds into the
  shared persistent FX surface, then its existing light decays normally. The pulse
  stays at the rupture point while the square moves; active release cues are
  retained ahead of ordinary impact traffic in the bounded 128-event ring. It
  replaces the generic
  player-break flash. Visibility and source budgets remain authoritative.
- Star/planet destruction, expiry and exit at the edge produce neither this event nor a cell.
  Fragment destruction produces neither. Pause freezes square motion/phase, event
  age and light history; a fresh session clears the old release and pickup.
- Collection keeps the 30-energy value, 6-unit collision radius and 20-second
  lifetime. A full-capacity pickup is still consumed and reports zero gain.

## Integration boundaries

- `packages/mode-a/src/lib/schemas/loadout.ts` owns validated setup data;
  `packages/mode-a/src/lib/schemas/flight.ts` owns flight settings;
  `packages/mode-a/src/lib/schemas/salvage.ts` owns weapon/encounter tuning.
  Validated destruction causes and transient final results in `salvage.ts`
  distinguish player weapon/ram kills from environment, expiry and exit. The
  simulation captures a frozen result only at Derelicts game over; UI reads that
  result without persistence. Define changed contracts in Zod before consumers.
- `packages/mode-a/src/lib/simulation.ts` and
  `packages/mode-a/src/lib/game-loop.ts` provide shared simulation and survival
  termination. `packages/mode-a/src/lib/salvage.ts` provides combat and salvage.
- `apps/web/src/components/FlightDeck.svelte` provides flight input, pause,
  game-over presentation and return. Shared mount geometry and rendering remain
  authoritative; visual effects cannot change combat outcomes.
- Mode 1 and ordinary Survival retain their separate contracts. Derelicts scoring
  does not change the Survival leaderboard formula or submission namespaces.

## Acceptance criteria

- [ ] Entry uses the active Hangar setup and a generated star system; unavailable
  generation falls back to the default system.
- [ ] Normal consumption, charging and damage apply, and every normal survival
  ending condition produces game over.
- [x] Each derelict enters at the system boundary at 100–500 u/s. With the same
  encounter random inputs, moving the player changes neither entry nor initial path.
- [x] Arrival intervals vary, but their timing distribution does not depend on
  elapsed run duration; no Send derelict control is offered.
- [x] At 60 gameplay seconds, two weapon kills and one ram kill produce 90 points,
  regardless of additional environmental destruction or destroyed fragments.
- [x] Each derelict awards its bonus once; a player-damaged wreck subsequently
  destroyed by the environment awards none.
- [ ] Pause freezes the encounter and scoring clock; Resume continues; Abort
  returns to the unchanged Hangar setup. No in-run reset is offered.
- [ ] Game over shows the final score and permits return to the unchanged setup.
  A new run carries over no score or encounter state.
- [x] No score appears outside game over, no score is persisted or submitted,
  and the run changes no persistent progression, rewards or equipment ownership.
- [ ] Shared weapon targeting, power costs, recoil, fragments and energy pickups
  follow the rules above with keyboard and landscape touch flight controls.
- [ ] The intact derelict is 110 world units in overall extent and matches B's
  hull, materials and contained energy appearance.
- [ ] Breakup matches B's distributed early shedding, release order, motion and
  energy ejection, with exactly eight physical hazard pieces in total and no
  duplicate pieces at final rupture.
- [x] Each released piece participates in physical collision and damage using
  collision geometry fitted to its visible shape.
- [ ] After implementation, human in-flight review confirms intact silhouette,
  shedding, hazards and released energy remain readable in the star-system
  environment at encounter speeds of 100–500 u/s. Visual direction is accepted;
  this in-flight validation is still required.
