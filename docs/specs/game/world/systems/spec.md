# Seeded Solar System

## Context

Survival, Derelicts and Gauntlet start in the same kind of seeded G-class solar
system. The run seed selects the yellow-family Sun size, mercurial planet radius
and planets' starting orbital phase. Keeping one system contract makes replay,
comparison and mode behavior consistent. Practice retains its fixed reference system.

## Architecture

- `packages/mode-a/src/lib/solar-system.ts` creates the default gameplay system.
- `packages/mode-a/src/lib/schemas/solar-system.ts` validates generator inputs.
- `packages/mode-a/src/lib/simulation.ts` chooses the generated system for
  Survival, Derelicts and Gauntlet, and the fixed reference system for Practice.
- `packages/core/src/lib/physics/planets.ts` supplies the fixed planet definitions
  used by the default gameplay system and Practice.
- The [star spec](../star/spec.md) owns the yellow-family size and field profile;
  the [planet spec](../planets/spec.md) owns planet physics and presentation.

## Contract

- Gameplay generation defaults to center `(960, 540)`; validated finite center
  overrides translate the star, orbit centers and planet positions together.
- The generator starts from `SURVIVAL_CONFIG.PLANETS` and replaces its innermost
  entry (`moon`) with exactly one mercurial mineral-rock planet. Its radius `R`
  is selected uniformly over 16–36u by a dedicated deterministic seed-derived
  stream. Both radius endpoints are valid placement inputs; an exclusive PRNG
  upper endpoint is allowed. Radius selection consumes no shared random state
  and changes no existing star, phase, encounter or arrival seed stream.
- The seed selects the yellow-family G star's surface radius `S` from 36–140u.
  Its appearance, gravity, collection and damage fields follow the
  [star contract](../star/spec.md).
- Placement uses the generated star's actual damage reach `H` and collection
  reach `C`, measured from its center. With clearance `m = 1u`, the permitted
  circular orbit interval is `[H + R + m, C − R − m]`. The chosen orbit radius is
  `D = clamp(258 × S / 70, H + R + m, C − R − m)`.
  The whole body remains at least 1u outside danger and at least 1u inside
  charging throughout its orbit: `D − R >= H + m` and `D + R <= C − m`.
  Gravity reach is not a substitute for collection reach.
- The permitted interval accommodates every radius 16–36u for every supported
  Sun radius 36–140u. If a profile has nonfinite fields or an empty permitted
  interval, generation fails explicitly and returns no system; it does not
  shrink, omit or unsafely place the mandatory planet.
- The mercurial body's mass and gravity-well mass both use the shared core-led
  family profile at its seeded radius. At 27u it matches Practice Mercury's 870
  mass and gravity reach; no separate generated moon mass applies.
- The mercurial planet travels at 4u/s with positive angular speed `4 / D`.
  Its retained identity, gravity and appearance follow the
  [planet contract](../planets/spec.md#mercurial-mineral-rock).
- A remaining stock planet is removed when
  `abs(other.orbitRadius − D) <= other.radius + R + 1u`.
  This compares swept circular body annuli for the full orbit, independent of
  starting phase. The mandatory mercurial body takes priority. Clear planets
  retain their configured properties and gravity tuning. Removed planets have
  no simulation, collision, gravity, appearance or HUD entries.
- The remaining count follows conflict removal, without replacement spawning.
  Exactly one body has the mercurial appearance; another retained planet may
  also lie inside charging. A retained orbit may lie inside the mercurial orbit.
- The seed shifts all retained planets' configured starting phases by
  `(seed mod 360) / 180 × π`. Orbits remain circular. Initial positions use the
  final orbit radii. Full-system outward HUD ordinals are assigned after removal
  and are contiguous from 1; source order breaks equal-radius ties.
- Survival, Derelicts and Gauntlet use this contract without an experimental
  setting. Equal seeds produce equal star profiles, mercurial radii, retained
  rosters, masses, motion and starting positions across all three modes.
- Practice keeps its fixed G7 star and named reference planets, including
  Mercury's 27u radius and 258u orbit, independent of the supplied run seed.
- Inputs are parsed with `SolarSystemGenerationSchema` before use: integer seed
  1–2147483647 and finite centers. Invalid inputs fail explicitly. Any new
  external data contract is defined in Zod before consumers change.

### Scenarios

```gherkin
Scenario: Reproducing a generated system
  Given two Survival, Derelicts or Gauntlet runs with the same seed
  When their systems are created
  Then their star profiles, mercurial radii, retained planets and positions match

Scenario: Sharing system generation across modes
  Given Survival, Derelicts and Gauntlet runs with the same seed
  When their systems are created
  Then their star profiles, mercurial radii, retained planets and positions match

Scenario: Largest body around the smallest Sun
  Given a generated Sun with radius 36u and a mercurial body with radius 36u
  When the orbit is selected from the actual damage and collection reaches
  Then the scaled 258u reference orbit is clamped into the permitted interval
  And the whole body has at least 1u clearance from both field boundaries

Scenario: A stock orbit conflicts with the mandatory planet
  Given a remaining stock planet whose swept body annulus is within 1u of the mercurial annulus
  When the system is generated
  Then that stock planet is removed and the mercurial planet remains
  And outward HUD ordinals are assigned from the retained system

Scenario: A profile cannot contain the planet
  Given the charging reach minus the danger reach is less than twice the body radius plus 2u
  When generation attempts placement
  Then generation fails explicitly without returning a system

Scenario: Invalid seed
  Given a seed outside the integer range 1–2147483647
  When generation is requested
  Then input validation rejects the request

Scenario: Practice keeps its reference system
  Given two Practice flights with different seeds
  When their systems are created
  Then both use the fixed G7 star and named reference planets
```
