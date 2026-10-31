# Planetary design study: closed-loop evidence

Removal update — 29 October 2026: the designer subsequently requested deletion of
all failed study application payloads. Their pages, dedicated demos, catalogue
entries, and obsolete test were removed. Historical artifact paths below identify
removed files, not retained deliverables. This later instruction supersedes earlier
artifact-retention instructions; written evidence and lessons remain available.

Date: 29 October 2026. Outcome: the designer declared this study cycle failed and
requested diagnosis and restart preparation. No design direction was accepted.
This record collects evidence; interpretation is separate in
[the retrospective](../factory-experiment-planetary-study.md).

## Restart cycle: second failure

The designer initiated a fresh inquiry with explicit boundaries: treat the previous
study as failure evidence, establish what is to be understood and why, ask one
grounded question at a time, distinguish stated intent from suggestions, and do not
build a page, propose presets, or recommend a direction yet. The first outcome was
to be a shared problem statement and its uncertainties.

The conversation then proceeded as follows:

1. The agent read the design-study skill, study specification, design guidance, and
   prior evidence/retrospective. It did not create a study artifact.
2. It asked what prompted the inquiry. The designer identified this as the same
   failure mode as the prior cycle: asking why the inquiry was happening instead of
   doing the design work.
3. The designer supplied substantive intent: planets and moons are gravitational
   slingshot platforms; ships differ in gravity response and momentum; bodies should
   make the system feel spacious and costly to traverse; collision and close gas
   giant atmosphere should damage ships. The agent reflected this, then asked how
   slingshots should affect survival. The designer said that was unknown and the
   reason to conduct a study.
4. The designer expected the study page to exist by then, with intent and design
   question framed. The agent acknowledged the mismatch, inspected the existing
   implementation, and rewrote its page content after that explicit prompt.
5. The resulting page records the stated intent and uncertainties but does not
   start an investigation. The agent reported it had not checked the rendered page.
6. The designer declared the cycle failed again, describing the interaction as
   “ping pong with the model and the agent,” and explicitly said the agent was
   working as expected and following the instructions. The designer attributed the
   failure to prompts or system skills shaping the work in an unwanted way.

These sequence facts are from the conversation in this chat. The owner's assessment
and attribution are reported claims, not independently established causes. The
designer also stated that current-game appearance was not relevant to this inquiry
at this stage: the purpose was to understand how bodies should work, not audit how
the current trial looks. This challenges the earlier use of current implementation
inspection as part of the study framing.

The page and metadata were modified locally during this restart. No tests or browser
inspection were run for those edits. No commit, push, or deployment occurred. The
working tree also contains the earlier uncommitted study implementation and closure
records; provenance of all current changes is not established by this session.

Evidence gaps: there is no independent evaluation of the design-study process, no
trace of the exact runtime/system prompt composition, and no browser capture of the
updated page. The full conversation is available in this chat but is not exported as
a separate durable transcript.

## Intent and boundaries

The initiating request was a design exercise on planet size, speed and how they
feel, beginning with meaning and reasons, then experience. The existing Lab was
reported insufficient. The request did not specify a desired planetary experience.

The designer clarified: a moon is a gravitational body orbiting a planet; in game
design it is the same kind of body with a different orbit. This clarified the body
relationship, without selecting an experience goal or the proposed presets.

## Conversation sequence

1. The agent's first response committed to framing meaning and building an
   interactive study before establishing a shared design problem.
2. The agent read the design-study skill, design guidance, study specification,
   implementation and Lab. It offered choices including terrain/hazards versus
   destinations/identity, plus a question about moon parentage.
3. The designer answered with the moon definition above. No selection of the
   experience alternatives appears in the conversation.
4. The agent proposed recognition, route choice and close passage as situations,
   then built spacious/slow, route-shaping and restless alternatives. It recommended
   larger, slower planets with local moon motion. These originated with the agent.
5. The page opened with revision information and statements about “the owner”. It
   labelled the proposed situations as hypotheses and its values as exploratory.
6. The designer asked whether the study was being run correctly, citing the prior
   study's problem-first explanation and this page's “random slop on some owners”.
7. The agent proposed revising the opening. The designer interrupted: “polishing its
   presentation will not get us to a position where we understand the design problem”
   and said the goal was not understood. No page revision was executed in that turn;
   the only tool call read files and status.
8. The agent paused implementation and asked about the missing experience. The
   designer then declared the cycle failed and requested an explanation, learning
   record and possible fresh-cycle prompt.
9. The agent initially emphasised its execution choices. The designer corrected
   the diagnosis: “This is not an agent failure, but a context failure. The agent is
   working, as expected.” The designer described “owner” as a symptom of generating
   material from insufficient context. This is the designer's interpretation.

Source for this sequence: the current chat. No separate full transcript export is
stored here. Quotations are short excerpts; surrounding discussion remains in chat.

## Inspected materials

- [Design-study skill](../../.agents/skills/design-study/SKILL.md), lines 11–23:
  clarify consequential ambiguity, then create a page, show alternatives and a
  recommendation, and record feedback. It does not explicitly require a shared
  goal checkpoint before page creation.
- [Study specification](../specs/design-studies.md), contract and scenarios:
  describes pages and examples, starting from an operator describing a design
  problem. The schema requires a question, not evidence of shared goal formulation.
- [StudyLayout](../../apps/web/src/layouts/StudyLayout.astro): supplies header,
  navigation and a content slot. It does not require “owner” language or prescribe
  the page's section text.
- [Prior retrospective](../factory-experiment-design-studies.md): reports value
  from a situation-first explanation, records that the button pilot also needed
  corrections to its initial categories, and warns that its workflow may not fit
  every design problem.
- Planetary page (removed source: `apps/web/src/pages/lab/studies/planetary-bodies.astro`)
  and interactive component (removed source: `apps/web/src/components/studies/PlanetaryStudy.svelte`):
  at the first cycle's closure, preserved the opening, proposed intentions,
  recommendation and fixture boundaries discussed above. The restart later edited
  the page; see the second-cycle evidence below.

## Local changes and verification

Inspected base revision: `e31ba88d9cb0f7af9fd3b1b247f1ccff1f9dee42` on
`feat/0-4-0`. Study implementation remains uncommitted: metadata and specification,
new planetary page/component/browser test, plus extraction of the existing circular
orbit equation into a shared helper. No runtime tuning constants changed.

The retained `artifacts/verification/latest.json` identifies that base revision and
dirty tree, fingerprint
`d04e72e33bd677da7edbcbef5b99f31d3fac73d525328e030d9200355b61d1e0`.
Run: 29 October 2026, 07:03:57–07:04:17 Helsinki time, macOS arm64, Node v24.14.0.
Contracts, commit-history syntax, lint, types, unit tests, build and browser checks
passed. Unit log: 25 tests; browser log: nine tests. Rules and competition commands
failed to start their emulators because Java was unavailable in that environment.
Overall verification failed; its source-unchanged check passed for that run.

An earlier run failed on the new browser test's exact label lookup and on Java;
the lookup was corrected and the later browser run passed. The earlier source was
also edited during verification. Historical logs have been overwritten by the later
run; this earlier result is retained in chat tool output only.

These checks establish implementation properties, not agreement on the study goal.
No tests were rerun for closure. Adding closure documents makes the historical
fingerprint inapplicable to the current whole working tree.

## Publication and gaps

At the first cycle's closure, no commit, push or deployment was performed for this
study in this chat. Local preview: `/lab/studies/planetary-bodies`, last reviewed on
port 4331; availability is temporary. The first-cycle page and metadata were
preserved then as evidence. The restart later edited the page and metadata locally,
as described below; it was not browser-verified.

The original artifacts do not contain a mutually agreed design problem, intended
experience, or criterion for judging alternatives. There is no accepted product
finding, user research, or controlled evidence attributing the failure to one part
of the workflow. The designer's failure assessment and context-failure interpretation
are recorded above. Retained verification logs and screenshots are ignored/local
artifacts and may disappear. Standing skills and instructions have not changed.
