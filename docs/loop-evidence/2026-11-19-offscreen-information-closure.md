# Offscreen information study closure · 19 November 2026

## Disposition and boundary

The designer accepted the study after 03 / Readiness and 04 / Scope: “accepted, record. close loop. good work.” The positive assessment applies to this study. It does not establish combat usefulness or authorise production implementation.

The [closed study](../../apps/web/src/pages/lab/studies/offscreen-information-2026-11-19.mdx) remains at `/lab/studies/offscreen-information-2026-11-19`, registry status `accepted`, phase `scope`. The earlier Combat HUD study remains stopped and inconclusive. This loop inspected the current pirate bearing and explored an extension; no production behaviour, gameplay mechanics, owning feature spec or DS token was changed.

## Decisions recorded

- Start from the existing pirate-location capability, rather than infer a new gameplay need. The baseline capture shows the production purple triangle and its viewport-edge behaviour.
- Restore filled triangles after the designer found open chevrons lost presence. Replace the rejected signal-strength bars with distance arcs. Retain that a graphical distance channel was useful to investigate, without declaring the rejected bar form accepted.
- Retain working geometry: 16 × 12 CSS px triangle; arc radial offset −16 px; 2–96 CSS px arc length, linear over 600–3400 world units and clamped beyond that range; category marks 13 CSS px inward from the arc.
- The final instruction explicitly replaces the initial whole-viewport rule: both eligibility and circular placement use the active flight box between the gutters. A centre on its boundary is inside. Cues may therefore appear for objects still rendered behind a gutter. No visible circle or gutter markers.
- Final colours: Sun and energy use HUD green, pirates red, derelicts status yellow (`--color-caution-tape`, not amber warning). Full triangle/arc opacity, 50% category-symbol opacity, no glow. Skull doubles from 02.5 to 2.4× its original base; circle and square remain 1.2×. Skull −30°, squares +30°.
- Space-purple `lch(72% 38.35 301.48)` remains a study-local DS proposal, not an adopted token or selected target mapping. All selected colours are retained in LCH.
- Production adoption, scope by contact/mode, presentation contract and layer ownership are separate delivery decisions. The study proposes a dedicated screen-fixed information overlay; no project-wide implementation decision is inferred.

The exact [selected configuration](../../apps/web/public/studies/offscreen-information-2026-11-19/026-selected-configuration.json) and [motion conditions/results](../../apps/web/public/studies/offscreen-information-2026-11-19/026-motion-evidence.json) are retained as static data.

## Delivered and retired

The study retains 01, the actual product baseline, useful exploration findings/captures, the accepted 02.6 reference, readiness blockers and proposed spec changes, and four dependent delivery slices (roughly 3–5 engineering days).

Closure publishes static MDX, replaces the final live instrument with a capture and native video, and removes the study-only Svelte components, motion experiment, tuning module and temporary audit/capture scripts after checking consumers. Shared Flight scene, camera, game field, renderers, controls and simulation are preserved. No acceptance is propagated into production contracts.

## Evidence and checks from the study

These were directly observed tool results during this chat, on an uncommitted shared working tree. Closure does not rerun them to reconstruct history. Pre-retirement source hashes are retained in `026-motion-evidence.json`. HEAD inspected at closure was `f8b9cba793ede22254ef1a1e3523f8ab089bef88`; this is a base reference, not a commit containing the study or a claim that every earlier check used that exact full tree.

| Invocation / source | Observed outcome and scope |
| --- | --- |
| `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` | Passed with zero errors/warnings during study implementation. |
| `pnpm exec biome check --write` on the study sources, page and registry | Final targeted study checks passed. Formatting fixes were applied during authoring. |
| `node artifacts/offscreen-study/review-final-motion.mjs` | Chromium, 1280 × 900. All B1/B2/B3 sequences completed 840 ticks. Sampled every 24 ticks: pirate/derelict/energy transitions in every burn; actual Sun transitions in B3. Seventeen sampled viewport-visible but flight-box-excluded contacts retained their cues. Play/pause, repeated seek projections/arc paths, half-opacity glyphs, doubled skull and absence of glow passed; no page errors. Essential results are retained in the motion evidence JSON. |
| `node artifacts/offscreen-study/capture-selected.mjs` | Captured the selected still, approximately 15.84 s B3 recording including setup, and inspected the 03/04 reading layout at 1280px. Production artwork was used for staged probes; their trajectories were analytic rather than AI/physics. |
| `node artifacts/offscreen-study/final-page.mjs` | Before closure: readiness/scope headings, `scope / open` state and recorded video metadata loaded without page errors. |
| `pnpm --filter web check` | Earlier runs passed. The most recent pre-closure run reported one unrelated error in `apps/web/src/pages/lab/ds/game-field-backdrop.astro:2`: import declaration conflicts with local declaration `GameFieldBackdrop`. Concurrent work was left untouched. No closure claim that this full check passes. |
| Independent question test | Clean-context read-only review passed One subject, Grounded and Consequence after the active-flight-box amendment. Exact reasons remain stamped in section 01. It did not assess graphic quality or gameplay usefulness. |

The first motion staging let B2 hit the Sun around 6.72 s. A temporary simulation audit then identified start `(100, 540)`, heading `−π/2`, velocity `(0, −200)` as completing all three burns without changing mechanics. The final browser audit used this revised fixture. The earlier failed staging is not treated as evidence against the marker grammar.

Raw browser-console/test transcripts and full historic dirty-tree snapshots were not retained. Temporary scripts were removed during closure; they are named above to identify the observed invocations, not as runnable retained evidence. No performance measurement, human playtest record or gameplay-benefit finding is supplied. Shared renderer changes could alter a reconstruction; the retained captures do not depend on reconstruction.

## Publication and closure verification

Local study page, registry, static media and this record were written in the shared checkout. No commit, push, deployment or hosted verification was performed as part of this loop. The review URL is a local shared-preview URL, not a hosted publication.

Closure verification is limited to the changed documentation/registry, removed-consumer references and static page/media delivery. Its result is recorded below after inspection; it does not certify product readiness.

Closure inspection: the stable local route returned HTTP 200 with JavaScript disabled at 1280 × 900; the header read `scope / accepted`, no hydrated island or live motion component remained, 03/04 anchors were present, and all eight referenced image/video/caption sources returned HTTP 200. Reading layout and the acceptance summary were visually inspected. Registry Biome check passed. No gameplay tests or historic failed checks were rerun during closure.
