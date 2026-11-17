# Old studies become static records

Status: plan, 2026-11-17, requested in conversation. Nothing is converted yet. This
is the debt item "Compact the closed studies" from the
[skill set 2.0 plan](2026-11-15-design-study-skillset-2.md), given its own procedure,
prompt and ledger.

## What this does

Each old study page is turned into a short static record that needs no maintenance
and still holds what the study found. One study per session, oldest first, one
commit per study. The first study is the test case: after it, the result is reviewed
and this plan and prompt are corrected before the rest are run.

A converted study:

- is an `.mdx` page at the same URL, with the same registry entry
- holds Markdown text and static media only: no component import other than the
  layout, no `<script>`, no `<style>`, no `client:` directive
- holds the question, the outcome, what was decided with exact values and the
  reasons, what was ruled out and why, what stayed uncertain, and where the work
  went
- has no study-only component, script, fixture or test left behind it

## Decisions, 2026-11-17 in conversation

- Closed studies older than five days are converted, oldest first, and the ledger
  below marks each one. Open studies are not converted; a study gets an end state
  from the designer first.
- Age is counted from the ledger's "Added" date to the day the session runs, so
  later rows become eligible as days pass.
- The four stages run in this order: make static, change to MDX, compact, deslop.
- The deslop pass is done by a reviewer with a clean context.

## Defaults chosen while writing this plan, open to correction

- **One commit per study, after all four stages.** The stage checks are run in the
  working tree. Captures taken in stage 1 for steps that stage 3 removes are deleted
  before the commit and never enter git.
- **Captures are images, not rebuilt markup.** Anything a component drew, whether on
  canvas or in HTML and CSS, is captured as a still or a clip. It is not rebuilt as
  static HTML with inline styles: that is hand work, and the copy drifts from what
  the component showed. Inline `style` is used only where a figure needs a layout
  the layout's own classes do not give.
- **A capture made now is a reconstruction.** Old examples run today's production
  code. The caption gives the capture date and says so. An example that no longer
  renders is recorded as a gap and is not repaired.
- **Review pages are left alone.** The converted page links to none. Removing
  `/lab/reviews` is its own debt item.
- **The page records where the full version is.** The last line names the commit
  that holds the page before conversion.

## Stages and their checks

### Stage 0. Take the study

- Read the ledger. Take the first row whose state is `todo`. If its "Added" date
  is five days ago or less, stop: nothing is eligible today. Otherwise set it to
  `in progress` and save the file before doing anything else, so another session in
  this checkout sees it.
- Record the current commit hash; it is the "full version" reference.

### Stage 1. Make the page static

- List every import, component, `<script>`, `<style>` and `client:` on the page.
- For each rendered example, capture it from the running page at 1280px or wider:
  a still, or a short clip when the text judges motion. For an example with
  controls, capture the default state and each variant the text names as accepted,
  selected or rejected with a reason. Do not capture every state.
- Store media in `apps/web/public/studies/<slug>/`, named by step.
- Replace each example on the page with its capture in a `<figure>` with a caption:
  what it shows, the settings, the capture date, and that it is a reconstruction.
- Remove the page's `<style>` and `<script>` blocks and all imports except the
  layout and the registry lookup.

Check: the page renders at its URL with no console error; every image loads; the
file has no `components/studies` import, no `client:`, no `<script>`, no `<style>`;
the text of the page is unchanged apart from the captions.

### Stage 2. Change the page to MDX

- Rename the file to `.mdx`. Name the layout in frontmatter as the existing `.mdx`
  studies do. Convert the HTML to Markdown: headings, paragraphs, lists, tables,
  images, and native `<details>` where a collapsed block remains.
- Escape `{` and `<` in prose.

Check: the URL renders; the visible text and images are the same as after stage 1;
the study index still lists the study with the same title and status.

### Stage 3. Compact

Rewrite the page as the record, part by part. Keep:

- the question, as it stood at the end
- the outcome: accepted, ruled out or stopped, with the date, in the study's own
  terms. A study's decisions are proposals to the project; do not word them as
  project decisions
- each decision with its exact variant and values, and its reason
- what was ruled out, and why
- what remained uncertain
- the media needed to read the above, with captions
- where the work went: the spec, or the commit, when one exists

Remove: the step-by-step exploration narrative, rejected attempts with no retained
observation, question-test stamps, process and review remarks, repeated framing,
readiness and scope text that restates the decisions, and media nothing in the
record refers to.

Before rewriting, write the keep list: every decision, value, reason, ruled-out
item and uncertainty found on the page. After rewriting, check the list against the
record.

Check: every item on the keep list is in the record or is named in the hand-off as
dropped with a reason; every number and name in the record appears in the page as
it was before stage 3; no media file in the study's folder is unreferenced.

### Stage 4. Deslop

A reviewer with a clean context edits the record. It is given the record, the
[writing examples](../../.agents/skills/design-study/references/writing.md) and the
[pruning examples](../writing-pruning.md), and nothing else. Where the harness has
no subagents, start a fresh session with the same brief.

Its brief: remove mannered phrasing, slogans, announcements of what the text will
do, repetition and invented jargon. Write plain literal sentences. Change no number,
name, value, date, decision or reason. Remove no item. Report anything it could not
understand instead of rewriting it.

Check: the same facts are present before and after: compare numbers, names and the
keep list. The record is not longer than before the pass.

### Stage 5. Retire the apparatus and finish

- For each component, script, fixture and test the page used before stage 1, search
  for other consumers. Delete those with none. Leave shared instruments, shared
  components and anything another page imports.
- Run `pnpm lint`, `pnpm test`, `pnpm check:types` and `pnpm build`.
- Add the last line to the page: the commit that holds the full version.
- Set the ledger row to `done` with the date. Commit the study, its media, the
  removed apparatus and the ledger together. The row carries the date; the commit
  message names the study, so the commit is found from the page name.

Check: all four commands pass; the page renders; the ledger row is `done`.

## The prompt

One session per study. Paste as is.

```text
Convert one old design study into a static record, following
docs/plans/2026-11-17-old-studies-to-static-records.md. Read that file first and
follow its stages and checks in order. Do not use the design-study skill's
procedure for running a study; this is a conversion of a finished one.

1. Take the first row in the ledger whose state is "todo". If its "Added" date is
   five days ago or less, stop and tell me nothing is eligible. Otherwise set it to
   "in progress" and save the plan file before any other change. If a row is
   already "in progress", stop and tell me.
2. Run stages 1 to 5 on that study only. Run each stage's check before starting
   the next stage. If a check fails and you cannot fix it within the stage's own
   rules, stop, leave the row "in progress", and tell me what failed.
3. Stage 4 is done by a reviewer with a clean context, given only the files the
   plan names. Do not do that pass yourself.

Rules:
- Touch only this study's page, its media folder, its registry entry if the file
  name requires it, apparatus that only this study used, and the ledger row.
- The dev server runs at localhost:4321. Do not start another. Capture at 1280px
  or wider.
- Do not repair an example that no longer renders. Record the gap on the page.
- Do not change any number, value, name or decision the study recorded. Do not
  add conclusions the page does not state.
- A study's decisions are proposals to the project. Change no spec.
- Other sessions share this checkout. Commit only the files named above, with a
  conventional commit message naming the study. Do not push.

When done, give me: the URL, the page length before and after in lines, the
media kept, the apparatus deleted, anything dropped from the keep list with the
reason, any gap recorded, and anything in the plan that was wrong or unclear.
```

## After the test case

The first study is `buttons`. Its opening, "Situations before styling", is cited by
the study spec and the design-study skill as the form reference for an opening.
Compacting it changes that text; the spec says it describes enough to use the form
without reading the study. Check that claim when reviewing the test case.

Review before running the rest:

- Does the record still say what was decided and why, to a reader who never saw the
  study?
- Were the captures worth their size?
- Which instructions did the session misread or work around?

Correct this file, then run the remaining studies with the same prompt.

## Ledger

States: `todo`, `in progress`, `done <date>`, `skip: open`.
Order is the date the file was first committed. "Refs" counts lines that import a
study component or use `client:`.

| #   | Page                                         | Added      | Lines | Refs | Registry status | State           |
| --- | -------------------------------------------- | ---------- | ----- | ---- | --------------- | --------------- |
| 1   | `buttons.astro`                              | 2026-10-28 | 163   | 3    | accepted        | done 2026-11-17 |
| 2   | `gravity-wells.astro`                        | 2026-10-29 | 230   | 5    | accepted        | todo            |
| 3   | `archive/fighter-canopy-soft.astro`          | 2026-10-30 | 21    | 1    | not in registry | todo            |
| 4   | `engine-effects.astro`                       | 2026-10-30 | 292   | 9    | accepted        | todo            |
| 5   | `heavy-cruiser-slots.astro`                  | 2026-10-30 | 556   | 6    | accepted        | todo            |
| 6   | `ship-silhouettes.astro`                     | 2026-10-30 | 566   | 10   | stopped         | todo            |
| 7   | `archive/scout-firefly-rounded-bodies.astro` | 2026-10-31 | 22    | 1    | not in registry | todo            |
| 8   | `ship-slot-language.astro`                   | 2026-10-31 | 128   | 2    | accepted        | todo            |
| 9   | `ion-engines-2026-10-31.astro`               | 2026-10-31 | 273   | 7    | accepted        | todo            |
| 10  | `scout-firefly.astro`                        | 2026-10-31 | 503   | 7    | accepted        | todo            |
| 11  | `engine-identities.astro`                    | 2026-10-31 | 541   | 15   | accepted        | todo            |
| 12  | `archive/ion-ceiling-rules.astro`            | 2026-11-01 | 21    | 2    | not in registry | todo            |
| 13  | `path-instrument-2026-11-01.astro`           | 2026-11-01 | 193   | 5    | stopped         | todo            |
| 14  | `plasma-behaviour-2026-11-01.astro`          | 2026-11-01 | 301   | 7    | stopped         | todo            |
| 15  | `base-movement-ion.astro`                    | 2026-11-01 | 539   | 11   | accepted        | todo            |
| 16  | `lhi-wasp.astro`                             | 2026-11-01 | 605   | 13   | accepted        | todo            |
| 17  | `lab-instrument-2026-11-01.astro`            | 2026-11-01 | 838   | 12   | accepted        | todo            |
| 18  | `in-game-controllers.astro`                  | 2026-11-02 | 491   | 12   | accepted        | todo            |
| 19  | `resource-capacity-2026-11-02.astro`         | 2026-11-02 | 568   | 5    | accepted        | todo            |
| 20  | `utility-machinery-2026-11-02.astro`         | 2026-11-02 | 889   | 1    | accepted        | todo            |
| 21  | `open-frame-machinery-2026-11-02.astro`      | 2026-11-03 | 156   | 3    | stopped         | todo            |
| 22  | `ship-utility-language-2026-11-02.astro`     | 2026-11-03 | 172   | 4    | stopped         | todo            |
| 23  | `gilded-surfaces-2026-11-03.astro`           | 2026-11-03 | 204   | 8    | accepted        | todo            |
| 24  | `utilities-2026-11-02.astro`                 | 2026-11-03 | 308   | 4    | stopped         | todo            |
| 25  | `gravity-coil-fx-2026-11-03.astro`           | 2026-11-03 | 316   | 10   | accepted        | todo            |
| 26  | `gravity-coil-form-2026-11-03.astro`         | 2026-11-03 | 526   | 2    | accepted        | todo            |
| 27  | `gravity-coil-2026-11-03.astro`              | 2026-11-03 | 569   | 15   | stopped         | todo            |
| 28  | `energy-support-2026-11-02.astro`            | 2026-11-03 | 614   | 2    | stopped         | todo            |
| 29  | `lhi-fiddler-2026-11-03.astro`               | 2026-11-03 | 930   | 29   | accepted        | todo            |
| 30  | `ship-motion-laws-2026-11-04.astro`          | 2026-11-04 | 571   | 0    | open            | skip: open      |
| 31  | `run-countdown-2026-11-05.astro`             | 2026-11-05 | 226   | 2    | accepted        | todo            |
| 32  | `suns-2026-11-07.astro`                      | 2026-11-07 | 977   | 6    | accepted        | todo            |
| 33  | `derelict-draft-two-2026-11-06.astro`        | 2026-11-08 | 140   | 3    | stopped         | todo            |
| 34  | `derelicts-2026-11-06.astro`                 | 2026-11-08 | 176   | 1    | stopped         | todo            |
| 35  | `derelict-three-2026-11-06.astro`            | 2026-11-08 | 326   | 9    | accepted        | todo            |
| 36  | `ion-point-defence-2026-11-08.astro`         | 2026-11-08 | 420   | 6    | accepted        | todo            |
| 37  | `light-ion-cannon-2026-11-08.astro`          | 2026-11-08 | 587   | 10   | accepted        | todo            |
| 38  | `flight-scene-instrument-2026-11-10.astro`   | 2026-11-10 | 649   | 8    | accepted        | todo            |
| 39  | `run-status-2026-11-10.astro`                | 2026-11-11 | 40    | 0    | open            | skip: open      |
| 40  | `ship-slots-2026-11-11.astro`                | 2026-11-11 | 184   | 4    | stopped         | todo            |
| 41  | `fission-light-2026-11-11.astro`             | 2026-11-11 | 205   | 2    | open            | skip: open      |
| 42  | `stellar-encounters-2026-11-11.astro`        | 2026-11-11 | 277   | 0    | stopped         | todo            |
| 43  | `plasma-light-2026-11-11.astro`              | 2026-11-11 | 833   | 4    | accepted        | todo            |
| 44  | `stellar-characters-2026-11-11.astro`        | 2026-11-11 | 1122  | 0    | accepted        | todo            |
| 45  | `buttons-2026-11-11.astro`                   | 2026-11-11 | 1291  | 28   | accepted        | todo            |
| 46  | `part-rows-2026-11-11.astro`                 | 2026-11-11 | 1885  | 31   | accepted        | todo            |
| 47  | `plasma-projector-2026-11-11.astro`          | 2026-11-12 | 209   | 0    | stopped         | todo            |
| 48  | `venus-2026-11-13.astro`                     | 2026-11-13 | 1101  | 17   | open            | skip: open      |
| 49  | `mercury-2026-11-12.astro`                   | 2026-11-13 | 1780  | 32   | open            | skip: open      |
| 50  | `inhabited-worlds-2026-11-15.astro`          | 2026-11-16 | 446   | 0    | stopped         | todo            |
| 51  | `earth-2026-11-14.astro`                     | 2026-11-16 | 1420  | 0    | stopped         | todo            |
| 52  | `rock-atmospheres-2026-11-15.astro`          | 2026-11-16 | 1568  | 2    | accepted        | todo            |
