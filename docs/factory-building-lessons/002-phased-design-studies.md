# 002 — Phased design studies

Date: 29 October 2026.
Status: designer approved the workflow changes; fresh-cycle effectiveness untested.

## Why we changed the factory

Three design-study attempts exposed a gap. The button study developed purpose,
compared solutions, accumulated agreed refinements, and mapped the accepted result
into shared styles and application consumers. The two planetary attempts failed:
one constructed alternatives without a shared purpose; the restart questioned the
designer without advancing the unresolved design work.

“We don't know yet” is the normal reason to conduct a study. Research can synthesize
knowledge that already exists; design exploration can develop and examine possible
answers. Neither requires the designer to supply the study's conclusion in advance.
Problem formulation is itself part of the work.

The designer identified phasing as essential: establish why, explore how, then work
out what changes in the design system and application. Human participation belongs
inside these phases and across iterations, not merely at the request and final review.
Agreement must accumulate so that every round has a foundation to build on.

## Evidence and interpretation

- [Button retrospective](../factory-experiment-design-studies.md) records the value
  of situation-first explanation, corrections, acceptance, and integration.
- [Planetary evidence](../loop-evidence/2026-10-29-planetary-design-study.md) records
  both failures, stated planetary intent, feedback, checks, and evidence gaps.
- [Planetary retrospective](../factory-experiment-planetary-study.md) retains earlier
  explanations and the attempted repair. Its question-first restart failed too.
- The follow-up factory discussion established the approved interpretation and change:
  purpose → exploration → integration, with recurring human judgment and retained
  agreements. This record summarizes that discussion rather than claiming an
  independent causal experiment.

The prior skill detailed artifact production more concretely than design reasoning.
The first attempt filled the gap with unsupported framing; the second sought answers
from the designer that the study was supposed to develop. The restart constrained
building without supplying a productive investigation method. Required early code
inspection could also anchor normative design work to the current alpha.

These observations support a workflow repair. They do not prove a single prompt
caused the failures or establish that any particular model cannot perform the work.
The earlier skill already required ambiguity clarification, so this is a clarification
of working method rather than evidence that it explicitly required bad behavior.

## Adopted change

1. **Purpose:** contribute a provisional synthesis of intent, principles, problem,
   and unknowns; seek judgment on creative boundaries. Agreement on why does not
   require knowing how.
2. **Exploration:** connect each alternative to agreed purpose, a hypothesis, a
   suitable investigation, and a decision it can inform. Unknowns drive the work.
3. **Integration:** map explicitly accepted choices into shared definitions and the
   application when authorized; verify implementation and review experience separately.

Across all phases, preserve agreements and reasons, distinguish proposals from
findings, and advance the next uncertainty. Reopen earlier decisions only with a
stated reason. A framing objection calls for reframing, not cosmetic repair.

The study skill and specification now own this method. The specification supplies
an early-page outline; the shared study layout/index display phase separately from
acceptance status. Existing failed planetary artifacts remain evidence, not a new
validated study or accepted solution. No planetary mechanics were selected here.

## How we will evaluate it

Use the [bounded replay protocol](design-study-evaluation.md) with the original
planetary brief and an explicit unknown response. Retain the button case as a
regression comparison. Judge progression, grounding, cumulative agreements, and
method fit independently of page correctness. Compare Luna, Terra, and Sol under
recorded equivalent conditions before attributing failures to capability limits.
A Frontier comparison is a possible later control, not an established requirement.

No replay or model comparison has been performed by this change. Repository checks
can validate the implementation of the workflow surface; only a fresh study and
human assessment can establish whether the new practice works better.

## Implementation verification

On 29 October 2026, contracts, commit-history syntax, types, unit tests, and build
passed. After formatting repairs, repository lint and diff whitespace checks passed;
lesson links resolve. Formatting-only cleanup also touched the existing planetary
page and retrospective without changing their content.

Browser retry with local-server access: eight tests passed; the existing planetary
observation test failed because it expects the Watch motion control removed by the
prior restart's page rewrite. The failure screenshot was inspected and shows the
new purpose/exploratory phase and status header. This pre-existing mismatch is left
visible rather than restoring a rejected experiment or weakening its test within
this workflow change. Backend rules and competition checks could not run because
Java was unavailable. Overall verification is therefore not a pass.

No model replay, new planetary investigation, commit, push, or publication was
performed as part of this improvement.

## Addition — design readiness before integration

The designer approved an evidence-backed readiness review before the next trial.
The [canonical rubric](../specs/design-studies.md#design-readiness-review--before-integration)
covers purpose, investigation, alternatives and reasoning, evidence fit, cumulative
agreement, coherence, remaining uncertainty, and integration implications. Each is
rated Ready, Conditional, or Not ready with supporting evidence; ratings are not
averaged. The agent prepares the assessment and the designer makes the judgment.

Outcomes are ready for integration, ready for explicitly bounded integration, or
return to exploration/purpose with a concrete next investigation. Conditions and
scope remain visible. This adds a human decision at the exploration-to-integration
boundary without replacing recurring participation within phases. The trial protocol
now exercises the assessment separately from its workflow evaluation rubric; a
correct finding of insufficient readiness is not a failed factory trial.

The rubric is adopted, not empirically validated. No new trial was run for this addition.

## Repair — progressive form and cycle zero

The [form-drift report](../factory-report-design-study-form-drift.md) found that our
five-part page outline invited a comprehensive report despite phased working guidance.
The designer clarified that a fresh cycle begins from current established reality;
earlier studies are informative, not contracts, regardless of title or recency.

The repaired skill and specification require one substantive numbered opening section,
an unfilled next section, and progression through the discussion. Useful reasoning
must reach the page. Only agreements made in the current cycle accumulate; earlier
choices have standing only through explicit adoption into current reality. Historical
study records were moved out of the mandatory specification to
[an archive](../specs/design-studies-history.md), without rewriting their claims.

A first-page form review is separate from rendering checks and the later readiness
rubric. The next trial uses the designer's exact same prompt and model, without extra
prompt coaching. The harness repair is implemented; its effectiveness remains untested.

## Trial feedback — readability and invitation

The designer reported a better opening and section progression in the next trial,
but found the result tediously long and difficult to understand. Inspection showed
long lines and absent paragraph separation. The designer also lacked a clear prompt
to contribute toward an actionable next step. The optional-versus-required slingshot
question again risked asking for the result of an investigation prematurely.

The approved correction adds token-based paragraph spacing and bounded prose width
in the shared study layout. Opening guidance now favors two or three short paragraphs
or a compact purpose list, one concrete situation, and one visible invitation tied
to the next step. The current trial prose remains evidence; it was not rewritten.
The same-prompt/model rerun will assess the correction. This is partial improvement
in progression, not evidence that the full workflow is validated.

## Current-cycle lesson — define the objects an experiment consumes

In the fresh planet roles study (removed study: `/lab/studies/planet-roles-2026-10-29`), the
problem framing was accepted, but the first exploration offered only a proposed
experiment. After the designer requested an example, the replay used a generic
ship with engines off and an arbitrary starting speed of 400 units/s. The designer
then asked which ship was being studied and whether it had been defined.

The designer explicitly supplied this lesson on 29 October 2026: when designing a
game, define real objects for the parts of the study that are consumed but are not
being adjusted. A planetary experiment still needs an explicit ship. Reusing a
physics function alone does not establish that subject or its ordinary capability.

The authorized repair fixes stock Balanced as the consumed ship, uses its validated
production profile in every physics step and its profile in rendering, displays its
handling and collision properties, and demonstrates normal flight before the planet
comparison. Encounter speed is obtained from that ship's one-second acceleration
from rest. Initial placement, input schedule, omitted resource simulation and camera
remain explicit experiment boundaries. Prior 400 units/s results are superseded for
the revised fixture; they are not evidence about the revised encounter.

This is a designer-supplied lesson recorded for this loop, not an independently
established cause or an automatic change to standing skills. The revised trial
still needs human review; naming a stock ship does not establish that it is the
right reference for every future planetary question.

## Repair — protect the question, with explicit designer override

The [stopped planet roles cycle](../loop-evidence/2026-10-29-planet-roles-cycle.md)
reached an accepted problem statement and a useful example, then drifted into fixture
adjustments. In the subsequent factory discussion, the designer clarified what was
useful: the original straight-flight demo showed the difference between free flight
and the same standard-thrust flight in a gravity well. It was already a good example
of the well's effect. The designer then requested turning it into a slingshot example.
This clarification identifies its value without assigning an unverified source revision.

The approved lesson is active focus protection. Before polishing or repurposing a
demo, the agent should explain when the request changes the investigation and recommend
answering the current question first. The designer explicitly retains override authority.
After an explicit override the agent proceeds, preserving the useful comparison and
recording the changed question rather than repeatedly resisting. Ordinary repairs that
help answer the current question do not require this intervention.

The skill and study specification now encode that behavior, and the evaluation protocol
includes a diversion/override probe. Useful demonstrations accumulate alongside verbal
agreements within the cycle. This is an approved workflow repair, not a claim that the
final slingshot fixture was useful or that the repaired focus behavior has been tested.

## Repair — exploration must deliver an example

The designer reported that the living-solar-system cycle again produced a wall of
text instead of a solution to discuss. Inspection of its page on 29 October 2026
showed three written approaches and a proposed future comparison, followed by a
preference question about kinds of mastery. There was no concrete example to examine.
The page's exploration status did not establish that exploration had been delivered.

The approved scaffold repair makes the phase boundary explicit: purpose may start
with explanation, but exploration delivers a small concrete example in the active
section before asking for judgment. Medium follows the question; prose describes
what to notice and its limits. Research and plans do not substitute for the example.
A real blocker is reported as incomplete work; an explicit request for conceptual
discussion can override the default. The existing focus/override rule still protects
the example's question from unproductive polishing.

The skill, specification, and evaluation protocol now agree on this requirement.
The trial artifact is preserved. No new trial was run here; the designer will rerun.

## Cleanup — failed study payloads removed

After reviewing the [purpose/scope retrospective](../factory-experiment-planet-purpose-scope.md)
and its [evidence](../loop-evidence/2026-10-29-planet-purpose-scope.md), the designer
requested removal of all failed planetary studies from the application. Five pages,
six dedicated demo components, catalogue entries, and the obsolete planetary browser
test were deleted. The successful button study and shared study infrastructure remain.
Written records remain diagnostic evidence; removed artifact references are labeled.

The latest cycle's reported outcome was a working method with excessive study scope.
No partial mechanics from that cycle are authorized for integration. This cleanup
neither promotes those choices nor introduces another standing workflow rule.
