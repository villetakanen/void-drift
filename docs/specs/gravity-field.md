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
  (`packages/core/src/lib/config.ts`). Its reach is its radius × 9.
- Three planets from `SURVIVAL_CONFIG.PLANETS` (same file), built by
  `initializePlanets` (`packages/core/src/lib/physics/planets.ts`) on circular
  orbits round the sun. The flight seed rotates every orbit's starting phase by
  `(seed mod 360) / 180 · π`; it changes nothing else.
- `Simulation` (`packages/mode-a/src/lib/simulation.ts`) applies the gravity
  tuning to these bodies in its constructor: sun mass × `sunMultiplier`, and each
  planet gets an explicit well `{ reach, strength: planetStrength }`, validated by
  `PlanetWellSchema` (`packages/core/src/lib/physics/Physics.ts`), where reach is
  `getPlanetInfluenceRadius` of the planet before the well is set:
  `clamp(√mass · 10, 2 · radius, 8 · radius)`.
- Test flights (`settings.testFlight`) remove the planets, shrink the sun to
  radius 12 with its strength scaled by (12 / radius)², and place the ship 85
  outside the sun's reach.

### The pull

`wellAcceleration(distance, reach, strength, curve)` in `Physics.ts`:

- inverse-square: `strength / 6 · ((reach / distance)² − 1)`
- linear: `strength · (1 − distance / reach)`
- zero at and beyond reach; both curves give `strength / 2` at half reach.

`updateShip` (same file) adds, per substep, the pull of:

- the sun, when `sun.radius < distance < sun reach`, with the curve passed by the
  caller (play passes `inverse-square`);
- each planet, when `planet.radius + ship.radius < distance < planet reach`, with
  `inverse-square` when the planet has a well. Planets without a well use the
  legacy `mass / distance² · 1000` (studies only; play always sets wells).

Pulls add as vectors. Gravity does not depend on the ship, its speed, its mass or
its engines.

### Motion

- Fixed tick `STEP = 1/60` s; `Simulation.step` runs four substeps of `STEP / 4`.
  Replays are inputs per tick (`ReplaySchema`, `schemas/flight.ts`).
- Planets advance on their orbits inside `updateShip`, once per substep, before
  their pull is measured.
- Integration is semi-implicit Euler: velocity from the summed acceleration, then
  position from the new velocity. Play passes `{ drag: 0, speedLimit: null }`
  (`FlightResistanceSchema`): no passive drag and no speed cap.
- The arena is a circle of radius 1200 round (960, 540); a ship that leaves it
  reappears at the opposite point, 1190 from the centre, with its velocity kept.

### Contact

- Planet: the ship is pushed out to the surface and its velocity reflected about
  the surface normal with restitution 0.8; hull damage is applied.
- Sun: the substep loop stops when the ship is within sun radius + ship radius of
  (960, 540), and the tick ends the run with death cause `STAR`
  (`highscore.ts` death causes: `STAR`, `HULL`, `POWER`). Heat damage near the sun
  is `updateHull`, outside this spec.

### Tuning values

Parsed by `GravityFlightSchema` (`Physics.ts`) into `GRAVITY_FLIGHT`
(`simulation.ts`).

| Value              | Today | Range     | Meaning                                  |
| ------------------ | ----- | --------- | ---------------------------------------- |
| `sunMultiplier`    | 4     | 4–10      | sun strength = `SUN_CONFIG` mass × value |
| `planetStrength`   | 600   | > 0       | strength of every planet's well          |
| `engineSpeedScale` | 600   | > 0       | see "Engine taper" below                 |

Fixed in code, not tunable today: sun reach factor 9, planet reach rule,
curve `inverse-square`, four substeps.

`planetStrength` 600 and `sunMultiplier` 4 are provisional and not yet reviewed
for feel in flight.

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

### Target: tuning as configuration

- One versioned tuning file holds every tuned gameplay value in play, in one
  section per area. This spec owns the `gravity` section; the Lab usability plan
  (`docs/plans/2026-11-04-lab-usability.md`) adds per-ship sections (parts,
  chassis mass, chassis-scoped ion) to the same file and command.
- `GravityTuningSchema` in `packages/mode-a/src/lib/schemas/gravity.ts` validates
  the `gravity` section: `sunMultiplier`, `planetStrength`, the sun reach factor,
  the planet reach rule and the curve, each with its range. `GRAVITY_FLIGHT` reads
  it, and no other code holds gravity values.
- `Simulation` accepts an optional field: gravity tuning, body set (`game` or
  `empty`), added wells, frozen orbits and ship start. Without one it builds the
  bodies in play exactly as above. The same options object also carries an
  optional per-chassis tuning patch, defined by the Lab usability plan; this spec
  only requires that a field and a patch can be given together.
- The Lab instrument's field mode (`docs/specs/lab-instrument.md`) runs this
  `Simulation`; it never has its own gravity code.

### Target: changing gravity values

Gravity values change only by applying an owner-supplied proposal. A proposal is
copied from the Lab instrument's pane (Copy proposal) and reads:

```text
Gravity tuning proposal (instrument document v2, from /lab/instrument)
Baseline: <current gravity values in the tuning file>
Apply: <value> <old> → <new>; …
Not applied (Lab wells): <labels>
<the instrument document JSON>
```

`pnpm tuning:apply <area> <file>` (`scripts/tuning-apply.mjs`) applies one
section of the tuning file; `gravity` is defined here, `ship` by the Lab
usability plan. For `gravity` it:

- parses the JSON with `InstrumentConfig`, takes `field.changes`, validates them
  with `GravityTuningSchema`, writes the `gravity` section and prints old → new
  for each value; other sections are untouched;
- refuses, changing nothing, when the document has no changes, a value is out of
  range or unknown, or the baseline values differ from the tuning file.

The agent then: updates the table above; runs `pnpm verify`,
updating visual baselines for the trajectory change without changing tolerances;
and commits locally with the proposal block in the message body. Added Lab wells
never become game bodies by this route.

## Contract

### Definition of Done

- [x] The inverse-square curve is zero at and beyond reach, equals
  `strength / 2` at half reach, and is stronger than linear near the centre and
  weaker near the border (`WellCurve.test.ts`).
- [x] A planet pulls inside its reach and not outside it; an explicit reach is
  independent of size (`Physics.test.ts`, `simulation.test.ts`).
- [x] Under power, a ship can escape the sun's well; unpowered, a ship coasts
  above the old speed cap (`simulation.test.ts`).
- [x] The same replay gives the same trajectory twice under one rules version
  (`simulation.test.ts`, "reproduces validated replay exactly").
- [ ] Target: every gravity value in play is read from the tuning file (unit test:
  a `Simulation` built from a modified tuning object pulls differently; no
  gravity literal remains in `simulation.ts`).
- [ ] Target: a default `Simulation` and one given the default field explicitly
  produce the same trajectory for the same replay (unit test).
- [ ] Target: `tuning:apply` applies a valid proposal and refuses each invalid
  case listed above, leaving the tuning file unchanged (script tests).
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
  Given a coasting ship whose path stays outside every body's reach
  When it flies for 14 s
  Then its velocity is unchanged

Scenario: A close sun pass escapes under power
  Given a ship crossing the sun's reach with full engines toward open space
  When it passes inside half the sun's reach
  Then its path bends toward the sun
  And it leaves the sun's reach without touching the sun

Scenario: Going too deep ends the run
  Given an unpowered ship falling straight toward the sun
  When it comes within sun radius plus ship radius of the sun's centre
  Then the run ends with death cause STAR

Scenario: Planet contact bounces the ship
  Given a ship that reaches a planet's surface
  Then it is placed on the surface with its velocity reflected and reduced
  And its hull is damaged

Scenario: Target: applying an owner's proposal
  Given a copied proposal changing planetStrength from 600 to 450
  When the agent runs tuning:apply with it
  Then the tuning file holds 450 and the script prints "planetStrength 600 → 450"
  And CHALLENGE is unchanged

Scenario: Target: refusing a stale proposal
  Given a proposal whose baseline sunMultiplier is 5 while the tuning file holds 4
  When the agent runs tuning:apply with it
  Then it refuses, names the mismatched value, and the tuning file is unchanged
```

## Open questions

- Does `engineSpeedScale` move to the engine rules or get removed? It affects no
  flight today.
- The sun's contact check uses (960, 540) instead of the sun's position; harmless
  while the sun is fixed there, but the field mode's `empty` system must not rely
  on it.
