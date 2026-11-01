# Plasma behaviour study — closure evidence

Closed 2026-11-01 during exploration: **unconcluded and broken**, by explicit owner instruction. This is a bounded evidence record and extraction, not the requested later causal investigation or a factory-quality certification.

## Intent and scope

Study plasma behaviour before graphics, in an isolated worktree while another agent released the game. Explore delayed response as the price of stronger propulsion. Preserve useful results despite failure to settle the main question.

Source: this chat’s owner instructions and feedback; retained page at `apps/web/src/pages/lab/studies/plasma-behaviour-2026-11-01.astro`, local route `/lab/studies/plasma-behaviour-2026-11-01`.

## Sequence and human assessment

- Original 02.1 was rejected for insufficient depth. Owner requested the fission configuration study’s presentation and allowed removal of the failed visuals.
- Revised 02.1 compared six loadouts on a common fourteen-second sequence. Owner: “.1 is success”. This accepted the comparison’s usefulness, not final tuning.
- 02.2 varied delay. Owner requested stabilizers in both examples, a 0.10–0.99-second slider, static paths and faster processing. These corrections were implemented and recorded on the page.
- Owner found even 0.10 seconds interesting and little further handling difference around 0.34 seconds and above under the tested acceleration/speed conditions.
- Owner moved diminishing returns and maximum speed to a provisional generic chassis model using the ion curve. Final force-combination semantics were not settled.
- 02.3 compared Light-ion sides with one Light, Heavy, current-force Plasma or adjustable Plasma aft. Assistant initially replaced the common sequence with a six-second straight burn. Owner asked where the sequence/path was; assistant restored the fourteen-second fixture.
- Owner raised force addition, acceleration and maximum speed as an unresolved design problem. Assistant added 02.4, separate acceleration-versus-speed rows with fixed/fitted mass and charging controls.
- Owner’s final assessment: “we are not getting anywhere here” and “end the study as unconcluded and broken”. Owner described the work since 02.2 as unproductive and repeated presentation invention as a problem, despite sensible formats established in earlier studies.
- Owner also described failure as useful evidence in learning to build a design factory. This does not constitute acceptance of the later propulsion examples.

## Extraction and boundaries

Useful: 02.1 comparison format/configurations; bounded delay observation in 02.2; intermediate ownership decision for generic chassis speed returns/max.

Unresolved: final plasma delay and force, mixed-engine combination semantics, energy balance, charge decay, and readiness for production. The aft escape role is a candidate direction. Neither 2× Light force nor the later bench’s calculations were accepted as final behaviour.

The owner requested an integration-candidate review, a separate flight-bench design study based on earlier successful presentations, and a later investigation into this failure. These are requested follow-ups, not lessons inferred by this record. No new standing rules or skill changes are made.

Assistant’s prior explanation that it built tools before establishing a clear decision question is an attributed hypothesis only. Causes have not been investigated.

## Source and revision state

Directly inspected at closure: worktree `/Users/ville.takanen/.codex/worktrees/plasma-behaviour-study/void-drift`, HEAD `419e6379c51733eba9fd6ccf6dc9b3230908b50f`, with uncommitted study changes. No study commit was created in this chat; no push, deployment or production integration was performed here.

Changed tracked files before closure: `MovementBench.svelte`, `apps/web/src/data/studies.ts`, and `packages/mode-a/src/lib/build-flight.ts` (optional part-catalog injection; default production callers retain existing behaviour).

New study sources: `plasma-bench.ts`, `plasma-escape.ts`, `PlasmaEscape.svelte`, `force-composition.ts`, `ForceComposition.svelte`, and the study page, under `apps/web/src/components/studies/` or `apps/web/src/pages/lab/studies/`. New tests: `plasma-study.test.ts`, `plasma-escape.test.ts`, `force-composition.test.ts` under `packages/mode-a/src/lib/`.

Closure changes mark metadata closed, add the visible human assessment/extraction/follow-up brief, and replace the pending readiness placeholder with explicit non-completion. Experiments remain inspectable. No tuning values or production simulation behaviour are changed by closure.

## Verification evidence and limits

Prior tool outputs in this chat, on the then-current dirty worktree:

- Restored 02.3: `pnpm exec vitest run packages/mode-a/src/lib/plasma-escape.test.ts` passed 3 tests; `pnpm lint`, `pnpm check:types`, `pnpm build` passed. Browser inspection checked static paths and force slider, including 10× and restored 2×.
- 02.4: `pnpm exec vitest run packages/mode-a/src/lib/force-composition.test.ts` passed 2 tests; lint, types and build passed. A later equation-parenthesis correction passed targeted Biome and `git diff --check`. Browser controls confirmed fitted masses, plasma charging, and speed endpoints.
- Intermediate lint failures (ARIA semantics and formatting) were repaired before those reported passes. They are not evidence of design success.
- Earlier 93-test pass is reported in the compacted session history, not independently re-established for closure.

No full end-to-end suite or human approval of final game behaviour is evidenced. Exact dirty-tree hashes, permanent check logs and screenshots were not retained for each iteration; temporary tool outputs and the local development server are not durable artifacts. The straight-burn implementation remains in source, but its original UI was replaced. The rejected initial 02.1 visuals were removed at owner request.

Only documentation/metadata validation is appropriate for this closure; later checks cannot establish historical results. No historical tests are rerun solely to fill gaps.

## Pending investigation

Preserve the request/correction sequence above for a later close-loop analysis. Questions supplied by the owner: why did the work repeatedly become presentation ping-pong; why were established formats not reused; why did successive examples fail to support design discussion? Answers, causal claims, factory lessons and changes to process remain open.
