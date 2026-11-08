# Void Drift tooling and agent harness inventory

Snapshot taken 2026-11-08 on branch `feat/0-5-0` (HEAD `3b3eb94`, working tree clean).
Read-only: no install, build, test, or dev server was run. Biome, Playwright, and the
Firebase gates were not executed, so their current pass/fail state is not stated here.

## 1. Root and workspace packages

Root `package.json` is `void-drift-monorepo` v0.5.6, `packageManager: pnpm@10.33.0`.
`pnpm-workspace.yaml` covers `packages/*` and `apps/*`.

| Package              | Version | Scripts                                                                           | Notable dependencies                                                                                                                    |
| -------------------- | ------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| root                 | 0.5.6   | see table 1b                                                                      | biome 2.6.3, commitlint 21.2.4, firebase-tools 15.34.1, lefthook 2.2.2, playwright 1.64.1, svelte-check 4.7.7, typescript ^5, vitest ^4 |
| `@void-drift/core`   | 0.5.6   | `test: vitest run`                                                                | zod ^3.23.8                                                                                                                             |
| `@void-drift/mode-a` | 0.5.6   | `test: vitest run`                                                                | core (workspace), firebase 13.1.0, zod ^3.23.8                                                                                          |
| `web` (apps/web)     | 0.5.6   | dev, build, preview, `check: astro check --minimumFailingSeverity warning`, astro | astro ^5.16.5, svelte ^5.46.0, @astrojs/svelte ^7.2.3, nanostores                                                                       |

### 1b. Root scripts

| Script                                                  | Command (abridged)                                                         | In docs/development.md |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------- |
| `dev`                                                   | `pnpm --filter web dev`                                                    | yes                    |
| `build`                                                 | `pnpm --filter web build`                                                  | yes                    |
| `check`                                                 | `pnpm -r check`                                                            | no                     |
| `test`                                                  | `vitest run`                                                               | yes                    |
| `check:contracts`                                       | `check-contracts.mjs && test:factory`                                      | yes                    |
| `lint`                                                  | `biome check . --error-on-warnings`                                        | yes                    |
| `check:types`                                           | `check` + `svelte-check --fail-on-warnings` + `tsc -p tsconfig.check.json` | yes                    |
| `test:browser`                                          | `playwright test`                                                          | yes                    |
| `test:capture`                                          | `playwright test -c playwright.capture.config.ts`                          | yes                    |
| `test:backend`                                          | `verify-backend.mjs`                                                       | yes                    |
| `verify`                                                | `verify.mjs`                                                               | yes                    |
| `verify:quick`                                          | `verify.mjs --quick`                                                       | yes                    |
| `test:factory`                                          | `node --test verification.test.mjs release.test.mjs`                       | yes                    |
| `release:prepare` / `release:check` / `release:publish` | `release.mjs <mode>`                                                       | yes                    |
| `test:rules`                                            | firebase emulators, `firestore.test.mjs`                                   | yes                    |
| `test:competition`                                      | firebase emulators, `playwright.firebase.config.ts`                        | yes                    |
| `prepare`                                               | `lefthook install`                                                         | mentioned in prose     |
| `tuning:apply`                                          | `tuning-apply.mjs`                                                         | no                     |
| `check:commits`                                         | commitlint `--from 841c975 --to HEAD`                                      | yes                    |

## 2. Scripts (`scripts/`)

Total 1,583 lines across 9 `.mjs` files. Only `scripts/*.test.mjs` are tests, run by `test:factory`.

| File                    | Lines | Purpose                                                                               | Test coverage                                       |
| ----------------------- | ----- | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `check-contracts.mjs`   | 138   | Context and Markdown links, CSS/Canvas token parity, size/scope warnings (advisory)   | No direct test file; referenced from comments only  |
| `profile-fx.mjs`        | 139   | Sustained Chromium FX timing and traces against port 4347                             | None                                                |
| `release-smoke.mjs`     | 104   | Serves the built site and smoke-tests it in Chromium                                  | Only through `release.mjs`; not in release.test.mjs |
| `release.mjs`           | 280   | prepare / check / publish production release bundles                                  | `release.test.mjs` (232 lines)                      |
| `release.test.mjs`      | 232   | Tests for release.mjs with fake commands                                              | self                                                |
| `tuning-apply.mjs`      | 56    | Applies a proposal to a section of `packages/mode-a/src/lib/tuning.json`              | None                                                |
| `verification.test.mjs` | 278   | Tests for verify runner and backend lifecycle                                         | self                                                |
| `verify-backend.mjs`    | 210   | Firebase emulator lifecycle for rules and competition suites                          | Via `verification.test.mjs`                         |
| `verify.mjs`            | 146   | Full and quick verification runner, writes `artifacts/verification/<run>/report.json` | Via `verification.test.mjs`                         |

Three scripts have no test: `profile-fx.mjs`,
`tuning-apply.mjs`, and `check-contracts.mjs` (no direct test file). Vitest does not include
`scripts/*.test.mjs` (see section 4), so script tests run only via `test:factory`.

## 3. CI workflow (`.github/workflows/verify.yml`)

| Aspect           | Value                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Triggers         | `push`, `pull_request` (all branches)                                                                                        |
| Concurrency      | group per event and PR/ref, `cancel-in-progress: true`                                                                       |
| Permissions      | `contents: read`                                                                                                             |
| Jobs             | one job, `verify`                                                                                                            |
| Runner / timeout | `ubuntu-latest`, `timeout-minutes: 20`                                                                                       |
| Checkout         | `actions/checkout@v4`, `fetch-depth: 0` (needed for check:commits)                                                           |
| Toolchain        | pnpm 10.33.0 via `pnpm/action-setup@v4`; Node 22 via `setup-node@v4`; Temurin Java 21                                        |
| Caching          | `setup-node` `cache: pnpm` only. No cache for Playwright browsers or Firebase emulator binaries                              |
| Steps            | `pnpm install --frozen-lockfile`, `playwright install --with-deps chromium`, `pnpm verify`, upload evidence (`if: always()`) |
| Evidence upload  | `artifacts/verification/`, `artifacts/competition/`, `playwright-report/`, `test-results/`                                   |

Not in CI: `pnpm release:*`, `pnpm verify:quick`, and any deploy step. The workflow
does not publish or deploy.

## 4. Local hooks and config files

| File                                                         | What it enforces                                                                                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lefthook.yml`                                               | pre-commit: `biome check --staged` on staged js/mjs/ts/mts/svelte/astro/css/json/md. commit-msg: commitlint. No pre-push hook                                                                |
| `commitlint.config.mjs`                                      | Extends `@commitlint/config-conventional` only                                                                                                                                               |
| `biome.json`                                                 | Biome 2.6.3; tab indent, double quotes, recommended lint rules, organize-imports on. Ignores node_modules, dist, .astro, .vite, .claude, artifacts, .agents, lock file, debug logs           |
| `tsconfig.check.json` (root)                                 | Strict workspace type check; extends `apps/web/tsconfig.json`; maps `@void-drift/core` and `mode-a` to source; excludes `apps/web/src/**/*.test.ts`                                          |
| root`tsconfig.json`                                          | Absent                                                                                                                                                                                       |
| `packages/*/tsconfig*`                                       | Absent (packages are checked only through tsconfig.check.json)                                                                                                                               |
| `vitest.config.ts`                                           | node env, globals; includes `packages/**/*.test.ts` and `apps/web/src/**/*.test.ts`; v8 coverage                                                                                             |
| `playwright.config.ts`                                       | `tests/browser`, 1 worker, 1280x720, Chromium only, retries 0, `forbidOnly`; starts dev server with Firebase vars blanked (offline); ports from `verification-ports.mjs` (4322/4323 default) |
| `playwright.capture.config.ts`                               | Extends base; `tests/review`; output under per-run capture directory                                                                                                                         |
| `playwright.firebase.config.ts`                              | Extends base; `tests/firebase`; demo project `demo-void-drift`, emulators on, 60 s timeout                                                                                                   |
| `firebase.json`, `firestore.rules`, `firestore.indexes.json` | Hosting and Firestore config; rules tested by `test:rules`                                                                                                                                   |

Unit test files: 51 `.test.ts` under packages and apps/web, plus one Firestore rules test (`packages/mode-a/tests/firestore.test.mjs`) and two script tests.

## 5. Agent skills

`.agents/skills/` is the single source. `.claude/skills` is a symlink to `../.agents/skills`. Root `CLAUDE.md` is a symlink to `AGENTS.md`.

| Skill             | Lines | Description (frontmatter)                                                                                                                                                                                  | Links                                                                                                                                                                                               |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| close-loop        | 60    | Collect a bounded development loop's evidence into a durable local record when closing the loop. Does not infer signals, derive lessons, or promote process changes.                                       | `docs/loop-evidence/<date>-<slug>.md` (template; directory exists with 49 files)                                                                                                                    |
| commit-messages   | 16    | Prepare meaningful Conventional Commit messages when committing or squash-merging.                                                                                                                         | none                                                                                                                                                                                                |
| design-study      | 97    | Develop a four-part design study (problem, exploration, readiness, scope) and end it as accepted, ruled out, or stopped, preserving the designer's decisions.                                              | `../../../docs/design.md` OK; `references/exploration.md` OK; `apps/web/src/data/studies.ts` OK; `../../../docs/specs/design-studies.md` **MISSING**; `docs/specs/motion-instrument.md` **MISSING** |
| fx-development    | 69    | Implement, tune or diagnose Void Drift game effects and their shared rendering pipeline. Use for engine light, gravity effects, trails, sparks, fire, impacts and effects performance in play or the Lab.  | `.agents/skills/shared-components/SKILL.md` OK; `docs/specs/sfx-canvas.md` **MISSING**                                                                                                              |
| shared-components | 54    | Build or change interfaces and game visuals through shared primitives and composed components. Use for Lab and production UI, controls, ship views, slots, and other reusable visual or interactive parts. | none                                                                                                                                                                                                |
| spec              | 102   | Create, reverse-engineer, or update a living feature specification in docs/specs/ that defines intent, behavior contracts, and acceptance criteria.                                                        | `docs/specs/<domain>.md` (template); `docs/specs/` OK                                                                                                                                               |

Total skill text: 398 lines. Each skill has `name` and `description` frontmatter.

## 6. Agent instruction files

| File        | Lines | Notes                                                  |
| ----------- | ----- | ------------------------------------------------------ |
| `AGENTS.md` | 79    | Source file                                            |
| `CLAUDE.md` | 79    | Symlink to `AGENTS.md`; byte-identical by construction |

Sections in AGENTS.md: Repository map, Read on demand, Working method, Local Java,
Engineering essentials, Authority, Evidence and learning. Every `docs/` and `apps/`
path it names exists (`docs/vision.md`, `docs/project-vision.md`, `docs/architecture.md`,
`docs/design.md`, `docs/development.md`, `docs/plans/`, `docs/specs/`,
`docs/specs/factory/spec.md`, both skills, `scripts/check-contracts.mjs`).

Differences between AGENTS.md and CLAUDE.md: none. They are one file.

`tools.local/java21/` exists locally (the Local Java section's runtime). It is ignored by `*.local`.

## 7. docs/development.md

239 lines. Setup section names Node 22+, pnpm 10.33.0, Java 21, and `pnpm dev` on port 4321.

Gate table (documented command, then evidence):

| Command                 | Evidence (abridged)                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| `pnpm check:contracts`  | Context and Markdown links, CSS/Canvas parity, runner regressions     |
| `pnpm check:commits`    | Conventional Commit syntax after baseline `841c975`                   |
| `pnpm lint`             | Biome, warnings fail                                                  |
| `pnpm check:types`      | Astro, Svelte, workspace and browser-harness TypeScript               |
| `pnpm test`             | Physics, stock profile effects, replay, death/reset, camera/wrap      |
| `pnpm build`            | Static production build                                               |
| `pnpm test:browser`     | Keyboard/touch, pause, replay, focus, death/restart, Canvas semantics |
| `pnpm test:rules`       | Firestore emulator allowed/rejected access cases                      |
| `pnpm test:competition` | Two browser identities submit runs; third reads both scores           |

Also documented: `verify`, `verify:quick`, `test:factory`, `test:backend`, `test:capture`,
`release:prepare`, `release:check <dir>`, `release:publish <dir>`, `pnpm exec playwright show-report`,
`pnpm exec lefthook install`. Every documented pnpm command exists in root `package.json`.

Root commands not documented in development.md: `check`, `tuning:apply`, `prepare`.

## 8. docs/specs/factory/spec.md

265 lines. The "Definition of done" heading is at line 43. Its checkboxes are at lines 45 to 57.

| Line | Item (abridged)                                                                       | State |
| ---- | ------------------------------------------------------------------------------------- | ----- |
| 45   | One documented command runs the required gates and exits nonzero on failure           | []    |
| 46   | Gates cover formatting, strict types, schema/behavior tests, build, browser smoke     | []    |
| 47   | Each check produces a named pass/fail; skipped checks cannot count as passes          | []    |
| 48   | Evidence identifies revision, dirty state, commands, environment                      | []    |
| 49   | Known failing contract is detected; correcting it restores success                    | []    |
| 50   | Clean checkout can launch game and Lab with no live backend credentials               | []    |
| 51   | Fixed seed and input reproduce gameplay state                                         | []    |
| 52   | Browser checks cover ship selection, movement, two touch controls, game over, restart | []    |
| 53   | Lab scenarios have reproducible identifiers and shareable configuration               | []    |
| 54   | Visual comparisons hold viewport, seed, time, environment fixed                       | []    |
| 55   | Playable checkpoint includes links, automated results, known gaps, review question    | []    |
| 56   | Commit and release status distinguish working, local, pushed, deployed revisions      | []    |
| 57   | Factory experiment reconstructable from intent, change, checks, assessment, lesson    | []    |

Result: 13 items, 0 checked, 13 unchecked. Line 230 says "The full factory definition of done above remains open."

## 9. Local state and ignore rules

| Path                                  | State                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.local.json`         | Exists; ignored (`.claude/*`); keys: `permissions`                                                                  |
| `.claude/launch.json`                 | Exists; ignored; one configuration `web` on port 4330                                                               |
| `.claude/settings.json`               | Absent. `.gitignore` allows it, but no project settings file exists                                                 |
| `.claude/worktrees/`                  | 6 directories; ignored                                                                                              |
| `.claude/skills`                      | Tracked symlink                                                                                                     |
| `git worktree list`                   | 8 entries: main checkout, 1 Codex worktree under `~/.codex/worktrees/`, and 6 under `.claude/worktrees/` (7 linked) |
| `tools.local/`                        | Exists with `java21/`; ignored by `*.local`                                                                         |
| `.env.local`                          | Exists; ignored by `*.local`. `.env.example` tracked                                                                |
| `artifacts/`                          | Exists; ignored by `artifacts/`                                                                                     |
| `playwright-report/`, `test-results/` | Exist; ignored                                                                                                      |
| `firestore-debug.log` (root)          | Exists; ignored by `*-debug.log`                                                                                    |
| `dist/` (root)                        | Exists; ignored                                                                                                     |
| `outgoing/`                           | Exists; contains one tracked file `outgoing/asdlc-feedback-void-drift.md`                                           |

`git status --short` returned no output, so the tree is clean.

## 10. artifacts/ inventory (names only)

| Category                                       | Count                                                                                                                   | Date range from names                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `artifacts/verification/` run directories      | 134 total: 124 timestamped (`2026-10-31T...` to `2026-11-08T...`) and 10 `backend-<id>`                                 | 2026-10-31 to 2026-11-08             |
| Timestamped runs by day                        | 10-31: 3, 11-01: 13, 11-02: 27, 11-03: 42, 11-04: 10, 11-05: 21, 11-06: 1, 11-07: 1, 11-08: 6                           |                                      |
| `artifacts/prepared-releases/` run directories | 11                                                                                                                      | 2026-11-03T14-39 to 2026-11-08T08-10 |
| `artifacts/releases/`                          | 4 entries: 0.4.2, 0.4.3, 0.4.4, 0.4.9                                                                                   | none                                 |
| Top-level `artifacts/release-*`                | 5 entries: `release-0.4.0.json`, `release-0.4.1.json`, `release-0.5.0`, `release-0.5.0-refresh`, `release-0.5.3-review` | none                                 |
| Top-level `artifacts/live-*`                   | 12 entries (files and directories for 0.5.2 to 0.5.6)                                                                   | none                                 |
| Other top-level directories                    | not counted (study, review, and capture folders)                                                                        | none                                 |

## Observations

Each item was checked with a command in this session.

1. **Four spec links point to paths that no longer exist.** `design-study/SKILL.md` links `docs/specs/design-studies.md` and `docs/specs/motion-instrument.md`. `fx-development/SKILL.md` links `docs/specs/sfx-canvas.md`. The current files are `docs/specs/lab/design-studies/spec.md`, `docs/specs/lab/motion-instrument/spec.md`, and `docs/archive/sfx-canvas-legacy.md`, which is archived. The FX skill has no current spec target.
2. **`gravity-field.md` is also stale in two places.** `docs/development.md` line 135 links `specs/gravity-field.md#rules-version`, and `scripts/tuning-apply.mjs` line 3 cites `docs/specs/gravity-field.md`. The file is now `docs/specs/game/world/gravity-field/spec.md`. `tuning-apply.mjs` is also not referenced by any test.
3. **All 13 factory DoD items are unchecked.** `docs/specs/factory/spec.md` lines 45 to 57 are all `[ ]`, and line 230 says the definition remains open. The spec also records existing lint debt as an intentionally failing stage (around lines 226 to 228). I did not run `pnpm lint`, so the current lint state is unknown.
4. **Three scripts have no test, and script tests run only through `test:factory`.** `profile-fx.mjs` (139 lines), `tuning-apply.mjs` (56 lines), and `check-contracts.mjs` (138 lines, the contract gate itself) have no test file. `release-smoke.mjs` (104 lines) is only exercised through `release.mjs`. Vitest's include pattern does not match `scripts/*.test.mjs`, so those tests run only through `check:contracts`, which calls `test:factory`.
5. **Root scripts `check`, `tuning:apply`, and `prepare` are not in docs/development.md.** Every command the doc names exists in `package.json`.
6. **The project settings file is missing.** `.gitignore` says project settings are shared and allows `.claude/settings.json`, but that file does not exist. Only `.claude/skills` is tracked under `.claude/`.
7. **There is no root `tsconfig.json`, and packages have no tsconfig.** Type checking runs only through `tsconfig.check.json`, which extends `apps/web/tsconfig.json`.
8. **CI caching and timeouts are partial.** The workflow caches only the pnpm store. It has no cache for Playwright browsers or Firebase emulator binaries, and no pre-push hook exists. The job timeout is 20 minutes. Per-step caps in `verify.mjs` are 10 minutes for browser and 3 minutes for other commands, and the backend deadline is 7 minutes. Their sum can exceed 20 minutes, but I did not measure a run.
9. **Wording conflicts with the memory rule.** `owner` appears in 82 files under `docs/`, including `docs/specs/factory/spec.md` ("The owner decided on 2026-11-02") and `docs/development.md` ("owner decision, 2026-11-04"). `scripts/tuning-apply.mjs` line 1 says "owner-supplied". The user's memory rule says not to use an owner role.
10. **AGENTS.md and CLAUDE.md have no differences.** CLAUDE.md is a symlink, so there is nothing to duplicate.
11. **The skill directory uses `.agents/skills` as its single source.** `.claude/skills` is a symlink to it, and `.agents/` is excluded from Biome, so skill Markdown is not linted.
12. **Stale worktrees and artifacts are local-only.** `git worktree list` shows 7 linked worktrees, and `artifacts/` holds 134 verification runs. Both are gitignored, so nothing here is tracked.
