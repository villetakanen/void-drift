# Development and verification

Develop through conversation and browser inspection; an IDE is optional.
Product contracts live in the [game contract](specs/game/spec.md) and its child specs.

## Setup

Use Node 22+, pnpm 10.33.0 and Java 21 (Firebase emulators).

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

Open `http://localhost:4321` for play, `/hangar` for Hangar test flight and `/lab`
for developer instruments and asset examples. Backend configuration is optional for local flight. Copy the public
Firebase keys from `.env.example` into ignored `.env.local` to enable shared scores.
Set `JAVA_HOME` and put its `bin` on `PATH` if Java is not installed system-wide.

## Required gates

`pnpm verify` runs every stage, retains individual results and exits nonzero on any
failure or source change during verification. It never auto-fixes source.

| Command                 | Evidence                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm check:contracts`  | Context and Markdown links, CSS/Canvas parity, runner regressions; missing link targets fail; size/scope warnings are advisory                   |
| `pnpm check:commits`    | Conventional Commit syntax after the adoption baseline                                                                                           |
| `pnpm lint`             | Biome formatting/imports/recommended rules, warnings fail                                                                                        |
| `pnpm check:types`      | Astro, Svelte, workspace and browser-harness TypeScript; Astro/Svelte warnings fail                                                              |
| `pnpm test`             | Physics, stock profile effects, replay, death/reset, camera/wrap                                                                                 |
| `pnpm build`            | Static production build                                                                                                                          |
| `pnpm test:browser`     | Input/release, pause/suspension, saved fittings/recovery, eligibility, focus isolation, death/fresh entry, document integrity and Canvas history |
| `pnpm test:rules`       | Firestore emulator allowed/rejected access cases                                                                                                 |
| `pnpm test:competition` | Two browser identities submit completed runs; third reads both scores via emulators                                                              |

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
The harness supplies `VOID_DRIFT_VERIFY_PORT` to give each verification server
its own ignored Vite cache and disable hot reload during its stable-candidate
checks. Ordinary development keeps its usual cache and hot reload.
Emulators still use 8080/9099; these overrides do not isolate concurrent emulators. Offline browser tests
blank live configuration and block external requests. Competition uses `demo-void-drift`,
never the live project. There is no hosted CI (removed 2026-11-08); verification
runs locally and its retained reports are the evidence. `main` rejects force-push
and deletion.

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

The title screen is ordinary navigation. Actual dialogs trap focus and isolate the
stage; see the [dialog contract](specs/game/dialogs/spec.md) and the resolved
[composition plan](plans/2026-11-03-opening-screen-dialog-boundary.md).

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

The Lab is also the reference for how the game looks and what its ships are.
`apps/web/src/data/lab-pages.ts` lists every Lab page with its group, purpose and
source (production code, study-local sketch, or design record). The nav rail and
the `/lab` index render from it, and a unit test keeps it and the routes in step.
A new Lab page needs an entry; a kept old route is an alias of its replacement.

The Lab targets large screens only: viewports 1280px wide and up (decision of
2026-11-04). It is not a tablet or phone surface and will not become one. Do not
design, test, review or fix Lab pages below 1280px, and do not report narrower
layout as a Lab gap. Small-screen requirements belong to play only: landscape phone
play with two touch controls, and the shared components play uses at that size.

## Release

The selected Firebase project is `void-drift-alpha` (Spark), database `(default)` in
`eur3`. Anonymous authentication must be enabled. Do not upgrade billing or Identity
Platform to work around setup failures. Public web configuration is local, not committed.

Before preparing, decide whether ranked Survival scores remain comparable to the
previous release. Change `CHALLENGE` in `packages/mode-a/src/schemas/highscore.ts`
only when a change to rules applied to score-eligible ranked Survival runs makes
old and new scores unfair to compare. This includes changes to ranked Survival
trajectories, survival conditions, scoring, or score eligibility; a tuning value
matters only when it changes one of those rules in ranked Survival. Changes limited
to other modes, the Lab, or presentation leave the challenge unchanged. When the
challenge changes, update the matching value and document ID prefix in
`firestore.rules`; this starts a new board and closes the previous board to writes.
Record the ranked Survival comparison decision and its reason in the release note.
Make the decision against the last published release, not intermediate edits
([gravity-field.md](specs/game/world/gravity-field/spec.md#rules-version)).

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
prepared release. It does not replace full verification.

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

## Shared checkout

Two to four sessions, in different tools, work in this one checkout at the same
time. They share nothing but the filesystem and git, and the designer follows the
work through the editor's git pane: the uncommitted diff shows what is in flight,
and a commit is a save point of the whole tree to the active branch. A commit
therefore carries every session's current work, not one session's change; the
branch is the unit of work, and release from `main` is the gate. Because anyone
may save at any moment, the tree is kept formatted and checkable throughout; when
another session's work fails the hook, the fix goes forward rather than around it.
Staging by path, stashing and resetting leave work in the pane that no one can
place, so they want a reason. A worktree suits a trial that would disturb the
shared tree; its result returns as uncommitted delta (`git merge --squash <branch>`
in this checkout), shows in the pane like any other work, is saved by the next
commit, and the worktree is then removed. (Decision of 2026-11-08.)

## Commit messages

Follow `.agents/skills/commit-messages/SKILL.md` before committing.
`pnpm install` installs the Lefthook hooks through the prepare script.
Run `pnpm exec lefthook install` if lifecycle scripts were disabled.
The pre-commit hook runs `biome check --staged` on staged files: it rejects
formatting, import-order and lint findings before they reach verification and
never writes to source.
The hook runs commitlint using `commitlint.config.mjs`; it rejects malformed
messages without changing files. It checks syntax, not whether the selected type
or breaking-change declaration accurately describes the diff.

`pnpm check:commits` checks all commits after adoption baseline
`841c975deee6f53db6b663f6a08047f8f8704e06` through HEAD. Older history is
grandfathered. `pnpm verify` runs the same check over full history, including
commits that bypassed local hooks. A shallow checkout must fetch the missing
history before this check can pass.
The hook does not run the full game suite, bump versions, tag, or publish.

## Button study promotion — 2026-10-28

The accepted button study is implemented in shared core styles and `/lab/inputs`.
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
