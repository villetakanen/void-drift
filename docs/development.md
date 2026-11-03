# Development and verification

Develop through conversation and browser inspection; an IDE is optional.
Product contracts live in [playable alpha](specs/playable-alpha.md).

## Setup

Use Node 22+, pnpm 10.33.0 and Java 21 (Firebase emulators).

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

Open `http://localhost:4321` for play, `/lab/flight` for flight trials and `/lab` for
asset examples. Backend configuration is optional for local flight. Copy the public
Firebase keys from `.env.example` into ignored `.env.local` to enable shared scores.
Set `JAVA_HOME` and put its `bin` on `PATH` if Java is not installed system-wide.

## Required gates

`pnpm verify` runs every stage, retains individual results and exits nonzero on any
failure or source change during verification. It never auto-fixes source.

| Command                 | Evidence                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm check:contracts`  | Context links, CSS/Canvas parity and runner regressions; context size/scope warnings remain advisory             |
| `pnpm check:commits`    | Conventional Commit syntax after the adoption baseline                                                           |
| `pnpm lint`             | Biome formatting/imports/recommended rules, warnings fail                                                        |
| `pnpm check:types`      | Astro, Svelte, workspace and browser-harness TypeScript; Astro/Svelte warnings fail                              |
| `pnpm test`             | Physics, stock profile effects, replay, death/reset, camera/wrap                                                 |
| `pnpm build`            | Static production build                                                                                          |
| `pnpm test:browser`     | Keyboard/touch movement, cancel, pause, replay/import, saved settings, focus, death/restart and Canvas semantics |
| `pnpm test:rules`       | Firestore emulator allowed/rejected access cases                                                                 |
| `pnpm test:competition` | Two browser identities submit completed runs; third reads both scores via emulators                              |

`pnpm verify:quick` runs contracts (including factory regression tests), lint, types
and unit tests through the same recorded runner. It exits nonzero on failure or
source changes, but is always **partial verification**, not a full pass. Reports
include `mode`, `partial`, `skippedSteps` and `selectedChecksPassed`; `passed` is
reserved for successful full verification. `pnpm test:factory` tests the runner
with isolated fake commands; these are not gameplay-check results.

Full verification runs rules and competition sequentially in one owned
Firestore/Auth emulator session. Each keeps its own named result, log and duration;
`backendLifecycle` records the shared command outcome, inclusive duration and
setup/cleanup overhead. Do not add its inclusive duration to the two suite durations.
Startup/shutdown has a seven-minute deadline with ten seconds for graceful cleanup
before terminating the owned process group. Either suite or
lifecycle failure fails full verification. Test data is cleared between the suites.
`pnpm test:backend` runs this combined backend check alone; `test:rules` and
`test:competition` remain independent focused commands.

Browser tests default to ports 4322/4323. Override them for another worktree:

```sh
PLAYWRIGHT_PORT=4342 PLAYWRIGHT_FIREBASE_PORT=4343 pnpm verify
```

Both overrides must be decimal TCP ports (1–65535) and must differ. The same
settings work with `pnpm test:browser` and `pnpm test:competition`. Tests always
start their own server (`reuseExistingServer: false`); occupied ports fail rather
than silently testing another checkout. Verification reports record both resolved
URLs under `browserUrls`, even when browser stages are skipped in quick mode.
Emulators still use 8080/9099; these overrides do not isolate concurrent emulators. Offline browser tests
blank live configuration and block external requests. Competition uses `demo-void-drift`,
never the live project. GitHub Actions runs these same gates with Java 21 and Chromium.
Superseded runs of the same event/ref are canceled. Push and pull-request checks
remain distinct so branch-head and PR-merge verification both retain coverage.

`artifacts/verification/<timestamp>-<unique-suffix>/report.json` records revision,
dirty state, source fingerprint, environment, commands and run-local log paths.
Every invocation gets a new directory, including failed runs; later runs do not
overwrite earlier reports or logs. `latest.json` is an atomic convenience copy of
the last completed report. Link the specific run from closure records. These ignored
local artifacts are not a durable backup; retain essential outcomes in tracked notes. Ignored reports/traces/screenshots remain inspectable
with `pnpm exec playwright show-report`. A later source change invalidates evidence.
Commit identity and deployment identity are separate from passing working-tree checks.

## Visual review and experience

`pnpm test:capture` collects reproducible review images separately from the required
correctness suite. Images use run-local output paths and attachments; successful
correctness runs no longer produce the repeated review captures. Automatic failure
screenshots and retained failure traces remain enabled. Capture completion is not
human visual approval or an additional correctness gate.

Dialog modality is unresolved: the current stage-only behavior remains during
pruning because the opening menu depends on navigation outside the dialog. See
[the separate composition plan](plans/2026-11-03-opening-screen-dialog-boundary.md).
The owner wants actual dialogs to trap focus; this is not yet implemented.

Flight and FX captures use explicit viewport, seed and simulation time for human
review. Alpha 0.5.0 removes pixel equality gates for the combined flight canvas and
painter recipes: expressive effects and their overlap are intentionally tunable.
Automated checks cover their activation, lifecycle, placement, bounded work and
simulation isolation. Shared UI/accessibility and other functional checks remain.
Human assessment of fidelity and fun is recorded separately. Automated tests do not
prove sustained 60 FPS or difficulty balance on a physical phone. Report the device,
scenario, backing resolution and full rendering evidence for performance measurements.
`/lab/fx` runs the production mixed scene; `node scripts/profile-fx.mjs` captures
sustained Chromium timing/traces against a server on port 4347 by default.
Use `FX_PROFILE_CAMERA=moving` to include pan/zoom reprojection. Prefer a fixed
production preview for sustained measurements so live edits cannot reset counters.
The report includes graphics devices/features: software Canvas/compositing results
must be identified as such, not reported as hardware-accelerated browser timing.

The Lab is an experience-design surface, not just an asset gallery. Its trials use
production systems and expose the relevant parameters, reset/replay and shareable
configuration. Keep capture environments explicit (fixed viewport, seed and simulation
time), and show an accepted design change in the real game as well as the Lab.

## Release

The selected Firebase project is `void-drift-alpha` (Spark), database `(default)` in
`eur3`. Anonymous authentication must be enabled. Do not upgrade billing or Identity
Platform to work around setup failures. Public web configuration is local, not committed.

After the full verification gates pass on a stable candidate, prepare the production
artifact locally:

```sh
pnpm release:prepare
pnpm release:check artifacts/prepared-releases/<run>
```

Preparation reads `.env.local` when present; already-exported environment values take
precedence. It requires nonempty `PUBLIC_FIREBASE_API_KEY` and `PUBLIC_FIREBASE_APP_ID`,
`PUBLIC_FIREBASE_PROJECT_ID=void-drift-alpha` and `PUBLIC_FIREBASE_EMULATORS=false`.
Missing or invalid settings fail before building, without printing their values.
Offline development and ordinary verification still work without production settings.

The command builds once into the new run's `bundle/public`, confirms that the production
identifiers reached the JavaScript, and smoke-tests that built site in Chromium: real
keyboard flight, pause and the FX Lab controls, with page/asset errors checked. External
requests are blocked; preparation neither contacts the live backend nor verifies its
availability. A failed build/smoke or a source edit during preparation cannot produce a
prepared release. It does not replace full verification or human experience review.

Each `artifacts/prepared-releases/<run>/` retains a report, build log and smoke captures.
The report identifies revision, dirty state, source fingerprint, version, environment,
file hashes and artifact fingerprint. `bundle/` includes the built site and snapshots of
Firestore rules/indexes plus the Firebase configuration used to publish them. Never edit
a prepared bundle; prepare again. These local artifacts remain ignored, not a backup.

After explicit push/publication authorization, publish that exact checked bundle:

```sh
pnpm release:publish artifacts/prepared-releases/<run>
```

Publication validates the saved report and every bundle file before invoking Firebase.
It deploys a hash-checked copy per attempt so Firebase cache writes leave the saved
bundle intact. It does not rebuild, take current checkout rules, commit, push or tag.
Each attempt retains its own deployment log and report. Preparation and `release:check` never publish.
The current deployment configuration supports this project's single Hosting site and
Firestore rules/indexes; unsupported Hosting options/hooks fail preparation for review.

Then verify game, Lab, authentication and score reads at
`https://void-drift-alpha.web.app` without submitting a production test score. Record
live verification separately: even a successful deployment report has `liveVerified: false`.
Hosting rollback is available in the Firebase console; rules changes require redeploying
the reviewed previous rules. Preserve the report's dirty-state qualification when a
candidate was prepared before committing; its base revision alone is not its identity.

## Known limits

Client-reported scores support casual competition only. Human gameplay review,
physical mobile performance and protected-branch enforcement are not automated passes.
Historical backlog items are not new assignments.

## Commit messages

Follow `.agents/skills/commit-messages/SKILL.md` before committing.
`pnpm install` installs the Lefthook commit-msg hook through the prepare script.
Run `pnpm exec lefthook install` if lifecycle scripts were disabled.
The hook runs commitlint using `commitlint.config.mjs`; it rejects malformed
messages without changing files. It checks syntax, not whether the selected type
or breaking-change declaration accurately describes the diff.

`pnpm check:commits` checks all commits after adoption baseline
`841c975deee6f53db6b663f6a08047f8f8704e06` through HEAD. Older history is
grandfathered. CI fetches full history and runs the same check through
`pnpm verify`, including commits that bypassed local hooks. A shallow local
checkout must fetch the missing history before this check can pass.
The hook does not run the full game suite, bump versions, tag, or publish.

## Button study promotion — 2026-10-28

The accepted button study is implemented in shared core styles and `/lab/buttons`.
Browser checks cover shared token propagation, group spacing and equal widths,
responsive strip stacking, keyboard focus, disabled/busy states, and reduced motion.
The flight screenshot baseline was inspected and updated for the intended pause-menu
button composition and 44px link-button target; no screenshot tolerance changed.

## Factory building lessons

See [the numbered lessons index](factory-building-lessons/README.md) for the
modernization record, phased design-study improvement, and evaluation protocol.

## Gravity integration — 2026-10-29

The 450-tick flight screenshot baseline was inspected and updated for the intended
trajectory and camera framing changes from directional engines and stronger wells.
No visual tolerance changed. Human review is out of this integration's scope and
will happen afterward on the built alpha. The initial integration lacked Java for backend checks. Release 0.3.4 verification
used a temporary Temurin Java 21 runtime: all gates passed, including nine
Firestore rule tests and the two-player competition test.


## Ion movement integration — 0.4.2

The Flight Lab 450-tick screenshot was inspected and updated for the intentional
change from a stock ship to the assembled two-Light-ion Fighter with persistent
rotation. No screenshot tolerance changed. Browser tests cover stabilizer persistence,
all-hull turns/release/LR, and Lab tuning import/replay. Unit tests cover force ratio,
bounded directional speed, free rotation, counter-spin, energy and reset/replay.
Human balance review remains open; gravity and scored stock profiles are unchanged.
