# Cockpit materials

Status: implemented locally, approved 2026-11-03 in
[the gilded surface study](../../../../apps/web/src/pages/lab/studies/gilded-surfaces-2026-11-03.astro).

## Intent and usage

Glass is a distinct object over flat hull planes. A shared green–space–gold
colour family supplies depth; crisp reflections follow its surface construction.
Apply the material only to approved cockpit glass and its defined frame, not
arbitrary hull panels or equipment. Round outlines do not require seams; corners
in an outline alone do not establish a ridge.

- **Daehan / Scout:** round dome, continuous gradient at −70°, dark radial edge
  roll-off, crisp bowed reflection at −30°. The existing collar is gold, lit to
  bronze; the reflection crosses both glass and collar. Keep the existing radius.
- **LHI / Wasp and Fiddler:** two glass planes with a crisp centre ridge and
  darker right pane. Straight reflection edges change direction at the ridge;
  the right reflection shifts by 13% of canopy length (accepted B). Thin gold
  perimeter, no gold line on the centre ridge. Both share the pane treatment.
- **Aegis / XF-1:** continuous visor inside the existing six-corner outline.
  Gradient −79°, bowed blue reflection (#427fe0) at −39° and 32% opacity.
  Thin gold perimeter stays fixed. No invented centre ridge.
- **Mark II Escort Frigate:** excluded; existing black bridge windows remain.

Angles are relative to +x-forward ship geometry, using Canvas rotation. Materials
rotate with ships. They do not track world lighting. Gradients and gold framing
are an explicit cockpit exception to flat-fill hull rules, not a general style
change. No texture assets or simulation constants change.

## Ownership and behavior

`packages/mode-a/src/lib/cockpit-material.ts` owns the accepted procedural material
recipes. `drawBuild` applies them after hull geometry and before fittings in the
Hangar, Lab and flight. Study controls call those same recipes, suppressing the
normal material pass to avoid double layering. Controls reset to accepted values;
editing a study does not change production defaults.

## Acceptance

The four approved ships use the same geometry and material recipes at enlarged
and flight sizes. Fittings remain on top. Drawing preserves caller transforms,
clipping and alpha. The excluded frigate is untouched. The owner approved the
static designs; motion among effects and device performance remain human checks.

## Delivery verification — 2026-11-03

Type checks, all 180 unit tests, the 59-page production build and all 36 browser
checks passed after integration. Changed-file formatting and contract checks passed.
Hangar rendering was visually inspected for Scout, Aegis and Fiddler. Logs are
retained locally in `artifacts/cockpit-materials/`.

The initial quick run failed on study prop typing and an outdated gradient-less
canvas test double; both were repaired and their checks rerun successfully.
Repository-wide lint also reports pre-existing formatting in
`docs/loop-evidence/2026-11-03-lhi-fiddler.md`, left untouched. Backend/emulator
checks and a full verification run were not performed. Human flight fidelity
remains separate from the passed browser checks. Changes are local and uncommitted.
