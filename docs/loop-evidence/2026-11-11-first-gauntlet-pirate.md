# First Gauntlet pirate experiment

Closed 11 November 2026. Scope: this chat's one-pirate implementation and push,
ending at `335da098593d3fc1a49f8b1c3d4b372fcacb3c89`.
Sources are the conversation, inspected commit, and retained verification reports.
Closure reran no gameplay or release checks.

## Intent and decisions

- Build a small playable adversary experiment: one charcoal Scout, one Ion Point
  Defence turret, one Light Ion Cannon and two Light Ion engines, with full initial
  hull and energy followed by normal resource rules.
- Use physical flight and a bounded predictive pilot to pursue the player. Shared
  flight rules were an explicit interest; future local/network multiplayer was
  outside this implementation.
- The designer clarified that Gauntlet names an experimental combat entry, not a
  specification of an eventual progression mode.
- The designer added a space-purple `3, 2, 1, FIGHT` countdown.
- Development used Luna high; focused reviews used Terra medium. The coordinating
  agent inspected the shared simulation boundaries and integrated verification.
- A second pirate was subsequently requested for another session. This chat
  supplied a handoff prompt; that implementation is outside this loop.

## Delivered revision

[Commit 335da098](https://github.com/villetakanen/void-drift/commit/335da098593d3fc1a49f8b1c3d4b372fcacb3c89)
adds shared mounted-actor stepping, a single independently controlled pirate,
live-ship contacts through the existing weapon system, swept ship collisions,
encounter outcomes, charcoal rendering, purple countdown and `/lab/gauntlet`.
The Lab consumes production simulation and rendering and exposes pilot diagnostics.

Inspect the one-pirate contract at that revision with
`git show 335da098:docs/specs/game/gauntlet/spec.md`; the current
[Gauntlet contract](../specs/game/gauntlet/spec.md) has since changed.
The retained [plan](../plans/2026-11-11-gauntlet-first-pirate.md) records the proposed
scope; it is not completion evidence.

Under the repository's whole-checkout snapshot rule, the same commit also includes
concurrent fission-light and stellar-encounter studies and design-study guidance.
Those changes were not authored or reviewed as part of this adversary experiment.

## Review observations and corrections

The following were observed during implementation, rather than inferred from
passing checks:

- The initial actor helper did not serve the player. It was changed to share
  mounted flight stepping with the player, pirate and prediction paths.
- Core `updateShip` also advanced planet orbits. Calling it for multiple actors
  and predictions would advance live world time repeatedly. Gauntlet now advances
  the world once per substep; predictions use scratch planet state. A focused
  test checks world-time advancement and prediction isolation.
- The initial separate combat path changed rail travel and weapon ordering.
  It was replaced with live-target support in `SalvageSystem`, preserving the
  existing weapon execution pipeline.
- Review also found arrival activation, player weapon presentation, countdown
  state and swept collision separation issues. The developers corrected them.
  Terra's final scoped review reported no remaining blockers; that is a review
  result, not a certification of all behavior.

## Verification evidence

All reports below identify dirty trees based on
`449c8ff43854821c531960ceb3c84e410f7b4289`, not the eventual committed snapshot.
They record Node `v24.14.0` on `darwin/arm64`; backend runs used the repository's
Java 21 runtime. Each report retains its source fingerprint and individual logs.

| Run and command                                                                                                                                          | Observed outcome                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [20:12 full](../../artifacts/verification/2026-11-11T20-12-12.227Z-9qUpwI/report.json), `pnpm verify`                                                    | Contracts, commit syntax, unit tests, build, rules and competition passed. Lint and types failed; browser startup failed because port 4322 was occupied. Source changed; aggregate failed.                     |
| [20:14 full](../../artifacts/verification/2026-11-11T20-14-53.472Z-QPjjUI/report.json), `PLAYWRIGHT_PORT=4342 PLAYWRIGHT_FIREBASE_PORT=4343 pnpm verify` | Contracts, commit syntax, lint, types, units and build passed. Browser port binding failed with sandbox `EPERM`; backend lifecycle failed and rules/competition did not run. Source changed; aggregate failed. |
| [20:16 full](../../artifacts/verification/2026-11-11T20-16-22.989Z-0dNwzn/report.json), same ports with local-server permission                          | Contracts, commit syntax, types, units, build, full browser suite, rules and competition passed. Lint failed on a concurrent stellar-encounters reference JSON. Source changed; aggregate failed.              |
| [20:27 quick](../../artifacts/verification/2026-11-11T20-27-21.756Z-eVSTKc/report.json), `pnpm verify:quick`                                             | Contracts, lint, types and units passed. Source changed, so the partial run failed. Commit syntax, build, browser, rules and competition were skipped by quick mode.                                           |

The JSON formatting issue was corrected and a subsequent standalone `pnpm lint`
passed (967 files), as observed in this chat's tool output. The commit's Biome
and commit-message hooks passed after the message was wrapped to its line limit.
These results do not convert any failed aggregate report into a pass.

The developer reported five focused Gauntlet tests passing. The presentation
developer reported two focused Playwright tests passing, including actual Lab
ticks/pixels and absence of page errors. The coordinating agent inspected the
1440×900 production and Lab captures. The refreshed Lab capture used seed 248901
at 2.2 seconds; the earlier blank capture preceded its first presented frame.
The captures were temporary files at `/private/tmp/gauntlet-production-1440x900.png`
and `/private/tmp/gauntlet-lab-1440x900.png`, not retained versioned evidence.

## Measurement limits

The developer's final report gives four rollout candidates, approximately
9.46–10.10 ms for a direct planner call, and 733–775 ms total simulation CPU time
for 600 ticks. Its stationary seed had no discharges; its thrust seed recorded
one player cannon and one turret discharge and pirate hull 98.
Earlier development reports described more pirate firing and higher CPU cost;
the developer attributed those to a 12-candidate trial. These are reported
measurements from changing working trees, not a controlled comparison.
The temporary diagnostic test was removed and no durable raw timing artifact was
retained. No sustained rendering-performance claim follows from these numbers.

## Commit, push and later work

- Local commit: `335da098`, created with normal hooks.
- Push: the tool reported `449c8ff4..335da098 main -> main`; the subsequent
  `origin/main` check matched the commit and the working tree was clean then.
- Deployment/live verification: neither was performed in this loop.
- At closure, the checkout is at later revision `d718d29b` with additional dirty
  study/release files. The inspected [0.6.1 release record](../releases/0.6.1.md)
  reports later two-pirate verification, publication and live checks. Those belong
  to a separate session and do not retroactively verify this loop's snapshot.

## Evidence gaps and boundary

There is no successful stable-source aggregate verification report for this
loop's committed snapshot. Individual passing stages span changing trees.
Verification artifacts are ignored local files and may not survive cleanup or
another checkout. Review messages and temporary measurements are attributed above
where no standalone artifact exists. No production, skill or test-policy changes
are made by this closure; it records no lessons or release-readiness conclusion.
