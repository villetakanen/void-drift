# Persistent FX surface repair — 2026-11-03

Closed at the owner's request after the approved 0.5.0 publication. This record
covers the FX repair, integration and release through source `0f3414f` and release
evidence commit `0719198`. Delivery is recorded separately from the outstanding
composition, performance and whole-scene experience acceptance in the FX spec.

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

## Publication and concurrent work at repair closure

This is a local correction to the released 0.5.0 source. No version/tag change,
push or Firebase publication is part of this loop. The running local builder is at
`http://127.0.0.1:4347/lab/builder`; the fixed preview is at
`http://127.0.0.1:4348/lab/fx/?camera=moving` and includes the transparency correction.
Unrelated Fiddler page/component edits were preserved and excluded from the isolated
verification and this repair's commit. Local artifacts and temporary preview folders
are inspectable evidence, not durable backups.

## Later owner-approved 0.5.0 publication

The owner subsequently authorized committing, pushing and releasing the complete
checkout, stating that other agents were stopped. Their Fiddler study rounds and
helpers were included in `88c581c`, preserving the open study status. The FX repair
itself is `eee9b6a`. No further production FX changes were needed for integration.

Combined verification first failed only release-plan formatting
(`artifacts/verification/2026-11-03T14-04-44.077Z-M5471a/report.json`). After that
documentation repair, full `pnpm verify` passed at clean source
`0f3414fd3980c50b12422eef4e9db50db1a7a8f3` with `sourceUnchanged: true` and no
skipped gates. Report:
`artifacts/verification/2026-11-03T14-07-51.044Z-iMoLgY/report.json`.
145 unit, 39 browser, 10 rules, one competition and five factory tests passed, plus
contracts, commit checks, lint, types and build. This run used Node 24.14.0 on
darwin/arm64, Java 21 and ports 4354/4355. It is new combined-candidate evidence,
not a replacement for the earlier failed/isolated attempts.

The owner requested plain 0.5.0 without an extra alpha label and explicitly approved
moving the already-published tag from `7e15fc9` to `0f3414f`. Source and tag were
pushed; a production build from that clean source was deployed to Firebase hosting,
with rules/indexes released. GitHub release:
https://github.com/villetakanen/void-drift/releases/tag/v0.5.0.

Live checks passed at 14:12:15 UTC, with no page errors: flight/pause, moving-camera
FX, ion firing/fade controls, Hangar defaults/view modes, shared controls, latest
Fiddler view interaction, utility assets, anonymous Auth and score reads. No score
was submitted. Separately, 204 checked live pages and JS/CSS files matched the built
artifact. Evidence: `artifacts/release-0.5.0-refresh/live-smoke.json`,
`live-artifact-match.json`, manifest, deployment log and screenshots in that directory.
The checkout moved to `feat/0-5-0` for subsequent development. Full publication
identifiers and artifact fingerprint are in `docs/releases/0.5.0.md`.

These release checks do not close the performance gaps recorded above. The owner
feedback remains local-builder feedback; automated live success does not establish
acceptance of every visual combination or the complete 3 ms rendering target.

## Closure inspection and evidence limits

On closure, direct inspection of the tagged `FxSurface` implementation, repair and
integration commit changes, FX contract, five named verification reports above,
production manifest, deployment log, live smoke and artifact-match reports confirmed
the recorded revision boundaries and check outcomes. The retained software profile
and in-app timing snapshots were also available and inspected. No application tests,
live probes or deployments were rerun for closure; only this record was changed and
checked with the repository's documentation formatter/linter and a whitespace check.

The repository had subsequently advanced to `c9b115c` on `feat/0-5-0`, with a separate
[0.5.1 publication record](../releases/0.5.1.md) and unrelated working changes. Those
later changes and their verification are outside this loop. The local `v0.5.0` tag
still resolves to `0f3414fd3980c50b12422eef4e9db50db1a7a8f3`. The earlier clean-checkout
and live-site observations above describe their recorded times, not the checkout or
deployed version at this later closure. Current remote/live state was not rechecked.

The [FX contract](../specs/factory/effects/spec.md) still leaves **FX-01** composition review,
**FX-07** performance and **FX-08** whole-scene experience open. Its header records
the earlier local-verification stage; the subsequent publication evidence is dated
above. No acceptance flags were changed by closure. In-app observations do not
record a browser version or graphics backend and do not establish isolated GPU
cost. At that inspection, physical-phone evidence was unavailable; software fallback misses the
declared budget. The positive owner feedback concerns the local builder before the
final residue cleanup, not an explicit review of every released effect combination.

Verification reports, profiles, manifests, logs and screenshots under `artifacts/`
are ignored local files. They were present for this inspection, but are not durable
repository attachments. The tracked record retains their essential outcomes and
identities; temporary checkouts and preview servers have no retention guarantee.
No lessons, signals or standing process changes were derived during closure.

## Physical-device owner report and final closure

After receiving the live Lab links, the owner pasted the six-ship FX instrument's
readout and identified the device/browser as "Pixel 8/chrome". This is an
owner-reported physical-phone observation, received on 3 November 2026, rather than
an agent-run profile. The workload was six ships, 24 main engines, 12 collectors,
two stations, 16 missiles and 12 fires.

- Update + FX submission: **1.00 ms median, 1.40 ms p95, 4.10 ms maximum**.
- Frame interval: **16.80 ms p95**.
- Activity: **36 activation cues, 185/1024 decorative marks, 105/256 sparks**.
- Dropped requests: **0**.

Source: the owner's pasted readout and subsequent device identification in this
chat. The exact deployed revision, Chrome/OS versions, camera setting, warmup and
sample duration were not captured. No trace or screenshot accompanied the report.
The counter measures update plus FX submission; it does not isolate GPU/compositor
work. This adds physical-device evidence without retrospectively changing the
earlier software-rendered measurements or certifying the complete 3 ms target.

The owner then asked whether the loop was ready to close. The repair and release
loop remains closed with this follow-up recorded; full-pipeline timing and the
remaining human-review criteria retain their stated limits. Only this evidence
record was updated and documentation checks were run. No application change,
deployment, new test run or acceptance-flag change was made for this follow-up.
