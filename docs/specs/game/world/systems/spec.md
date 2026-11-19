---
title: "Spec: Seeded Solar System"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:13:02+02:00"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T21:04:09+02:00" }, { by: "codex/gpt-6", at: "2026-11-19T21:14:06+02:00" }]
---

# Seeded Solar System

## Blueprint

### Context

Survival, Derelicts and Gauntlet start in the same kind of seeded G-class solar
system. The run seed selects the yellow-family Sun size, mercurial planet radius
and planets' starting orbital phase. Keeping one system contract makes replay,
comparison and mode behavior consistent. Practice retains its fixed reference system.

### Architecture

- `packages/mode-a/src/lib/solar-system.ts` creates the default gameplay system.
- `packages/mode-a/src/lib/schemas/solar-system.ts` validates generator inputs.
- `packages/mode-a/src/lib/simulation.ts` chooses the generated system for
  Survival, Derelicts and Gauntlet, and the fixed reference system for Practice.
- `packages/core/src/lib/physics/planets.ts` supplies the fixed planet definitions
  used by the default gameplay system and Practice.
- The [star spec](../star/spec.md) owns the yellow-family size and field profile;
  the [planet spec](../planets/spec.md) owns planet physics and presentation.

### Constraints

- Generation parses finite inputs and keeps mandatory worlds in their safe regions.

## Contract

### Definition of Done

- Equal seeds reproduce the full generated roster across generated modes.

### Regression guardrails

- Practice keeps its fixed reference roster.


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
- Generation adds a distinct `outer-mercurial` body when the Sun can contain the
  two complete gravity wells and both bodies remain in its safe fields. Its
  radius is selected from an independent deterministic stream,
  `mercurialRadius(seed XOR 0x4f1bbcdc)`, and its body type is
  `outer-mercurial`. Let `G1` and `G2` be the inner and outer planet gravity
  reaches, `R1` and `R2` their radii, `H` the Sun's damage reach, `C` its
  collection reach, and `I` its gravity reach. The safe radial separation is
  `d = max(R1 + G2, R2 + G1) + 1`. The pair is eligible when
  `d < G1 + G2`, `D1 = H + R1 + 1`, `D2 = D1 + d`,
  `D1 + G1 <= I`, `D2 + G2 <= I`, and `D2 + R2 + 1 <= C`. This keeps each
  body outside the other's gravity field, lets the fields intersect, and keeps
  both complete wells inside the Sun's gravity sphere. When any condition
  fails, generation preserves the existing inner-body placement and adds the
  second Mercurial outside Habitable as described below.
- When the pair is eligible, the inner body moves to `D1` and the outer body
  uses `D2`. Both travel at 4u/s and receive the same seeded starting phase.
  Both mandatory bodies take priority during swept-orbit conflict removal; a
  stock planet is removed if it conflicts with either Mercurial body.
- The mercurial planet travels at 4u/s with positive angular speed `4 / D`.
  Its retained identity, gravity and appearance follow the
  [planet contract](../planets/spec.md#mercurial-mineral-rock).
- After the Mercurial roster, generation replaces stock `gas` with exactly one
  [Habitable world](../planets/habitable/spec.md). Its complete atmosphere stays
  outside charging and its full-system ordinal is 2 with one Mercurial or 3 with
  two. Its dedicated seed streams leave existing Mercurial/star choices intact.
- When only one Mercurial fits inside charging, generation adds the distinct
  `outer-mercurial` beyond Habitable as the outermost planet, at ordinal 3.
  It keeps the same independently seeded radius, shared mass profile and 4u/s
  travel speed used for the inner-pair candidate. With Habitable gravity reach
  `GH` and outer Mercurial reach `G2`, its orbit is
  `D3 = DH + GH + G2 − 0.10 × min(GH, G2)`. At closest approach, overlap along
  the line of centers is 10% of the smaller field radius. Circular orbits and
  independent angular speeds make this a closest-approach overlap, not a
  permanent intersection. Its starting angle equals Habitable's before the
  shared seed phase is applied. Its full body stays outside charging, clear of
  Habitable's atmosphere and inside the 1200u warp boundary. Impossible placement
  fails explicitly. Stock conflict removal includes this mandatory body.
- Other stock planets survive only outward of Habitable with swept paths clear
  of every mandatory body and Habitable's atmosphere, with 1u clearance.
- The seed shifts all retained planets' configured starting phases by
  `(seed mod 360) / 180 × π`. Orbits remain circular. Initial positions use the
  final orbit radii. Full-system outward HUD ordinals are assigned after removal
  and are contiguous from 1; source order breaks equal-radius ties.
- Survival, Derelicts and Gauntlet use this contract without an experimental
  setting. Equal seeds produce equal star profiles, mercurial radii, retained
  rosters, masses, motion and starting positions across all three modes. The same seed independently selects a repeatable [distant sky](../../render/flight-sky/spec.md).
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
  And their distant sky has the same dust contours and placement at the same camera pose

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

Scenario: The Sun fits two Mercurial gravity wells
  Given both complete Mercurial wells fit inside the Sun's gravity sphere
  And both bodies remain in the Sun's safe fields
  When the system is generated
  Then it contains an inner Mercurial and a distinct outer-mercurial body
  And the planet bodies remain outside each other's gravity fields
  And the gravity fields intersect

Scenario: The Sun cannot fit the inner pair
  Given the Sun cannot contain both complete wells and bodies in its safe fields
  When the system is generated
  Then the original inner Mercurial placement is preserved
  And Habitable remains the second planet
  And a second Mercurial becomes the outermost planet at ordinal 3 outside charging
  And its field overlaps Habitable's by 10% of the smaller reach at closest approach
  And it begins at the same orbital angle as Habitable
  And its body clears Habitable's atmosphere and remains inside the warp boundary

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
