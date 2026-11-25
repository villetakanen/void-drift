---

title: "Spec: Standard Sun"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T19:21:23+02:00"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T19:21:23+02:00" }]

---

# Standard Sun

## Blueprint

### Context

A steady G Sun offers collectable energy inside its gravitational well. The
pilot trades income against the pull, exposure and terminal contact. Other
stellar families and further Sun effect design are deferred. The accepted
[study](../../../../../apps/web/src/pages/lab/studies/suns-2026-11-07.astro)
retains experiments; the [closure](https://github.com/villetakanen/void-drift/blob/fdc1772fbefef0394a386086ffd0f4eeb2f71b3d/docs/loop-evidence/2026-11-07-suns-closure.md)
records acceptance, not production validation.

#### Yellow-family gameplay profile

The [stellar-characters study](../../../../../apps/web/src/pages/lab/studies/stellar-characters-2026-11-11.astro#03)
closed accepted on 11 November 2026. Its final yellow-family reference has
surface radii 36–140 u, reference radius 70, size-related warm colour, a World
body, persistent FX corona and outward rings on LFX. With `s = radius / 70`,
hazard reach is `100s`, collection reach is `R₀s` and gravity reach is
`R₀s^1.45`, where `R₀` is the existing reference gravity reach (about 324 u).
These are centre-distance boundaries; enlarged surfaces do not move them
outward. The current inverse-square law gives mass `5250s^2.9`.

Survival, Derelicts and Gauntlet select the same continuous deterministic
surface radius in 36–140 u from each run seed and apply the family appearance,
gravity, collection and damage fields described above. The selected field
profiles remain gameplay tuning, not claims of balance. The shared
[DS game field backdrop](../../../factory/design-system/game-field-backdrop/spec.md)
generates a separate system through the same
[seeded system contract](../systems/spec.md), so its Sun uses the same radius
and appearance rules without being the Sun or state of any active game.
Practice uses the G7 reference profile at
a fixed 70 u surface radius and labels it `G7 Sun`: a star is named by its type,
followed by its name if it has one. Low-yield stars and other stellar natures
are outside this contract.

The production contract below records the legacy Sun profile for consumers that
retain it. Practice uses the same reference fields and radius as G7, with
resource protection. The seeded yellow-family profile used by Survival,
Derelicts and Gauntlet is the default gameplay profile.

Survival, Derelicts and Gauntlet place the selected `G4`–`G14` denomination just above
and to the right of the star surface in the World HUD. The integer is the
surface radius in tens of world units, rounded to the nearest class; radius 70
is G7 and radius 140 is G14. The label uses the World HUD's Android green and
remains screen-readable as the camera zooms. Practice shows `G7 Sun` in that
position.

World HUD identity stores a star's optional name separately from its
denomination. `StarWorldHudIdentitySchema` validates these optional nonblank
fields. A denomination is initialized from the star type and may be made more
specific by the selected family profile. Practice stores name `Sun` and
denomination `G7`, and displays `G7 Sun`. Planet fallback names use the stored
star name when present, otherwise its denomination or type; they never parse a
display label.

### Architecture

- `SUN_CONFIG.G` supplies the legacy radius-35 body and artwork. Practice applies
  the fixed G7 profile; Survival, Derelicts and Gauntlet apply the seed-selected
  yellow-family profile. The shared [DS game field backdrop](../../../factory/design-system/game-field-backdrop/spec.md)
  uses a separate system from the same seeded generator and profile rules.
- `packages/core/src/lib/solar.ts` owns centre-distance field profiles.
  `EnergyFieldSchema` validates independent reach, shoulder, peak and outer
  fraction. `solarField` uses a star-specific collection profile when present;
  otherwise it retains the legacy gravity-reach behavior.
- `solarCollectionRate` supplies both stock `updatePower` and assembled
  `solarCharge`. Every ship has one inherent collector-equivalent; each fitted
  solar collector adds one. No fitting, unlock or slot is needed for the baseline.
- `solarDamageRate` supplies `updateHull`. A star-specific damage profile
  overrides the legacy Sun profile when present. Terminal contact and ship
  collision geometry remain unchanged.
- `drawSunFields` is the shared world-anchored HUD renderer. The production
  `FlightDeck` and Suns Lab live Wasp reference consume simulation effect rates.
  The historical `SunHudPreview` forces comparison states and is not live play.
- [Gravity](../gravity-field/spec.md) retains its force, mass, reach and cutoff.
  There is no new gravity or friction tuning.

### Constraints

- Star-field distances are measured from the star's centre in world units.
- Enlarged surfaces leave the generated centre-distance field boundaries unchanged.
- Collection and damage changes follow the selected family profile; they do not change gravity or collision geometry.

## Contract

### Definition of Done

The standard Sun keeps the following rates and boundaries:

| Quantity                          | Through radius 55 | Beyond the shoulder                 | Outside reach |
| --------------------------------- | ----------------- | ----------------------------------- | ------------- |
| Collection / collector-equivalent | 7.5 E/s           | Linear to 0.75 E/s at gravity reach | Zero          |
| Exposure                          | 1.5 hull/s        | Linear to zero at radius 100        | Zero          |

The shoulder extends 20 u beyond the radius-35 surface. The exact collection
boundary includes its 0.75 E/s edge; gravity retains its existing exclusive cutoff.
Capacity saturation wastes supply. Collection is gross incoming energy, not net
battery gain. Stored energy and depleted propulsion retain production feedback.
Life support is 0.8 E/s; Light ion is 1.75 E/s per fully firing physical engine.
Other engine-family draw, thrust, handling and collisions remain unchanged.

#### HUD

- Gravity: dim Android green, dashed 5/5 CSS px.
- Solar: dim solid Android green; full brightness and 3.3% green fill while
  actual collection is positive, including at capacity and during net drain.
- Hazard: dotted 1/4 CSS px, round caps, amber at 60% opacity while inactive;
  red with 11% red fill when Sun damage is actually applied.
- Inactive green opacity is 35%. Every stroke is 1 CSS px at every zoom, stage
  scale and display density. Dash dimensions also remain in screen space.
- Coincident visible outer boundaries draw solar 2 CSS px inward. Neither
  physical field changes reach. Artwork and decorative pulses are separate.
- The shared HUD painter accepts optional independent hazard and gravity radii
  for Lab proposals; omitted overrides preserve the standard Sun geometry.
- Practice retains its resource protection: it cannot claim applied hull damage.

### Regression guardrails

- Collection and damage retain the existing gravity, collision and ship handling rules.
- Decorative artwork never changes the field radii or the effect rates.
- The DS game field backdrop uses the same seeded star profile in a separate generated system.

### Scenarios

```gherkin
Scenario: Apply the standard Sun profile
  Given a generated yellow-family Sun and a ship collecting energy or taking exposure
  When the ship is at the surface, shoulder, exact field edge or beyond the field
  Then collection and exposure follow the selected profile
  And gravity and collision behavior retain their existing rules

Scenario: Match the Sun field HUD to live effects
  Given the shared Sun field HUD at any camera scale or display density
  When collection or damage becomes active
  Then the field strokes and fills show the corresponding live state
  And the display geometry remains screen-readable

Scenario: Keep the decorative Sun separate from a run
  Given an active run and the shared DS game field backdrop
  When the backdrop presents a generated Sun
  Then it follows the same seeded radius and appearance rules
  And the active run's Sun, fields and simulation remain unchanged
```
