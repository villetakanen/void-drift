# Gauntlet pirate refit · 19 November 2026

## Intent and scope

The designer requested a Gauntlet-only pirate Scout refit ahead of the upcoming
release: “engines on sides: service ion”, “top-slot: plasma rifle” and
“aft-slot: plasma engine”. The change covers the production pirate loadout and
its living Gauntlet contract. The designer then requested commit and push.

## Delivered

- Commit `9a8590fd848f2a0b710a0bda181236c4bf7469c7`
  (`feat(gauntlet): refit pirates with plasma gear`) changes the side engine to
  Service Ion, the top hull slot to Plasma Rifle and the aft slot to Plasma.
- The same commit updates the Gauntlet contract and keeps ion-combat test
  fixtures independent from the production pirate fitting.
- The commit is on `feat/0-7-0` and was pushed to `origin/feat/0-7-0`. At
  closure, `git status -sb` reported the branch aligned with its upstream.
- Other workspace edits were present and remained uncommitted; they were not
  part of this commit.

## Checks and publication

- `git diff --check` passed for the three changed files before commit. This was
  a whitespace check on the working tree; no separate log was retained.
- The pre-commit Biome hook checked three files and reported no fixes. The
  commit-message Conventional Commit hook passed. Both ran on the staged
  contents that became commit `9a8590fd`.
- The Gauntlet test suite and other tests were not run. No deployment or live
  verification occurred.

## Human feedback and evidence limits

The designer’s fitting request is direct evidence of the accepted configuration
for this Gauntlet change. It is not evidence of in-flight behavior, balance,
release readiness or a general fitting preference. No human playtest feedback
or Gauntlet encounter recording was supplied. Runtime behavior and release
acceptance remain unknown from this loop’s evidence.

## Sources

- [Production pirate loadout](../../packages/mode-a/src/lib/gauntlet.ts), at
  commit `9a8590fd`.
- [Gauntlet contract](../../docs/specs/game/gauntlet/spec.md), at commit
  `9a8590fd`.
- [Loadout and combat fixture assertions](../../packages/mode-a/src/lib/gauntlet.test.ts),
  at commit `9a8590fd`; these were not executed in this loop.
- Commit and push outcomes are reported in the development session; there is no
  separate retained command log.
