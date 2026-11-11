---
name: unit-test-konmari
description: Keep the unit tests that guard silent, significant regressions; remove tests that restate code, pin configuration or fail loudly elsewhere. Use when pruning, reviewing or adding unit tests.
---

A test earns its place by catching a regression that would otherwise ship
unnoticed. Coverage is not a goal: every test costs tokens and edits on every
change that touches it.

## Keep: guards

- Silent loss of data or state: saves, migrations, recovery, parsing of external input.
- Integrity and security boundaries: schemas for stored or submitted data, access rules.
- Rules whose breakage still looks plausible: scoring, run endings, determinism, replay, seeded scheduling.
- Limits players can exploit or nobody sees break: speed ceilings, energy floors, bounded effect budgets.
- A real bug that happened and could recur silently, at its smallest reproduction.
- An invariant of a tricky algorithm, stated as a property over many inputs.

## Remove

- Mirrors: the expected value is worked out the way the code works it out, or restates a table, formula or branch.
- Configuration pins: a setting compared with its own value, directly or through a literal that holds only for today's tuning. Deriving the literal from the setting does not redeem it.
- Art and layout geometry: coordinates, sizes, colours, strokes, mirrored mounts.
- Loud failures: anything the type check, the build, a browser journey or the Lab page shows at once.
- Study and instrument internals, unless a shipped surface depends on them.
- Framework and library behaviour.

## Three questions per test

1. Silent: would this regression ship unnoticed without the test?
2. Contract: does a spec state the behaviour, rather than the code happening to do it?
3. Fee: has it been edited by changes that fixed no bug?

Keep a test when 1 and 2 are yes. When 3 is yes, reduce it to the one relation that guards.

## Method

- Read the relevant specs; list their silent acceptance criteria and find the guard for each.
- List every unit-test file first. Review a sample when asked, and label the result as one.
- Pull guards out of mirror-shaped tests before deleting the rest.
- Prefer one behavioural relation per guard over a matrix of cases.
- Prune unit tests only; report browser, rules, factory and evidence suites separately.
- Never target a count; the count is the outcome.
- Flag files with someone else's uncommitted changes, and leave their lines alone.
- When asked for a percentage, answer in edits per change, false failures and run time. List removals that need a product decision, such as retiring a study or a legacy path.

## Adding tests

- Agents may write tests while building to verify their work; they can stay until the next KonMari.
- Run a KonMari from time to time to keep only what passes the three questions.
- Before adding a guard, check whether one already covers the contract.

## Report

- Per file: guards kept, guards extracted, tests removed, and spec criteria left without a guard.
- Pass, fail, skipped and unavailable results for what you ran.
