# Initials design-system component loop — 2026-11-23

Evidence record. Preceding loop: [Initials Lab prototype](2026-11-23-initials-lab-prototype.md),
written by a different session about the prototype this loop started from.

Sources. "Direct inspection" means the closing agent read the commit, files or
directory itself on 2026-11-23. Everything else is the conducting session's
account of one conversation and of its subagent workers' reports, supplied at
closure; the conversation and the workers' reports were not available to the
closing agent. No check was rerun for closure.

## Intent and scope

The conducting session reports that the user asked to "develop a top-notch
pinball type input for a person's initials" on the Lab page `/lab/ds/initials`,
starting with look and feel, with the default view in a pane as in the game-over
dialog. It reports these decisions and changes of direction by the user, in order:

1. Default example on a panel at run-complete width; an elevation section added.
2. Letters use the shared monospace token; a shared spacing token for the gap
   (about 16px as a multiple of the grid), listed on the tokens page, which had
   no spacing section.
3. Process and filler prose removed from the page.
4. The user switched the session to first-mate mode (work through subagents)
   and asked for keyboard operation: only the selected letter marked (input
   ground, yellow brackets), Up/Down change the letter, Left/Right move, 2px
   brackets as a multiple of the grid covering the corner cut, CSS where
   possible, shared tokens extended instead of local values, accessibility
   "as good as possible".
5. The conductor first briefed three separate inputs. The user objected that
   for accessibility it should still be one field; the worker was redirected
   to one native text field with a selection layer.
6. Brackets inset like the focused button and replacing the focus ring, flagged
   as an accepted loss of accessibility; slots black; empty state with a dim
   placeholder A.
7. The user found the page a wall of text with a panel example inside a
   component frame; stated that the dashed frame "exists solely to isolate
   component spacing from the surrounding page"; then that the frame's page,
   spec and code might themselves be wrong and should be fixed first ("so we
   dont work on drift on drift"). The user then narrowed scope: "do not fix
   anything relying on the comp, just the comp."
8. Stale frame text in other specs and pages fixed; consumed tokens added to
   the frame page; the frame page's example blocks state their margin and
   padding values.
9. Label below the input, as a prop, saying "Initials". Brackets "not inset
   yet", then clarified: selected and resting brackets in the same place, inset
   in every state, only the colour changing.
10. Tab moves between letters inside the component and leaves from the last;
    the user noted it "breaks a11y a bit".
11. A slot that holds a letter and is not focused takes an elevation + 1 fill.
12. "fix the accessibility bullet" (contrast figures for raised slots).
13. "Okay this is good enough. Let's write a spec for this component now … and
    then commit and push this page, the spec for the page, and the code."
14. After a worker listed the contradictions under Findings: "No need to fix
    anything."

The page lead went through two drafts; see Human feedback.

Out of scope, by direct inspection: the component is not wired into the game.
`apps/web/src/components/FlightDeck.svelte` still has a plain `maxlength="3"`
text input bound to `initials`.

## Changes delivered

Direct inspection of commit `08dc6a23e8077a485a2c8aadd334d8f3d7126e62`
(`feat(design-system): add the Initials entry and its contract`, parent
`75ba5605`, branch `feat/0-7-0`): 15 files, 831 insertions, 81 deletions.

- [Initials component](../../apps/web/src/components/inputs/Initials.svelte)
  (new, 293 lines): one native text field in one `label` over three
  `aria-hidden` slots; props `value` (bindable), `label`, `host`; a hidden hint
  and a polite live region.
- [Initials page](../../apps/web/src/pages/lab/ds/initials.mdx) (new) and
  [Initials contract](../specs/factory/design-system/initials/spec.md) (new,
  generated `2026-11-23T08:28:20+02:00`, `verified: []`, eleven scenarios). The
  contract records two accepted losses of accessibility dated 2026-11-23: no
  focus ring, and Tab moving inside a single text field.
- [Component frame](../../apps/web/src/components/lab/ComponentFrame.svelte),
  its [page](../../apps/web/src/pages/lab/ds/component-frame.mdx) and
  [contract](../specs/factory/design-system/component-frame/spec.md)
  (generated `2026-11-23T07:34:50+02:00`, `verified: []`): no padding,
  `flow-root`, a 1px dashed outline, and a `fit` input.
- [Tokens](../../packages/core/src/lib/styles/tokens.css): `--spacing-gap`,
  `--bracket-width`, `--bracket-inset` (3px), `--color-placeholder`.
  `apps/web/src/components/lab/LabTokens.svelte` gains a Spacing section and
  rows for the new tokens.
- [Registry](../../apps/web/src/data/lab-pages.ts): a `/lab/ds/initials` entry
  with `source: "production"`; the frame entry's purpose text changed.
- Text edits in `page-header.mdx`, `tray.mdx`, `DesignSystemLayout.astro` (one
  comment), the page-header contract and the Design system contract.
- The commit also contains the preceding loop's record, which was untracked
  before it. The conducting session reports that the commit staged the whole
  checkout, per the repo's commit-messages skill.

## Checks

All of the following are workers' reports relayed by the conducting session.
As reported: each ran throwaway Playwright scripts against the shared dev
server at `http://localhost:4321`, Chromium only, outside the command sandbox,
on the dirty working tree of its moment, before commit `08dc6a23`. Scripts were
deleted afterwards and no run logs were retained. Dirty-tree identities were
not recorded.

| Check | Reported outcome |
| --- | --- |
| Key behaviour: Up/Down wrap, Left/Right, typing, Backspace/Delete, paste, click, one textbox per example, no console errors | Passing in the rounds where it was changed. One worker noted its full suite ran before a page restructure and only a smoke check after. |
| Tab walking | Passing, including 96 combinations (4 instances × 4 values × 3 start slots × 2 directions) leaving within three presses. |
| Raised fill, computed grounds | elev-1/2/3 on host 0/1/2 for filled unselected slots, void otherwise. |
| Contrast from rendered pixels | Selected vs resting bracket 10.0:1; selected bracket vs black ground 18.4:1; resting bracket vs black 1.84:1, vs raised grounds 1.69, 1.51, 1.32; `--color-placeholder` vs black 3.42:1. |
| Component frame on its reference page | Frame box equal to content margin box, zero padding, fit width equal to content. |
| `pnpm check:specs docs/specs/factory/design-system/initials` | 0 findings. |
| `pnpm check:specs` over `docs/specs/factory/design-system` | 6 findings, in sibling specs not touched by this loop (actions, artwork, choices, game-field-backdrop, identity, inputs), each about verified events requiring a human actor. |
| `node scripts/check-contracts.mjs` | Passing. |
| `pnpm test:factory` | 21 pass, 0 fail. |
| `pnpm check:types` | Exit 0. |
| `pnpm exec biome check --error-on-warnings` on changed files | Clean; 11 of 15 listed paths checked. |
| lefthook pre-commit (biome) and commit-msg (conventional) on the commit | Passed, observed by the conductor in the commit output. |
| The contract's eleven scenarios | Traced against the code by hand by the spec worker; not run in a browser. |

Reported as not tested: real screen readers, the iPad touch keyboard, real
browser autofill, IME, Safari and Firefox, and entry direction when focus
arrives from browser chrome.

## Publication

- Local commit: `08dc6a23` is `HEAD` of `feat/0-7-0` (direct inspection).
- Push: the conducting session reports pushing `75ba5605..08dc6a23` to
  `origin/feat/0-7-0`. Direct inspection found the local remote-tracking ref at
  `08dc6a23` and `git status -sb` showing no ahead or behind count; no fetch
  was performed at closure.
- Deployment: none reported. Live verification: none reported.
- Working tree at closure (direct inspection): modified
  `docs/specs/game/dialogs/spec.md`, `docs/specs/game/game-over/spec.md`,
  `docs/specs/game/scores/spec.md` and untracked
  `docs/specs/game/game-over/ranked-result/`. These are not attributed to this
  loop.

## Human feedback

Quotes are as relayed by the conducting session.

- On the look after the bracket change: "Okay the look and feel is now close.
  I really like how they look especially."
- On the conductor's first draft of the page lead: "content-wise, that's very
  good", with a request to tone it down and drop "three". The second draft was
  accepted with "use tag in both, put it on the page".
- Overall, before the spec was written: "Okay this is good enough."
- On other pages after the frame change: "I'm completely aware that our
  changes to the frame broke it in multiple other pages, which is completely
  fine. Those pages were broken … It's a known regression now."

Limits: none of these is a production acceptance. The conducting session
reports that the user did not review the contract text in the conversation.

## Findings

Reported by workers and left unchanged at the user's word ("No need to fix
anything"). "Confirmed in source" marks what the closing agent also read in
the committed files; it is not a browser observation.

- The page says "Used in the run-complete dialog" while the game uses a plain
  text field. Confirmed in source.
- The page's accessibility bullet says the only focus cue is the bracket
  colour; for a filled slot the ground also changes from raised to black, and
  the contract states both. Confirmed in source.
- The component allows zero to three letters and starts empty;
  `packages/mode-a/src/schemas/highscore.ts` requires exactly three
  (`/^[A-Z]{3}$/`). Confirmed in source.
- A host-supplied `value` such as "vt1" displays normalised, but the bound
  value is not written back until the first edit. The source derives the
  displayed letters and assigns `value` only on an edit; the behaviour was not
  observed at closure.
- The field has a hidden description, "Up and Down change the letter.", that
  the page does not document. Confirmed in source.
- The Design system contract says shared input components live in
  `apps/web/src/components/inputs/`; this component is
  `components/lab/InitialsExample.svelte`. Confirmed in source. A worker
  reported setting the registry `source` to "production" as the closest schema
  value.
- Component frame consumers after the frame change, reported and not edited:
  page header examples sit flush on the dashed line; the tray page's frame is
  full width around a 256px tray; the instrument parts page uses the frame
  around demo hosts. The user recorded these as a known regression, and the
  commit message names them.
- A default frame measured about 2.4px wider than the content column on three
  pages at 1440px. The worker stated it did not confirm the cause.
- Resting bracket contrast is below 3:1 on every ground (figures under Checks).
- Programmatic focus on a prefilled field selects the last letter. Reported;
  not observed at closure.
- The focused button in `packages/core/src/lib/styles/buttons.css` uses a
  literal 3px inset (`--_edge-inset: 3px`); `--bracket-inset` is not used
  there. Confirmed in source.

## Evidence gaps

- No run logs, scripts or command output were retained for any check. Outcomes
  rest on workers' reports relayed by the conducting session.
- Every browser check ran on a dirty tree before the commit, with no recorded
  tree identity. None is tied to `08dc6a23`, and nothing was run on the
  committed revision other than the commit hooks.
- Chromium only. The untested conditions listed under Checks remain unknown.
- The contract's scenarios were traced by hand, not executed. Both contracts
  carry `verified: []`.
- The user did not review the contract text in the conversation, as reported.
- Biome covered 11 of the 15 listed paths; which four were not checked was not
  supplied.
- Screenshots exist only in a session scratchpad,
  `/private/tmp/claude-503/-Users-ville-takanen-dev-void-drift/b8a961a8-19aa-4f58-96a9-1acda6112fb7/scratchpad/`.
  Direct listing at closure found 49 PNG files (`initials*.png` including
  rounds `r2` to `r6`, seven `frame-*.png`, `spacing.png`). They are not in the
  repo, were not opened at closure, and a reboot or cleanup can clear them.
- The push is supported by the conductor's report and the local tracking ref
  only; the remote was not queried.
- The conversation itself and the workers' original reports were not available
  at closure; quotes and the order of decisions come from the conducting
  session's summary.
