# Harness lessons assessment and repository prune

Closed at the owner's request on 5 November 2026 (Europe/Helsinki).

## Intent and owner decisions

The owner asked for an assessment of lessons with three atomic harness proposals
(deterministic machinery, gates and tooling) and, through sub-agents, the top three
legacy files or facts to prune. The assistant proposed: a Markdown link gate in the
contracts check, a Lefthook pre-commit Biome check, and an evidence-staleness
command comparing the last verification fingerprint with the tree. Prune proposals
were `docs/project-vision.md`, five closed plans plus the empty `tuning:apply`
script, and orphaned study and engine code.

Owner decisions, in order:

- Link gate: "yes, but warn only".
- Pre-commit hook: "yes, but why not auto-lint also?"; after the assistant's answer,
  "Keep check-only".
- Staleness command: "no - lets keep this in mind and discuss later. here might be a
  deeper root cause".
- `docs/project-vision.md`: "this keeps coming up, but the project vision is a
  valuable, historic artefact humans read in repo. can not be deleted".
- Plans: "we cant delete plans without a review, not doable here".
- Orphaned code: "yes, delete."
- Mid-task note: "memories are deleted constantly in this project. you can not rely
  on your memory". The two keep decisions were therefore written into `AGENTS.md`.

## Changes delivered

Local commits on `feat/0-5-0`, parent `c1af789`:

- `a0b1b1f` `feat(factory): warn on missing Markdown link targets and lint staged files`:
  [contracts gate](../../scripts/check-contracts.mjs) scans tracked Markdown for
  relative links with missing targets and warns, skipping links into ignored
  `artifacts/`; [Lefthook](../../lefthook.yml) pre-commit runs `biome check --staged`
  without writing; [development](../development.md) describes both; `AGENTS.md`
  records the keep rule for `docs/project-vision.md` and `docs/plans/`, with two
  authority bullets merged to stay under 80 lines.
- `3039004` `refactor: remove orphaned study components and dead engine modules`:
  eleven study components, two zero-byte stubs, four re-exported modules without a
  caller and their index lines, 3,211 lines removed; the ship-slot-language study
  page text updated.

Both commits were made with pathspecs. The core package index carried pre-existing
uncommitted countdown and speed-line exports; only this loop's removals were
committed and the other hunks remain in the working tree. The staged spec
relocation, release copy-back edits and untracked files were left untouched.
Not pushed. No deployment.

## Checks

Environment: macOS arm64, Node 24.14.0, Biome 2.6.3, Lefthook 2.2.2.

Working tree after the deletions, before committing (dirty tree on `c1af789`
with the staged spec relocation present), logs in the session scratchpad only:

| Command            | Outcome                                                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | Failed, 698 files, 3 errors: the assistant's widened gates table in `development.md` and its reflowed paragraph in `ship-slot-language.astro`, both repaired before commit; the pre-existing uncommitted `run-countdown-2026-11-05.astro`, left |
| `pnpm check:types` | Passed, 0 errors                                                                                                                                                                                                                                |
| `pnpm test`        | Passed, 229 tests in 43 files                                                                                                                                                                                                                   |
| `check:contracts`  | Fails in the working tree before the new link block runs: `AGENTS.md` still points at `docs/specs/voice-led-factory.md`, which the staged relocation moved; this predates the loop                                                              |

Temporary detached worktree at `c1af789` with the new gate script and hook copied in,
since removed; outputs were read in the session, not retained:

- `node scripts/check-contracts.mjs`: exit 0; `Markdown links: 117 files; 4 missing
  target(s)`, all four in `2026-11-05-interstellar-arrival-release.md` pointing at
  relocated spec paths and the untracked `releases/0.5.4.md`.
- `lefthook run pre-commit` with a misformatted staged file: exit 1, Biome format
  diagnostic; with the file formatted: exit 0; the misformatted file's bytes were
  unchanged after the failing run.

The hooks ran on both commits: pre-commit Biome checked the four and then the
committed files with no findings; commit-msg passed.

Scan figures before the changes, session-local script: 141 missing relative link
targets across 117 tracked Markdown files in the working tree with the staged
relocation, 7 at `c1af789`. The gate's own count at `c1af789` is 4 because it skips
`artifacts/` links and the `..` paths the scan counted.

Not run: `pnpm verify` full or quick, build, browser, rules and competition suites.
No full-suite pass is claimed for either commit.

## Sub-agent reports

Two Explore sub-agents reported candidates; the assistant spot-checked the deleted
set by import grep and the `tuning:apply` empty area table, and confirmed the
`project-vision.md` banner. Other items in their reports were not independently
checked and are reported claims: closed plans (test-suite-pruning, alpha-0.5.0 and
refresh, camera-framing, hull-engine-cruise-model), `docs/audits/2026-11-01-opening-screen.md`,
five factory retrospectives at `docs/` root, `netlify.toml`, `@vitest/ui` and the
coverage block in `vitest.config.ts`, two unreferenced public study assets, stale
README tagline and build command, skill links at old spec paths, and about thirty
code comments citing old spec paths. Merged worktrees under `.claude/worktrees`
measured 12 GB locally, ignored by git.

## Human feedback

Owner on the hook question, after the assistant's answer favouring check-only:
"Keep check-only". No feedback on the deletions beyond the authorising "yes, delete."
No feedback on the gate's warning output was given.

## Evidence gaps

Lint, type and test logs, the link-scan scripts and the temporary worktree were in
the session scratchpad and are not retained. No verification report directory was
produced, since `pnpm verify` was not run. The 141/7 link counts come from a
session-local scanner whose rules differ from the committed gate. Whether the
pre-commit hook reduces the formatting failures seen in earlier loop records is
not established by this loop.
