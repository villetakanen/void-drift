# Gravity field

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
  (`packages/core/src/lib/config.ts`), radius 35.
- Three planets from `SURVIVAL_CONFIG.PLANETS` (same file), each with its `id`,
  built by `initializePlanets` (`packages/core/src/lib/physics/planets.ts`) on
  circular orbits round the sun. In play the flight seed rotates every orbit's
  starting phase by `(seed mod 360) / 180 · π` and changes nothing else (test
  flights also seed their salvage).
- `Simulation` (`packages/mode-a/src/lib/simulation.ts`) puts every body on the
  mass law in its constructor (`applyGravityTuning`): the sun and each planet get
  a `massWell` (`MassWellSchema`, `packages/core/src/lib/physics/Physics.ts`) of
  their mass from the tuning file, with its cut-off pull and falloff; the sun's
  `influenceRadius` is set to its reach. A configured planet without a mass in
  the tuning file is an error.
- Test flights (`settings.testFlight`) remove the planets, shrink the sun to
  radius 12 with its mass scaled by (12 / 35)², keeping its pull at the surface,
  and place the ship 85 outside the sun's new reach.

### The pull

The mass law (reasoning: [gravity-model.md](../../../../gravity-model.md)): a body pulls by
its mass, `massWellPull` in `Physics.ts`,

- 1/d², in play: `G × mass / distance²`, `G = 1000` (`MASS_WELL_G`);
- 1/d: `G₂ × mass / distance`, `G₂ = 10` (`MASS_WELL_G_2D`), equal to 1/d² at
  100 u.

Its reach is where that pull falls to the cut-off pull, the same for every body:
`√(G × mass / cutoff)` for 1/d², `G₂ × mass / cutoff` for 1/d (`massWellReach`).
The reach is a hard cut-off, kept artificially smaller than physics so game
physics stays sane: inside it the pull is exactly the law, at and beyond it zero
(`massWellAcceleration`). Mass alone sets how hard a body pulls; the cut-off only
sets where the pull ends.

`updateShip` (same file) adds, per substep, the pull of:

- the sun, when `sun.radius < distance < sun reach` (`starPull`);
- each planet, when `planet.radius + ship.radius < distance < planet reach`
  (`planetPull`).

Pulls add as vectors. Gravity does not depend on the ship, its speed, its mass or
its engines. Bodies without a `massWell` (studies only) keep the study curve,
`wellAcceleration`, or the legacy `mass / distance² · 1000`.

In Derelicts mode every salvage body (derelict, piece, energy cell) takes the
same sun and planet pulls each substep, with the planet's contact distance its
surface alone (`planetPull` with radius 0). Only planets feel no gravity.

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
as `GRAVITY_TUNING`. Other areas add their own sections to the same file.

| Value        | Range                       | Meaning                                   |
| ------------ | --------------------------- | ----------------------------------------- |
| `falloff`    | `inverse-square`, `inverse` | the mass law's falloff                    |
| `cutoff`     | > 0, u/s²                   | the pull at which every body's reach ends |
| `sunMass`    | > 0                         | the play sun's mass                       |
| `planetMass` | > 0, by planet id           | each configured planet's mass             |

Masses are absolute and chosen from a pull at contact distance (body radius +
the reference ship's radius) relative to the reference ship's thrust: planets
about 1×, the sun about 2×, the cut-off about 10 %. The reference ship is the
Fighter's starter loadout; its thrust is its peak acceleration on the
instrument's B1. The relation is guarded by a test, not derived at load: changing
ship thrust or a body's size fails the guard and names the bodies to retune on
the [Gravity tuning](../../../lab/gravity-tuning/spec.md) bench.

The file holds the values in play; read it for them rather than copying them
here. `applyGravityTuning`, `tunedMassWell`, `planetMass` and `setStarMassWell`
(`simulation.ts`) apply the section; `Simulation` and the FX bench use them.

Still fixed in code: four substeps. `createStar` gives suns without a mass well
(studies) a reach of 9 × radius, and `getPlanetInfluenceRadius` keeps a reach
rule for planets without one.

### Engine taper

`updateShip` takes both `engineCutoff` and `engineSpeedScale`; when a cutoff is
given it is applied and `engineSpeedScale` is ignored. Play passes
`ENGINE_CUTOFF` (750, `packages/core/src/lib/effects/engine-plume.ts`), so the
1 / (1 + (v / 600)²) taper is never applied. Loadout ships, which is every ship
in play, receive no thrust input in `updateShip` at all; their thrust comes from
`applyBuildEngines` (`build-flight.ts`) with each part's own `limit`. So
`engineSpeedScale` affects no flight. It belongs to engine rules, not gravity.

### Rules version

Score documents carry the rules version `CHALLENGE` (`packages/mode-a/src/schemas/highscore.ts`,
currently `ion-1`), which also prefixes score document IDs. Changing the values or
rules in this spec changes trajectories for the same inputs, so scores from
before and after such a change are never compared.

`CHALLENGE` changes once per release, at release, and only when rules or tuning
differ from the previous release; editing tuning values never changes it. The
step belongs to the release procedure in `docs/development.md`.

## Contract

### Definition of Done

- [x] The mass law pulls `G × mass / d²` (or `G₂ × mass / d`) inside the reach and
  nothing at or beyond it; the pull at the reach equals the cut-off; a lower
  cut-off extends the reach without changing the pull inside; twice the mass
  pulls twice as hard (`MassWell.test.ts`).
- [x] The study curve is zero at and beyond reach and equals `strength / 2` at
  half reach (`WellCurve.test.ts`); planets with a study well are inert outside
  it and pull with their own curve (`Physics.test.ts`).
- [x] `updateShip`'s well can be escaped with thrust, on a fixture sun with the
  stock thrust path (`simulation.test.ts`); unpowered, a loadout ship coasts
  above the old speed cap with planets removed (same file).
- [x] The close-pass and too-deep scenarios below pass on a `Simulation` with the
  game sun (`sun.test.ts`).
- [x] The same replay gives the same trajectory twice under one rules version
  (`simulation.test.ts`, "reproduces validated replay exactly").
- [x] Every gravity value in play is read from the tuning file: the simulation's
  bodies equal those built from `GRAVITY_TUNING`, every configured planet has a
  mass, the sun's reach is where its pull meets the cut-off, and changing each
  value changes the bodies (`tuning.test.ts`).
- [x] Each planet pulls 0.75–1.5× and the sun 1.5–3× the reference ship's thrust
  at contact; the cut-off is 5–20 % of it (`game-gravity.test.ts`).
- [x] Planet contact bounces the ship with the shared `bounceOffSurface`
  (`MassWell.test.ts`; game planet contact unchanged by the extraction).

### Regression Guardrails

- One gravity function serves play, replay and the Lab.
- Gravity depends only on the ship's position and the bodies, never on its
  engines, speed or loadout.
- Play has no passive drag and no speed cap.
- A release whose gravity values or rules differ from the previous release
  changes `CHALLENGE`; nothing else changes it.
- The Gravity tuning bench changes no game value.

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

```

## Open questions

- Does `engineSpeedScale` move to the engine rules or get removed? It affects no
  flight today.
- The sun's contact and heat checks use (960, 540) instead of the sun's
  position; harmless while the sun is fixed there.
- Other sun types (O–M) have no mass in the tuning file; play uses only the G
  sun.
