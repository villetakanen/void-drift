# Standard Sun

## Intent

A steady G Sun offers collectable energy inside its gravitational well. The
pilot trades income against the pull, exposure and terminal contact. Other
stellar families and Sun artwork/effect redesign are deferred. The accepted
[study](../../../../../apps/web/src/pages/lab/studies/suns-2026-11-07.astro)
retains experiments; the [closure](../../../../loop-evidence/2026-11-07-suns-closure.md)
records acceptance, not production validation.

## Architecture

- `SUN_CONFIG.G` supplies the radius-35 body and existing artwork. Production
  simulation and the decorative landing system both select G.
- `packages/core/src/lib/solar.ts` owns centre-distance field profiles.
  `EnergyFieldSchema` validates independent reach, shoulder, peak and outer
  fraction. `solarField` uses the existing gravity reach (about 324 u).
- `solarCollectionRate` supplies both stock `updatePower` and assembled
  `solarCharge`. Every ship has one inherent collector-equivalent; each fitted
  solar collector adds one. No fitting, unlock or slot is needed for the baseline.
- `solarDamageRate` supplies `updateHull`. All production ships use the direct field damage rate. Terminal contact
  and ship collision geometry remain unchanged.
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
Life support is 0.8 E/s; Light ion is 1.0 E/s per fully firing physical engine.
Other engine-family draw, thrust, handling and collisions remain unchanged.

### HUD

- Gravity: dim Android green, dashed 5/5 CSS px.
- Solar: dim solid Android green; full brightness and 3.3% green fill while
  actual collection is positive, including at capacity and during net drain.
- Hazard: dotted 1/4 CSS px, round caps, amber at 60% opacity while inactive;
  red with 11% red fill when Sun damage is actually applied.
- Inactive green opacity is 35%. Every stroke is 1 CSS px at every zoom and
  display density. Dash dimensions also remain in screen space.
- Coincident visible outer boundaries draw solar 2 CSS px inward. Neither
  physical field changes reach. Artwork and decorative pulses are separate.
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
