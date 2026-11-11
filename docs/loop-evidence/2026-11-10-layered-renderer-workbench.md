# Layered renderer and workbench — loop evidence

Closed 10 November 2026 (Europe/Lisbon). Sources: this session's conversation,
local commits, inspected source, verification reports, and captures. This record
collects evidence; it does not certify release readiness or establish lessons.

## Intent and designer decisions

- Establish an understandable rendering model and a usable layer workbench.
  The designer redirected work from a flight study and simulation-like demo
  toward one pane for inspecting World, FX, and LFX independently.
- Hi-Fi Lo-Fi means using inexpensive browser rendering and its artefacts for
  expressive graphics. Straight-burn banding is acceptable; zoom limits remain
  exploratory. FX remains at full stage resolution.
- The workbench evolved from circles to a stationary rotating production Wasp,
  real engine/stabilizer plumes, and three horizontal ion beams. Beams pulse
  at 3 Hz with the production 80 ms flash and persistent FX dispersal.
- The designer rejected periodic history cleanup: faint near-black residue is
  acceptable; abruptly removing it is not. Adopted black source-over fading
  before fresh additive stamps, with no timed cleanup or threshold.
- Adopted shared defaults: World normal/no filter; FX Screen with static
  Turbulent bloom (12 CSS px glow, 16 CSS px distortion, 90% strength); LFX
  Hard light/no filter. The game, workbench and performance bench share the
  preset and filter definition.
- The designer explicitly clarified that the Flight scene study is ongoing,
  was blocked by the renderer, and should inherit shared defaults. It is not
  a retired trial. Its registry remains open/exploration.
- The designer said the layer-model blocker is cleared for further game
  testing. This did not establish completion of the separate interval-coverage,
  rate-independence and discontinuity criteria in the render spec.
- Implementation used user-requested Luna implementation / Terra review loops,
  bounded to three review rounds per increment.

## Delivered revisions and working changes

- `f6bcdde`: Flight scene uses shared rendering layers.
- `d0fd3fe`: replaces the render demo with a layer workbench.
- `aea0f84`: native filter controls and production artwork comparisons.
- `f367c07`: rotating Wasp, pulsed ion layers, corrected shared paired
  stabilizer visual outputs; flight impulses were not changed by that fix.
- `a87e31e`: persistent black fading, no periodic cleanup, separate layer specs.
- Turbulent bloom and adoption of the final preset remain working changes at
  closure. Shared owners are `apps/web/src/components/FlightLayers.svelte`,
  `TurbulentBloomFilter.svelte`, and `turbulent-bloom.ts`.
- Current HEAD at closure inspection is `f4babc1`, another session's survival
  change. The checkout also contains concurrent performance-bench and ongoing
  study edits, including new 02.3/02.4 components. They are not all attributable
  to this loop. No whole-tree commit was made during closure.

Contracts: [render](../specs/game/render/spec.md),
[World](../specs/game/render/world.md), [FX](../specs/game/render/fx.md),
[LFX](../specs/game/render/lfx.md),
[workbench](../specs/lab/render-model/spec.md).
The separate [performance-bench record](2026-11-10-render-performance-bench.md)
owns that session's measurements; this loop does not reinterpret them.

## Verification evidence

Environment: local macOS arm64, Node v24.14.0, Chromium through Playwright.
Lab captures used 1280px and 1440px widths. Gameplay tests also covered narrower
viewports. These were dirty-tree runs, not checks of an immutable final commit.

- `pnpm verify:quick`: contracts, lint, types and units passed for the black-fade
  increment in [this report](../../artifacts/verification/2026-11-10T21-04-56.322Z-XsiVie/report.json).
  Source unchanged during that run. Quick mode is partial, not full verification.
- The same selected checks passed for optional bloom in
  [this report](../../artifacts/verification/2026-11-10T21-55-16.341Z-N14fYK/report.json),
  also with unchanged source during the run.
- Initial final-adoption quick run [failed](../../artifacts/verification/2026-11-10T22-21-13.367Z-gnphrF/report.json):
  bloom control state inferred literal types, plus concurrent study/evidence
  lint failures. The three controls were changed to explicit numeric state.
- Final quick [report](../../artifacts/verification/2026-11-10T22-22-21.081Z-uqilU9/report.json):
  contracts/types/units passed; lint failed on Markdown table formatting.
  The table was subsequently formatted and standalone `pnpm lint` passed in
  the root terminal. The quick report remains failed and records
  `sourceUnchanged: false`; it is not a final clean-tree certificate.
- Luna reported 15/15 focused Chromium tests passing after the final migration:
  `PLAYWRIGHT_PORT=4324 pnpm exec playwright test` with
  `tests/browser/flight-deck.spec.ts`, `flight-scene.spec.ts`,
  `render-model.spec.ts`, and `render-performance.spec.ts`.
  These check actual-play filter URL/graph values, distinct instance IDs,
  explicit overrides, held pixels, and relevant lifecycle behaviour.
- An initial 700px flight-deck case failed to enter play. It passed on an
  isolated rerun and in the final focused run; no causal explanation was
  established. An earlier study assertion expected the removed Expand graph
  while another session migrated that study to shared defaults; it was updated
  to the current shared-default contract.
- Root directly observed final `pnpm build` pass (70 pages, terminal output).
  Final browser/build/standalone-lint output is session evidence; dedicated
  immutable log artifacts for those invocations were not retained here.
- Full verification, backend/rules/competition checks and performance testing
  of the final 90% preset were not run in this loop. No tests were rerun solely
  to create this closure record.

## Visual and human evidence

Root and Luna inspected [active game](../../artifacts/adopted-render-defaults/game.png)
and [workbench defaults](../../artifacts/adopted-render-defaults/render-model.png)
at 1440×1000. Earlier held-pose captures compare
[unfiltered FX](../../artifacts/turbulent-bloom/baseline.png) with
[optional bloom](../../artifacts/turbulent-bloom/bloom.png); those use the earlier
4/6/50 preset, not the adopted 12/16/90 preset. Captures are local artifacts and
may not be retained with tracked documentation.

The designer said the tool “does exactly what I wanted” before the black-fade
change, while reporting ghosting that disappeared abruptly. At closure the
designer said the model is close to the intended result and “it seems to work”.
These are attributed observations, not universal performance or visual guarantees.

The designer also said this session was too long for their taste and token
usage. That feedback is recorded without deriving a process rule or lesson.

## Publication and remaining uncertainty

The listed commits are local history. Final preset adoption is uncommitted in
the shared checkout. No push or deployment was performed by this session.
Local browser inspection is not deployed verification. Concurrent edits after
the checks are not covered by those results. Detailed raster/compositor cost,
supported zoom limits, and broader game testing remain outside this evidence.
