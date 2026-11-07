# Standard-Sun implementation — 2026-11-07

## Delivery

Implemented the accepted standard G Sun, without reopening design exploration:

- Shared schema-validated collection profile and damage law; radius 35, shoulder
  55, collection 7.5 → 0.75 E/s at the existing 324.04 u gravity boundary, damage
  1.5 → 0 hull/s at radius 100. Existing gravity, friction, thrust, handling and
  collision geometry retained. Production stock exposure uses the same direct
  hull rate as assemblies; legacy experimental `updateHull` resilience remains
  available to retained fixtures.
- Life support 0.8 E/s; Light ion draw 1.0 E/s. Every stock/default/starter/unfitted
  chassis retains one inherent collector, with fitted collectors additive.
  Battery capacity, clamping, limited engine delivery and depletion remain real.
- Shared Android-green HUD driven by simulation collection and applied Sun
  damage, including gross collection at capacity and during net drain. CSS-pixel
  strokes, dash dimensions and coincident solar inset account for camera,
  canvas backing size and displayed stage size. No new input surface.
- Both shared Path screens support independent schema-validated collection
  fields, budgets, synchronized energy graphs and document export. Analysis
  explicitly excludes energy feedback; battery change remains an unclamped
  integral. Energy settings do not alter motion or production definitions.
- The Suns article at `/lab/entities/star` replaces the former stellar-class
  inspector with fiction, boundaries, inherent collection, resource limits,
  HUD meanings and a live production-backed Wasp reference. Landing uses G.
  Historical Suns experiments remain separate and retain their candidate laws.

## Provenance and delivery state

The starting workspace already held concurrent Hangar/mode work, historical
Suns study components, energy graph support, the study registry, the Motion
instrument spec additions, derelict artwork and other changes. Those are not
attributed to this implementation. Shared instrument work extends the existing
energy measures rather than replacing them. The only edit to the retained Suns
fixture is a test proving the accepted shoulder profile matches production.
The accepted study and its closure record were not rewritten.

No commit, staging, push, publication or deployment was performed by this task.
The shared branch may advance through concurrent work. HEAD observed during
verification was `0f60566754e74498b6a8b9be45128bbfffac2f64`; these checks describe
mixed local working changes, not an isolated reproducible committed revision.

## Verification

- [Unit suite](artifacts/2026-11-07-standard-sun/unit.log): 50 files, 285 tests
  passed. Covers field endpoints and exterior cutoff; all-chassis inherent and
  fitted collection; actual capacity, depletion, damage and contact; stock
  exposure parity; shared Path validation and power integration; selected study
  profile parity; screen-space geometry across zoom, backing density and CSS
  stage scaling.
- [Type checks](artifacts/2026-11-07-standard-sun/types.log): Astro checked 213
  files with zero errors/warnings/hints; Svelte zero errors/warnings; workspace
  TypeScript passed. Browser-harness TypeScript was checked again after final
  browser capture edits and passed.
- [Sun browser checks](artifacts/2026-11-07-standard-sun/browser-suns.log): four
  passed. Live Wasp collection, net-draining collection, capacity saturation and
  applied damage; exact 1 CSS px strokes and 2 CSS px inset at zoom 0.35/1.6 and
  device densities 1/2; correct active fills; energy editing/export and four
  graphs in both Ship tuning and Gravity tuning. Lab viewport 1440 × 1000.
- [Controls and screen regression run](artifacts/2026-11-07-standard-sun/browser-controls.log):
  twelve passed, comprising the earlier three Sun/Path checks and nine existing
  keyboard, landscape touch, cancellation/focus, adaptive stage, orientation,
  pause and arrow-turn scenarios. This predates the final Lab control styling,
  hydration-readiness guard and direct stock exposure adjustment; the final
  four Sun/Path checks and unit suite were rerun afterwards.
- [Production build](artifacts/2026-11-07-standard-sun/build.log): passed, 70 pages.
- [Contracts](artifacts/2026-11-07-standard-sun/contracts.log): passed, including
  14 factory regression tests. Existing advisory stale-link warnings remain.
- [Scoped source lint](artifacts/2026-11-07-standard-sun/lint-scoped.log): passed
  for 34 implementation files. Additional new tests and edited specs were
  formatted/checked separately. `git diff --check` passed.
- [Repository-wide lint](artifacts/2026-11-07-standard-sun/lint-full.log): failed
  on four pre-existing errors in two unrelated SVG files: accessibility and
  formatting in `apps/web/public/studies/derelict-draft-two-2026-11-06/source.svg`
  and `docs/artwork/void-drift-ships-equipment.svg`. They were preserved.

## Visual inspection and limits

Inspected the actual rendered introduction, complete zone table and live
collecting/damaging Wasp reference at 1440 px width. Retained captures:
[introduction](artifacts/2026-11-07-standard-sun/suns-article-top.png),
[zones](artifacts/2026-11-07-standard-sun/suns-zones.png),
[live fields at density 1](artifacts/2026-11-07-standard-sun/suns-live-dpr-1.png),
[density 2](artifacts/2026-11-07-standard-sun/suns-live-dpr-2.png).
The live reference removes planets but uses production resource limits, gravity,
propulsion, damage, death and shared HUD drawing. It is not the full game screen.

This is partial local verification, not a full `pnpm verify` pass. The entire
browser suite and Firebase rules/competition checks were not run. No physical
phone, sustained performance trial or manual full Survival playthrough was
performed. Automated checks do not establish flight feel, difficulty balance or
human fidelity acceptance. Other stars, Sun artwork/effect redesign and repair
devices remain deferred.
