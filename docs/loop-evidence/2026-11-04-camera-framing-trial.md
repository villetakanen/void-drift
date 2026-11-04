# Camera framing trial (2026-11-04)

Loop record for a playable trial of
[2026-11-04-camera-framing.md](../plans/2026-11-04-camera-framing.md). Evidence
only; it does not decide what follows.

## Intent and scope

- Plan: frame the ship's outline, the closest gravity source's centre and the top
  prioritized field target inside the active camera box on every frame, with
  continuous dynamic zoom replacing the 0.3.1 stepped levels.
- Owner decisions in the plan (2026-11-04): continuous dynamic zoom; the closest
  gravity source; target list energy cells, then intact derelicts, within 600 u;
  Balanced box margins 220 / 64 logical px.
- The owner asked for slices 1–5 to be built in a separate git worktree off
  `feat/0-5-0` (0084569), so survival and test flight could be flown without
  changing the active branch. Slice 6 (owner flight) was the trial.

## Changes delivered (not on `feat/0-5-0`)

- Local commit `90c79e4` on branch `claude/camera-framing-impl-5bd4f9`, parent
  0084569. Not pushed, not merged. The worktree was removed after this record;
  the branch ref was kept on the owner's choice, so the commit stays reachable.
- Contents: new `docs/specs/camera.md`; `camera` tuning section and
  `CameraTuningSchema`; `FlightSettingsSchema.camera` defaults from the tuning and
  drops legacy `zoomSteps`; core `Camera.frame(subjects, framing, dt, snap)` with
  log-scale zoom easing, separate in/out rates and a hard box constraint;
  `camera-subjects.ts` subject selection with a switch margin; FlightDeck and
  Flight Lab panel wiring; gravity-fold study given a frozen copy of the stepped
  camera; unit, scripted-flight and browser tests.
- First tuning flown: padding 80 px, pan smoothing 4/s, zoom-in 1.2/s,
  zoom-out 4/s, max zoom 1.6, switch margin 0.15, widest zoom fitting the arena
  radius + 120 u in the box.

## Checks

- `pnpm verify` (full), on 0084569 plus the uncommitted slices 1–5 (dirty tree):
  **failed**. contracts, commits, types, test, build and test:browser passed.
  lint failed on `tsconfig.check.json`, a file unchanged from 0084569. rules and
  competition did not run: no Java on PATH.
- `pnpm test:backend`, same dirty tree, with `JAVA_HOME` set to
  `tools.local/java21/jdk` (Temurin 21.0.13): **passed** (rules and competition).
- `pnpm exec vitest run` on the tree committed as 90c79e4: **271 passed**. This
  includes scripted flights (planet dive, derelict pass, wreck break, wrap, close
  star pass) at 1920×1080 and 844×390 that keep the subjects in the box on every
  frame, and a framing-on/off determinism check.
- `pnpm exec biome check apps packages tests docs` on that tree: **passed**. The
  repository-wide `pnpm lint` was not rerun after the commit.
- `FX_PROFILE_CAMERA=moving` profile, dirty tree, dev server: **measured, not a
  gate**. Headless Chromium with SwiftShader software rendering, Apple M4 Max,
  darwin/arm64. Desktop and mobile emulation: frame p50 16.7 ms, work p95 9.6 ms,
  0 dropped. `/lab/fx` pans with its own code, not the game camera.

Node 24.14.0. Playwright ports 4352/4353.

## Agent-side browser observations (before the owner flight)

Scripted samples of `data-ship-screen-*` and `data-camera-box` on the worktree
dev server (port 4350), driven by synthetic key events:

- Survival: 24 samples, all inside the box (220 64 1700 1016). Zoom held at 1.6
  near the start planet, then eased out towards 1.38. While it eased out, the
  ship sat about one ship radius inside the box's left edge (x ≈ 263–265 px).
- Test flight: 100 samples over 25 s, 0 outside the box; zoom ranged
  0.67–1.6. Two salvage passes occurred. Whether a target was selected during
  the samples was not recorded.

## Owner feedback (2026-11-04, after flying both modes)

- Quote: "It clearly shows this idea does not work at all."
- Symptoms the owner selected: constant zoom motion; ship too small / far;
  jumps on subject switch. Not selected: ship pinned at the box edge.
- Parts of the idea the owner judged failing: framing the gravity source;
  framing the target; multi-subject framing. Not selected: dynamic zoom itself.
- Modes: the failure showed in both survival and test flight.

## Evidence gaps

- Verification, backend and FX profile artifacts lived in the worktree's ignored
  `artifacts/` directory (verification run `2026-11-04T08-37-13.281Z-YzjO0o`,
  backend run `backend-67Mfnb`, profile `2026-11-04T08-39-18.802Z`). They were
  deleted with the worktree; only the outcomes above remain.
- Only the first tuning was flown. No other padding, rates, margins, target
  radii or switch margin were tried.
- No full `pnpm verify` ran on the committed revision 90c79e4.
