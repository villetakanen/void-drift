---
name: design-study
description: Develop a four-part design study (problem, exploration, readiness, scope) and end it as accepted, ruled out, or stopped, preserving the designer's decisions.
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

## 01 / Problem — why?

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

Read [references/exploration.md](references/exploration.md) when entering or resuming
part 02. It owns creative rounds, feedback, retention and focus. Continue with the same
agent and conversation; no separate invocation or handoff is needed. Carry in the shared
question, established references and useful current-cycle agreements; carry out supported
conclusions and remaining uncertainties.

When an independently usable result is accepted, recommend taking it through parts 03
and 04 while keeping remaining scope explicit; honor a direction to continue exploration.
A rejected proposal alone does not reopen part 01 or end the study. Return to purpose
when the designer challenges the shared question.

## 03 / Readiness — is the conclusion feasible here?

Assess the design conclusion against current implementation and constraints. Identify
reusable systems, required changes, dependencies, risks, and unresolved design choices.
Explain what is feasible now and what requires adaptation or further evidence. This is
a technical and contextual feasibility assessment, not the study-quality rubric or an
implementation approval gate. Keep accepted choices distinct from tuning hypotheses.

Assess readiness for the intended delivery. For an alpha trial, distinguish blockers
to implementing and learning from the chosen design from tuning or configurability
that can remain provisional; explain the consequence of each blocker.

## 04 / Scope — how big, and in what slices?

Size the accepted conclusion: which shared definitions, game systems, Lab pages and
specs it touches, and how to cut it into slices that can each be delivered and verified
alone, in order, with dependencies and a rough size. This is understanding, not
implementation or another exploration round. Name unresolved choices without claiming
they are resolved. Completing it does not authorize building; implement only when
separately requested or already authorized.

**Flag any docs/design.md change.** If the conclusion would change an experience
principle, a non-goal, the art direction or the brand, state the proposed change
prominently in 04, as its own item before the slices, and repeat it in the chat
handoff. The owner decides it. Route everything else the study settles to the
feature spec or code that owns it, never to docs/design.md.

## Ending a study

All three end states are successes. The designer decides; you may propose one.

- **Accepted** (after 04): the slices become implementation work, fully or partly.
- **Ruled out** (after 02 or 03): record on the page why the concept does not fit the game.
- **Stopped** (any part): use the close-loop skill to record what blocked the study.

Set `status` in `apps/web/src/data/studies.ts`; it stays `open` until then.

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

The four numbered parts are problem, exploration, readiness, and scope.
Use 02.1, 02.2, and so on for exploration iterations; do not advance the main part
number for each experiment. Develop parts progressively, with subject-specific titles. Do not prefill lifecycle reports, scope
bookkeeping, or readiness assessments in the opening. Keep phase/status in supporting
metadata. Review the first page against the specification's form checklist and inspect
its rendering; record human usefulness separately. Keep URLs stable within a cycle.

Use scoped Svelte 5 components where interaction helps. Reuse production primitives
and systems where relevant; isolate experiments and label fixtures/future scenarios.
Include keyboard, narrow-layout, and relevant states for interactive examples.
Preserve reference material so shared-style changes do not erase decision meaning.

Compare vehicle motion, engine or hull values with the Lab instrument, not new
charts: write its configuration document and embed it with `InstrumentEmbed`; the
designer's adjusted document is the decided values. The contract is
`docs/specs/lab-instrument.md`. If the instrument cannot show what the study needs,
propose an amendment to that specification instead of a study-local chart.

One lead owns synthesis. Delegate only when authorized and useful; reconcile results
into the same study. Verify changes using repository gates and browser inspection;
report unavailable checks and human-review gaps separately. Provide the review URL.

Keep the workflow small. Factory lessons live in docs/factory-building-lessons/;
new interpretations require review before becoming standing guidance.
