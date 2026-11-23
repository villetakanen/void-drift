---
title: "Spec: Feature: Planet Entity"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:13:02+02:00"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T21:04:09+02:00" }, { by: "codex/gpt-6", at: "2026-11-19T21:14:06+02:00" }]
---

# Feature: Planet Entity

## Blueprint

### Context

Planets supply the "Terrain" of the void. Unlike Stars, they are persistent obstacles that provide cover and smaller gravity wells for slingshot maneuvers. They introduce variety to the arena layout.

### Architecture

#### Planet Type System

| Type            | ID                | Color     | Description                           |
| --------------- | ----------------- | --------- | ------------------------------------- |
| Rock            | `rock`            | `#8B7355` | Brown rocky surface, cratered terrain |
| Gas             | `gas`             | `#6B4C9A` | Purple gas giant, swirling atmosphere |
| Ocean           | `ocean`           | `#4A90C2` | Blue water world                      |
| Desert          | `desert`          | `#C4A35A` | Sandy tan, arid surface               |
| Ice             | `ice`             | `#A8D8E8` | Light blue frozen world               |
| Outer Mercurial | `outer-mercurial` | `#77736C` | Seeded outer mineral-rock family      |

#### Data Model

```typescript
type PlanetType =
  | "rock"
  | "gas"
  | "ocean"
  | "desert"
  | "ice"
  | "outer-mercurial"
  | "habitable";

interface Planet {
  pos: Vec2;
  orbitCenter: Vec2;
  orbitRadius: number; // Distance from center (200-1000px)
  orbitSpeed: number; // Radians per second
  orbitAngle: number; // Current angle
  radius: number; // Planet size (10-100px)
  mass: number;
  color: string;
  type: PlanetType; // Visual type category
}
```

#### Physics and rendering

- **Physics:**
  - Gravity: [gravity field](../gravity-field/spec.md).
  - Collision: Elastic bounce (restitution 0.8).
  - Motion: Planets orbit the central star.
- **Rendering:** Prepared cylindrical maps, sphere projection and shared light follow
  the render contract; unprepared materials use the flat-disc fallback.

#### Anti-Patterns

- **Do NOT** use expensive noise algorithms (Perlin) every frame. Pre-render to an offscreen canvas or use simple geometric rendering (craters = circles).
- **Do NOT** make planets overlap the Star or Spawn points.

### Constraints

- Planet drawing follows the shared render model and uses prepared surface maps.
- Atmosphere and gravity use the production physics for the selected family.

## Contract

#### Names

A planet may carry an optional display name and a positive `systemPosition`.
The shared `PlanetWorldHudIdentitySchema` validates this HUD identity. The full
system assigns positions by increasing orbital radius, with existing source
order breaking ties, after mode-specific orbit setup and before any consumer
filters the planet list. Named planets count in that position; filtering an
inspector view never renumbers the remaining planets.

A planet with a display name shows that name without a number. An unnamed planet
is named after its star, a full stop, and its system position. The star name is
used when present; otherwise the star's denomination or type is used. Star
identity is defined in the [star contract](../star/spec.md).

A G7 star named Sun with four planets, the third unnamed, reads: Mercury, Venus,
Sun.3, Mars. The first planet of an unnamed G11 star is G11.1. Star names are
defined in the [star contract](../star/spec.md).

#### World HUD

Every planet in every mode has the same World HUD: orbit, gravity boundary and
upright name. Its shared `world-hud` pass runs once for the full system before
any planet body is drawn, independent of material readiness. Strokes are 1 CSS
px and text is 14 CSS px at every zoom. The
[render contract](../../render/spec.md#world-bodies) defines pass order and
screen sizing. Planets have no separate decorative ring system. Collision and
gravity use the planet body radius and mass.

#### Mercurial mineral-rock

This airless mineral-rock family uses radii 16–36u. The range belongs to this
family, not every rock planet. It has no atmosphere or decorative ring.

Survival, Derelicts and Gauntlet replace the innermost stock entry with a
generated inner Mercurial, retaining internal identity `moon`. When the Sun can
contain a second complete gravity well in its safe fields, generation places
one distinct `outer-mercurial` body there. Otherwise that body follows Habitable
as the outermost planet at ordinal 3, outside charging. Its seeded radius, placement, gravity-field
overlap and conflict-removal priority follow the
[system contract](../systems/spec.md). Both bodies use the shared Mercurial
mass profile and normal star/ordinal HUD names. The outer body uses the
`outer-mercurial` body type and a complete highlands texture generated from the
Mercury study prompt; the inner
body retains its accepted mineral material. The inner body's gravity follows
the shared mercurial profile in the
[gravity contract](../gravity-field/spec.md#mercurial-family-mass):
`mass(R) = 870 × [0.75 + 0.25 × (R / 27)²]`. The fixed core supplies 75% of
reference mass; only the remaining quarter scales with squared radius. At
16u, 27u and 36u the masses are approximately 728.88, 870 and 1039.17.
The body mass and gravity-well mass agree, and gravity reach follows that mass
through the shared cutoff law.

Practice's Mercury also uses `moon`, with display name Mercury, fixed radius
27u (54u diameter), fixed orbit 258u and travel speed 4u/s. The same family
profile gives it mass 870, with identical planet pull and reach to any 27u
mercurial specimen; it has no separate moon-mass override. Its whole body remains
outside the fixed G7 Sun's danger field and inside charging. The generated
radius range and placement algorithm do not change this reference system.

Practice Mercury and the generated inner Mercurial use the accepted mineral surface in
`apps/web/public/planets/mercury-ground.png`, independent 31.3-second surface
rotation driven by simulation ticks, and current shared Sun-facing LFX light.
Rendering uses the shared production World/LFX body passes, prepared cached
material and camera culling, following the [render contract](../../render/spec.md).
Pause holds rotation; the same tick gives the same picture. Material failure
uses a stock-disc fallback while retaining the body's physics and World HUD.
Other rock planets retain their own appearance. The normal orbit, moving gravity
boundary and upright name are present independently of material readiness.

The generated outer Mercurial uses the complete 2:1 longitude-latitude map in
`apps/web/public/planets/outer-mercurial-highlands.png`, generated with ImageGen
from the Mercury study's Ancient Highlands prompt. Its map fills the full
surface rather than reprojecting the study's single visible globe. It uses the
shared spherical surface, body painter, light pass, 31.3-second turn and
fallback behavior. This map does not replace the accepted inner Mercury
surface.

#### Practice Venus

Practice replaces the stock middle gas planet with one named `venus`, before
applying gravity tuning. Mercury remains, and The Cradle replaces the outer
rock. Other modes use the generated mercurial replacement and conflict-filtered
roster from the [system contract](../systems/spec.md). Planet identities remain
strings and gravity masses are keyed by identity;
optional `practicePlanetMass` overrides apply only in Practice.

- Radius: `27 × (1 + (12104 / 4879 − 1) / 3)` ≈ 40.327526u.
- Orbit: `258 × 108.2 / 57.9` ≈ 482.134715u, circular, centre to centre.
- Travel speed: `4 × 35 / 47.4` ≈ 2.953586u/s, positive angular speed
  equal to travel speed / orbit radius; initial phase inherited from the replaced
  middle planet and Practice's fixed phase seed.
- Mass: independently stored `gravity.planetMass.venus = 2844.850580940663`.
  Recalculated on 13 November at the designer's request using
  `870 × (accepted radius / 27)² × (1 + (8.87 / 3.70 − 1) / 3)`.
  Later radius or Mercury tuning changes must not automatically recompute it.
- Material: deterministic 02.3 B broad cloud regions, 02.6 B amber
  RGB (246, 195, 113), 60-second right-to-left turn driven by simulation ticks.
  `cloudAtlas`, `SphericalSurface` and `CloudBodyPainter` in core own the reusable
  appearance; atlas generation is cached, with no per-frame noise generation.
- Presentation: cloud body and provisional atmospheric arc on World; shared
  Sun-facing hard-light mask on LFX. Arc width is 6.5% of body radius, minimum
  0.65 stage pixels, with the accepted angular extent. Orbit, gravity boundary
  and upright Venus label use shared World HUD primitives. All follow the
  same planet; pause freezes cloud and orbital time. A failed material setup
  uses the amber stock-disc fallback and retains the Venus HUD and physics.
- Contact, summed gravity and hard cut-off use the existing rules; the visual
  atmosphere adds no collision, drag or damage region. Whole circular orbits
  remain separated by more than their bodies' radii, and the fixed spawn is clear.

#### Practice Cradle

Practice replaces the stock outer rock (`id: rock`) with one named `cradle`,
display name The Cradle, before applying gravity tuning. Its numbers follow
Venus's derivation from Earth's ratios to Mercury:

- Radius: `27 × (1 + (6371 / 2440 − 1) / 3)` ≈ 41.499590u.
- Orbit: `258 × 149.6 / 57.9` ≈ 666.611399u, circular, centre to centre.
- Travel speed: `4 × 29.78 / 47.4` ≈ 2.513080u/s, positive angular speed equal
  to travel speed / orbit radius; initial phase inherited from the replaced
  outer planet and Practice's fixed phase seed.
- Mass: independently stored `gravity.practicePlanetMass.cradle`,
  `870 × (radius / 27)² × (1 + (9.81 / 3.70 − 1) / 3)` ≈ 3186.671024.
  Later radius or Mercury changes do not recompute it.
- Ground: the post-war Earth map, turning every 93.9 seconds.
- Clouds: the Cirrus map, white, its density giving opacity: opaque cores,
  soft edges and clear openings onto the ground. It turns every 46.95 seconds,
  twice the ground's speed, and its radius is the body radius plus 2/5 of the
  air depth.
- Air: an [atmosphere](#atmosphere) with a depth within 4–22u, stored as
  tuning.
- Haze: a soft radial gradient on World from the ground out to the air's edge,
  over the clouds.
- Rim: a fixed blue rim at the air's edge on the day side, two narrow arcs
  peaking 20° from each tangent toward the star, drawn on World with native
  arcs. Its colour does not follow the star's.
- Light and dark: the shared body-light stamp at production values, covering
  the cloud surface.
- Both maps are prepared at load from production assets, with their provenance
  kept beside them. A failed material setup draws a blue stock disc and keeps
  the HUD, air and physics.

#### Atmosphere

A planet may carry an atmosphere: a shell of air from its surface out to a
depth in world units, moving with the planet's orbit. The Cradle and generated Habitable worlds carry air. Venus's arc is drawing only and is not an atmosphere.

- **Contact.** A ship is in the air when its collision circle overlaps the
  shell. Density is 0 at the outer edge and rises linearly with the ship's
  penetration to 1 at the surface.
- **Drag.** Each simulation step multiplies the ship's velocity relative to
  the planet by `exp(−k × density × dt)`. Drag slows the ship and never changes
  the direction of that relative velocity. `k` is stored as tuning.
- **Heat cue.** While a ship is in the air it shows the
  [atmospheric heat cue](../../render/fx.md#atmospheric-heat).
- **No damage.** The air does no hull damage and keeps no temperature.
- **Every ship, every mode.** Drag applies to every ship near any planet with
  an atmosphere, in every mode; Practice and generated systems contain such planets.
- A ship's air sample holds density, the direction to the planet and the
  ship's velocity relative to the planet's air, in the shape `AirSampleSchema`
  defines in `packages/core/src/lib/physics/atmosphere.ts`. It is computed
  from simulation state, not parsed from outside input; the simulation exposes
  the player's sample each tick, and any ship's can be computed the same way.
  Drawing reads it and never changes it.

A planet without a surface map is drawn as a flat disc. The flat-vector
descriptions elsewhere in this document describe that disc, not Mercury or Venus.
All planets are drawn under the render contract's
[world bodies](../../render/spec.md#world-bodies) rules.

### Definition of Done

- Planets render distinguishable surfaces, shared light and atmosphere where applicable.
- Physics engine applies local gravity near the planet (inverse square law).
- Ships collide/bounce off the planet surface (elastic collision with restitution 0.8).
- Planet orbits around a center point with configurable speed.
- Orbit path visualized with faint line.

### Regression guardrails

- **Visibility:** Planets must be clearly distinct from the background and the Star.
- **Physics:** Gravity wells of multiple bodies (Star + Planet) must sum logically.
- **Air:** Outside every atmosphere, drag leaves a ship's motion unchanged.
  Inside, drag never turns the ship's velocity relative to the planet, and
  deeper air slows it more over equal simulated time.

### Scenarios

```gherkin
Scenario: Planet encounter
  Given a ship passing a planet tangentially inside its gravity field
  When the simulation advances
  Then planetary gravity curves its trajectory

Scenario: Planet collision
  Given a ship contacting a planet surface
  When collision resolves
  Then it bounces with restitution 0.8 and takes the configured contact damage

Scenario: Atmospheric pass
  Given a ship passing inside a planet's air without surface contact
  When simulation advances
  Then drag slows its velocity relative to the planet without turning it
  And entry heat shows without atmospheric hull damage
  And outside air neither atmospheric drag nor entry heat applies
```

#### Rock shadow inspection

The shared rock painter accepts incoming-light and shadow-intensity multipliers
from 0 to 2. Both default to 1.35; incident-light temperature defaults to the
neutral-reference 5800 K. These are shared production defaults. Incoming
intensity scales only the hard-light stamp's bright values above neutral 0.5;
shadow intensity scales only its darkening below 0.5. The Planet Inspector
exposes all three parameters for visual inspection; changing them there is local
to the instrument and does not select other production tuning.
Bodies using the same prepared light, shadow and temperature tuple share one
stamp, turned toward the star with the Canvas transform. Preparation happens
before drawing. Storage holds the production defaults and stamps for actively
prepared tuples; releasing the last user releases that custom stamp. The
shadow-intensity capability supports the rock-atmospheres study's 02.2
comparison.

#### Habitable archetype

The [Habitable contract](habitable/spec.md) owns generated Earth-size worlds,
their material choices, atmosphere and Inspector family specimen.
