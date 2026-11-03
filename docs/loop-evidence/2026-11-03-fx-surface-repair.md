# Persistent FX surface repair — 2026-11-03

## Intent and owner decisions

The owner found the 0.5.0 engines looked like protruding sticks. Discussion clarified
that the intended FX model was a persistent light surface: stamp fresh light,
add overlapping stamps, and fade the accumulated image together. The owner authorized
the repair. Per-engine trail objects and separate attached beams were removed.

The owner played the local builder with gravity wells, coils and many ion engines
and called the appearance "very beautiful, exactly as we imagined the first time"
and "much better than before". They reported "smooth-ish" motion and explicitly
had not measured performance. This feedback preceded the final rounding-residue fix.
Their separate oversized/tiled canvas idea was theorycrafting, not an instruction;
no browser-transformed canvas layers were introduced.

## Delivered behavior

- Shared additive image persistence in play and production Lab, with cached complete
  Light/Heavy ion stamps. Current outlets replace per-engine historical marks.
- Game-time decay, frozen pause, empty reset and camera reprojection. Wrapping starts
  new stamps without bridging the arena. Lab seeks replay the visible painting interval.
- Old light clears while other sources remain active: two rolling image windows
  eliminate the 8-bit rounding floor, using one common decay and a reusable third
  buffer for camera copies. No reduced resolution or sampling change was adopted.
- Spec, architecture, development guidance and FX skill describe the corrected model.
  Historical ion comparisons retain their study-only history outside production.

## Verification

Full isolated run: `artifacts/verification/2026-11-03T13-29-26.186Z-iuEndY/report.json`.
All stages passed; `sourceUnchanged: true`. Base revision
`2d83bc50d1d772f83d18c0fe26713dd037752352`, dirty FX source fingerprint
`fa72056744c0d43d8ca7957fe368d048e1e7d4750f99392a7c9a4129328005e1`.
Node 26.8.2, darwin/arm64, Java 21; browser ports 4354/4355; demo Firebase project.
145 unit tests, 39 browser tests, 10 Firestore rules checks, one two-pilot competition
check and five factory tests passed, plus lint/types/contracts/commit checks/build.
The isolated checkout was `/private/tmp/void-drift-fx-surface-verify`; all selected
files matched the main checkout byte-for-byte before these final evidence updates.

The main-checkout attempt (`2026-11-03T13-13-35.558Z-h3a7a0`) failed types in the
concurrent Fiddler study, source stability, and the competition timeout. The first
isolated attempt (`2026-11-03T13-16-31.800Z-xSZ2jw`) passed other gates but timed out
in competition. A powered-flight attempt with ten-second clock chunks also timed
out. The final fixture drives real forward input and checks completion each second;
its 150-second simulation bound, 60-second wall deadline, distinct identities, real
run completion, submission and third-reader assertions remain. No production test
hooks, trace removal or assertion weakening were introduced.

The new synthetic Canvas checks protect accumulation, pause, decay, camera mapping,
reset, discontinuous placement, and exact transparency during continuing emission.
They do not lock the ion painter or screenshots. Skill validation passed.

## Performance and appearance evidence

The owner-approved full-resolution stamp art remains. The final in-app browser
snapshot at 4,272 accumulated samples reported a rolling 0.1 ms median, 0.4 ms p95
and 0.8 ms maximum update + FX submission, with 9.2 ms p95 frame interval. This is
DOM-read native browser evidence over the latest 600 frames, not an isolated GPU
measurement. The moving-camera scene uses a 1920×1080 backing surface, six ships,
two stations, sixteen missiles and twelve fires.

The first development-server profile was invalidated by hot reload. An uninterrupted
pre-expiry-fix moving-camera profile measured ~7.8 ms p95 submission in Chromium's
software renderer. `artifacts/fx-surface-correction/chromium-gpu.json` identifies
SwiftShader, software Canvas and disabled GPU compositing. Reduced-resolution and
sampling experiments are retained as diagnostics; neither was adopted. The profiler
now includes graphics backend features to make this limitation visible.

Final software profile:
`artifacts/fx-profile/2026-11-03T13-33-43.652Z/report.json` records uninterrupted
60-second desktop and mobile-viewport runs after five-second warmups, with no page
errors. Final rolling p95 update/submission was ~14.5 ms and frame interval p95
~33.4 ms on both. This software fallback misses the declared FX performance target;
the script's successful exit means evidence collection completed, not performance
acceptance. Across rolling windows, desktop p95 ranged 14.5–14.8 ms (20.5 ms max);
mobile viewport emulation ranged 14.4–21.1 ms (26.2 ms max). Maximum frame interval
was 33.5 ms on both. The recorded backend confirms software Canvas/compositing. A later
in-app snapshot (35,183 samples) showed 0.2 ms median, 0.6 ms p95, 0.8 ms maximum
submission and 9.1 ms p95 frame interval. Earlier final-code observation was 0.4 ms
p95, so reported native observations span 0.4–0.6 ms. Physical-phone performance and
isolated attributable GPU cost remain unverified; the whole-pipeline 3 ms acceptance
is not claimed. Owner approval covers the builder ion/gravity combination, not every
fixture or possible overlap.

## Publication and concurrent work

This is a local correction to the released 0.5.0 source. No version/tag change,
push or Firebase publication is part of this loop. The running local builder is at
`http://127.0.0.1:4347/lab/builder`; the fixed preview is at
`http://127.0.0.1:4348/lab/fx/?camera=moving` and includes the transparency correction.
Unrelated Fiddler page/component edits were preserved and excluded from the isolated
verification and this repair's commit. Local artifacts and temporary preview folders
are inspectable evidence, not durable backups.
