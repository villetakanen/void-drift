---
name: browser-test-konmari
description: Keep browser, smoke and e2e tests that guard significant regressions worth their maintenance; remove implementation demonstrations, configuration pins and redundant journeys. Use when pruning, reviewing or adding Playwright tests. Report release smoke, backend journeys and review captures separately.
---

A test earns its place by preventing a significant problem that would otherwise
escape. The main cost is maintaining it: tokens, human attention and agent edits
on changes that fixed no bug. Runtime is a secondary cost. Coverage is not a goal.

Needing a browser does not make a test valuable. A spec reference, a different
route or a real click is not enough either. Agents often write tests to prove
that their implementation works; that does not make those tests lasting guards.

## Keep: guards

- Silent loss or corruption of saved choices through real application startup,
  editing and reload, where cheaper guards miss the integration failure.
- Integrity boundaries across real clients and services: eligible submissions,
  saved results, rejected writes and recovery without losing the user's result.
- Stateful browser failures with significant consequences: stuck input,
  background catch-up, input leaking through pause or a modal, trapped navigation.
- One representative journey that catches an otherwise untested broken release:
  boot, real input reaching play, run ending and fresh entry.
- A tricky browser-dependent algorithm's invariant, or the smallest reproduction
  of a real bug that could recur unnoticed. Name the consequence, not just the API.

These are candidates, not automatic exemptions. A guard still needs marginal
value beyond the other retained tests and a maintenance fee worth paying.

## Remove

- Implementation demonstrations: control X changes attribute Y, every selector
  option works, a specimen renders, each catalog item can be fitted.
- Native browser/framework behaviour: buttons click, links navigate, CSS accepts
  a filter, ordinary controls take focus. Keep only the application's risky state
  transition around them, where needed.
- Configuration and art pins: catalog values, classes, labels, colours, dimensions,
  filter recipes and painter calls. Deriving expectations from configuration does
  not redeem a mirror. Layout relations also need a significant hidden failure;
  "no exact pixels" alone does not earn a geometry test a place.
- Repeated journeys for ships, parts, modes, routes, widths or input aliases that
  add no material regression protection.
- Study/instrument demonstrations whose failure is obvious when using the page.
  Shared production code inside a Lab page is not an automatic exemption.
- Checks already owned by meaningful unit, schema, build or backend guards.
  Do not add unit tests merely to relocate discarded maintenance.
- Review screenshots in required correctness runs. Keep useful opt-in captures,
  not a capture for every removed test. Failure traces/screenshots stay available.

## Three questions per test

1. Escape: what significant problem would plausibly ship unnoticed without it?
2. Guard: does it catch that problem, rather than confirm how the code was built,
   and which remaining test would miss it?
3. Fee: is that protection worth the tokens, attention and edits it demands when
   intended behaviour has not broken?

Keep only concrete answers to all three. Extract a valuable guard from a mixed
test before deleting the demonstration around it. Visible total breakage justifies
one representative smoke journey, not a test for every working surface.

## Method

- Inventory every candidate file and runner; label sampled reviews as samples.
  Read relevant intent and existing guards before claiming duplication.
- Ask what would survive if nearly everything had to go. Use that thought
  experiment to challenge exemptions, never as a deletion quota.
- Name each retained test's failure risk and each removed test's remaining guard
  or deliberate gap. Keeping a feature does not require keeping its browser test.
- Separate offline journeys, built-artifact smoke, backend integration and opt-in
  captures. Keep genuinely different failure boundaries, not duplicated assertions.
- Retain network isolation and uncaught-error checks for retained journeys. Use
  isolated ports and output directories when verification runs share a checkout.
- Leave other sessions' uncommitted lines alone. Do not remove a required gate or
  retire product behaviour as a side effect. Keep specs honest about verification
  responsibility without deleting acceptance behaviour to justify the prune.
- Run the affected retained suite; repair failures without weakening the guards.
  Test authoring is allowed during development; permanence must be earned here.

## Report

- Per file: guards kept/extracted, demonstrations removed, surviving protection
  and deliberate gaps. Distinguish a removed test from a retired feature.
- Lead with maintenance obligations removed and valuable protection retained.
  Counts and observed runtime are outcomes, not success criteria. Do not invent
  churn measurements or savings from a source diff.
- Report pass, fail, skipped, interrupted and unavailable checks explicitly.
