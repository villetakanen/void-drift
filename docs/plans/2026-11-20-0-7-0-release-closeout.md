# 0.7.0 · Fires in the Sky · release closeout

Written 20 November 2026. This plan lists the work still open before 0.7.0 can be released, taken from the [release-readiness review](../reports/2026-11-20-0-7-0-release-readiness.md) of `feat/0-7-0` at `26295ddb`. The report holds the evidence; each item below was re-read at the cited location in the working tree the same day.

Closed since the report: the `habitable-skies` board name is out of the Firestore rules and the rules test, and AGENTS.md and the README record the ranked challenge names.

## Required for the release

In working order.

| # | Now | Files | Done when |
| --- | --- | --- | --- |
| 1 | Resolved narrowly: the catalog owns sanctioning; the Parts spec's duplicated rifle status and other copied catalog values are removed. The amendment remains an unapproved draft, not a full spec review. | [parts spec](../specs/game/parts/spec.md), [catalog](../../packages/mode-a/src/lib/schemas/loadout.ts) | Duplicate catalog values removed and ownership clarified; no catalog or gameplay change. |
| 2 | Resolved narrowly: the old Hangar wording said “the first unranked pirate encounter”, not one pirate. Hangar now owns launching Gauntlet with the active ship and delegates mode behaviour to the Gauntlet spec. The amendment remains an unapproved draft, not a full spec review. | [Hangar spec](../specs/game/hangar/spec.md), [Gauntlet spec](../specs/game/gauntlet/spec.md) | Encounter-content claims removed from Hangar; action order and Survival as primary preserved; no Gauntlet or gameplay change. |
| 3 | Resolved: the lead announces 0.7.0. The user confirmed RC1 was erroneous announcement text, not a released RC; the game is pre-alpha. | [landing-hints.ts](../../apps/web/src/data/landing-hints.ts) | The lead announces 0.7.0; package versions, historical notes and other news/hints are unchanged. |
| 4 | Resolved to the owner's choice: add the exact Samurai of Sirius lore, plasma and Service drive news, and camera/Combat HUD Settings hint. Keep the lead first and preserve all other entries, including the second leaderboard news; remove only explicit 0.6.0 references (none remained in the inspected file). The owner-approved wording supersedes the earlier 49–71-character target; other suggested topics are not part of this change. | [landing-hints.ts](../../apps/web/src/data/landing-hints.ts) | Exact copy and kinds verified. `pnpm exec biome check apps/web/src/data/landing-hints.ts --error-on-warnings`, `pnpm check:contracts` (18 factory tests) and `pnpm --filter web check` passed. Playwright inspected the shared preview at 1280×720, 1024×768 and 1366×1024: the long lore wraps to three lines in the 32rem area, four at 1024px (464px available), without observed clipping or menu overlap. Captures: `artifacts/landing-hints-{width}x{height}.png`. No layout changes. |
| 5 | All four `package.json` files read `0.7.0-rc.1`; the title screen and Top Scores print it, and the release script does not check it. | root, `apps/web`, `packages/core`, `packages/mode-a` | All four read `0.7.0`. |
| 6 | Only the rc.1 note exists. It says plasma is future scope and has no ranked-compatibility section. | `docs/releases/0.7.0.md` (new) | The note covers ranked plasma engine and rifle, outcome scoring, the ranked pirate and derelicts, the seven-Scout Gauntlet, Habitable worlds and The Cradle, the Combat HUD option, Settings from the Hangar with blocked-launch guidance, and zero scores reaching the board. A ranked-compatibility section records the move from `ion-storm` to `fires-in-the-sky` and its reason. |

Then the release steps, per [development.md](../development.md#release):

1. Commit the above and any polish taken, so the tree is clean.
2. Run full `pnpm verify` on that commit, including the Java 21 backend checks.
3. `pnpm release:prepare`, then `pnpm release:check` on the prepared run.
4. After publication is authorised, `pnpm release:publish` on the same run.
5. Verify game, Lab, authentication and score reads on the live site, without submitting a score.
6. Tag the release commit.

## Polish in this release

Copy and small code changes. Any taken go in before step 1 above.

**Result and pause** ([FlightDeck.svelte](../../apps/web/src/components/FlightDeck.svelte))
- A Gauntlet win reads "PIRATE DESTROYED" for seven Scouts, and the line below prints the raw cause value. Done when the heading fits the horde and the cause is worded for a player.
- Pause links to Top Scores and Settings only in Survival. Done when Settings is reachable from pause in every mode.

**Hangar** ([ShipBuilder.svelte](../../apps/web/src/components/ShipBuilder.svelte), [loadout.ts](../../packages/mode-a/src/lib/schemas/loadout.ts))
- "Weapons are static fittings in this alpha" is untrue for Ion Point Defence, and "fires on A+D" omits W and touch. Done when both lines match the controls.
- The Plasma engine has no world text, only its cruise figure. Done when it has a line like the other sanctioned parts.
- Part names mix capitalisation ("Light Ion Cannon", "Plasma rifle"). Done when one convention holds.

**Top Scores and Settings** ([Leaderboard.svelte](../../apps/web/src/components/Leaderboard.svelte), [settings.astro](../../apps/web/src/pages/settings.astro), [leaderboard.astro](../../apps/web/src/pages/leaderboard.astro))
- The score note says "Lab trials are unranked"; players know the mode as Playground.
- Menus say Settings while the heading and tab say Options; the Top Scores tab says Leaderboard. Done when each screen has one name.

**Ranked rules in code** ([simulation.ts](../../packages/mode-a/src/lib/simulation.ts))
- The 50, 10 and 2 awards are inline numbers beside a named cell constant. Done when they are named with the other tuning.
- Ranked eligibility is computed in the simulation and again in the deck. Done when one reads the other.

## Needs a decision

- **Should the published Lab be indexable?** It ships with the game: 115 of 121 pages. There is no `robots.txt` and no `noindex`. The build is 237 MB, of which 188 MB is study images and 28 MB is planet concept art under `public/planets/concepts-2026-11-19`. Whether the concept art belongs in the published build is part of the same question.
- **Does view culling for enemy ships and wrecks go into 0.7.0 or after?** Opponent ships, wrecks, shards and cells are drawn without a view check ([flight-frame.ts](../../packages/mode-a/src/lib/flight-frame.ts), [salvage-renderer.ts](../../packages/mode-a/src/lib/salvage-renderer.ts)), which the render model forbids and which costs most with seven Scouts. The change is small but alters the frame, so it would need a browser check before the release commit.

## Not checked by the review

- Full `pnpm verify` on this commit. The newest full report is from 18 November, 52 commits earlier, on a dirty tree.
- Any browser pass on the built game: layout, touch and the new result screens.
- Frame time and memory. The performance findings are read from code.
- The rules live in production.
- Release smoke does not reach Gauntlet's result or the Combat HUD switch.

## After the release

See the report's [debt section](../reports/2026-11-20-0-7-0-release-readiness.md#debt-to-take-after-the-release): the size of `Simulation.step` and `salvage.ts`, per-step allocation in the flight loop, the title backdrop kept alive during flight, dead code in `game-loop.ts`, test attributes written in production, document drift, tracked files that look local, and the missing script enforcement of the release gates.
