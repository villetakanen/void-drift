# 0.7.0 · Fires in the Sky

Release preparation, 19 November 2026. The checkout identifies itself as 0.7.0-rc.1. This inventory covers local source at aa1f43c5 plus the current working tree. The seven-pirate Gauntlet and contact HUD include uncommitted work. Deployment status and release-candidate runtime behavior were not verified in this audit.

## What exists and what remains

| Release item | Current behavior | Work to close |
| --- | --- | --- |
| Ranked plasma engine | Sanctioned for ranked Survival with Playground off. Uses its existing delayed thrust, cruise contribution and power draw. | Included in fires-in-the-sky. |
| Ranked plasma rifle | Sanctioned for ranked Survival with Playground off, alone or together with the Plasma engine. | Included in fires-in-the-sky. |
| Ranked pirate | Ranked Survival reuses the armed Gauntlet Scout and pilot. | First Scout at 45 gameplay seconds after GO. Schedule its replacement 45–60 seconds after death or departure, independently of wrecks. |
| Ranked derelict | First attempt 5–40 gameplay seconds after GO, then 5–40 seconds between attempts. Skip while a living wreck remains. Shards and cells can coexist with the next wreck. | Implemented on the `fires-in-the-sky` ruleset. |
| Ranked G-class suns | The run seed selects the yellow-family G star and its field profile. | Two fresh ranked launches produced G5 and G12. Replaying the first seed reproduced its complete opening system. |
| Ranked score | Outcome scoring uses the agreed awards below. The final total, including zero, is submitted to the `fires-in-the-sky` board. | Deploy compatible Firestore rules before the release client. |
| Gauntlet horde | Seven total armed Scout arrivals at the opening and every 10 gameplay seconds through 60. Casualties can reduce the live count. | Verified from Hangar through victory, defeat and fresh launch after each result. |
| Planet visuals and generation | Practice repeats Mercury, Venus and The Cradle. Survival, Derelicts and Gauntlet share seeded Mercurial and Habitable worlds. | Verified opening layouts and prepared planet materials through Hangar launches in all four modes. |
| Combat HUD setting | Options persists Combat HUD for all playable flights. It defaults to On. Off skips contact projection and hides the cues. | Include both HUD states in the release flight checks. |
| Follow/speed camera setting | Options persists Speed camera as a standard preference. Off selects follow framing by default. | Verified in Gauntlet with Combat HUD on and off at 1440×900 with keyboard and 1024×768 with emulated landscape touch. |
| Additional polish | No individual fixes were specified. A separate 0.7 flight-sky plan exists. | Collect concrete defects from the combined flight. Prioritize issues affecting ranked fairness, legibility or controls. Confirm scope before counting further sky work as a release requirement. |

Source entry points: [part catalog and eligibility](../../packages/mode-a/src/lib/schemas/loadout.ts), [simulation and score](../../packages/mode-a/src/lib/simulation.ts), [encounter settings](../../packages/mode-a/src/lib/schemas/salvage.ts), [system generation](../../packages/mode-a/src/lib/solar-system.ts), [deck and submission](../../apps/web/src/components/FlightDeck.svelte), [Options](../../apps/web/src/components/Settings.svelte), [seven-enemy review](../reviews/2026-11-19-seven-enemy-gauntlet.md).

## Suns and planets verification · 19 November

Nine Hangar launches in local Chromium at 1440 × 900. A read-only browser probe captured the actual flight simulation at start and checked which planet positions received prepared rendering materials. The first two ranked launches used the game's own random seeds. The comparison launches reused those seeds.

| Run seed | Sun and surface radius | Planets in order from the sun |
| --- | --- | --- |
| Practice, 2026 | G7, 70 u | Mercury, Venus, The Cradle |
| Ranked, 774869482 | G5, 45.47 u | Mercurial, Habitable (Violet ground, 20% cloud cover), outer Mercurial |
| Ranked, 1781960253 | G12, 115.72 u | Mercurial, outer Mercurial, Habitable (Archipelago ground, 20% cloud cover) |

Two independent Practice launches matched across the complete opening sun and planet data, including radii, orbits and starting positions. Derelicts and Gauntlet each reproduced both ranked systems exactly. A further ranked launch reproduced the G5 system. All nine flights bound materials at all three planet positions and entered play without browser errors.

All 21 focused sun, generator and Practice tests passed. The 1,000-seed Habitable test exercised both orbital placements and all six ground/cloud combinations. [Seeded system tests](../../packages/mode-a/src/lib/solar-system.test.ts) · [Habitable generation tests](../../packages/mode-a/src/lib/habitable-world.test.ts)

## Gauntlet verification · 19 November

Chromium, 1440 × 900, shared local preview. A fresh Hangar session flew the default Wasp with idle controls. Only the arrival seed was fixed for reproducibility. The browser used the ordinary countdown, clock, simulation and result dialog.

| Hangar run | Observed result |
| --- | --- |
| Seed 24 | The issued roster advanced from one through seven. The deck first displayed each count at ticks 0, 605, 1205, 1805, 2405, 3005 and 3605. Victory appeared at tick 5731 (95.52 s), with an environmental finish. |
| Return to Hangar, launch seed 1 | Fresh countdown at tick 0 with one Scout and no previous result. Combat hull loss produced Defeat at tick 344 (5.73 s). |
| Return to Hangar, launch seed 24 again | Fresh countdown, one Scout and a cleared result at tick 0. The clock advanced into active flight. |

Both result dialogs offered Return to Hangar and omitted score submission. The browser observes roster changes after a rendered frame. The [Gauntlet simulation tests](../../packages/mode-a/src/lib/gauntlet.test.ts) separately verify issuance at the exact 600-tick boundaries, distinct Scout identities and the shared armed fit. All 15 passed. The [seven-active review](../reviews/2026-11-19-seven-enemy-gauntlet.md) covers simultaneous maximum load.

## Scoring decision for ranked Survival

Confirmed on 19 November: +1 per whole simulation second alive, +20 per cell collected and 0 per hit. Destruction of a derelict, shard or pirate earns a separate award. The destruction awards and kill credit below are confirmed in the [ranked Survival contract](../specs/game/survival/spec.md).

| Player outcome | Points |
| --- | ---: |
| Destroy an intact derelict | +10 |
| Destroy a shard | +2 |
| Destroy a pirate | +50 |

A player-broken wreck yields one cell and up to eight distinct shards. Breaking it and recovering the cell earns 30 points. Clearing every shard brings the encounter to 46. A pirate pays slightly more in a single fight. [Breakup and cell release](../../packages/mode-a/src/lib/salvage.ts) · [Shard geometry](../../packages/mode-a/src/lib/derelict-geometry.ts)

Award each destroyed body once when the player's weapon or ram deals the finishing damage. Shard separation itself earns zero. An environmental or pirate finish earns zero. Check that a single plasma eruption can earn credit for several distinct bodies and that the final displayed and submitted totals agree, including a sub-second run.

## Delivery order

1. **Set the ranked rules.** Adopt the agreed scope in Survival, Scores, fitting and related living specs before changing code. Review ownership of shared opponent simulation separately from Gauntlet victory logic.
2. **Build one ranked run end to end.** Exercise ranked plasma builds with the independent pirate and wreck schedules. Pause freezes deadlines. Restart clears both rosters and timers. Check coexistence, destruction and replacement, including the rifle selecting between a live pirate and wreck. Use deterministic fixtures for window boundaries and caps.
3. **Carry the score through to the board.** The simulation supplies one outcome-based total for the deck, results and submission. All ranked changes for the unpublished 0.7.0 release share the `fires-in-the-sky` challenge. Make compatible rules available before the release client. [Leaderboard schema](../../packages/mode-a/src/schemas/highscore.ts) · [Firestore rules](../../firestore.rules)
4. **Finish the parallel flight work.** Reconcile the in-progress Gauntlet and HUD changes before editing shared deck or opponent code. The Options switch, camera combinations and per-mode planet checks are verified above. If a study supplies a new visual, agree which modes or bodies it applies to, review the architecture and adopt the scoped contract before promotion.
5. **Cut the candidate.** Run pnpm verify on the integrated tree, including the Java 21 backend checks. Exercise a ranked plasma launch through death and score submission, Gauntlet through its result, repeatable Practice and generated-mode restarts. Check keyboard and landscape touch with both cameras and the contact HUD. Review seven-enemy frame cost with the HUD active. Record release fixes and update versions and release notes once the candidate passes.
