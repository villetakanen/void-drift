# Flight FX performance · 20–21 November 2026

## Scope and decisions

Investigate reported stutter in flight after recent effects changes, compare alternatives to Turbulent Bloom, and carry the selected treatment through the shared renderer. The designer chose Low-res CSS glow for the whole game wherever the shared flight stack draws FX, with Turbulent Bloom retained as a Lab comparison. The designer authorized a push of the working snapshot, including the in-progress shared page header, and deferred production release at this checkpoint. This record ends at `ba513148`.

## Investigation and changes

- **Simulation.** The session reviewed recent commits and the earlier render pipeline. It reported lower cost for the Scout planner in a simulation benchmark. The benchmark command, revisions and output are unavailable here. That reported result leaves the cause of the frame stutter open.
- **Chrome HUD.** The investigation compared live contact cues with promoted, hidden and frozen variants. The retained `void-hud-compositor-natural.log` in `/private/tmp` shows the overlay composited for overlap in a baseline window and for `WillChangeTransform` in a promoted window. Both had an 8.3 ms median callback interval, with one and two contacts respectively. A separate layer-reason check in `void-hud-compositor-verify.log` timed out with an empty result. `cea473654c16ffe3cba7f88e820142c509895ea0` draws the visible cue as a short SVG arc in place of a dashed circle and sets `will-change: transform` on the HUD overlay. The captures leave the effect of the arc change alone unresolved. The commit also contains the approved landing copy. [HUD component](../../apps/web/src/components/FlightContacts.svelte)
- **WebKit diagnosis.** The session reported that changing the SVG filter affected callback pacing in the system `WKWebView`, on the local preview and the hosted 0.6.3 build. Hiding the empty title FX surface was a separate diagnostic condition. The scripts and captured hosted markup remain in `/private/tmp/void-drift-webkit-compare/`. Raw timing output for that probe was unavailable. Safari's native automation driver was unavailable. The subsequent desktop Safari comparison used a regular foreground tab with a recording proxy.
- **Shared presentation.** `ba51314835a1b778d181e15da1dc02b6756e64fa` derives the glow from sharp, full-resolution FX after aperture cuts. The backing is one eighth per axis, scaled by the browser with Screen blending at 90% opacity and native `blur(12px)` between FX and LFX. Sharp FX owns all history. The shared layer host and frame finalization handle pause, reset, resize and seek. The canonical FX bench uses the shared flight stack. Render Model and Render Performance retain the comparison treatments. [FX contract](../specs/game/render/fx.md#low-res-css-glow) · [Render contract](../specs/game/render/spec.md) · [FX bench](../../apps/web/src/components/lab/FxBench.svelte)
- **Checkpoint scope.** The same 47-file commit includes the shared headers across Hangar, Credits, Lab and studies, the Lab page and resizable example, and the compatible home-link accessible label. Seven concurrent release-preparation changes were reported during checkpointing and kept outside the snapshot. [Page header contract](../specs/factory/design-system/page-header/spec.md) · [Lab page](../../apps/web/src/pages/lab/ds/page-header.mdx)

## Bench measurements on 20 November

The shared preview served a modified tree based on `cea47365`, with matching render-source fingerprints before and after the comparison. The fixture ran 25 scripted Wasp scenarios with a 1920 × 1080 FX backing. On an M4 Max running macOS 26.7.3, desktop Safari 26.6.2 and visible Google Chrome 157.0.8103.80 ran on the built-in 120 Hz display. Each treatment had two foreground windows of at least 30.05 seconds following 5.2 seconds of warmup. Geometry was held within each browser. [Setup and results](../reviews/2026-11-20-glow-comparison.md#measurement-setup) · [Source fingerprint](../../artifacts/render-glow-performance/render-source-mid.txt)

| Browser | Blank baseline | None | Low-res glow | Low-res CSS glow | Turbulent Bloom |
| --- | ---: | ---: | ---: | ---: | ---: |
| Safari | 60.11 | 60.00 | 60.00 | 60.00 | 36.63 |
| Chrome | 119.76 | 117.66 | 119.99 | 118.11 | 120.00 |

The table shows pooled animation callbacks per second. Safari's callback interval p95 was 28 ms for Turbulent Bloom and 18 ms for the other treatments. Chrome had a 120.00 callbacks/s replicate for both None and Low-res CSS glow, while their other replicates ran at 115.32 and 116.22 respectively. A separate Chrome trace reported draw-and-swap p95 of 0.120 ms for Low-res glow and 0.178 ms for Low-res CSS glow on the compositor thread. Three Safari windows interrupted by loss of focus were discarded. Chrome's blank calibration requested a missing favicon. Callback and CPU trace timing leave GPU completion, display presentation and sustained moving-flight headroom unmeasured. [Safari windows](../../artifacts/render-glow-performance/safari-visible.jsonl) · [Chrome windows](../../artifacts/render-glow-performance/chrome-visible.jsonl) · [Chrome trace summary](../../artifacts/render-glow-performance/trace-summary.json)

## Verification through the checkpoint

| Check | Outcome and source |
| --- | --- |
| HUD `pnpm verify:quick` | Contracts, lint, types and 435 unit tests passed on a dirty `9871b9d6` tree with the HUD and landing edits. [20 November run](../../artifacts/verification/2026-11-20T20-36-01.532Z-SsRv7X/report.json) |
| Glow unit and focused browser checks | On the shared working tree based on `cea47365`, `pnpm test` passed 435 before the frame guard was added. The subsequent Vitest run of `packages/mode-a/src/lib/flight-frame.test.ts` passed all 10 tests, including the new check for exactly one copy after aperture cuts and none during history replay. `pnpm test:browser tests/browser/fx.spec.ts tests/browser/fx-surface.spec.ts tests/browser/game-field.spec.ts tests/browser/flight-deck.spec.ts` passed six Chromium tests. Logs are `void-drift-glow-{unit,frame,browser}.log` in `/private/tmp`. |
| Local production-path browser probes | On the 21 November pre-checkpoint implementation, visible Chrome recorded 59.95 callbacks/s over 12.01 seconds each at title and in flight, on an external 60 Hz display at DPR 1. Chrome's foreground resize probe failed its assertion for remaining visible light even though the copy matched the current sharp FX. A shorter headless run passed resize, pause and relaunch. Chrome also passed the smoke probes for Render Model, Render Performance and the FX Lab. The desktop Safari log recorded the title hiding empty FX and a 240 × 135 glow backing with copies in the first active frames. The attempted flight timing window was interrupted, and the launch script exited when its expected title button was absent. The two probes are in `/private/tmp/void-prod-glow/{chrome,safari}.jsonl`. |
| Shared-tree `pnpm verify:quick` | The four selected commands exited successfully, but the verification failed its unchanged-source check while release preparation was also modifying the shared tree. [Shared-tree run](../../artifacts/verification/2026-11-21T16-58-42.648Z-CSm63u/report.json) |
| Isolated `pnpm verify:quick` | Contracts, lint, types and 436 unit tests in 82 files passed on clean, unchanged `ba513148` under Node 24.14.0 on macOS arm64. The mode skipped the commit history check, build, browser suite, Firestore rules and competition. Run report in the temporary clone at `/private/tmp/void-drift-checkpoint-ba513148/artifacts/verification/2026-11-21T17-01-10.283Z-Ewt4mE/report.json` records fingerprint `4fd0c0af5aee8503cd575796953b685e39d711039c1c3051cb8bdd4f4d836944`. |
| Isolated build and page header | Separate `pnpm build` on the clone produced 123 pages (`/private/tmp/void-drift-isolated-build.log`). The session reported that the built-site Chromium check passed at 1440 × 900 and that commit hooks passed. `/private/tmp/void-drift-page-header-check.mjs` retains the route, responsive wrapping and local switch assertions. The check's terminal output and hook log were unavailable. |
| Broader `pnpm test:browser` | The session reported central touch and Derelicts timing failures on the shared working tree, followed by nine passes before stopping the isolated run. The isolated Playwright report has zero recorded results and no completed suite outcome. The complete shared-tree failure report was unavailable. |

## Publication and retention

Both commits were made locally and pushed to `feat/0-7-0` during the loop. The session reported verifying the remote checkpoint, and the current remote-tracking ref contains it. The checkpoint smoke ran against local code using the game's launch path. Hosting deployment and live 0.7.0 verification were outside the checkpoint. The separate [0.7.0 publication record](../releases/0.7.0.md#publication-record) documents the later merge, fixture repair, full check and live deployment of `7ba2c76e`.

The checked-in comparison retains the setup, pooled results and captures. The raw benchmark files in `artifacts/` are ignored, and probe logs and the isolated clone in `/private/tmp` can expire. The exploratory Scout and WebKit runs lack raw timing, the checkpoint lacks a completed full browser report, and the later release evidence describes a different revision.

## Later live iPad capture · 21 November

This addendum records a later run on the live web version labelled 0.7.0; it
does not alter the earlier checkpoint observations above. The owner supplied
the Render Performance bench output from an iPad Pro (12.9-inch, 5th generation)
running Safari, with the hardware label `iPad-safari`. It used 25 scenarios,
alternating ion and plasma main engines, Low-res CSS glow, and 1920 × 1080 World,
FX and LFX backings. The supplied capture reports 97.82 seconds active time,
60.0 callbacks/s, 17 ms median/p95 callback interval, and 1/2 ms median/p95
synchronous JS and Canvas submission. Full setup and values are retained in the
[iPad performance report](../reports/2026-11-21-0-7-0-ipad-render-performance.md).

The owner asked, “to me this sounds, our new FX layer trick worked? the ipad has
a lot smaller processor than my M4 max here”. The response interpreted the
capture as strong target-device evidence for callback pacing and main-thread
headroom, while noting the bench does not measure GPU completion. This was a
question and interpretation, not a separately recorded acceptance decision.

The stamp counters report 683,956 attempted, 652,848 accepted and 31,108 dropped
requests. Per the Render Performance contract these are shared FX stamp-budget
counts, not missed frames. The supplied browser user-agent identifies macOS even
though the owner-labelled hardware is iPad Safari; the device identification
therefore follows the owner's hardware label.

This later capture is direct owner-supplied bench output, not an independently
reproduced run. No raw export or device-side recording was provided separately.
Its timing covers visible animation-frame callbacks and synchronous submission,
not GPU completion or actual displayed-frame presentation. It is one run with
Low-res CSS glow; there is no same-device comparison against another FX
treatment. The owner said it was the live web version, but this session did not
independently inspect the deployed site or identify the deployed revision. No
code or production changes were made in this follow-up; the report and this
evidence addendum are documentation only.
