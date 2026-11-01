# Opening-screen S3: colour roles — closure evidence

Closed 2026-11-01 by explicit owner instruction: "close loop". This is a bounded evidence
record. It does not state causes, lessons or process changes. Times are local (+02:00).

## Intent and scope

Owner brief (paraphrased): do slice S3 (Colour roles, D6) of `docs/specs/opening-screen.md` on
`feat/0-4-0`. D6: lime is one colour with two jobs, brand and interactive/selected, including
selection outlines; `--color-brand` is the lime, `--color-action` and `--color-selected` alias it;
informational text never uses brand. Steps: show an inventory before changing code; rewrite the
colour section of `design-system-core.md`; build `/lab/tokens` with contrast per surface; apply
roles everywhere (preserved studies keep values, only `StudyLayout` migrates); verify with
`pnpm verify` and browser evidence at 1440×900 and 844×390; record S3 pending approval. Rules: small
conventional commits, no new dependencies, no pushing. The brief said to stop and ask if another
session's elevation/backdrop changes were still uncommitted, and to build on `--color-elev-*` and
`--color-backdrop` if they had been committed.

Work ran in worktree `.claude/worktrees/s3-colour-roles-d29700`, branch
`claude/s3-colour-roles-d29700`.

## Sequence, owner decisions and feedback

1. The worktree branch started at `47e38a1` (`main`). It was fast-forwarded to `feat/0-4-0` at
   `bf1aa3f` before the inventory. The other session's elevation/backdrop changes were then
   uncommitted in the main checkout. The agent presented the inventory and asked how to proceed.
2. Owner: "what are the tokens decided here, where are they in lab?" The agent's first answer
   described the other session's work. Owner: "how does that relate to my question? I want list of
   tokens, now official whether we changed them is irrelevant." The agent then listed all 27
   colour-related tokens and the Lab pages that show or use them. By then the elevation work was
   committed as `c7e9375` (21:15), and the worktree was fast-forwarded to it.
3. Owner: "ok, lets change all colour to lch instead of hex?" then "on these tokens". Each token was
   converted to an exact CSS `lch()` value that converts back to the same 8-bit sRGB colour.
4. Owner asked "how to decide? explain difference, where were these used before?" about `#eeff41`
   (the token since PBI-022, `82bae5f`, 2025-12-26) versus `#d4ff00` (the original value, still
   hard-coded in 7 places). Owner: "keep eeff41".
5. Whether the power resource colour and the Balanced ship tint should leave lime was not answered
   explicitly. The agent applied its stated recommendation: keep them as game data for S8 and S4.
6. The overlap question became moot once `c7e9375` was committed. Per the brief's rule,
   `--color-elev-*` and `--color-backdrop` became the surface and scrim roles.
7. After the evidence report, owner: "Approve S3", then "Merge locally".

## Changes delivered

| Commit    | Summary                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `f553d77` | Colour tokens in `lch()`; two `buttons.spec.ts` assertions updated to the lch computed form                               |
| `df38293` | Role tokens and deprecated aliases; `COLOR` canvas mirror in `core/ui/colors.ts`; contract check                          |
| `af4ea69` | Shared CSS, game screens, Lab shell, inputs, instrument and `StudyLayout` name roles; `#000` → void; `theme-color` pinned |
| `b97a116` | Canvas renderers use `COLOR`; `ENGINE_ACCENT` in mode-a; Lab planet ring `var()` string replaced                          |
| `23301d8` | `/lab/tokens` with in-browser measured contrast                                                                           |
| `f5d4202` | Colour section in `design-system-core.md`, deprecations, `design.md` colour roles (amended once to include `design.md`)   |
| `93cfba6` | Removed an unused `getComputedStyle` in `ShipBuilder` (lint failure)                                                      |
| `b84a00e` | Biome formatting of the spec tables (lint failure)                                                                        |
| `fc32d47` | S3 recorded pending approval in `opening-screen.md` (amended once to correct inventory counts)                            |
| `ad337c9` | S3 approval recorded                                                                                                      |
| `58f1000` | Merge into `feat/0-4-0` (first parent `be4201e`)                                                                          |

Inventory as recorded in `opening-screen.md` (S3): 45 lime/neon uses outside preserved studies,
about 40 shared hex/rgb literals, `#d4ff00` in 7 hard-coded places, `--color-overlay` with no shared
consumer, `#000` page backgrounds and `theme-color`, and a canvas `strokeStyle` set to a `var()`
string.

## Checks

`pnpm verify` runs, each in `artifacts/verification/<run>/report.json` (git-ignored, local only).
Node v24.14.0, darwin/arm64.

| Run                               | Revision (tree)                     | Passed                                       | Failed                                                                                       |
| --------------------------------- | ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `2026-11-01T19-33-26.888Z-n7fnWQ` | `c7e9375` + dirty `tokens.css`      | contracts, commits, lint                     | types, test, build (workspace `node_modules` missing); browser, rules, competition           |
| `2026-11-01T19-34-06.452Z-mmwlwU` | `c7e9375` + dirty `tokens.css`      | contracts, commits, lint, types, test, build | browser (port 4322 in use), rules, competition (no Java)                                     |
| `2026-11-01T20-28-32.318Z-YmPvim` | `f5d4202`, `sourceUnchanged: false` | contracts, commits, types, test, build       | lint (unused variable `ShipBuilder.svelte:75`; spec formatting), browser, rules, competition |
| `2026-11-01T20-30-46.508Z-M29UEZ` | `93cfba6`                           | contracts, commits, types, test, build       | lint (spec formatting), browser, rules, competition                                          |
| `2026-11-01T20-32-19.452Z-yMoS4t` | `b84a00e`                           | contracts, commits, lint, types, test, build | browser (port 4322), rules, competition (no Java)                                            |
| `2026-11-01T20-38-09.647Z-RDZs42` | `58f1000` (detached)                | contracts, commits, lint, test, build        | types (`lhi-wasp.astro:276,314`, ts2322), browser (port 4322), rules, competition            |
- `test:browser` inside `verify` never started: `http://127.0.0.1:4322 is already used`. The
  listener was an `astro dev` process from the main checkout (`apps/web` of
  `/Users/ville.takanen/dev/void-drift`), not started by this session, and left running.
- The same Playwright suite ran with a temporary config (deleted after each run) on port 4342:
  at `c7e9375` + dirty tokens, 24 passed and 1 failed (`buttons.spec.ts:12`, expected
  `rgb(5, 5, 16)`, received `lch(1.57 4.76 285.25)`); after the assertion update, 25 passed;
  at `93cfba6`, 25 passed; at `58f1000`, 25 passed. These outputs exist only in this session's
  terminal and scratchpad, not in `artifacts/`.
- Run 20-28-32 has `sourceUnchanged: false`. A temporary evidence script (`.s3-evidence.mjs`, repo
  root) existed in the working tree during that run.
- During the canvas and Lab steps (about 22:00–22:15) the agent ran lint as
  `pnpm -s lint 2>&1 | tail`, which printed nothing, and treated it as passing. The `verify` run at 22:28 reported lint failures. Later local lint
  checks used exit codes.
- The `58f1000` type failure was checked against `be4201e` alone in a temporary worktree
  (`pnpm check`, exit 1): the same two errors. `be4201e` (LHI Wasp study, another session) reached
  `feat/0-4-0` at 22:37, between the agent's pre-merge check (which showed `e319ebb`) and the merge.
- Canvas check at `c7e9375` + dirty tokens: Chromium's 2D context parsed
  `lch(96.42% 84.18 104.87)`, and the builder canvas held 122 pixels of exactly `rgb(238,255,65)`.
- `/lab/tokens` contrast values (in-browser) and Node values agreed where both were computed (lime
  on void 18.4 vs 18.36).

## Browser evidence

Twelve screenshots in `artifacts/evidence/s3/` (git-ignored, 888 KB): menu, game HUD (after "TAP
TO START"), builder, leaderboard, `/lab/tokens` and `/lab/studies/path-instrument-2026-11-01`, at
1440×900 and 844×390 (touch context). Captured with Playwright from a dev server on port 4344,
serving the worktree at `f5d4202` before `93cfba6`; that commit changed no rendering.

## Publication

- Local commits: the 10 S3 commits and merge `58f1000`. Local `feat/0-4-0` was fast-forwarded to
  `58f1000` in the main checkout. The main checkout's uncommitted state (`studies.ts` modified,
  untracked Wasp study files) was the same before and after (`git status --porcelain` diff empty).
- Not pushed. `origin/feat/0-4-0` was `be4201e` at merge time. No deployment.

## Findings (observations only)

- Muted text measured 4.1:1 on `--color-elev-3`, and the Lab instrument's document panel places
  muted text inside the elevation-3 overlay pane. Not changed.
- Owner review items listed before approval: panels lighter (L 3.3 → 5.5), eyebrows grey, ivory
  Settings focus ring, death icon danger/power colours changed, instrument edited values marked
  only at the edge, and lime still used for power and the Balanced tint. The owner's approval
  ("Approve S3") followed that list; no item-by-item response was given.
- `--color-overlay` changed from alpha 0.9 to 0.91 as an alias of glass; its only reader is a
  preserved study. Preserved studies that read `--color-void-light` now render elevation 1.
- Unknown: how the delivered colours look on phone hardware. The 844×390 captures are emulated, and
  phone landscape is currently out of scope.

## Evidence gaps

- Alternate-port Playwright results, the canvas pixel check and the pre-merge `be4201e` type check
  are recorded only in session output and scratchpad files under
  `/private/tmp/claude-503/…/scratchpad`, which are temporary.
- `artifacts/` (verification reports, screenshots) is git-ignored and local to this worktree.
- `test:rules` and `test:competition` never ran in this loop (no Java runtime).
- The untracked `.claude/launch.json` (dev server on port 4344) stays in the worktree and is not
  committed. The dev server was still running at closure.
