# Render performance in Firefox on Windows

Evidence record, 21 November 2026. User-supplied Render Performance bench output,
attributed to Antti L. Hardware label: unspecified.

## Capture

The bench ran 25 scenarios with alternating ion and plasma main engines. It
reports 350.04 seconds of measured active time; timing statistics cover a
rolling 10.00-second interval with 600 samples.

| Measure | Result |
| --- | ---: |
| Browser | Firefox 158.0 on Windows 10 (reported user-agent) |
| Hardware label | Unspecified |
| Viewport | 1920 × 947 |
| Stage CSS size | 1261 × 708 |
| World, FX and LFX backing | 1920 × 1080 each |
| Glow backing | 240 × 135 |
| Device pixel ratio | 1 |
| FX presentation | Screen blend; Low-res CSS glow at 1/8 backing per axis, 90% opacity, CSS `blur(12px)`; no FX canvas filter |
| LFX presentation | Hard light; no filter |
| Callback rate | 60.0 FPS |
| Frame interval median / p95 | 16.66 / 16.68 ms |
| JS update and Canvas submission median / p95 | 2.00 / 3.00 ms |
| Stamps attempted / accepted / dropped | 2,460,650 / 2,345,304 / 115,346 |

## Limits

This is user-supplied bench output, not an independently reproduced run. The
bench measures visible animation-frame callbacks and synchronous JavaScript
and Canvas submission, not GPU completion or actual displayed-frame
presentation. The hardware is unspecified, and the run provides no same-machine
comparison against another FX treatment. The 350.04-second active duration
does not extend the timing statistics beyond their reported rolling 10-second
sample interval. No raw export or device-side recording was provided
separately.
