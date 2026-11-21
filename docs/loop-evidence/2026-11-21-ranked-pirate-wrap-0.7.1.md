# Ranked pirate wrap and 0.7.1 · 21 November 2026

## Intent and decisions

The designer reported ranked pirates vanishing at the boundary. The assigning
session reports the explicit decision to make them wrap like the player and stay
active, retaining derelict departure behavior and the current challenge name.
Only pirate destruction should start the seeded 45–60 gameplay second replacement
wait. The designer subsequently requested a version bump to 0.7.1 and closure.
These decisions apply to ranked Survival pirates; no broader behavior decision is
inferred.

The initial investigation found that shared actor physics wrapped the pirate,
then a Survival-specific displacement check marked it destroyed. Existing tests
and the prior Survival spec expected departure to trigger replacement. That
investigation is attributed to the implementation session; closure directly
inspected the removal of that block and the old expectations in the Git diff.
The pre-change tests passing below are counterevidence to any claim that those
checks already guarded the newly requested behavior.

## Delivered changes and revision

Closure inspected the dirty tree on branch `feat/0-7-0`, based on HEAD
`3a19a9bf0f714be9a46b0202208f96128d552297`. No commit identifies these changes.
Other concurrent Lab, factory and documentation changes were present and remain
outside this loop. The historical complete dirty-tree identity used by each check
was not retained; closure's scoped hashes below identify only the inspected files.

- [Simulation](../../packages/mode-a/src/lib/simulation.ts), around line 615:
  removed the Survival-only post-physics destruction block. The destruction-only
  replacement scheduler remains around line 1147.
- [Encounter tests](../../packages/mode-a/src/lib/survival-encounter.test.ts),
  lines 114 and 148: separate destruction timing from wrapping; assert the same
  live Scout remains present after checks at 45, 60 and 61 gameplay seconds.
- [Score tests](../../packages/mode-a/src/lib/survival-score.test.ts), line 90:
  wrapping retains the pirate without awarding destruction points.
- [Salvage test](../../packages/mode-a/src/lib/salvage.test.ts), line 108:
  explicitly assert the exited wreck is absent.
- [Survival spec](../specs/game/survival/spec.md), lines 74 and 178:
  record wrapping, identity retention and destruction-only replacement; the
  document remains draft and its provenance was updated.
- Set `version` from 0.7.0 to 0.7.1 in the [root](../../package.json),
  [web](../../apps/web/package.json), [core](../../packages/core/package.json)
  and [mode-a](../../packages/mode-a/package.json) manifests.

Direct closure inspection found no diff in
[highscore.ts](../../packages/mode-a/src/schemas/highscore.ts) or
[firestore.rules](../../firestore.rules); `CHALLENGE` remains `fires-in-the-sky`.
The [landing announcements](../../apps/web/src/data/landing-hints.ts) still name
the historical 0.7.0 release.

Scoped closure fingerprint: `d0f4c58b53e1d31d9965d06af4f5a55b99052e4fca68c6011e758082c507cd97`. This is SHA-256 of a UTF-8 manifest with one `SHA-256  relative/path` line per delivered file, in the order simulation, encounter test, score test, salvage test, Survival spec, root/web/core/mode-a manifests listed above, each ending with a newline. It identifies closure content, not a historical tested tree.

## Checks and observations

The checks ran in the shared Mac checkout at
`/Users/ville.takanen/dev/void-drift`. Runtime versions and complete per-run source
fingerprints are unavailable. Outcomes below come from the assigning session or
implementing worker's tool output in this chat, not retained report files inspected
by closure. No historical check was rerun during closure.

| Command or observation | Outcome, stage and attribution |
| --- | --- |
| `pnpm test packages/mode-a/src/lib/survival-encounter.test.ts packages/mode-a/src/lib/survival-score.test.ts` | Assigning agent directly observed 17 tests pass before the fix, against the old departure behavior. |
| `pnpm test packages/mode-a/src/lib/survival-encounter.test.ts packages/mode-a/src/lib/survival-score.test.ts packages/mode-a/src/lib/salvage.test.ts packages/mode-a/src/lib/gauntlet.test.ts` | Fix worker reported 4 files / 49 tests passed at 20:49:42 local, before the final explicit wreck-exit assertion. |
| `pnpm test packages/mode-a/src/lib/salvage.test.ts` | Fix worker reported 17 tests passed at 20:50:06 local, after that assertion. |
| `pnpm check:specs docs/specs/game/survival` | Fix worker reported zero findings, including a repeat after verified metadata was added. |
| `pnpm check:contracts` | Fix worker reported reference/token/architecture checks and 18 factory tests passed, zero failures. Unrelated concurrent factory changes mean this does not identify an isolated fix-only tree. |
| `pnpm exec biome check packages/mode-a/src/lib/simulation.ts packages/mode-a/src/lib/survival-encounter.test.ts packages/mode-a/src/lib/survival-score.test.ts packages/mode-a/src/lib/salvage.test.ts` | Fix worker reported 4 files passed, no fixes. |
| `pnpm exec tsc -p tsconfig.check.json` | Assigning agent directly observed exit 0 after the fix. |
| `pnpm exec biome check packages/mode-a/src/lib/simulation.ts packages/mode-a/src/lib/survival-encounter.test.ts packages/mode-a/src/lib/survival-score.test.ts` | Assigning agent directly observed exit 0 after the fix. |
| Version consistency assertions; Biome on all four manifests; `git diff --check` | Version worker reported passes after bumping to 0.7.1. Exact assertion invocation and retained output are unavailable. |
| Reload of `http://localhost:4321/` | Assigning agent directly observed `ACTIVE SHIP · Wasp 0.7.1` in the local browser. No screenshot artifact was saved. This verifies the displayed version, not in-flight wrap behavior. |
| `pnpm dev:ensure` / `pnpm dev:status` | Commands printed checkout/log information but remained running while the UI worked. They are not recorded as successful readiness checks. |

## Publication and gaps

No local commit, push, deployment or deployed-site verification was performed in
this loop. The local version display is separate from publication. The earlier
[0.7.0 release record](2026-11-21-release-0.7.0.md) concerns a different revision
and does not verify these changes.

Retained run reports, exact historical full dirty-tree identities and a saved
browser capture are unavailable. The worker's factory checks used ephemeral
macOS temporary fixtures under `T/void-release-*`; these are not retained task
artifacts. No full verification, production check or in-flight browser wrap
observation is recorded for this loop. The designer's initial bug report supplies
the observed symptom, not a later acceptance verdict. No general lesson or release
readiness claim follows from this closure.

Closure changed only this record. Its local Markdown link targets and whitespace
were validated; implementation checks were not rerun. Unrelated dirty changes were
preserved.

## Release closeout — 21 November 2026

Candidate `b4a4a473` was pushed in PR #16 and merged to `main` at 19:51:10Z as
`ac3d791311ddfe2bfec6133fd358f26a434607a5`. Tag `v0.7.1` was pushed at the exact
deployed commit.

The Survival spec frontmatter was normalized under the updated write-spec rules:
title and status were removed, and verification was reset to empty because no
human confirmation was recorded.

Final full verification passed on `main` at that revision with Node 24.14.0,
Darwin arm64 and Java 21. The retained report is
`artifacts/verification/2026-11-21T19-51-30.447Z-2wMGNv/report.json`. Contracts,
commit syntax, lint, types and build passed; unit tests passed (436 across 82
files), browser checks passed (29), Firestore rules tests passed (14), and the
competition journey passed (2). The candidate run first failed only because Java
was absent from `PATH` (`19-42-02.626Z-zSUKuA`); it passed after the local Java 21
runtime was added to `PATH` (`19-44-32.003Z-oJLDsq`), followed by the final main
verification above.

Initial release preparation failed with `EPERM` while binding locally in the
sandbox (`artifacts/prepared-releases/2026-11-21T19-55-01.982Z-mkFHYx`). Preparation
succeeded with loopback access in
`artifacts/prepared-releases/2026-11-21T19-55-22.902Z-hckGR8`, and
`release:check` passed. Its publication report records deployment complete at
19:56:17.971Z: Firestore rules were already up to date and Hosting was released.

Live verification passed at 19:57:44Z in Chromium 156.0.8078.4 at 1280×720;
`artifacts/live-release-0.7.1/report.json` records the 0.7.1 version and matching
published HTML/JavaScript hashes, keyboard flight and pause, FX Lab operation,
anonymous authentication and score reads, with no page errors or score writes.
Verification, preparation, publication and live reports are ignored local
artifacts, not durable records. These checks do not imply human playtest approval.
