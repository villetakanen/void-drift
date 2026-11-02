# Random star systems plan

**Status:** PLANNED (stub). Moved out of the [opening screen plan](../specs/opening-screen.md) as
its former S5 (owner, 2026-11-02).
**Owner ruling (2026-11-01):** static star systems are a bug. Every game run plays in a new
system; in early alpha a system can never be static in any situation.

## Context

What exists today:

- `packages/mode-a/src/lib/simulation.ts` sets `CHALLENGE_SEED = 2026`. The seed only shifts
  the planets' starting orbit phase.
- `sunType` is hard-coded to `"G"`.
- Planets come from a fixed list in `packages/core` `config.ts`, where "The Moon" is a planet
  entry rather than a true moon.
- `packages/mode-a/src/schemas/highscore.ts` names the challenge `ion-1`; the docs say
  `gravity-1`.
- `playable-alpha.md` states the opposite of the ruling: "All ranked runs use challenge
  `gravity-1`, seed 2026, a G-class star".

This is world-generation work, not front-page work. The opening screen's backdrop (opening
plan S11) draws a star system as a display scene and picks up random systems once this plan
delivers a generator.

## Owning specs

The rules this plan implements belong in `multi-planet-system.md`, `star_mechanics.md`,
`playable-alpha.md` and `architecture.md`. This file tracks the work, not the rules.

## Open decisions (owner)

- What a random system varies: star type, planet count, orbits, sizes, true moons.
- What random systems mean for the ranked leaderboard and existing scores.
- Whether a run's seed is shown or shareable.

## Slices (draft)

1. **Investigate.** Every user of `CHALLENGE_SEED`, `settings.seed`, `sunType`,
   `initializePlanets` and `CHALLENGE`, including Lab trials, `?trial=` URLs, replays, tests,
   visual baselines and score records. Search git history for an earlier generator.
2. **Decide scope.** Owner answers the open decisions above.
3. **Generator.** A seeded, pure star-system generator with a Zod schema, shown on a Lab page
   with a seed control and a new-seed control.
4. **Random runs.** Every run (start and Try Again) gets a fresh seed and a generated system.
   Lab trials, `?trial=` URLs and replays keep explicit seeds; tests pass explicit seeds without
   weakening assertions. The run records its seed.
5. **Specs and scores.** Owning specs updated; challenge naming settled; leaderboard handled
   per the owner's decision.

## Boundaries

- No gravity or friction constant changes (`GRAVITY_FLIGHT` included) without asking.
- No new npm dependencies or paid services.
