# Two apps, two spec trees: the game and the Lab

**Status:** proposed 2026-11-05, not started. Review needed before task 1.

The player-facing site is a game, not a site. The Lab is game-developer tooling
and not part of the game experience. The specs are organised to say so: one tree
per app, each with a root spec, and the factory beside them at top level. This
file records the decisions, the target tree, the mapping of every existing
spec, and the order of work. Rules belong to the owning specs.

## Decisions (2026-11-05)

- The game has five player routes: the landing page, survival, the hangar, test
  flight and high scores. Whether they are one page app or many pages is not a
  design concern.
- The game has no site chrome. The header in `FlightDeck.svelte` (logomark link,
  edition tag, HANGAR, HIGH SCORES, OPTIONS) is early model drift and goes. The
  per-page headers in the hangar, high scores and options go with it.
- The Lab is reachable only by its URL. No player-facing page links to the Lab,
  and the Lab's PLAY link is Lab chrome, not game navigation.
- PRESS START is the landing page's one call to action. Where the other
  destinations sit on the landing page follows a short start-screen study
  (see open questions), not a pop-down in a corner.
- Specs move first, unchanged in content. Rewrites follow, one spec at a time,
  starting with the landing page.
- The factory stays a top-level tree beside the two apps.

## Target tree

```
docs/specs
├── game/                     # The game, as the player meets it
│   ├── spec.md               # root: routes, no-chrome rule, shared contracts
│   ├── landing-page/spec.md
│   ├── survival/spec.md
│   ├── hangar/spec.md
│   │   └── mount-planner/spec.md
│   ├── test-flight/spec.md
│   ├── high-scores/spec.md
│   ├── options/spec.md
│   ├── ship-select/spec.md
│   ├── camera/spec.md
│   ├── controls/spec.md
│   ├── dialogs/spec.md
│   ├── ships/propulsion/spec.md
│   └── world/
│       ├── gravity-field/spec.md
│       ├── planets/spec.md
│       ├── star/spec.md
│       └── systems/spec.md
├── lab/                      # Developer tooling, not the game
│   ├── spec.md               # root: purpose, reach, what the Lab reuses
│   ├── design-studies/spec.md
│   ├── motion-instrument/spec.md
│   ├── gravity-tuning/spec.md
│   └── workbench/spec.md
└── factory/                  # How the game and Lab are made
    ├── spec.md               # voice-led factory and its gates
    ├── design-system/spec.md
    ├── effects/spec.md
    ├── cockpit-materials/spec.md
    └── monorepo/spec.md
```

Conventions: kebab-case folders named for the feature, `spec.md` in each, one
spec per independently evolvable feature. The three root specs are new and
short. Sibling files inside a folder are allowed only until the content phase
merges them.

## Mapping of existing specs

Relocation is `git mv` with no content change. "Merge later" means the file
moves now as a sibling and is folded into the folder's `spec.md` in the content
phase. "Archive" means the file moves to `docs/archive/specs/` because it is
history, which specs do not carry.

| Current file                            | New path                            | Note                                                  |
| --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `playable-alpha.md`                     | `game/spec.md`                      | Becomes the game root; rewritten in the content phase |
| `opening-screen.md`                     | `game/landing-page/spec.md`         | First rewrite after the move                          |
| `survival-core.md`                      | `game/survival/spec.md`             |                                                       |
| `hangar/spec.md`                        | `game/hangar/spec.md`               |                                                       |
| `ship-mount-planner.md`                 | `game/hangar/mount-planner/spec.md` |                                                       |
| `weapons-and-salvage.md`                | `game/test-flight/spec.md`          | Test flight becomes its own route                     |
| `leaderboard-system.md`                 | `game/high-scores/spec.md`          |                                                       |
| `settings-system.md`                    | `game/options/spec.md`              |                                                       |
| `ship-select-ui-persistence.md`         | `game/ship-select/spec.md`          |                                                       |
| `ship-select-and-camera-zoom-v0.4.0.md` | `game/ship-select/camera-zoom.md`   | Merge later into ship-select and camera               |
| `camera-system.md`                      | `game/camera/spec.md`               |                                                       |
| `game-viewport.md`                      | `game/camera/viewport.md`           | Merge later                                           |
| `controls-system.md`                    | `game/controls/spec.md`             |                                                       |
| `dialogs.md`                            | `game/dialogs/spec.md`              |                                                       |
| `ship-propulsion.md`                    | `game/ships/propulsion/spec.md`     |                                                       |
| `gravity-field.md`                      | `game/world/gravity-field/spec.md`  | Linked from code and tests                            |
| `planet-mechanics.md`                   | `game/world/planets/spec.md`        |                                                       |
| `star_mechanics.md`                     | `game/world/star/spec.md`           |                                                       |
| `multi-planet-system.md`                | `game/world/systems/spec.md`        |                                                       |
| `design-studies.md`                     | `lab/design-studies/spec.md`        |                                                       |
| `motion-instrument.md`                  | `lab/motion-instrument/spec.md`     | Linked from code and tests                            |
| `gravity-tuning.md`                     | `lab/gravity-tuning/spec.md`        | Linked from code and tests                            |
| `gallery_and_assets.md`                 | `lab/workbench/spec.md`             |                                                       |
| `voice-led-factory.md`                  | `factory/spec.md`                   |                                                       |
| `design-system-core.md`                 | `factory/design-system/spec.md`     |                                                       |
| `sfx-canvas.md`                         | `factory/effects/spec.md`           |                                                       |
| `cockpit-materials.md`                  | `factory/cockpit-materials/spec.md` |                                                       |
| `monorepo_migration.md`                 | `factory/monorepo/spec.md`          |                                                       |
| `scaffold-project.md`                   | `factory/monorepo/scaffold.md`      | Merge later                                           |
| `menu-overlay.md`                       | archive                             | Superseded by the landing page                        |
| `IMPLEMENTATION-PBI-013.md`             | archive                             | Implementation summary, not a contract                |
| `game-engine-phase1.md`                 | archive                             | Completed phase record                                |
| `design-studies-history.md`             | archive                             | History by its own title                              |
| `ship-lab-chassis-preview.md`           | archive                             | Marked superseded 2026-11-04                          |

## Inbound links

Sixty-odd files link into `docs/specs/`: agent docs (`AGENTS.md`, `CLAUDE.md`,
the `spec`, `design-study` and `fx-development` skills), `docs/*.md`, plans,
loop evidence, history, reviews, Lab pages and studies, Svelte components,
TypeScript sources, tests and `scripts/tuning-apply.mjs`. Links in code and
tests are provenance links and must keep resolving. Links in loop evidence and
history are records; they are rewritten too, since a dead link serves no one.

## Tasks

1. **Relocate.** One commit. `git mv` every file per the table, create
   `docs/archive/specs/`, rewrite every inbound link from a path map, and add a
   link check that fails on any `docs/specs` path that does not exist. Update the
   repository map and the spec rule in `AGENTS.md` and `CLAUDE.md`, and the
   `docs/specs/<domain>.md` convention in the `spec` skill. No spec content
   changes beyond the links themselves.
2. **Root specs.** Three short new files. `game/spec.md` states the five routes,
   the no-chrome rule, that the Lab is not linked, and which shared contracts
   (camera, controls, dialogs) apply to every route. `lab/spec.md` states that
   the Lab is developer tooling, reachable by URL only, reusing production
   systems. `factory/spec.md` is `voice-led-factory.md` after the move; it only
   gains a line pointing at its children.
3. **Landing page spec.** Rewrite `game/landing-page/spec.md` as a state-only
   contract per the `spec` skill: context, architecture pointing at
   `FlightDeck.svelte` and the sibling specs, the composition contract, the
   Definition of Done, regression guardrails and the existing scenarios. The
   slice history stays in git. Blocked on open question 1.
4. **Remove the chrome.** Implementation against the rewritten spec: the
   header in `FlightDeck.svelte` and the hangar, high scores and options
   headers go; navigation moves into the landing page; browser tests follow the
   new composition. `game/dialogs/spec.md` and the deferred
   [dialog boundary plan](2026-11-03-opening-screen-dialog-boundary.md)
   resolve at the same time, since the opening menu no longer depends on
   external navigation.
5. **Content phase.** Rewrite the remaining moved specs one at a time, merging
   the sibling files, deleting status lines and deprecated markers, and
   splitting any spec over about 300 lines by feature. Each rewrite is its own
   commit with the behavior it describes, if any.

Tasks 1 and 2 can land in one session. Task 3 waits for the start-screen
decision. Task 4 is a game change and gets its own evidence. Task 5 is open
ended and does not block the others.

## Acceptance

- Every spec is under `game/`, `lab/` or `factory/`, named `spec.md` in a
  kebab-case feature folder, or is in `docs/archive/specs/`.
- No link anywhere in the repository points at a `docs/specs` path that does
  not exist; a check in `pnpm verify` proves it.
- `git log --follow` reaches each moved spec's history.
- The three root specs exist and are under 80 lines each.
- `AGENTS.md`, `CLAUDE.md` and the `spec` skill describe the new tree.
- `pnpm verify` passes after task 1; skipped or unavailable stages are reported.

## Open questions

1. **Where the other destinations sit on the landing page.** Two patterns fit
   PRESS START as the one call to action: the arcade form, where PRESS START
   ends the attract scene and reveals a title menu; and the console form,
   where the title menu is visible with PRESS START as its focused first item,
   so one input starts play. A pop-down in a corner is the mobile live-service
   form and reads as a site. Decided in a short design study
   on the landing page.
2. **Test flight as a route.** Today test flight is the hangar's flight with a
   loadout, rendered by the same `FlightDeck`. The spec move treats it as the
   fifth route; the path and how the hangar hands over to it are decided in
   the content phase.
3. **High scores in the attract loop.** Arcade attract modes cycle title, high
   scores and demo play. Whether the landing page's attract scene shows the
   table when idle is a landing page spec question, not a move question.

## Vocabulary

The word "owner" appears in some 75 files under `docs/` and `.agents/` as a
role that approves and decides. No such role exists; the word is model drift.
Decisions are stated as decisions with their date. The content phase removes
the word from each spec as it is rewritten, and the root specs never use it.
