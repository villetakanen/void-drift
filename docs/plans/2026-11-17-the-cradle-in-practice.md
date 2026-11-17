# The Cradle in Practice

Status: plan, 2026-11-17, revised twice the same day. Nothing here binds until a
spec states it.

Practice's outer planet becomes The Cradle, an air-wrapped world taken from the
design intent of the [rock-atmospheres study](/lab/studies/rock-atmospheres-2026-11-15)
(`apps/web/src/pages/lab/studies/rock-atmospheres-2026-11-15.astro`). The study
is a design study, not an engineering one: it shows what the designer wants to
see. This plan works out how that intent goes into the game. The Planet
Inspector gets The Cradle as a named planet.

## Answers given, 2026-11-17

- Practice has no damage and will not get any. The study's hull damage rates
  are out of scope.
- The Cradle is two 2D surface maps, rock and clouds, turning independently.
  The clouds turn at half the rock's speed: rock 31.3 s, clouds 62.6 s. This
  also tests whether the two-surface model is feasible.
- Shadow and light intensity were adjusted after the study. Its shadow,
  brightness and light values are out of date; The Cradle uses the current
  shared light.
- The rim and the haze are wanted.
- The study's drawing code is not a source for the game. Only its intent is.
- The only addition to the render model is that a body may have two surfaces,
  the upper one partly transparent.
- Body numbers are derived as Venus's were (below).
- The air has drag.
- The air's depth lies within 4–22u. The cloud surface sits at 2/5 of the air
  depth above the ground, 1.6–8.8u across that range.
- Entry shows the heat cue. Practice is god mode: damage is ignored there, and
  the cue is still shown.
- No Lab tuning tool for depth or drag is needed now.
- The Cirrus map, generated for the study, ships as The Cradle's cloud map with
  its provenance.

## The Cradle

- **Identity.** `id: cradle`, display name The Cradle. In Practice only, it
  replaces the stock outer rock before mass lookup, as Venus replaces the gas
  planet. Other modes keep all three stock planets.
- **Numbers**, derived from Earth's ratios to Mercury as Venus's were:
  - Radius `27 × (1 + (6371 / 2440 − 1) / 3)` ≈ 41.50u.
  - Orbit `258 × 149.6 / 57.9` ≈ 666.61u, circular.
  - Travel speed `4 × 29.78 / 47.4` ≈ 2.513u/s.
  - Mass `870 × (radius / 27)² × (1 + (9.81 / 3.70 − 1) / 3)` ≈ 3186.67,
    stored independently in `practicePlanetMass`. Later radius or Mercury
    changes do not recompute it.
- **Rock surface.** The Impact map, 31.3 s turn, browser image drawing, like
  Mercury.
- **Cloud surface.** The Cirrus map, white, density as opacity: opaque cores,
  soft edges, clear openings onto the rock. 62.6 s turn. Its radius is the
  body radius plus 2/5 of the air depth, so it floats just above the rock.
- **Light and dark.** The body's one shared light stamp on LFX at the current
  production values, covering the cloud surface's radius. No custom tuple; no
  shading of its own on either surface.
- **Haze.** A soft air layer on World over the clouds, a native radial gradient
  out to the air's edge, with no light of its own.
- **Rim.** The fixed blue rim on the day side, its arcs peaking 20° toward the
  Sun, at the air's edge. Native arcs on World, like Venus's atmosphere arc.
- **Fallback.** A failed material draws a stock disc in a blue fallback colour,
  with the same HUD and physics.

## The air

- **Extent.** The air reaches from the body's surface out to the air depth. A
  ship is in it when its collision circle overlaps that shell.
- **Density.** Rises linearly from 0 at the outer edge to 1 at the surface.
- **Drag.** Each step scales the ship's velocity relative to the planet by
  `exp(−k × density × dt)`. It slows and never steers. The air moves with the
  planet's orbit; no wind or rotation of the air.
- **Scope.** Atmosphere is planet data: any planet may carry one, and only The
  Cradle does now. Drag is world physics and applies to every ship in every
  mode where such a planet exists. Venus keeps its visual arc with no drag.
- **No damage, no temperature.** The air does no damage. In Practice the hull
  stays full as it does today.
- **Heat cue.** While a ship is in the air, a curved heat band is stamped into
  FX, weighted toward the planet and following the ship's planet-relative
  motion, and a soft glow lights the ship's planet-facing side on LFX. Both
  grow with depth and speed. FX history fades the band after exit. The cue
  shows air contact; in Practice no damage follows it. The band's source stamp
  is prepared at load; the study's accepted shape (curved band) is the intent,
  its study-era brightness values are not carried over.
- **Tuning.** The depth (within 4–22u) and the drag coefficient `k` are stored
  as production tuning, validated by Zod, and chosen during implementation. The
  study's 0.8/s was measured with a 10u air layer, inside that range, and is
  the starting reference.

## The render model change

Proposed wording for the Rotation rule in `docs/specs/game/render/spec.md`
"World bodies":

- A body has one or two surfaces. Each turns from simulation ticks on its own
  period, independently of the other, its orbit and its light.
- The upper surface may be partly transparent and may have a larger radius than
  the body. Its map carries its opacity, prepared at load.
- Each surface follows the existing rules: browser image drawing, sized to its
  own diameter on screen, redrawn only when that surface has visibly moved,
  same tick same picture.

The Cost rule then has to hold for two turning surfaces on one body; measuring
that is the feasibility test. Bounds cover the air's edge, where the rim sits.

## Still open

Nothing blocks the specs. Values left to implementation: the air depth within
4–22u, the drag coefficient, the cue's brightness, and the fallback colour.

## Steps

Specs first, then code; each step a reviewable delivery.

1. **Specs.**
   - `docs/specs/game/render/spec.md`: the two-surface wording above.
   - `docs/specs/game/world/planets/spec.md`: a Practice Cradle section beside
     Practice Venus, and an Atmosphere section (extent, density, drag, heat
     cue, scope, no damage).
   - `docs/specs/game/world/gravity-field/spec.md` or the physics owner: drag
     as a body effect next to gravity and contact.
   - The FX spec that owns ship effects (`fx-development` skill names it): the
     heat band as an emitted source and the planet-facing glow on LFX.
   - `docs/specs/game/test-flight/spec.md`: The Cradle replaces the outer stock
     rock; air slows the ship and shows the heat cue, and hull stays full.
     Correct the star label to `G7 Sun`, as built.
   - `docs/specs/lab/planet-inspector/spec.md`: `cradle` as a named reference.
   - Zod first: planet atmosphere data, its tuning, and the per-ship air sample
     (density, planet direction, planet-relative velocity) the simulation
     exposes to drawing.
2. **Material ownership.** Step 7 of the
   [render remediation plan](2026-11-16-practice-planets-render-remediation.md),
   already proposed as Mercury's next delivery. Move rock material preparation
   and painters into `packages/core`, and ship prepared maps outside
   `/studies/`. The Impact and Cirrus maps go there with their provenance.
3. **Simulation.** The Cradle in Practice setup; atmosphere data; drag in
   production physics; the air sample per ship. Unit tests on relations: no
   effect outside the air, more slowing deeper in, heading never changes,
   equal simulated time gives equal results, pause holds. Check the fixed spawn
   stays clear of the orbit and air.
4. **Appearance.** Two turning surfaces, haze and rim, through the shared
   appearance adapter (`apps/web/src/lib/assets/practice-planet-appearances.ts`,
   or its core successor after step 2), so FlightDeck and the Inspector get it
   together.
5. **Heat cue.** Band stamp into FX and glow on LFX, driven by the air sample,
   through the existing FX ownership.
6. **Lab.** The Inspector's `cradle` reference. The dated study and its
   instrument stay as they are.

## Checks

- Frame cost with the production measurement method, on screen, off screen,
  close at 4 px/u, compared with Mercury and Venus: the feasibility evidence for
  two surfaces. No pixel work per frame.
- The two surfaces turn at their own rates; a paused frame and a repeated tick
  give the same picture.
- Practice in the browser: The Cradle with its HUD name, clouds over rock,
  openings, rim and haze, at 1× and close; skim and pass through the air,
  with the heat cue on entry and fading after exit; keyboard and touch play.
- Inspector: The Cradle at each zoom level, and the stock fallback.
- Survival, Derelicts and Gauntlet unchanged; the ranked ruleset untouched.

## Out of scope

Hull damage, temperature, Lab tuning tools for the air, Earth geography, habitation, new cloud materials,
lighting values from the study, a planet taxonomy, and air on Venus.
