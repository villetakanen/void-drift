# Gravity field

Status: reverse-engineered from the code, 2026-11-04. Sections marked **Target**
describe the agreed direction in
[2026-11-04-gravity-field-lab.md](../plans/2026-11-04-gravity-field-lab.md) and
are not implemented. Everything else describes what flies today.

## Context

Gravity is the game's terrain. The accepted intent (study `gravity-wells`,
`/lab/studies/gravity-wells`) is that a close pass of a sun or planet is a
temptation: cutting closer bends the path and can pay off, while going deeper
makes escape hard or impossible before heat or impact ends the run. Players must
be able to learn that difference from how wells behave.

This spec owns the rules of the gravity field: the bodies, their pull, how a ship
moves through it, and how its values change. Engine thrust belongs to the ship
and loadout specs; gravity energy collection belongs to
`packages/mode-a/src/lib/gravity-collection.ts` and only reads the bodies defined
here.

## Architecture

### Bodies in play

- One G sun at (960, 540), created by `createStar` in
  `packages/mode-a/src/lib/game-loop.ts` from `SUN_CONFIG.G`
  (`packages/core/src/lib/config.ts`). Its reach is its radius × `sunReachFactor`.
- Three planets from `SURVIVAL_CONFIG.PLANETS` (same file), built by
  `initializePlanets` (`packages/core/src/lib/physics/planets.ts`) on circular
  orbits round the sun. In play the flight seed rotates every orbit's starting
  phase by `(seed mod 360) / 180 · π` and changes nothing else (test flights also
  seed their salvage).
- `Simulation` (`packages/mode-a/src/lib/simulation.ts`) applies the gravity
  tuning to these bodies in its constructor: sun mass × `sunMultiplier`, and each
  planet gets an explicit well `{ reach, strength: planetStrength, curve }`,
  validated by `PlanetWellSchema` (`packages/core/src/lib/physics/Physics.ts`),
  where reach is `getPlanetInfluenceRadius` under the tuning's reach rule:
  `clamp(√mass · massScale, minRadii · radius, maxRadii · radius)`.
- Test flights (`settings.testFlight`) remove the planets, shrink the sun to
  radius 12 with its strength scaled by (12 / radius)², and place the ship 85
  outside the sun's reach. The reach is stored when the sun is created and is not
  recomputed, so it stays at the G sun's 315.

### The pull

`wellAcceleration(distance, reach, strength, curve)` in `Physics.ts`:

- inverse-square: `strength / 6 · ((reach / distance)² − 1)`
- linear: `strength · (1 − distance / reach)`
- zero at and beyond reach; both curves give `strength / 2` at half reach.

`updateShip` (same file) adds, per substep, the pull of:

- the sun, when `sun.radius < distance < sun reach`, with the curve passed by the
  caller (play passes the tuning's `curve`);
- each planet, when `planet.radius + ship.radius < distance < planet reach`, with
  its well's `curve` (absent: `inverse-square`) when the planet has a well. Planets without a well use the
  legacy `mass / distance² · 1000` (studies only; play always sets wells).

Pulls add as vectors. Gravity does not depend on the ship, its speed, its mass or
its engines.

### Motion

- Fixed tick `STEP = 1/60` s; `Simulation.step` runs four substeps of `STEP / 4`.
  Replays are input segments, each held for a number of ticks (`ReplaySchema`,
  `schemas/flight.ts`).
- Planets advance on their orbits inside `updateShip`, once per substep, before
  their pull is measured.
- Integration is semi-implicit Euler: velocity from the summed acceleration, then
  position from the new velocity. Play passes `{ drag: 0, speedLimit: null }`
  (`FlightResistanceSchema`): no passive drag and no speed cap.
- The arena is a circle of radius 1200 round (960, 540); a ship that leaves it
  reappears at the opposite point, 1190 from the centre, with its velocity kept.

### Contact

- Planet: whenever the ship is inside radius + ship radius, whichever way it is
  moving, it is pushed out to the surface, its velocity is reflected about the
  surface normal and the whole velocity scaled by 0.8, and the hull loses
  `SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE` (loadout ships use hull multiplier 1).
- Sun, outside test flights: the substep loop stops when the ship is within sun
  radius + ship radius of (960, 540), and the tick ends the run with death cause
  `STAR`. In test flights contact is not lethal and the loop does not stop
  (`highscore.ts` death causes: `STAR`, `HULL`, `POWER`). Heat damage near the sun
  is `updateHull`, outside this spec.

### Tuning values

Gameplay tuning lives in one versioned file, `packages/mode-a/src/lib/tuning.json`,
one section per area, parsed at load by `TuningSchema` (`packages/mode-a/src/lib/tuning.ts`)
into `TUNING`. This spec owns the `gravity` section, validated by
`GravityTuningSchema` (`packages/mode-a/src/lib/schemas/gravity.ts`) and exported
as `GRAVITY_TUNING`. The Lab usability plan
(`docs/plans/2026-11-04-lab-usability.md`) adds per-ship sections to the same file.

| Value            | Range                      | Meaning                                           |
| ---------------- | -------------------------- | ------------------------------------------------- |
| `sunMultiplier`  | 4–10                       | sun strength = `SUN_CONFIG` mass × value          |
| `planetStrength` | > 0                        | strength of every planet's well                   |
| `sunReachFactor` | > 0                        | sun reach = sun radius × value                    |
| `planetReach`    | each > 0, min ≤ max        | `{ massScale, minRadii, maxRadii }`: planet reach |
| `curve`          | `inverse-square`, `linear` | curve of the sun's and every planet's well        |

The file holds the values in play; read it for them rather than copying them
here. `applyGravityTuning` and `tunedWell` (`simulation.ts`) apply the section to
bodies; `Simulation`, `createStar`'s default reach and the FX bench use them.
`GRAVITY_FLIGHT` keeps its shape for existing consumers, taking its gravity values
from the section; its `engineSpeedScale` is not gravity (see below).

Still fixed in code: four substeps. `getPlanetInfluenceRadius` keeps a default
reach rule for studies and Lab inspectors only.

`planetStrength` and `sunMultiplier` are provisional and not yet reviewed for feel
in flight.

### Engine taper (finding)

`updateShip` takes both `engineCutoff` and `engineSpeedScale`; when a cutoff is
given it is applied and `engineSpeedScale` is ignored. Play passes
`ENGINE_CUTOFF` (750, `packages/core/src/lib/effects/engine-plume.ts`), so the
1 / (1 + (v / 600)²) taper is never applied. Loadout ships, which is every ship
in play, receive no thrust input in `updateShip` at all; their thrust comes from
`applyBuildEngines` (`build-flight.ts`) with each part's own `limit`. So
`engineSpeedScale` currently affects no flight. It belongs to engine rules, not
gravity, and is kept here only until that is decided.

### Rules version

Score documents carry the rules version `CHALLENGE` (`packages/mode-a/src/schemas/highscore.ts`,
currently `ion-1`), which also prefixes score document IDs. Changing the values or
rules in this spec changes trajectories for the same inputs, so scores from
before and after such a change are never compared.

`CHALLENGE` changes once per release, at release, and only when rules or tuning
differ from the previous release (owner decision, 2026-11-04). Applying a
proposal or editing values in code never changes it. The step belongs to the
release procedure in `docs/development.md`.

### Target: reach from mass

Owner decision, 2026-11-04: a well's pull is semi-physical,
`G × mass / distance²` (`G = 1000`), and its reach is only a cut-off that comes
from its mass, `reach = sizeMultiplier × mass`, artificially smaller than physics
to keep game physics sane; a hard cut, metrics first. The current curve lets the
reach shape the pull everywhere inside it, a drift from the earlier mass-based
planet rule that this corrects. The
[Gravity tuning](gravity-tuning.md) bench finds the multiplier with one well and
the game's ships. The game does not follow this yet: planets adopt it first and
suns later, each as its own specified change, which also defines how the bench's
values reach the tuning file. Until then the rules above stand.

### [DEPRECATED 2026-11-04] Lab flight conditions (field)

> Built for the instrument's field mode, which mixed ship and gravity tuning.
> Removed in plan step R2 (2026-11-04); the Gravity tuning bench does not use
> it. `starPull` and `planetPull` (`Physics.ts`), split out of `updateShip` for
> it, remain and `updateShip` uses them.

`new Simulation(settings, { field })`. Options are parsed by
`SimulationOptionsSchema` (`simulation.ts`); the field by `GravityFieldSchema`
(`packages/mode-a/src/lib/schemas/gravity.ts`). Without a field, or with the
empty field `{}`, the simulation flies exactly as play. The Lab usability plan
adds its per-chassis tuning patch to the same options object, beside `field`.

- `system`: `game` (default) or `empty`. An empty system has no planets and no
  sun: `hasSun` is false, the sun neither pulls nor charges, and there is no heat
  and no sun contact.
- `orbits`: `moving` (default) or `frozen`; frozen planets stay at their seeded
  start positions.
- `wells`: up to four Lab wells, each `LabWellSchema`: label, position inside the
  arena, reach, strength and curve. A Lab well pulls by `wellAcceleration`
  (`labWellPull`, `simulation.ts`), summed with every other pull, outside the
  ship's radius, as a planet of radius zero would. It has no surface: nothing
  collides with it, it ends no run, and gravity coils do not collect from it.
- `changes`: any `GravityTuningSchema` values, laid over `GRAVITY_TUNING` and
  validated with it; `Simulation.gravity` holds the result.
- `start`: `ShipStartSchema` (position inside the arena, heading in degrees with
  0 = +x and −90 = up, speed along the heading); without it the ship keeps the
  game's spawn.

The constructor throws when a start lies within contact distance of the sun or a
planet, and when a field is combined with a test flight.

`Simulation.gravityAt(point)` returns the summed pull at a point (default: the
ship) from the same functions the step uses: `starPull` and `planetPull`
(`Physics.ts`, called by `updateShip`) and `labWellPull`. `Simulation.contacts`
counts planet contact substeps. The Lab instrument's
field mode (`docs/specs/lab-instrument.md`) runs this `Simulation`; it has no
gravity code of its own.

### [DEPRECATED 2026-11-04] Changing gravity values

> The proposal below came from the instrument's field mode and was removed with
> it in plan step R1 (2026-11-04). The `pnpm tuning:apply` script and its area
> registry stay (no areas yet) for the ship area; how Gravity tuning's values
> reach the game is defined when planets adopt reach from mass.

Gravity values change only by applying an owner-supplied proposal. The owner
copies it from the Lab instrument's pane (Copy proposal, enabled once a field
document changes a gravity value) and hands it to an agent. Built by
`gravityProposal` (`apps/web/src/lib/instrument/proposal.ts`), it reads:

```text
Gravity tuning proposal (instrument document v2, from /lab/instrument)
Baseline: <every gravity value the Lab's game build had, key value; …>
Apply: <key> <old> → <new>; …
Not applied (Lab wells): <labels, or none>
<the instrument document JSON>
```

Keys are `sunMultiplier`, `planetStrength`, `sunReachFactor`,
`planetReach.massScale`, `planetReach.minRadii`, `planetReach.maxRadii` and
`curve`.

`pnpm tuning:apply <area> <file>` (`scripts/tuning-apply.mjs`) applies one
section of the tuning file; `gravity` is defined here, `ship` by the Lab
usability plan. The script loads each area's checks from TypeScript through
Vite (`createViteServer` from `vitest/node`). For `gravity`
(`applyGravitySection`, `proposal.ts`) it:

- parses the JSON with `InstrumentConfig`, lays `field.changes` over the tuning
  file's `gravity` section, validates the result with `GravityTuningSchema`,
  writes the file with every other section untouched, and prints `key old → new`
  for each changed value;
- refuses, writing nothing and exiting 1, when the block has no document or
  invalid JSON, the document is invalid or has no field, a value is out of range
  or unknown, the Apply line is missing or disagrees with the document, an Apply
  `old` value differs from the tuning file (a stale proposal, named by value), or
  nothing would change; the tuning file itself being invalid is refused too;
- exits 2 for an unknown area or a missing file argument.

`VOID_DRIFT_TUNING_FILE` points the script at another file (used by its tests).
The agent then runs `pnpm verify`, updating visual baselines for the trajectory
change without changing tolerances, and commits locally with the proposal block
in the message body. It does not change `CHALLENGE`. Lab wells and starts never
become game data by this route.

## Contract

### Definition of Done

- [x] The inverse-square curve is zero at and beyond reach, equals
  `strength / 2` at half reach, and is stronger than linear near the centre and
  weaker near the border (`WellCurve.test.ts`).
- [x] A planet with a well pulls inside its reach, and its reach is independent
  of size (`Physics.test.ts`, `simulation.test.ts`).
- [x] A planet with a well does not pull outside its reach (`Physics.test.ts`).
- [x] `updateShip`'s well can be escaped with thrust, on a fixture sun with the
  stock thrust path (`simulation.test.ts`); unpowered, a loadout ship coasts
  above the old speed cap with planets removed (same file).
- [x] The close-pass and too-deep scenarios below pass on a `Simulation` with the
  game sun (`sun.test.ts`).
- [x] The same replay gives the same trajectory twice under one rules version
  (`simulation.test.ts`, "reproduces validated replay exactly").
- [x] Every gravity value in play is read from the tuning file: the simulation's
  bodies equal those built from `GRAVITY_TUNING`, and changing each value changes
  the bodies (`tuning.test.ts`).
- [x] A planet with a well pulls with its own curve (`Physics.test.ts`).
- [DEPRECATED 2026-11-04, removed with the field in R2] ~~A default
  `Simulation` and one given the empty field produce the same trajectory; an
  empty system, Lab wells, frozen orbits, starts and changes behave as
  described (`field.test.ts`).~~
- [x] A proposal reads back as exactly its changes; each refusal above has a
  reason; `tuning:apply` applies a proposal once and then refuses it as stale
  without writing (`proposal.test.ts`, including a run of the script on a
  copy).
- [ ] Owner flight review of sun and planet feel, recorded here with date.

### Regression Guardrails

- One gravity function serves play, replay and the Lab.
- Gravity depends only on the ship's position and the bodies, never on its
  engines, speed or loadout.
- Play has no passive drag and no speed cap.
- A release whose gravity values or rules differ from the previous release
  changes `CHALLENGE`; nothing else changes it.
- Lab-only wells exist only in Lab documents.

### Scenarios

```gherkin
Scenario: A pass outside reach is unaffected
  Given a Simulation with planets removed and a loadout ship given no input
  And the ship starts at 1.5 sun reaches from the sun, moving tangentially
  And its speed keeps it inside the arena for 840 ticks
  When it flies for 840 ticks
  Then its velocity after every tick equals its starting velocity

Scenario: A close sun pass bends and escapes
  Given a Simulation with planets removed and a loadout ship given no input
  And the ship starts outside the sun's reach on a straight line whose closest
    approach to the sun's centre lies between contact distance and half reach
  And its speed exceeds escape speed at that closest approach
  When it flies until it leaves the sun's reach or 840 ticks pass
  Then its gravity acceleration at closest approach points at the sun
  And its heading has turned toward the sun's side compared with its start
  And it is outside the sun's reach before 840 ticks
  And the run has not ended

Scenario: Going too deep ends the run
  Given a Simulation with planets removed and a loadout ship given no input
  And the ship starts at rest at 0.9 sun reaches from the sun
  When it flies for up to 840 ticks
  Then the run ends with death cause STAR

Scenario: Planet contact bounces the ship
  Given a ship that is inside a planet's radius plus its own radius
  When the substep is applied
  Then it is placed on the planet's surface
  And its velocity is its previous velocity reflected about the surface normal
    and scaled by 0.8, plus that substep's gravity change
  And its hull is lower by PLANET_COLLISION_DAMAGE

Scenario: Applying an owner's proposal
  Given a copied proposal changing planetStrength from 600 to 450
  When the agent runs tuning:apply with it
  Then the tuning file holds 450 and the script prints "planetStrength 600 → 450"
  And CHALLENGE is unchanged

Scenario: Refusing a stale proposal
  Given a proposal whose Apply line has sunMultiplier 5 → 6 while the tuning file holds 4
  When the agent runs tuning:apply with it
  Then it refuses, names sunMultiplier, writes nothing and exits 1
```

## Open questions

- Does `engineSpeedScale` move to the engine rules or get removed? It affects no
  flight today.
- The sun's contact and heat checks use (960, 540) instead of the sun's
  position; harmless while the sun is fixed there.
- `sunMultiplier` has a floor of 4, today's value, so a proposal cannot weaken the
  sun. Widening a range is a rules change for the owner, not a proposal.
