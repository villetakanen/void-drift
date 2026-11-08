# Void Drift: retrospective metrics

Measured 2026-11-08 on branch `feat/0-5-0` (HEAD 3b3eb94). Read-only. Excluded: node_modules, dist, .astro, artifacts.

Note on the shell: zsh does not split an unquoted `$VAR` into flags, so the `find` exclusions below are written inline.

## 1. Git history

### Commits and weekly rhythm

| Measure                                      | Value |
| -------------------------------------------- | ----- |
| Total commits on HEAD                        | 304   |
| Commits since 2026-10-28                     | 225   |
| Commits in ISO week 2026-W44 (from 10-28)    | 95    |
| Commits in ISO week 2026-W45 (through 11-08) | 130   |
| Merge commits since 2026-10-28               | 8     |
| Commits on v0.5.0..HEAD                      | 80    |

```
git rev-list --count HEAD
git log --since=2026-10-28 --format=%ad --date=format:%G-W%V | sort | uniq -c
git log --since=2026-10-28 --merges --oneline | wc -l
git log v0.5.0..HEAD --format=%s | wc -l
```

### Commit-type mix

Type is the prefix before `:` or `(`. Breaking is a `!` after the type.

| Type                                   | Since 2026-10-28 | Since v0.5.0 |
| -------------------------------------- | ---------------- | ------------ |
| feat                                   | 74               | 28           |
| feat! (breaking)                       | 2                | 1            |
| fix                                    | 26               | 5            |
| docs                                   | 84               | 36           |
| chore                                  | 15               | 3            |
| refactor                               | 6                | 5            |
| test                                   | 5                | 2            |
| style                                  | 6                | 0            |
| build                                  | 1                | 0            |
| Merge commits (subject begins "Merge") | 6                | 0            |

Breaking commits: 2 since 2026-10-28, 2 in total.

```
git log --since=2026-10-28 --format=%s | sed -E 's/^([a-z]+)(\(.*\))?(!)?:.*/\1\3/' | sort | uniq -c | sort -rn
git log v0.5.0..HEAD --format=%s | sed -E 's/^([a-z]+)(\(.*\))?(!)?:.*/\1\3/' | sort | uniq -c | sort -rn
git log --format=%s | grep -cE '^[a-z]+(\([^)]*\))?!:'
```

The 8 merge commits are 6 with a "Merge" subject plus 2 whose subject is a conventional type, so the type table does not sum to 225 by itself.

### Tags

| Tag             | Date (short) | Days since previous tag |
| --------------- | ------------ | ----------------------- |
| v0.1.0          | 2025-12-25   |                         |
| v0.2.0          | 2025-12-29   | 4                       |
| v0.2.1-planning | 2026-01-02   | 4                       |
| v0.3.0          | 2026-05-05   | 123                     |
| v0.3.1          | 2026-10-28   | 176                     |
| v0.3.2          | 2026-10-28   | 0                       |
| v0.3.3          | 2026-10-28   | 0                       |
| v0.4.1          | 2026-10-31   | 3                       |
| v0.4.9          | 2026-11-02   | 2                       |
| v0.5.0          | 2026-11-03   | 1                       |
| v0.5.1          | 2026-11-03   | 0                       |
| v0.5.2          | 2026-11-03   | 0                       |
| v0.5.3          | 2026-11-05   | 2                       |
| v0.5.4          | 2026-11-05   | 0                       |
| v0.5.5          | 2026-11-05   | 0                       |
| v0.5.6          | 2026-11-08   | 3                       |

Dates are the commit date of the tagged commit (`%ad`), not the tag object date. Days from v0.5.0 on: 0, 0, 2, 0, 0, 3.

```
for t in $(git tag --sort=creatordate); do echo "$t $(git log -1 --format=%ad --date=short $t)"; done
```

### Branch position

| Measure                      | Value      |
| ---------------------------- | ---------- |
| Current branch               | feat/0-5-0 |
| Commits ahead of main        | 195        |
| Commits ahead of origin/main | 195        |
| Commits behind origin/main   | 0          |

```
git branch --show-current
git rev-list --count main..HEAD
git rev-list --count origin/main..HEAD
git rev-list --count HEAD..origin/main
```

## 2. Churn

| Range        | Files changed | Insertions | Deletions |
| ------------ | ------------- | ---------- | --------- |
| v0.5.0..HEAD | 424           | 49,081     | 7,560     |
| v0.5.5..HEAD | 192           | 28,091     | 1,042     |

```
git diff --shortstat v0.5.0 HEAD
git diff --shortstat v0.5.5 HEAD
```

### Ten most-committed files since 2026-10-28

| Commits | File                                       |
| ------- | ------------------------------------------ |
| 35      | apps/web/src/components/FlightDeck.svelte  |
| 34      | apps/web/src/data/studies.ts               |
| 29      | packages/mode-a/src/lib/simulation.ts      |
| 29      | apps/web/src/components/ShipBuilder.svelte |
| 27      | package.json                               |
| 24      | packages/mode-a/package.json               |
| 24      | packages/core/package.json                 |
| 24      | docs/design.md                             |
| 24      | apps/web/package.json                      |
| 23      | docs/specs/opening-screen.md               |

```
git log --since=2026-10-28 --format= --name-only | grep -v '^$' | sort | uniq -c | sort -rn | head -10
```

## 3. Size

### Source lines by area and extension

Lines are `cat | wc -l` over the matching files.

| Area                | Ext     | Files | Lines  |
| ------------------- | ------- | ----- | ------ |
| apps/web/src        | .ts     | 64    | 5,506  |
| apps/web/src        | .svelte | 145   | 38,585 |
| apps/web/src        | .astro  | 147   | 37,261 |
| apps/web/src        | .css    | 3     | 87     |
| packages/core/src   | .ts     | 39    | 3,451  |
| packages/core/src   | .mjs    | 2     | 70     |
| packages/core/src   | .css    | 7     | 968    |
| packages/mode-a/src | .ts     | 75    | 14,581 |
| scripts             | .mjs    | 9     | 1,583  |
| tests               | .ts     | 36    | 3,282  |
| tests               | .mjs    | 1     | 11     |

Source total across these areas: 105,385 lines.

```
for area in apps/web/src packages/core/src packages/mode-a/src scripts tests; do
  for ext in ts svelte astro mjs css; do
    find $area -type f -name "*.$ext" -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.astro/*' -not -path '*/artifacts/*' -print0 | xargs -0 cat | wc -l
  done
done
```

### Components and pages

| Measure                                                                    | Value |
| -------------------------------------------------------------------------- | ----- |
| Svelte components (apps + packages)                                        | 145   |
| Astro pages under apps/web/src/pages                                       | 71    |
| Astro pages under apps/web/src/pages/lab                                   | 65    |
| Astro files under apps/web/src/pages/lab/studies (incl. index and archive) | 37    |
| Of those, archive/                                                         | 3     |
| Of those, index.astro                                                      | 1     |
| Study pages excluding archive and index                                    | 33    |
| Lab pages outside studies/                                                 | 28    |

```
find apps packages -type f -name '*.svelte' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.astro/*' -not -path '*/artifacts/*' | wc -l
find apps/web/src/pages -type f -name '*.astro' | wc -l
find apps/web/src/pages/lab -type f -name '*.astro' | wc -l
find apps/web/src/pages/lab/studies -type f -name '*.astro' | wc -l
```

### Study registry (apps/web/src/data/studies.ts)

The registry is 276 lines. Each entry has a `status` field, counted with `grep -o 'status: "[a-z-]*"'`.

| Status            | Entries |
| ----------------- | ------- |
| accepted          | 21      |
| open              | 2       |
| stopped           | 10      |
| ruled-out         | 0       |
| **Total entries** | **33**  |

The schema has no archived or retired field. The 3 archived study pages live in `lab/studies/archive/`.

```
wc -l apps/web/src/data/studies.ts
grep -o 'status: "[a-z-]*"' apps/web/src/data/studies.ts | sort | uniq -c
```

## 4. Tests

### Unit tests (vitest, under apps, packages, scripts)

| Measure                                                   | Value |
| --------------------------------------------------------- | ----- |
| Test files matching `*.test.*` or `*.spec.*`              | 54    |
| `it(` / `test(` calls, all unit files including firestore | 259   |
| `it(` / `test(` calls, unit files excluding firestore     | 249   |

Largest test-call counts: `salvage.test.ts` 26, `Physics.test.ts` 11, `simulation.test.ts` 11, `build-flight.test.ts` 14, `ion-cannon.test.ts` 9.

```
find apps packages scripts -type f \( -name '*.test.*' -o -name '*.spec.*' \) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.astro/*' -not -path '*/artifacts/*' | wc -l
grep -rhE "(^|[^a-zA-Z_.])(it|test)\(" apps packages scripts --include='*.test.ts' --include='*.test.mjs' --include='*.test.js' --include='*.spec.mjs' --include='*.spec.ts' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro --exclude-dir=artifacts | wc -l
```

The regex count is approximate. It matches `it(` or `test(` at a word boundary, so it can miss call forms like `it.each(`.

### Browser tests (playwright, tests/)

| Measure                              | Value |
| ------------------------------------ | ----- |
| `*.spec.ts` files under tests/       | 34    |
| `it(` / `test(` calls in those files | 79    |

Subfolders: tests/browser, tests/firebase, tests/review.

```
find tests -type f -name '*.spec.ts' -not -path '*/node_modules/*' | wc -l
grep -rhE "(^|[^a-zA-Z_.])(it|test)\(" tests --include='*.spec.ts' --exclude-dir=node_modules | wc -l
```

### Firestore rules

| Measure                                                | Value |
| ------------------------------------------------------ | ----- |
| Test cases in packages/mode-a/tests/firestore.test.mjs | 10    |

```
grep -cE "(^|[^a-zA-Z_.])(it|test)\(" packages/mode-a/tests/firestore.test.mjs
```

## 5. Documentation

### Markdown files under docs/ by subfolder

| Subfolder                 | Markdown files |
| ------------------------- | -------------- |
| (root of docs/)           | 12             |
| specs/                    | 32             |
| loop-evidence/            | 48             |
| plans/                    | 16             |
| releases/                 | 7              |
| archive/                  | 6              |
| factory-building-lessons/ | 5              |
| history/                  | 2              |
| audits/                   | 1              |
| reviews/                  | 1              |
| **Total**                 | **130**        |

Total lines across all docs/ Markdown files: 20,120.

```
find docs -type f -name '*.md' | awk -F/ '{ if (NF>2) print $2; else print "(root)"}' | sort | uniq -c
find docs -type f -name '*.md' -print0 | xargs -0 cat | wc -l
```

### spec.md files and checkboxes

29 `spec.md` files. Totals across all Markdown under docs/specs: 135 checked `[x]`, 166 unchecked `[ ]`.

| Spec                                         | Checked [x] | Unchecked [] |
| -------------------------------------------- | ----------- | ------------ |
| docs/specs/game/spec.md                      | 0           | 0            |
| docs/specs/factory/spec.md                   | 0           | 13           |
| docs/specs/factory/cockpit-materials/spec.md | 0           | 0            |
| docs/specs/factory/effects/spec.md           | 5           | 3            |
| docs/specs/factory/design-system/spec.md     | 7           | 10           |
| docs/specs/factory/monorepo/spec.md          | 7           | 0            |
| docs/specs/lab/design-studies/spec.md        | 0           | 0            |
| docs/specs/lab/motion-instrument/spec.md     | 6           | 8            |
| docs/specs/lab/gravity-tuning/spec.md        | 3           | 5            |
| docs/specs/lab/workbench/spec.md             | 4           | 0            |
| docs/specs/game/high-scores/spec.md          | 0           | 26           |
| docs/specs/game/options/spec.md              | 0           | 12           |
| docs/specs/game/game-screen/spec.md          | 6           | 3            |
| docs/specs/game/derelicts/spec.md            | 6           | 8            |
| docs/specs/game/camera/spec.md               | 6           | 0            |
| docs/specs/game/light-ion-cannon/spec.md     | 3           | 2            |
| docs/specs/game/hangar/spec.md               | 4           | 4            |
| docs/specs/game/hangar/mount-planner/spec.md | 0           | 12           |
| docs/specs/game/controls/spec.md             | 6           | 0            |
| docs/specs/game/test-flight/spec.md          | 0           | 8            |
| docs/specs/game/landing-page/spec.md         | 0           | 13           |
| docs/specs/game/dialogs/spec.md              | 6           | 0            |
| docs/specs/game/ship-select/spec.md          | 0           | 5            |
| docs/specs/game/survival/spec.md             | 49          | 8            |
| docs/specs/game/ships/propulsion/spec.md     | 0           | 10           |
| docs/specs/game/world/star/spec.md           | 0           | 0            |
| docs/specs/game/world/planets/spec.md        | 5           | 5            |
| docs/specs/game/world/gravity-field/spec.md  | 8           | 0            |
| docs/specs/game/world/systems/spec.md        | 0           | 6            |

```
for f in $(find docs/specs -type f -name 'spec.md'); do echo "$f checked=$(grep -c '\[x\]' $f) unchecked=$(grep -c '\[ \]' $f)"; done
find docs/specs -type f -name '*.md' -print0 | xargs -0 grep -c '\[x\]' | awk -F: '{s+=$2} END{print s}'
find docs/specs -type f -name '*.md' -print0 | xargs -0 grep -c '\[ \]' | awk -F: '{s+=$2} END{print s}'
```

### Plans

16 files in docs/plans. The filename date is the prefix. The git date is the last commit touching the file.

| File                                         | Filename date | Last commit date |
| -------------------------------------------- | ------------- | ---------------- |
| 2026-11-03-alpha-0.5.0-refresh.md            | 2026-11-03    | 2026-11-03       |
| 2026-11-03-alpha-0.5.0.md                    | 2026-11-03    | 2026-11-03       |
| 2026-11-03-fx-framework-triage.md            | 2026-11-03    | 2026-11-03       |
| 2026-11-03-fx-surface-correction.md          | 2026-11-03    | 2026-11-03       |
| 2026-11-03-opening-screen-dialog-boundary.md | 2026-11-03    | 2026-11-05       |
| 2026-11-03-test-suite-pruning.md             | 2026-11-03    | 2026-11-03       |
| 2026-11-04-camera-framing.md                 | 2026-11-04    | 2026-11-04       |
| 2026-11-04-camera-trial-2.md                 | 2026-11-04    | 2026-11-05       |
| 2026-11-04-gravity-field-lab.md              | 2026-11-04    | 2026-11-04       |
| 2026-11-04-lab-usability.md                  | 2026-11-04    | 2026-11-04       |
| 2026-11-04-motion-instrument-conformance.md  | 2026-11-04    | 2026-11-04       |
| 2026-11-05-game-and-lab-spec-trees.md        | 2026-11-05    | 2026-11-05       |
| 2026-11-05-hull-engine-cruise-model.md       | 2026-11-05    | 2026-11-05       |
| 2026-11-07-derelicts-mode.md                 | 2026-11-07    | 2026-11-07       |
| 2026-11-07-stellar-variety-follow-up.md      | 2026-11-07    | 2026-11-07       |
| random-star-systems.md                       | none          | 2026-11-02       |

```
for f in $(find docs/plans -type f -name '*.md' | sort); do echo "$(git log -1 --format=%ad --date=short -- $f) $f"; done
```

### Five largest Markdown files in docs/

| Lines | File                                     |
| ----- | ---------------------------------------- |
| 995   | docs/specs/game/survival/spec.md         |
| 692   | docs/history/ship-builder.md             |
| 678   | docs/specs/factory/design-system/spec.md |
| 653   | docs/project-vision.md                   |
| 532   | docs/specs/game/hangar/spec.md           |

```
find docs -type f -name '*.md' -print0 | xargs -0 wc -l | sort -rn | sed -n 2,6p
```

## 6. Debt markers

Searched in apps, packages, scripts and tests, in `.ts`, `.svelte`, `.astro`, `.mjs`, `.js` and `.css` files.

| Marker           | Files | Occurrences | Files with the marker                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TODO             | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| FIXME            | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| HACK             | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| XXX              | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| @ts-ignore       | 2     | 2           | apps/web/src/pages/index.astro, apps/web/src/pages/settings.astro                                                                                                                                                                                                                                                                                |
| @ts-expect-error | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| as any           | 1     | 2           | apps/web/src/pages/lab/studies/lab-instrument-2026-11-01.astro                                                                                                                                                                                                                                                                                   |
| eslint-disable   | 0     | 0           |                                                                                                                                                                                                                                                                                                                                                  |
| biome-ignore     | 5     | 5           | apps/web/src/components/studies/gravity-coil-form/UnderRingComparison.astro, apps/web/src/components/studies/gravity-coil-form/Comparison.astro, apps/web/src/components/studies/fiddler/WindowEditor.svelte, apps/web/src/components/studies/fiddler/PlacementHandles.svelte, apps/web/src/pages/lab/studies/gravity-coil-form-2026-11-03.astro |

```
for p in 'TODO' 'FIXME' 'HACK' 'XXX' '@ts-ignore' '@ts-expect-error' 'as any' 'eslint-disable' 'biome-ignore'; do
  grep -rlF "$p" apps packages scripts tests --include='*.ts' --include='*.svelte' --include='*.astro' --include='*.mjs' --include='*.js' --include='*.css' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro --exclude-dir=artifacts
done
```

## 7. Dependencies

Versions are as declared in each package.json. "Ranged" means a caret or tilde. "Pinned" means an exact version. `workspace:*` is counted separately.

### Root (devDependencies only)

| Package                         | Version | Form   |
| ------------------------------- | ------- | ------ |
| @biomejs/biome                  | 2.6.3   | pinned |
| @commitlint/cli                 | 21.2.4  | pinned |
| @commitlint/config-conventional | 21.2.4  | pinned |
| @firebase/rules-unit-testing    | 6.0.0   | pinned |
| @playwright/test                | 1.64.1  | pinned |
| @vitest/ui                      | ^4.0.16 | ranged |
| firebase-tools                  | 15.34.1 | pinned |
| lefthook                        | 2.2.2   | pinned |
| svelte-check                    | 4.7.7   | pinned |
| typescript                      | ^5.0.0  | ranged |
| vitest                          | ^4.0.16 | ranged |

Root: 8 pinned, 3 ranged. The root has no `dependencies` block.

### apps/web

| Package                      | Version     | Form      |
| ---------------------------- | ----------- | --------- |
| @astrojs/svelte              | ^7.2.3      | ranged    |
| @nanostores/persistent       | ^1.2.0      | ranged    |
| @void-drift/core             | workspace:* | workspace |
| @void-drift/mode-a           | workspace:* | workspace |
| astro                        | ^5.16.5     | ranged    |
| nanostores                   | ^1.1.0      | ranged    |
| svelte                       | ^5.46.0     | ranged    |
| typescript                   | ^5.9.3      | ranged    |
| devDependency @astrojs/check | ^0.9.6      | ranged    |

apps/web: 0 pinned, 7 ranged, 2 workspace.

### packages/core

| Package | Version | Form   |
| ------- | ------- | ------ |
| zod     | ^3.23.8 | ranged |

packages/core: 0 pinned, 1 ranged. No devDependencies.

### packages/mode-a

| Package          | Version     | Form      |
| ---------------- | ----------- | --------- |
| @void-drift/core | workspace:* | workspace |
| firebase         | 13.1.0      | pinned    |
| zod              | ^3.23.8     | ranged    |

packages/mode-a: 1 pinned, 1 ranged, 1 workspace. No devDependencies.

### Node and pnpm

| Source                                                           | Value         |
| ---------------------------------------------------------------- | ------------- |
| Root package.json `packageManager`                               | pnpm@10.33.0  |
| `engines` field (root, apps/web, packages/core, packages/mode-a) | none declared |
| `.nvmrc`                                                         | not present   |
| `.node-version`                                                  | not present   |
| `node --version` on this machine                                 | v24.14.0      |
| `pnpm --version` on this machine                                 | 10.33.0       |

```
grep -E '"[^"]+": "[\^~]' package.json apps/web/package.json packages/core/package.json packages/mode-a/package.json | wc -l
grep -E '"[^"]+": "[0-9]' package.json apps/web/package.json packages/core/package.json packages/mode-a/package.json
node --version
pnpm --version
ls -la .nvmrc .node-version
```

The ranged and pinned greps also match the `"version"` field on each package, so they overcount by one per package.

## 8. Working tree

| Measure                      | Value     |
| ---------------------------- | --------- |
| `git status --short` entries | 0 (clean) |
| `git stash list` entries     | 1         |

```
git status --short | wc -l
git stash list | wc -l
```

## Five numbers that stand out

1. 225 commits since 2026-10-28, over 12 calendar days inclusive (95 in W44 from 10-28, 130 in W45 through 11-08).
2. 105,385 lines of source across the measured areas, against 20,120 lines of Markdown under docs/.
3. Since v0.5.0, 49,081 insertions against 7,560 deletions across 424 files.
4. Spec checkboxes: 166 unchecked against 135 checked, with 9 of 29 spec files holding no checked box.
5. Debt markers are near zero: 0 TODO, 0 FIXME, 2 @ts-ignore, 2 "as any", 5 biome-ignore.
