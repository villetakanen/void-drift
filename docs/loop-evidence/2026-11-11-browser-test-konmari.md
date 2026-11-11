# Browser-test KonMari closure

Closed 2026-11-11. Scope: define a browser-test pruning skill from the existing
unit-test KonMari approach, then apply it to all 41 offline browser files present
at the start. Built-release smoke, backend journeys and opt-in review captures
were inspected separately. No publication was requested or performed.

## Intent and decisions

The first pass reduced 134 browser cases to 117 by removing recipe pins and
duplicated demonstrations. The designer clarified that the primary cost is
maintenance: tokens, human attention and agent edits. A test needing a browser,
referencing a spec or demonstrating working code is insufficient justification.
The designer described deleting 90% as a thought experiment, not a removal quota.

The subsequent pass retained tests for significant otherwise-escaping failures
whose protection warrants their maintenance. Product behaviour and required gate
membership were preserved; explicit automation gaps are recorded in the
[file-by-file review](../reviews/2026-11-11-browser-test-konmari.md).

## Delivered changes and identity

- Added and revised the [browser-test skill](../../.agents/skills/browser-test-konmari/SKILL.md).
- The original inventory went from 134 cases in 41 files to 21 guards in 15 files:
  26 files and 4,904 of 5,827 lines removed. Demonstrations were not relocated into
  new unit or capture suites. Existing seven opt-in review files remain.
- Retained save integrity/recovery/handoff, eligibility, input release/cancellation,
  suspension, modal isolation, run reset, edited-document integrity and custom
  Canvas-history/isolation guards. Updated verification descriptions and removed
  stale Lab-spec automation references without removing acceptance behaviour.
- Another session added two Gauntlet cases during the work. Those lines were
  left untouched; the final current-suite run included both.
- Closure inspection found branch `main`, HEAD
  `335da098593d3fc1a49f8b1c3d4b372fcacb3c89`, with this work and unrelated game,
  rendering and study changes uncommitted. This is a closure reference, not a claim
  that the browser run tested that commit alone. No commit was made by this loop.

## Verification evidence

Local evidence directory:
[browser-konmari/2026-11-11-xi3m98qh](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/).
Reports/logs below were directly inspected during closure; no tests were rerun
for closure. Commands ran in this macOS shared checkout. Browser evidence uses
Playwright 1.64.1, headless Chromium, one worker, an owned localhost server and
isolated result paths. Exact browser binary version was not retained in the JSON.

| Check                                                                                                   | Outcome and source                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retained 21-case browser run                                                                            | Passed, 91.8 s; [report](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/guards-results.json).                                                                                                                                                                                                      |
| Final `PLAYWRIGHT_PORT=4398 … pnpm exec playwright test --output=… --reporter=list,json`                | 23 passed, zero skipped/unexpected/flaky, 102.7 s; [report](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/current-results.json), [log](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/current.log). Includes 21 retained guards and two concurrent Gauntlet cases.                           |
| `pnpm test`                                                                                             | Failed: 185 passed, one FX-isolation test exceeded 5 s while browser verification was active; [log](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/unit.log). Concurrency was observed; its causal role was not established.                                                                       |
| `pnpm exec vitest run packages/mode-a/src/lib/fx-integration.test.ts`                                   | Passed unchanged on focused rerun, test duration 1.76 s; [log](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/fx-unit-rerun.log). Does not relabel the full unit run a pass.                                                                                                                       |
| `pnpm check:contracts` and later `node scripts/check-contracts.mjs`                                     | Passed, including 15 factory tests in the earlier gate. Later documentation check retained the existing 81-line AGENTS.md warning; [gate log](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/contracts.log), [later log](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/final-contracts.log). |
| Biome on retained 15 files; `pnpm exec tsc -p tsconfig.check.json`; skill validator; `git diff --check` | Reported passed in this chat's tool outputs. Dedicated run-local logs were not retained for these commands.                                                                                                                                                                                             |
| Full `pnpm verify`, production build, backend/rules and built-release smoke                             | Not rerun in this loop. Their runners and gate membership were unchanged.                                                                                                                                                                                                                               |

The [test-source snapshot](../../artifacts/browser-konmari/2026-11-11-xi3m98qh/current-source.json)
retains SHA-256 hashes. Closure comparison confirmed all 15 reviewed files still
match it; the concurrent Gauntlet file differs. Application source was also being
edited by other sessions, so these results do not certify a stable release candidate.

Earlier exploratory runs were interrupted. A shortened damage assertion failed
on DOM whitespace and was repaired before that demonstration was ultimately
removed. A shared Playwright output collision invalidated another exploratory
run; initial startup attempts also encountered sandbox/occupied-port failures.
None is counted as a full pass. The final run used isolated artifacts.

## Human feedback and limits

After the final pruning report, the designer said: “Beautiful, thanks, very good
work. Close loop.” This is feedback on the pruning work, not gameplay acceptance
or live verification.

No push, deployment or live verification was performed. Remote state was not
inspected. Local artifacts are ignored and can be removed; essential outcomes are
summarized here, but traces/logs are not durably backed up by this record. There
was no controlled runtime baseline or measurement of token savings, maintenance
churn or false-failure reduction. This closure collects evidence and promotes no
additional lessons or requirements.
