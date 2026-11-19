# A mercurial planet in generated systems for 0.7

Planning record, 2026-11-19. The spec, generator, shared appearance and System
instrument deliveries are complete; Planet Inspector collateral remains pending.
Check current specs and code before delivery; this plan does not replace the
living contracts.

## Requested change and scope

For 0.7, every system made by the common generator contains exactly one
mercurial airless mineral-rock planet. It replaces the innermost stock planet,
rather than adding a fourth body. Its entire surface stays outside the Sun's
danger zone and inside its charging zone. Other planets may be removed when
they obstruct that placement; the mercurial planet takes priority.

This applies to Survival, Derelicts and Gauntlet through their shared generator.
Practice remains the fixed named reference system. The user selected this
project scope, then authorized the spec and generator deliveries recorded below.
Shared appearance and the System instrument remain later deliveries.

## Current reality and study evidence

- `packages/mode-a/src/lib/solar-system.ts` already supplies these three modes.
  It parses `SolarSystemGenerationSchema`, initializes the three stock planets,
  rotates their phases from the seed, assigns gravity wells and outward HUD
  ordinals, and applies the seeded yellow-family Sun profile.
- `packages/core/src/lib/config.ts` defines the innermost stock `moon`: radius
  18u, orbit 300u, angular speed −0.13. The other planets orbit at 460u (`gas`,
  radius 45u) and 700u (`rock`, radius 30u).
- Practice setup in `packages/mode-a/src/lib/simulation.ts` turns `moon` into
  named Mercury: radius 27u, orbit 258u, travel 4u/s. Its separately tuned mass
  is 870; the generated stock body's gravity-well mass is currently 1450.
- The [Mercury study](../../apps/web/src/pages/lab/studies/mercury-2026-11-12.astro),
  sections 02.26–02.27 and 03–04, establishes the mineral-rock family (16–36u),
  selected Practice radius and orbit, accepted mineral surface, independent
  31.3-second turn, directional light and world HUD. The study permits partial
  charging overlap. This request can use the stronger whole-body-inside rule.
  Its old readiness statements about missing production wiring and mass are
  stale; current code and specs establish what has since shipped.
- Production Mercury material already exists at
  `apps/web/public/planets/mercury-ground.png`. FlightDeck currently loads it,
  builds the appearance map and supplies that map to flight only for Practice.
  Changing planet physics alone would leave a stock disc in generated play.

## Proposed delivery choices

These are engineering proposals to carry into the owning specs before code.

**Body and appearance.** Select radius `R` deterministically from 16–36u using
its own seed-derived stream, independent of Sun size, orbital phase, encounters
and arrival. Use a uniform continuous mapping across that range; equal seeds
produce equal radii. Keep both endpoints valid in the placement contract even
if the PRNG's upper endpoint is exclusive. Practice Mercury remains fixed at 27u.
Use the existing accepted mineral map, 31.3-second surface turn, current shared
light, and no atmosphere or ring. Reuse the production appearance pipeline
rather than importing study drawing code or old study light values.

**Identity and gravity.** Retain internal `moon` for the replacement to avoid
unnecessary mass-key and consumer migrations. Give it no inherited “The Moon”
display name: generated systems use the established star/planet ordinal naming.
Mercury remains Practice's proper name. Retain generated mass and gravity tuning
(including well mass 1450); adopting Practice's lighter 870 mass would be a
separate balance change. Body radius and gravity mass remain independent.

**Orbit.** Apply the generated Sun profile first. Let `S` be its radius, `H`
its actual damage-field reach and `C` its actual collection-field reach. With
seeded body radius `R` and clearance `m = 1u`, the allowed center-distance interval
is `[H + R + m, C − R − m]`. Require a nonempty interval, then choose
`D = clamp(258 × S / 70, H + R + m, C − R − m)`.
This preserves Practice's Sun-relative placement wherever it fits and adjusts
it when the body needs more room. Use travel speed 4u/s and angular speed
`4 / D`. The seed still sets the starting phase. Validate the resulting
`D − R >= H + m` and `D + R <= C − m` using actual generated fields.
Do not use gravity reach as a substitute for collection reach.

At the smallest Sun (36u), the current charging reach is about 166.5u and danger
reach about 51.43u. Even the largest body fits: the field gap is about 115u,
exceeding the required `2 × 36 + 2 × 1 = 74u`. Its raw scaled orbit of 132.69u
needs clamping to about 129.5u so its far surface remains inside charging.
The field gap grows with Sun size, so all radii 16–36u fit throughout the current
36–140u Sun range. Verify this with actual field computations and endpoint
coverage at implementation time, rather than relying on rounded values. An
invalid future profile with insufficient space must fail explicitly instead of
silently shrinking the body or returning an unsafe placement.

**Planet priority.** Replace the innermost stock entry before filtering the
remaining roster. Remove another planet if its swept circular body annulus
overlaps or touches the mercurial body's annulus:
`abs(other.orbitRadius − D) <= other.radius + R + 1`.
The extra 1u is a proposed clearance margin. Check the whole orbit, not only
starting positions: differently moving planets can meet later. Keep the other
planets unchanged when clear. At the largest Suns this removes the 460u gas
planet; the 700u outer rock remains clear. No replacement generation is needed.
Reassign full-system ordinals after removal; the mercurial planet need not
remain innermost when another retained orbit lies wholly inside its orbit.

Exactly one _mercurial type_ is required. This does not require removing every
other planet that also happens to be inside a large Sun's charging field. The
study's broader suggestion that only airless rocks belong there is not adopted
as a system-wide taxonomy rule by this request.

## Architecture and delivery order

1. **Set the owning contracts (small).** Update
   `docs/specs/game/world/systems/spec.md` for replacement, field containment,
   priority removal, variable remaining count, deterministic phase and mode
   parity. Update `world/planets/spec.md` for the generated application of the
   accepted material, seeded 16–36u radius, motion, naming and retained mass. Reconcile the
   Practice-only wording in `world/gravity-field/spec.md` without changing its
   tuning. Check Survival, Derelicts and Gauntlet specs for fixed-roster claims.
   Record the final 0.7 scope in the release documentation without claiming it
   has shipped. Leave Practice's reference values intact.
2. **Generate the body and resolve conflicts (small).** In `solar-system.ts`,
   apply the Sun profile, select the seeded radius, replace the innermost entry,
   clamp the orbit and validate containment,
   remove conflicting bodies, then calculate positions, wells and ordinals.
   Share family constants through `mercurial-rock.ts`; keep fixed Practice
   orbit constants separate from the generated orbit calculation. Preserve
   pure generation, seed streams and arbitrary validated center inputs.
3. **Share the existing appearance (medium).** Remove Practice-only gating
   around Mercury material loading, appearance-map construction and frame
   attachment in `FlightDeck.svelte`. Refactor the existing
   `planet-appearances.ts` adapter as needed so it can supply the
   mercurial material in generated play while Venus and The Cradle remain
   Practice applications. Use explicit body identity, never array position or
   “every rock”; the surviving outer rock retains its stock presentation.
   Initialize appearance maps again after run replacement or material loading.
   Use existing World/LFX passes, tick-driven rotation, camera culling, cached
   assets and stock-disc fallback on material failure. No render-model extension
   or per-frame pixel processing is needed.
4. **System instrument (medium, after generator and shared appearance).** Add
   the Lab-only page and minimal instrument described below. It calls the same
   generator and renders with the shared production body and field drawing.
5. **Verify and record (small).** Add focused generator/integration coverage,
   inspect generated flight and Practice, and update the delivery record with
   actual results. Review the changed generated Survival environment against
   the existing 0.7 ranked challenge policy; this is part of the release's world
   change, not an incidental visual-only change.

If implementation adds a serialized planet kind or appearance selector, define
its Zod contract first and parse its inputs. The proposed reuse of `moon` and
the existing appearance map needs no new persisted field or generator input.

## Verification

- Cross minimum, reference and maximum Sun profiles with body radii 16, 27
  and 36u. Check containment, 1u clearance, orbit clamping, conflict-removal
  boundaries and explicit failure when the allowed interval is empty. A seed
  sample alone cannot prove extrema. Check seed-derived radius determinism,
  bounds, variation and independence from the existing seed streams, and exactly
  one mercurial body per generated system.
- Check conflict-free stock planets retain their state, removed planets have no
  remaining collision/HUD entries, retained paths have clearance, and ordinals
  are contiguous after filtering. Cover non-default centers and invalid input.
- Equal seeds across Survival, Derelicts and Gauntlet give equal complete
  systems, including removals, masses, positions and appearance selection.
  Preserve existing random streams for encounters and arrival.
- Revise the current simulation assertion that ranked `moon` retains the stock
  radius. Keep the independent Practice mass and fixed-system assertions.
- Inspect the accepted material, spin, Sun-facing light, HUD, fallback and
  pause/reset behavior in generated flight, including a large Sun that removes
  the gas planet. Verify Practice Mercury, Venus and The Cradle still render.
  Check keyboard and iPad landscape touch play. Lab inspection stays at 1280px
  wide or above. Human playtesting is not a repository gate or evidence request.
- Run focused unit tests, type checks, contract checks and the normal required
  repository verification for the implementation. Report automated checks and
  visual inspection separately. Planning alone does not require a game build.

## Outside this delivery

General random planet generation, a new planet taxonomy, new surface variations,
Practice retuning, new gravity constants, additional instruments beyond the
System instrument below, and
promotion of other Mercury-study proposals.


## System instrument: Lab-only generator preview

Add `/lab/system-instrument`, titled **System instrument**, and register it in
`apps/web/src/data/lab-pages.ts` alongside the other instruments. Use LabLayout
and the existing instrument viewport and shared controls. It has no burger pane,
configuration drawer or document editor. Its only authoring controls are:

1. **Seed**: a labeled number field, accepting the generator's existing integer
   range 1–2147483647.
2. **Generate**: validate the entered seed and regenerate the preview from it.
3. **Randomize**: select a fresh valid seed different from the current one,
   write it into the field, and immediately regenerate the preview.

Editing the field alone does not regenerate. Open on a documented valid default
seed with its system already visible. Generate is repeatable: the same seed
shows the same system. Reject empty, fractional or out-of-range input with a
field error and retain the previous valid preview; do not silently coerce it.
Randomize uses browser randomness only to choose the input seed; all generated
world properties still come from the deterministic shared generator. A random
seed remains reproducible by entering it later.

Show the Sun and all retained planets at generated positions in an automatically
fitted system overview. Include their normal body appearances, world HUD/orbits,
and the Sun's danger and charging boundaries so containment and planet removal
can be judged. Reframe to the new system on generation or viewport resize without
changing the seed. Initial scope is a static generated-system preview at tick
zero, with no ship, flight controls, timeline or additional input. Use shared
rendering and appearance owners rather than building an approximation of the
system. Any read-only generation error is visible in the stage.

Before implementation, write `docs/specs/lab/system-instrument/spec.md`; reuse
`SolarSystemGenerationSchema` for seed validation and define any new instrument
configuration in Zod before consuming it. Follow the shared-components workflow:
inspect the design-system control owners and canonical instrument examples,
compose shared primitives, and add a supported shell variant if the existing
shell assumes a burger pane. Do not change other instruments' controls.

Verify at 1280px and wider: initial preview, editing without regeneration,
Generate repeatability, Randomize updating both field and preview, invalid-seed
recovery, removed planets absent, field containment across small and large Suns,
material fallback and automatic framing. Check keyboard access to the three
controls. Keep behavioral checks separate from visual inspection. This tool is
Lab-only for now; study embedding and production exposure are outside scope.

## Proposed first atomic delivery

**Specify the generated mercurial contract.** A documentation-only change to
`docs/specs/game/world/systems/spec.md` and
`docs/specs/game/world/planets/spec.md`, plus reconciliation of related mass
wording in `world/gravity-field/spec.md` where necessary. Define the seeded
16–36u radius, dedicated seed stream, full-body field containment with 1u
clearance, clamped orbit, conflict removal, retained mass, naming and shared
mode scope. Preserve fixed Practice behavior.

Acceptance: the contract covers the 36u body around the 36u Sun, impossible
placement, deterministic regeneration and variable retained planet counts;
no fixed-three-planet or fixed-stock-radius rule contradicts it. Review the
formula against the current production field calculation and check all nine
Sun/body endpoint-reference combinations. Record implementation as pending in
this plan, not as status markers in the living specs.

This is a small, reviewable first delivery with no runtime change. It settles
the generator contract before the next atomic delivery implements and tests it.
The System instrument's own spec and implementation follow once that generator
and its shared appearance are available.


## First delivery record — 2026-11-19

Updated the system, planet and gravity living contracts, and reconciled the
Survival, Derelicts and Gauntlet descriptions. The specs define seeded radii,
containment and clamping, conflict removal, naming, motion, appearance and
independently fixed gravity mass. Practice remains a fixed reference.

Checked the nine combinations of Sun radii 36/70/140u and body radii 16/27/36u
against the current production inverse-square field formula and tuning
(`sunMass = 5250`, `cutoff = 50`). All satisfy both 1u clearances; the 36u body
around the 36u Sun clamps to an orbit of about 129.648u. The minimum field gap
exceeds 74u and grows linearly with Sun size, covering the continuous ranges.
`git diff --check` passes. These are contract/formula checks, not runtime or
visual verification. Generator, shared appearance and System instrument
implementation remain pending.

## Generator delivery record — 2026-11-19

The shared generator now selects the mercurial radius on a separate seeded
stream, places it between the generated Sun's actual fields with 1u clearance,
removes conflicting swept stock orbits, and reassigns outward ordinals. Its
identity and gravity-well mass remain `moon` and 1450; Practice is unchanged.
The generator explicitly rejects invalid or impossible placement fields.

Automated verification: all 250 mode-a library tests passed, including the nine
Sun/body combinations, placement and conflict boundaries, seeded generation,
mode parity and Practice checks. Type checks, contract checks and formatting
of the touched TypeScript files passed. This delivery has not inspected flight
visually. Shared appearance, the System instrument and their verification remain
pending; generated flight still uses the stock appearance until that work lands.


Independent review used Terra for development and a clean-context Sol reviewer.
Two review passes completed. The first identified weakened Survival coverage in
an adjusted coasting fixture and coupling to Practice orbit constants; both were
corrected. The second found no remaining actionable generator findings and
independently reran the five affected test files (39 tests), all passing.


## Release appearance and collateral: Planet Inspector

For 0.7, all mercurial applications use the one accepted fixed mineral atlas.
Seeded procedural surface synthesis and multiple outlooks are outside this
release. The radius remains seeded at 16–36u; the surface does not vary by seed.

After the shared appearance and System instrument deliveries, add **Mercurial**
to the existing Planet Inspector (the planet instrument). It represents the
family separately from named Practice Mercury, uses the same production fixed
mineral material and shared 31.3-second turn, and supports the accepted 16–36u
radius range. Define its configuration and validation in the Inspector's Zod
contract before implementation; retain the existing named Mercury reference.
Update `docs/specs/lab/planet-inspector/spec.md` and its controls, configuration,
preview and focused checks together. This is collateral follow-on work; it is
not part of the shared-appearance slice. A broader planet taxonomy or procedural
surface generator is outside its scope.


## Shared appearance delivery record — 2026-11-19

The common `planetAppearances` adapter now owns the existing material bindings
in `apps/web/src/lib/assets/planet-appearances.ts`. FlightDeck prepares the fixed
mercurial material for generated modes as well as Practice, rebinds current
system ordinals on run replacement and asynchronous completion, and supplies
that map to the existing World/LFX frame passes. Venus and The Cradle remain
Practice applications; other stock rocks retain their fallback presentation.
The family shares a 31.3-second spin constant. FlightDeck disposes painters at
teardown and discards late material results. Inspector and Flight scene consumers
use the same renamed adapter. The render spec's Planet appearance adapter
section defines ownership, interface and lifecycle responsibilities.

All 375 unit tests passed, including shared pass/culling checks and generated
mode/Practice binding, changed ordinal and missing-material coverage. Type and
contract checks passed, and touched TypeScript/Svelte formatting and diff checks
passed. A local 1440px browser capture showed the fixed mineral surface, light
and HUD in generated Derelicts and the existing Mercury Inspector without page
errors. Browser smoke checks also launched Survival, Gauntlet and Practice and
confirmed pause holds simulation ticks, with no page errors. The first local
preview encountered stale Vite optimization dependencies;
using the repository's isolated verification cache resolved that preview issue.
System instrument and Mercurial Inspector support remain follow-on work.


## System instrument delivery record — 2026-11-19

Created `docs/specs/lab/system-instrument/spec.md` before implementation, then
added the registered Lab page at `/lab/system-instrument`. Its only controls
are Seed, Generate and Randomize; it has no burger pane. The default seed is
2026. Draft edits leave the displayed system unchanged; validation preserves
the last preview, and Randomize chooses a new seed and regenerates immediately.
The production Simulation supplies the shared generated world at tick zero;
the shared frame passes and appearance adapter supply the overview, materials,
light, orbit/identity HUD and Sun fields. Automatic framing includes complete
orbit and field extents. Draws happen on generation, resize, font readiness and
material completion, with no animation loop or simulation stepping. Teardown
disconnects observation and disposes the painter, including late loads.

Verification: all 375 unit tests, type checks, contract checks, touched-file
Biome checks and production build passed. One initial factory-runner check
failed on its temporary stalled-emulator marker; an unchanged rerun passed all
15 runner tests. Browser review at 1440px and 1280px verified initial display,
draft isolation, repeatable pixel output for the same seed, Enter/Generate,
invalid seed retention, Randomize recovery, resize without seed changes,
exactly one field and two buttons, no horizontal overflow, material failure
fallback and no uncaught page errors. Visual captures were inspected separately.
No permanent demonstration-only browser test was added. Mercurial support in
the Planet Inspector remains the planned collateral delivery.
