# Brief: continue the layered renderer, starting with the stamp gaps

Written 10 November 2026 on `feat/0-5-0` at `20b7598`, as a handoff from the
session that specified the render model and split the flight canvas into
layers. It is a brief, not a decision record: check it against the specs and
the code before acting.

> **Current decision (10 November 2026):** The designer has resolved the
> rendering-layer-model blocker for further large-game testing. Adopt World
> normal, FX screen with Turbulent bloom at 12 CSS px glow / 16 CSS px
> distortion / 90% strength, and LFX hard-light without a filter. This clears
> the layer-model testing gate; it does not resolve the engine-stamp continuity
> criteria in this brief.

## Your task

Fix the engine light's stamp gaps on the FX layer. This is step 3 of the
[route](2026-11-10-layered-renderer-route.md) and the project's declared
blocker ([blocker plan](2026-11-10-fx-stamp-gaps-blocker.md)). Start by
planning: read, confirm the approach below against the code, and put the open
decisions to the designer before building.

Done looks like:

- The three open items in the render spec's Definition of Done hold and are
  ticked, each with a test: interval coverage, rate independence, breaks.
- The Flight scene study's reproduction (Follow 4×, B1, tick 215) shows one
  continuous trail in the turn.
- Brightness of a source at rest is unchanged.
- Frame time on `/lab/fx` is measured before and after and reported.
- The effects spec is updated in the same change.

## Read first, in this order

1. `docs/specs/game/render/spec.md`: the render model. "The demo-scene method",
   "Time" and the three persistent-layer rules are what you build to.
2. `docs/plans/2026-11-10-layered-renderer-route.md`: what was decided, what is
   still assumed, and what step 2 built and found.
3. `docs/plans/2026-11-10-fx-stamp-gaps-blocker.md`: the fault, the
   reproduction and what was ruled out. Its "How light is actually composed"
   section describes the code before the split and is now out of date.
4. `docs/specs/factory/effects/spec.md`, "Time and space" and "Bounded load".
5. `.agents/skills/fx-development/SKILL.md`.

Code:

- `packages/mode-a/src/lib/flight-frame.ts`: `FLIGHT_LAYERS`, `FLIGHT_PASSES`,
  `drawFlightFrame`. The "Accumulated light" pass is where emission enters the
  frame.
- `packages/core/src/lib/effects/fx-surface.ts`: `FxSurface.draw`. It fades the
  history by game time and scales fresh emission by
  `2.2 × (1 − retention(elapsed))`.
- `packages/core/src/lib/effects/engine-plume.ts`: `EnginePlume`. `stepMounted`
  runs every tick; `stamp` paints each outlet once per frame at its latest
  pose. This is the fault.
- `packages/core/src/lib/effects/arcade-fx.ts`: `FxPass` and `FxBudget`.
- `packages/core/src/lib/effects/ion-beam.ts`: the cached beam stamp.
- `packages/mode-a/src/lib/gravity-fold-fx.ts`: `FlightFx`, which calls
  `sim.plume.stamp` and the other sources.
- `packages/mode-a/src/lib/simulation.ts`, around line 371: `plume.clear()` on
  arena wrap.
- Tests that exist: `packages/core/src/lib/effects/engine-plume.test.ts`,
  `tests/browser/fx-surface.spec.ts`, `packages/mode-a/src/lib/flight-frame.test.ts`.

## Where things stand

- The flight screen draws on three stacked canvases, World, FX and LFX
  (`apps/web/src/components/FlightLayers.svelte`). The browser adds FX and LFX
  with CSS `plus-lighter`. `/lab/render-model` shows the passes and can Solo
  any of them.
- The stamp gaps are untouched. Light is still stamped once per rendered frame
  at each source's current position.
- Studies and benches that draw the frame themselves still use one canvas:
  `packages/mode-a/src/lib/fx-bench.ts` and
  `apps/web/src/components/studies/flight-scene.ts`. The second is the
  blocker's reproduction, so it does not yet show the layered picture.

## The approach to confirm

Advised by the previous session; not built, not measured.

1. `EnginePlume` keeps the last eight tick poses per emitter slot. Key by
   emitter slot, not by active index, which reshuffles when an engine switches
   on or off.
2. `FxPass` carries the game time the current emission covers; `FxSurface`
   already knows it as `elapsed`.
3. `stamp` walks the pose history back over that time, interpolating position
   and angle, and paints the existing cached beam at each sample. A sample
   covering ages `a` to `b` gets weight `2.2 × (retention(a) − retention(b))`.
   The weights sum to today's opacity, so a still source is unchanged and a
   frame covering two ticks equals two frames covering one each.
4. Sample count follows screen distance: the larger travel of nozzle and tail
   tip, over about one core width, capped per outlet.
5. One essential budget take per outlet covers its samples.
6. `clear()` drops the history, so a wrap or reset leaves no connecting streak.
7. Put the sampling in a shared core helper, engines first, so the other moving
   sources can adopt it one at a time.

Sub-stamps were recommended over a swept shape because they reuse the accepted
beam image and leave the look at rest identical.

## Ask the designer before building

- **Is straight-burn banding a fault?** The demo-scene method keeps cheap
  artefacts as style. The ladder of separate beams in a turn is a fault; the
  banding along a plume may not be.
- **Zoom range.** Likely from 4× out to the whole system in view, not decided.
  At 4× a fast ship covers about 50 screen pixels per tick, which sets the
  sample cap and the cost.
- **FX resolution.** A lower-resolution FX layer needs fewer samples and
  changes the trail's look. Still "dunno, sounds good".
- **Sub-stamps or swept shape**, if sub-stamps look wrong at Follow 4×.

## How to check a picture change

The previous session compared the picture before and after a change like this:

- Open `/lab/render-model`, wait until the tick counter moves, then Pause and
  Restart. Advance with Step, one click per tick, waiting for the section's
  `data-ticks` to change each time. One tick per frame makes the FX layer
  repeat exactly: two such captures were byte-identical.
- Screenshot the `.frame .stage` element at chosen ticks with Playwright and
  compare pixels.
- Clicking before the page hydrates does nothing, so wait for ticks first.

For this task the scene needs a hard turn at speed; the render model scene
flies a gentle program. Either add a view to that page or move the flight-scene
study onto `drawFlightFrame` and `FlightLayers` first (route step 6), which
also makes the reproduction show the real layers.

## Gotchas

- **Commits take the whole tree.** Every session shares this checkout, and
  another session's commit swept the canvas split into its own docs commits.
  Stage only your files, and check `git status` before you commit.
- **Do not edit source while the browser suite runs.** The test server
  hot-reloads from the same files.
- **`drawSunFields` reads the canvas's CSS width** for its dash sizes, so the
  same frame draws different dashes in a differently sized element.
- **The aperture rims changed in the split.** Light is now removed before it is
  added, so rim pixels under saturated light are brighter than before. This is
  recorded in the route plan and is not a regression to chase.
- **Lab pages target 1280px wide and up.**
- Dev server: `pnpm --filter web exec astro dev --port 4330`.

## Not in this task

- Tuning the look: LFX hard-light against screen, pixelated scaling, CSS
  filters (route step 5).
- Rebuilding the render model page on per-layer controls (route step 4).
- The countdown's split between LFX and FX, which is open.
- Moving or cleaning the effects spec out of `factory/`.
