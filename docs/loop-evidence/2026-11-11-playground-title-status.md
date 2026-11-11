# Playground title status — loop evidence

Closed 11 November 2026. This record collects the discussion, implementation,
and focused browser-check evidence in this conversation. At closure, `HEAD` is
`730bc9a`; the work described here is uncommitted in a dirty shared checkout.

## Intent and scope

Make Playground state and its scoring consequence clear on the title screen,
without putting status copy in the PRESS START control group. When an ineligible
setup blocks launch with Playground Off, keep title hints visible and rotating.
Align living specs with the decisions. The user also directed that living specs
contain no checkbox status markers; those markers were removed across
`docs/specs/`, with acceptance criteria retained as plain statements.

## Designer decisions

- With Playground On, the red status slot below the menu panel reads
  `PLAYGROUND ACTIVE` / `UNRANKED PLAY` on two lines.
- With Playground Off and an ineligible active setup, that slot reads
  `UNSANCTIONED BUILD` / `PLAYGROUND REQUIRED` on two lines.
- The status sits above the decorative ship, separate from the menu controls.
- The blocked warning does not replace or stop the title hints; their normal
  rotation behavior continues.
- Specs define intent without checkbox completion status. Plans were not edited
  in this loop.

## Changes delivered

- `apps/web/src/components/TitleScreen.svelte` renders both status states in the
  red slot below the panel, above the decorative art. The blocked reason no
  longer takes over the hints area; hint rendering is independent.
- `docs/specs/game/experimental/spec.md` records the two states, exact copy,
  placement and hint behavior. `docs/specs/game/landing-page/spec.md` records
  status-slot composition and that warning visibility does not interrupt normal
  hint behavior.
- `tests/browser/active-ship.spec.ts` checks both copy states and verifies a
  hint changes after the eight-second interval while the blocked warning stays
  visible.
- Checkbox markers were removed from acceptance criteria throughout
  `docs/specs/`. `AGENTS.md` and `.agents/skills/spec/SKILL.md` now state that
  criteria are plain intent and implementation status belongs in delivery
  evidence.

## Checks

Environment: Playwright Chromium with the repository's local Playwright-managed
web server. Runs were on the dirty working tree based on `730bc9a`; an exact
source hash for the test-time tree was not recorded.

| Command                                                                                                      | Outcome                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec playwright test tests/browser/active-ship.spec.ts --grep "Experimental and blocked title states"` | First run failed because Playwright's `toHaveText` normalized the `<br>` line break. The assertion was changed to check normalized text plus the `<br>` element. Second run passed: 1 test, including hint rotation while the blocked warning remained visible. |
| `git diff --check`                                                                                           | Passed after the final documentation changes; no whitespace errors were reported.                                                                                                                                                                               |

The successful browser result is preserved in the conversation output; no
immutable Playwright report for that successful run was retained in the repo.
The failed run produced a screenshot and trace under `test-results/`; those
showed the earlier assertion failure and are not evidence of the passing run.

## Visual and human evidence

- A local browser screenshot showed the Playground-On two-line red status below
  the panel with the title hints visible. No final blocked-state screenshot was
  retained. The focused browser check verified blocked copy and hint rotation,
  not pixel-level stacking or visual quality of that blocked state.
- The designer said, “good work here,” after the implementation. This records
  feedback on this iteration only; it is not a broader acceptance or release
  assessment.

## Publication

- Local commit: none for this work.
- Push: none.
- Deployment and deployed verification: none.

## Evidence gaps and out-of-scope workspace changes

- The full browser suite and other verification gates were not run.
- The working tree also contains edits to
  `.agents/skills/unit-test-konmari/SKILL.md` and
  `packages/mode-a/src/lib/point-defence.test.ts`; these were not part of this
  loop and are not attributed here.
