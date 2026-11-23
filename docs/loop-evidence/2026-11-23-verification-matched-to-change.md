# Verification matched to the change — 2026-11-23

Recorded by the session that did the work (Claude Fable 5.2). Statements are that
session's direct inspection unless marked otherwise.

## Intent and scope

The designer reported that committing felt expensive in this project across Pi,
Codex and Claude sessions, with Java and Firebase checks running for spec and
documentation edits: "it feels like it's trying to use a sledgehammer to kill a fly."
The request was to assess the situation and work out what could be done.

The session proposed three options: a written rule by changed paths, a command that
selects checks mechanically, and separating the backend from full verification. It
recommended the first two. The designer asked for those ("amend these, please").
The third option was not done.

## Observations before the change

- `lefthook.yml` runs `biome check --staged` and commitlint. No hook runs Java,
  emulators, types or tests.
- `artifacts/verification` held 263 run directories; 203 had a readable report:
  96 full and 107 quick. These are ignored local artifacts on one machine.
- The two full runs of 2026-11-22 took 205 s and 206 s: browser 91–92 s, the
  emulator lifecycle 79–82 s. Quick runs on 2026-11-23 took 24–25 s, of which
  types were 16–17 s.
- 2026-11-11 had 12 full and 8 quick reports, 62 minutes of recorded run time.
- The commit-messages skill said "Format and check the whole tree first".
  `docs/development.md` listed nine stages under "Required gates" without saying
  when each applies.
- The reports do not record why a run was started. Which instruction led to any
  given full run is unknown.

## Changes delivered

On `feat/0-7-0`, in the commit that carries this record:

- `scripts/verify-selection.mjs`: stage selection from changed paths.
- `scripts/verify.mjs`: `--changed` mode; the report gains `changedPaths`.
- `package.json`: `pnpm verify:changed`.
- `scripts/verification.test.mjs`: two tests, for the selection and the mode.
- `docs/specs/factory/spec.md`: section "Verification matched to the change" with
  three scenarios. No human verification is recorded for this text.
- `docs/development.md`: section "Which checks to run".
- `.agents/skills/commit-messages/SKILL.md`: the check line names
  `pnpm verify:changed`; a second line leaves full verification to a release.
- `docs/loop-evidence/2026-11-23-initials-design-system-component.md`: one link
  repointed from `components/lab/InitialsExample.svelte` to
  `components/inputs/Initials.svelte`. The old target was absent at `6cc95900`
  and failed `check:repo`.

## Checks

All on the uncommitted tree over `6cc95900`, macOS, Node 24.14.0, inside the
session sandbox.

| Command                                  | Outcome | Source                                                         |
| ---------------------------------------- | ------- | -------------------------------------------------------------- |
| `node --test scripts/verification.test.mjs` | passed, 10 of 10 | session output, not retained                           |
| `pnpm verify:changed` (first run)        | failed: `check:repo`, one missing Markdown link target; lint, types, tests passed | `artifacts/verification/2026-11-23T08-46-51.841Z-Jy3ZNH/report.json` |
| `pnpm verify:changed` (after link repair) | passed, partial | `artifacts/verification/2026-11-23T08-47-27.313Z-5pgSz0/report.json` |
| `pnpm check:specs docs/specs/factory`    | failed: 76 findings; 75 before the edit | session output, not retained                  |

Not run: full `pnpm verify`, `build`, `test:browser`, `test:rules`,
`test:competition`. `verify:changed` did not select them for this change.
A document-only selection and a backend selection were exercised by the unit test
of the selection function, not by a real run.

## Publication

See the committing session's report for the commit hash and push state. No
deployment is involved.

## Human feedback

- "good work" — the designer, on the delivered change as summarised in chat,
  before commit. It does not record a review of the spec text or the code.

## Findings and unknowns

- Game-code changes do not select the browser suite; only changes to browser
  tests, their helpers or `playwright.config.ts` do. The designer was told and did
  not ask for a change.
- A tree with nothing changed selects no checks and exits zero.
- Whether sessions in Pi and Codex follow the new skill line is unobserved.
- The effect on verification time per commit is unmeasured.
- The factory spec remains in the legacy format.

## Evidence gaps

The verification reports and the measured run durations live under the ignored
`artifacts/verification/` and are not backed up. The durations above were read
from those reports on 2026-11-23.
