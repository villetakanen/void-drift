---
name: design-study
description: Develop a four-part design study (problem, exploration, readiness, scope) and end it as accepted, ruled out, or stopped, preserving the designer's decisions.
---

# Design study

Read the [design principles](../../../docs/design.md).
A topic or uncertainty is enough to begin; developing the problem is part of the work.

Write the study so another designer or agent can pick up the question later, and a
product engineer can understand what the exploration suggests for the game. What
seemed promising, and why? What did the example reveal? What changed your thinking,
and what’s still open? When a conversation changes the design, preserve the reason.
Leave the coordination in the conversation.

If the study suggests a change, describe what it would mean in play. A designer can
propose where it might fit and explain why that fit matters. The project decides
whether and where to adopt it. The product engineer works out how to incorporate it.
A study can also end with a clearer understanding of the design and no proposed change.

## Start from established reality

Read current product guidance and relevant implementation on demand. Use history only
for a specific research question, rather than routinely loading earlier studies or
factory reports. Earlier studies supply evidence. Carry a prior decision forward as settled only when
the project has adopted it.
Create a cycle-specific slug; if reusing a URL is necessary, archive the old page first.

## Moving between parts

Read the page and say which part is active before working.

| Move | Needs |
|---|---|
| 01 to 02 | The question test heard; the designer agrees the question or says to explore. |
| 02 to 03 | The designer accepts a conclusion that answers section 01’s question, or selects a result for independent delivery. |
| 02 to 01 | The designer accepts an example built on an amended question. |
| 03 to 04 | Every blocker to the intended delivery named. |
| 03 to 02 | A named question that needs more design evidence. |
| 04 to 03 | A slice that cannot be sized without a readiness answer. |
| Any to an end state | The designer's decision. |

When an independently usable result has gone through 03 and 04, return to 02 for
the rest of the scope.

### Amend the question

Explore an amendment to section 01 when either of these occurs:

- a retained observation contradicts something section 01 holds fixed
- the designer changes what they want the study to settle.

Build the next example on the question as it would become. Say in one line what
it sets aside from section 01 and what the question becomes. Leave section 01 as
it is until the designer accepts the example. If the designer rejects it, discard
it like any rejected proposal and continue on the question as written.

Consider whether a narrower question would help when either of these occurs:

- two replacements in a row are rejected and no observation is retained
- an open item cannot be shown in a built example and judged from it

If narrowing would help, suggest the narrower question and explain what it would
let the designer judge. Otherwise, continue exploring the current question.

One rejected proposal is neither case.

A question belongs in a separate study when it would settle a design decision
outside section 01. Wait for the designer’s decision before building an example for the
new question. Ask whether the designer wants to open a separate study for the new
question.

When the designer accepts an example built on an amended question:

1. Rewrite section 01 with the current question, within its length target.
2. Have the question test run again and stamp the new result.
3. Mark each retained exploration step as evidence for the new question or as
   outside it.
4. Open that example's step with one dated line: what changed in the question and
   why.

## 01 / Develop the problem

Synthesize supplied intent and relevant knowledge into a provisional purpose,
principles, design tension and important unknowns. Express established intent as design requirements, proposed explanations as hypotheses,
and observations with their supporting evidence. Synthesize discussion into design
reasoning for the document’s readers; keep conversational attribution in chat. Contribute reasoning
before asking focused questions about creative intent or boundaries. Unknown mechanics
are investigation items, not homework the designer must finish before work can begin.
State what the question holds fixed (accepted mechanics, established intent) and what it
leaves open; exploration varies only the open part. A mechanic already settled in the
game is fixed, not an unknown.

A study answers a question that concerns one object or decision.
A reader can name what part of the game or Lab the question concerns and explain what answering it would help the designer decide.
With more than one object or decision, propose the one this cycle settles and
name the rest as adjacent questions outside it. A change that needs several together is
a version of the game, not a study; say so instead of exploring it. When section 01 is
drafted, have the [question test](references/question-test.md) run by a clean-context
reviewer, answer its findings in the section and stamp the result. Current implementation supplies available means and feasibility, not desired
intent. Research missing knowledge when useful and distinguish it from game observations.

When drafting or revising study prose, read the annotated
[writing examples](references/writing.md). Edit the title, question, section heading
and opening together so each contributes useful information. Aim for 150–250 words
in the opening, with the concrete situation and design tension up front.

Create the early page using StudyLayout and validated metadata in
`apps/web/src/data/studies.ts`. Use [Study pages in the Lab](../../../docs/specs/lab/design-studies/spec.md)
for page construction and publication. Inspect the rendered reading width, spacing
and section progression before presenting it.

Update the page with useful reasoning and feedback in the same round. Advance when
the question test has run and been heard, and conversation establishes shared
purpose/scope and resolves framing objections; substantive agreement or a clear
instruction to explore suffices for the conversation. The designer may proceed after a
failed test; record it as overridden. Unknown mechanics
can remain for exploration. Avoid a generic approval interview; silence is not agreement.

## 02 / Explore

Read [references/exploration.md](references/exploration.md) when entering or resuming
part 02. Continue with the same agent and conversation. Carry in the shared question,
established references and useful current-cycle agreements; carry out supported
conclusions and remaining uncertainties. The guide owns concrete proposals, feedback,
retention and focus protection.

Choose an example that lets the designer judge the question at hand. Preserve the
conditions that matter to that judgment. Record what the example revealed and what
remains uncertain.

For recorded findings, retain written conclusions and suitable static or recorded
evidence of the observed results. Instruments use current production simulation code;
later production changes may alter or invalidate old examples. The exploration
guide replaces each earlier step's live example with a capture when the study advances;
the closing procedure below retires what is still live at the end.

## 03 / Assess readiness

Inspect current implementation against the accepted conclusion. Identify reusable
systems, required adaptations, dependencies, unresolved choices and the changes
the proposal would require in the owning specs. Assess the intended
delivery: for an alpha trial, explain concrete blockers while allowing tuning and
configurability to remain provisional. Return a named question to exploration when
more design evidence is needed. Readiness assesses feasibility, not study quality.

## 04 / Size the work

Trace the accepted conclusion through its shared definitions, game systems, Lab pages
and owning specs. Cut the work into independently deliverable slices with dependencies,
rough size and checks for correctness and fidelity. Keep provisional choices explicit.
If a proposal would change a principle in `docs/design.md`, flag it before the
slices and in the handoff for explicit design discussion.
Writing scope does not start implementation; use the existing authorization boundary.

## Finish and verify

The designer may park a study as blocked on a named dependency and state what
would allow it to resume. The designer may accept after scope, rule a direction
out during exploration or readiness, or stop at any part. Set the
registry status only then; use close-loop for a stopped study. Retain the designer's
assessment of the study, including failure, separately from the value of ending it
for the project.

When ending a study, consolidate its decisions, reasons, useful observations and
remaining uncertainty into a document understandable without operating its
experimental tools. Read the [closure example](references/writing.md#close-the-study-by-preserving-its-findings-and-retiring-its-apparatus).
Capture useful visual evidence as static images with captions; use a recorded clip
or sequence when a still image would lose the relevant motion. Retain the conditions
needed to interpret the evidence and store retained media in versioned study assets.
State evidence gaps explicitly; a new capture is not proof of an earlier observation.

Replace temporary interactive examples with those records before removing their code.
Check consumers, then remove study-specific components, scripts and fixtures that
have no continuing use. Preserve shared production systems and reusable Lab
instruments. Publish the closed page as static MDX with its retained media.
Verify the resulting page and retained media, and check affected consumers
after cleanup. Useful evidence survives independently of the retired apparatus.

Reuse production systems in interactive examples and scope experiments. Check keyboard,
the narrowest supported window (1280px; the Lab is never checked below that) and relevant states, along with affected repository gates and rendering.
Report automated correctness, visual inspection and human judgment separately; provide
the review URL. One lead owns synthesis; delegate only when authorized and useful.

Ordinary studies retain their design reasoning, readiness, scope and human judgment.
Do not generate a separate ratings report by default. New interpretations of factory evidence still need
review before becoming standing guidance.
