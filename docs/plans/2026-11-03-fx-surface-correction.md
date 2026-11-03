# Persistent FX surface correction

The owner stopped the 0.5.0 playtest: ion engines looked like protruding sticks.
Discussion established the missing architectural requirement: stamp new light onto
one persistent scene surface, add overlapping light, and decay the accumulated
image together. Per-emitter trail histories are not the intended implementation.

## Acceptance

- Play and the production Lab use the same persistent additive light surface above
  hulls/world and below the HUD. Only fresh emission is painted; engine trails have
  no mark objects, ages or redraw loops.
- The complete ion stamp has a near-white core, coloured halo and transparent end,
  with the accepted Light/Heavy distinction. Release stops stamping, and the
  accumulated image decays using elapsed game time. Appearance needs owner review.
- Pause does not decay or accumulate extra brightness. Reset clears the surface.
  Camera movement reprojects the image; wrap deposits at the new position without
  drawing a connecting streak. Old light remains at its old world position and fades.
- Bounded sources, particles and surface memory; no backlog on skipped frames.
  Moving sparks may keep motion state, but their painted trails belong to the image.
- Verify functional contracts and the sustained six-ship workload. Record submission
  timing separately from raster/compositor evidence and physical-device acceptance.

## Slices

1. [x] Shared persistent surface, clock, additive stamping, camera reprojection and reset.
2. [x] Current engine outlets and cached complete ion stamps; remove production mark history.
3. [x] Route gravity, mixed-scene fixtures and standalone production previews through
   the surface. Preserve approved historical references in study-only code.
4. [x] Behavioral coverage for surface accumulation/decay, pause/reset, camera/wrap,
   output and overload. Replace obsolete per-mark lifetime assertions.
5. [x] Update the living spec, architecture and FX skill to state the agreed model.
6. [x] Inspect firing/turn/release in browser, profile, run required gates, and leave
   a concrete playable result with evidence. Distinguish local work from deployment.

## Scope and concurrent work

At entry the Fiddler study page and five new Fiddler components/modules were already
modified/untracked by other work. Preserve those and any later unrelated changes;
stage only this correction. Do not change ship physics, dependencies, DS pages or Lab
page layout. This is a repair of the agreed FX model, not a new design study.

## Implementation decisions

- Canvas 2D is the first measured backend. Two rolling history images plus a reusable reprojection buffer permit combined
  camera reprojection and decay; an unchanged camera can decay in place. The final
  surface is added over the freshly drawn world. No per-frame gradients or blur.
- One shared decay governs accumulated light. Exact historical per-mark advection
  and finite lifetimes are superseded by image persistence; accepted ion identity
  remains the appearance reference. Source motion/phase can still be calculated.
- Historical comparison components keep their old mark painter outside production,
  so changing the framework does not silently rewrite the reference being compared.

- Owner theorycrafting during implementation: an oversized canvas or tiled canvases
  could follow the camera through browser transforms, avoiding per-frame image
  reprojection. Explicitly an idea, not an instruction to apply. Kept as an optional
  optimization candidate; this correction does not add DOM canvas layers.

## Verification notes

- Initial type check caught a study-only helper importing Zod from the web package,
  which does not declare it. Reused the existing core schema; added no dependency.
- Unit run: 145 passed. Focused browser run: five passed, including the new
  synthetic accumulation/pause/decay/camera tests. These precede the final gate.
- An initial browser-server start was denied by the local execution boundary;
  retry with permission succeeded. A fixed-preview server needed the same permission.
- The development-server profile at
  `artifacts/fx-profile/2026-11-03T12-59-07.376Z/report.json` was interrupted by
  hot reload during edits and exited nonzero. Its timing is not acceptance evidence.
- A subsequent fixed-preview attempt failed before measurement because its server
  had not started. The running fixed-build measurement supersedes that attempt.

## Owner playtest — 2026-11-03

During implementation the owner played the local builder build with gravity wells,
gravity coils and many ion engines. They described it as "very beautiful, exactly
as we imagined the first time" and "much better than before" visually. They said it
moved "smooth-ish" and explicitly had not measured performance. This is positive
appearance feedback for that setup, not timing or physical-mobile acceptance.
The fixed-build copy at `/private/tmp/void-drift-fx-surface-preview-20261103` and
`artifacts/fx-surface-correction/ion-firing.png` preserve the reference for subsequent
optimization. No physics or stamp-art changes are intended during optimization.

The first uninterrupted moving-camera profile,
`artifacts/fx-profile/2026-11-03T13-03-58.704Z/report.json`, measured approximately
7.8 ms p95 update + FX submission in the final rolling windows on both desktop and
mobile viewport emulation. It ran at roughly 60 Hz but misses the 3 ms FX target.
This is a measured failure of the buffer path, not an appearance rejection.

## Graphics backend finding

`artifacts/fx-surface-correction/chromium-gpu.json` identifies the automated browser
as SwiftShader with `2d_canvas: unavailable_software` and
`gpu_compositing: disabled_software`. The 7.8 ms result remains valid for that
software path; it is not a hardware-accelerated GPU acceptance result. The profiler
now records backend features in subsequent reports.

In-app browser observations of the same fixed build, moving camera and 1920×1080
scene reported rolling p95 update + submission around 0.4 ms. One later snapshot
had 19,627 accumulated samples, a 0.1 ms median, 0.8 ms maximum and 9.3 ms p95 frame
interval (600-frame rolling window). These DOM-read counters are partial native
browser evidence, not an isolated GPU measurement or a sustained trace. Hardware
accelerated full-pipeline and physical-phone acceptance remain open.

Short synthetic comparisons tested opaque/transparent buffers, lower resolutions
and nearest-neighbor reprojection. Raw evidence is in
`artifacts/fx-surface-correction/buffer-comparison.json` and
`sampling-comparison.json`. They do not establish game-scene acceptance. No reduced
resolution or changed sampling was adopted; the owner's reviewed appearance remains.

## Smudge finding and correction

The owner observed tails failing to reach transparency in the fixed preview. The
single accumulated image's 8-bit multiplicative fade had a rounding floor; a
quiet-scene cleanup did not remove it during continuous emission. Fixed by retiring
shared image windows: two 0.5-second accumulation windows share one decay, with a
third reusable camera-copy buffer. Old light is fully cleared within one second
without tracking individual marks. No CSS blend workaround or lower resolution.
A synthetic browser regression keeps one source active and checks that another's
old pixels reach exactly zero opacity; all six focused browser checks pass.

The first isolated full run (`2026-11-03T13-16-31.800Z-xSZ2jw`) passed contracts,
commit checks, lint, types, 145 units, build, 38 browser checks and Firestore rules.
Its two-pilot competition check timed out; this is a failed full run, not a pass.
The earlier main-checkout run additionally failed types in concurrent Fiddler work
and reported a changed source fingerprint. Both are retained for attribution.

The competition timeout was investigated without changing game state or assertions:
real simulation showed idle runs last 1,905 ticks each, while powered Scout/Corvette
runs last 667/1,247 ticks. The fixture now holds the normal forward key and checks
completion each simulated second. It still allows 150 simulated seconds and keeps
its 60-second wall deadline, real deaths, two distinct identities, score submissions
and third-reader assertions. Tracing with/without screenshots did not materially
change a ten-second clock sample (~5.9 seconds wall); no trace coverage was removed.

## Final result

All gates passed in the isolated FX checkout:
`artifacts/verification/2026-11-03T13-29-26.186Z-iuEndY/report.json`, unchanged source
fingerprint `fa72056744c0d43d8ca7957fe368d048e1e7d4750f99392a7c9a4129328005e1`.
145 unit, 39 browser, 10 rules, one competition and five factory checks passed.
The complete source files matched the working checkout before final evidence edits.
The one-second competition polling fixture passes without extending its timeout.

The final sustained software-rendered profile is
`artifacts/fx-profile/2026-11-03T13-33-43.652Z/report.json`: uninterrupted capture,
no page errors, ~14.5 ms final rolling p95 submission and ~33.4 ms frame p95. It
misses the performance target on that fallback. Final in-app observations span
0.4–0.6 ms p95 submission and ~9.1–9.2 ms frame p95. Full GPU and phone acceptance
remain open. See [the loop record](../loop-evidence/2026-11-03-fx-surface-repair.md)
for evidence scope, failures and local publication status.
