# Ranked result spec and project terminology

## Intent and decisions

On 23 November 2026, the designer asked to discuss and write a spec for the
ranked portion of game over: checking a personal best, entering initials,
saving and showing scores. The designer decided that remembering initials on
the current browser is enough for alpha and that a successful save opens the
existing Top Scores page. After reviewing the spec, the designer said “the spec
is good” and raised concern about the project's use of “contract”. The ensuing
terminology work was requested without changing the existing spec format.
These statements and their scope are recorded from the conversation; they do not
constitute an implementation request or a general review of other specs.

## Changes in this loop

- Added the [ranked result spec](../specs/game/game-over/ranked-result/spec.md)
  and amended the [game-over](../specs/game/game-over/spec.md),
  [scores](../specs/game/scores/spec.md) and [dialogs](../specs/game/dialogs/spec.md)
  specs. The Scores spec's model-attributed entries were removed from the
  human-only `verified` field.
- Defined vocabulary in [development guidance](../development.md) and updated
  [architecture](../architecture.md), [AGENTS.md](../../AGENTS.md), the
  write-spec skill and other affected local skills. The existing spec headings
  and template format were retained.
- Named the active repository check `pnpm check:repo`, kept
  `pnpm check:contracts` as an alias, and updated the verification runner and
  its tests. The underlying script retains its original filename for existing
  references.

The work was observed in a dirty shared checkout based on
`08dc6a23e8077a485a2c8aadd334d8f3d7126e62`; no commit for this loop is
identified. Other concurrent source changes appeared in the checkout by closure
and are not attributed to this loop.

## Checks and evidence

The following are session command-output observations on dirty working trees in
the shared macOS checkout. No per-run logs or exact tree fingerprints were
retained; they cannot establish the results for a later checkout or commit.

| Check | Observed result | Scope |
| --- | --- | --- |
| `pnpm check:specs docs/specs/game/game-over` | Passed, zero findings | After writing the ranked result spec and game-over amendment |
| `pnpm check:specs docs/specs/game/scores` | Passed, zero findings | After the Scores amendment |
| `pnpm check:contracts` | Passed, including 21 factory tests | After the spec changes, before the terminology work |
| `pnpm check:repo` | Passed, including 21 factory tests | After the terminology and runner changes; before the final formatter-only edit to the runner |
| `pnpm exec biome check package.json scripts/verify.mjs scripts/verification.test.mjs scripts/check-contracts.mjs` | First failed on runner formatting; passed after formatting was corrected | Terminology and runner changes |
| `git diff --check` | Passed during the work | Does not cover subsequent changes |
| Skill creator `quick_validate.py .agents/skills/write-spec` | Passed | Write-spec skill metadata and structure |

The repository check validates references, token parity and factory tests; it
does not establish that the ranked feature is implemented. The spec was not
marked as human-verified, and no gameplay, browser or backend test for the
proposed feature is recorded in this loop.

## Publication and limits

No commit, push, deployment or live verification for this loop is recorded.
The ranked-result spec describes intended behaviour; implementation was outside
the conversation's authorized scope. Console output and designer feedback are
available through the conversation, not retained as separate run artifacts.
