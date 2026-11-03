# Ship utility language — failed and closed

Closed 2 November 2026 by explicit owner instruction. Registry status: `stopped`, phase: `exploration`. The owner judged the study completely failed; no utility design was accepted. Closure is a valid workflow outcome, not a claim of design success. This record collects evidence; prompt development is a separate requested discussion.

## Intent and scope

Study the visual language of energy storage, solar charging, gravity charging and automatic repair together, with eventual room for a large family. Initial brief required convincing exposed machinery, gameplay-size readability, enlarged physical construction, and actual ships, engines and mounts. Production implementation and balance were excluded.

The owner later clarified the immediate priority: utilities that look good alongside established ships and engines and feel like machinery from the same world. Distinguishing functions and variants was deferred as an entry requirement. The final page and registry reflect that question.

Sources: owner feedback in this chat; [study page](../../apps/web/src/pages/lab/studies/ship-utility-language-2026-11-02.astro), [registry](../../apps/web/src/data/studies.ts), [opening comparison](../../apps/web/src/components/studies/UtilityLanguage.svelte), [replacement comparison](../../apps/web/src/components/studies/UtilityBelonging.svelte). Local route: `/lab/studies/ship-utility-language-2026-11-02`.

## Delivered work and human judgment

- Initial framing led to an industrial-banks versus scientific-assemblies comparison across four functions. Reused the production Lance and Light ion engines at hull-0; showed small and enlarged views. Some variant pairs repeated unchanged. Owner found the examples hard to read, unrelated to the game's aesthetic, and without a useful basis for comment.
- Assistant proposed pausing exploration and repairing the method. Owner requested inspection of the preceding closed study, identifying work through 02.4 as useful. Earlier 02.3–02.4 were inspected as references for physical substance, not accepted designs. The earlier study remained closed.
- Owner clarified visual belonging as the primary question. Several chat turns discussed recovery. Owner explicitly requested concrete answers on the page rather than more process explanations.
- Replacement 02.1 showed four faceted device constructions in pale alloy/dark surfaces and graphite/yellow surfaces, geometry held fixed between treatments. Enlarged objects, fitted Lance, and unfitted/fitted flight-scale pairs were delivered. Actual hull-0 coordinates were retained; body overhang was labeled as a proposal, not validated clearance. The first comparison was preserved collapsed.
- Owner then explicitly closed the study as completely failed, describing the trajectory as “from not that bad to completely and utterly bad.” No member, material treatment, family rule or mounting proposal was accepted.

The owner's interpretation is that corrective turns can increase drift, with a similar experience after 02.4 in the preceding study; the owner attributes concern to harness/prompt/task rather than agent effort. That interpretation is recorded, not established as a causal finding. Assistant explanations about premature geometry or drawing recipes were hypotheses, not investigated causes or adopted lessons.

## Revision and publication

At closure, directly inspected HEAD: `4fa66afba7c09b83f4a9b2bf0144c189700999b6`. Both cycles' files coexist as uncommitted/untracked work; the earlier artifacts predate this cycle and were preserved. No commit, push, deployment or live release verification was performed for this cycle. Examples were served locally and screenshots shared in chat. Closure changes only this record, study status and closure text.

## Checks and evidence limits

Directly inspected [final quick report](../../artifacts/verification/2026-11-02T15-11-09.816Z-Sveepw/report.json): contracts, lint, types and unit tests passed at dirty source fingerprint `0d403a26abc90a66f2d647b78c4609a0ce9054df6f6daef18e816187d1d81540`, on the above HEAD, Node v24.14.0, darwin/arm64. This was partial verification. Commit checks, build, browser suite, rules and competition were skipped. It predates closure and does not establish design quality.

Directly inspected [preceding quick report](../../artifacts/verification/2026-11-02T15-10-11.564Z-6xbLWg/report.json): lint failed on an iterable callback return; contracts, types and tests passed. The callback was repaired before the final quick report. Earlier chat outputs also record a nullable-context type failure in the opening comparison, then a passing quick run after repair.

Browser inspection and screenshots in the conversation establish that both comparisons rendered. Browser access initially failed in some turns; later sessions succeeded. No human aesthetic acceptance follows from rendering or checks. Final screenshots were saved at `/private/tmp/utility-belonging-a.jpg` and `/private/tmp/utility-belonging-b.jpg`; these temporary files and ignored verification reports are not durable storage. Retained source and this feedback summary are the durable evidence.

No full verification, fleet-wide compatibility, motion readability, completed study-quality review, readiness assessment or delivery scope is claimed. Closure validation is limited to changed documentation/page/metadata formatting and diff checks; historical tests are not rerun. No causal lesson, skill edit or standing factory rule is adopted here.
