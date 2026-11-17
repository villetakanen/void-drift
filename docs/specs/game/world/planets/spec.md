# Feature: Planet Entity

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context

Planets supply the "Terrain" of the void. Unlike Stars, they are persistent obstacles that provide cover and smaller gravity wells for slingshot maneuvers. They introduce variety to the arena layout.

**Achievement:** Orbiting rock planet with gravity well and elastic collision mechanics operational.

### Architecture

#### Planet Type System

| Type   | ID       | Color     | Description                           |
| ------ | -------- | --------- | ------------------------------------- |
| Rock   | `rock`   | `#8B7355` | Brown rocky surface, cratered terrain |
| Gas    | `gas`    | `#6B4C9A` | Purple gas giant, swirling atmosphere |
| Ocean  | `ocean`  | `#4A90C2` | Blue water world                      |
| Desert | `desert` | `#C4A35A` | Sandy tan, arid surface               |
| Ice    | `ice`    | `#A8D8E8` | Light blue frozen world               |

#### Data Model

```typescript
type PlanetType = "rock" | "gas" | "ocean" | "desert" | "ice";

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

#### Dynamic Spawning

The optional experimental `initializeRandomPlanets()` factory can generate 0-5
planets using the following parameter ranges:

| Parameter     | Range                     | Notes                     |
| ------------- | ------------------------- | ------------------------- |
| Count         | 0-5                       | Random per game session   |
| Orbit Radius  | 200-1000px                | Distance from star center |
| Planet Radius | 10-100px                  | Physical size             |
| Orbit Speed   | ±0.02-0.15 rad/s          | Sign determines direction |
| Type          | rock/gas/ocean/desert/ice | Random selection          |

**Non-Overlap Constraint:**
Planets cannot overlap at any point in their orbits. For two planets with radii `r1` and `r2`:
- Minimum orbit separation: `(r1 * 4) + (r2 * 4)`
- Star exclusion zone: orbit radius ≥ 200px

**Spawn Algorithm:**
1. Generate random planet count (0-5)
2. For each planet, generate random parameters
3. Validate orbit doesn't conflict with existing planets
4. Retry with different orbit if conflict detected (max 10 attempts)
5. Skip planet if no valid placement found

- **Physics:**
  - Gravity: [gravity-field.md](../gravity-field/spec.md#bodies-in-play).
  - Collision: Elastic bounce (restitution 0.8).
  - Motion: Planets orbit the central star.
- **Rendering:** Flat Vector Style (Solid Color) in `packages/core/src/lib/assets/planet.ts`.
  - Visualize orbit path with faint line.
  - Draw planet as simple circle (no gradients/textures to match aesthetic).

### Anti-Patterns

- **Do NOT** use expensive noise algorithms (Perlin) every frame. Pre-render to an offscreen canvas or use simple geometric rendering (craters = circles).
- **Do NOT** make planets overlap the Star or Spawn points.

## Contract

### Names

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

### World HUD

Every planet in every mode has the same World HUD: orbit, gravity boundary and
upright name. Its shared `world-hud` pass runs once for the full system before
any planet body is drawn, independent of material readiness. Strokes are 1 CSS
px and text is 14 CSS px at every zoom. The
[render contract](../../render/spec.md#world-bodies) defines pass order and
screen sizing. Planets have no separate decorative ring system. Collision and
gravity use the planet body radius and mass.

### Mercurial mineral-rock size

The airless mineral-rock type explored in the Mercury study uses a radius of
16–36 world units. This range belongs to that type, not every rock planet.
Practice's innermost stock rock (`id: moon`, the Mercury application) has radius
27u, giving a diameter of 54u. Its centre-to-centre orbital distance is 258u; the size and placement selection
originally retained its existing mass. Practice now uses mass 870 (3/5 of the
previous 1450), from `gravity.practicePlanetMass.moon`; other modes retain 1450. Its whole surface stays outside the Sun's danger reach and at least
part of its surface lies inside the charging reach. In Practice, this body uses
the accepted mineral surface, independent 31.3-second spin and Sun-facing LFX.

### Practice Venus

Practice replaces the stock middle gas planet with one named `venus`, before
applying gravity tuning. Mercury remains, and The Cradle replaces the outer
rock; other modes retain all three stock planets. Planet identities remain strings and gravity masses are keyed by identity;
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

### Practice Cradle

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

### Atmosphere

A planet may carry an atmosphere: a shell of air from its surface out to a
depth in world units, moving with the planet's orbit. The Cradle is the only
planet with one. Venus's arc is drawing only and is not an atmosphere.

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
  an atmosphere, in every mode; only Practice has such a planet.
- The simulation exposes each ship's air sample, validated by Zod: density,
  the direction to the planet and the ship's velocity relative to the planet.
  Drawing reads it and never changes it.

A planet without a surface map is drawn as a flat disc. The flat-vector
descriptions elsewhere in this document describe that disc, not Mercury or Venus.
All planets are drawn under the render contract's
[world bodies](../../render/spec.md#world-bodies) rules.

### Definition of Done

- Planet renders with a distinct visual style (flat vector, solid color) distinguishable from the Star.
- Physics engine applies local gravity near the planet (inverse square law).
- Ships collide/bounce off the planet surface (elastic collision with restitution 0.8).
- Planet orbits around a center point with configurable speed.
- Orbit path visualized with faint line.

### Regression Guardrails

- **Visibility:** Planets must be clearly distinct from the background and the Star.
- **Physics:** Gravity wells of multiple bodies (Star + Planet) must sum logically.
- **Air:** Outside every atmosphere, drag leaves a ship's motion unchanged.
  Inside, drag never turns the ship's velocity relative to the planet, and
  deeper air slows it more over equal simulated time.

### Scenarios

**Scenario: Slingshot** ✅
- Given a Planet exists in the arena
- When I fly past it tangentially
- Then my trajectory curves slightly due to its gravity
- But I do not get sucked in immediately (unless very close)
- **Status:** VERIFIED - Gravity well affects ship trajectory

**Scenario: Collision** ✅
- Given I fly directly into the Planet
- When impact happens
- Then my ship bounces back with elastic collision
- And velocity is damped by restitution factor (0.8)
- **Status:** VERIFIED - Collision detection and bounce functional

**Scenario: Skimming The Cradle's air**
- Given a ship passing The Cradle with its collision circle inside the air
- When the simulation advances
- Then its speed relative to the planet falls and its direction relative to
  the planet holds
- And the heat cue shows while it is in the air and fades after it leaves
- And its hull is unchanged

**Scenario: Passing outside the air**
- Given a ship passing The Cradle with its collision circle outside the air
- When the simulation advances
- Then no drag applies and no heat cue shows

## Current Implementation

### Planet Data Structure

```typescript
interface Planet {
  pos: Vec2; // Current position (updated each frame)
  orbitCenter: Vec2; // Center of orbit (usually star position)
  orbitRadius: number; // Distance from center (700px)
  orbitSpeed: number; // Angular velocity (0.05 rad/s - very slow)
  orbitAngle: number; // Current angle in radians
  radius: number; // Physical/collision radius (30px)
  mass: number; // Gravitational mass (400)
  color: string; // Visual color (Slate Blue)
}
```

### Rendering

- **Style:** Flat vector aesthetic (no gradients or textures)
- **Color:** Slate Blue to match arcade vector art style
- **Orbit Path:** Faint white line (`rgba(255,255,255,0.05)`) shows orbital trajectory
- **Size:** Relatively small (20px radius) but large gravity influence
- **Location:** `packages/core/src/lib/assets/planet.ts` (rendering), `packages/core/src/lib/physics/Physics.ts` (physics)

### Physics

#### Orbital Mechanics

- **Update Formula:**

  ```typescript
  orbitAngle += orbitSpeed * dt
  pos.x = orbitCenter.x + Math.cos(orbitAngle) * orbitRadius
  pos.y = orbitCenter.y + Math.sin(orbitAngle) * orbitRadius
  ```
- **Speed:** Very slow (0.05 rad/s) acts as semi-static hazard
- **Radius:** Orbits at 700px from star center

#### Gravity

Specified in [gravity-field.md](../gravity-field/spec.md#bodies-in-play).

#### Collision

- **Detection:** Distance check `|ship.pos - planet.pos| < (ship.radius + planet.radius)`
- **Response:** Elastic bounce with restitution 0.8
- **Formula:** `velocity_new = velocity_old.reflect(normal) * restitution`
- **Normal:** Calculated as `(ship.pos - planet.pos).normalize()`

### Configuration

- **Production:** `initializePlanets()` in `packages/core/src/lib/physics/planets.ts`
  creates the three configured planets from `SURVIVAL_CONFIG.PLANETS`.
- **Experiment:** `initializeRandomPlanets()` can create 0-5 planets with random
  count, type, orbit, size and speed.

## Performance Characteristics

- **Render Time:** ~0.15ms per planet (circle + orbit line)
- **Physics Time:** ~0.2ms per planet (gravity + collision check)
- **Memory:** Zero allocations per frame (reuses Vec2 instances)

## Visual Properties

- **Color:** Slate Blue (#6A7B8C) for rock planet aesthetic
- **Orbit Visualization:** Subtle white line at 5% opacity
- **Scale:** Small relative to arena (1.67% of arena radius)
- **Contrast:** Easily distinguishable from star (no glow/pulse)

## Known Limitations

- **Ship Damage:** No health system (collision bounces but doesn't damage)

## Future Enhancements

- Add planet rotation animation
- Add surface detail (procedural craters, terrain)
- Add ship damage on high-velocity impacts
- Add atmospheric drag near large planets

---

**Planet System Status: OPERATIONAL** 🪐  
**Dynamic Spawning:** 0-5 planets per game  
**Types:** rock, gas, ocean, desert, ice


### Rock shadow inspection

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
