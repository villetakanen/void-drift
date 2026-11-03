# Ship builder — 0.4.0

> **[DEPRECATED 2026-11-03] As a feature specification.** This file preserves the
> former Ship Builder document, including its uncommitted additions at the time of
> extraction. It mixes decisions, implementation reports and superseded states.
> The current player workflow contract is [Hangar](../specs/hangar/spec.md).
> This record is not a second active Hangar spec. Accepted decisions about shared
> ships, flight and artwork remain evidence for those domains; moving them here
> neither revokes them nor promotes implementation commentary to owner approval.

Read dated entries in context. In particular:

| Superseded statement                                      | Later decision / current source                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Three ships, Fighter-only or Fighter/Corvette selection   | Four identities in `ShipProfileIdSchema`; all available in Hangar                 |
| Fission defaults and the original ion limits              | Engine identities and Base movement entries; `PARTS` and `ION_DEFAULTS`           |
| Either side edits the pair                                | Slot language: primary left mount edits the pair; right is linked                 |
| Every added battery supplies 100 capacity                 | Potential Well entry; `PARTS` owns capacities                                     |
| Release immediately stops rotation                        | Base movement: angular velocity and stabilizer braking                            |
| Stabilizers default off                                   | Linked engines and stabilizer defaults: on, Wasp forced on                        |
| Version-1/2 browser saves remain current                  | Ship names and ids: v3 browser store; loadout schema version remains 2            |
| Four independently validated saved builds                 | `BuildStoreSchema` validates the whole store; one invalid entry resets it all     |
| Gravity artwork is only conceptual/static                 | Gravity coil and Gravity collection entries                                       |
| First-column placement and decorative CSS as requirements | Hangar uses named functional regions; exact composition remains in shared UI/code |

Exact tuning, geometry and formulas below describe their recorded revision, not
final balance. Cross-domain intent not yet covered by a focused living spec must
be read against the later decisions and canonical code; this extraction does not
claim that wider specification work is complete.

---

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

| Chassis  | Side E | Hull G/U | Aft E/G/U |
| -------- | -----: | -------: | --------: |
| Scout    |      2 |        1 |         1 |
| Fighter  |      2 |        2 |         2 |
| Corvette |      2 |        3 |         3 |

Names and ids follow [Ship names and ids](#ship-names-and-ids--s4-2026-11-02).

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
- ~~Existing scout/balanced/tank identifiers require an explicit compatibility choice
  when presenting Scout/Fighter/Heavy Corvette; do not silently corrupt old saves.~~
  [DEPRECATED 2026-11-01] The ids are now the short names; old saves are purged (S4, below).
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
- ~~Local storage key `void-drift-builds-v1` preserves three~~ [DEPRECATED 2026-11-01] Local storage key
  `void-drift-builds-v3` preserves four independently validated
  builds. Invalid saves restore flyable defaults with a visible notice. Storage
  failures keep the in-memory build usable. Existing stock settings are unchanged.
- ~~Internal IDs remain scout/balanced/tank for compatibility. Builder display names
  are Scout/Fighter/Heavy Corvette;~~ [DEPRECATED 2026-11-01] See Ship names and ids (S4). The old scored
  challenge keeps its stock profiles.
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
Owner approval established the direction despite reservations about visual polish.

Production stores every chassis as fixed colour polygons, as `scout.ts` and
`cruiser.ts` do; studies may compute shading from part heights to get there. The
drawing method is in `docs/design.md` (ship drawing fundamentals).

## Scout Trident integration

The accepted 02.5 / 06 hull and approved 02.6 screenshot arrangement from
`/lab/studies/scout-firefly` are implemented in `scout.ts`, the shared renderer,
chassis calculations and builder. All three chassis are now selectable. The old
Fighter-only/Scout-pending notes above record earlier delivery states, not current
restrictions. Keep `scout`, the four slot identities and version-1 saves unchanged.

Production-local +x is forward. Side engines: (10.5,−6)/(10.5,6), angles +49°/−49°;
H (1,0); A (−11.5,0); all footprints 10×8. H/A are reconstructed starting coordinates
from the accepted screenshot, not claimed exact image measurements. The cockpit
center is (21,0), black radius 6 and collar radius 6.8. All six flat hull planes,
wing tips and continuous pointed keel retain the study geometry. Left/right turn
signs, selected hit targets, mounted nozzles and plume origins share the same mounts.

The old Scout-only rail/laser barrel lengths of 18/10 would overlap the compact
cockpit and adjacent slot. Scout now uses the established mount-relative graphics:
rail 6, laser 5 units from the fitting center, with unchanged part identities, mass
and static/no-shooting behavior. H/A barrels remain clear of each other and the
cockpit. The side footprints have a small accepted corner overlap; keyboard and
center-point selection work independently. No slots or hull points moved to hide it.
Aft engines are treated as deck/surface mounts with the existing rear nozzle at
−19.5; the plume can overlay the keel toward −29. No stern notch is introduced.

Scout mass stays 60, gain 1. The 27.8-unit forward cockpit-collar extent is the
existing squared-length turning proxy, not the full hull length or physical
inertia. At rest with only the default fission pair, total mass is 92, paired
acceleration about 342.3 units/s² and single-side turn rate about 229.4°/s. These
are provisional geometry-derived outcomes, not human-approved handling targets.
The conservative circular collision radius encloses hull, collar and fitting
extents at the unchanged 0.65 scale (about 20.73 world units for current fittings).
It overestimates gaps between the knives; fairness needs human flight review.

Both `/builder?chassis=scout` and `/lab/builder?chassis=scout` open the Scout directly.
The optional `chassis` query is parsed with ShipProfileIdSchema; absent/invalid values
keep the usual Fighter default. Other saved chassis remain intact when fitting Scout.
Test flight, reset, return and custom unranked survival use the real shared systems.
Keyboard and existing landscape simultaneous-touch/cancel/blur behavior are retained.
Stock scored profiles, gravity, friction, energy, engine thrust and speed limits
are unchanged. Human review of visual fidelity, exhaust and handling remains pending.

## Slot language integration — 2026-10-31

Approved slot types: Engine (E) accepts E parts; Weapon (W) accepts internal G
weapons; Equipment (Q) accepts G/U; Universal (+) accepts all categories. Side
mounts use Engine, hull mounts Equipment, aft mounts Universal. No current chassis
needs a weapon-only mount. Internal part IDs/categories and version-1 saves remain.
The left side is the selectable primary; right is a disabled linked secondary.
Both still share one engine fitting. Link identity is independent of slot type.

Slots are builder-only overlays. Empty fill is 35% acid lime with void-dark border;
filled fill is 35% void-dark with acid-lime border. Linked dashed borders and their
connector use the same occupancy-based color. The 54×64 reference fill, 4-unit gap
and 1.5-unit border are defined at seven preview units per ship unit, separate from
physical mount geometry. Empty E/W/Q/+ glyphs are 70% opacity. Number labels have
ivory text and 35% dark backing; vertical type labels use border color without backing.
Selection uses acid-lime corner brackets; keyboard focus remains distinct.

Flight draws only hull and equipped items, no empty mount or builder adornments.
Item casings, barrels and nozzles remain physical artwork. Builder item artwork
is scaled to fit the slot interior; this does not alter flight scale, collisions,
nozzle origins or thrust. /lab/builder is the canonical real-system example.
Human review across all chassis remains required for label clearance and fidelity.


## Engine identities integration — 2026-10-31

Supersedes earlier engine, fitting-scale and mount-placement descriptions above.
The four engines are Small ion (mass 10, thrust 12000, ceiling 500, draw 2/s),
Heavy ion (20, 20000, 750, 3/s), Fusion (16, 48000 peak, 550, 3/s), and Plasma
(24, 38000, 700, 5/s). Ion is immediate; fusion fires 0.18s each 0.45s cycle;
plasma charges 0.6s then sustains. Input release or unavailable power resets timing.
Charge/recovery consume held-input power. Timing is per mount and simulation-owned;
fractional power scales impulse, not time. Steering follows actual side output.
The catalog reports peak thrust and response; acceleration is peak, mass-dependent.

Owner authorized deleting old builds: schema/storage version 2, no fission alias.
Builder removes old v1 storage. Stock ranked profiles retain their existing rules;
custom test flight and survival use these engines and remain unranked.

Shared polygon artwork preserves accepted study variants. Editor uses full-size
engines over a 70% hull, soft selection backlight, background then engine then frame,
and fixed side/aft/hull layering. Link routes forward of the bow. Scout engines all
sit below its hull in flight and align their fronts to slot tops in both modes.
Fighter aft mounts move +5 in x; Scout aft -3; cruiser aft +3, side y ±12 and angle
±39 degrees. Cruiser nose support rectangle is removed. Slot sizes/corners remain.
No gravity/friction changes. Plume origins follow actual body outlets; the existing
plume effect remains pending separate aesthetics work. HUD shows charge and pulse
states. Player testing must establish balance, input feel and feedback readability.


## Ion effects — 0.4.1

The accepted Light/Heavy comparison in `/lab/studies/ion-engines-2026-10-31#sizes`
is promoted to the core ion beam painter. `/lab/ion-engines` compares the shared
renderer with a frozen approved reference; `/lab/builder` uses it in fitted flight.
Only `ion` and `heavy-ion` emit the new styles. Per-mark identity preserves mixed
loadouts and already-emitted residue. Fusion, plasma and untyped legacy exhaust
retain the generic painter.

Light keeps mint-cyan; Heavy has a cooler blue-cyan halo and residue, 1.4× beam
length and 1.45× width. Both keep the near-white core and transparent ends.
Complete marks overlap, inherit 80% ship velocity with 45 units/s backward drift,
and fade quadratically over 0.65 seconds. Rotation affects new emissions only.
Engine bodies, thrust, limits, mass, energy, controls, gravity and friction are
unchanged by this ion-effects integration. The accepted demo shares Light's
motion/output across both variants solely for visual comparison; real fitted
flight retains each engine's existing output behavior.

The ion Lab retains the accepted replay from rest with the Light build driving both
variants: fixed 60 Hz steps, four engine substeps, forward thrust, a one-sided turn
from 4–4.75 s, release at 5.25 s, and an end at 7 s. There is no random input or seed.
Each 480 × 330 canvas tracks the ship at (320, 165) with scale 2.4. Checkpoint buttons
reconstruct firing (tick 45), turning (270), release residue (330), and expired residue
(360). The browser test compares both variants against the preserved reference at
those moments. The reference retains its painter and replay code but consumes shared
physics, hull drawing and plume lifecycle; this is a painter-fidelity check, not an
independent baseline for changes to those shared systems or a human motion review.
(Moved from `docs/design.md` on 2026-11-02.)


## Base movement and optional stabilizers — 0.4.2

Supersedes earlier direct-turn and individual-ion limits for custom ships. Ranked
stock profiles keep their challenge physics. New builder and Flight Lab defaults
are two Light-ion side engines with empty optional mounts. Version-2 saves gain an
optional `stabilizers` boolean, default false; existing fitted parts are preserved.
The switch is available in builder and Flight Lab. Stabilizers are built-in, consume
no slot and add no mass in this alpha adapter.

Ion force vectors combine before calculating acceleration and speed ceiling. Light
strength is 1, Heavy 1.75. Heavy also draws 1.75× Light energy (3.5/s versus 2/s). At reference mass 115, Light acceleration starts at 220;
actual force is 25300 and acceleration divides by assembled mass. Net strength E
sets ceiling 340*E below 1, otherwise 340*(1+0.4*(1-exp(-0.8*(E-1)))). External
overspeed is preserved, never inflated by ion steering. These are initial tuning
values exposed in Flight Lab, not final balance. Fusion/Plasma response and individual
ceilings are retained; only their ion companions use the combined rule.

All custom ships integrate angular velocity from force × mount lever / rectangular
hull inertia about the existing origin. Rotation persists without input and is
bounded at 180°/s. Stabilizers provide 0.22 Light-ion force each, using the same ion
settings regardless of main engines. L fires the right stabilizer, R the left;
no turn command (release or LR) counters existing spin, with a fractional final burn
that cannot reverse it. Each firing stabilizer draws 0.25 Light-ion energy (0.5/s
at current Light draw 2/s). Substep power budgets scale forces and effects together;
empty batteries cannot generate stabilizer torque. Pausing freezes motion/effects;
reset starts from rest. Added mass slows both linear and angular response.

Accepted hull-relative placements (back, left/right across, outward exhaust angle):
Fighter 77%, 10/90%, 37.7°; Scout 67%, 38/62%, 67°; Cruiser 76%, 23/77%, 63°.
Shared slits have a recessed charcoal body and blue edge. Mounted Light-ion exhaust
at 0.22 output appears above hull/fittings, with the accepted residue/fade behavior.
Builder and Flight Lab consume the same saved option, simulation, geometry and
renderer. Flight Lab renders its effective settings loadout, including imported
trials, and exposes acceleration, speed curve and angular cap. Older stock trial
imports keep the stock simulation path.

References: `/lab/studies/base-movement-ion#integration`, canonical `/lab/builder`
and `/lab/flight`. Flight feel, actual acceleration/speed and all-hull stabilizer
recovery require post-integration human review; checks cannot establish balance.


## Main-game fleet — 0.4.3

The main game now uses assembled ships with Light ion in all side and aft mounts:
Scout has three engines and no extra battery, Fighter four engines and one battery,
~~Tank~~ [DEPRECATED 2026-11-01] Corvette five engines and two batteries. Capacity is 100/200/300 including the intrinsic
pack. Remaining hull slots are empty; stabilizers remain off by default. Shared
ion physics, free rotation, mass, energy and renderer apply to these ships.

`starterLoadout` and `gameSettings` define this fixed fleet independently from saved
builder ships and the two-side-ion Flight Lab fixture. Old trial imports retain
their settings. Scores use the new `ion-1` challenge. The owner authorized clearing the old
pre-alpha leaderboard before release; legacy namespaces remain supported by the
rules but are not queried by this release. Custom builder and Lab runs remain unranked.


## Standard-flight defaults — 0.4.4

Opening or reloading the main game selects Fighter, independently of a previously
saved chassis selection. Players can still choose Scout or ~~Tank~~ [DEPRECATED 2026-11-01] Corvette (or Wasp) for that session;
reset/retry retains the current session's choice. All three fixed starter loadouts
enable stabilizers. The 0.4.3 engine fittings and battery counts remain unchanged.
Builder saves and the Flight Lab's optional stabilizer setting are independent and
are not forced on. The existing pre-alpha ion-1 leaderboard remains in use.


### Inverted controls default — 0.4.4 hotfix

New or reset settings default to inverted left/right engine controls. Existing
explicitly saved settings continue to take precedence, and the Settings toggle
can disable inversion. The release number remains 0.4.4.


## Ship names and ids — S4, 2026-11-02

Owner decision D4, amended 2026-11-02: a ship's id is its short name in lower case, and
`balanced` and `tank` are retired. Every ship also has a long name (its full designation)
and a one-line trait.

| Id         | Short name | Long name              | Trait                                                                 |
| ---------- | ---------- | ---------------------- | --------------------------------------------------------------------- |
| `wasp`     | Wasp       | LHI Wasp               | One rear Light ion + 4 turning stabilizers. Standard energy capacity. |
| `scout`    | Scout      | Daehan Scout No.7      | Three Light ions. Standard energy capacity.                           |
| `fighter`  | Fighter    | Aegis XF-1 Interceptor | Four Light ions. One extra energy pack.                               |
| `corvette` | Corvette   | Mark II Escort Frigate | Five Light ions. Two extra energy packs.                              |
- **Source.** `SHIP_IDENTITY` in `packages/mode-a/src/lib/config.ts`, parsed by
  `ShipIdentitiesSchema`. The schema requires every id and rejects a short name that differs
  from its id. `ShipProfile` and `Chassis` no longer carry a `name`.
- **Traits** describe the main-game starter fleet; a unit test checks each trait's engine
  and energy-pack counts against `starterLoadout`.
- **Where each name appears.** Short name in compact places: flight-menu options, builder
  chassis buttons, the leaderboard Ship column, the Lab inspector selector and instrument
  legends. Long name in headings and descriptions: the builder heading, the flight-menu
  description (with the trait) and the Lab inspector's Identity group. The Flight Lab menu keeps
  its own lines describing the Lab test fixture, not the starter ship.
- **Saved data (alpha).** No migration. Builds move to `void-drift-builds-v3`, and the
  v1 and v2 keys are removed on load. Settings that name a retired id fall back to defaults.
  Lab trial links naming a retired profile id no longer parse. The Firestore rules accept
  only the four new ids; existing `ion-1` score documents with old ids are purged by the owner
  on the next install.
- **Kept code identifiers** (optional cleanup): `cruiser.ts`/`CRUISER`, `fighter.ts`,
  `scout.ts`, `wasp.ts`, renderer comments, and the `cruiser` wording in test names.
- **Preserved studies** pass the new ids to production APIs, but their prose and displayed
  names stay as they were recorded.

## Utility machinery resting artwork — accepted 2026-11-02

The family promise is “I create opportunities.” Its selected accent is RGB
206, 219, 23 (`#CEDB17`), applied to connectors, struts and attachments. Individual
members need not share a silhouette. The accepted resting geometry is preserved in
`/lab/studies/utility-machinery-2026-11-02`, section 02.6.

Shared `UTILITY_ART` faces and `drawUtilityArtwork` provide storage, solar, gravity
and repair artwork using flat filled planes, with local +x forward. Simple accent
shades preserve the accepted construction. Default mount scale is 0.35. Storage
replaces the existing battery casing/mark in the production builder and flight
renderer, retaining existing mount positions and hull layering rules.

Solar, gravity and repair were conceptual artwork identifiers in this delivery. It added
no device IDs, catalog entries, loadout choices, charging or repair rules. All four
artworks are available at `/lab/utility-artwork`; that page also exercises the real
battery renderer on all production hulls at enlarged and gameplay scale. Resting
states only: no deployment, orbiting drones, field pulses or animation.

## Gravity coil — implemented 2026-11-03

The accepted static form is **M / Inset ring at 100%**, preserved in
`/lab/studies/gravity-coil-form-2026-11-03` sections 02.5–02.6. The segmented toroid,
creased sector shells, open centre and yellow connections remain unchanged. The
engine-coloured open annulus sits inside the outer silhouette, beneath the shells
and visible through their gaps. Upper-left lighting and the accepted light machinery,
charcoal and safety-yellow palette are preserved. No backing plate or outer rim.

`gravity-coil-art.ts` constructs the accepted faces in ship-local +x coordinates;
`UTILITY_ART.gravity` validates them with the shared face schema. Its default mount
scale is **0.5**, matching the selected 100% reference. `utilityArtworkScale` is shared
by Canvas and SVG consumers; other utility artwork scales retain their values.
The study’s drawings remain independent fidelity references.

**Playable catalog hookup, explicitly added after the static-form study:**
`gravity-coil` is a separate utility fitting named **Gravity coil**, available in
equipment and universal slots on all four hulls. It appears in the catalog, builder
and flight using the same shared artwork and the existing mount/layer rules. It
persists in existing version-2 loadouts and version-3 browser storage without a reset.
It has provisional mass **10**, matching Loading coil, and contributes the normal
mass effect on acceleration and turning. It adds **no capacity, thrust or energy
draw**. Collection and flight FX are defined below.
Existing `coil` remains the solar-charging Loading coil. Starter fleets are unchanged.

The shared-artwork Lab page `/lab/utility-artwork#gravity-coil` shows all equipment
slots fitted on Wasp, Scout, Fighter and Corvette, with all engine-compatible slots
carrying Light ions, at 3×, true 1× and 0.65 flight scale. The frozen study retains
the above-hull comparison. Acceptance covers static artwork and a selectable static
fitting. The subsequent FX study defines collection and animation below.

Acceptance scenarios:

- The new fitting can be installed, reloaded, flown and removed independently of
  Loading coil; its installation does not increase solar charging or storage.
- Its shared geometry, face colours and paint order match M at 100%, including the
  transparent aperture; flight does not add the legacy rectangular placeholder.
- All four hulls use their existing mounts and layering; the flight scale remains
  0.65, with Gravity coil’s artwork transform at 0.5 inside that scene transform.

## Potential Well — implemented 2026-11-02

Supersedes the earlier +100-per-battery rule and placeholder storage artwork.
Every hull retains 100 intrinsic capacity. Potential Well (`battery`, preserved for
saved version-2 loadouts) adds 85 capacity and 18 mass. Heavy Potential Well
(`heavy-well`) adds 140 capacity and 36 mass. Both are utility fittings accepted by
equipment and universal mounts; neither adds resource draw or collection behavior.
The UI resource remains energy. Flights begin at the combined full capacity, and
life-support consumption remains 3 per second. Stock Fighter capacity is 185 and
Corvette capacity is 270; stock Wasp and Scout remain 100.

Approved part-list description for both sizes (121 characters):
“A bank of well containment units stores potential in subspace, ready to supply the
ship with matter and energy as needed.”

Shared procedural path definitions in `potential-well-art.ts` implement the accepted
normal 02.8 and heavy 02.9 A from `/lab/studies/resource-capacity-2026-11-02`.
Both use 0.55 artwork scale and the production mount transforms/layering. The heavy
has larger wells; neither has yellow end extensions. #CEDB17 connects the wells,
with grey lattice between the connectors and upper-left lighting. No animation or
SFX is included. The study fleet tool uses these production definitions and offers
both sizes, every equipment mount and fully populated Light ion engine/aft mounts.

## Fighter equipment-mount handoff — 2026-11-03

Implemented from the owner’s mount plan, narrowed by their explicit correction:
equipment mounts are now hull-0 (37, 0) and hull-1 (-1, 0). All engine positions,
aft positions and angles retain their prior production values, including the
side engines’ ±26° angles. The exported angle difference was not accepted.
Mount identities, types, dimensions and production links are unchanged.

`FIGHTER.hullMounts` in `packages/mode-a/src/lib/fighter.ts` supplies the equipment
positions to the shared mount builder, production rendering and builder hit
targets. The submitted Heavy Potential Well loadout was a preview; default
equipment and saved loadouts are unchanged.

## Hangar control alignment — 2026-11-03

The Hangar uses the shared `Toggle` for its four ship choices, labelled with
ship short names. Selecting a ship preserves its saved build and resets mount
selection as before. The introductory slogans and footer encouragement are
removed; the Hangar heading, save status and functional flight instructions remain.

The Hangar chooser uses the full-width detailed selector variant: each segment
shows the ship name, mount count and chassis mass in wrapping inline flex. Values
come from production chassis definitions; saved fitting mass is not included.

The first Hangar column has a standalone elevated ship display, with no enclosing panel. Ion stabilizers and ship-system notes sit below
in a separate elevated, cut-corner block. The ship display uses the shared
scanline surface, bezel/shadow and reference axes used by the mount planner;
installed parts and slot selection remain production rendering. The systems
block retains its existing control behavior.

The standalone ship display fills its column. Its drawing scale and origin fit
the current hull, fittings, slot labels and link guides to the measured container
with padding. Resize and chassis changes recalculate framing; canvas rendering
and clickable mount targets use the same transform. The canvas backing resolution
follows device pixel density.

Inside the ship display, its name sits top-left behind the ship drawing in
layer order. “Fixed mounts / Top view” sits bottom-right. Both are passive labels;
mount targets remain above the drawing and receive input.

The ion-stabilizer block uses elevation-1 console fill and the standard
`cut-surface` corners, with its decorative edge suppressed. It does not adopt
the larger panel cuts or a panel border.

## Linked engines and stabilizer defaults — 2026-11-03

New builds on every chassis start with ion stabilizers on. Absent stabilizer flags
default on; explicit saved choices remain intact, with Wasp still forced on.
In its own pane below stabilizers, Linked engines is a persisted per-build checkbox, off by
default. Missing `linkedEngines` in version-2 loadouts means off. When enabled,
either left or right input commands every fitted engine in the aft mount group;
when disabled, both inputs are required. Neither input means no aft command.
Side engine selection, turning inputs, engine charge/pulse behavior and power
limits remain unchanged. Energy drain and visible exhaust use the same command.
The Wasp has no aft-group mounts, so this option does not change its center engine.

A shared Plan / View toggle sits top-right inside the ship display. Plan is the
default and shows builder slot markings and selectable mount targets. View draws
the fitted ship through the production in-game renderer, omitting slot markings,
reference axes and mount targets. Switching modes preserves fittings, selection
and framing. The ship title remains behind the drawing; the toggle stays above it.


### Gravity collection and flight FX — adopted 2026-11-03

Accepted study: `/lab/studies/gravity-coil-fx-2026-11-03`, parts 03–04.
Each fitted Gravity coil supplies **1 energy/second** whenever the ship centre is
strictly inside a planet’s existing influence radius. This is automatic while
coasting or thrusting. Multiple coils stack; overlapping wells never multiply the
rate. Loading coils keep their solar behavior. Gravity collection changes no forces,
gravity constants or velocity. Starter fleets remain unchanged.

Collection is budgeted in simulation substeps, alongside solar supply and baseline
drain, before the zero/capacity clamp and engine spending. It is limited to
remaining storage capacity. It does not resurrect a
finished run. A full store receiving enough other supply collects nothing; if normal
consumption opens capacity, collection can fill that space. At 3/s baseline drain,
one coil offsets one third and two offset two thirds before solar and engine draw.
The 1/s rate is the alpha balance starting point, not a proven equilibrium.

Actual deposited energy drives the shared flight FX. Each fitted mount emits the
approved J dispersed soft fold: purple 273°, 250% brightness, double original
width/height and original 15 drawing-unit offset away from the nearest influencing
planet. Grain patterns are deterministic and independent per mount. Hull rotation
moves the mounts; field direction controls the folds. Activity fades in/out over
0.25 seconds, including full storage and field exit; exit keeps the last direction
through the fade. Pausing freezes the effect with simulation time.

Fitted flight renders engine marks and folds additively onto one transparent FX
surface above the ship, then composites that surface over the world. The study
uses the same simulation and renderer, including the two-coil turning flyby and
live collection rate. Its normal-blend toggle is a diagnostic comparison only.

Acceptance: test one/two coils, idle/thrust, excluded boundary/outside, overlapping
wells, capacity and full-store fade, field-exit fade, deterministic replay and
unchanged motion against an equal-mass noncollecting fitting. Judge visibility and
balance separately in play; no automatic check settles those qualities.
