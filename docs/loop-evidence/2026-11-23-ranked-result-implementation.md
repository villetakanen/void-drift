# Ranked result implementation

## Intent and decisions

On 23 November 2026 the designer, in first-mate mode, asked to "make that change
real": implement the ranked game ending as written in the
[ranked result spec](../specs/game/game-over/ranked-result/spec.md), using the
design-system Initials component. The account below of the workers and review is
the conducting session's, not directly inspected by this record unless stated.

Decision on rotate-to-continue (designer, quoted): "we need to rethink the whole
rotate later, if it causes bugs, just flag them somewhere." The review finding
about it was therefore not fixed and is flagged in
[rotate-findings](../specs/game/game-screen/rotate-findings.md).

## Changes delivered (conducting session's account)

- `components/lab/InitialsExample.svelte` moved to
  `components/inputs/Initials.svelte`, used by the Lab page and the game.
- Added `RankedResult.svelte`, slotted into GameOver by `FlightDeck.svelte`.
- Added `loadPersonalBest` in `packages/mode-a/src/lib/firebase.ts`;
  `submitHighScore` now returns a saved, kept or failed outcome.
- Added Zod schemas and the pure rules `isNewPersonalBest`, `readPersonalBest`
  and `settleScore` in `packages/mode-a/src/schemas/highscore.ts`.
- Added a browser-local initials store, `apps/web/src/lib/stores/initials.ts`.
- Added unit tests; updated `tests/firebase/competition.spec.ts`. No Firestore
  rules change.
- Spec edits: the Initials spec path now names the new component; the Scores spec
  has a Client line about `loadPersonalBest`.

## Independent review (read-only agent, conducting session's report)

Findings: (a) the rotate-to-continue prompt unmounts GameOver, losing a pending
check or save; (b) a retry with edited initials after a timed-out save that had
committed was falsely reported as not saved; (c) the Initials spec named the
deleted Lab file. Nits: focus dropped after success; Retry stayed clickable while
navigating away; with no Firebase config the screen offered a Check Again that
could never succeed.

Reported as fixed: (b) (a stored row is recognised as this run by every field but
initials, and initials are locked while a save is in flight), (c), and all nits.
(a) not fixed, per the decision above; the findings file also notes that over a
finished run the prompt still says "Flight is paused".

## Open, raised by the worker and not decided

- Focus on open goes to Return or Hangar, because the best check is always
  asynchronous, so Initials is never present when the dialog opens.
- Retry keeps normal (non-primary) styling when Save Score is absent.
- The race and "stands" journeys are not kept as browser tests.
- `pnpm check:specs docs/specs/game/game-screen` reports an existing "spec status
  metadata is forbidden" finding in that spec.md.

## Checks

| Check | Outcome | Source |
| --- | --- | --- |
| `pnpm verify:quick` (worker, after final round) | Passed (partial verification) | Worker report; `artifacts/verification/2026-11-23T08-16-21.830Z-sfvw9u/` |
| `pnpm test:competition` (worker) | 2 passed | Worker report |
| `pnpm test:rules` (worker, first round only) | 14 passed | Worker report |
| Playwright launch-navigation, derelicts-score, dialogs (worker, first round only) | 5 passed | Worker report |
| Throwaway emulator journeys (worker) | Passed, then deleted; no artifact | Worker report |
| `pnpm verify:quick` (closing agent, direct, 2026-11-23, uncommitted tree on `08dc6a23`) | Passed (check:repo, lint, check:types, test); partial, not a full pass | `artifacts/verification/2026-11-23T08-41-05.461Z-ZEfOL5/report.json` |

Emulator and Playwright runs ran outside the sandbox because of local port
binding. The Retry-while-leaving guard is not confirmed in a browser. The
closing run did not repeat the emulator or browser checks.

## Publication

Commit and push states are recorded in the closing agent's report to the
conducting session, not here, as they follow this record's writing.

## Evidence gaps

Worker and reviewer outputs are not retained as artifacts beyond the verification
directory above; throwaway journeys were deleted. No human playtest evidence.
