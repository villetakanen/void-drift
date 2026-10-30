# Ship builder — 0.4.0

Status: implemented local 0.4.0 alpha, 2026-10-30; human flight/assembly review pending.

## Purpose and delivery

Players fit visible parts into fixed slots, enjoy assembling a ship, and feel their
choices in flight. Build a playable alpha from this brief and the existing systems;
use focused design studies afterward where experience reveals a need for amendment.
Desktop mouse and keyboard are the acceptance target. Keep interactions adaptable
to touch, but mobile builder sizing/layout is deferred. Existing flight touch support
remains supported. Parts and chassis are free and unlimited; slots constrain builds.
Purchasing parts and shooting for credits are future scope.

## Chassis and fitting contract

| Chassis        | Side E | Hull G/U | Aft E/G/U |
| -------------- | -----: | -------: | --------: |
| Scout          |      2 |        1 |         1 |
| Fighter        |      2 |        2 |         2 |
| Heavy Corvette |      2 |        3 |         3 |

Every chassis starts with a mirrored fission side pair and empty optional slots.
Both side engines are required; editing either side fits the identical mirrored pair.
Other slots can be empty. Mounts have fixed positions/orientations. Select a slot,
then a compatible part to install immediately; removal and replacement are free.
Each chassis remembers its separate build in browser storage (local or session).
Validate stored data and recover safely from missing, corrupt or obsolete records.

## Parts and energy

| Part           | Category | Function                                                     |
| -------------- | -------- | ------------------------------------------------------------ |
| Rail gun       | G        | Static long barrel; no shooting yet                          |
| Laser          | G        | Static shorter emitter; no shooting yet                      |
| Energy storage | U        | Adds 100 energy capacity                                     |
| Loading coil   | U        | Adds 1× solar charging                                       |
| Ion engine     | E        | Powered-speed limit 500                                      |
| Fission engine | E        | Powered-speed limit 350; 2× ion thrust; 1.5× ion energy draw |

Every part has its own mass. A ship includes one battery and one coil without
occupying slots. Capacity is 100 per battery; each coil adds the same charging
contribution, falling off with distance using the existing solar-charging concept.
Life support consumes 3 energy units/second regardless of capacity. Every flight
starts with every battery full. Each active engine consumes energy independently.
At zero energy engines stop and survival ends through life-support failure.

## Flight contract

Total mass is chassis mass plus installed part masses, including both side engines.
Greater mass reduces linear and turning acceleration. Engine mounting angle and
position affect force and torque. Part positions do not shift the centre of mass
or add individual rotational-inertia effects; hull/aft asymmetry is aesthetic.

Left input fires the left side engine; right fires right. Holding both fires both
side engines and every aft engine. Mirrored side torque cancels with both active;
aft thrust does not create asymmetric steering. Installed parts are visible in flight.

Each engine contributes directional force. Effectiveness is greatest at rest or
opposing travel and fades when adding speed toward its powered-speed limit.
Above its limit an engine may brake or redirect motion, but cannot increase speed.
External forces may exceed these limits: a slingshot at 1100 is never clamped.
Combined engine forces must not enable unlimited speed through sideways steering.
Fission's 2× turning intent is expressed through 2× thrust at identical geometry
and mass, not a guaranteed handling ratio between different assembled builds.

## Builder information and test flight

Numbers are part of the fun: expose part masses and effects, engine thrust, speed
limits and draw; total mass, capacity, solar charging, consumption and endurance;
and useful calculated acceleration/turning metrics with their conditions stated.
Use actual shared configuration/calculations rather than duplicated UI estimates.

Test flight contains a very small sun and no planet. Real damage and energy changes
continue, but neither damage nor empty energy ends the test. Empty engines can
resume after charging. Reset restores initial conditions/full energy. Return to the
builder preserves all fittings. A separate action starts survival.

## Existing systems and implementation boundaries

- Ship profile contracts: `packages/mode-a/src/lib/schemas/ship-profile.ts`.
- Existing profile values: `packages/mode-a/src/lib/config.ts`.
- Shared simulation: `packages/mode-a/src/lib/simulation.ts`.
- Procedural ship drawing: `packages/core/src/lib/assets/ship.ts`.
- Flight composition: existing FlightDeck and flight Lab; reuse real systems.
- Define Zod chassis, part and loadout schemas before changing consumers.
- Keep configuration versioned and simulation deterministic.
- Existing scout/balanced/tank identifiers require an explicit compatibility choice
  when presenting Scout/Fighter/Heavy Corvette; do not silently corrupt old saves.
- Current leaderboard accepts stock configurations only. Decide and document a new
  challenge/ranking contract before submitting custom-build scores; preserve old scores.
- No new dependencies or gravity/friction changes without existing project approval.

## Initial implementation choices and tuning

The owner authorizes freely trying alpha/demo choices where the brief is unclear;
state proposals and record implemented decisions here. Initial navigation proposal:
chassis selection opens builder; test/survival actions start flight; return goes to
that build. Not a separately accepted navigation design.

Tune chassis/part masses, mounting geometry, absolute thrust and engine consumption,
solar charging rate, angular response and the mixed-engine thrust curve using
playable evidence. A side silhouette is a possibility, not an accepted requirement.
Do not require a design study before delivering the first playable version.

## Acceptance scenarios

- Given a new session without a saved build, each chassis has the specified slot
  counts, a fission side pair, empty optional slots and one intrinsic battery/coil.
- Given a selected slot, only compatible fittings can be installed; editing either
  side updates the mirrored pair and accounts for two engine masses.
- Given distinct builds on all chassis, switching and reloading restores each one;
  malformed stored data falls back safely to a flyable build.
- Given two batteries, no charging and no thrust, life support consumes 3 units/sec
  and endurance is 200/3 seconds, rather than increasing consumption with capacity.
- Given one input, only that side fires; both inputs also fire installed aft engines.
- Given a ship above an engine limit, thrust cannot add speed but can brake/steer;
  mixed-engine and repeated-steering trials cannot exploit the speed rule.
- Given identical thrust/mounts, increased total mass reduces acceleration/turning.
- Given a fitted ship, flight renders the installed fittings and uses the same build
  values as the builder and test area.
- Given an empty battery or lethal damage in test flight, flight continues; survival
  still ends appropriately. Every fresh flight and test reset begins fully charged.

Automated checks establish contracts, not fun. Human review separately assesses
assembly satisfaction, visual readability, informative numbers and ship handling.
Report failed/unavailable checks honestly. Update this spec with implemented choices
and remaining tuning hypotheses as 0.4.0 is delivered.

## Implemented alpha decisions — 2026-10-30

- `/builder` is the desktop entry; `/lab/builder` demonstrates the identical builder,
  renderer and simulation. The existing game menu links to the builder.
- Local storage key `void-drift-builds-v1` preserves three independently validated
  builds. Invalid saves restore flyable defaults with a visible notice. Storage
  failures keep the in-memory build usable. Existing stock settings are unchanged.
- Internal IDs remain scout/balanced/tank for compatibility. Builder display names
  are Scout/Fighter/Heavy Corvette; the old scored challenge keeps its stock profiles.
- Custom survival is explicitly unranked; no custom score is sent to Firebase.
- Chassis masses are 60/95/140; side angles 32/26/20 degrees; lever arms 13/16/20.
  Part masses: rail 15, laser 9, battery 18, coil 10, ion 10, fission 16.
  Ion thrust is 12000 force units and draw 2 energy/s; fission is 24000 and 3/s.
- The initial angular response is direct turn rate from thrust × perpendicular
  lever arm / (total mass × chassis length squared). Releasing controls stops
  rotation, preserving the existing responsive control convention; no persistent
  angular momentum or extra angular damping constant is introduced. This is an
  explicit game-feel approximation to review, not a full rigid-body simulation.
- Along-motion acceleration tapers linearly with speed/engine limit; braking and
  transverse force remain. Each impulse bounds its result by the larger of incoming
  speed and that engine's limit, preventing finite sideways impulses inflating
  overspeed. Mirrored side impulses combine before application to avoid order bias.
- Charging retains the existing G-star zones: 4/2/0.5 energy/s per coil. This means
  one coil sustains life support only in the closest zone. Endurance figures exclude
  solar charging; inspect this balance in flight before accepting it as final.
- Test fixture: radius-12 sun, mass scaled by squared radius ratio, no planets;
  production gravity/friction constants are unchanged. Custom damage uses baseline
  hull resistance, without hidden stock-profile multipliers.
- Test/survival open directly from the builder, always fully charged. Reset restarts
  that flight; return preserves the build. Ship silhouette and fittings share one
  procedural renderer between builder and flight.

Tuning values and the direct angular-response approximation remain provisional.
Automated evidence covers fitting, persistence, corrupted storage, energy, control
activation, mass effects, deterministic replay and repeated mixed-engine overspeed.
Human assessment of fun and visual fidelity is still required.

### Empty-energy correction

Energy is budgeted before engine impulses: solar charging and fixed life support
are applied first, then active engines share available energy proportionally.
They cannot generate thrust from energy they do not have. In test flight, holding
controls while empty can use newly received solar energy without requiring a
button release. Test flight also completes every simulation substep during star
contact, keeping movement and resource timing consistent while death is suppressed.

### Preserve established flight effects and gravity

Custom builds retain the accepted 0.3.5 filled, glowing engine surfaces from core
`EnginePlume`: residue remains in world space, fades after release, freezes with
simulation pause, and clears on reset. Fixed outline flame substitutes are removed.
Every installed active engine emits at its own drawn nozzle and mounting angle;
aft engines use their own delivered thrust rather than borrowing side output.
Output is scaled by available energy as well as speed taper. The core effect now
accepts mounted emitters while its stock path preserves the accepted appearance.

Custom survival shares the existing star, planets, inverse-square wells and zero
flight drag with stock survival. Build mass changes engine response, not gravitational
acceleration. The deliberately small-sun/no-planet test fixture remains distinct.
The agreed builder limits (ion 500, fission 350) supersede the old stock engine cutoff
for custom builds only; they do not clamp gravity-assisted velocity.

## Fighter silhouette integration — 2026-10-30

The accepted 02.9 Lance from `/lab/studies/ship-silhouettes` is implemented in
`fighter.ts` and the shared build renderer. The clipped hull, six flat facets,
black forward cockpit, and mount arrangement retain the study geometry. Empty
mounts are translucent; installed fittings use the existing cyan/lime/amber accents.
Builder hit targets follow the actual mount dimensions and rotations.

Only Fighter can be selected in the designer. Scout and Heavy Corvette remain in
version-1 storage and validation; editing Fighter preserves their saved parts.
Stock flight and scored profiles remain unchanged. `/lab/builder` is the canonical
production example, including test flight and survival.

Fighter mounts: side (-12, ±15) at ∓26°, hull (2,0)/(-10,0), aft (-22,±5).
Side footprints are 14×9; hull/aft footprints are 11×9. Nozzles extend three units
behind each fitting, and plume origins use that same offset. Drawing scale remains
0.65. The conservative circular collision radius is 31.2 world units, enclosing
the long nose; the circular approximation overestimates lateral extent and remains
a human-review limitation. Scout/Corvette retain the previous radius.

Signed side turning uses thrust × (arm × cos(angle) + sideX × sin(angle)) /
(mass × length²), multiplied by the chassis turning-response gain. The owner retained the original production angle of 26° after finding the
66.8° study orientation too widely rotated. The side pair then moved inward from ±18 to ±15 units at the owner’s request;
fore–aft positions and footprints are unchanged.
Left engine turns clockwise, right counterclockwise, paired inputs cancel.
After flight feedback that this still turned too slowly, Fighter uses a 2.5×
angular-response gain (other chassis retain 1×). Default fission turning is about 96.6°/s; paired acceleration is about 339.7 units/s².
These are
geometry-derived outcomes, not accepted handling targets. No gravity, friction,
energy, or speed-limit constants changed. Human review must assess fidelity,
fitting readability, collision fairness, and single/paired-engine handling.


## Heavy cruiser integration — 2026-10-30

The accepted Long bevel 08 and 02.6 bow layout from `/lab/studies/heavy-cruiser-slots`
are implemented for the `tank` chassis. Fighter and Heavy Corvette can be selected;
Scout remains pending. The display name and version-1 storage IDs/slot indices are
preserved. Earlier Fighter-only selection notes above describe the prior state.

`cruiser.ts` defines flat facets, the two black cockpit panes and a small armored
bow platform. Production-local +x points forward: hull mounts (45.5,0), (0.5,0),
(-12.5,0); aft (-37,-11), (-30.5,0), (-37,11); side (22.5,±13) at ∓34°.
The left mount has y=-13 and angle +34°. Hull/aft footprints are 11×9 and side
footprints 14×9, matching Fighter. Renderer, hit targets and plume emitters share
these mounts. The stern channel is clipped transparently rather than painted over
background objects. The conservative collision envelope encloses geometry and mount
extents, including nozzle allowance, at the existing 0.65 drawing scale.

Mass remains 140; length is the 51-unit forward extent including bow support, used
in the existing squared-length turning approximation; turn-response gain remains 1.
Gravity, friction, energy costs, thrust and speed limits are unchanged. Custom runs
remain unranked. `/lab/builder` is the canonical assembly and test-flight example.
Human review of bow support, fitted-part readability, exhaust clearance, turning and
circular-collision fairness remains pending; automated checks do not establish feel.
