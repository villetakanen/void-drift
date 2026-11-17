# Earth study — closed evidence record

Initialised and closed 15 November 2026 at the designer’s request. Final status:
stopped in exploration; designer assessment: failed, “model collapse.” This
record covers reference discovery, design steering and the interrupted 02.10
attempt. It is not gameplay-test evidence or an overall model evaluation.
Earlier sections preserve the assessments made while the study was open.

## Intent and boundary

Find reference material for one convincing, inhabited Earth in Practice beside
Mercury and Venus. The investigation moved from atmosphere/surface comparisons
to photographic references, cloud-free maps and climate projections, authored
depictions, cartography, generated appearance sketches and named game examples.
On 15 November the designer judged the evidence sufficient and requested a
composition recap rather than further collection. The limited period-game
survey is explicitly left unrepaired in this cycle.

## Retained evidence

- [Study and retained findings](../../apps/web/src/pages/lab/studies/earth-2026-11-14.astro),
  especially 02.3–02.8. This file was inspected directly when initialising the record.
- [02.3 sources](../../apps/web/public/studies/earth-2026-11-14/references-02-3.json),
  [02.4 sources](../../apps/web/public/studies/earth-2026-11-14/references-02-4.json),
  [02.5 sources](../../apps/web/public/studies/earth-2026-11-14/references-02-5.json),
  [02.6 prompts and assets](../../apps/web/public/studies/earth-2026-11-14/references-02-6.json),
  [02.7 sources](../../apps/web/public/studies/earth-2026-11-14/references-02-7.json).
  These preserve selected sources and outputs, not a complete search history.
- Conversation feedback, paraphrased: the designer repeatedly redirected the
  work towards more references, cloud-free surfaces, alternatives to scientific
  imagery, maps and game depictions before proposing a layer composition.
- Counterevidence retained: the designer found 02.3 particularly useful,
  preferred the restrained appearance of 02.4 A/B/E/F, and judged all nine 02.6
  sketches significantly better than the originals. Research produced valued
  material despite the reported discovery limitations.

## Reported findings and interpretation

The designer’s 15 November assessment is that concept and reference discovery
within the current harness is difficult and strongly human-centred, even with
the high-capability models used here, because supporting harness tooling is
missing. This is the designer’s interpretation, not an independently established
causal finding or a comparative model evaluation.

The designer also reported that the period-game search followed the named
examples too literally instead of providing a broad search of the era. The
retained 02.7 board covers those named franchises; it does not establish broad
coverage. The decision is to acknowledge this gap without repairing it now.

The conversation records inaccessible source hosts and uncertain capture
provenance during collection. Those observations do not, by themselves, prove
which tooling would improve conceptual discovery or why the search was narrow.
No new skill, requirement, process change or generalized signal is adopted by
this record. No external feedback has been sent.

## Subsequent framing clarification · 15 November 2026

In a discussion pasted back from another chat, the designer questioned whether
01 and 02.8 had drifted towards an accurate depiction of the actual Earth instead
of Earth as a prototype for Earth-like planets. The designer clarified the target
as an arcade-recognizable Earth within Void Drift’s design language and requested
both questions be retained in 01. Direct inspection on resuming this chat found
the earlier actual-imagery requirement and continental-proportion wording still
present; the announced amendments had not landed in these files.

01, 02.8 and the registry were reconciled with that instruction. The discussion
proposes framing drift as a possible contributor to discovery difficulties, not
an established sole cause. This provides an additional interpretation alongside
the earlier tooling assessment; neither is established by a comparative study.
The useful reference findings and the open status of this record are retained.

## Assessment after 02.9 · 15 November 2026

The designer explicitly requested retention of 02.9 and reported being very
happy with the learning and inspirational progress, while finding that none of
the examples so far conveys an inhabited planet with an atmosphere belonging
in Void Drift. The number of steps is not a concern; a much longer study would
be acceptable. Earlier positive judgments of individual references and sketches
remain intact and do not imply acceptance of a game design.

The designer’s interpretation is that the exploration has concentrated on
individual rendering details before establishing how the game looks as a whole
and how this planet belongs in it. The designer considered 02.8 useful for
exposing this, and 02.9 useful evidence that returning to the same kinds of
image adjustments did not resolve it. The designer also connected this concern
to the Mercury study and the design skill. That broader interpretation is
recorded here as feedback, without a new audit of Mercury or a change to the
skill. This is design-review feedback, not gameplay-test evidence.

The retained 02.9 comparison and its provenance are in
[the study](../../apps/web/src/pages/lab/studies/earth-2026-11-14.astro) and
[the source manifest](../../apps/web/public/studies/earth-2026-11-14/references-02-9.json).
The study now records this assessment alongside the comparison. No variant,
next renderer, general process rule or closure is adopted by this entry.

## Revision, checks and publication

Repository HEAD at initialisation:
`dd568eea5255c418e502d488383235867903563d`.
The Earth study page, review, components and assets were untracked working-tree
additions; `apps/web/src/data/studies.ts` was modified. HEAD alone does not identify
the studied outputs. The source manifests contain hashes for many retained assets.

Prior conversation reports record successful contract checks and 1280px browser
inspection of the research boards. Those reports are historical claims here;
the temporary browser scripts/captures are not durable check artifacts. A prior
Astro check reported an unrelated Practice page type error. No tests are rerun
to fill those historical gaps as part of this evidence record.

No commit, push or deployment was performed for this initialisation. The study
has been presented through the local development server. Documentation validation on 15 November: `node scripts/check-contracts.mjs`
passed (reported zero missing Markdown targets). The record’s relative file links
were also checked directly and resolve. No production or gameplay checks were
performed as part of this pre-closure record.

## Gaps and retention limits

No exhaustive search log, coverage benchmark, recorded model configuration,
alternative-harness comparison or attribution of time to human versus agent work
is available in the retained artifacts. Source selection and useful discoveries
are inspectable; research completeness and the causal effect of missing tooling
are not established. The exact proposed tooling is still unspecified. This record
does not certify a final Earth design. The loop is now closed by the explicit
designer decision recorded below.

## Closure decision and interruption

The designer subsequently clarified the reason for ending this cycle: the model
started over-correcting and looping on irrelevant details. This is the stated
reason for termination. The cycle was not ended because the number of steps was
too large, the references had no value, or the planet concept had been ruled out.


The designer said: “ok, declaring this failed. model collapse. close loop”.
Immediately beforehand, the designer stopped work, described “a model loop
fault mode”, and identified oversteering from their tentative suggestions.
The assistant had acknowledged those ideas as tentative but proceeded to build
02.10 using an existing rocky body, atmosphere marks and settlement lights.
These actions and statements are visible in this conversation. “Model collapse”
is retained as the designer’s assessment, not an independently diagnosed cause.

No design variant or implementation was accepted. The concept of inhabited
Earth-like planets is not ruled out by this stopped study. No further exploration,
skill amendment, process adoption or external feedback follows from this closure.

## Closure changes and verification

- Registry status changed from open to stopped, phase remains exploration.
- Study page now states the failed outcome prominently and retains the useful
  references, sketches, framing changes and 02.9 assessment.
- 02.10’s unreviewed scene and unfinished component were removed; a short
  interruption record remains. No new rendering work was completed for closure.
- Existing 02.2 and three 02.6 boards were captured at closure, at 1280px in
  Chromium, before retiring their renderer. Files `02-2-closure-1.png` and
  `02-6-closure-1.png` through `02-6-closure-3.png` are under the study’s public
  asset directory. These are new preservation captures, not proof of earlier
  appearances. The existing `02-9-comparison.png` was retained.
- The study-only `EarthReferences.svelte` and `InhabitedScene.svelte` components
  were removed after checking consumers. Shared production components remain.
- Before interruption, `pnpm --filter web check` failed on the unfinished
  InhabitedScene hydration prop and the pre-existing PracticePlanets hydration
  prop, with an authored-materials async hint. This is the actual run reported
  in this conversation; no full application check was rerun to reconstruct it.
- The interrupted browser script saved one temporary scene capture, then timed
  out clicking the Approach radio because its label span intercepted the click.
  Keyboard and remaining-state verification did not complete. This does not
  establish a user-facing control defect. The temporary capture was not retained
  as a reviewed design result.

Closure remains a working-tree change on the HEAD recorded above. No commit,
push or deployment was performed. The study is locally available through the
existing development server. Documentation/render verification results are
recorded below; they do not change the designer’s failed assessment.

Closure validation on 15 November: Biome passed for the changed study page and
registry; `node scripts/check-contracts.mjs` passed, including zero missing
Markdown targets. A Chromium inspection at 1280×1000 confirmed the stopped
status, no remaining canvases, no page errors and no horizontal overflow.
Retained images decoded successfully after explicitly loading lazy images in
closed sections. The initial image check had counted unloaded lazy images as
broken; the decoding check resolved that ambiguity. The closure heading and a
retained comparison were visually inspected. Scripts and screenshots for this
validation are temporary (`/tmp/earth-closure-check.mjs`, `/tmp/earth-closed.png`);
the preservation captures named above are durable study assets. No gameplay,
performance or full application suite was run for closure.
