---
name: design-study
description: Develop a four-part design study (problem, exploration, readiness, scope) and end it as accepted, ruled out, or stopped, preserving the designer's decisions.
---

# Design study

Read [the study contract](../../../docs/specs/design-studies.md) and
[design principles](../../../docs/design.md). The specification owns the four-part
outputs, presentation, decision authority and end states. This skill owns the working
procedure; [exploration](references/exploration.md) owns part 02's detailed rounds.
A topic or uncertainty is enough to begin; developing the problem is part of the work.

## Start from established reality

Read current product guidance and relevant implementation on demand. Use history only
for a specific research question, rather than routinely loading earlier studies or
factory reports. Apply the specification's cycle-zero authority boundary when using it.
Create a cycle-specific slug; if reusing a URL is necessary, archive the old page first.

## 01 / Develop the problem

Synthesize supplied intent and relevant knowledge into a provisional purpose,
principles, design tension and important unknowns. Express established intent as design requirements, proposed explanations as hypotheses,
and observations with their supporting evidence. Synthesize discussion into design
reasoning for the document’s readers; keep conversational attribution in chat. Contribute reasoning
before asking focused questions about creative intent or boundaries. Unknown mechanics
are investigation items, not homework the designer must finish before work can begin.

For a broad topic, propose one decision the cycle can settle and name adjacent questions
outside it. Current implementation supplies available means and feasibility, not desired
intent. Research missing knowledge when useful and distinguish it from game observations.

Create the early page using StudyLayout and validated metadata in
`apps/web/src/data/studies.ts`. Follow the specification's presentation contract; inspect
its rendered reading width, spacing and section progression before presenting it.
The button opening's explanatory progression is the form reference, not its decisions;
the specification describes enough to use it without reading the historical study.

Update the page with useful reasoning and feedback in the same round. Advance when
conversation establishes shared purpose/scope and resolves framing objections;
substantive agreement or a clear instruction to explore suffices. Unknown mechanics
can remain for exploration. Avoid a generic approval interview; silence is not agreement.

## 02 / Explore

Read [references/exploration.md](references/exploration.md) when entering or resuming
part 02. Continue with the same agent and conversation. Carry in the shared question,
established references and useful current-cycle agreements; carry out supported
conclusions and remaining uncertainties. The guide owns concrete proposals, feedback,
retention, focus protection and the recommendation to finish independently usable results.

Use the Motion instrument for interactive motion investigations, with each instance
configured for its comparison and the variables the designer needs to adjust.
A study may embed several independent instances. Read `docs/specs/motion-instrument.md`;
record missing instrument capabilities and proposed extensions in the design study.
Discuss them with the designer. Update the instrument spec only when the designer
accepts the requirement. Reuse production simulation code for experiments.

For recorded findings, retain written conclusions and captured images of the observed
results. Keep an interactive instance only when continued interaction serves the
study, not solely to preserve historical evidence. Instruments use current production
simulation code; later production changes may alter or invalidate old examples.

## 03 / Assess readiness

Inspect current implementation against the accepted conclusion. Identify reusable
systems, required adaptations, dependencies and unresolved choices. Assess the intended
delivery: for an alpha trial, explain concrete blockers while allowing tuning and
configurability to remain provisional. Return a named question to exploration when
more design evidence is needed. Readiness assesses feasibility, not study quality.

## 04 / Size the work

Trace the accepted conclusion through its shared definitions, game systems, Lab pages
and owning specs. Cut the work into independently deliverable slices with dependencies,
rough size and checks for correctness and fidelity. Keep provisional choices explicit.
Apply the specification's prominent design-principle change disclosure when relevant.
Writing scope does not start implementation; use the existing authorization boundary.

## Finish and verify

The designer decides the end state under the specification's ending contract. Set the
registry status only then; use close-loop for a stopped study. Retain the designer's
assessment of the study, including failure, separately from the value of ending it
for the project.

Reuse production systems in interactive examples and scope experiments. Check keyboard,
the narrowest supported window (1280px; the Lab is never checked below that) and relevant states, along with affected repository gates and rendering.
Report automated correctness, visual inspection and human judgment separately; provide
the review URL. One lead owns synthesis; delegate only when authorized and useful.

Ordinary studies retain their design reasoning, readiness, scope and human judgment.
Use the optional study-quality rubric only for a requested factory evaluation or targeted
investigation; follow the specification's evaluation contract then. Do not generate a
separate ratings report by default. New interpretations of factory evidence still need
review before becoming standing guidance.
