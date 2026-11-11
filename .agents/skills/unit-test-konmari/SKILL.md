---
name: unit-test-konmari
description: Review repository unit tests by mapping meaningful regressions to their owners across the test suite.
---

Classify test suites as unit, browser/integration, rules, harness/factory, or evidence-only.
Apply this cleanup to unit tests; report other suites separately and don't prune them as unit tests.
Read current specs and the latest relevant pruning plan; check that plan findings still match the checkout.
Inventory all unit-test files before editing; don't sample or assume filenames reveal test role.
For each test, state the project behavior it protects and whether it exercises production code.
Map that behavior to existing assertions elsewhere in the repository.
Keep overlap only when each test protects a distinct boundary, such as core behavior versus app wiring.
Revise tautological, incidental, framework, or duplicated assertions; move tests to the suite that owns the behavior.
Don't set a target test count or merge unrelated cases to lower the count; preserve useful failure localization.
Before removing unique coverage, identify its surviving owner or record the uncovered contract as unresolved.
When adding tests, search for an existing owner first and extend it when the behavior is already covered.
Run affected owners and report pass, fail, skipped, and unavailable results.
For a repository-wide pass, report counts by suite and disposition, changes, surviving owners, gaps, and uncertainty.
