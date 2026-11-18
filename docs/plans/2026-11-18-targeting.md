# Targeting delivery

1. **Deliver the Lab Targeting bench and baseline the existing selector.** Run the [16-Wasp bench](../specs/lab/targeting-bench/spec.md) with twin cannons, mixed mounts and twin turrets. Keep production plumes and weapon effects active. Retain candidate preparation, acquisition, physical-contact, combat, plume-update, render/FX and presented frame costs with the acquisition revision, device, browser and workload. Compare whole-frame differences attributed to the selector only with matched firing, contacts, active emitters and visuals.
2. **Locate the expensive work and set a budget.** Examine visits, mount comparisons and precise geometry. Compare the fleet workload with a dense wreck/fragment encounter before drawing conclusions about all modes.
3. **Share the combat roster across shooters.** Prepare each live ship once per fleet substep for Gauntlet and the bench. Verify stable IDs, membership lifetime, shooter exclusion, ally interception, idle acquisition work and construction counts. Compare this slice with the existing selector.
4. **Implement the [single-pass targeting contract](../specs/game/targeting/spec.md).** Establish reference results offline, then measure cheaper geometric approximations against both target quality and the agreed cost. Keep firing, damage and ordered energy spending in production execution.
5. **Repeat the baseline and verify encounter behavior.** Compare matched fleet workloads, live-target loss, Gauntlet and the dense derelict case. Use these results to decide readiness for plasma integration.

## Initial ring measurement

Local development build of the bench delivered in `7572ad77`, Apple M4 Max, headless Chromium 156.0.8078.4, 1440 × 960 viewport. Sustained fire, traces off, 16 live Wasps and 32 mounts throughout. One run per fit, 120 warm-up substeps and a rolling sample of 600 substeps. Counts include idle substeps.

| Fleet fitting                | Mean candidate visits per substep | Acquisition p95 (ms) | Contact p95 (ms) | Combat p95 (ms) | Frame interval p95 (ms) |
| ---------------------------- | --------------------------------: | -------------------: | ---------------: | --------------: | ----------------------: |
| Two Light Ion Cannons        |                              1.61 |                    0 |                0 |             0.1 |                    50.1 |
| Cannon and Ion Point Defence |                            241.61 |                  0.1 |                0 |             0.1 |                    50.1 |
| Two Ion Point Defences       |                            480.00 |                  0.1 |                0 |             0.1 |                    50.1 |

A ready cannon volley shares one acquisition request per shooter and spends most substeps cooling. Each turret tracks each substep and visits all 15 other ships, yielding 32 × 15 visits. A zero percentile can reflect idle substeps or browser clock precision. These single-run development timings describe the baseline environment. The comparable frame intervals across fits do not establish a targeting bottleneck or a production frame budget.

## Attribution after restoring the engine workload

The initial measurements predate the production plume workload and separate timings for building encounter inputs and drawing the frame. Repeat the three fits with the engines firing. Use same-fit repeat runs to establish variation, then report substep combat separately from frame-level drawing and presentation. Where a selector-only comparison is needed, retain a deterministic run's selection results and compare live acquisition with replay while the same weapons discharge and the same effects are drawn. Record mismatched outcomes or visible workload and withhold a selector-only frame claim in that case. Set the acquisition budget after matched measurements.

### Plume-equipped ring results

Development workload in `9d654b29`, Apple M4 Max, Chromium 156.0.8078.4, 1440 × 960, sustained fire and traces off. Headed Chromium used ANGLE Metal. Samples cover the last 600 fleet combat substeps after warm-up. Reported frame intervals measure animation callbacks. The earlier headless run used a different presentation environment.

| Fitting                       | Mean body visits / substep | Mean acquisition ms / substep | Simulation p95 ms / callback | Canvas submission p95 ms / callback | Callback interval p95 ms |
| ----------------------------- | -------------------------: | ----------------------------: | ---------------------------: | ----------------------------------: | -----------------------: |
| Twin cannons                  |                       1.61 |                        <0.001 |                          0.3 |                                 0.9 |                      9.2 |
| Cannon and turret             |                     241.61 |                         0.021 |                          0.4 |                                 1.0 |                      9.2 |
| Twin turrets, two live runs   |                        480 |                   0.035–0.037 |                          0.5 |                                 1.0 |                  9.2–9.8 |
| Twin turrets, two replay runs |                          0 |                             0 |                          0.3 |                                 1.0 |                      9.3 |

The control recorded each turret's selected body and aim point by mount and substep outside the comparison windows. Two live and two replay windows followed in live/replay/replay/live order. Each ended with 16 ships, 32 mounts and 368 discharges. At eight matched simulation times per run, hull, energy, active plume counts, weapon events, turret angles and target IDs matched. Replay kept production weapon execution, contact, plumes and drawing active. Live acquisition cost CPU and the callback intervals overlapped. This sample does not establish the cause of stutter in the in-app browser.

A separate headless CPU comparison advanced the same twin-turret simulation without rendering, with the optional selector counters disabled. Four runs per variant, 60 warm-up ticks and 240 measured ticks per run, averaged 0.283–0.290 ms per complete tick live and 0.162–0.171 ms with replay. Target, funding and shot state agreed at 21 checkpoints per run. The difference includes the cost of the replay lookup in the control. Dense wreck geometry remains unmeasured.

### Shared roster and subsequent selector

The plume-equipped baseline builds 16 lists of 15 body adapters before turret acquisition. The first change gives Gauntlet and the ring one substep roster and applies each shooter's eligibility policy as it reads that roster. Record fleet roster builds, adapters prepared and preparation time alongside the existing acquisition and contact measurements. On a full 16-Wasp substep that needs the roster, expect at most 16 ship adapters. Verify identity, refreshed poses and membership at the substep boundary. In an idle acquisition substep there are no selection visits, comparisons or acquisition-only preparation. Existing contact work, where needed, keeps its own accounting. Validate unchanged firing and contact outcomes in both production paths.

The following change registers active mount requests and evaluates them in one acquisition traversal. Only that change can establish the target of at most 16 acquisition body visits on the populated ring. A shared roster can still be scanned repeatedly. Report candidate/request comparisons independently since even a single outer traversal can perform 480 such comparisons.

### Shared roster verification

The Gauntlet and ring pass the same live ship adapters to every participating shooter in a combat substep. The sustained 32-turret ring now prepares 16 adapters once per substep. Previously each of 16 shooters prepared 15 adapters (240 total). A cooling cannon fleet builds no roster until another shot or tracking request needs it. Selector comparisons still happen at each mount. The turret baseline now records 512 visited entries and 480 eligible comparisons because it counts the 32 self entries rejected by policy.

A deterministic comparison on the local Lab covered twin cannons, twin turrets, mixed cannon/turret and twin lasers under both workloads. Ten checkpoints per configuration at 30-tick intervals matched the pre-roster revision `9a5be059` for per-ship hull, power, lifecycle, discharges, target IDs, angles, cooldowns and active plume counts. The mixed-material compatibility path temporarily attaches shared ship references to a shooter's owned body list so successive shots see newly released fragments.

### Fleet selection verification (original single ring)

The ring, Gauntlet and salvage encounters now capture mount decisions before ordered discharge. A headed Chromium comparison interleaved five runs of each revision in one browser. Each run warmed up for 120 ticks and measured 240. The table reports the median run mean for CPU simulation without rendering. The baseline is `2916d3f8`.

| Workload                               | Acquisition body visits, before → after |         Simulation CPU, before → after | Discharges, both builds |
| -------------------------------------- | --------------------------------------: | -------------------------------------: | ----------------------: |
| 16 Wasps, 32 turrets                   |                    512 → 16 per substep | 0.263 → 0.180 ms per four-substep tick |                     544 |
| Two turrets, 8 wrecks and 56 fragments |                    128 → 64 per substep |           0.084 → 0.057 ms per substep |                       7 |
| Two turrets, empty encounter           |                                   0 → 0 |          ~0.001 ms per substep in both |                       0 |

In a separate 1440 × 960 rendered ring run, the bench reported 16 visits, 480 eligible comparisons, 0.020 ms mean acquisition per substep and a 9.2 ms p95 frame interval. All 32 mounts were active with production plumes and traces off. Dense material timing covers turret selection. The empty scene is at browser timer resolution.

Across four weapon fits in sustained and live workloads, both revisions produced the same discharge totals and survivor counts after 300 ticks. Some intermediate turret state hashes differed. Exact replay equivalence and a Gauntlet CPU budget remain unverified. The next measurement should use an active Gauntlet encounter and compare target IDs and aim angles at the first divergent tick before setting a production budget or starting plasma work.

### Three-loop workload

The bench now places six Wasps on each large ellipse and four on the inner circle. Earlier single-ring timings above describe the workload at those revisions. In 60 seconds of sustained twin-turret flight on the three loops, all 16 Wasps selected different opponents with their two mounts at least once. Six Wasps both held and lost a lock on their second turret. A separate rendered run at 1440 × 960 recorded 16 visits and 480 comparisons per substep with all 32 tracking mounts active.
