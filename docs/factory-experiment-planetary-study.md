# Planetary study retrospective: context before production

29 October 2026. This cycle is closed as unsuccessful by the designer. The next
cycle has not begun. [Evidence record](loop-evidence/2026-10-29-planetary-design-study.md).

This document contains analysis and lesson candidates from two failed cycles. It is
not a skill update, an accepted process rule, or a planetary design decision. The
second cycle changed the local study page after the designer asked where it was;
that page remains an incomplete record, not an accepted study.

## Diagnosis

The designer's interpretation is that this was a context failure: the agent worked
as expected, generating material from too little context. They described “owner”
as a recognisable symptom of that gap. The issue is not resolved by banning a word
or polishing the opening.

The visible sequence supports a specific mechanism: the workflow moved from a
subject to producing alternatives without first establishing the purpose of the
inquiry. We had planets, size, speed, an inadequate Lab, and a definition of moons.
We did not have a shared account of what experience was missing, why it mattered,
or what a useful result would enable. The agent supplied those missing parts with
plausible situations and presets, then built a page around them.

Lab inspection supplied implementation facts. It could not by itself establish the
desired experience. Labelling agent-generated intentions “hypotheses” kept their
status honest, but did not supply a reason for making them the organising frame.
The designer was asked to review within that frame before agreeing to the inquiry.

## Where the context and workflow fell short

| Layer               | Observed instruction or behaviour                                                                                                  | Interpretation to review                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial request     | Asked to define meaning and reasons before experience; supplied a topic, not a settled goal.                                       | Formulating the problem was part of the requested work. Missing context should have been developed through collaboration.                                                    |
| Skill               | Says to clarify consequential ambiguity, then directs page creation, alternatives, recommendation and verification.                | It permits clarification but does not make discovery a concrete, sufficient outcome. Artifact production has a much clearer completion path.                                 |
| Study specification | Assumes an operator has described a design problem; requires a question and examples.                                              | It does not distinguish receiving a topic from establishing a shared problem. Any plausible question can fill the required field.                                            |
| Layout              | Renders a title, question and arbitrary page content.                                                                              | No technical scaffold defect explains the prose. A neatly rendered question can nevertheless conceal an unsettled purpose.                                                   |
| Prior materials     | Button pilot valued situation-first explanation; its own initial categories needed correction.                                     | Copying that study's output structure does not reproduce the conversation that made its scope meaningful. Its success does not establish fit for an open experience inquiry. |
| Method fit          | Skill describes studies “without gameplay testing”; this request concerns how bodies feel in play.                                 | Whether observation can answer the question should have remained open. Selecting a motion viewer before defining the inquiry narrowed what could be learned.                 |
| Agent behaviour     | Offered invented role choices, interpreted a moon-definition answer as sufficient to proceed, and defaulted to a preferred preset. | The missing experience context was filled rather than elicited. A concept definition did not resolve the inquiry's purpose.                                                  |
| Recovery            | Proposed rewriting the opening after the designer challenged the study.                                                            | The process treated feedback as iteration on an artifact when the designer was challenging the frame that justified the artifact.                                            |
| Verification        | Code and interaction checks passed while the designer rejected the study.                                                          | Implementation correctness was available evidence; shared understanding was not. More implementation evidence would not address that gap.                                    |

These are interpretations of this cycle, not proof of a single general cause. The
skill's existing instruction to clarify ambiguity is counterevidence to claiming
that it forced immediate implementation. The agent's behaviour is the point where
the gap manifested; the process question is how to make working through that gap a
clear next action rather than relying on the agent to resist the production path.
No wording change has yet been tested against a fresh cycle.

## Lesson candidates for review

1. **Make problem formulation a legitimate deliverable.** An initial exchange can
   end with a useful shared brief, or a precise uncertainty, without producing a
   page, presets or recommendations. Productive autonomy can mean advancing the
   inquiry through conversation.
2. **Check the shared goal before choosing a medium.** Establish what prompted the
   inquiry, the intended player experience or unresolved purpose, and what a useful
   result would let us decide. A topic, entity definition, and slider range do not
   establish that goal. This need not become a long mandatory questionnaire.
3. **Separate supplied context from proposed framing.** Offer a small synthesis to
   correct before using it to organise alternatives. Questions should help reveal
   the designer's meaning rather than require selection among agent-invented roles.
4. **Choose evidence to fit the inquiry.** An observation, sketch, conversation or
   flight encounter may be appropriate. Reusing production rendering improves
   fidelity but does not establish that a viewer can answer a question about play.
5. **Treat framing objections as a reason to stop elaborating.** Establish whether
   the question itself is shared before improving its presentation. Preserve prior
   artifacts as evidence without making them the starting frame for a restart.
6. **Use generic provenance prose as a context diagnostic.** If the explanation
   describes who requested a study more clearly than the design tension, inspect
   what is missing. Substituting “designer” for “owner” would not fix this failure.

These candidates are not promoted into AGENTS.md, the skill or the scaffold. A
possible narrow skill revision would explicitly support discovery before page
creation and allow the study medium to follow the inquiry. Whether that suffices
should be reviewed and then tried in a separate cycle.

## Proposed fresh-cycle opening

The next cycle should retain the original request and the clarified moon
relationship, while carrying none of the failed presets or recommendation as a
baseline. Existing code can remain available for later use without supplying the
new study's purpose. Cleanup of the uncommitted experiment is a separate decision;
this retrospective does not remove it.

Suggested prompt:

> Start a fresh design inquiry into planetary bodies in Void Drift. The previous
> cycle produced alternatives before we understood the goal. Treat its page and
> presets only as evidence of that failure, not as design direction.
>
> I want to work out what planetary bodies should mean in the game, why they belong,
> and what experience their size and motion should create. A moon is the same kind
> of gravitational body as a planet, orbiting a planet.
>
> Begin by helping me articulate the goal. Ask one grounded question at a time,
> reflect what you understand, and distinguish what I have said from your proposals.
> Do not build a page, offer parameter presets, or recommend a direction yet. Our
> first useful result is a short problem statement and an account of what we still
> need to discover. Once that is shared, we can choose how to investigate it.

This prompt was tried as the restart and did not produce the intended experience.
It should be retained as evidence, not offered again as a solution. The designer did
supply a planetary play intent in the second cycle; the remaining issue is how the
factory turns such an intent and its genuine unknowns into an inquiry without
delegating the design work back to the designer. That process question remains
unresolved here.

## Second cycle: repeated failure

The restart added explicit instructions to ask one grounded question at a time,
reflect understanding, distinguish stated intent from suggestions, and defer
presets, recommendations, and page production until the problem statement was
shared. It also retained the previous cycle's error as context. The designer later
said the resulting experience failed again and that the agent was working as
expected, following the instructions amicably. They located the suspected failure
in prompts or system skills that shape the work.

The conversation provides this evidence:

- The agent asked what prompted the inquiry. The designer identified this as the
  same irrelevant opening that had contributed to the prior failure.
- The designer stated the intended roles: planets and moons enable ship-dependent
  gravitational slingshots; bodies should make the system feel spacious and take
  effort to reach; collisions and dangerous proximity to gas giant atmospheres
  should damage ships.
- The agent asked how slingshots should affect survival. The designer said this was
  unknown and precisely why a study was needed.
- The designer expected the study page and design question to be visible by then.
  The agent edited the page only after being prompted. The resulting page recorded
  intent and unknowns, but did not begin an investigation. The agent did not verify
  its rendered appearance.
- The designer said current-game appearance was not relevant to the study's purpose
  at this stage: the study should establish how bodies ought to work, rather than
  assess the current trial.

This shows a repeated mismatch between requested design inquiry and the interaction
that occurred, despite substantially more domain context in the restart. It does
not establish which prompt or skill caused the mismatch. In particular, no exact
runtime prompt composition was captured or independently inspected, and the skill
was not changed. The agent's repeated questions and delayed page work are observable
behaviours; causal attribution to system instructions remains the designer's
hypothesis.

The first retrospective proposed “problem formulation” as a legitimate deliverable
and “check the shared goal before choosing a medium.” The restart attempted to
operationalize that, but still treated the unresolved survival role as information
to elicit before moving into the study. The designer's reaction indicates that
framing alone was not the expected outcome: the factory should carry the stated
intent and investigate the unknowns through design work. That distinction is a
candidate interpretation for review, not a standing rule established here.

Current game inspection is another open process question. Earlier study work treated
implementation and Lab facts as useful framing; the designer now explicitly says
they do not answer the normative design question. Whether and when current-state
evidence is useful must be decided in a separate process review, not inferred as a
general prohibition from this cycle.

The second cycle made local edits to `apps/web/src/pages/lab/studies/planetary-bodies.astro`
and `apps/web/src/data/studies.ts`. No checks or browser review were run for them.
No commit, push, or deployment occurred. See the [evidence record](loop-evidence/2026-10-29-planetary-design-study.md)
for the event sequence and evidence gaps. This retrospective does not prescribe the
next study workflow or modify standing instructions.
