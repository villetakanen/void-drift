# Planned rubric: is the design question ready for part 02?

Adopted 11 November 2026: the procedure now lives in the design-study skill's
[question test](../../.agents/skills/design-study/references/question-test.md)
and the study spec allows its stamp on section 01. That file is the rule; this
plan keeps the runs and the reasoning. Decided with it: a fail is heard and
does not block; a corrected section need not be re-tested but says whether it
was; the opening's length target holds; One subject also fails a question
whose answer partly belongs to an open or unfinished study; a fixed item that
rests only on current behaviour is a finding to confirm.

Written 10 November 2026 as a proposal. It answers finding B in the
[retro actions](2026-11-08-retro-actions.md), "No rubric for the design question
itself", and builds on the answerability test added to the skill on 9 November.
It has been run once, on the study below.

## The rubric

Adjusted 11 November 2026 after three runs on the actions study (below). The
adjustments are marked; the 10 November wording is in git history.

Three metrics, one for each way a question fails. Each gets a stamp and a
reason of one or two sentences with evidence.

| Metric          | Passes when                                                                                                                                                                                                                                                                             | Catches                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **One subject** | The question settles one object or decision. Count objects, not facets: how the object looks in each of its states and among others of its own kind is one subject when the same built example shows them together. List what was counted. Everything else is named as adjacent or out. | The winding question                  |
| **Grounded**    | Every held-fixed item exists today in code or a spec, as the section describes it, and no factual claim is false. Every open item can be shown in a built example and judged by looking. Omissions and imprecisions are findings listed with the stamp; they do not fail the metric.    | Missing or misremembered fundamentals |
| **Consequence** | The answer changes one named thing in the game or the Lab, and a reader can say in one sentence, from the section alone, what is different afterwards.                                                                                                                                  | A study whose answer changes nothing  |

Stamps: **Pass**, **Pass with findings**, **Fail**, or **Overridden** when the
designer proceeds after hearing a fail. An override is recorded as such, never
as a pass. A Pass with findings is stamped on the page only after each finding
is answered in the section: corrected, or declined with a reason.

What changed on 11 November, and why:

- **One subject counts objects, not facets.** Two reviewers counted "what a
  button is made of" and "how buttons sit together" as two decisions because
  the section listed them under two headings. They are one: a button's material
  is judged by what it does beside other buttons.
- **Grounded separates false from missing.** The first run here already said
  the metric mixes two things. On the actions study the third run found no
  false claim and failed on one omission. A false claim or a fixed item that
  does not exist still fails; an omission is a finding the section must answer.
- **Consequence covers the Lab**, as proposed after the first run.

## How it is run

- By a reviewer with a clean context: no part in the framing conversation, and
  not told what result is expected. Read-only.
- Input: the study page, its registry entry, the study spec and the code. For
  Grounded the reviewer verifies each fixed item and each factual claim in the
  repository and cites where.
- Output: the three-row table, a list of findings most serious first, and what
  was not checked.
- The result is stamped at the end of section 01, dated, before part 02 starts.
  A section corrected after the test says so and says whether it was re-tested.
- The full result, with findings and what was not checked, goes in a linked
  record at `/lab/reviews/<study-slug>`.

## Example: Flight scene instrument, 10 November 2026

Study: `/lab/studies/flight-scene-instrument-2026-11-10`. Reviewer: a
clean-context Opus subagent. About 7 minutes, 26 tool calls.

| Metric      | Stamp | Reason                                                                                                                                                          |
| ----------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One subject | Pass  | One object, the instrument. Five open items, all facets of its screen. Four adjacent questions named.                                                           |
| Grounded    | Fail  | Every fixed item exists and every open item can be shown, but the section described several of them wrongly (below).                                            |
| Consequence | Pass  | "Studies judge flight on one shared Lab screen instead of each building its own." The change is to the Lab, not the game; the reviewer passed it on the merits. |

What Grounded found, most serious first:

1. The section left out that the Motion instrument screen already has a scene
   slot, and that the Light Ion Cannon study used it and already repaints light
   from the start of the burn on a backward move.
2. "Each chose their own flight script" was overstated: two earlier views share
   one input sequence and one uses the instrument's burns.
3. "Only one composed the layers the way the game does" was wrong: no earlier
   view draws every layer.
4. "Production draw order" was listed as fixed, but the order is written only
   inside `FlightDeck.svelte`; nothing shares it.
5. The time cursor was held fixed while "plays, scrubs or both" was left open.
6. "Place a sun or a planet" was left open against a fixed production
   simulation, which builds its own sun and planets.
7. The same burn flies a different path here than on the Motion instrument
   (gravity, power), and the section did not say so.

The section was corrected for all seven and not re-tested. Part 02 started on
the designer's instruction given before the result was known; that is closer to
proceeding on a repaired fail than to an override.

## Example: Actions, 11 November 2026

Study: `/lab/studies/buttons-2026-11-11`. Three runs on the 10 November
wording of the rubric, each by a fresh clean-context subagent, 17 to 19 tool
calls and two to three and a half minutes each. The section was corrected
after every run.

| Run | One subject     | Grounded                    | Consequence |
| --- | --------------- | --------------------------- | ----------- |
| 1   | Pass (marginal) | Fail: several misdescribed  | Pass        |
| 2   | Fail            | Fail: two false claims      | Pass        |
| 3   | Fail            | Fail: one omission, no lies | Pass        |
- Between runs 1 and 2 the designer put group composition inside the question
  and removed the focus ring and red from the givens. Run 2 then failed One
  subject for exactly that. After hearing it the designer overrode: a button
  and a button among buttons are one question.
- Each run found fewer and smaller Grounded problems, and each fresh reviewer
  found something the last had not. Under the old wording the section could
  only pass by becoming an inventory of every button in the game.
- Reading the section for the test surfaced scope the framing had wrong: the
  flight deck's controls and the Hangar's selection controls are not buttons,
  and links belong in the question. The subject became actions.
- A fourth run, on the adjusted rubric and the section reframed around
  actions, stamped One subject Pass with findings, Grounded Pass with findings
  and Consequence Pass: no false claim, two omissions and four imprecisions.
  All six were answered in the section, which was stamped and not re-tested.
- The section ran to several times the opening's 150 to 250 word target. A
  question with a wide reach needs the words to state its scope.

## What the first run suggests

- **Grounded did the work.** The author's own check had passed all three. The
  clean-context reviewer failed Grounded on seven points, every one verifiable
  in the code. One subject and Consequence agreed with the author.
- **Grounded mixes two things.** "Does it exist" passed; "is it described
  truthfully" failed. Splitting them, or letting Grounded pass with findings,
  would say more than a bare fail.
- **Consequence needs wording for tools.** "Changes the game in one concrete
  way" does not cover a Lab instrument. Proposed: "changes one named thing in
  the game or the Lab".
- **A fail was cheap to repair** here: wording, not the question. The rubric
  does not yet separate a question that cannot be answered from a section that
  misdescribes its ground.

## Open before this becomes standing

- Whether a failed metric blocks part 02 or only has to be heard.
- Whether a corrected section must be re-tested.
- The study spec keeps process evaluation off the page; a stamp on the page
  needs that line changed. On 11 November the designer directed that the
  actions study's result be stamped on its section 01; the spec is unchanged.
- Whether the opening's word target should bend for a question with a wide
  reach, or the scope lists should live outside the opening.
- One run is one finding. It needs more studies, including a question that
  ought to fail One subject.
