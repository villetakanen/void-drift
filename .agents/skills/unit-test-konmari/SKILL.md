---
name: unit-test-konmari
description: Review and tidy this repository’s unit tests by keeping tests that protect meaningful project behavior and removing tests with no clear value.
---

# Unit Test Konmari

When activated, inventory every unit test in the repository and review each one.
Ask what project behavior or contract would regress if the test were gone.
Keep tests that protect meaningful game rules, data contracts, or known regressions.
Remove tests that only prove a browser, framework, library, or language works as designed.
Merge or revise tests that duplicate coverage or assert incidental implementation details.
For each test, record a brief keep, revise, merge, or remove decision with its reason.
When value is unclear, inspect the code and call sites before deciding; don’t guess.
Make changes only when the value judgment is clear; run affected unit tests afterward.
Report decisions, changes, and test results, including any uncertainty.
