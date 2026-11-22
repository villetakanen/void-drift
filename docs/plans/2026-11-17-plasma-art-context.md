# Plasma fitting: recover the context behind the artwork

17 November 2026. Research within the open plasma fitting study, following review
of 02.23. This note separates the designer’s clarified intent, recorded study
decisions and a proposed diagnosis. It does not amend project specs or promote a
new drawing procedure. No new weapon form is selected.

## Clarified artistic intent

The designer describes deliberate artistic liberties: simplify, omit and exaggerate
so a small number of drawn features suggests a more elaborate technical object.
The desired effect is a convincing, cool piece of space machinery whose apparent
richness exceeds its literal detail. Appleseed, Ghost in the Shell and Gundam were
named as references for this selective technical suggestion. These names identify
the intended sensibility; no particular design, scene or rendering treatment from
those works has been selected or analysed here.

The physical channel in the supplied manual SVG and its established source-art
scale remain selected. A charging chamber makes sense as the rear’s role. Its
form, blue supporting assembly and connection to the channel remain unresolved;
exhaust pipes remain deferred. The source drawing was made beside actual item
sources, so its scale is not an untested assumption.

The designer requests retaining 02.23: it demonstrates that reproducing the palette
and recognisable part motifs does not recover the contextual reasons behind the
art. Neither its chamber nor any of its eight assemblies is accepted.

## What the earlier studies actually establish

### Wasp: a continuing surface needs more than matching colour

[Wasp 02.1–02.6](../../apps/web/src/pages/lab/studies/lhi-wasp.astro)
starts from a supplied silhouette, slots and stabilizer positions. The selected
Gull-wing 08 carries a particular nose, forward cockpit and three-ribbon wing
structure. Rear development separates a slender chassis from outboard wings;
the tail is simplified while retaining its waist crease and central wedge.

The decisive 02.5–02.6 refinement concerns the side and rear winglets. Their
matching shades suggested the same level and angle, but a point-sized connection
and differently angled trailing edges disrupted that reading. The selected 06.9
combines a broader physical bridge with parallel trailing edges. The
[comparison geometry](../../apps/web/src/components/studies/WaspAb306Refinements.astro)
records those changes explicitly. Colour, contour, shared edges and surface
continuity work together here; “add another pale polygon” does not describe the
construction.

### Fiddler: copying polygons can lose the form they describe

[Fiddler 02.3–02.7](../../apps/web/src/pages/lab/studies/lhi-fiddler-2026-11-03.astro)
contains a close precedent for the current problem. Its early volume comparisons
could not be judged because surfaces did not explain raised body, thin wing,
bevel or continuous deck. Copying Wasp’s bow and canopy outlines was insufficient.

The useful isolated explanation continued Wasp’s ridge and sloping sides along a
blade. Its next correction was equally important: the intended source included
the nose, bend, longer side and complex inner contour beside the cockpit. Filling
that opening and mirroring the exterior into a closed solid lost the reference.
An added return wall was rejected; the triangular root preserved resemblance.

The study’s angled construction uses an **illustrative height**, not recovered
Wasp measurements. Its purpose is to explain the top drawing. The
[extracted side](../../apps/web/src/components/studies/fiddler/wasp-side.ts)
retains the original contours. This supplies a way to discuss implied sections
without turning production artwork into a requirement for a fully specified 3D
model.

### Engines: a functional image first, then selective reduction

[Engine identities 02.2–02.9](../../apps/web/src/pages/lab/studies/engine-identities.mdx)
first establishes shared light, charcoal material and actual hull layering.
Ion’s straight output informs its axial needle. Fusion’s pulse character is
expressed by separate feed machinery and reaction chamber, with an open gap and
paired struts. Plasma develops from containment into the preferred bottle and
short coil throat, then removes valves, tank straps, side fittings and the body
indicator. Broad planes, an integrated armor edge, two coarse bands and an outlet
remain.

This was selection and reduction of a particular compelling assembly, rather than
a finding that canisters need many fittings. The engine’s bulk, whole silhouette
and outlet are not instructions for this weapon. Its chamber drawing is a source
for material and volume treatment. The manual channel already carries the coarse
banded treatment into its connector.

### Utilities and Potential Well: substance, fictional identity and useful gaps

The closed [utilities study](../../apps/web/src/pages/lab/studies/utilities-2026-11-02.astro)
had useful comparisons of exposed vessels, a helix, separate surfaces and major
and minor working parts. Its later reduction of a fictional lattice to repeated
hexagonal shapes did not establish convincing construction. The subsequent
[failed utility-language study](../../apps/web/src/pages/lab/studies/ship-utility-language-2026-11-02.astro)
explicitly contrasts that earlier substance with bars carrying bright edges.
Neither failed study establishes an accepted universal construction rule.

[Utility machinery](../../apps/web/src/pages/lab/studies/utility-machinery-2026-11-02.astro)
separates family character from the eventual clear structural accent. The family
permits different silhouettes. Its resting drawings are a bounded acceptance,
not evidence that the same bridge belongs on every kind of machinery.

[Potential Well 02.1–02.8](../../apps/web/src/pages/lab/studies/resource-capacity-2026-11-02.astro)
settles an evocative fictional identity—multiple containment units holding
potential—while deliberately leaving the science unexplained. Layered rims and
bevelled rails are rejected as artificially extruded. Broad slopes around dark
recesses, straight underlying rails and close coupling replace them. The final
refinement removes projecting yellow extensions while keeping inter-well
connections and a grey lattice. This supports technical suggestion through a
few meaningful relationships, without a scientific cutaway or exhaustive hardware.

### Coil: graphic connection is enough; face direction still matters

The stopped [coil study 02.6–02.7](../../apps/web/src/pages/lab/studies/gravity-coil-2026-11-03.mdx)
explicitly says the equipment must look convincing rather than physically
realistic. Connections should read as deliberate paths; they need not explain a
mechanically complete assembly. Narrow ribbons, swept paths and quiet returns
are retained for exploration after raised blocks and offset extrusions failed.
Its 02.12 finding also says removing detail alone did not resolve belonging.

The accepted [coil-form study 02.2–02.5](../../apps/web/src/pages/lab/studies/gravity-coil-form-2026-11-03.astro)
explains a crest between outside and aperture-facing slopes. A broad inward face
can catch light on the drawing’s lower right because of its orientation; that is
not automatically incorrect lighting. The selected construction eventually keeps
E’s sectors and adds a continuous lower ring **inside** the silhouette, visible
through gaps. The exposed outer rims are not selected. A concealed relationship
can unify an object without adding a visible border around it.

These coil findings are scoped: they do not prohibit every equipment base. The
point-defence turret has an explicitly accepted round base.

### Cannon and point defence: supplied visual solutions, not generative recipes

The [ion cannon study](../../apps/web/src/pages/lab/studies/light-ion-cannon-2026-11-08.astro)
begins with a near-final supplied drawing. It establishes fitting, size and shot
behaviour around that form; it does not demonstrate that a barrel plus cyan
blocks plus a crossbar is a sufficient recipe for designing any weapon.

[Point defence](../../apps/web/src/pages/lab/studies/ion-point-defence-2026-11-08.astro)
also starts with a supplied adaptation of those parts. Its marked base makes
turning visible while the base lighting stays with the ship. The retained parts
have a specific reason for their arrangement and a particular event to express.
Their successful use does not establish a mandatory blue frame for plasma.

## Proposed diagnosis for 02.23

These are interpretations to discuss, not demonstrated causes or new project rules.

1. **The implied section is missing.** Labels such as “shoulder” and “canister”
   have substituted for a clear account of which face rises, which falls away,
   where the ridge goes and which contour continues through the joint. The Wasp
   and Fiddler provide worked examples of those relationships.
2. **Graphic licence has been replaced by mechanical explanation.** An exploded
   neck-and-cradle diagram addressed physical completeness while the desired
   image remained unresolved. The coil’s recorded distinction directly challenges
   that approach. A clear connection can be suggested economically.
3. **Surface colour has become a part label.** “Pale left, blue right, cyan bar”
   does not explain the orientation of each face, its relation to an opening,
   the relative heights or the intended material contrast. Matching hex values
   cannot settle that construction.
4. **The hierarchy and technical cues are undecided.** The selected channel is
   the working feature. The rear must support its character and suggest charging
   without becoming a collection of equally prominent shapes. A collar edge,
   recess or interrupted surface may imply machinery; which cue serves this
   particular weapon has not been established. More details or more silhouettes
   cannot substitute for that decision.
5. **Reference intent has been flattened into a parts list.** The source studies
   distinguish thin wings from tall bodies, meaningful gaps from decoration,
   contained volume from visible working surfaces, and drawn forms from fitting
   markers. Those distinctions need preserving alongside the colours and paths.

## What the documentation contains and what remains to recover

[Ship drawing](../ship-drawing.md) already states character, solid objects,
planes from edges, shared light and restraint. [Weapon drawing](../weapon-drawing.md)
already distinguishes working part, housing and attachment. The missing layer is
not another generic instruction to use facets. It is worked visual context:
which existing edges describe which surfaces; how continuities and openings
carry identity; and which simplifications were intentionally retained or rejected.

A reusable addition should pair each claim with an annotated existing example and
its decision scope. Useful first cases are Wasp’s unpinched winglet bridge,
Fiddler’s preserved inner contour, the coil’s inward-facing slope and hidden ring,
and the canister’s removal of small fittings. The designer’s selective technical
suggestion belongs beside those examples. No standing-guide changes are made by
this note; the exact reusable wording and its scope remain for review.

The next useful investigation is to annotate existing accepted artwork and the
manual channel’s implied surfaces before proposing another rear. A small section
sketch may explain a relationship, with its depth explicitly illustrative.
The resulting image should establish a local drawing interpretation, not require
a measured 3D reconstruction. 02.23 stays visible as the unresolved comparison.
