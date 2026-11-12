# Standard Sun

## Intent

A steady G Sun offers collectable energy inside its gravitational well. The
pilot trades income against the pull, exposure and terminal contact. Other
stellar families and further Sun effect design are deferred. The accepted
[study](../../../../../apps/web/src/pages/lab/studies/suns-2026-11-07.astro)
retains experiments; the [closure](../../../../loop-evidence/2026-11-07-suns-closure.md)
records acceptance, not production validation.

### Yellow-family gameplay trial — Derelicts and Gauntlet

The [stellar-characters study](../../../../../apps/web/src/pages/lab/studies/stellar-characters-2026-11-11.astro#03)
closed accepted on 11 November 2026. Its final yellow-family reference has
surface radii 36–140 u, reference radius 70, size-related warm colour, a World
body, persistent FX corona and outward rings on LFX. With `s = radius / 70`,
hazard reach is `100s`, collection reach is `R₀s` and gravity reach is
`R₀s^1.45`, where `R₀` is the existing reference gravity reach (about 324 u).
These are centre-distance boundaries; enlarged surfaces do not move them
outward. The current inverse-square law gives mass `5250s^2.9`.

The accepted target modes are Derelicts and Gauntlet. Both now select the same
continuous deterministic surface radius in 36–140 u from each run seed and
apply the family appearance, gravity, collection and damage fields described
above. This is an initial playable trial; the selected field profiles are
hypotheses for play, not claims of balance. The title screen separately uses a
cosmetic sample across the same surface range through its independent landing
scene. Practice uses the G7 reference profile at a fixed 70 u surface radius
and labels it `G7, Sun`. Ranked Survival retains the existing Sun.
The study recommends retaining the existing decorative landing Sun; this trial
supersedes that recommendation for the title scene only. Playground retains its
current mode-independent ship/scoring meaning rather than using it to enable
world features. The size distribution and field profiles are initial trial
choices. Field boundaries and visual identity are accepted.
See the study's parts 03 and 04 for gaps, ordered slices, verification and the
version/challenge boundary. Low-yields and other stellar natures are outside
this delivery.

The production contract below describes the legacy Sun profile used in ranked
Survival. Practice uses the same reference fields and radius as G7, with
resource protection. Study acceptance and this trial do not claim gameplay
balance or authorize a release.

Derelicts and Gauntlet place the selected `G4`–`G14` denomination just above
and to the right of the star surface in the World HUD. The integer is the
surface radius in tens of world units, rounded to the nearest class; radius 70
is G7 and radius 140 is G14. The label uses the World HUD's Android green and
remains screen-readable as the camera zooms. Practice shows `G7, Sun` in that
position.

## Architecture

- `SUN_CONFIG.G` supplies the legacy radius-35 body and artwork. Survival uses
  it directly; Practice applies the fixed G7 profile; Derelicts and Gauntlet
  apply the seed-selected yellow-family profile. The landing system starts from
  it before applying its independent cosmetic yellow-family sample.
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

## Contract

Distances are measured from the centre, in world units.

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

### HUD

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

### Verification scenarios

- Profile values at 35, 55, midpoint, exact edge and immediately outside it.
- Every chassis: starter/default/unfitted baseline plus additive fitted collectors;
  legacy stock collection without equipment.
- Full battery, net-draining collection, depleted reserves, lethal contact,
  applied exposure and undamaged flight beyond 100.
- Shared HUD stroke/dash/inset geometry across camera scales, CSS canvas sizes
  and display density; actual collection and damage activation.
- Lab inspected at 1280 px or wider. Human flight assessment is separate from
  automated mechanics and presentation checks.
