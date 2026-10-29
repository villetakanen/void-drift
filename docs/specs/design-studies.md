# Design studies

Status: reusable workflow. Individual study history is outside the entry contract.

## Context

Conversation produces inspectable design proposals before shared implementation changes.
Each cycle develops understanding from its own brief and current established reality.

## Contract

- `/lab/studies` lists studies; `/lab/studies/<slug>` provides a stable review URL.
- `apps/web/src/data/studies.ts` validates metadata with Zod before rendering.
- Pages develop numbered sections progressively. Phase/status metadata supports
  navigation; it does not prescribe substantive headings or lifecycle reports.
- Exploratory → accepted → integrated distinguishes owner acceptance from delivery.
  Agents record acceptance only when the owner explicitly settles the direction.
- Experimental styles remain scoped to study components; fixture behavior is labeled.
- Within a cycle, iteration keeps the URL and records significant feedback and reasons.
  A fresh cycle has a distinct identity; a matching title or URL does not carry agreement.
- Promotion updates shared implementation, canonical Lab examples, and relevant design
  guidance/specs; the study retains rationale and links to the resulting destinations.
- Keyboard operation and narrow layouts are reviewed separately from gameplay feel.

## Phased inquiry contract — adopted 2026-10-29

Uncertainty is the normal reason to study. The agent helps develop understanding,
including problem formulation; it must neither invent settled purpose nor require
the designer to supply the result of the inquiry. See the
[factory lesson](../factory-building-lessons/002-phased-design-studies.md).

| Phase       | Agent contribution                                                                         | Human participation and transition                                                                   |
| ----------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Purpose     | Synthesize intent, principles, relevant knowledge, a provisional problem, and unknowns.    | Challenge and agree on why and what matters; unresolved mechanics can move into exploration.         |
| Exploration | Connect alternatives to purpose, hypotheses, investigations, and decisions they inform.    | Compare, critique, and settle choices incrementally; explicit design acceptance enables integration. |
| Integration | Map accepted choices to shared definitions and application behavior, implement and verify. | Authorize integration and assess resulting experience; publication requires separate authorization.  |

Phase and status are different: purpose/exploration/integration describes the work;
exploratory/accepted/integrated describes acceptance and delivery. Neither metadata
nor passing checks establishes human agreement. Record the actual feedback and its
scope. Existing authorization counts; do not insert redundant approval requests.

An unknown calls for research or design investigation unless only the designer can
supply the missing creative boundary. A mechanic’s role in play can be the
investigation itself. Choose evidence appropriate to the question; visual observation
alone cannot establish gameplay consequences. Current code informs feasibility
and reuse, not what the future game ought to mean.

### Cycle zero — current established reality

At the start of every new cycle, ground the work in current implementation, standing
principles, and explicitly adopted decisions. Distinguish what exists from what is
desired; this baseline can be deliberately changed and is not a demand to discuss
alpha shortcomings. Cycle zero is context gathering, not a mandatory page section.

Earlier studies are informative evidence, not contracts, even with the exact same
title and even if completed a minute ago. A prior decision has authority only insofar
as it was explicitly adopted into current reality, not because a study recorded it.
Do not inherit proposals, acceptance, or unresolved questions from an earlier cycle.
Preserve agreements reached within this cycle, grounded in its starting reality.

Read current authoritative product guidance and relevant implementation on demand.
Do not automatically read earlier study pages, retrospectives, or factory reports
for a new study. If consulting history answers a specific research question, treat
it as evidence and explicitly reconsider any proposal before carrying it forward.
Keep earlier artifacts available separately. Prefer a new cycle-specific slug when
a prior page exists; if a URL must be reused, archive its previous content first.
Do not embed rejected drafts in the new review page, even in collapsed disclosures.

### Current study presentation

The page is a progressively developed study, not a comprehensive status report.
Start with exactly one substantive numbered section and an unfilled next section:

> 01 / [Subject-specific situation, context, or design problem]
>
> Useful explanation and reasoning grounded in this cycle's brief and reality.
>
> 02 / To be developed after 01

Section 01 makes the subject understandable: explain relevant situations, why they
matter, and the tension or uncertainty worth studying. Contribute actual design
reasoning rather than narrating the request or agent actions. Ask a focused question
for designer judgment within that discussion when needed. Do not populate future
alternatives, recommendations, integration plans, readiness tables, or history panels.

Keep the first explanation brief: normally two or three short paragraphs, or a
short introduction and a compact list of purposes. Aim for roughly 150–250 words
including the invitation; this is an editing target, not a quota or reason to omit
essential meaning. Defer implementation inventories and secondary qualifications.
Use one concrete situation to make the central tension understandable.

End the current section with one clearly visible invitation to respond to the
reasoning presented, followed by what that response enables next. For example,
ask whether the described purpose captures the intended experience and what is
missing, then explain the encounter or comparison that will follow. Put that same
invitation in the chat handoff without repeating the whole page. Do not ask the
designer to choose an unresolved mechanic merely to unlock the study; optional
versus necessary gameplay roles may themselves need investigation. A focused
invitation is a substantive design question, not a generic approval checkpoint.

The shared StudyLayout supplies readable paragraph spacing and a bounded prose
width. Keep diagrams and interactive comparisons free to use the wider canvas.

The button opening “01 / Situations before styling” is the concrete form reference:
it explains situations and their implications before comparing appearance. Reuse
that explanatory progression, not button decisions or the completed page's many
sections. This description is sufficient; reading the historical page is optional.

Update the current section when feedback changes its reasoning; do not leave useful
reasoning only in chat while the page is stale. Section 01 is sufficiently settled
when the conversation establishes shared purpose and scope and no unresolved framing
objection remains. A substantive confirmation or clear instruction to explore the
next question is sufficient; do not introduce a generic approval interview. Silence
is not agreement. Unknown mechanics can remain the next section's investigation.

Then fill section 02 with the next useful investigation and add one unfilled next
section. Preserve settled sections and their current-cycle agreements. Repeat as
needed; section count is not fixed and sections need not correspond one-to-one to
phases. Revisit a settled section with an explicit reason when evidence challenges it.

Purpose → exploration → integration guides the work, not the opening's headings.
Use subject-specific prose. Distinguish intent, evidence, and hypotheses naturally
without organizing the page by authorship labels. Cite research where it supports
claims. Add decision records and integration material only when the cycle reaches
them; the readiness rubric belongs at the exploration-to-integration boundary.

### First-page form review

Before presenting the initial page, inspect source and rendered output:

- One substantive numbered section 01 explains the subject and supports discussion.
- Section 02 is an unfilled next stage, not a disguised full-lifecycle outline.
- Content is grounded in this cycle and established reality, not inherited proposals.
- Reasoning appears on the page; process vocabulary and attribution do not dominate.
- The opening is brief, paragraphs are visibly separated, and lines are easy to read.
- One visible invitation makes the next contribution and its consequence clear;
  it does not demand an answer the study is meant to investigate.

Record rendering correctness separately from the designer's judgment of usefulness
and progression. A build pass cannot establish the latter. On later rounds check that
feedback changed the page and that settled agreements survived.

### Exploration entry — show something to examine

Once purpose is sufficiently shared and the cycle enters exploration, deliver the
smallest concrete example that lets the designer examine the current question.
A description of alternatives, a research summary, or a plan to build an example
is not sufficient. Do not ask for a preference between imagined experiences before
providing an appropriate basis for comparison. Purpose can begin with explanation;
exploration must make its question inspectable.

Choose the medium to fit the claim: a sketch or annotated sequence can expose spatial
relationships; an interactive composition can expose control hierarchy; a repeatable
simulation can expose motion and speed differences. Research can inform the example
but does not replace it. Do not claim a static sketch demonstrates dynamic behavior.
Build only enough to examine one question, not every alternative or a finished feature.
Define the real objects consumed, relevant starting conditions, and controlled variables;
reuse established systems where appropriate and label any fixture departures.

Put the example in the active numbered section with a brief explanation of what to
notice and one review question grounded in what is visible or usable. Deliver it in
the same exploration round rather than ending with a promise to build it. If a real
blocker prevents delivery, report the blocker and keep the investigation incomplete;
do not substitute a prose-only preference interview or claim exploration is delivered.
An explicit designer request for conceptual discussion can override this default.

Before presenting exploration, check that:

- The example exists on the review page and works in its intended medium.
- Its comparison or observable behavior can inform the stated question.
- Supporting prose explains what to notice, without burying the example.
- The review question can be considered from the example; limits remain explicit.

Rendering/interaction checks establish availability, not design usefulness. The
focus rule below still applies: do not polish or repurpose the example before
addressing its question unless the designer explicitly overrides.

### Protect the investigation's question

Give each concrete example a question it can answer. Before adjusting it, check
whether the requested change helps answer that question, repairs an obstacle to
understanding it, or instead polishes or repurposes the demo. Make ordinary relevant
repairs without an approval ritual.

When a request would divert the study, push back briefly before implementing it:
name the current question, explain what the demo already lets us observe, and
recommend resolving that question first. Invite judgment on the observation and
its design implication, not on additional fixture details. Do not silently comply
with an accumulating sequence of tweaks that no longer advances understanding.

The designer can explicitly override this focus recommendation, including in the
initial request (for example, “set this question aside and investigate the new one”).
Honor that instruction without arguing or asking again. An ordinary tweak request
is not by itself an explicit override. If the designer has not overridden, keep the
diverting edit pending and bring the current question to review. This is a study-focus
responsibility, not a restriction on the designer's authority.

When an example has answered its question, record what was observed, its limitations,
and the designer's interpretation. An inconclusive result can also close an experiment
with its limits recorded. Preserve useful comparisons and their configuration before
repurposing the fixture. Give a new question a separate example or preserved variant;
do not overwrite the evidence while tuning toward a desired outcome. On an override,
record the deliberate change and whether the previous question remains unresolved.
These observations belong to this cycle; they do not bind a future cycle automatically.

## Design readiness review — before integration

Apply this rubric after exploration and before integrating a design. It assesses
whether the design is grounded enough to carry into the application; implementation
correctness and human review of the integrated experience remain separate checks.
The agent prepares an evidence-backed assessment on the study page. The designer
judges purpose, tradeoffs, and the resulting design; the agent cannot approve itself.

| Criterion                  | Ready when                                                                             | Warning signs                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Purpose                    | We share why the design matters, intended experience, and guiding principles.          | The rationale only describes the alpha or repeats the request.                                  |
| Investigation              | Relevant research, comparisons, or experiments have advanced important unknowns.       | Unknowns become assumptions or questions repeatedly handed back to the designer.                |
| Alternatives and reasoning | The chosen approach fits the purpose and its accepted tradeoffs are explained.         | Appearance, arbitrary parameters, or the first idea determine the recommendation.               |
| Evidence fit               | Evidence supports the actual claims and its limitations are explicit.                  | A viewer supposedly proves gameplay quality, or code checks supposedly prove good design.       |
| Cumulative agreement       | The design preserves reviewed decisions, with reasons for changes of direction.        | Settled points disappear, rejected ideas return without reason, or silence counts as agreement. |
| Design coherence           | Elements work together in relevant situations and meaningful edge cases.               | Isolated examples look convincing but conflict when composed into an experience.                |
| Remaining uncertainty      | Unresolved questions, their consequences, and how to investigate them are explicit.    | Important unknowns are hidden or everything is claimed to be solved.                            |
| Integration implications   | We can identify required changes, what to preserve, and how to assess design fidelity. | Integration requires inventing substantial design decisions that exploration has not addressed. |

For every criterion record **Ready**, **Conditional**, or **Not ready**, a short
rationale, and a link to supporting study material. Missing evidence is a gap, not
a pass. Conditional requires a named condition, its consequence, and how and when
it will be checked. Do not average scores: presentation cannot compensate for
unsupported purpose or evidence. Full technical implementation planning is not
required to assess integration implications.

The designer's review establishes one of three outcomes:

- **Ready for integration:** sufficient evidence and explicit acceptance of the design.
- **Ready for bounded integration:** a named, limited implementation can resolve
  remaining uncertainty. Record accepted scope, unresolved hypotheses, review points,
  and conditions for reconsideration before proceeding. No Not ready criterion may
  be ignored; resolve it or explicitly narrow the scope so it no longer applies.
- **Return to exploration or purpose:** name the unresolved issue and next useful
  investigation. A failed readiness review is useful direction, not a demand for
  the designer to supply the missing design answer.

Record the proposed assessment separately from the actual human decision, including
its date, accepted scope, and conditions. An assessment alone does not change study
status or authorize integration. Existing explicit acceptance and authorization
count when they cover the assessed scope; do not ask redundantly. A bounded trial
does not imply acceptance of unresolved design choices or readiness for publication.

Suggested review record:

- Study revision and scope assessed.
- Eight criterion ratings, evidence links, and any conditions.
- Agent recommendation and next investigation if needed.
- Human decision and rationale, or explicitly pending.
- Authorized integration scope, review points, and unresolved questions carried forward.

## Scenarios

Given an operator describes a design problem, the agent extracts a bounded brief and
develops a provisional framing at a stable URL, then chooses investigations suited
to the unknowns with unresolved decisions visible.

Given feedback changes the direction, the same study is revised and the reason recorded;
shared production styles remain unaffected until deliberate integration.

Given a study is accepted but implementation is unfinished, its status is accepted,
not integrated. Unavailable checks and pending human review remain explicit.
