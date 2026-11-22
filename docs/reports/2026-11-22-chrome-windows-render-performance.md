# Render performance in Chrome on Windows

Evidence record, 22 November 2026. User-supplied Render Performance bench output,
attributed to Jonas M. Hardware label and tested revision: unspecified.

## Capture

The bench reported 25 scenarios with alternating ion and plasma main engines.
Measured active time was 422.87 seconds; timing statistics cover a rolling
10.00-second interval with 600 samples.

| Measure | Result |
| --- | ---: |
| Browser user-agent | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 |
| Hardware label | Unspecified |
| Viewport | 1843 × 845 |
| Stage CSS size | 1178 × 662 |
| World, FX and LFX backing | 1920 × 1080 each |
| Glow backing | 240 × 135 |
| Device pixel ratio | 1.875 |
| FX presentation | Screen blend; Low-res CSS glow at 1/8 backing per axis, Screen blend, 90% opacity, CSS `blur(12px)`; no FX canvas filter |
| LFX presentation | Hard light; no filter |
| Callback rate | 60.0 FPS |
| Frame interval median / p95 | 16.70 / 17.00 ms |
| JS update and Canvas submission median / p95 | 2.90 / 4.30 ms |
| Stamps attempted / accepted / dropped | 2,955,899 / 2,821,413 / 134,486 |

## Reading and limits

The rolling sample shows callbacks near 60 Hz and relatively low synchronous
update and Canvas submission time on this machine. The 134,486 dropped stamps
are budget rejections, approximately 4.5% of attempts, not dropped frames.

This is user-supplied output, not an independently reproduced run. The measured
active duration covers accumulated stamp totals, not timing statistics for the
whole run. Callback and synchronous submission timings do not measure GPU
completion or displayed-frame presentation. The bench is a rendering fixture,
not a full gameplay simulation. Hardware and revision are unspecified; no raw
export, device-side recording or same-machine comparison was supplied. One run
cannot establish performance across devices, browsers or gameplay conditions.
