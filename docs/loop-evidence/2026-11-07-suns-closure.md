# Suns study closure — 2026-11-07

Outcome: accepted design study, closed at the owner's request. Production integration and the polished Suns article remain separate delivery work.

## Intent and scope

[Study](../../apps/web/src/pages/lab/studies/suns-2026-11-07.astro): connect real stellar characteristics, fiction and playable energy/hazard decisions, then express those decisions through the HUD. The initial stellar-variety question was narrowed to the standard Sun. Other stars and artwork/effects redesign were deferred to the [confirmed follow-up](../plans/2026-11-07-stellar-variety-follow-up.md).

The owner approved the mechanics and then the HUD model, judged the result ready to proceed, and requested closure. Sections 03 and 04 now describe readiness and ordered delivery slices; study registry status is accepted.

## Accepted decisions and local outputs

- Standard G Sun: radius 35 u, shoulder 20 u beyond the surface (55 u from centre). Collection peaks at 7.5 E/s per collector-equivalent through the shoulder, declines linearly to 0.75 E/s at the unchanged gravity reach (approximately 324 u), and is zero outside.
- Damage peaks at 1.5 hull/s through the shoulder, declines linearly to zero at 100 u from centre, and is zero beyond. This is independent of collection and gravity reach.
- Life support 0.8 E/s; Light ion draw 1.0 E/s with thrust/handling unchanged. Every ship inherently has one collector-equivalent without a fitting; fitted collectors add. Wasp is the reference ship. Optional repair's 0.2 E/s was a comparison assumption, not a repair implementation commitment.
- Android-green HUD: dashed gravity, solid solar, brighter active solar with 3.3% green fill. Hazard is dotted amber when inactive and dotted red with 11% red fill when active. All strokes remain 1 CSS px. At coincident boundaries, solar is visually inset 2 CSS px while both lines are visible; physical reach is unchanged.
- Local study components include energy-budget/path experiments, overlaid energy/hull comparisons and an animated HUD fixture using production Sun/Wasp artwork. The fixture forces states and representative positions; it is not live flight or resource simulation.
- Shared Path instrumentation gained energy measures/graphs; reusable energy-field configuration and production integration remain delivery work. See the [Motion instrument contract](../specs/lab/motion-instrument/spec.md).
- Approved fills default enabled in the comparison controls; actual fills still require the corresponding active state.

## Owner assessment and interpretation

Source: closing conversation on 2026-11-07. The owner described this as successful work, despite an initially overlarge question, and said the model now supports meaningful game behaviour and its visual expression.

Exact owner statement: “the first one, zero one, should never proceed unless we have a clear problem worth studying.”

The owner explicitly asked to preserve the lesson that starting with a meaningful game-design problem produced useful visual expression here; starting by inventing graphics without that meaning would not. The owner also attributed generative quality to task clarity rather than model fault. These are the owner's assessment and interpretation of this loop, not independently established causal findings about models or all design studies. This record preserves them for later lesson review. No skill, standing process or section-01 gate was changed by closure.

## Verification evidence

Work was inspected in a mixed, uncommitted workspace. HEAD at closure was `536cef2d4eaa932085acbffc3a2c643f116cd1e8`; that commit does not identify or contain all study changes. Concurrent unrelated work is present and was left untouched. Historical checks below refer to their respective dirty-tree states, not a reproducible clean revision.

- `pnpm --filter web exec astro check`: 210 files, zero errors/warnings/hints. [Retained report](artifacts/2026-11-07-suns/astro-check.log), originally `/tmp/suns-final-check.log`; directly inspected at closure. Run after readiness/scope finalization, before closure metadata changes.
- `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`: zero errors/warnings for the initial HUD preview. [Retained report](artifacts/2026-11-07-suns/svelte-check.log). This predates later HUD tuning.
- Ad hoc Playwright browser checks in this conversation: state toggles, disabled dependent controls, 1 px non-scaling strokes at zoom extremes and display densities 1/2; subsequent checks measured the solar inset at approximately 2 px at both zoom extremes. Viewports were 1280 px or wider. Results were successful; scripts/output were conversational, not retained as a test suite.
- Browser checks of the earlier 5%/5% fill variant confirmed inactive fills absent, active fill opacity 0.05 and strokes 1 px, with no page errors. [Retained screenshot](artifacts/2026-11-07-suns/hud-earlier-5-percent-fills.png) was visually inspected. It is historical evidence, **not** the final 3.3%/11% appearance.
- Final opacity changes were inspected in source and formatted with Biome; owner subsequently approved both fills. No final-opacity browser capture is retained.
- Earlier charging tests were reported passing in the session summary (four tests); their run log/revision is unavailable here, so closure does not count this as freshly verified evidence.
- No full regression suite or production playthrough was run for closure. No tests were rerun to backfill historical evidence. Documentation formatting is the closure validation.

## Delivery state and remaining limits

Local working changes only for this study; no study-specific commit, push, deployment or published article was established by this loop. The localhost preview is inspectable evidence, not a deployed release.

Production still requires shared collection/damage definitions, energy-cost integration, all-ship collector verification, actual resource-driven HUD states, battery saturation/depletion and contact validation, shared Path configuration and the Suns article. The preview cannot establish those behaviours or final gameplay feel. The owner accepted the design model, not unperformed production verification.
