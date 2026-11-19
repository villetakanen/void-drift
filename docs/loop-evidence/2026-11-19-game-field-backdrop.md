# Game field backdrop · implementation closure

## Intent and accepted decisions

Implement the repaired Design System backdrop for the Title Screen, Settings,
Top Scores and Credits. The user described it as “a player facing decorative
element” composed from the shared scrim and lightly customized game field. Its
system is separate from active games and cannot change their state. It follows
the Survival generator rules, with one title-targeted override: the outermost
planet's orbit radius. That radius is hardcoded for 1920×1080 and reused by all
four screens. The user clarified that each appearance should generate a
different system: “every time, a different system. that was the idea with the
suns too.” This means a shared component and composition, not identical planet
instances across screens.

## Changes delivered

- Added [GameFieldBackdrop.svelte](../../apps/web/src/components/GameFieldBackdrop.svelte),
  which creates an independent Survival `Simulation` from a fresh seed, uses
  the production planet appearances and selected render passes, draws the
  shared scrim, freezes under reduced motion, and sets the outermost planet's
  orbit radius to 885 world units.
- Replaced the active title-only `LandingSystem` drawing path in
  [FlightDeck.svelte](../../apps/web/src/components/FlightDeck.svelte) with the
  shared component. A return to the title menu reseeds the component's
  decorative system.
- Added the shared component to Top Scores and Credits, and registered the
  `/lab/ds/game-field-backdrop` page in the Design System Lab.
- Added the [backdrop living spec](../specs/factory/design-system/game-field-backdrop/spec.md)
  and updated its title-specific radius to 885 units. The spec remains `draft`.

## Working-tree identity and publication

The checkout was on branch `feat/0-7-0`, at `f8b9cba793ede22254ef1a1e3523f8ab089bef88`
(`origin/feat/0-7-0` was one commit behind). The implementation was uncommitted
in a broadly dirty shared working tree containing unrelated changes. No
isolated patch hash is available. No commit, push, deployment or production
verification was made for this loop.

## Checks and observations

| Evidence | Outcome | Source and limits |
| --- | --- | --- |
| `pnpm --filter web check` | Passed: 281 files, 0 errors, warnings or hints | Command output in the implementation conversation; no retained report. Run against the dirty checkout at the revision above. |
| `node scripts/spec-lint/check.mjs docs/specs/factory/design-system/game-field-backdrop` | Passed: 0 findings | Command output in the implementation conversation; no retained report. |
| `git diff --check` | Passed | Command output in the implementation conversation; no retained report. |
| Browser preview | The implementation session reported visual inspection of the Title Screen, Settings, Top Scores, Credits and Lab demo; its final Lab browser-log query returned no warnings or errors. | Screenshots and browser logs were not retained as files. The browser viewport was 2560×1352, not the specified 1920×1080 composition. |
| Reduced motion | Not directly exercised in the browser. | The implementation has a `prefers-reduced-motion` branch; this is source evidence, not a browser observation. |
| `pnpm dev:status` | Failed to inspect the process: local permission error, `Operation not permitted: 'ps'`. | `pnpm dev:ensure` returned the shared preview log path, and browser requests to the local preview returned successfully. |

No tests were run for this loop. The 885-unit value was selected during
implementation; the user authorized a hardcoded title-targeted radius but did
not separately confirm this exact number. Its fit at 1920×1080 remains
unverified. The user did not provide post-implementation acceptance feedback
in this loop.

## Evidence gaps

- No saved screenshot captures, retained check logs or isolated source snapshot
  identify this loop's exact dirty-tree contents.
- The title-corner fit has not been directly checked at 1920×1080.
- Reduced-motion behavior and active-game state isolation were not separately
  exercised in a recorded browser interaction; isolation is supported by the
  separate simulation in source.
- This closure records implementation and checks; it does not certify product
  acceptance, release readiness or deployment.
