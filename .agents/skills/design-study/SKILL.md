---
name: design-study
description: Develop design understanding through purpose, exploration, and integration; preserve human decisions and promote accepted results into the game and shared design system.
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

## Purpose — why?

Synthesize supplied intent and relevant knowledge into a provisional purpose,
principles, design tension, and important unknowns. Distinguish designer statements,
sourced knowledge, and agent hypotheses naturally in the reasoning, not as authorship
headings or process narration. Ask focused questions where creative intent
or boundaries need the designer's judgment; contribute reasoning before asking.
Do not require the designer to resolve mechanics that the study should investigate.
Seek agreement on sufficient purpose to explore, not a complete solution.

Current implementation describes available means and feasibility, not desired intent.
Inspect production and Lab when useful for the current inquiry; do not anchor a future
experience to alpha shortcomings. Research missing knowledge when it helps; cite it
and distinguish synthesis from observations of this game.

## Exploration — how?

Once purpose is shared, deliver the smallest concrete example that makes the current
question inspectable in the active page section, in this exploration round. Described
alternatives, research summaries, and plans to build later are insufficient. Use a
sketch, sequence, interactive composition, or repeatable simulation suited to the claim;
do not ask the designer to choose between experiences they must merely imagine.
Define consumed objects and conditions. Keep prose brief: what to notice, limitations,
and one question grounded in the example. Follow the specification's exploration-entry
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

## Integration — what changes?

Before integration, apply the design readiness rubric in docs/specs/design-studies.md.
Prepare all eight ratings with evidence, explicit conditions, and a proposed outcome
on the study page. The designer judges readiness; do not average ratings or approve
your own assessment. Record the actual decision and scope, or mark review pending.
For bounded integration, preserve unresolved hypotheses and explicit review points.
Return to purpose or exploration when the evidence does not justify integration.

Only explicit design acceptance changes exploratory to accepted. Purpose agreement
allows exploration; it is not acceptance of a solution. Accepted is not integrated.
When integration is authorized, map accepted choices to shared definitions, game
systems, canonical Lab examples, and relevant guidance/specs. Implement and verify
those consequences. Retain rationale and integration links before marking integrated.
Human review of feel and fidelity remains separate from automated correctness.

## Working surface and evidence

Create an early reviewable page at /lab/studies/<slug> with StudyLayout and validated
metadata in apps/web/src/data/studies.ts. Start with one substantive numbered section
01 explaining the subject-specific situation/context/problem, then an unfilled
“02 / To be developed after 01”. Use the button opening's explanatory progression,
not its specific decisions or the completed page's sections. The specification gives
the reusable form; historical studies are not required reading.

Keep the opening short: normally two or three brief paragraphs or a compact purpose
list, with one concrete situation. Follow the specification's editing target; defer
implementation inventories and secondary qualifications. End with one visible,
substantive invitation to respond to the framing and say what that enables next.
Repeat the invitation briefly in the chat handoff. Do not turn an unknown mechanic
into a prerequisite choice for the designer. Check paragraph spacing and reading
width in the rendered page as well as section numbering.

Develop the current section through discussion. Update the page with useful reasoning
and feedback in the same round, not just chat. Advance when conversation establishes
shared purpose/scope and resolves framing objections; substantive agreement or a clear
instruction to explore suffices. Do not ask generic approval questions or require
unknown mechanics to be solved. Fill the next section and leave one next placeholder.
Preserve settled current-cycle sections; explain any reason to revisit them.

Phases guide work, not page headings. Do not prefill lifecycle reports, integration
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
