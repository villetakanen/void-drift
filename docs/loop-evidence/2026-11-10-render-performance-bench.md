# Render performance bench — closed loop

## Intent and accepted scope

Build one focused Lab instrument at `/lab/render-performance`, using production
rendering to inspect overlapping effects without gameplay simulation. The designer
accepted the result in this conversation on 2026-11-10: “We got exactly what we
wanted,” and called it a “prime example of good lab page” and a “well-done loop.”
The designer specifically praised production reuse and one question explored with
a small set of variables. This is feedback on this delivered loop, not a new
standing rule or evidence that the approach generalizes.

The agreed workload was 25 stationary rotating Wasps, 75 synchronized ion beams,
production mounts and plumes, one World/FX/LFX stack, one animation clock and one
shared FX surface/budget. A cheap one-scenario baseline was retained. Stage and
backings stay fixed when switching workloads. The designer explicitly retained
the 128 source-stamp allowance after its meaning was clarified: requests per
advancing surface update, not an emitter/population limit.

The filter comparison expanded from Blur 2px/None to include Distort 2px and a
shared Turbulent Bloom preset. The designer clarified the latter as 12px glow,
16px distortion and **100% strength**. This historical preset matters to the
measurements below. The [living spec](../specs/lab/render-performance/spec.md)
describes current intent and may subsequently differ.

## Delivery and revision boundary

Luna implemented the bench; Terra performed three review rounds. The rounds
identified unbounded catch-up work, stale pre-pause timing samples, transformed
culling, and stale-flash emission. Those were corrected; Terra's final review
reported no remaining critical findings. The later bloom addition received parent
inspection and focused browser checks. Beam dispersal opacity, canvas-binding
initialization, pause snapshot publication and desktop control overflow were also
corrected during this session.

Delivered changes included the Lab Tools route/registry link and living spec,
shared Wasp fixture drawing, a shared Turbulent Bloom filter, pause/reset/background
lifecycle, bounded rolling timing, actual shared-budget telemetry, hardware label,
and copyable results. Renderer optimization, simulation and budget increases were
outside this loop. Visual inspection covered 1280px and 1512px Lab viewports.

The tested working tree was based on `a87e31e5b2c5c5fc26948176596468b981dd1ed6`
(including `f367c07`), on `feat/0-5-0`. It was uncommitted. The final quick-check
source fingerprint was
`18f090972ad8267d9aeab277f4d079bd2269d00bfa5f7c700d520a4e74a89784`
in the [specific verification report](../../artifacts/verification/2026-11-10T22-04-15.853Z-cXDuJb/report.json).
This loop made no commit, push, publication or deployment; live deployment was not
verified.

At closure, direct inspection found additional shared-checkout changes beyond
this loop, including a shared bloom default of 90% and further layer/study work.
HEAD still pointed to `a87e31e`. The historical 100% bloom measurements and checks
below do **not** certify those later changes or the current whole checkout.

## Correctness evidence

- `pnpm verify:quick`: final selected checks passed, source unchanged during that
  run, **partial verification only**. Contracts, lint, types and 502 tests in 63
  files passed. Report environment: Node v24.14.0, darwin/arm64. The report and
  per-command logs are in the run directory linked above; its `passed: false`
  reflects quick mode rather than a full verification pass.
- `pnpm build`: passed, 70 pages. The session build log remains at
  [/private/tmp/void-drift-render-performance-final-build.log](/private/tmp/void-drift-render-performance-final-build.log).
- `pnpm exec playwright test tests/browser/render-performance.spec.ts tests/browser/render-model.spec.ts`:
  three checks passed in session command output after shared bloom extraction.
  Coverage included 25 nonempty hull regions, 75 beam bands, the centered baseline,
  SVG preset values, held pixels, saturation accounting, pause/reset and simulated
  visibility suspension. The final subsequent changes were layout CSS.
- Earlier focused `alpha.spec.ts` and `ion-effects.spec.ts` checks passed in session
  output, exercising production keyboard/touch flight and the shared ion consumer.
  These are correctness checks; their headless timing was not reported as performance.
- Earlier [quick verification](../../artifacts/verification/2026-11-10T21-48-29.221Z-Mh4SU8/report.json)
  failed Astro props typing, subsequently repaired. Earlier bench browser attempts
  exposed initialization and delayed pause-readout issues, subsequently repaired.
  A Luna browser attempt could not bind its server (`EPERM`); the parent's later
  browser runs above passed. Two subsequent quick runs were invalidated by source
  changes despite passing individual commands:
  [first](../../artifacts/verification/2026-11-10T21-53-09.385Z-sKIe8V/report.json),
  [second](../../artifacts/verification/2026-11-10T21-53-53.170Z-cG4nAA/report.json).
- Full browser suite, backend rules/competition and full `pnpm verify` were not run
  for this loop. Quick mode also skipped commit checking; build and focused browser
  commands were separate evidence.

## Visible-browser measurements

The session ran a fixed production preview in ordinary visible Chrome 157 on the
host Mac (hardware model unspecified), without concurrent verification commands
during collection. Viewport: 1512×805; stage CSS: 845×474; each backing: 1920×1080;
DPR: 2. All runs used 25 scenarios. Two active seconds of warm-up were excluded;
timing statistics used the last approximately ten measured seconds. Stamp totals
cover the full measured active duration.

| Filter                             | Measured s | Callback FPS | Frame p95 ms | JS submission median/p95 ms | Dropped stamps |
| ---------------------------------- | ---------: | -----------: | -----------: | --------------------------: | -------------: |
| Blur 2px                           |      19.78 |        115.7 |         9.30 |                 2.60 / 5.90 |         12,518 |
| Distort 2px                        |      22.67 |        105.2 |        16.70 |                 3.10 / 6.90 |         13,354 |
| None                               |      18.84 |        106.4 |        16.70 |                 3.20 / 6.80 |         10,406 |
| Turbulent Bloom 12px / 16px / 100% |      20.41 |        105.0 |        16.70 |                 3.20 / 7.90 |         10,582 |

The [local results artifact](../../artifacts/render-performance/2026-11-10/visible-chrome.json)
retains accepted/attempted totals, sample counts and context. It records observable
dropped work under synchronized bursts; no renderer optimization was made to
improve the numbers. These short sequential runs do not establish causal filter
rankings, complete GPU/compositor cost or universal performance. GPU acceleration
was not independently inspected. No iPad/Safari measurements were collected here.

## Evidence limits and closure

The designer's explicit acceptance above closes this loop. Agent visual inspection,
automated correctness and browser performance remain separate observations.
Verification/results artifacts are ignored local files, not durable backups. The
temporary build log can disappear. Browser results are supported by this session's
command output and summarized artifact; no immutable per-run browser report or
visual capture is attached to this record. No tests were rerun during closure.

This record preserves the essential evidence and acceptance. It derives no signals,
lessons, causal explanations or process requirements.
