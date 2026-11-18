# Targeting delivery

1. **Deliver the Lab Targeting bench and baseline the existing selector.** Run the [16-Wasp ring](../specs/lab/targeting-bench/spec.md) with twin cannons, mixed mounts and twin turrets. Retain production acquisition, physical-contact and frame costs with the device, browser, revision and workload. The benchmark should expose today's repeated work.
2. **Locate the expensive work and set a budget.** Examine visits, mount comparisons and precise geometry. Compare the ring with a dense wreck/fragment encounter before drawing conclusions about all modes.
3. **Implement the [single-pass targeting contract](../specs/game/targeting/spec.md).** Establish reference results offline, then measure cheaper geometric approximations against both target quality and the agreed cost. Keep firing, damage and ordered energy spending in production execution.
4. **Repeat the baseline and verify encounter behavior.** Compare matched ring workloads, live-target loss, Gauntlet and the dense derelict case. Use these results to decide readiness for plasma integration.

## Initial ring measurement

Local development build of the bench delivered in `7572ad77`, Apple M4 Max, headless Chromium 156.0.8078.4, 1440 × 960 viewport. Sustained fire, traces off, 16 live Wasps and 32 mounts throughout. One run per fit, 120 warm-up substeps and a rolling sample of 600 substeps. Counts include idle substeps.

| Fleet fitting                | Mean candidate visits per substep | Acquisition p95 (ms) | Contact p95 (ms) | Combat p95 (ms) | Frame interval p95 (ms) |
| ---------------------------- | --------------------------------: | -------------------: | ---------------: | --------------: | ----------------------: |
| Two Light Ion Cannons        |                              1.61 |                    0 |                0 |             0.1 |                    50.1 |
| Cannon and Ion Point Defence |                            241.61 |                  0.1 |                0 |             0.1 |                    50.1 |
| Two Ion Point Defences       |                            480.00 |                  0.1 |                0 |             0.1 |                    50.1 |

A ready cannon volley shares one acquisition request per shooter and spends most substeps cooling. Each turret tracks each substep and visits all 15 other ships, yielding 32 × 15 visits. A zero percentile can reflect idle substeps or browser clock precision. These single-run development timings describe the baseline environment. The comparable frame intervals across fits do not establish a targeting bottleneck or a production frame budget.
