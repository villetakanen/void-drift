---
name: unit-test-konmari
description: Prune unit tests only on explicit user request. Keep reliable guards whose long-term regression value justifies their maintenance cost.
---

## When to run

Run only when the user explicitly requests test pruning or suite maintenance.
During implementation, debugging and verification, agents are expected to write
whatever tests help them deliver confidently. Permanent retention is not a
condition of delivery. Preserve checks still needed by ongoing work.

## Prune by failure, not by test

1. Inventory unit-test files; label the review as a sample if requested. Flag
   and leave others’ uncommitted changes alone.
2. Group checks across files by the concrete failure they catch. Read relevant
   specs for intent, not coverage: Gherkin does not oblige a test. Ask what
   would catch the failure without this group: other tests, types, builds,
   browser or rules checks, or an obvious failure in play or the Lab.
3. For a failure worth guarding long term, keep the lowest-maintenance reliable
   guard. Extract any unique assertion before deleting redundant tests. Keep
   another test or matrix case only if it catches a materially different
   failure. If no unit guard earns its upkeep, remove the whole group.

Prioritise silent data loss, integrity boundaries, plausible scoring or replay
errors, exploitable limits, past bugs likely to recur and tricky invariants.
Prune implementation mirrors, tuning pins, visual geometry, framework behaviour
and Lab internals unless they are needed to guard a meaningful failure. Churn
from edits that fix no bug argues for replacement or deletion, not just shortening.

## Scope and report

Prune unit tests only. Flag removals that need a product decision. Don’t target
a count or keep a separate list. Report what was removed or consolidated, where
protection remains and any meaningful regression deliberately left unguarded.
Report verification outcomes and distinguish browser, rules, factory and evidence
suites. If asked for a percentage, discuss edits per change, false failures and
runtime instead.
