# Rock atmospheres — closed evidence record

Closed 16 November 2026 at the designer’s request. Study outcome: accepted,
phase: scope. This record covers the atmosphere/entry-effect study and its
Practice Earth handoff, not production delivery. It collects evidence and
explicit decisions; it does not propose process lessons.

## Intent and boundaries

Develop a readable atmosphere around existing rotating rock materials, then
show atmospheric entry as a shallow heat hazard. The designer selected Impact
with this atmosphere as placeholder Earth for Practice and concluded Earth
exploration for now. The earlier Earth and inhabited-world studies remain
stopped; their rejected designs were not accepted by this decision.

The final handoff request adds Venus-equivalent relative size/gravity. The
implementation prompt was delivered in chat for a Luna high session. This loop
did not implement production atmosphere damage or install Earth in Practice.

## Explicit decisions and feedback

These are designer decisions from the conversation, not general performance or
visual-quality claims:

- Clouds must obscure covered ground; preserve surface identity through openings.
  Opaque clouds were judged a major improvement. Cirrus was preferred; Cumulus
  and 20%/40% coverage maps were usable alternatives. Mixed weather was rejected.
- Accepted appearance: Impact, Cirrus, 91% lit-cloud brightness, original 02.11
  shadow (42%), shared sunlight, spherical shading, rock shadow 1.45, fixed blue
  Dayward rim with peaks 20° toward the Sun. Earlier 24% night selection was
  superseded after correction of cloud shading; the designer attributed the
  earlier adjustment to double shading.
- Existing useful study controls should remain available unless intentionally
  replaced or deprecated. Differential cloud/rock rotation was explicitly excluded.
- Atmospheric entry should communicate burning. Heat damage is primary; drag
  is secondary. The designer rejected plasma-like luminous blobs for this effect
  and objected to the blunt, uniform LFX arc, while allowing tapered vector shapes.
- Soft planet-facing LFX glow was accepted over the tapered crescent. Stronger
  flame emission toward the planet was also accepted. The curved band was then
  preferred among the FX marks but judged underplayed while skimming.
- Final heat settings: “180% and 150%, decided.” These mean band brightness and
  band width. LFX glow and planet-facing emphasis stay fixed.
- Production behavior: 1 hull/s in the outermost 30% of atmosphere, 2 hull/s
  deeper, plus small deceleration opposite current travel. An exact production
  drag coefficient was not selected; the study’s 0.8/s remains a fixture value.

## Delivered changes and retained sources

- [Accepted study, evidence, readiness and implementation scope](../../apps/web/src/pages/lab/studies/rock-atmospheres-2026-11-15.astro).
- [Study registry](../../apps/web/src/data/studies.ts): rock atmospheres accepted;
  prior Earth studies remain stopped and now link to the placeholder decision.
- [Study implementation](../../apps/web/src/components/studies/rock-atmospheres/AtmosphereFlight.svelte)
  and [heat painter](../../apps/web/src/components/studies/rock-atmospheres/heat.ts):
  shared Flight instrument, preserved controls, source-mark previews, fixed burns,
  atmosphere approaches and accepted band defaults with baseline sliders.
- [Flight instrument contract](../specs/lab/flight-scene-instrument/spec.md):
  reactive start and copied atmosphere/light presentation data. Production FX
  persistence remains shared rather than a separate study trail history.
- [Handoff](../briefs/2026-11-16-rock-atmospheres-handoff.md): the old 02.4
  instructions are explicitly superseded by the accepted scope.
- [Accepted atmosphere still](../../apps/web/public/studies/rock-atmospheres-2026-11-15/02-15-accepted-cirrus.png),
  [accepted heat at Follow 4×](../../apps/web/public/studies/rock-atmospheres-2026-11-15/02-16-accepted-heat.png),
  and [heat at Follow](../../apps/web/public/studies/rock-atmospheres-2026-11-15/02-16-accepted-heat-flight.png).
  Heat captures show Impact/Cirrus, B1, Skim, 0.45s, 180%/150%, soft LFX.
  They show the visual fixture without atmospheric damage, not production play.

The instrument is retained for a named continuing purpose: production adoption
comparison at matching burns/times, including entry and fading exit. Its other
options are references, not reopened decisions. No study-specific cleanup was
performed solely to create this evidence record.

## Revision and publication

Closure inspection found HEAD `49c2db95f240c59c05acd5b3ea4d601bc3ef0295`
with uncommitted changes and untracked assets. Historical checks ran on evolving
dirty trees; no exact historical tree hashes were recorded. The
[closure source manifest](artifacts/2026-11-16-rock-atmospheres/source-sha256.txt)
identifies selected files at evidence collection, not the earlier test revisions.

No commit, push or deployment was performed by this loop. Local browser review
used `http://127.0.0.1:4321/lab/studies/rock-atmospheres-2026-11-15#02-16`.
The workspace also contains unrelated/concurrent changes. At closure, untracked
`practice-impact.ts` and its schema were present; their implementation status
was not inspected and is not credited to this loop.

## Checks and limits

Environment: local macOS workspace, pnpm, Chromium via repository Playwright;
browser viewport 1280×1000. Hardware/browser build were not recorded.

| Check                                                                                                                                  | Outcome and evidence                                                                                                                                                                                                             | Revision limit                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec vitest run apps/web/src/components/studies/rock-atmospheres/encounter.test.ts apps/web/src/lib/flight-scene/flight.test.ts` | 7 tests passed; tool output in this chat, 16 November. Encounter test covers all 840 ticks of B1–B3, Outside/Skim/Deeper, exposure and no solid contact/hull loss in the visual fixture.                                         | Stamp-comparison iteration before final band-strength controls; no retained raw test log.                                    |
| `node /tmp/heat-stamps.cjs`                                                                                                            | Tool output reported four distinct FX results, identical World/LFX, all-stamp replay, all three burns, outside suppression and keyboard pass. [Retained script](artifacts/2026-11-16-rock-atmospheres/stamps-browser-check.cjs). | Before final brightness/width defaults; result is reported chat evidence, not a fresh closure run.                           |
| `node /tmp/heat-band.cjs`                                                                                                              | Tool output: “Band controls alter FX only; baseline restore and backward replay exact.” [Retained script](artifacts/2026-11-16-rock-atmospheres/band-browser-check.cjs). Visual inspection included Follow and Follow 4×.        | Final 180%/150% controls; scripts contain original absolute workspace paths. Raw browser stdout was not retained separately. |
| `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json`                                                                       | Failed: 2 implicit-any errors in RockFlight015.svelte:160, 34 warnings in 4 files. [Retained log](artifacts/2026-11-16-rock-atmospheres/svelte-check.log). These were already reported before this stamp iteration.              | Stamp-comparison dirty tree; not a clean final type-check certification.                                                     |
| `pnpm --filter web build`                                                                                                              | Passed: 105 pages, 12.49s. [Retained log](artifacts/2026-11-16-rock-atmospheres/build.log).                                                                                                                                      | After study closure and Earth follow-up notes, before this evidence record.                                                  |
| Biome on changed heat/wrapper files; `git diff --check`                                                                                | Passed after formatting fixes, per tool outputs in chat.                                                                                                                                                                         | Scoped checks, not a repository-wide lint pass.                                                                              |

An earlier browser replay comparison failed during an in-session page edit;
the agent attributed this to hot reload. A subsequent unchanged-page rerun
passed all three burns. The original failure was not independently diagnosed.

## Evidence gaps

Production damage, drag coefficient, Earth placement, Venus-equivalent size/gravity,
production loading/fallback, mixed-effects performance and production touch play
remain outside verified delivery. No sustained performance trace was collected.
Static captures do not establish motion fidelity; the retained instrument is
mutable and can change with shared simulation. Earlier study observations are
reported through conversation and retained study text; reconstructed reference
images are not proof of those earlier states. Some intermediate images/logs
remain only in `/tmp` and may disappear. No tests were rerun for closure.
