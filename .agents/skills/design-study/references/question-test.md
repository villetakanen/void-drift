# Question test

Run this once section 01 is drafted, before part 02. It asks whether a study can
answer the question as written. It is not the whole-study evaluation in the study
contract, and it does not judge the design.

## The metrics

| Metric          | Passes when                                                                                                                                                                                                                                                       | Catches                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **One subject** | The question settles one object or decision. Count objects, not facets: an object in each of its states and among others of its kind is one subject when one built example shows them together. No open or unfinished study owns part of the answer.               | The winding or premature question     |
| **Grounded**    | Every held-fixed item exists today in code or a spec as the section describes it, and no factual claim is false. Every open item can be shown in a built example and judged by looking. Omissions and imprecisions are findings; they do not fail the metric.     | Missing or misremembered fundamentals |
| **Consequence** | The answer changes one named thing in the game or the Lab, and a reader can say in one sentence, from the section alone, what is different afterwards.                                                                                                            | A study whose answer changes nothing  |

Code shows what is built, not what is intended. When a fixed item rests only on
current behaviour, with no spec or accepted study behind it, the reviewer lists it as
a finding for the designer to confirm instead of counting it as checked.

## Running it

- The reviewer has a clean context: no part in the framing conversation and no word
  on the expected result. Read-only. The authoring agent's own check does not count.
- Input: the study page, its registry entry, the study contract, the study registry
  for One subject, and the code. For Grounded the reviewer verifies each fixed item
  and each factual claim in the repository and cites where.
- Output: one row per metric with a stamp and a reason of one or two sentences, the
  findings most serious first, and what was not checked.

## Stamps

**Pass**, **Pass with findings**, **Fail**, or **Overridden** when the designer
proceeds after hearing a fail. An override is recorded as such, never as a pass.

## After the run

- Tell the designer the result. A fail is heard, not a gate: the designer decides
  whether to repair the question, narrow it, or proceed.
- Answer each finding in section 01: correct it, or decline it. Keep the opening
  within its length target; a correction replaces words, and a scope list that will
  not fit goes in a compact list below the opening. Give the reason for a declined
  finding to the designer in chat.
- A corrected section need not be run again, unless the question was amended during
  exploration.
- Stamp the result at the end of section 01 in the form below. The rest of the
  result stays in chat. Create no review page and link nothing.

## The stamp

```markdown
<details open>
<summary>Question test · 16 November 2026</summary>

| Metric      | Result             | Reason |
| ----------- | ------------------ | ------ |
| One subject | Pass               | ...    |
| Grounded    | Pass with findings | ...    |
| Consequence | Pass               | ...    |

Corrected after the test, not rerun.

</details>
```

- Each reason is the reviewer's, copied unchanged. Add no commentary.
- The last line is one of: "Not corrected.", "Corrected after the test, not rerun.",
  "Corrected and rerun.", "Overridden by the designer."
- Remove `open` when the study moves to part 02.
- A rerun replaces the block; the page holds one.
- Where the page is not Markdown, write the same block in the page's markup.
