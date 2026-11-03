# Design studies

Status: reusable workflow. Individual study history is outside the entry contract.

## Context and ownership

Conversation produces inspectable design proposals before shared implementation changes.
This specification owns observable outputs, presentation and decision authority.
The [design-study skill](../../.agents/skills/design-study/SKILL.md) owns how to conduct
the work; its [exploration guide](../../.agents/skills/design-study/references/exploration.md)
owns creative rounds, feedback, retention and focus. Keep those procedures in their
owner rather than repeating them here.

## Contract

- `/lab/studies` lists studies; `/lab/studies/<slug>` provides a stable review URL.
- `apps/web/src/data/studies.ts` validates metadata with Zod before rendering.
- Experimental styles remain scoped to study components; fixture behavior is labeled.
- A cycle keeps a stable URL and records significant feedback, decisions and reasons.
- Accepted slices are separate implementation work; the study links to their delivery.
- Keyboard operation and narrow layouts are reviewed separately from gameplay feel.

### Cycle zero — current established reality

A fresh cycle starts from current implementation, standing principles and explicitly
adopted decisions. Earlier studies are informative evidence, not contracts: their title,
recency or recorded acceptance does not automatically carry proposals or questions into
the new cycle. Prior decisions have authority through adoption into current reality.
Current-cycle agreements accumulate; revisiting one needs an explicit reason. Earlier
artifacts remain separately available, and rejected drafts stay out of the new page.
Cycle zero is context gathering, not a mandatory page section.

### Four-part outputs

| Part             | Result                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01 / Problem     | Shared purpose, principles, design tension and an answerable question, with adjacent scope explicit.                                                         |
| 02 / Exploration | Concrete examples, useful discoveries, exact accepted variants and settled properties; remaining hypotheses and reference/replay conditions remain explicit. |
| 03 / Readiness   | Feasibility in the current setting: reusable systems, adaptations, dependencies, risks and unresolved choices, judged against the intended delivery.         |
| 04 / Scope       | Ordered, independently deliverable slices, affected systems/specs, rough size, dependencies and checks for correctness and fidelity.                         |

Uncertainty is a normal input. Desired intent comes from the design inquiry; current
code informs feasibility. Evidence must support the claim: visual examples do not by
themselves establish gameplay consequences. Useful reasoning and agreements survive
iteration; unsupported future parts are left unfilled.

Scope sizes the work; completing or accepting a study does not implicitly authorize
implementation. Existing explicit implementation authorization still counts. Publication
requires separate authorization.

**Flag `docs/design.md` changes prominently in part 04, before the slices, and in the
chat handoff.** Changes to experience principles, non-goals, art direction or brand
require the owner's decision. Other conclusions belong in their feature spec or code.

### Current study presentation

The page explains the design, alternatives, decisions and reasons for a teammate
outside the conversation. Review questions and coordination belong in chat, with one
focused invitation explaining what the response enables. Necessary control labels
remain on the page. Historical conditions and check results are labeled and linked
to their specific evidence.

The opening contains exactly one substantive numbered section 01 and an unfilled
“02 / To be developed after 01”. It explains a concrete situation and the subject's
central tension. Normally use two or three short paragraphs or a compact purpose list;
150–250 words is an editing target, not a quota. Implementation inventories, attribution
headings and lifecycle reports do not belong in the opening. The button opening
“Situations before styling” supplies the explanatory progression, not specific choices.

StudyLayout supplies paragraph spacing and bounded prose width; examples can use the
wider canvas. Parts develop progressively with subject-specific headings and one next
placeholder, up to 04. Exploration iterations use 02.1, 02.2 and so on. Phase/status
metadata supports navigation without replacing subject-specific content.

Each exploration round supplies an inspectable example addressing the shared question.
Explicit requests for conceptual discussion, stopping, preservation or reframing govern;
actual delivery blockers remain visible. The exploration guide owns replacement and
retention procedure. Rendered correctness and human usefulness are separate evidence.

### Ending a study

Status stays `open` until the designer settles an end state; the agent may propose one.
All three end states are successes for the project: they produce implementation scope,
rule out a direction, or stop an unsuccessful effort while retaining useful evidence.
A failed study can therefore end successfully for the project. This does not relabel
the study's design quality or overwrite the designer's assessment of failure.

| End state | Reached after | Leaves behind                                                     |
| --------- | ------------- | ----------------------------------------------------------------- |
| Accepted  | 04 / Scope    | Slices to implement, fully or partly, as separate work.           |
| Ruled out | 02 or 03      | Why the concept does not fit the game, recorded on the page.      |
| Stopped   | Any part      | Evidence of what blocked the study, collected through close-loop. |

## Optional study-quality evaluation — separate from readiness

Use this rubric for a requested factory evaluation or targeted investigation.
Ordinary studies do not require a separate ratings report; their reasoning, readiness,
scope and human judgment remain part of the work. When an evaluation is requested,
store ratings and supporting evidence in a separate linked record, for example
`/lab/reviews/<study-slug>`. The [evaluation protocol](../factory-building-lessons/design-study-evaluation.md)
is available for deliberate workflow trials. Neither the rubric nor a feasibility
conclusion authorizes implementation.

| Criterion                  | Success evidence                                                                       | Warning signs                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Purpose                    | We share why the design matters, intended experience, and guiding principles.          | The rationale only describes the alpha or repeats the request.                                  |
| Investigation              | Relevant research, comparisons, or experiments have advanced important unknowns.       | Unknowns become assumptions or questions repeatedly handed back to the designer.                |
| Alternatives and reasoning | The chosen approach fits the purpose and its accepted tradeoffs are explained.         | Appearance, arbitrary parameters, or the first idea determine the recommendation.               |
| Evidence fit               | Evidence supports the actual claims and its limitations are explicit.                  | A viewer supposedly proves gameplay quality, or code checks supposedly prove good design.       |
| Cumulative agreement       | The design preserves reviewed decisions, with reasons for changes of direction.        | Settled points disappear, rejected ideas return without reason, or silence counts as agreement. |
| Design coherence           | Elements work together in relevant situations and meaningful edge cases.               | Isolated examples look convincing but conflict when composed into an experience.                |
| Remaining uncertainty      | Unresolved questions, their consequences, and how to investigate them are explicit.    | Important unknowns are hidden or everything is claimed to be solved.                            |
| Integration implications   | We can identify required changes, what to preserve, and how to assess design fidelity. | Integration requires inventing substantial design decisions that exploration has not addressed. |

For every criterion record **Supported**, **Partial**, or **Unsupported**, with
links to evidence and explicit gaps. Do not average ratings or infer human acceptance.
Assess the study's reasoning and usefulness, not whether a future implementation has
already passed its tests. Record the owner's judgment separately from the agent's
assessment. Planned checks are not completed evidence.


## Scenarios

Given a design question, the study develops a bounded problem and inspectable examples
at a stable URL, preserving decisions and explicit unknowns as the work progresses.

Given feedback challenges an example, the exploration procedure governs its replacement;
shared production behavior remains unchanged until implementation is authorized.

Given the designer ends a failed study, its stopped state retains both the failure
assessment and the project's value in stopping and collecting evidence.

Given an ordinary study completes, no separate rubric report is required. Given a
requested factory evaluation, the linked assessment includes evidence and human judgment.
