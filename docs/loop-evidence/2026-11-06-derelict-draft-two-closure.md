# Derelict draft two — aborted

Date: 2026-11-06, Europe/Helsinki. Owner outcome: **failed loop, aborted**.
Registry representation: `stopped`, phase `exploration`. This is not acceptance
of the whole design or a finding that derelicts are infeasible.

## Intent, delivery and decisions

Translate the supplied Inkscape second draft into the game’s visual language,
preserving its silhouette and material colours. Two visible hulls and a dark
connecting structure surround a rotating hollow energy square with persistent FX.

- [Study](../../apps/web/src/pages/lab/studies/derelict-draft-two-2026-11-06.astro)
  retains 01, 02.1 and 02.2. The rejected 02.3 and its sole-use CameraBench were removed.
- Exact SVG paths were extracted into study-local geometry; the painter uses the
  production FX surface. Production salvage artwork was not replaced.
- Owner requested a slightly larger square and much larger glow; then a black
  centre while preserving the outer glow. After the correction: “This looks good now.”
- 02.2 compared 120, 240 and 420 logical-pixel derelicts beside production Wasp.
  Owner: “even the 120px feels a tad large”. No size was accepted.
- Owner requested Wasp and Fiddler at current close/far game zooms. 02.3 initially
  combined production camera levels with browser-window fitting in a study canvas.
- After feedback about the CSS container, the agent changed the reference viewport
  to paragraph width and retained cropped comparison panels. Owner judged the
  current step unusable and said the loop was about to fail.
- The agent then proposed an in-game trial in chat, asked whether to proceed or
  pause, and after further feedback proposed a reference image in chat. Neither
  recovery response delivered a replacement visual artifact.
- Final owner instruction: “this loop failed. the study must be completed as
  aborted.” Owner assessment: “The steps up to 2.2 were valuable, then we ended
  in model-fault-loop and the study stopped progressing.”

Owner clarification after closure: “as we could not visually compare live game
state changes - we ended discussing some completely irrelevant dom node placements
and rationales why some steps were taken.” The owner stated that neither topic
was relevant to the study. This clarifies the subject of the failure assessment:
loss of useful live visual comparison and diversion from design exploration.

## Final clarification and handoff

The owner subsequently clarified that the study's purpose is game design, not
page construction or explanations of earlier implementation choices. The owner
also corrected the restart framing: size is a supporting investigation, not the
larger design question.

At the owner's request, the restart prompt was rewritten around how the supplied
draft becomes a monumental, broken structure with energy still active inside,
preserving silhouette and colour language. Its scope includes appearance and
presence during play, the relationship between hulls and energy, and destruction
into physical shards with released energy to pursue. It carries forward valuable
work through 02.2 without accepting a size. The revised prompt was delivered in
chat; this records the handoff, not acceptance or completion of a third study.

On the final “close loop” request, HEAD remained
`09ab3e2ea4eda4c00610c098af7cc9016e8481f0`. New third-study files were present
in the shared working tree; their provenance and outcome were not investigated
and they were not modified as part of this closure. This record closes draft two
and its follow-up clarification only.

Final closure validation: local Markdown link targets and the draft-two registry's
stopped status were checked. No historical tests were rerun, no further design
experiment was performed, and no standing rule was promoted.

## Evidence and checks

Closure HEAD: `09ab3e2ea4eda4c00610c098af7cc9016e8481f0`. Dirty tree contained
numerous unrelated edits before and during this work. No study commit, push,
publication or deployment was made in this conversation.

Pre-closure file SHA-256 (not whole-tree verification identities):

- CameraBench: `9c07ba8a377f0d32bff14cf58475b08a9de84309adcbdf10969f656e8a0dafc2`.
- Study page: `c2177245355bfab756ac913b52117dbab2a5a8a03ee887f99ee10786606fcaa7`.

Conversation tool results, on evolving working changes:

- Initial type check failed on the Astro/Svelte no-props signature; repaired.
  Subsequent `pnpm check:types` passed, including the camera comparison before
  its final paragraph-width correction. `/tmp/derelict-camera-types.log` was
  directly inspected at closure: zero Astro/Svelte errors and warnings.
- Focused Biome checks initially found accessibility issues; repaired. Subsequent
  focused checks passed. These are not evidence of visual usefulness.
- `pnpm build` passed for the early artwork version, before later comparisons.
- Local Chromium checks at 1280 × 1000 checked pause pixel stability, keyboard
  resume and overflow; final camera check reported no page errors or overflow.
- Initial restricted browser launch failed with macOS permissions. Some later
  development previews were blank due to stale optimized dependencies; restarting
  the local server allowed subsequent checks to pass. Those failures are distinct
  from the owner’s rejection of the rendered comparison.
- No full gameplay, breakup, collision, release or sustained performance checks.
  Closure does not rerun historical checks.

Retained captures, inspected during the conversation and copied at closure:
[artwork](../../apps/web/public/studies/derelict-draft-two-2026-11-06/retained-artwork.png),
[02.2 comparison](../../apps/web/public/studies/derelict-draft-two-2026-11-06/retained-02-2.png).
The artwork capture is from the black-centre correction; the 02.2 capture uses
1280 × 1000 browser conditions. Neither image fixes an accepted encounter size.
Local scripts and overwritten captures remain under `artifacts/derelict-draft-two/`;
these ignored files and temporary logs are not durable historical run records.

## Gaps and closure boundary

No immutable full-tree fingerprint or per-iteration capture archive was retained.
Earlier checks cannot certify later changes. No internal model-state evidence exists.
The owner’s model-fault-loop assessment is recorded as their assessment, not a
verified internal causal explanation. No readiness or implementation scope resulted.

Closure changes: stopped metadata, outcome text, removal of the rejected viewer,
retention of useful captures, and this evidence record. Documentation/source-reference
validation only is appropriate for closure. Separately requested interpretation is in
[the analysis](../factory-building-lessons/2026-11-06-derelict-correction-loop.md);
it is not a standing rule or part of this evidence-only record.
