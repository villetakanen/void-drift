---
name: design-study
description: Develop a four-part study through design problem, exploration, readiness, and integration planning; preserve human decisions and promote accepted results into the game and shared design system.
---

# Design study

Read docs/specs/design-studies.md and docs/design.md. Follow the phase contract and
progressive presentation contract in the specification. A topic or uncertainty is enough to begin;
developing the problem is part of the work. “We don't know yet” normally creates
an investigation item, not a request for the designer to supply the answer.

## Cycle zero — established reality

Start each fresh cycle from current implementation, standing principles, and explicitly
adopted decisions. Earlier studies are informative, not contracts, even with the same
title or from a minute ago. Do not inherit their proposals, acceptance, or questions.
A prior decision has authority through adoption into current reality, not its study.
Do not routinely read earlier studies or factory reports; consult history only for a
specific research need. Preserve current-cycle agreements as the discussion develops.
Keep old artifacts separate; prefer a new cycle-specific slug rather than importing
old page content. If reusing a URL is necessary, archive the prior page first.

## 01 / Design problem — why?

Synthesize supplied intent and relevant knowledge into a provisional purpose,
principles, design tension, and important unknowns. Distinguish designer statements,
sourced knowledge, and agent hypotheses naturally in the reasoning, not as authorship
headings or process narration. Ask focused questions where creative intent
or boundaries need the designer's judgment; contribute reasoning before asking.
Do not require the designer to resolve mechanics that the study should investigate.
Seek agreement on sufficient purpose to explore, not a complete solution.

For a broad subject, propose one design decision this cycle can settle and name
adjacent questions left outside it. Ground the boundary in the supplied intent;
do not require the designer to decompose the topic first.

Current implementation describes available means and feasibility, not desired intent.
Inspect production and Lab when useful for the current inquiry; do not anchor a future
experience to alpha shortcomings. Research missing knowledge when it helps; cite it
and distinguish synthesis from observations of this game.

## 02 / Exploration — how?

Once purpose is shared, deliver the smallest concrete example that makes the current
question inspectable in the active page section, in this exploration round. Described
alternatives, research summaries, and plans to build later are insufficient. Use a
sketch, sequence, interactive composition, or repeatable simulation suited to the claim;
do not ask the designer to choose between experiences they must merely imagine.
Define consumed objects and conditions. Keep prose brief: what to notice, limitations,
and the uncertainty the example addresses. Put the review question in chat. Follow the specification's exploration-entry
checks. Report actual blockers as incomplete work; explicit requests for conceptual
discussion override this default. Do not overbuild a final solution to provide evidence.

Connect each alternative to agreed purpose, a hypothesis, a suitable investigation,
and a decision the result could inform. Choose research, scenarios, sketches,
interactive examples, or flight trials according to the uncertainty. Do not default
to presets or a viewer. Explain what the chosen method cannot establish.

Present a focused comparison for human judgment. Carry current-cycle agreed points and reasons
forward each round; advance the next unknown. Reopen an agreement only with an
explicit reason. If the designer challenges the frame, return to purpose and identify
what changed rather than polishing the same artifact. Recommend only with supporting
reasoning; never manufacture evidence or acceptance.

When an independently usable result is accepted within a broader study, recommend
taking that result through parts 03 and 04 before exploring the next subject.
Keep the remaining scope explicit and honor a direction to continue exploration.

When a visual example is accepted, identify its exact variant and the properties
the designer settled. Carry that reference into the integration plan alongside
anything still provisional. For motion, retain the input/tick sequence, initial
conditions, seed (or explicit absence of randomness), and camera with the reference.
Verify integration at representative firing, turning, and release/fade moments.

Protect the current investigation's question. Before polishing or repurposing a demo,
check whether the change advances that question. If it diverts the study, push back
briefly: explain the useful observation and recommend resolving its design implication
first. Keep the diverting edit pending unless the designer explicitly overrides;
ordinary repairs that make the current question answerable should proceed normally.
Honor an explicit override, including one already given, without repeated resistance.
Record the deliberate question change and any unresolved prior question.

Preserve useful examples and configurations when their question is answered or the
inquiry changes. Record observations and limits, not invented conclusions. Give a new
question a separate example or preserved variant instead of tuning away the comparison.
Follow the specification's focus rule; it protects inquiry, not agent authority.

## 03 / Readiness — is the conclusion feasible here?

Assess the design conclusion against current implementation and constraints. Identify
reusable systems, required changes, dependencies, risks, and unresolved design choices.
Explain what is feasible now and what requires adaptation or further evidence. This is
a technical and contextual feasibility assessment, not the study-quality rubric or an
implementation approval gate. Keep accepted choices distinct from tuning hypotheses.

Assess readiness for the intended delivery. For an alpha trial, distinguish blockers
to implementing and learning from the chosen design from tuning or configurability
that can remain provisional; explain the consequence of each blocker.

## 04 / Integration — how and why to implement it

Document the implementation path: affected shared definitions, game systems, canonical
Lab examples, specifications, sequencing, dependencies, rationale, and verification.
This part is a plan, not implementation or another exploration round. Name unresolved
choices and planned review points without claiming they are resolved. Completing the
study does not authorize execution; implement only when separately requested or already
authorized. Accepted is not integrated; mark integrated only after actual delivery.

## Study-quality evaluation — separate from the four parts

Use the eight-criterion rubric in docs/specs/design-studies.md to assess whether the
study succeeded. Keep evidence-backed ratings in a separate linked review record.
Do not use the rubric as part 03, a feasibility assessment, or an authorization gate.
Record human judgment separately from the agent assessment and automated checks.

## Working surface and evidence

Create an early reviewable page at /lab/studies/<slug> with StudyLayout and validated
metadata in apps/web/src/data/studies.ts. Start with one substantive numbered section
01 explaining the subject-specific situation/context/problem, then an unfilled
“02 / To be developed after 01”. Use the button opening's explanatory progression,
not its specific decisions or the completed page's sections. The specification gives
the reusable form; historical studies are not required reading.

Keep the opening short: normally two or three brief paragraphs or a compact purpose
list, with one concrete situation. Follow the specification's editing target; defer
implementation inventories and secondary qualifications. Put one substantive invitation in the chat handoff and explain what the response
enables next. Keep review questions and coordination out of the study page. Do not turn an unknown mechanic
into a prerequisite choice for the designer. Check paragraph spacing and reading
width in the rendered page as well as section numbering.

Write the page as shared design documentation: explain the design, alternatives,
decisions, and reasons. Omit agent/owner delivery narration; distinguish historical
conditions from current behavior and link run-specific evidence for check results.

Develop the current section through discussion. Update the page with useful reasoning
and feedback in the same round, not just chat. Advance when conversation establishes
shared purpose/scope and resolves framing objections; substantive agreement or a clear
instruction to explore suffices. Do not ask generic approval questions or require
unknown mechanics to be solved. Fill the next part when appropriate and leave one next placeholder, up to part 04.
Preserve settled current-cycle sections; explain any reason to revisit them.

The four numbered parts are design problem, exploration, readiness, and integration.
Use 02.1, 02.2, and so on for exploration iterations; do not advance the main part
number for each experiment. Develop parts progressively, with subject-specific titles. Do not prefill lifecycle reports, integration
bookkeeping, or readiness assessments in the opening. Keep phase/status in supporting
metadata. Review the first page against the specification's form checklist and inspect
its rendering; record human usefulness separately. Keep URLs stable within a cycle.

Use scoped Svelte 5 components where interaction helps. Reuse production primitives
and systems where relevant; isolate experiments and label fixtures/future scenarios.
Include keyboard, narrow-layout, and relevant states for interactive examples.
Preserve reference material so shared-style changes do not erase decision meaning.

One lead owns synthesis. Delegate only when authorized and useful; reconcile results
into the same study. Verify changes using repository gates and browser inspection;
report unavailable checks and human-review gaps separately. Provide the review URL.

Keep the workflow small. Factory lessons live in docs/factory-building-lessons/;
new interpretations require review before becoming standing guidance. The phased
workflow is approved for use; its effectiveness still requires a fresh study.
