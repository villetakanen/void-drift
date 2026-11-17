# Service ion and the ion engine family

17 November 2026. A plan for bringing the Service ion from the study
`maintenance-drive-2026-11-17` into the game. The study is read as the
designer's proposal to engineering; this plan records what engineering found in
the code, what was decided on 17 November 2026, and the work in order.

## Decided, 17 November 2026

- **The Service ion is for slower acceleration.** Its purpose is a ship that
  accelerates at about a third of a light ion's, so the default burns of the
  flight scene and path tools, and playtest flights, run at lower speeds. Its
  cruise contribution stays +1 u/s: a long burn still approaches the hull's
  cruise ceiling (the Wasp reaches 421 u/s with the drive, 428 with a light
  ion). The study's phrase "moves slowly enough to watch" is a wording issue,
  not a design change. The study stays as written; the clarification goes in
  the part's catalog description.
- **Ion engines become a proper part family.** Which parts are ion engines,
  their strength, their plume proportions and ink, and their draw belong to the
  catalog, not to id checks spread through the code.
- **The diagonal marking means "for testing only".** It is part of the design
  language for parts: the mark on parts made for testing. It is a property of
  the part, separate from sanctioning: if such a part reaches ranked play,
  fitting it is still a deliberate downside, and the marking says so. The
  marking is static art, drawn into the part's SVG master and present in every
  pose; no hull places it.
- **The 1 u aft offset belongs to the part**, on every hull, not to the Wasp or
  any other ship. The drive is so small that it has to sit closer to the aft
  end of the slot; the part's mount point says where.
- **Every part's art has three things:** an SVG master; the technical
  artefacts the game draws from (canvas faces per pose, stamps, nozzle and
  mount geometry); and a design-system page, or part of a page, showing the
  master beside renderings of the technical artefacts. The rule is a
  constraint going forward: a new part has all three when it is added; an
  existing part gets them when its art is changed. The existing parts' missing
  masters stay as known debt for now.

## What engineering found in the code

- The study's figures fit the existing model: thrust 1.5 × 0.22 = 0.33 of a
  light ion; mass 7 is 0.7 of the light ion's 10; draw 1.75 × 0.33 ≈ 0.58,
  shown as 0.6; the cruise ceiling is the hull's base speed plus each engine's
  contribution (`loadout.ts`).
- The ion family exists only as id checks, and a missed check fails silently:
  `ionStrength` returns 0 (the part flies as a non-ion engine on catalog
  thrust); `buildPlumeEmitters` falls back to the orange default plume; the
  Scout's `engineOffset` falls back to a front of 10; `buildDrain`'s draw scale
  covers `"ion"` only. `ShipBuilder.svelte`, the Lab instrument's `config.ts`
  and `ship-propulsion.astro` keep their own engine lists, against the parts
  rule that the catalog is the only list.
- The plume stamp in core `ion-beam.ts` writes the heavy ion's 1.4 length and
  1.45 width inline, twice.
- `engine-art.ts` says its faces were "preserved from the reviewed SVG
  fixtures", but no engine SVG is in the repository. No engine has an SVG
  master today; under the art rule that is debt carried until each engine's art
  is changed. The ion point defence is the precedent to follow:
  a committed concept SVG, geometry converted into an `*-art.ts` owner, and
  canvas, catalogue SVG and renderer all consuming that owner.
- The Hangar card (`PartDrawing.svelte`) draws engine art in a fixed frame
  around its origin. If the part's anchor is kept apart from its art origin,
  the 1 u offset moves the engine on the ship and leaves the card centred.
- `PartSchema.limit` is not read in flight for any engine; the ceiling comes
  from the ship's figures.

## Spec changes, before code

Written 17 November 2026 into the parts, design-system and ships specs.

1. **Parts.** Add the ion engine family: catalog parts that share one form and
   one beam, differing by strength, form proportions and plume proportions and
   ink; flight, plume, draw and fitting lists read these from the catalog. Add
   the part art rule as a constraint: new parts have an SVG master, technical
   artefacts and a design-system page; existing parts get them when their art
   changes. Add the part's mount point: where the part sits relative to its
   slot, applied on every hull, with the art drawn in its own frame. Add the
   testing-only property.
2. **Design system, parts.** The design system alone carries the
   testing-only marking; `docs/design.md` does not change (decided 17 November
   2026). Add the testing-only marking: diagonal lines at
   45° on a nose-up part, in the brand colour, line to gap 1:2 as on the
   Playground band, on the outer half of the body's side, never on additions or
   the nozzle. Name it apart from the Playground band so the two meanings stay
   separate.
3. **Ships.** Engine placement adds the part's mount point. The Scout's own
   alignment stays a hull rule, but reads each engine's front from its art
   instead of a list of ids.

## Work, in order

1. **Ion family into the catalog.** _Done 17 November 2026, uncommitted:_
   ion strength and beam (length, width, ink) are catalog fields; core
   `paintBeam` takes a beam and stamps each once; plume emitters, flight
   thrust, the Hangar side list, the instrument's family mapping and the
   propulsion page read the catalog; the Scout reads engine fronts from the
   art. `buildDrain`'s Lab draw scale stays on the light ion: it rescales the
   reference part, not the family. The parts spec's draw rule was corrected:
   an ion engine's draw is its own catalog value (the heavy ion draws 2× at
   strength 1.75). Original intent: No visible change: the light and heavy ion
   fly, draw and look as now. Catalog entries carry ion strength and plume
   proportions and ink; `ionStrength`, the plume stamp, `buildPlumeEmitters`,
   `buildDrain`'s scale, the Hangar side-mount list, the Lab instrument
   mapping and the ship propulsion page read the catalog. Typing over
   `EngineIdSchema` makes a missing entry a compile error, not a fallback.
   The Scout's engine fronts come from the art. _Size: medium._ _Checks:_
   existing flight and plume tests pass unchanged; the stamp is built once per
   style; the light and heavy plumes match their current captures.
2. **Art pipeline.** _Done 17 November 2026, uncommitted, with step 3:_
   masters in `packages/mode-a/src/lib/art/engines/`, converted by
   `scripts/engine-art-from-svg.mjs`, kept equal by `engine-masters.test.ts`
   (a test, not `check-contracts.mjs`); `/lab/ds/engines`. Original intent: Make an engine's SVG master the source and its
   `engine-art.ts` entry the conversion, with a parity check alongside the
   token parity in `scripts/check-contracts.mjs`, for engines that have a
   master. Add the design-system page for engine parts, next to the Lab's
   utility artwork: master, the four poses, and the plume at full output. The
   light and heavy ion are not backfilled; step 1 changes their data, not
   their art. _Size: small._
3. **The Service ion.** _Done 17 November 2026, uncommitted:_ side-pose
   rails take their tones from the body faces whose aft-pose colours the
   study used (front −y face, front +y face, long +y face). Original intent: SVG master from the study's accepted geometry
   (`drive-family.ts`: form A at 0.7 × 0.7, the 02.4 rails, the 02.6 marking);
   the four poses, side poses derived by the same rule as the aft pose; the
   marking as part of a cached stamp; plume proportions 0.7 × 0.7 in the light
   ion's mint as catalog data; mount point 1 u aft. Catalog entry `service-ion`:
   Service ion, "Built for the yard. Flies, technically.", engine,
   unsanctioned, testing-only, mass 7, strength 1.5 stabilizer outlets, draw
   derived from strength, +1 u/s, steady. Its description states the slower
   acceleration. _Depends on 1, 2 and the spec changes._ _Size: medium._
   _Checks, as relations, not values:_ a loadout with it parses; with
   Playground off it is listed but locked; from rest it accelerates at its
   share of the light ion; its plume is shorter and narrower than the light
   ion's in the same ink; the plume starts at the drawn nozzle on every hull;
   the card and the ship draw the same form; the marking stays inside the body.
4. **Lab references.** Whatever step 1 did not already make catalog-driven.
   _Size: extra small._

Sanctioning the Service ion for ranked play is not part of this plan.

## Still open

- **Explain the ion draw curve where engines are shown.** Decided 17 November
  2026: ion draw is non-linear on purpose. Up to strength 1 it follows
  strength; above 1 draw grows faster than thrust, so stronger ion engines
  give diminishing returns (the heavy ion draws 2× for 1.75× thrust; a 3×
  draw engine would push about 2.5×). Where to say so is open: the Lab ship
  propulsion page, the design-system engines page, or alongside each engine's
  properties.
