# 0.7.0 release text polish · 21 November 2026

## Intent and decisions

This bounded loop removed remaining RC1 wording and supplied the missing version
prefix in rotating title announcements. The designer approved all five proposed
polish points: “Yeah, yep. Let's make all that happen. Um, do it.” The later
instruction “close loop” requested this evidence record; it supplied no further
quality assessment or gameplay acceptance.

Delivered changes, inspected again during closure:

- Set the root, web, core and mode-a package manifests to `0.7.0`.
- In [landing hints](../../apps/web/src/data/landing-hints.ts), use
  `0.7.0 — Fires in the Sky` for both release announcements and remove the
  redundant own-leaderboard announcement.
- Set the other copy to “Sometimes small is big. Try the new Service drive!”
  and “Change the camera mode or turn off Combat HUD in Settings.”
- Change “0.7 release candidate” to “0.7 release” in
  [architecture](../architecture.md).
- Create [the 0.7.0 release note](../releases/0.7.0.md).

The [game contract](../specs/game/spec.md) identifies the web package version as
the source for title-screen and leaderboard labels, separately from the ruleset.
This loop made no gameplay or ruleset change.

## Revision and evidence provenance

Implementation and its checks were reported on the then-uncommitted shared tree.
Its complete dirty-tree fingerprint was not retained. Closure directly inspected
a subsequently clean checkout at
`037d639162a43855ecaa3407e216d5eed789649b`. Commit
`84d23b028dbd95d7430bae781f7682b2076de826`
(`chore(release): prepare 0.7.0 Fires in the Sky`) contains the seven relevant
files and the polish described above. That later commit identifies the retained
changes; it does not establish the exact tree used by the earlier checks.

The following historical evidence is attributed to the assigning session's
handoff, not reconstructed by closure:

| Check or observation | Outcome and limits |
| --- | --- |
| Scoped Biome check | Implementing worker reported five files passed. Exact invocation and saved output unavailable. |
| `pnpm check:contracts` | Worker reported success: 330 Markdown files, zero missing targets and 18 factory tests passed. No saved run log identified. |
| `git diff --check` | Worker reported success; assigning agent also directly ran it successfully before closure. Historical full tree identity unavailable. |
| Shared browser at `http://localhost:4321` | Assigning agent observed `0.7.0` on the title and Top Scores. At 1280 × 720 the plasma announcement wrapped to two lines without clipping. Snapshot and screenshot evidence remains in chat only. |
| Browser waits | Two waits for the plasma selector timed out. One observation showed a narrowed viewport and landscape prompt. The agent restored 1280 × 720; the final wait and screenshot succeeded, then the viewport was reset. No causal explanation for all timeouts is established. |
| `pnpm dev:status` / `pnpm dev:ensure` | Status reported the shared preview ready on port 4321 and log `artifacts/shared-preview/astro.log`. Ensure yielded an ongoing session despite the site being ready. The log is mutable and is not a retained historical run artifact. |

No gameplay verification or human playtesting claim follows from these copy and
layout observations. Full verification and release preparation/checks were not
performed within this polish loop.

## Publication boundary and later evidence

This polish loop performed no commit, push, deployment or live verification.
Those states subsequently changed outside this loop: the release note at closure
HEAD records publication on 21 November, deployed tag `v0.7.0` at
`7ba2c76e93b622c618bfc62bb0a3343e94f20ab4`, PRs #14 and #15, full verification,
bundle preparation and live checks. It also records two failed full runs and
their subsequent fixture repair, and names run-specific local artifact paths.
These are claims attributed to that later publication record; closure inspected
the document, not the deployment or its artifacts. Publication is therefore not
an outstanding action inferred from this polish record.

## Closure validation and gaps

Closure checked only this new documentation: local Markdown link targets exist
and the file has no trailing whitespace or malformed final newline. No tests,
preview checks or historical failures were rerun. The closure added only this
record and made no implementation changes.

The historical dirty-tree identity, exact Biome invocation and retained check
logs are unavailable. Browser captures are chat-only; the preview log is mutable.
The later release record describes its local artifacts as ignored files rather
than a durable backup. This record preserves attribution and essential outcomes;
it does not certify release readiness, product acceptance or factory quality.
