---
name: design-study
description: Support a designer-led study through problem development, exploration, game-design alignment and an adoption map. Build tools and preserve discoveries under the designer’s direction.
---

# Design study

The designer directs the inquiry and judges the design. The agent contributes
reasoning, investigates relevant facts, builds tools and examples, and preserves
what is learned. A topic or an unsatisfactory experience is enough to begin.

Read the [design principles](../../../docs/design.md) and the existing study,
if any. Check relevant product behaviour and specs as needed to inform the
conversation. Distinguish current implementation, intended behaviour, proposed
changes and assumptions.

## Working together

Develop a shared understanding of the next design move. A clear request is enough
to act: build and verify the requested step without repeated permission questions.
When the designer delegates creative choices, exercise judgment within that scope.
When direction is unclear, contribute reasoning and a recommendation for discussion.

Feedback may invite refinement, a different instrument, further discussion or a
change of question. Understand it before acting. Preserve accepted qualities and
their reasons; acceptance of one quality does not settle the whole design. Offer
alternatives and challenge assumptions when useful, while leaving design direction
with the designer.

The designer steers movement between the four parts. Follow explicit instructions
and substantive agreements without a separate approval ritual. Return to earlier
questions when useful. Do not advance merely because an artifact is finished or
the designer has not replied.

## 01 / Develop the problem

Give the designer room to explain the situation. Discuss and synthesize the
unsatisfactory experience, intended qualities, relevant context, constraints and
important unknowns. A question can introduce this account; it must not replace it.
Use enough context for another reader to understand why the problem matters.

Help find a manageable inquiry without forcing a premature single-sentence brief.
Unknowns can become exploration material. Revise the framing as shared understanding
changes, preserving the reason for consequential changes. Begin exploration when
the designer directs it or the conversation establishes what to investigate next.

## 02 / Explore together

Work in useful increments, numbered 02.1, 02.2 and so on. A step may develop the
apparatus, compare possibilities, tune a selected direction or investigate behaviour.
Choose the means around what the designer needs to judge or manipulate. Use
[lab-instruments](../lab-instruments/SKILL.md) when choosing or building tools.
A static specimen, editable instrument, simulation or discussion may each be right.

Inspect what you build before presenting it. Preserve the relevant game context
and identify substitutions. Let the designer’s response guide the next step.
Record what was learned: findings, selected values or variants, why they hold and
+what remains uncertain.
An unsuccessful experiment can be worth retaining when it taught something useful;
there is no obligation to archive every attempt or immediately replace a rejection.

Keep live examples in the active step. Before changing or moving an instrument,
capture useful results in the previous step, with conditions needed to interpret
them. Use recordings when motion matters. Keep older steps compact and accessible.
A later reconstruction must be identified as such. Preserve reusable instruments;
remove obsolete experimental code after checking its consumers.

## 03 / Fit the game

Discuss how the emerging design belongs in the game: player understanding and
choices, visual language, surrounding interactions, modes and consequences.
Contribute game-design reasoning and surface tensions for the designer to resolve.
Record the intended scope of each choice and label assumptions explicitly.

Technical constraints matter when they affect the design possibilities. Keep this
part focused on design fit; return to exploration when a question needs an example.

## 04 / Map the implications

Survey what adoption would touch: existing or missing specs, features, shared
components, design-system pages and Lab instruments. Check their current contracts
so the map names concrete owners, gaps and unresolved decisions. Investigate code
when needed to understand behaviour without a spec.

Keep this a useful adoption map. Detailed engineering design, estimates and delivery
breakdowns belong to subsequent work. Study choices remain proposals to the project:
adoption must settle whether the change is wanted and where it applies, then record
that intent in owning specs before changing shared implementation.

## Keep the record useful

The study page records three things: what was studied, what was known and what
was learned. Write each step in that order. State facts and findings without an
actor: never refer to the people doing the study, by name or by role, or to the
agent. Name a person only when someone outside the study was consulted.

Leave process off the page unless process is the subject of the enquiry. Process
is what a step did or built, where an instrument moved, how or when a capture was
made, which checks exist and who decided. Write “Assumed, 26 November 2026:”,
not “These values were set on 26 November and the instrument now opens on them.”

Update the page as understanding develops. Keep why a finding holds and how far a
decision extends, separating observations from interpretations. Use
[Studies](../../../docs/specs/studies/spec.md) for publication, metadata and closure
contracts; use its supported metadata source without duplicating it.

The designer decides whether to accept, rule out, stop or park the study. At closure,
retain conclusions, uncertainty and useful versioned captures so the record stands
without its temporary apparatus. Verify the rendered page, media and affected
consumers. In the conversation, not on the page, report automated checks, visual
inspection and designer judgment separately, with the review URL. A study can end
succesfully without proposing a change.
