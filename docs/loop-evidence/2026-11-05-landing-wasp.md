# Landing-page incoming Wasp — closed

Closed 2026-11-05 at the owner's request. Scope: a decorative incoming Wasp on
the menu panel, its plume and trail, and the shorter Hangar label. This record
collects evidence without deriving lessons or changing standing rules.

## Decisions and delivery

Source: this chat's requests, corrections, tool results and owner feedback.
The initial request specified a 120px Wasp at the panel's lower-right corner,
heading upward and predominantly right, a single equipped ion with a plume,
and a ship-wide entry-coloured trail at 22% opacity; overflow was permitted.
The owner then requested “HANGAR” alone for the link label.

After the first visual, the owner said “very good” but asked that the trail start
at the wing tips and become twice as long. The next correction reported that
the ship was too small and had moved below the corner, and requested 30% growth.
The final version uses a 156px hull length, a 30° upward-right heading, a 450px
trail fading from 22% opacity at the wing tips, and the shared ion plume and
fitted-Wasp renderer. Explicit positioning anchors the drawing centre to the
panel corner; the canvas overrides the global maximum-width constraint.
The artwork is static, hidden from assistive technology, and ignores pointer input.

Delivered commit: `612fc5f19bada3a17ec3e3689ea1a8ff9b259a91`
(`feat(landing): add incoming Wasp to the menu corner`). Directly inspected at closure:

- [TitleScreen.svelte](../../apps/web/src/components/TitleScreen.svelte)
- [Landing-page contract](../specs/game/landing-page/spec.md)

These links point to working files; the commit identifies the delivered snapshot.
The owner responded “good, commit, push” after the final size/position correction.
This is visual approval of this decoration, not acceptance of unrelated gameplay.

## Verification evidence

All implementation checks below ran in this chat on macOS with local Chromium
and a dirty working tree based on `782f238`, before the delivery commit. Other
pre-existing changes were present; no isolated clean-commit verification was run.

| Check                                                                               | Result and revision limit                                                                                                                                                                                     | Evidence source                                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` | Passed: zero errors/warnings on the initial 120px version, before trail and size revisions.                                                                                                                   | Tool output in this chat.                                                                                  |
| `pnpm exec playwright test tests/browser/landing.spec.ts`                           | Five passed, one failed on the initial version. The background canvas remained equal after advancing the test clock; failure was at line 19, before the flight-handoff assertions. Cause was not established. | Tool output in this chat; original failure artifacts are no longer available in `test-results` at closure. |
| Filtered rerun with `--grep 'landing animation'`                                    | Unavailable: preview server could not bind port 4322 (`EPERM`); no test result.                                                                                                                               | `/tmp/wasp-test.log`, inspected at closure.                                                                |
| Final local browser inspection of `/lab/landing`                                    | Visually inspected at 1280×800, device scale 2. Canvas measured 600×400 CSS pixels; drawing-centre offset from the panel's bottom-right was `[0, 0]`.                                                         | Screenshot `/tmp/landing-wasp-larger.png` and browser output in this chat.                                 |
| `pnpm exec biome check apps/web/src/components/TitleScreen.svelte`                  | Passed after final size/position change.                                                                                                                                                                      | Tool output in this chat.                                                                                  |
| Commit hooks                                                                        | Biome and Conventional Commit checks passed for the delivered commit.                                                                                                                                         | Commit output in this chat.                                                                                |

Local browser launch and a separate preview-server attempt initially encountered
permission restrictions; authorized retries enabled the final visual inspection.
No full build, full verification suite, backend checks or deployment checks were
run for this bounded styling change. Closure did not rerun product checks.

## Publication and evidence limits

- Local commit: directly confirmed as `612fc5f` at closure.
- Push: this chat recorded successful `git push origin feat/0-5-0`, advancing
  the remote from `782f238` to `612fc5f`. A fresh remote query during closure
  failed to resolve GitHub; current remote state was not independently rechecked.
- Deployment and live verification: unavailable; neither was established here.
- Temporary screenshots/logs are not tracked and may disappear. The essential
  outcomes are recorded above; no immutable browser-run report was retained.
- At closure, further staged edits existed in TitleScreen, landing/game specs and
  loadout code, alongside the earlier unrelated working changes. Their provenance
  was not established in this loop; they are excluded and were left untouched.
- The failed animation assertion remains unresolved evidence. The later owner
  approval and passing visual positioning check do not establish that it passes.
