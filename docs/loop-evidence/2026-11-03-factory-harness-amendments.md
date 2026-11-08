# Factory harness amendments — 2026-11-03

## Authorized scope

The owner selected the release-preparation amendment, consolidation of duplicate study
instructions, and making the separate study-quality report optional. They clarified
that a failed study is a successful end state for the project; preserve its failure
assessment. They also requested explicit evidence links from completed lesson tasks.
No new lesson-trial obligation or general browser-artifact retention change was selected.

## Implementation evidence

- Release: [runner](../../scripts/release.mjs), [built-site smoke](../../scripts/release-smoke.mjs),
  [schemas](../../packages/core/src/lib/schemas/release.mjs), and
  [regression tests](../../scripts/release.test.mjs). Commands and boundaries are in
  [development](../development.md#release) and the
  [factory contract](../specs/factory/spec.md#prepared-release-artifacts).
- Guidance: [skill](../../.agents/skills/design-study/SKILL.md) owns procedure;
  [specification](../specs/lab/design-studies/spec.md) owns outputs and authority;
  [exploration guide](../../.agents/skills/design-study/references/exploration.md)
  retains detailed creative rounds. The skill shrank from 150 to 89 lines and the
  specification from 233 to 134 lines; line counts describe editing, not effectiveness.
- [Optional evaluation](../specs/lab/design-studies/spec.md#optional-study-quality-evaluation--separate-from-readiness)
  applies to requested factory evaluations or targeted investigations. Ordinary studies
  retain reasoning, readiness, scope and human judgment without a default ratings report.
- [Ending contract](../specs/lab/design-studies/spec.md#ending-a-study) distinguishes project value
  from the quality/outcome of the study. Historical owner-declared failures stay intact.

## Verification

Initial release fixtures passed seven non-network regression groups. An eighth local-server
probe initially could not bind a port under restricted execution, then passed with local
server permission. That probe was removed from the default factory suite to keep quick
checks independent of browser/server access; real preparation exercises the server.

The first real preparation failed because the new smoke expected an FX button named
Resume; the production label is Run. The assertion was corrected to that real control,
with a running simulation checked before pausing. Failed report:
[2026-11-03T14-39-27.769Z-VzMJ6S](../../artifacts/prepared-releases/2026-11-03T14-39-27.769Z-VzMJ6S/report.json).

An initial quick run passed contracts, types and unit tests but failed on table formatting
in the rewritten study specification. Formatting was corrected. Its report remains:
[2026-11-03T14-40-59.474Z-AGANtl](../../artifacts/verification/2026-11-03T14-40-59.474Z-AGANtl/report.json).

Final isolated snapshot results (base `0719198a2de41bddd9dce9e92dea84d2a512bc0f`,
Node 26.8.2, darwin/arm64):

- [Quick verification, 2026-11-03T14-45-00.882Z-ybppcD](../../artifacts/verification/2026-11-03T14-45-00.882Z-ybppcD/report.json):
  contracts (14 factory tests, including seven release groups), lint, types and
  144 unit tests passed; `sourceUnchanged: true`. This is partial verification.
  Commit history, ordinary build/browser gates and backend suites were skipped;
  the separate production build/smoke below covers the new release path only.
- [Production preparation, 2026-11-03T14-43-56.257Z-I6BKSn](../../artifacts/prepared-releases/2026-11-03T14-43-56.257Z-I6BKSn/report.json):
  production build, embedded Firebase configuration, real keyboard flight/pause and
  FX Lab smoke passed in Chromium 156.0.8078.4. External network was blocked. The
  saved bundle contains 379 files. [Flight capture](../../artifacts/prepared-releases/2026-11-03T14-43-56.257Z-I6BKSn/flight.png)
  and [Lab capture](../../artifacts/prepared-releases/2026-11-03T14-43-56.257Z-I6BKSn/lab.png)
  remain local evidence, not human acceptance.
- Both reports identify source fingerprint
  `3d574b4ae45cc5f58483367b2d095cf95f0e0811d4195fbc2fbcfa59323a05db`.
  Artifact fingerprint:
  `4d7856854960233c7a7baff87ede65bc6b7affab64390db9c653830b374e7d42`.
  `pnpm release:check <run>` passed; the prepared artifact still matches its report.
- Skill validation, local guidance-link checks and diff whitespace checks passed.
  Implementation files matched the tested snapshot byte-for-byte before this final
  evidence update. This update adds results only; it is not a rerun of the source gates.
- The first isolated quick-check invocation stalled before producing a stage result
  under restricted execution. That process was stopped; the normal-permission rerun
  above passed. The stalled invocation is not counted as a check pass.

The regression fixtures prove rejection before deployment of modified, added and
removed bundle files, and that publication uses copied saved rules even if checkout
rules have changed. A fake Firebase cache write stays in the publication attempt,
leaving the prepared bundle unchanged. Publication arguments and failure recording
were checked without calling the live deployment service.

## Provenance and limits

Base revision at entry: `0719198`. Test-pruning and Fiddler work already existed in the
checkout; it was preserved. Shared package/development/factory files received only the
release-related additions alongside those changes. An isolated local snapshot is used for
build/smoke evidence while concurrent work continues. A dirty snapshot's base commit is
not its complete identity; the reports retain source fingerprints and working-tree state.

No push, tag, deployment, live authentication or score request is performed by this work.
Publication is exercised with a fake deployment command; actual publication and live smoke
remain future authorized actions. Local logs and snapshots are not durable backup.
No fresh human design study was run, so reduced repetition and optional reporting are
implemented owner decisions, not demonstrated improvements in study outcomes.
