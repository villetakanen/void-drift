# Planned rubric: is the design question ready for part 02?

Written 10 November 2026. A proposal, not a standing rule: it is not in the
design-study skill or the study spec. It answers finding B in the
[retro actions](2026-11-08-retro-actions.md), "No rubric for the design question
itself", and builds on the answerability test added to the skill on 9 November.
It has been run once, on the study below.

## The rubric

Three metrics, one for each way a question fails. Each gets a stamp and a
reason of one or two sentences with evidence.

| Metric          | Passes when                                                                                                                                                                         | Catches                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **One subject** | The question settles one object or decision. Count them and list what was counted. Everything else the section touches is named as adjacent.                                        | The winding question                  |
| **Grounded**    | Every held-fixed item exists today in code or a spec, as the section describes it. Every open item can be shown in a built example and judged by looking. Factual claims check out. | Missing or misremembered fundamentals |
| **Consequence** | The answer changes one named thing, and a reader can say in one sentence, from the section alone, what is different afterwards.                                                     | A study whose answer changes nothing  |

Stamps: **Pass**, **Fail**, or **Overridden** when the designer proceeds after
hearing a fail. An override is recorded as such, never as a pass.

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
  needs that line changed.
- One run is one finding. It needs more studies, including a question that
  ought to fail One subject.
