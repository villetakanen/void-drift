# Loop record: Markdown link repair and failing link gate — 2026-11-08

## Intent and scope

Decision of 2026-11-08 (retrospective `docs/reviews/2026-11-08-retro-0-6-0/README.md`,
issue 5): repair every relative Markdown link left unresolved by the 5 November
2026 spec relocation, then make `pnpm check:contracts` fail on a missing target.
Links change; prose does not. Links into `artifacts/` stay exempt. No change under
`apps/` or `packages/`; nothing pushed.

## Changes delivered

- `5223ffb` docs: repair Markdown link targets after the spec relocation
  (48 files: 132 links relinked, 1 link syntax removed, 3 backtick path references
  in two skills and the `scripts/tuning-apply.mjs` comment).
- Gate change commit (hash in `git log`): `scripts/check-contracts.mjs` collects
  misses, prints each as `FAIL:`, then fails with a count; `docs/development.md`
  gate row and `docs/specs/factory/spec.md` sentence say links fail; this record and
  the retained report.

## Starting state

`node scripts/check-contracts.mjs` reported
`Markdown links: 149 files; 133 missing target(s)` as warnings. The cause was
twofold: renamed or archived spec files, and relative prefixes not recomputed for
files that moved deeper (Hangar spec, FX spec, factory spec and others).

## Map used (old path under `docs/specs/` to current path)

Derived from `git log --all --diff-filter=R -M -- docs`; each target checked to exist.

| Old                         | Current                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `design-studies.md`         | `lab/design-studies/spec.md`                                              |
| `design-studies-history.md` | `docs/archive/specs/design-studies-history.md` (archive is the only copy) |
| `motion-instrument.md`      | `lab/motion-instrument/spec.md`                                           |
| `gravity-tuning.md`         | `lab/gravity-tuning/spec.md`                                              |
| `gravity-field.md`          | `game/world/gravity-field/spec.md`                                        |
| `playable-alpha.md`         | `game/spec.md`                                                            |
| `hangar/spec.md`            | `game/hangar/spec.md`                                                     |
| `ship-mount-planner.md`     | `game/hangar/mount-planner/spec.md`                                       |
| `ship-propulsion.md`        | `game/ships/propulsion/spec.md`                                           |
| `survival-core.md`          | `game/survival/spec.md`                                                   |
| `opening-screen.md`         | `game/landing-page/spec.md`                                               |
| `settings-system.md`        | `game/options/spec.md`                                                    |
| `dialogs.md`                | `game/dialogs/spec.md`                                                    |
| `weapons-and-salvage.md`    | `game/test-flight/spec.md`                                                |
| `sfx-canvas.md`             | `factory/effects/spec.md`                                                 |
| `voice-led-factory.md`      | `factory/spec.md`                                                         |
| `design-system-core.md`     | `factory/design-system/spec.md`                                           |
| `cockpit-materials.md`      | `factory/cockpit-materials/spec.md`                                       |

Other cases: `docs/history/ship-builder.md` (renamed from `docs/specs/ship-builder.md`)
and source, test and Lab-page paths cited by the Hangar and cockpit-materials specs
exist at their cited locations; only their `../` depth was recomputed. For moved spec
files, links were resolved from the file's old directory first, then mapped to the new
path and re-expressed relative to the new location. Archived specs
(`menu-overlay.md`) link to current specs.

Backtick paths: `.agents/skills/design-study/SKILL.md` (`motion-instrument`),
`.agents/skills/fx-development/SKILL.md` (FX contract; first lines of
`docs/specs/factory/effects/spec.md` read: "Arcade effects layer"), and the
`scripts/tuning-apply.mjs` comment. The `#rules-version` anchor in
`docs/development.md` exists in the gravity-field spec ("Rules version").

## Deleted with no successor

- `docs/loop-evidence/2026-10-31-ship-slot-language.md`: link to
  `apps/web/src/components/studies/SlotStatesAccepted021.svelte`. The file was
  removed in commit `3039004` with no successor. The words "preserved appearance"
  remain; only the link syntax is gone.

## Gate proof

A scratch file `docs/zz-scratch-link-proof.md` containing a link to
`docs/nope-missing.md` was added with `git add -N`, the gate run, then the file was
removed from index and disk. Output:

```
Markdown links: 151 files; 1 missing target(s).
FAIL: docs/zz-scratch-link-proof.md: link target missing: docs/nope-missing.md
AssertionError [ERR_ASSERTION]: 1 Markdown link target(s) missing
exit=1
```

On the repaired tree: `Markdown links: 150 files; 0 missing target(s).`, exit 0.

## Verification

- `pnpm verify:quick`: contracts, lint, types, unit tests passed. Partial
  verification, not a full pass (the report records `passed: false` for quick mode).
- Tested revision `5223ffb` plus uncommitted working-tree edits to
  `scripts/check-contracts.mjs`, `docs/development.md`, `docs/specs/factory/spec.md`
  (the second commit's content), and the other session's uncommitted
  `in-game-controllers` files (see `workingTree` in the report).
- Environment: node v24.14.0, darwin/arm64.
- Report: [report.json](artifacts/2026-11-08-link-repair/report.json), copied from
  `artifacts/verification/2026-11-08T11-15-38.346Z-iBrm3J/report.json`.
- The retained copy sits under the git-ignored `docs/loop-evidence/artifacts/`, so it
  is a local file and not part of either commit.
- Biome format and check run on every edited Markdown file: no fixes pending.

## Not run

Build, browser tests, Firestore rules tests, competition test. Anchors (`#fragment`)
are not checked by the gate; only the one in `docs/development.md` was checked by hand.
