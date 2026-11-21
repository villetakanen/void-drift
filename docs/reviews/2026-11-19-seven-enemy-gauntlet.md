# Seven active enemies in Gauntlet · 19 November 2026

The measured Scout had Light Ion side engines, a top Plasma Rifle and an aft Light Ion Cannon. Both the reference planner and the new planner flew that fit. The reference used the mounted-physics rollouts from `aa1f43c5` in an isolated checkout, with the cannon fitted and seven identifiers enabled for the workload.

## Simulation

Node 24.14.0, Vitest 4.0.16, seed 812, 60 Hz simulation. In the combat fixture, the player started stationary at (1450, 650) and active Scouts were placed on a radius-130 circle facing it. One rifle began partly charged. The player's hull was replenished before timed ticks to keep the encounter running. Eight 32-tick batches followed a warm-up batch at each roster size. Measurements include actual targeting, weapons, contact handling and AI decisions. Changing the pilots changes the subsequent trajectories and firing opportunities.

| Active Scouts | Reference tick median / p95 / max (ms) | New tick median / p95 / max (ms) |
| ---: | ---: | ---: |
| 1 | 0.10 / 9.84 / 11.57 | 0.08 / 0.20 / 0.42 |
| 2 | 0.14 / 9.86 / 11.62 | 0.10 / 0.24 / 0.42 |
| 7 | 0.47 / 41.06 / 43.28 | 0.27 / 0.41 / 0.98 |

The four planner probes covered entry, sideways drift through the arena boundary, an inward pass near the star and an approaching planet. We timed 30 decisions per case after four warm-ups. The full rollout took 8.95–9.18 ms median. An intermediate coarse mounted-physics version, evaluated before the cannon refit, took 0.65–1.09 ms. The armed table-backed version took 0.11–0.14 ms. All four armed comparisons chose the same immediate command as the reference. Against 0.2 seconds of actual flight, the new predictor's position errors were 1.28, 1.34, 3.57 and 0.66 world units respectively. All four paths retained positive physical clearance over that interval.

## Rendered Lab encounter

Headless Chromium ran the production Gauntlet bench at 1440 × 900 via the shared development preview. Setup advanced the encounter's own spawn schedule, positioned the actors for combat and replenished player resources before each timed step. The browser executed the ordinary pilot, weapons, physics, effects, camera and draw loop. Every sampled draw required the requested number of living active enemies. Each workload comprised ten batches of 18 measured draws.

| Active Scouts | Tick p95 (ms) | Draw callback median / p95 / max (ms) | Frames with active plasma |
| ---: | ---: | ---: | ---: |
| 1 | 0.3 | 6.6 / 7.3 / 8.9 | 7 / 180 |
| 2 | 0.3 | 6.6 / 7.0 / 7.2 | 10 / 180 |
| 7 | 0.5 | 7.6 / 8.3 / 9.5 | 130 / 180 |

With seven active, all 180 measured callbacks finished within 16.7 ms. Browser animation callbacks arrived 33.4 ms apart at the median even with a single enemy. These timings cover CPU work through draw submission. Sustained 60 Hz presentation on a display or iPad remains unverified. All seven roster rows appeared, and scrolling the status pane exposed both thrust controls.

## Encounter behavior

In a balance probe during tuning across seeds 1–500 with an idle Scout player, sampled through 61 seconds or the end of the encounter, the highest simultaneous active enemy count was six. Seven total arrivals are scheduled, and casualties can reduce the active count. The seven-enemy timings above explicitly exercise maximum load.

The mounted-flight checks used ordinary thrusters and live solar collection with a 19% starting charge. On both radius-36 and radius-140 stars the armed Scout recovered from circular flight, a modest outward drift, and rest just outside the collection field with two initial headings. Each test reached 80%, resumed pursuit and stayed clear of the stellar surface for the next two seconds. A separate obstruction check exercised the departure choice with a planet ahead.

[Enemy AI contract](../specs/game/enemy-ai/spec.md) · [Gauntlet contract](../specs/game/gauntlet/spec.md) · [Mounted-flight recovery checks](../../packages/mode-a/src/lib/enemy-recovery.test.ts)
