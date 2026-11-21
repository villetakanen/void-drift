# 0.7.0 render performance on iPad Safari

Evidence record, 21 November 2026. Live web version, labelled 0.7.0.

## Capture

Render Performance bench, 25 scenarios with alternating ion and plasma main
engines. The run reports 97.82 seconds of measured active time; the timing
statistics cover the rolling final 10.01 seconds and 600 samples.

| Measure | Result |
| --- | ---: |
| Device label | iPad Pro (12.9-inch), 5th generation |
| Browser | Safari 26.6, reported hardware label `iPad-safari` |
| Viewport | 1366 × 892 |
| Stage CSS size | 707 × 397 |
| World, FX and LFX backing | 1920 × 1080 each |
| Glow backing | 240 × 135 |
| Device pixel ratio | 2 |
| FX presentation | Low-res CSS glow; Screen blend, 90% opacity, `blur(12px)` |
| LFX presentation | Hard light, no filter |
| Callback rate | 60.0 FPS |
| Frame interval median / p95 | 17.00 / 17.00 ms |
| JS update and Canvas submission median / p95 | 1.00 / 2.00 ms |
| Stamps attempted / accepted / dropped | 683,956 / 652,848 / 31,108 |

The captured browser user-agent identifies macOS, while the capture's hardware
label identifies iPad Safari. The device identification above follows that
label; the browser string is retained here as reported.

## Reading

The workload sustained the browser's observed 60 Hz callback pace on the
reported iPad for nearly 98 seconds. The 1 ms median and 2 ms p95 synchronous
update-and-submission times show substantial main-thread headroom at that pace.
This is a strong target-device result for the current FX layer setup, including
the shared 1/8-resolution glow canvas and CSS blur.

The 31,108 rejected stamps are effect-budget rejections, not dropped frames.
They are about 4.5% of attempted stamps and are governed by the shared stamp
budget.

## Limits

The bench times visible animation-frame callbacks and synchronous JavaScript
and Canvas submission. It does not measure GPU completion or displayed-frame
presentation, so this capture cannot establish that the GPU never missed a
presentation deadline. It is one device and one run, and does not compare FX
treatments on this same iPad. The earlier 25-scenario Safari comparison found
that both low-resolution glow treatments held 60 callbacks/s on an M4 Max while
Turbulent Bloom averaged 36.63 callbacks/s; see the
[glow comparison](../reviews/2026-11-20-glow-comparison.md).
