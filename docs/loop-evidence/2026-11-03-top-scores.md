# Top Scores and run-complete UI — 2026-11-03

## Intent and owner decisions

Allow each anonymous identity to retain its best time on each ranked craft; open
Top Scores after successful saving; show the top 30 times. Align Top Scores and
run complete with the existing design system. Save Score is primary; Play Again
is secondary. The owner clarified: “when the buttons are under each other,
there’s no background”; horizontal rows retain the black group background.

The owner rejected the first pane-only treatment: “The leaderboard to me doesn't
still follow the design system, does it?” The subsequent revision centered the
logo and heading inside the pane and revised typography, spacing and table rows.
No owner acceptance of that final composition was recorded.

## Local changes

Base revision: `c9b115cf4cf6bade664f22258b3db759c3d3f5a4` on `feat/0-5-0`.
All implementation changes remain uncommitted. Initial working tree inspection
was clean; the 13 modified files at closure belong to this conversation.

- Existing score IDs already separate anonymous identities and ranked crafts;
  retained that behavior and added coverage for both identities on all four crafts.
- Increased query and Firestore list limit from 20 to 30; successful submission
  navigates to `/leaderboard`, including when an existing better time is retained.
- Top Scores uses the shared panel, a centered logo/header, token-based typography,
  neutral data, aligned survival values and responsive action strip.
- Run complete uses one vertical action group: filled Save Score, ghost Play Again
  and Top Scores. Updated affected browser selectors and current contracts.
- Shared strips remove their group background when stacked below the existing
  container threshold. This applies to all consumers.

## Verification evidence

Reports and logs below were directly inspected during closure. Earlier outcomes
are retained as historical evidence, not passes for the final source.

- Final `pnpm verify:quick`: selected checks passed (contracts, lint, types, unit
  tests), source unchanged during run. This is partial verification; commit checks,
  build, browser and backend stages were skipped by this command.
  [Report](../../artifacts/verification/2026-11-03T16-22-02.402Z-aZIM2d/report.json).
  Dirty-source fingerprint: `4ef20a7cae2fc5cc6c60bd11ba83a5405ece3d19312e4670c21e2a6ad5003e22`.
  Environment: macOS arm64, Node v24.14.0.
- Final separate `pnpm test:backend`, with repository Java 21 and permission to
  start local emulators: 11 rule tests and one Chromium competition test passed.
  The latter covers two anonymous pilots, rejected-write retry, successful-save
  navigation and reading both scores.
  [Rules log](../../artifacts/verification/backend-XaMLyS/test-rules.log),
  [competition log](../../artifacts/verification/backend-XaMLyS/test-competition.log).
  Run against the same implementation worktree; these logs do not independently
  establish a source fingerprint.
- Earlier full `pnpm verify` passed contracts, commits, lint, types, units and build,
  but failed browser startup (`listen EPERM` on 127.0.0.1:4322); emulator lifecycle
  did not reach rules or competition. It predates the final UI changes.
  [Report](../../artifacts/verification/2026-11-03T16-17-33.470Z-lyrkBk/report.json).
- Intermediate quick runs: the first failed overall because sources changed during
  verification; another failed formatting in builder.spec.ts. Later quick runs
  passed after edits/formatting. These are not final-source full verification.

## Visual observations and limits

The assistant inspected the revised desktop error-state screenshot in the local
browser: centered panel, integrated logo and heading, horizontal black action row.
An earlier narrow screenshot showed the stacked action group without a group
background after the shared-rule correction. These were transient tool images,
not saved review artifacts. The final populated table and final narrow composition
were not visually inspected. Automated competition verifies populated content,
not visual fidelity. End-of-game visual review remains unavailable.

The local preview displayed “Missing or insufficient permissions.” The assistant
attributed this to the undeployed 30-entry rule; that cause was not independently
verified against deployed rules. No production data was written for verification.

## Publication and closure boundary

No implementation commit, push, deployment or live verification was performed.
The previous release commit is only the base revision. Full final-source browser
and build gates remain unverified. No 30-row visual fixture was reviewed.
Local ignored verification artifacts may not survive cleanup; essential outcomes
are summarized here. Closure records evidence only and does not establish design
acceptance or release readiness. No lessons or standing rules are inferred.
