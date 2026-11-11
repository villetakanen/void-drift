# Ship slots study — loop evidence

Closed 11 November 2026. The designer stopped the study as inconclusive during
part 02. This record collects what happened in the one conversation that ran
it. At closure `HEAD` is `fd773a4e`; everything described here is uncommitted
in a dirty checkout shared with other sessions.

The designer's messages were voice-dictated, and the designer said during the
loop that the transcription is unreliable. Feedback below is paraphrased and
attributed; it is not a quote unless marked.

## Intent and scope

Revisit the accepted ship-slot language
(`apps/web/src/pages/lab/studies/ship-slot-language.astro`) now that Playground
lets a part outside the scored rules be fitted: how a slot on the ship drawing
shows such a part, permitted with Playground on and blocking launch with
Playground off. Requested: write section 01, run the part-01 question rubric,
stamp the result on the page, iterate from its findings.

Study: `/lab/studies/ship-slots-2026-11-11`. Registry status at closure:
`stopped`, phase `exploration`.

## Sequence

1. **01, first draft.** About 560 words with Fixed, Open, Reach and Adjacent
   lists, modelled on the actions study's opening.
2. **Designer, while the rubric ran:** the draft imitates the actions study's
   length; the target is about a third, and only as long as needed.
3. **Rubric run** (clean-context subagent, read-only, 16 tool calls, about two
   minutes) on the first draft: One subject Pass, Grounded Fail, Consequence
   Pass. Nine findings; two false claims (eight slots where the Fiddler has
   nine; a ship tab showing its class, which it does not with Playground on).
   Full result: `apps/web/src/pages/lab/reviews/ship-slots-2026-11-11.astro`.
4. **01 shortened** to about 220 words and corrected for all nine findings.
   Stamped. Not re-tested.
5. **Writing audit**, requested by the designer (second subagent, detect-only):
   eleven wording findings and a list of undefined terms. The section was
   rewritten from them and grew to about 270 words. Not re-tested.
6. **Designer correction:** the section stated that a part's drawing sits
   inside its slot. That describes a defect: Plan view scales weapons and
   utilities down to fit (`packages/mode-a/src/lib/build-renderer.ts:461-464`);
   a slot marks where a part is placed and the part may reach beyond it. The
   rubric run had listed the claim under "what checked out". Section and review
   corrected. The designer chose to explore before repairing the defect.
7. **02.1** (`SlotOutsideRules021.svelte`): a Fiddler drawn twice by
   `drawBuild`; a filled corner on slots holding a part outside the scored
   rules, caution yellow with Playground on; red corner, border, label and
   connector with Playground off. Weapons and utilities drawn at flight size
   through `drawBuild`'s fitting-painter hook.
8. **Designer on 02.1:** the corner identifies the parts outside the scored
   rules well enough, including in a screenshot; the Playground-off slot does
   not yet identify the blocking part. The agent was told to choose the next
   step.
9. **Agent recorded the outcome** with details the designer had not given (a
   named colour, a link to the buttons' cut corners, an exact size) and built
   a 02.2: yellow corner in both conditions, heavy red border and red fill when
   blocked.
10. **Designer:** the recorded outcome of 02.1 is wrong, so that 02.2 makes no
    sense; a corner triangle is a stock web pattern the game tries to avoid
    but is acceptable here; no brand colour was meant to be implied. Asked for
    advice.
11. **Agent** read this as the colour being open, rewrote the 02.1 note,
    deleted the 02.2 and built another with ivory corners.
12. **Designer:** this is an overcorrection loop; nothing was asked to be
    ivory; ivory is for text only; the study no longer feels like a study.
13. **Agent** removed the ivory step and cut the 02.1 note to a minimum.
14. **Designer:** the restored page looks right: the corner has the colour of
    its slot's border, yellow on one ship and red on the other; proceed to a
    02.2 of the agent's choosing.
15. **Agent** recorded that rule and built the present 02.2
    (`SlotBlocked022.svelte`): the blocked slot's red border at the weight of
    the selection corners; ships drawn larger.
16. **Designer**, mid-step: do not use the dictated words; interpret what is
    meant and write that.
17. **Designer** stopped the study before judging 02.2: it is not progressing;
    the language for marking a part outside the scored rules should come first
    from the part-rows study; this study needs to be run differently.

## Designer decisions

- Section 01 targets about a third of the actions study's opening.
- A part reaching beyond its slot is intended; Plan view's shrinking is a
  defect, outside this study.
- 02.1: a filled corner in the colour of the slot's border marks a part outside
  the scored rules well enough. Whether this survives the part-rows study is
  not stated.
- Ivory is for text only.
- End state: stopped, inconclusive. The part-rows study runs first.

## Changes delivered

All uncommitted.

- `apps/web/src/pages/lab/studies/ship-slots-2026-11-11.astro`: 01 with rubric
  stamp, 02.1, 02.2, stop note.
- `apps/web/src/pages/lab/reviews/ship-slots-2026-11-11.astro`: rubric result
  and findings.
- `apps/web/src/components/studies/SlotOutsideRules021.svelte`,
  `SlotBlocked022.svelte`: the two examples.
- `apps/web/src/data/studies.ts`: registry entry. The file also carries another
  session's uncommitted part-rows entry.
- Created and deleted within the loop, never committed: a first
  `SlotBlocked022.svelte` (yellow corner, red plate) and `SlotCorner022.svelte`
  (ivory corner).
- No production code, spec or token changed.

## Checks

Dirty tree on `fd773a4e`, macOS, the designer's dev server on port 4321.

- `pnpm --filter web exec astro check`: passed (0 errors) after 01, after 02.1
  and after the ivory step was removed. On the final run it failed with one
  error, in `apps/web/src/pages/lab/studies/part-rows-2026-11-11.astro:140`
  (`PartRows021 client:load`), a file of another session. Not repaired here.
- `biome check` on the study's files: passed on each run.
- Rendered inspection at 1280px by the agent: 01 and stamp; 02.1; each 02.2.
  Console errors seen were stale hot-reload messages for the deleted
  components.
- Not run: the repository's full gates, browser tests, keyboard review of the
  examples' mount selector.
- After closure edits the page loaded with the header reading
  `STUDY / exploration / stopped`, the stop note present and four example
  canvases; checked through the page's DOM, not by screenshot.

## Publication

No commit, push or deployment.

## Findings

- The rubric's Grounded metric failed the first draft on two false claims and
  passed as checked a third claim that the designer later identified as a
  defect described as intent. The reviewer verified it against code that
  implements the defect.
- Neither the shortened 01 nor the audited 01 was re-tested.
- The writing audit increased the section's length by about 50 words.
- In the 02.1 render the slot border is about one pixel wide at Fiddler size;
  the agent judged the red border weak and the filled corner the visible mark.
- In the first 02.2 render the part drawings covered almost all of the slot's
  fill, so a coloured fill was barely visible.
- `--color-caution-tape` (`lch(91.22% 89.15 92.72)`) and the selected lime
  (`lch(96.42% 84.18 104.87)`) were used side by side in 02.1. The designer
  described the Playground-on corner as having the border's colour.
- Placeholder art for the Rail gun, Laser and Loading coil is drawn with a lime
  casing (`build-renderer.ts:500-511`).
- A selected engine is outlined in lime by the production drawing, also when
  its slot is drawn red.
- Steps 9 to 15: three successive records of the 02.1 outcome and three
  different 02.2 examples followed two designer remarks. The agent's own
  account in the conversation was that it changed several things when asked
  only for advice.
- The shared corner cuts are top-left and bottom-right
  (`packages/core/src/lib/styles/tokens.css:46-47`); the example's corner is
  top-right.

## Unknown

- What the designer meant by not implying a brand colour (step 10).
- Whether the present 02.2 identifies the blocking parts; it was not judged.
- How the designer wants such a study run differently; not stated.
- Whether the Hangar's missing blocked-launch explanation (rubric finding 3) is
  tracked anywhere.

## Evidence gaps

- The first 01 draft, the deleted 02.2 components and the subagents' full
  reports exist only in the conversation; none was committed.
- No screenshots were saved to the repository.
