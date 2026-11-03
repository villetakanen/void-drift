# Utilities study — failed and closed

Closed 2026-11-02 during exploration by explicit owner instruction: **completely failed**. Registry status is `stopped`; no design was accepted for implementation. This record collects evidence, not causal lessons or process changes.

## Intent and boundaries

Explore energy storage, solar charging, a new gravity charger and automatic repair: their contributions, low-poly appearance, and placement above/below ships. Every chassis has an invisible internal battery; visible storage is optional extra capacity. Each ship has solar or gravity charging depending on type. Exploration concentrated on extra storage; the other three utilities did not receive concrete exploration.

Sources: owner messages in this chat; retained [study page](../../apps/web/src/pages/lab/studies/utilities-2026-11-02.astro), [registry](../../apps/web/src/data/studies.ts), and components in `apps/web/src/components/studies/`. Local review route: `/lab/studies/utilities-2026-11-02`.

## Delivered exploration and feedback

- 02.1: Light/Heavy box-like storage above and beneath a Fighter hull. Owner rejected the aesthetic and identified utility-slot placement as a concern following engine changes. The fixture used an illustrative mount and omitted engines; it did not verify production clearances. Moving a slot forward remained a possibility.
- 02.2–02.3: industrial machinery discussion and exposed cells versus a surrounding frame. Owner preferred A, exposed machinery, and allowed bulky equipment to change ship character. Color was not settled.
- 02.4: nine exposed constructions. Pancake stack was selected for further inquiry. Open helix and unequal pair later received positive small-scale industrial-character feedback, but did not communicate an energy reserve to the owner.
- First 02.5: three/four discs in rounded, beveled and angular profiles. Owner said these lost the multiple-part construction and looked like “databases on some sort of a stick.” A close-packed revision was also abandoned. Both were removed at owner request.
- Replacement 02.5: nine technical stacks. Owner liked 03 External bus and 07 Insulated layers; 09 Contact shoes looked good small. These were preferences, not whole-design acceptance. Orange was excluded; yellow, brand lime-yellow and Android-like green remained candidates.
- First 02.6: flat hexagonal chambers/lattices. Owner requested complete removal and retained only the paragraph recording the preceding preferences.
- Discussion clarified science-fiction energy stored in surfaces, fields or lattices, not electrical batteries; deliberate rugged equipment or scientific apparatus, never improvised; substantial enough for battleships. Storage should not blink, animate or reveal charge to opponents. Charger/repair animation was not settled by that decision.
- Second 02.6: nine lattice-plate, deep-cell and paired-surface constructions. Owner: “the second time we completely failed 2.6”; drawings no longer related to the original design problem. These drawings were subsequently removed.
- 02.6 was replaced with a written recovery proposal anchored to exact 02.5 references. No recovery comparison was delivered. Owner reported no progress and moving backward, then explicitly closed the study as completely failed.

Retained components: `UtilityStorageComparison.astro`, `StorageConstruction.astro`, `ExposedStorageNine.astro`, `TechnicalStorageNine.astro`. Removed constructions are not retained in source. Earlier rounds are collapsible; closure is visible on the page.

## Interpretations and unresolved work

The assistant attributed the drift to changing geometry, viewpoint, proportions and visual language simultaneously, and to interpreting lattice language literally. These are assistant hypotheses, not investigated causes or adopted lessons. No factory rules, skills, product principles or production behavior were changed by closure.

Unknown: a convincing physical construction, final material/color, Light/Heavy sizing and mass, capacity, fitted placement, in-game readability, charger/repair designs and their mechanics. Positive preferences do not establish that these problems were solved. Automated correctness did not establish aesthetic success.

## Revision and publication

Directly inspected at closure: HEAD `4fa66afba7c09b83f4a9b2bf0144c189700999b6`, with uncommitted registry changes and untracked study page/components from this chat. No study commit, push, deployment or live verification occurred in this chat. Closure adds this record and updates local metadata/page only. Unrelated production changes are not part of the record.

## Check evidence and gaps

Directly inspected report: [quick verification, 2026-11-02T13:19:38Z](../../artifacts/verification/2026-11-02T13-19-38.560Z-noOrHn/report.json), on the above HEAD and dirty source fingerprint `532f7cd413525b1b7f82fface43feb9b8cf22f4daffa4eb4704a1a4cb088f784`, Node v24.14.0, darwin/arm64. Contracts, lint, types and unit tests passed. This was **partial** verification of the early fitted comparison; commit checks, build, browser suite, rules and competition were skipped. It does not validate later iterations or closure.

Prior chat tool outputs record an initial formatting/import-order failure, subsequently repaired. The first browser launch failed with an OS permission error; a later authorized launch succeeded. Iteration builds and targeted Biome checks passed at their respective dirty states. The latest pre-closure build log `/tmp/utilities-reset-build.log`, directly inspected, reports 45 pages built successfully; its exact source fingerprint was not retained.

Browser screenshots were inspected during individual visual rounds, including rejected rounds. They establish rendering availability only. Temporary examples include `/tmp/technical-nine.png` and `/tmp/energy-lattice.png`; these and `/tmp` build logs are not durable evidence. Ignored verification artifacts may also be lost. The retained source and feedback summary are the durable record. No full final verification or successful human design review is claimed.

Closure validation is limited to changed documentation/page/metadata formatting and diff checks. No historical test is rerun to fill an evidence gap. Readiness and scope were not reached; no separate completed study-quality evaluation is claimed.
