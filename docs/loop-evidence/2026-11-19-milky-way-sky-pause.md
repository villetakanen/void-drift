# Milky Way sky study · pause and approved closure

**Final status · accepted at scope.** The first entry records the earlier pause. The [closure entry](#approved-closure) records the resumed study and final decision.

## Earlier pause

19 November 2026. This closes the conversation’s development loop, not the study.
The designer paused the existing study in exploration and will continue it in a
fresh chat. Registry status is `blocked` (parked); no complete sky was accepted.

## Intent and agreed continuation

The original request concerned how a local star system feels situated inside the
Milky Way through panning, texture and the base sky drawing. Aesthetics and art
direction were to lead, with technical detail allowed to remain rough.

The designer agreed that the conversation had moved into tuning a treatment before
settling its art direction. They explicitly assessed 02.5–02.6 as conversational
oversteering outside section 01. Those steps supply no direction to inherit.
This assessment concerns the study’s trajectory; it is separate from whether the
examples rendered or their checks passed.

The clarified task is to continue **this same study**, with the same section 01,
retained decisions and bounded evidence, toward a coherent art-direction proposal
that can be judged as a whole. It is not a new study or a production integration.

### Agreed handoff prompt

> Resume _Inside the Milky Way_ at
> `/lab/studies/milky-way-sky-2026-11-19`. Continue section 02 toward a coherent
> art-direction proposal answering section 01. Preserve the bounded findings and
> working defaults. Steps 02.5–02.6 were conversational oversteering and supply no
> direction to inherit. Begin by stating the artistic intention for the next
> whole-sky example, grounded in the photographic references and retained evidence.
>
> Read the pause notice and retained record on the study page, this loop record,
> the design-study skill and project design guidance. The subject is the complete
> flight sky: composition, colour, texture and panning together, with aesthetics
> leading. Use the photographic Milky Way as the visual reference. Earlier examples
> are evidence with limits, not an implementation checklist. Individual star and
> near-star design remains outside scope. The current instrument displays excluded
> step 02.6 and is not an accepted starting artwork.

The study remains paused until the designer resumes it in the continuation chat.

## Delivered work and revision boundary

- [Study page](../../apps/web/src/pages/lab/studies/milky-way-sky-2026-11-19.mdx)
  and [validated registry](../../apps/web/src/data/studies.ts): part 01, independent
  question review, six exploration steps, feedback and pause assessment.
- Study wrapper (`MilkyWaySky.svelte` at pause)
  uses the shared Flight scene instrument, production Practice simulation and
  study-only sky painter. Pane retains production comparison, pan, brightness,
  identifiable-star switch and DS normal reset button.
- Sky painter (`sky.ts` at pause)
  prepares procedural artwork; flight drawing pans cached images. Current code is
  02.6, explicitly excluded as design direction at pause.
- [Retained assets](../../apps/web/public/studies/milky-way-sky-2026-11-19/):
  02.1–02.3 have still sequences at 0, 2.5 and 5 s; 02.4–02.5 have coast stills.
  These record appearance and positions, not continuous motion timing.

At closure HEAD is `7421c3c9d3ef1d2a20a6d73bf5d5185d30e65ec7`.
It already contains the initial study through 02.3. Subsequent study changes are
in the dirty working tree alongside unrelated concurrent project work. No commit,
push or deployment was performed as part of this closure.

Closure snapshot SHA-256 (identity only, not an exact historical tested revision):

- `sky.ts`: `47b3ea7476820a71e0423f5576ef7f8407669490c0ea22f90a863021b6874e94`
- `MilkyWaySky.svelte`: `dff243d5db579a90c90d687d64847593fca0a2808948aa9c527eb826e7f653da`

## Human decisions and their limits

The study page records the detailed feedback. Conversation sources, in order:

- **02.1:** “a complex form on the bg, makes it feel we are in space.” The
  designer wanted a more continuous stream, less overpowering light and some
  identifiable stars. This was not whole-sky acceptance.
- **02.2:** pan 65 stage px per 100 world u, stream 45%, stars on, fixed apparent
  scale and seed 191126 were accepted as working defaults. Brightness was right
  for that example; form, complexity and colours remained open.
- **02.3:** closer-to-reference natural colour made a substantial aesthetic
  difference. The designer observed that it could tolerate greater brightness
  while staying in the background, but explicitly kept defaults unchanged.
  A generally linear sweep, dark pockets and concentrated light needed a closer
  relationship to the reference. Star and near-star work remained outside scope.
- **02.4:** “something is off. cant tell what.” No cause was established.
- The designer later expressed an art intention: darkness should be “mysterious,
  chaotic, inviting,” with structure, contrast and shape. This is stated creative
  intent, not proof of an explanation derived from the excluded steps.
- **Pause:** “steps 2.5 and 2.6 are direct oversteering results from this chat.
  not exploration on 01.” Do not promote those examples or their proposed
  explanations into requirements.

## Checks and publication evidence

These are results observed in this conversation’s tool outputs, not rerun at
closure. Historical dirty-tree hashes and durable per-run reports are unavailable.

- Independent clean-context question reviewer: One subject, Grounded and
  Consequence passed before exploration; exact reasons are on the study page.
- `pnpm --filter web check`: final 02.6 run passed for 271 files, with zero errors,
  warnings or hints. An earlier 02.3 run failed on exponentiation syntax; that
  syntax was corrected and the subsequent check passed.
- `pnpm exec biome check .../milky-way-sky-2026-11-19 --write`: formatting applied;
  successful results recorded after corrections. Early button-type lint failure
  was corrected.
- `pnpm --filter web build`: passed during 02.3, producing 116 pages. This does
  not validate later 02.4–02.6 revisions.
- Browser inspection at 1280 × 900: each delivered example rendered; all offered
  burns replayed to tick 840 (14 s). Views, backward seek and pane interactions
  were exercised during the loop. These checks do not establish aesthetic merit.
- Final review used the shared Astro daemon at `http://localhost:4321`.
  `pnpm dev:ensure` returned ready. Earlier separate previews became unavailable;
  a shared-daemon restart and temporary dependency re-optimization resolved a
  Svelte hydration failure. The temporary optimizer option was removed.
- The shared planet HUD changed concurrently by 02.6; its larger labels and
  stronger markings limit comparisons with earlier captures. The sky study did
  not own that change.

## Evidence gaps and retention

There is no continuous motion recording for this study cycle. The retained stills
cannot establish the timing or aesthetic quality of a pan. The possible
presentation contribution to the fog impression remains unresolved. No performance
conclusion or production-readiness assessment was reached.

The 02.6 screenshot is only at temporary `/tmp/void-drift-milky-way-026.jpg` and may
expire. The live instrument is excluded 02.6; future shared simulation or renderer
changes can alter it. No historical check was rerun solely for closure. This record
collects evidence and explicit decisions; it derives no general lesson or process
change.

## Approved closure

19 November 2026. The designer selected the 02.14 model for the next version of the distant flight sky, asked for a design readiness assessment and a delivery hypothesis, then instructed “close as approved, close loop”. The [study](../../apps/web/src/pages/lab/studies/milky-way-sky-2026-11-19.mdx) and [registry](../../apps/web/src/data/studies.ts) now close at scope with status `accepted`.

- **What carried the coast.** In 02.8 the designer found that the straight reach and turbulent darks still gave the coast a landmark with stream brightness at 30%. The working settings carried forward at 45% and 65 stage pixels of travel per 100 world units. In 02.9 the recognisable star pair added nothing the designer wanted. In 02.10 they endorsed the whole composition through the widening camera. Section 02.11 preserves the distinction that prompted the second pause.
- **What the designer chose.** The three local forms in 02.13 established the Narrows–Practice–Broad reach spectrum. Section 02.14 explored position, rotation and pattern zoom on the same Practice flight. The selected model gives each generated system a repeatable view between those examples, with a seeded heading over 360° and a scale of 80–120%. The retained [Narrows coast](../../apps/web/public/studies/milky-way-sky-2026-11-19/0214-narrows-coast.jpg) shows one authored placement at 100%. The [study media](../../apps/web/public/studies/milky-way-sky-2026-11-19/) also include the three reference sightlines and the earlier departure recordings.
- **Delivery boundary.** Section 04 proposes a fixed Practice sky first and generated sightlines second. Those estimates remain hypotheses. Generated arrivals, their distribution and production preparation time and memory have yet to be observed. Star detail and internal contrast remain open refinements.
- **Retired example.** The closed page presents the final still and earlier motion evidence as static MDX. The exact [sky painter](2026-11-19-milky-way-sky-source/sky.ts.txt) and [instrument settings](2026-11-19-milky-way-sky-source/MilkyWaySky.svelte.txt) at retirement are preserved as text for the design handoff outside the application source tree.
- **Earlier verification.** The resumed conversation reports `pnpm --filter web check` passing with zero warnings or errors at readiness. The earlier 02.14 local Chrome checks covered the three sightlines, manual placement, zoom limits, resets and all three burns. Those checks concerned the authored Lab example. Their temporary scripts and screenshots have no durable per-run report.
- **Revision and publication.** Local working tree based on `7421c3c9d3ef1d2a20a6d73bf5d5185d30e65ec7`. The closed MDX has SHA-256 `f64fa5cd5290f93a8eed661588f2e701fd4386f17a292d1959bc74a133c8d20e`. Commit, push and deployment were outside this closure. Production implementation remains separate.
- **Closure verification.** Local Chrome at 1280 × 900 with JavaScript disabled opened the accepted entry from the study index, displayed the final still at its 1280 × 901 source size, found sections 03 and 04 and served all 23 referenced media URLs. The page contained zero hydrated instruments. The temporary command was `node /private/tmp/milky-closed.cjs` against port 4321 on the closed working tree. The scoped `git diff --check` passed.
