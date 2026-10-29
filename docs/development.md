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

| Command                 | Evidence                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm check:contracts`  | Agent guide below 80 lines and context links exist                                                     |
| `pnpm lint`             | Biome formatting/imports/recommended rules, warnings fail                                              |
| `pnpm check:types`      | Astro, Svelte and workspace TypeScript, warnings fail                                                  |
| `pnpm test`             | Physics, stock profile effects, replay, death/reset, camera/wrap                                       |
| `pnpm build`            | Static production build                                                                                |
| `pnpm test:browser`     | Real keyboard movement, multi-touch/cancel, pause, replay, import, death/restart and visual comparison |
| `pnpm test:rules`       | Firestore emulator allowed/rejected access cases                                                       |
| `pnpm test:competition` | Two browser identities submit completed runs; third reads both scores via emulators                    |

Browser tests own ports 4322/4323; emulators use 8080/9099. Offline browser tests
blank live configuration and block external requests. Competition uses `demo-void-drift`,
never the live project. GitHub Actions runs these same gates with Java 21 and Chromium.

`artifacts/verification/latest.json` records revision, dirty state, source fingerprint,
environment, commands and logs. Ignored reports/traces/screenshots remain inspectable
with `pnpm exec playwright show-report`. A later source change invalidates evidence.
Commit identity and deployment identity are separate from passing working-tree checks.

## Visual review and experience

The graphics baseline is a fixed viewport, seed and 450-tick paused replay. Text overlays
are hidden for cross-platform canvas comparison. Its initial image was agent-inspected;
human assessment of fidelity and fun remains pending. Update a baseline only after
reviewing the intended visual change, then repeat the comparison without update mode.
Automated tests do not prove sustained 60 FPS or difficulty balance on a physical phone.

## Release

The selected Firebase project is `void-drift-alpha` (Spark), database `(default)` in
`eur3`. Anonymous authentication must be enabled. Do not upgrade billing or Identity
Platform to work around setup failures. Public web configuration is local, not committed.

After successful verification and an authorized commit/push:

```sh
pnpm build
pnpm exec firebase deploy --only firestore,hosting --project void-drift-alpha
```

Hosting serves `apps/web/dist`. Verify game, Lab, authentication and score reads at
`https://void-drift-alpha.web.app`. Record revision and deployment result separately;
passing local tests alone do not mean released. Hosting rollback is available in the
Firebase console; rules changes require redeploying the reviewed previous rules.

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
will happen afterward on the built alpha. Java is unavailable in the current local
environment, so Firestore rules and competition checks remain unverified locally.
