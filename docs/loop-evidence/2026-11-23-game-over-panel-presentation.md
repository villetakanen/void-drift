# Game over panel presentation

## Intent and decisions

On 23 November 2026 the designer, in first-mate mode and asking for fast worker
agents, discussed the game-over ("Run complete") panel case by case from a
screenshot of a ranked Survival result, then said "lets take these". The work
started from revision `a48a03ed` on `feat/0-7-0`. The account of the workers
below is the conducting session's unless marked as inspected.

Designer decisions, in the order given:

- The large element is the score, shown the way a pinball or arcade machine
  shows a score; the seconds are part of it and sit under or over as a caption.
- "Every orbit teaches you something" is "slop" and "needs to go".
- "The lose condition should read like an alert tag, not as a dim secondary
  text."
- The save slot has a placeholder that looks the same while loading.
- Typing the third initial moves focus to Save so Enter saves.
- "initials are fine".
- Hangar must not capture focus while the save-score check loads.
- The Gauntlet win tag changes from `PIRATE DESTROYED` to `GAUNTLET CLEARED`,
  because a Gauntlet "will not only be pirates in the future" and the singular
  is "silly when there are multiple pirates".
- Unranked runs say just "unranked" in the slot, the same for all unranked
  modes; Derelicts and Gauntlet "are not official competition modes".

Decisions made by the conducting session or a worker and reported to the
designer, not confirmed by the designer in the conversation:

- Gauntlet keeps Victory, Defeat or Draw as the large value; Derelicts and
  Playground-On Survival show the time under a `Time survived` label.
- Mutual destruction takes the alert tone.
- During the check focus rests on the dialog panel; afterwards it goes to the
  first empty initial, to Save Score when remembered initials fill the field, or
  to the default control, and only if the player has not moved it.
- On this panel `Unranked` replaces the Preview marker, the scoring-off
  sentence and "This setup cannot be submitted for a score."
- At viewport heights of 500px or less the tag, the large value and `Unranked`
  stay visible; the caption and other statistics hide.

## Changes delivered (dirty tree on `a48a03ed`, 15 files)

Two Sonnet workers ran in parallel, one resumed for a follow-up.

- `GameOver.svelte`: outcome is a tag with a tone, an optional label, a large
  value and an optional caption (inspected).
- `FlightDeck.svelte`: supplies that outcome per mode, the `GAUNTLET CLEARED`
  text and the `Unranked` line; the tagline, the Gauntlet cause line and the
  `Score N` line are removed.
- `RankedResult.svelte`, `Initials.svelte`, `Dialog.svelte`: disabled
  placeholder while checking, a `disabled` prop and `focus()` on Initials, a
  `data-hold-focus` marker read by Dialog, focus to Save Score on the third
  letter (diff inspected).
- `flight.css`: the short-viewport rule exempts the tag and `Unranked`.
- Specs: game-over, ranked-result, Initials, dialogs, experimental and the game
  spec. Lab page `lab/ds/initials.mdx`.
- Tests: `tests/firebase/competition.spec.ts` asserts focus in the field on a
  new best and on Save Score after the third letter;
  `tests/browser/derelicts-score.spec.ts` heading pattern updated.

## Checks

All on the dirty tree, local Mac checkout. Worker-reported unless marked.

- `pnpm check:types`: passed; run to completion by the conducting session
  after the first presentation pass, and reported as exit 0 by the worker after
  the follow-up.
- `pnpm lint`, `pnpm test` (446 of 446), `pnpm check:repo`: passed.
- Browser tests `dialogs`, `derelicts-score`, `launch-navigation`,
  `gauntlet-pair`, `game-screen`: 8 of 8 passed, run outside the sandbox.
- `pnpm test:competition` (Java 21 emulators): 2 passed, run after the
  save-slot work and before the presentation follow-up; not re-run after it.
- `pnpm check:specs`: 0 findings on game-over, ranked-result and Initials; 12
  missing-heading findings on dialogs; one provenance finding on experimental.
  The worker reported that the `docs/specs/game` tree already failed before the
  edits, from a stash comparison.

Before the commit the conducting session ran `pnpm verify:changed` on the final
tree, outside the sandbox (evidence in
`artifacts/verification/2026-11-23T10-16-03.455Z-LcICoT/`). It selected
check:repo, lint, check:types, test, build, test:browser, test:rules and
test:competition. The first six passed. test:rules and test:competition did not
run: the emulator lifecycle found no Java on the path. The designer asked why
the Firestore tests would run here and then said to commit and push; the two
emulator suites were not re-run on the final tree. An earlier run of the same
command inside the sandbox failed at test:browser on a refused local port
(`2026-11-23T10-12-28.521Z-iBvvls`).

## Rendered inspection

Playwright screenshots at 1180x820 from a server without Firebase, in the
git-ignored `tools.local/game-over-shots/` (not retained in the repository).
Inspected by the conducting session: ranked Survival in the scores-unavailable
state, the same with `1,234,567` written into the page, a Gauntlet loss and
Derelicts. Reported by the worker and not opened: Playground-On Survival (from
an earlier capture run than the others) and a 1180x440 ranked shot.

## Evidence gaps

- The save slot's entry and checking states were not seen rendered: the
  placeholder, the third-letter focus move on screen, and the focus hold.
- No test covers focus resting on the dialog during a pending check, or
  player-placed focus surviving the resolve; the worker reported the emulator
  answers too fast to observe the pending state.
- No screenshot or browser test reaches a Gauntlet win, so `GAUNTLET CLEARED`
  was not seen rendered.
- The seven-digit score was a text edit in the page, not a run.
- Nothing was checked on touch hardware.

## Open, raised and not decided

- In the ranked panel Retry is a plain button and the launch-source button
  carries the focus outline, while unranked panels fill Retry.
- Whether the caption becomes a tally of what the score is made of.
- A count-up of the score on open.
