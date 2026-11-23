---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-23T12:44:13+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-23"
---

# Gravity field

## Blueprint

### Context

Gravity gives open space terrain. Suns and planets change which routes are
worth taking, not just which spots to avoid. A close pass can bend a ship onto
a useful path, but a slower or deeper approach can turn that same well into a
trap. Consistent pull lets pilots learn when to use a well and when to give it
room.

### Architecture

[Core physics](../../../../../packages/core/src/lib/physics/Physics.ts) defines
mass wells and applies their pull. Positive mass sets the strength; positive
cutoff sets the reach. At distance `d` from the source centre, the unbounded
pull is `1000 × mass / d²` for inverse-square (the shipped law), or
`10 × mass / d` for inverse. The reach is where that formula equals the
cutoff. Actual pull is zero **at** the reach and beyond it; there is no fade.

[Gravity tuning](../../../../../packages/mode-a/src/lib/tuning.json) holds the
live values, validated by the
[gravity schema](../../../../../packages/mode-a/src/lib/schemas/gravity.ts).
The [star profile](../star/spec.md) supplies the Sun's well mass. Retained
non-family planets get well mass by identity; a missing entry is an error.
[Practice](../../test-flight/spec.md) can override those fixed planet masses.
The [system spec](../systems/spec.md) owns the roster and orbits, and
[Habitable](../planets/habitable/spec.md) owns its family mass law.

#### Mercurial family mass

[Mercurial gravity](../../../../../packages/mode-a/src/lib/mercurial-rock.ts)
uses one radius-based profile for generated Mercurials, Practice Mercury and
Planet Inspector specimens. For a valid radius `R` (16–36u), mass is
`M₀ × [f + (1 − f) × (R / R₀)²]`, using the tuning reference mass `M₀`,
reference radius `R₀` and core fraction `f`. Body and well use that same mass;
`moon` and `outer-mercurial` use the family rather than identity overrides.

### Constraints

- Star pull applies outside the star surface and inside its well. Planet pull
  applies outside body radius plus ship radius and inside its well. Both
  boundaries are exclusive. Derelicts salvage uses the same pull with zero
  radius for the planet check.
- Each eligible well pulls toward its centre. In free flight the contributions
  add as vectors at each physics substep. Planet orbits are prescribed, not
  changed by other wells.
- For a given position and contact radius, the gravity contribution is
  independent of velocity, ship mass and thrust. [Atmosphere and contact](../planets/spec.md)
  are separate effects; solar heat is governed by the [star spec](../star/spec.md).

## Contract

### Definition of Done

- A ship outside every well receives no gravity acceleration. Inside a well,
  its path responds to the inward pull and its existing velocity.
- A fast close pass can exit the Sun's well without contact; a ship released
  from rest inside that same well can fall into the Sun.

### Regression guardrails

- Lowering the cutoff extends reach without changing the pull at points that
  were already eligible. At a fixed eligible distance, doubling well mass
  doubles its pull.
- A Mercurial specimen at Practice Mercury's radius has the same mass, reach
  and planet-only pull under the same tuning and contact geometry.

### Scenarios

```gherkin
Scenario: Crossing the hard edge
  Given a ship clear of contact and all other gravity wells
  When gravity is sampled just inside, exactly at, and just outside a well's reach
  Then the inside sample pulls inward by the configured mass law
  And the other two samples add no acceleration

Scenario: Two fields overlap
  Given a ship outside contact distance and inside the wells of two bodies
  When gravity is applied for a physics substep
  Then the gravity contribution is the vector sum of their individual pulls

Scenario: A fast close pass bends and escapes
  Given the default Survival Sun alone and an unpowered ship outside its well
  And the ship approaches at 500u/s along a line offset 0.45 well reaches from the centre
  When it passes the Sun
  Then its path bends toward the Sun and leaves the well without contact

Scenario: A ship falls into the Sun
  Given the default Survival Sun alone and an unpowered ship at rest at 0.9 well reaches
  When the ship falls inward
  Then contact ends the run with death cause STAR
```
