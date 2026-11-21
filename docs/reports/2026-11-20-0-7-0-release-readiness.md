# 0.7.0 release readiness

Assessed 20 November 2026 at `26295ddb` on `feat/0-7-0`, clean tree, 94 commits ahead of `main`.

## Verdict

The game is ready. The release wrapper around it is still at rc.1: the version strings, the title-screen news lead and the release note all describe the candidate, and the note says plasma is not in the release. Those, a stray board name in the Firestore rules, and a full `pnpm verify` on this commit are what stands between the branch and a 0.7.0 cut. Each is small.

No defect was found in the play code. The refactoring worth doing is real but none of it needs to precede the release.

## What was checked

| Check | Result |
| --- | --- |
| `pnpm verify:quick` (contracts, lint, types, unit tests) | Passed. 82 files, 435 tests. |
| `pnpm build` | Passed. 121 pages. |
| `pnpm check:commits` | Passed. |
| Full `pnpm verify` (browser, rules, competition) | Not run. The newest full report is from 18 November, 52 commits back, on a dirty tree. |
| Browser pass on the built game | Not done. Layout, touch and frame rate were not observed. |

The rest is a read of the source by three reviewers: the player-facing surface, the production code, and the release and backend mechanics. Claims that carry a release decision were re-read in source afterwards. Performance findings are reasoned from the code and were not measured.

## Before the release

1. **Run full verification on the release commit.** [development.md](../development.md) makes it the precondition for `release:prepare`, and the script does not enforce it.

2. **Move the version off rc.1.** All four `package.json` files read `0.7.0-rc.1`. The title screen and Top Scores print that string. `scripts/release.mjs` does not check the version, so it would publish "rc.1" without complaint.

3. **Replace the news lead.** The first title-screen entry reads "0.7.0 RC1 — FIRES IN THE SKY introduces a new ranked challenge." ([landing-hints.ts:12](../../apps/web/src/data/landing-hints.ts)). This is the same file the new world entries go into.

4. **Write `docs/releases/0.7.0.md`.** The rc.1 note covers the G star and the Mercurial planet only, and states "Plasma engines and plasma weapons remain future scope for the final 0.7 release" while both parts are sanctioned for ranked play. It has no ranked-compatibility section, which earlier notes carry and development.md requires. Missing from it:
   - plasma engine and plasma rifle in ranked Survival
   - outcome scoring: a point per whole second, 20 per cell, 10 per derelict, 2 per shard, 50 per pirate
   - the ranked pirate and ranked derelicts
   - the seven-Scout Gauntlet
   - Habitable worlds, and The Cradle in Practice
   - the Combat HUD option
   - Settings from the Hangar, and the guidance on a blocked launch
   - a zero score now reaches the board

5. **Remove `habitable-skies` from the Firestore rules.** [firestore.rules:14](../../firestore.rules) accepts three challenge names. `habitable-skies` was a development name and no released client has carried it, since rc.1 was never published. The rules test at [firestore.test.mjs:54](../../packages/mode-a/tests/firestore.test.mjs) asserts it stays writable and needs the same edit. Left in, the release opens a writable board that nothing reads.

6. **Bring two specs into line with what ships.** The parts spec still calls the Plasma rifle unsanctioned ([parts/spec.md:74](../specs/game/parts/spec.md)), and the Hangar spec still describes Gauntlet as one pirate ([hangar/spec.md:129](../specs/game/hangar/spec.md)).

## Polish worth doing while the branch is open

All of these are copy or one-line changes on player screens.

- **Gauntlet victory reads "PIRATE DESTROYED"** in the singular, and the line under it prints a raw value: "Unranked Gauntlet encounter · combat" ([FlightDeck.svelte:878, 894](../../apps/web/src/components/FlightDeck.svelte)).
- **The Plasma engine card has no description.** It is named "Plasma" and shows only "+9 u/s to ship cruise ceiling." Every other sanctioned part has a line of world text ([loadout.ts:382](../../packages/mode-a/src/lib/schemas/loadout.ts)).
- **Top Scores says "Lab trials are unranked."** Players know that mode as Playground ([Leaderboard.svelte:105](../../apps/web/src/components/Leaderboard.svelte)).
- **One screen has three names.** The title menu says Settings, the page heading and browser tab say Options. Top Scores has the same split with "Leaderboard" in the tab.
- **Hangar weapon copy is stale.** "Weapons are static fittings in this alpha" although Ion Point Defence turns; "fires on A+D" leaves out W and touch ([ShipBuilder.svelte:318-321](../../apps/web/src/components/ShipBuilder.svelte)).
- **Pause offers Settings only in Survival.** A Gauntlet or Derelicts pilot has to abort the flight to switch the Combat HUD ([FlightDeck.svelte:842](../../apps/web/src/components/FlightDeck.svelte)).
- **Part names mix capitalisation**: "Light Ion Cannon" and "Ion Point Defence" beside "Plasma rifle" and "Gravity coil".
- **Score awards are bare numbers.** 50, 10 and 2 sit inline in [simulation.ts:233-235](../../packages/mode-a/src/lib/simulation.ts) next to a named cell constant, and the 10 repeats for Derelicts. They are ranked rules and belong with the other tuning.
- **Ranked eligibility is decided twice**, once in the simulation (pirates and schedules) and once in the deck (score submission). They agree today. One should read the other.

## The newscaster today

Six entries in [landing-hints.ts](../../apps/web/src/data/landing-hints.ts), shown in authored order, eight seconds each. Two news, two hints, two lore. Each is one sentence of 49 to 71 characters. Nothing enforces a length and the area is 32rem wide, so a longer line needs a look in the browser.

The two lore lines cover the Oberon Monolith and the Battle of Terra, and Luna Heavy Industries' Wasp. Nothing in the rotation yet mentions:

- pirates, or who they are
- derelicts and what the cells in them are
- plasma, as an engine or a weapon
- the yellow suns, the Mercurial and Habitable worlds, The Cradle
- the Gauntlet

Two hints would also earn a place: how ranked points are awarded, and that the Combat HUD and Speed camera can be switched in Settings.

The second news line, "Fires in the Sky has its own leaderboard", repeats the lead. With more lore in the list it can go.

## Release mechanics

- **Hosting is Firebase, and `netlify.toml` is unused.** `release:publish` runs one `firebase deploy` for rules and hosting together.
- **Deploy order is safe either way.** The plan asks for rules before the client. The new rules accept everything the 0.6.3 rules accept, so published `ion-storm` clients keep working, and a new client against old rules gets a rejection it retries.
- **The script enforces none of the written gates**: clean tree, release from `main`, a passing verify report, a final version. There is no CI. The gates hold only because the person releasing follows development.md.
- **The Lab ships with the game.** 115 of the 121 built pages are Lab pages and the build is 237 MB, of which 188 MB is study images and 28 MB is planet concept art under `public/planets/concepts-2026-11-19`. Nothing on the player pages links to it. There is no `robots.txt` and no `noindex`. Publishing the Lab is the documented intent; whether it should be indexable, and whether concept art belongs beside the shipped planet textures, has not been decided anywhere.
- **The game's JavaScript is about 270 KB gzipped**, most of it one shared chunk that holds Firebase and the engine. Fine for now.
- **Release smoke does not touch 0.7.0.** It covers title start, thrust, pause and one Lab page. Browser tests take Gauntlet to launch and pause but not to its result, and nothing drives the Combat HUD switch. Ranked submission is covered end to end against the emulator.
- **Rules leave `fitting` elements unchecked** beyond list length, and scores have no ceiling. Both are known and documented. Acceptable for an alpha board.

## Debt to take after the release

None of this is visible to a player today. It is where the next feature will be slower or riskier than it should be.

- **`Simulation.step` is one method of about 700 lines** ([simulation.ts:486](../../packages/mode-a/src/lib/simulation.ts)). It holds player flight, pirate planning, ship contact, weapons, the death rules of three modes and both arrival schedules. Player-to-pirate and pirate-to-pirate contact are near copies, pirate spawning is written twice, and the arena centre appears as `960`/`540` about twenty times beside a named constant. Ranked scoring lives in closures inside it.
- **`salvage.ts` is 2,526 lines and doubled on this branch.** Derelict lifecycle, four weapon families, plasma streams, score counters and the adapter for live ships share one class.
- **Enemy ships, wrecks, shards and cells are drawn without a view check** ([flight-frame.ts:323](../../packages/mode-a/src/lib/flight-frame.ts), [salvage-renderer.ts](../../packages/mode-a/src/lib/salvage-renderer.ts)). Planets are culled; these are not. It contradicts the render rule and matters most with seven Scouts. Small fix, but it changes the frame, so it wants a browser check and is better not rushed into the release.
- **The flight loop allocates on every step**: mapped opponent arrays, ship statistics rebuilt three times, new sets and maps in the salvage step. The deck also reassigns the loadout into reactive state every frame, which probably recomputes ship statistics at 60 Hz. Neither was measured.
- **The title backdrop keeps a second simulation, renderer and set of planet materials alive during flight** ([GameFieldBackdrop.svelte](../../apps/web/src/components/GameFieldBackdrop.svelte)). Likely double memory on an iPad.
- **`game-loop.ts` is mostly dead.** Only `createStar` has a caller. The repository map still describes the file as the home of death checks, which now live in the simulation.
- **`FlightDeck.svelte` writes about 35 `data-` attributes for tests in production**, several of them every frame.
- **Document drift**: architecture.md says a board uses seed 2026 while every launch takes a fresh seed; the repository map lists `architrcture.md`; the README still describes a multiplayer brawler in a shared tab; the dialogs spec says "builder test flight".
- **Tracked files that look local**: `output/` (37 image tryouts), `outgoing/`, root `public/ion-weapons.svg`, `netlify.toml`.
- **About twenty plans in `docs/plans` describe work this release ships.** They are due a staleness review by a person.

## Found in good order

- Every external input is parsed: settings, ship setup, Firestore reads and writes, flight settings.
- No per-frame pixel loops in production. Every `ImageData` use is one-time preparation.
- No production file imports study or Lab code.
- No hard-coded colours in production components, no TODO markers, no console output, no skipped tests.
- Pause cannot move a schedule or the score: every deadline counts simulation ticks.
- A restart builds a new simulation, so no roster or timer carries over.
- The scoring awards, both ranked schedules, the Gauntlet schedule and each way a pirate can die are unit tested, including that only a weapon or ram finish pays.
- Client, schema, rules and index agree on the `fires-in-the-sky` board.
- 0.7.0 adds no control that needs a binding: weapons fire and target on their own, and the new options are switches in Settings.
- Player screens say "unsanctioned" throughout.
