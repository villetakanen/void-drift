# Continue the plasma fitting study

**Superseded · 17 November 2026.** The fitting study has completed physical
exploration and parts 03–04 with an accepted result. Use
[the final handoff](2026-11-17-plasma-rifle-handoff.md) and the study’s 02.30, 03
and 04. The continuation prompt below is historical, not current work instructions.

Continuation prompt prepared 17 November 2026. This resumes the existing study in
a fresh conversation; it does not start a new design cycle or accept a fitting.

---

Continue the MDX study `plasma-projector-fitting-2026-11-17` in part 02. Use the
design-study and shared-components skills. Start from the supplied sketch and
the brief below; the previous chat is not needed.

## Start here

- Study: `apps/web/src/pages/lab/studies/plasma-projector-fitting-2026-11-17.mdx`.
- Latest visual direction: `apps/web/public/studies/plasma-projector-fitting-2026-11-17/024-designer-sketch.png`. Open and inspect this image.
- Read 02.2 for the established weapon assembly language and the end of 02.4
  for the sketch and its interpretation. `docs/weapon-drawing.md` describes the
  current production construction. Use the rest of 02.4's credited references
  as supporting material, not a reason to restart research.
- Review URL: `http://localhost:4321/lab/studies/plasma-projector-fitting-2026-11-17`.

## What to make next

Develop one compelling original procedural weapon proposal from the clarified
direction. The supplied sketch is an illustrative example, not a selected form
or a template to reproduce. The designer explicitly does not expect its shapes
in the final design unless they earn their place by looking compelling.

The sketch helps explain a long working head, energy visibly occupying that
head, a distinct supporting housing and two subordinate angled parts. Reading
the angled parts as exhausts is an interpretation of the unlabelled drawing.
These relationships can inform the next proposal; its silhouette, diagonal ribs,
cyan housing and individual parts are not requirements. Keep the original as
reference evidence, without making resemblance to it the test of success.

The desired character is an elongated sci-fi gun: a "long pointy thing," possibly
shorter like a shotgun. Heavy commitment belongs to the shot and handling; it
does not require a bulky, engine-like or steampunk body. Titanfall, Star Citizen
and District 9 are the intended reference family. The sketch makes this more
concrete than the earlier prose. Its exact colours, rib count, proportions,
mechanical interpretation and outlet directions are not settled.

First show the new proposal enlarged, dark and with restrained internal light.
The question is whether energy visibly occupies a constructed working head
while the object retains the weapon assembly language in 02.2 and looks like a
compelling sci-fi gun. This is a design exploration, not a cleanup or tracing
exercise on the sketch. Once that direction is judged useful, inspect it through shared Preview/Plan
rendering, mounted exposed and partly beneath the current Wasp chassis, and at
one CSS pixel per world unit. Use current mount geometry. Looking good whole
and with only the forward portion visible matters; occlusion is a simple fit
check, not the subject of the study.

## Purpose and constraints

The eventual result is one provisional physical reference that lets the parked
`plasma-projector-2026-11-16` effects study resume. Before finalising that handoff,
read its retained 02.2 and 02.3 findings. Supply silhouette, dimensions, attachment,
primary opening and paired emission anchors. No fitting has been accepted yet.

- One weapon occupies one existing left or right Wasp equipment slot. Both vents
  belong to that weapon.
- Loading precedes a huge close eruption with strong backward kick, followed by
  smaller sustained venting. A lost target leaves loading and venting without
  the main strike.
- Venting gives continuous backward thrust. Neither kick nor venting adds
  rotation; predictable handling is deliberate.
- Twin jets and Open bell remain promising and unselected. Keep the central
  strike and paired exhaust relationship without tracing schematic antler
  vectors. The sketch's angled hardware does not choose effect trajectories.
- Use only enough provisional light to judge how energy belongs to the equipment.
  Timing, strengths, balance and final FX remain open. Revisit the reported FX
  offset against explicit outlets when a useful physical reference exists.
- Flight and Motion instruments do not serve this construction question. The
  flight-scene-study skill applies later only if judging actual FX or another
  in-game scenario during flight. Static scale drawings do not need it.
- Keep all work inside the study. No production renderer, weapon implementation
  or living-spec changes are authorised by this continuation.

## Preserve what was learned

02.1's images are valuable evidence that recomposing engine language did not
construct a weapon. Preserve them. Keep 02.2's weapon exposition intact and
visible. Preserve 02.3's original rail-shroud example and its data: it established
a credible weapon assembly but did not settle plasma identity. Keep the external
references and supplied sketch with their provenance. Do not overwrite a retained
step with the new drawing or present a preference as acceptance of the whole form.

Study components live in
`apps/web/src/components/studies/plasma-projector-fitting-2026-11-17/`.
`FittingBench.svelte` and `form.ts` contain the retained 02.3 baseline; reuse shared
rendering integration without changing that historical geometry. Capture live
evidence before moving or reconfiguring it. The designer's preservation requests
take precedence over generic cleanup guidance.

Inspect the result in the rendered MDX page at 1280px or wider, run checks
appropriate to the change, and present the comparison for design judgment.
Passing code checks does not establish a successful form. Preserve unrelated
workspace changes and do not commit unless asked.
