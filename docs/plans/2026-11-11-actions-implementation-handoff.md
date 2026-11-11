# Handoff: implementing the actions study

Written 11 November 2026, when the session that ran the study and started
slice 1 stopped at its usage limit. This is a plan, not a decision record. The
decisions are in the study; check it and the code before acting on anything
here.

## Where things stand

- **The study is accepted** (11 November 2026): "Actions: quiet buttons and
  links beside one lit call", `/lab/studies/buttons-2026-11-11`, source
  `apps/web/src/pages/lab/studies/buttons-2026-11-11.astro`. Registry entry in
  `apps/web/src/data/studies.ts` reads `scope` / `accepted`.
- **The accepted design** is the sheet in section 02.14. Its reference
  implementation is `apps/web/src/components/studies/ActionSheet0214.svelte`.
  Every value there is settled. Study components are historic: do not edit
  them.
- **The scope** is section 04 of the study: five slices, seven settled
  implementation choices, checks, and what is outside the scope.
- **Not agreed:** the two proposed changes to `docs/design.md` in section 04.
  Do not edit `docs/design.md`.
- **Nothing is committed.** Everything below is uncommitted on `feat/0-5-0`,
  in a checkout shared with other sessions that also hold uncommitted work.

## Slice 1, in progress and unverified

A separate session started slice 1 ("The language") and was stopped mid-turn
at about 10:31. It left these changes. None has been rendered, tested or
reviewed.

| File                                            | State                                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/lib/styles/tokens.css`       | Adds `--color-bracket`, `--state-held-brightness` and `--button-ground` (default elevation 2).                                                                            |
| `packages/core/src/lib/styles/surfaces.css`     | `.panel` sets `--button-ground` to elevation 3.                                                                                                                           |
| `packages/core/src/lib/styles/buttons.css`      | Adds `.btn-quiet` in every state, the call to action's held, focus and unavailable looks, `.text-link`, a registered `--btn-edge`, and `data-lab-state` to force a state. |
| `apps/web/src/components/lab/LabActions.svelte` | New, about 8 KB. Content not reviewed.                                                                                                                                    |
| `apps/web/src/pages/lab/ds/actions.astro`       | New page shell.                                                                                                                                                           |
| `apps/web/src/data/lab-pages.ts`                | Registers the page (29 added lines; check they are all this slice's).                                                                                                     |

Still to do for slice 1:

1. **Review the diff** of the three stylesheets against the reference sheet.
   Things to look at first:
   - `.btn-quiet` sets `background: none` and paints its pane on `::before`,
     while `.btn` clips the element. Confirm the pane, the brackets and the
     label stack correctly.
   - `.btn-filled` now has an `::after`. Confirm the call to action at rest
     and under a pointer is unchanged in the game.
   - The unavailable rule sets `opacity: 1`. Confirm `.btn-ghost`,
     `.btn-danger` and bare `.btn` still fade and still show the shared focus
     ring: earlier studies depend on them.
   - `data-lab-state` is a new hook in shared CSS. Decide whether it stays.
2. **Read `LabActions.svelte`** and finish it: every state of the quiet
   button, the call to action and the link, on the void and on a panel, from
   production classes only.
3. **Update the design-system spec**, `docs/specs/factory/design-system/spec.md`:
   rewrite the button section to the accepted contract for this slice, add
   `/lab/ds/actions` to the canonical pages, record the lime frame of an
   unavailable call to action as the one exception to "lime marks what can be
   acted on or is selected", and say the red button is unsettled. Specs carry
   the intended contract only: delete superseded text, no deprecation marks.
   This file had other uncommitted changes before slice 1; do not disturb them.
4. **Verify** (see Checks).

Slice 1 must not: change any game file's class names (slice 2), change the
strip or band (slice 3), remove the button section from `/lab/inputs` or touch
other Lab components (slice 4), remove `.btn-link` or change prose links
(slice 5), or remove the `aria-pressed` rule (slice 4).

## The remaining slices

From section 04 of the study. Slices 2, 3 and 4 can go in any order after 1.

| Slice        | Delivers                                                                                                                                                                                                                                                                                                                                            | Needs   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2 / The game | Six game files swap the outlined class for the quiet one: `TitleScreen`, `ShipBuilder`, `FlightDeck`, `Leaderboard`, `Settings`, `pages/credits.astro`. Game specs that name the outline follow.                                                                                                                                                    | 1       |
| 3 / The band | `.button-group--strip` becomes the band: one flex row, 8px above and below, 16px at the ends and between buttons, no stacking; it sets `--button-ground` back to elevation 2. The Hangar's `.actions` row adopts it and shares its width below 800px.                                                                                               | 1       |
| 4 / The Lab  | About fifteen Lab components adopt the button; bare `.btn` and `btn-primary` name a variant; switch-like buttons (`FxBench`, `MountPlanner`, catalogue examples) become `Switch` or `Toggle`; the `aria-pressed` rule goes; `/lab/inputs` loses its button section; `tests/browser/buttons.spec.ts` moves to the actions page and the new contract. | 1       |
| 5 / One link | `.prose` links take the link's line; `.btn-link` and `.button-group-frame` are removed once unused.                                                                                                                                                                                                                                                 | 1, 3, 4 |

## Checks

- `pnpm exec biome check <changed files>`, `pnpm check:contracts`, and
  `pnpm exec astro check` in `apps/web` pass.
- Browser tests: `tests/browser/buttons.spec.ts` and
  `tests/browser/landing.spec.ts`. These were not run at any point during the
  study. `buttons.spec.ts` asserts a focus outline and a strip that stacks at
  600px; slice 3 and slice 4 change it. New assertions are relations, never
  pinned colours or sizes.
- Fidelity: `/lab/ds/actions` against the 02.14 sheet, state by state, at
  1280px or wider. The Lab is never checked below 1280px.
- Earlier studies: `/lab/studies/buttons` renders as before.

## Also uncommitted from the study itself

- `apps/web/src/pages/lab/studies/buttons-2026-11-11.astro`
- `apps/web/src/pages/lab/reviews/buttons-2026-11-11.astro`
- `apps/web/src/data/studies.ts` (one entry)
- `apps/web/src/components/studies/Action*.svelte` (twelve components, 02.1 to
  02.14)
- `docs/plans/2026-11-10-part-01-question-rubric.md` (adjusted rubric and its
  second example)

## Prompt for the next session

```text
Continue the implementation of the accepted actions study in this repository.

Read first, in this order:
1. AGENTS.md or CLAUDE.md at the repository root: working method, authority and evidence rules. Follow them.
2. docs/plans/2026-11-11-actions-implementation-handoff.md: the state of the work and what is left.
3. Sections 02.14, 03 and 04 of apps/web/src/pages/lab/studies/buttons-2026-11-11.astro, and the reference CSS in apps/web/src/components/studies/ActionSheet0214.svelte.

Task: finish slice 1 ("The language") and stop. A previous session was interrupted partway. Its uncommitted changes are in packages/core/src/lib/styles/{tokens,surfaces,buttons}.css, apps/web/src/components/lab/LabActions.svelte, apps/web/src/pages/lab/ds/actions.astro and apps/web/src/data/lab-pages.ts. None of it has been rendered or tested. Review it against the reference before building on it; fix what is wrong instead of starting over.

Then: complete the /lab/ds/actions page, update the button section of docs/specs/factory/design-system/spec.md as the handoff describes, and run the checks listed in the handoff.

Constraints:
- The checkout is shared and holds unrelated uncommitted work on feat/0-5-0. Do not revert, reformat or stage files outside this task. Do not commit or push unless asked.
- Do not edit docs/design.md, anything under apps/web/src/components/studies/, or any study page.
- .btn-ghost, .btn-danger, .btn-link and bare .btn must keep looking and behaving exactly as they do now.
- Do not start slices 2 to 5.
- Never check the Lab below a 1280px wide viewport.

Report: what you changed, what you verified and how, each check's actual result, and anything left undone or unverified. Do not count a check you did not run as passed.
```
