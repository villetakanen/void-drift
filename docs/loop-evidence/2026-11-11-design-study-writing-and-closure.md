# Design-study writing and closure guidance

Closed 2026-11-11. Scope: investigate the designer's concern about repetitive study
prose, then adopt individually reviewed writing examples and a study-closing
procedure. This loop changed guidance; it did not migrate existing studies or
retire their experimental components.

## Intent and decisions

The designer asked how studies could better serve future designers and contain
less template-filling prose. The stellar-encounters opening was the initial
example. The designer requested concrete proposals in chat, reviewed one at a
time before adding them to the guidance.

The designer authorized these amendments individually:

- Give the title, question and opening distinct jobs; merge repeated framing.
- Replace generic announcements of investigation with intended qualities,
  constraints and unresolved decisions.
- Preserve the concrete condition and reasoning behind a requirement when editing.
- State which properties a decision settles and which remain provisional.
- Close studies as durable records, preserving findings and evidence while
  retiring temporary apparatus with no continuing use.

The fifth amendment replaced a pending proposal about explaining comparisons.
The designer redirected the discussion to temporary JS and Svelte components
that remain after a decision and later break. They proposed retaining prose and
static images instead. After reviewing the closing procedure, the designer said:
“Yeah, agreed. Make it so.” This is approval of the guidance, not evidence that
existing studies have been migrated or that the procedure has been trialled.

## Delivered changes and identity

- [Study skill](../../.agents/skills/design-study/SKILL.md): routes prose work to
  the annotated examples and specifies capture, replacement, consumer checks,
  cleanup and verification when ending a study.
- [Writing reference](../../.agents/skills/design-study/references/writing.md):
  five examples using stellar framing, energy support, plasma charging, utility
  accent decisions and an illustrative button-study closure. Invented summaries
  and illustrative edits are identified as such.
- [Exploration guide](../../.agents/skills/design-study/references/exploration.md):
  distinguishes preserving useful evidence from keeping its tools running.
- [Study specification](../specs/lab/design-studies/spec.md): records the agreed
  prose requirements and durable-record ending contract. Shared production
  systems and reusable Lab instruments are preserved; retained interactive
  examples need a named continuing purpose.

Closure inspection found branch `main`, HEAD
`d718d29bfd169bae421410246cbfb168ed6b21bb`. The four guidance files match HEAD.
Their amendments are included in local commit
`335da098593d3fc1a49f8b1c3d4b372fcacb3c89`
(`feat: add the first Gauntlet pirate encounter`), which also includes other work.
This chat did not make that commit. Earlier chat reports that the guidance was
uncommitted described the checkout at those earlier points.

At closure, unrelated stellar-character components, a study page and release
notes were modified or untracked. They were not changed by this closure. No push,
publication, deployment or live verification was performed by this loop; remote
state was not inspected.

## Inspection and validation evidence

Work ran in the local macOS checkout at `/Users/ville.takanen/dev/void-drift`.
The initial stellar-encounters URL was opened and its rendered text inspected
through the in-app browser. The skill, specification, layout, registry, index and
sample study sources were inspected directly.

A Luna subagent reported an exploratory editorial pass over 42 non-archive study
pages. Its initial labels partly treated unfinished or stopped work as a quality
defect; the follow-up corrected that interpretation and supplied specific prose
examples. This was not a calibrated classifier or exhaustive factual audit. The
subagent messages and browser inspection remain in chat; no separate report or
screen capture was retained by this loop.

After the guidance edits, chat tool outputs recorded:

- `python3 /Users/ville.takanen/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/design-study`
  passed with “Skill is valid!” after each amendment. It checks skill structure,
  not whether future studies will be useful.
- Scoped `git diff --check` commands passed for the tracked skill/specification
  changes. The new writing reference was read back, but was untracked at those
  checks and therefore was not covered by those diff checks.
- Full repository verification, application build, gameplay tests and a trial
  study using the revised guidance were not run in this loop.

Those checks ran against the then-dirty shared checkout. Exact tree snapshots,
hashes and dedicated command logs were not retained, so they do not certify the
later combined commit. Closure inspected the current files and commit history;
it did not rerun historical checks.

## Remaining scope and evidence limits

Existing studies and their temporary tools were not migrated. Study-index changes
were discussed as possible follow-up work and were not implemented. The pending
comparison-caption proposal was superseded, not adopted as another amendment.

No measured improvement in study usefulness or reduction in component maintenance
was established. The designer approved the guidance examples and procedure; this
record does not infer broader effectiveness or promote additional lessons.
