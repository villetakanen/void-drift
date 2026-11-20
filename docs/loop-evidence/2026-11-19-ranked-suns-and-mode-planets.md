# Ranked suns and mode planets · 0.7.0 verification

On 19 November 2026 the designer requested verification of random G-class suns in ranked Survival, repeatable Practice planets, and updated generated planets in Survival, Derelicts and Gauntlet. The loop updated the [release plan](../plans/2026-11-19-fires-in-the-sky-release.md#suns-and-planets-verification--19-november). The [system contract](../specs/game/world/systems/spec.md) defines the fixed and seeded paths.

## Observed checks

The local working tree included uncommitted release work on base aa1f43c5. The browser check ran against the shared development preview on port 4321 in Chromium at 1440 × 900. The command was `node /private/tmp/void-070-worlds.cjs`. Its read-only probe captured each opening system and the planet positions with prepared rendering materials. All nine Hangar launches entered play, bound materials at positions 1–3 and completed the checks without page errors.

| Launches | Observation |
| --- | --- |
| Two fresh Practice launches | Both used seed 2026. The G7 Sun (70 u), Mercury, Venus and The Cradle matched across the full opening data, including orbits and starting positions. |
| Two fresh ranked Survival launches | The game selected seed 774869482 (G5, 45.47 u, Violet Habitable world second) and seed 1781960253 (G12, 115.72 u, Archipelago Habitable world third). Both selected 20% cloud cover. |
| Two Derelicts, two Gauntlet, one further ranked Survival | Reusing the two ranked seeds reproduced their respective suns and planets across modes. Repeating the first ranked seed reproduced its opening system. |

The following focused command passed all 21 tests across six files. The [Habitable test](../../packages/mode-a/src/lib/habitable-world.test.ts) covered both orbital placements and all six ground/cloud combinations over 1,000 seeds.

```sh
pnpm exec vitest run packages/mode-a/src/lib/{habitable-world,mercurial-rock,practice-venus,solar-system,standard-sun,yellow-star-family}.test.ts
```

## Evidence and publication

The observations above come from the original run's console output. The probe was temporary. The repository retains the results summary and unit tests, with no archived browser transcript or screenshots for this run. Material binding was checked programmatically. Visual appearance was outside this check. The designer requested closure after the results were reported.

This loop changed local documentation only. It produced no commit, push, deployment or live-site verification.
