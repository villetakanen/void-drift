# Design study writing and publication · 18 November 2026

The designer asked for a review of accumulated edits to the design-study skill.
The discussion narrowed to who reads a study, what belongs in its prose, and how
Void Drift publishes the result. The designer described the problem as “internal
talk, or discussion, which does not relate to the question in hand.”

## Decisions and local edits

- The [skill](../../.agents/skills/design-study/SKILL.md) addresses a returning
  designer or agent and the product engineer considering a suggestion. It asks
  authors to preserve the reasoning behind a decision and leave coordination in
  conversation. The project decides whether and where to adopt a proposal.
  Section 02 now asks what example lets the designer judge the question. Its
  Flight scene and Motion operating instructions were removed.
- The [maintainer README](../../.agents/skills/design-study/README.md) identifies
  which file owns each kind of edit and gives an example of reviewing a proposed
  rule against two different designer responses.
- [Study pages in the Lab](../specs/lab/design-studies/spec.md) specifies routes,
  metadata, layout, formats and publication. Closed pages retain their URL and
  publish as static MDX with versioned media. Existing skill guidance was checked
  before relocating procedure. The skill and its writing reference now agree on
  retiring live examples at closure.
- The [historic conversion plan](../plans/2026-11-17-old-studies-to-static-records.md)
  confines its five-day rule to the backlog and adds a check of the built page
  with JavaScript disabled. Its engine-effects handoff identifies the work saved
  in commit `a0e10419` and the editorial and verification work still open.
  The ledger row remains in progress.

## Evidence and limits

During the review, local path checks resolved the links in the revised spec,
skill and README. Registry and page-source inspection found 41 closed studies
with Astro source. This was a source inventory, not a browser check of the
historical pages. Git inspection confirmed the engine-effects MDX, six stills
and four removed components in the parked commit, and confirmed its original
Astro page exists at `6c2949f8`.

The session ran `git diff --check` on the documentation edits and a scoped check
on the conversion plan. Both passed in the local shared working tree. The check
output was returned in the session; no separate log was retained. At closure,
HEAD was `2b24c35d` and the edits were uncommitted alongside unrelated work.
This loop produced no push, deployment or live verification. No conversion or
JavaScript-disabled browser check ran in this loop. The revised writing guidance
has yet to be observed in a subsequent study.
