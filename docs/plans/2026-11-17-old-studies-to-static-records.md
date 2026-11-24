# Old studies become static records

Method restored 23 November 2026 from the earlier conversion plan. This document
describes how to convert a finished study; it does not track a queue or completion
status. The study registry and pages supply current status.

## Result

A converted study stays at the same URL with the same registry entry. Its MDX
contains Markdown and static media, with only the shared layout in frontmatter:
no experimental component imports, scripts, styles or client directives. It remains
readable without JavaScript.

Keep the question, outcome, decisions with exact values and reasons, useful
rejections, remaining uncertainty and where the work went. Retire study-only tools
after their evidence has been preserved. Leave shared instruments and production
systems alone.

## 0. Establish the source

Take the study the user names. Otherwise agree which closed study to convert;
open or blocked work needs the designer’s end-state decision first. Do not use the
design-study workflow to reopen a finished investigation.

Record the current commit containing the original page and check for concurrent
edits. Read the full page and its imported examples. Open it at 1280px or wider and
count its rendered words, including component text. Source line counts do not
measure the reading length.

Before rewriting, make a keep list of every decision, exact value, reason,
retained rejection and uncertainty. Separate observations from interpretations
and record the limits of prior verification.

## 1. Preserve evidence

Inventory imports, embedded components, scripts, styles and client directives.
Capture each useful rendered example before removing its implementation. For
controlled examples, capture the default and the variants named as accepted,
selected or rejected with a retained reason. A motion claim needs a clip or image
sequence when a still would lose its meaning. Copy component-rendered prose and
tables as text rather than screenshots.

Use this repository’s `@playwright/test` and the `pnpm test:capture` command from
`package.json`. Follow the current capture configuration for server ownership,
ports and output paths; do not assume it shares the ordinary preview server.
Run outside the sandbox if local server or browser permissions require it.
Review captures are optional artifacts, not release smoke or backend checks.

Capture the example’s own element at a viewport at least 1280px wide. Keep stills
below roughly 300 kB by framing them more closely or reducing capture size.
Store retained media under `apps/web/public/studies/<slug>/` with descriptive names.

A new capture runs current code and is a **reconstruction**, not proof of an earlier
observation. Each caption states the subject, relevant settings, capture date and
that limitation. Preserve original supplied references unchanged and identify them
separately. If an example no longer renders, record the evidence gap; do not repair
historical apparatus as part of conversion. Do not substitute a still for missing
motion evidence without stating the gap.

Replace live examples with the evidence, remove their page imports and remove
page scripts and styles. Check that the page renders, images load and no browser
errors occur. At this stage, retain the original findings apart from new captions.

## 2. Convert to MDX

Use the existing MDX studies’ layout frontmatter. Convert headings, prose, lists,
tables and images to Markdown; native figures, details and recording controls are
allowed. Escape MDX syntax in prose where necessary. Keep the route and registry
metadata unchanged.

Search for the old source filename and update active source and documentation
links. Leave historical reports and captured logs as records of their time.
Check that the URL and index still work and the visible content matches the
static version.

## 3. Compact the record

Rewrite around the keep list, retaining:

- The final question and the outcome in the study’s own terms, with its date.
- Every decision’s selected variant, exact values, reason and extent.
- Rejected directions with a useful retained observation or reason.
- Remaining uncertainty and the limits of evidence or verification.
- Media needed to understand those findings, with captions.
- Where the work went, with a spec or commit reference when one exists.

A study’s proposals do not become project decisions merely through this rewrite.
Preserve any separately recorded adoption or integration authorization.

Remove the chronological exploration narrative, attempts with no retained finding,
editor instructions, question-test stamps, process remarks, repeated framing and
readiness or scope passages that repeat decisions. Drop inventories and dynamic
value tables now owned by code, tokens or specs; keep the values explicitly chosen
by the study. Delete media that the compact record no longer uses.

If the outcome date is absent, obtain it from the commit changing registry status
or the page’s last content change, and say the date comes from Git history.
Otherwise introduce no new names, values, dates or conclusions.

Rejected steps under `archive/` have no independent question or registry entry.
Retain their outcome, rejection reason, evidence and link to the parent. Preserve
links from a parent to its archived steps.

Check every keep-list item against the record. Restore omissions or report what
was dropped and why. Check all numbers and names against the original page and
ensure every retained media file is referenced.

## 4. Review the prose

Use a clean-context reviewer. Give it only the compact record,
`.agents/skills/design-study/references/writing.md`, `docs/writing-pruning.md`
and this brief:

> Remove mannered phrasing, slogans, announcements, repetition and invented jargon.
> Write plain literal sentences. Change no number, name, value, date, decision or
> reason. Remove no item. Report anything you cannot understand rather than
> rewriting it. Leave the record no longer in characters than before the pass.

Recheck facts and the keep list after review; restore anything lost. Resolve unclear
phrases from the original study when it explains them. Otherwise retain the original
wording and report the ambiguity. If a clean-context reviewer is unavailable,
report that stage as incomplete.

## 5. Retire and verify

Search the whole repository for other consumers before deleting each study-only
component, drawing module, script, fixture or test. Preserve anything still imported
elsewhere and all shared production systems. Update active documentation links to
retired source with a historical source reference or the retained record.

Add a final line naming the commit and page path of the full pre-conversion study,
plus the deleted apparatus paths. Git history holds the full exploration; the
compact page holds the findings and evidence.

Run `pnpm lint`, `pnpm test`, `pnpm check:types` and `pnpm build`. Report unrelated
failures without repairing another session’s work. Reload the resulting surface,
check every media asset, inspect the page at 1280px or wider, and verify that the
findings remain readable with JavaScript disabled. Count rendered words again.
Remove temporary capture or verification scripts that have no continuing use.

When committing the conversion, use one Conventional Commit naming the study.
Stage only the conversion’s files and authorized plan changes; preserve other
sessions’ work. Do not push unless asked.

Report the review URL, rendered words before and after, retained media, retired
apparatus, checks and evidence gaps. Distinguish automated correctness, visual
inspection and pending human judgment. Name any keep-list omission or unresolved
reviewer phrase and explain it.
