# Practice planets: render model remediation

Status: plan, 2026-11-16, updated the same day. It follows a review of how Practice
Mercury and Venus are drawn against the render model in `docs/specs/game/render/`.
The planets stay. This plan brings them inside the model so that a later planet can
be added as data.

Where it stands:

- The shared snapshot `c7b754eb` committed the render rules, browser rotation trial,
  legacy Lab-page deletions, Planet Inspector and prepared shared light stamps.
- Inspector lighting controls and shared 1.35 light/shadow defaults are implemented.
- Shared planet World HUD and names are now implemented and reviewed. Every HUD
  line is 1 CSS px and text is 14 CSS px; planet HUD draws before bodies.
- Decorative rings are removed and stock/fallback body and planet light culling
  are implemented and reviewed; World HUD remains independent. These edits are
  included in the current shared commit snapshot.
- Shared body/light passes are implemented and approved in two review rounds.
- Rotation trial closure remains with its existing session. Engine material
  ownership and the full Flight instrument rename remain open.
  Script comparisons are recorded below; production raster/compositor evidence
  remains open.

Lead owns planning and review only. Luna implemented the bounded deliveries and
Terra reviewed them. During HUD work, another session saved the shared checkout as
`9a42f658`, capturing some in-flight specs and schema changes. The lead subsequently
committed and pushed the remaining HUD work and the shared checkout as `9dc8b444`.
The user has requested a new whole-checkout commit and push containing ring
removal, culling and the shared body/light passes, plus concurrent work.

This plan is a provisional map of what seemed sensible when it was written.
Its steps, scope, dependencies and technical details are working assumptions to
recheck, not decisions or evidence of completion. Specs bind; checkout inspection
establishes implementation state; recorded measurements describe only their stated
runs. The answers listed below bind where a current spec states them. Re-plan
against the targets whenever current evidence suggests a better next delivery.

## Delivered: shared World HUD and names

User authorized Luna development and Terra review, maximum three formal rounds, after
the shared snapshot was committed and pushed as `c7b754eb`. Lead coordinates/reviews
and edits this plan only. Checkout was clean at assignment. Status snapshots showed
rotation, previous lead and Inspector sessions idle with completed turns; Luna is the
sole `flight-frame.ts` editor for this delivery. Reviewer/lead are read-only there.
Preserve the rotation implementation; loaders, StripSphericalSurface and Toggle stay
outside scope. No new commit/push is assigned by this delivery request.

User clarified the target: every World HUD line is 1 CSS px and every World HUD text
is 14 CSS px, independent of camera zoom and stage-to-screen scaling. This applies to
Sun and planet HUD, not Deck controls. Planet orbits must appear behind planet bodies,
including in the Inspector. Specs must state those requirements before code changes.
One planet HUD pass precedes the full body pass, serving named, stock, loading and
failed-material bodies. Names use own name or star name/type plus full-system outward
position; filtering the Inspector must not renumber a planet. Practice star says
`G7 Sun`. Existing light defaults 1.35/1.35/5800 remain unchanged.

Delivered with Luna as the sole frame editor and Terra reviewing in three rounds.
The `world-hud` screen-space pass draws all planet HUD before the entire `planets`
body pass. `sun-fields` stays separate and shares CSS sizing. Stock Renderer draws
bodies only. Inspector toggles both HUD passes; custom Flight instrument appearances
retain the shared HUD. No loaders, StripSphericalSurface or Toggle changes were
made for this task.

Validated planet identities store optional names and outward positions assigned to
the full system after Practice orbit setup; filtering does not renumber them.
Validated star names and denominations are separate from display labels. Existing
stock names The Rock, The Gas and The Moon remain; Practice uses Mercury/Venus.
Unnamed planets use the star's own name or denomination/type and their position.

Review findings addressed: explicit CSS-width overrides continue to work for
unmeasured/offscreen canvases; a tautological test was replaced with actual filtered
label coverage; star identity now has schema validation; actual Sun field drawing
has its own world-transform sizing guard. Final Terra review approved with no
blocking findings. Luna owns no further frame edits after this delivery; subsequent
work must establish a fresh edit window with the rotation owner.

Evidence and limits:

- Lead independently ran 26 tests across World HUD, Physics, Simulation and frame:
  all passed. They cover fallback labels such as Sun.3/G11.3, explicit-name
  precedence, retained full-system positions, pass order, and actual Sun/planet
  drawing at a 2:1 backing-to-CSS ratio. Strokes convert to 1 CSS px and fonts to
  14 CSS px, including camera zoom changes.
- Luna reports Astro check (299 files, zero diagnostics), standalone TypeScript
  and scoped Biome passed. Terra independently ran the six World HUD tests.
- Luna inspected Chrome at 1512×804 on the existing server: Mercury at 1× and 16×,
  Venus at 1×, and the HUD switch. At 16× the body covers orbit/gravity lines;
  disabling HUD removes markings and labels while the body remains. G7 Sun and
  planet names were visible. These are developer observations, not independently
  reproduced visual findings by this lead.
- Live material-load failure was not induced. Source review verifies HUD uses the
  planet list independently of optional material objects. Full production-flight
  browser coverage, a new performance benchmark, GPU cost and human acceptance are
  not claimed. Historical direct stock-renderer studies are not compatibility gates.
- Concurrent unrelated study/build edits were left alone. No commit or push was
  made by this lead for the HUD task.

Next target: finish body/light culling with independent HUD visibility, after a new
frame ownership check. General passes and engine material ownership follow; the
Flight instrument rename remains independent collateral.

## HUD snapshot and next proposed bounded delivery

User requested committing and pushing the shared checkout after reviewing the HUD.
The snapshot includes concurrent MDX/Plasma Projector study setup. Quick verification
run `artifacts/verification/2026-11-16T17-51-35.665Z-7qq1rl/report.json` passed
contracts, lint and all 237 tests. The broad type gate still reports the existing
2 errors and 34 study warnings. The runner also detected source changes during the
run, so this is not stable-candidate verification or release approval. No additional
server or deployment is part of this save point.

The proposal below is now assigned in the active delivery section: offscreen planets do no body or light
painting. Extend the existing textured-surface visibility rule to stock/fallback
bodies and the two body-light passes. Remove decorative stock rings as part of this delivery. Remaining bounds include
the body outline, atmosphere and light stamp as applicable; partial visibility
remains drawn. Keep
HUD visibility independent, so an orbit or gravity boundary crossing the view still
shows when its planet is offscreen. Retain current names, lighting and rotation.
No general-body interface, material migration or Flight instrument rename in this
slice. Reserve one frame owner again before assignment.

Before code, make the existing body-cost contract explicit about complete visual
bounds and independent HUD visibility. Verify no body/light draw calls for fully
outside bodies, no clipping at body-outline/atmosphere edges, correct return into view at the
current tick, and retained crossing HUD marks. Use the original production-pass
measurement method and a fresh before/after sample; distinguish script timings from
raster/compositing. This closes a concrete cost-rule gap without depending on the
larger appearance-data refactor. The active delivery below records its assignment.

### Ring removal added to the proposed culling delivery

User approved retiring the decorative stock-planet ring functionality. Source
inspection confirms `hasRing` selects artwork only: the stock planet painter draws
a tilted ellipse, while collision and gravity use the body's radius and mass.
Ranked production uses configured planet initialization; ring probability belongs
to the separate random experimental factory. Removing the artwork does not change
ranked gameplay rules or require a new score challenge.

Before implementation, update the planet contract to state: “Planets have no
separate decorative ring system. Collision, gravity and body dimensions are
unchanged.” Remove obsolete ring fields, probability, drawing options/branch and
ring-only assertions from active contracts and code rather than retain a deprecated
switch. Historical study prose remains historical; adjust executable consumers only
as needed. Orbit and gravity HUD rings are unrelated and remain.

The deliverable is now: remove decorative stock rings and make offscreen body/light
drawing cost nothing, retaining independently visible World HUD. This is a scope
update; the subsequent active delivery records implementation ownership.

## Delivered: ring removal and body/light culling

User authorized Luna development and Terra review, at most three formal rounds.
Baseline is `9dc8b444`. Lead verified no pending frame edits and idle prior rotation,
Inspector and former lead sessions. Luna alone owns `flight-frame.ts` during this
delivery; lead/reviewer stay read-only. The active Plasma Projector study and its
pending files belong to another session and remain untouched. No commit/push is
part of this assignment.

Update current specs before implementation. Remove decorative ring code, fields and
probability rather than retaining a disabled option; preserve planet physics and
ranked rules. Cull stock/fallback bodies and both planet light passes with complete
visual bounds. Stock outline half-width is included; Venus atmosphere already has
its own bound. Keep textured rotation behavior, current-tick reentry, names and
1.35 lighting defaults. The World HUD remains independently drawn, including
crossing orbits/gravity boundaries when bodies are outside the camera. Its CSS sizes
and depth ordering are unchanged. General body passes/material ownership/rename are
not part of this delivery.

Luna completed implementation and Terra approved in one formal review round with
no blocking findings. Lead inspected the scoped code/spec diff and independently
passed 31 tests across frame, World HUD, Physics, LandingSystem and Simulation.
Production-pass guards cover outline overlap and tangency, Mercury returning at an
advanced tick, Venus atmosphere-only overlap at zoom 0.5, light-disc culling, and
HUD circles drawn while the body is suppressed. Active apps/packages/specs contain
no `hasRing` or `ringProbability` references. Ring-only executable fixture fields
and assertion were removed; historical prose remains untouched.

Luna reports Astro check (305 files, zero diagnostics), standalone TypeScript,
whole-tree lint (1094 files) and whitespace checks passed. Lead independently
confirmed whitespace checks. Terra's final scoped approval stands. The optional
random planet factory consumes one fewer random number per accepted planet; its
subsequent experimental random sequence can change. Production uses configured
initialization; radius, mass, collision, gravity and ranked rules are unchanged.

The original 240-frame before/after production timing comparison was not run.
Draw-call guards establish skipped drawing, not a measured frame-time improvement;
raster/compositing and GPU cost remain unmeasured. Luna inspected the existing
Inspector in Chrome at 1512×860: Mercury and Venus materials loaded, labels stayed
visible and bodies covered orbit/gravity dashes with World HUD enabled. This was
not an offscreen-culling browser test; no capture was saved. Human acceptance is
not claimed. No commit or push was made for this delivery. Luna has finished frame
edits; a subsequent task must reserve ownership again. Concurrent Flight instrument, salvage and Plasma Projector work belongs
to the other session and was preserved.

Next limited target: settle and implement the appearance-data interface and general
body/light passes under one explicit frame owner, preserving these culling bounds
and independent HUD. Engine material ownership follows that interface; rename is
independent collateral. This is a recommendation, not an assignment.

## Measured after culling, 16 November 2026

Lead ran temporary browser harnesses against the existing server, without changing
production code or starting a server. Local raw samples and runnable harnesses are
in `artifacts/measurements/2026-11-16-planet-culling/` (git-ignored). Hardware:
Apple M4 Max; Chromium headless 156.0.8078.4; 1920×1080 backing and CSS stage,
DPR 1, three real Canvas layers. Current Practice simulation supplies three planets
(stock rock, Mercury, Venus); production materials use browser rotation and default
lighting. Rotation time advances one simulation tick per animation frame, with
orbital positions held fixed. Simulation stepping/input costs are not measured.

The paired control transpiles the `9dc8b444` frame module in memory and uses the
same current materials, painters, simulation and browser. Thus it isolates the
latest frame culling changes, not ring artwork removal or the earlier rotation and
stamp work. No checkout rollback. All production passes run; pass observations and
painter-call counters add the same overhead to both versions. Thirty warmup frames
precede each 240-frame sample; order alternates between versions.

A first run used three repeats of six cases (onscreen, offscreen, close Venus,
paused, stock onscreen/offscreen). A second run used an isolated blank host page to
exclude Inspector UI activity, two repeats of four cases. The isolated repeat is
the primary result below: mean script milliseconds per rendered frame.

| Case                           | Body pass before → after | Both light passes before → after | Whole draw before → after |
| ------------------------------ | ------------------------ | -------------------------------- | ------------------------- |
| All planets onscreen, ticking  | 0.0565 → 0.0544          | 0.0067 → 0.0050                  | 0.420 → 0.400             |
| All planets offscreen, ticking | 0.0031 → 0.0025          | 0.0077 → 0.0015                  | 0.372 → 0.383             |
| Close Venus, 3.2 px/u          | 0.4681 → 0.4733          | 0.0090 → 0.0058                  | 0.823 → 0.809             |
| Stock/fallback discs offscreen | 0.0060 → 0.0015          | 0.0017 → 0.0006                  | 0.345 → 0.348             |

Each fully offscreen 240-frame sample previously submitted 240 stock-body calls
and 480 light calls, versus zero now. Stock-only offscreen samples went from 720
body calls to zero. Onscreen body/light counts were unchanged. Close Venus retains
Venus body/atmosphere/light while skipping the invisible stock body and Mercury
light. Textured offscreen surfaces were already skipped before this change.
World HUD continued to execute independently in all cases.

The isolated offscreen body-plus-light passes fell from about 0.011 to 0.004 ms.
Whole-frame improvement is not established: the first run showed 0.375 → 0.355 ms
offscreen, but the isolated repeat showed 0.372 → 0.383 ms. Variability elsewhere
in the frame exceeds the small culling saving. No material visible-path regression
was established; close Venus body timing remains about 0.47 ms. Frame intervals
(p95 roughly 17–19 ms here) are browser scheduling observations, not GPU timings.
Headless software rendering does not certify production raster/compositor cost;
that remains unmeasured. Surface draw calls are not surface redraw counts.

The historical 3.96 ms whole-frame / 3.86 ms planets baseline used per-pixel
rotation and a different browser/workload. Current onscreen body cost around
0.05–0.06 ms is consistent with the earlier rotation-trial improvement, but these
runs do not isolate that change or justify a directly comparable percentage.
The preliminary paused body pass was about 0.015 ms; that case was not repeated
on the isolated page. No ring-removal-only timing claim or human acceptance claim.

Lead reran the 13 frame and World HUD tests: all passed. Whitespace checks passed.
Conclusion: the culling target is met, with zero unwanted drawing submissions and
a small measurable reduction in the relevant passes; no whole-frame speedup claim.

Recommended next bounded task: replace planet-specific frame material fields and
branches with a typed appearance collection and general body/light passes, wiring
Deck, Flight instrument and Inspector to that interface. Preserve fallback,
lighting defaults, culling bounds, rotation timing and independent World HUD.
Do not include material/asset migration or rename. Reserve one frame editor and
coordinate consumer edit windows with their owners first. Existing render identity
contract authorizes this direction; settle any missing appearance/lifecycle
contract before implementation. No implementer has been assigned for this proposal.

## Delivered: shared body and light passes

User assigned Luna development and Terra review, maximum three formal rounds.
Lead coordinates and reviews, with no production edits. Baseline is the shared
checkout at `9dc8b444` plus the reviewed, uncommitted ring/culling changes. Luna
owns the frame edit window; those pending frame changes are Luna's prior delivery.
Rotation and Inspector sessions are idle. The previous Flight instrument tooling
session is idle; the active Plasma Projector continuation explicitly keeps its new
work study-local and reuses the shared experiment API. Luna may migrate the frame
consumer in Flight instrument while preserving pending experiment hooks, star
overrides and appended experiment passes. Study files and unrelated changes stay
with their owners.

Target: appearance data drives general body and light passes, without planet/mode
branches in the frame. Migrate Deck, Flight instrument custom appearances and
Inspector together. Keep World HUD independent and behind bodies, preserve CSS
sizing, complete culling bounds, material fallback, current-tick rotation and
lighting defaults. No material migration, assets, loader/strip changes, rename or
rotation-trial closure. Missing composition/bounds/lifecycle requirements must be
specified before implementation. Design approved: a typed runtime appearance map uses full-system outward positions
and required world-space bounds for body/light callbacks. Missing appearances use
stock fallback; no new skip-fallback policy. Prepared materials share one adapter
between Deck and Inspector, with no per-frame painter/stamp allocation. Custom
instrument compositions declare conservative bounds including detached marks and
enter the shared light pass before other LFX. Retaining the generic `planets` ID
avoids needless consumer churn; the two named light passes become `body-light`.
Luna updated specs before implementation and delivered the shared passes. Terra
approved in round two. Round one found that the custom atmosphere's rotated ship
airflow could exceed its AABB; the bound now covers rotated controls/endpoints and
stroke. The frame no longer contains Mercury/Venus or mode branches. Deck and
Inspector use `practice-planet-appearances.ts`; Flight instrument supplies its
custom composition through the same frame interface instead of replacing passes.
Existing experiment hooks and star overrides were preserved. The general frame
and adapter were checked for material readiness, filtering/replay identities and
first-LFX ordering. Material/asset ownership migration remains open.

Lead independently passed 17 tests across frame, real Practice adapter, World HUD
and Flight instrument experiment behavior. Terra independently passed nine frame
and adapter tests. The adapter test exercises real adapter callbacks through
production passes, including reentry phase, atmosphere-only visibility and light
culling. Generic descriptor coverage exercises an additional composition without
frame branches. The protected loaders, strip surface and Toggle have no new diffs.
Luna reports Astro check (305 files, zero diagnostics), scoped Biome and scoped
whitespace checks passed. Lead independently ran standalone TypeScript: passed.
In Chrome at 1512×805 on the existing server, Luna checked Mercury and Venus in
Inspector, then the recent rock-atmospheres custom Flight instrument composition
at B1 / 0.45 s. Textured bodies, atmosphere and HUD were visible, and browser console
errors were empty. No material-failure browser injection or full gameplay journey
was run. No commit/push was made. Luna has released the frame edit window; a later
assignment must reserve ownership again.

Lead measured the shared passes against a saved pre-generalization frame using
the same current materials and real Canvas layers. Two alternating rounds of 240
frames per case after 30 warmups, isolated host page, Chromium headless 156 on
Apple M4 Max, 1920×1080 CSS/backing, DPR 1. Tick-based rotation advances once per
frame; orbital positions stay fixed. This is script submission, not simulation,
raster or compositor timing. Local harness/raw data/saved baseline live in
`artifacts/measurements/2026-11-16-shared-body-passes/` (git-ignored).

| Case                            | Whole draw before → after | Body pass before → after |
| ------------------------------- | ------------------------- | ------------------------ |
| All planets onscreen            | 0.429 → 0.426 ms          | 0.058 → 0.059 ms         |
| All planets offscreen           | 0.348 → 0.359 ms          | 0.0004 → 0.0031 ms       |
| Close Venus at 3.2 px/u         | 0.850 → 0.845 ms          | 0.471 → 0.481 ms         |
| Stock/fallback bodies offscreen | 0.375 → 0.379 ms          | 0.0023 → 0.0019 ms       |

Painter-call counts match the pre-refactor frame in every case, including zero
body/light calls offscreen. Small differences do not establish a whole-frame
speedup or material performance regression. GPU/raster cost and human acceptance
are not claimed. This delivers the data-driven frame target; no next implementation
is assigned.

## Shared snapshot and next proposed deliverable

User requested committing and pushing the entire shared checkout after the shared
body/light delivery. This snapshot also includes concurrent Flight instrument
experiment/damage tooling, the Plasma Projector study and skill updates. Quick
verification `artifacts/verification/2026-11-16T18-59-00.105Z-bJZUnN/report.json`
passed contracts and all 255 tests. Initial lint flagged a concurrent temporary
browser test and plan formatting. The other session removed its temporary browser
test; lead formatted the plan. Final whole-tree lint passed across 1,096 files,
and a fresh full unit run again passed all 255 tests. Broad type checking still reports the previously
known two implicit-any errors and 34 warnings in historical studies. Source changed
during the run, so this is not stable-candidate verification or release approval.
No deployment is requested.

Next proposed limited deliverable: give production Mercury one prepared atlas and
an engine-owned material factory. Play and Inspector should load that one asset
outside `/studies/`, retain the current accepted appearance/rotation/light behavior,
and use the existing shared appearance adapter and stock fallback. Remove the
production dependency on loading all three study candidate images and quilting
Mercury on page load. Preserve provenance and historical study evidence.

This advances the material-ownership and production-asset targets without bundling
Venus migration, Flight instrument rename or rotation-trial closure. First reserve
the Mercury-loader edit window with the rotation owner, verify existing material
requirements, and specify any missing asset/preparation contract before assignment.
Acceptance should cover one production atlas request, no production study-image
fetches for Mercury, both play/Inspector using the same engine preparation,
unchanged bounds/HUD/lighting and failure fallback. Compare the delivered rendering
and load work with the current path; script measurements do not certify GPU cost.
This is a recommendation only; no implementation has been assigned.

## What the review found

Measured on 16 November 2026 on one Mac, with the production passes and the Practice
simulation on a 1920 × 1080 stage, one tick per frame, 240 frames per case. Script
time only.

| Case                                       | Whole frame | Planets pass |
| ------------------------------------------ | ----------- | ------------ |
| Both planets on screen, ticking            | 3.96 ms     | 3.86 ms      |
| Both planets off screen, ticking           | 3.96 ms     | 3.86 ms      |
| Close on Venus at 3.2 px/u, ticking        | 3.94 ms     | 3.86 ms      |
| On screen, paused                          | 0.11 ms     | 0.01 ms      |
| On screen, stock discs instead of painters | 0.10 ms     | 0.01 ms      |

| Part                           | Mercury        | Venus          |
| ------------------------------ | -------------- | -------------- |
| Surface reprojection, per tick | 1.96 ms        | 2.02 ms        |
| Body draw                      | under 0.001 ms | under 0.001 ms |
| Atmosphere arc                 | none           | under 0.001 ms |
| Light pass, mask cached        | 0.001 ms       | 0.004 ms       |
| HUD pass                       | 0.007 ms       | 0.005 ms       |

A light mask that is not cached costs 0.32 ms to build. A stock planet with its HUD
costs 0.002 ms.

Findings, most serious first:

1. Game code reprojects every pixel of each planet's surface on every tick.
   `SphericalSurface.draw` in `packages/core/src/lib/assets/spherical-surface.ts`
   loops over 192 × 192 pixels with trigonometry and bilinear blending, called from
   the planets pass in `packages/mode-a/src/lib/flight-frame.ts`. The render spec
   says "No game code blends, blurs, scales or distorts pixels" and "Game code draws
   marks: shapes, images and cached stamps". Mercury is about 54 px across at
   1 px/u, and one tick moves its surface about 0.09 px at the disc centre.
2. The render spec's "Named Practice planets" section describes this implementation,
   names two planets inside the general model, and states no rule a third planet
   could be checked against.
3. Mercury and Venus have a HUD of their own. Their orbit, gravity boundary and label
   are drawn in stage pixels by two passes of their own, in token colours. Every
   other planet gets a faint solid orbit and a cyan ring from the stock planet draw,
   in world units and hard-coded colours, with no label. No spec says planets share
   one HUD; the planets spec says other planets keep the flat-disc presentation.
4. Nothing skips a body that is outside the camera's view. No rule covers it.
5. Planet identity is hard-coded in the frame: `FlightFrame.mercury` and
   `FlightFrame.venus`, branches on `id === "venus"` and `id === "moon"`, four
   passes per planet pair, and the display names as string literals in pass code.
6. Production Mercury loads three PNGs of 2.1 to 2.3 MB each from
   `/studies/mercury-2026-11-12/` and uses one. The provenance file beside them says
   "Unaccepted visual hypotheses; not production assets". The material preparation
   and both painter constructors live in `apps/web/src/lib/assets`, and the deck, the
   Lab preview and the Flight instrument each wire the painters separately.
7. The light mask is rebuilt per pixel for each of 256 Sun angles with 24 kept, so
   every new angle is a rebuild. The mask for any angle is the angle-zero mask
   rotated, which the canvas can do. Each planet holds its own cache of identical
   masks.
8. The light pass draws an opaque grey disc on the live-light layer, whose dark half
   darkens accumulated light and anything drawn over the body. The layer spec says
   the layer holds fresh light. This was reasoned from the blend order and not seen
   on screen.
9. Smaller inconsistencies: Mercury loses its HUD and label while its image loads or
   if it fails, and Venus does not; Mercury's projected surface is one shared object
   and Venus's is per flight; the planets pass and the Venus light pass name the
   wrong source file; the light passes sit among World passes in a list whose comment
   says it is grouped by layer.

## What to keep

- A body on World and a directional mask on the live-light layer, sharing one unit
  disc. `RockBodyPainter.body` is a single image draw.
- The three HUD primitives in `packages/core/src/lib/assets/world-hud.ts`: stage
  pixels, token colours, about 0.006 ms per planet.
- Surface phase from simulation ticks, so a paused frame shows the same picture.
- Atlases built once at load, and the stock disc when material setup fails.
- Venus's atmosphere arc, which is one native stroke.
- The pass-list substitution the Lab uses to swap a body painter.

## Steps

The numbered steps are a work map, not independent assignments. Deliverable scope
and shared-file ownership below govern integration; specs govern behavior.

### 1. Write the rules for world bodies into the specs

Written, uncommitted, verified 2026-11-16.

- `docs/specs/game/render/spec.md`: "Named Practice planets" is replaced by "World
  bodies", with matching contract items and two scenarios. The method section says
  that having the browser scale and draw images counts as drawing marks.
- `docs/specs/game/render/lfx.md`: a body's light and dark stamp is drawn on that
  layer, first, and may darken what is beneath it.
- `docs/specs/game/world/planets/spec.md`: new "Names" and "World HUD" sections; the
  sentences about a canonical Lab preview are removed.
- `docs/specs/game/world/star/spec.md`: a star is named by its type, followed by its
  name if it has one.

Left over: the planets spec still carries older status markers and flat-vector
descriptions from before this work. They are not touched here.

### 2. One planet HUD and names for all planets

Implemented and reviewed; see the delivery record above. The original scope follows.

- Add a display name to the planet data, schema first, and derive default names by
  the planets spec's rule.
- Change Practice's star label from "G7, Sun" to "G7 Sun".
- Add one HUD pass that loops over every planet and calls the existing primitives.
- Remove the two per-planet HUD passes, `drawPracticePlanetHud`, and the HUD half and
  `worldHud` switch of `Renderer.drawPlanet`.
- Update the Lab consumers that name the HUD passes by id: the Flight instrument
  (`apps/web/src/lib/flight-scene/scene.ts`) and the Planet Inspector.

This changes how Survival and Gauntlet look. It also removes the Mercury fallback
mismatch. Touches: planet schema, `flight-frame.ts`, `Renderer.ts`, `simulation.ts`,
the two Lab consumers. Size: small to medium. Requires a reserved frame-edit window
and an agreed Inspector consumer update by its owner. No pass id has been chosen:
the previous `planet-hud` proposal was withdrawn. Preserve outward position when
an Inspector stages only one planet; do not derive numbering from a filtered list.

### 3. Draw the rotation with the browser

Running as a trial in Practice for Mercury and Venus; the two trial records below
hold the method and the measurements. `StripSphericalSurface` in the shared engine
draws the turn with image draws, sized to the body on screen, and redraws only when
the surface has moved a pixel.

Lead review, 2026-11-16: the planets pass costs 0.04 ms of script at 0.7 px/u, down
from 3.94 ms, about 0.2 ms centred on a planet at 4 px/u, and 0.01 ms with both
planets outside the view. The same tick gives the same picture whatever was drawn
before.

Left to end the trial:

- Remove the true/false switch from the two loaders in `apps/web/src/lib/assets`.
- Remove the per-pixel projection from play. Dated study pages keep using it.
- Measure the buffer rebuilds during a continuous zoom, which nobody has measured.

The known limit: a planet 800 px across redraws on every tick at about 1.1 ms each.
Nothing in Practice is that large; Venus at 4 px/u is 323 px.

### 4. One light and dark stamp, turned by the canvas

Implemented, uncommitted, in the bounded Luna delivery reviewed by Terra. Core's
RockBodyPainter prepares and shares one canonical stamp per active intensity plus
the permanent default; light drawing rotates it with Canvas and creates no pixels.
CloudBodyPainter inherits it. Current production defaults are incoming 1.35,
shadow 1.35 and temperature 5800 K; stamps are shared by the full prepared tuple.
The recent atmosphere study prepares custom values before publishing redraw state
and releases leases on change/unmount. Existing first-on-LFX ordering is unchanged.
Three review rounds finished with no blocking code findings. Comparable 240-frame
performance timing and the full visual matrix are still missing; see delivery record.

### 5. Skip bodies outside the view

Implemented and reviewed for textured, stock/fallback bodies and both light passes.
Full outline/atmosphere bounds retain partial visibility. World HUD remains
independent. See the delivered culling record above for checks and measurement limits.

### 6. General body passes driven by data

Implemented and reviewed; see the shared-pass delivery above. The original scope
below is historical planning context, not remaining work. Material migration is
still separate.

Replace `FlightFrame.mercury` and `FlightFrame.venus` with a set of body appearances
keyed by planet identity, and the four planet-specific passes with one body pass and
one body-light pass. Remove the mode and id branches from the frame. Wire the
appearances in one place that the deck, the Flight instrument and the Planet
Inspector share. Correct the pass source fields and the list's ordering comment.
Touches: `flight-frame.ts`, `FlightDeck.svelte`, the Flight instrument, the Planet
Inspector. Size: medium. Easier after step 2.

### 7. Move material ownership into the engine

Move material preparation and painter construction out of `apps/web/src/lib/assets`
into the shared engine's assets. Ship Mercury's surface as one small prepared atlas
outside the studies folder, and stop fetching the two unused images. Touches:
`apps/web/src/lib/assets`, core assets, public assets. Size: small to medium.
Depends on: the settled general-body interface and rotation-owner handoff.

### 8. Delete the legacy Lab planet pages

`/lab/entities/planet` is a leftover page for the flat stock planet, found still
live during this review, and `/lab/entities/planet/practice` under it should not
exist. Delete both with everything that exists only for them: the two pages,
`LabPlanetMain.svelte`, `LabPlanetInspector.svelte`, `PracticePlanets.svelte`, and
the "Planets" entry in `apps/web/src/data/lab-pages.ts`. Remove the planets spec's
line that points at `/lab/entities/planet`. Dated study pages and reviews that link
to these addresses are left as written. Deletion is present and uncommitted, owned by the Planet Inspector's implementer.
`planet-state.svelte.ts` is deleted too. Registry and planet-spec links are updated.
This lead verified the diff and paths, not route behavior in a browser.

### 9. Planet Inspector

A Lab instrument at `/lab/planet-inspector` for looking at one planet through the
game's own drawing, added on 16 November to see the results of this work. Its spec
is `docs/specs/lab/planet-inspector/spec.md`. It is the Lab's planet page once step
8 is done.

Second review round belongs to its existing implementer. The current spec now
requires unchanged production passes selected through `include`, no drawing
switch, Mercury and Venus, pass timing and surface redraw counts. Its scene code
selects the existing `mercury-hud`, `venus-hud` and light ids; there is no adopted
replacement HUD id.

The old open question about independent spin and orbit is resolved in the spec:
Surface rotation seeks simulation ticks while preserving staged orbit; Orbit uses
`updatePlanetOrbit(planet, 0)` without changing time. The current scene uses those
production mechanisms. Runtime conformance remains with the second review; this
handover does not mark the instrument accepted.

## Collateral: Inspector lighting controls

User authorized this extension after the shared-stamp delivery, with the same Luna
developer and Terra reviewer, at most three review rounds for this new task. Lead
coordinates and reviews only. The earlier Inspector session is idle with its second
review implementation completed; this assignment owns only the narrow extension.

Add three sliders to the existing hamburger pane: incident light intensity, shadow
intensity, and star-light colour. User selected a temperature-based colour range of
3500–10000 K, approximately K through G to F/A. This is lighting inspection, not a
change to star mass, radius, gravity, energy or the game's G7 radius denomination.
Defaults should preserve production drawing. Light and shadow vary independently;
changes redraw the held instant without advancing time or altering orbit/zoom.

Implemented, uncommitted. Specs were updated before code: Inspector local lighting
parameters now use the shared production painter, never a bench renderer or pass
replacement. A strict core `RockBodyLightingSchema` validates incoming/shadow0–2
and temperature3500–10000K. Prepared stamp keys cover the full lighting tuple;
active-user lifetime and no frame-time pixel preparation remain in force. Defaults
are1/1/5800K. The temperature affects incident planet light only, not the Sun artwork
or simulation. Reset and planet selection restore defaults; seek/zoom preserve them.

Luna developed and Terra reviewed in three rounds. Round1 required immutable owned
settings/defaults and visible recoverable update errors. Round2 had no blocking
findings and requested clearing stale errors on main Reset. Round3 approved after
that fix, with no blocking findings. Lead inspected source/reports and ran final
focused checks. Rotation loaders/surface, Toggle and flight-frame were not edited
for this collateral. Nothing was committed.

Evidence:

- Luna reports full Vitest227 tests passed and scoped Biome passed. Lead independently
  ran light-stamp7 + frame2 tests:9/9 passed. `git diff --check` passed.
- `pnpm check:types` remains red on reported pre-existing RockFlight015 implicit-any
  errors and study warnings; the introduced Inspector markup warning was fixed.
- Luna inspected Chrome1512×860 on existing localhost4321. Pane showed all three
  sliders with expected bounds/defaults. Mercury stayed paused at tick0/orbit82°
  across warm3500/cool10000 changes with visible hue changes and0.0 surface redraws/s.
  Both intensity controls at zero produced neutral shading. Venus selection restored
  defaults; temperature changed its light at paused tick0/orbit343° with0.0 redraws/s.
  Reset lighting restored5800K. The star artwork stayed unchanged.
- Browser observations are the developer's report; this lead and Terra did not
  independently reproduce them. Images were viewed through tools, with no saved
  local capture artifact. Simultaneous Inspector instances and injected preparation
  failures were not tested through the UI; core guards cover relevant ownership and
  failure retention. No comparable performance benchmark, GPU cost or human visual
  acceptance is claimed.

Lead disposition: the requested collateral is delivered and reviewed. The broader
HUD/culling/general-pass/material/rename targets remain separate work.

## Shared lighting default adjustment and snapshot

User subsequently selected incoming light1.35× and shadow1.35× as the shared
production defaults, retaining5800K. Luna implemented the schema defaults and
updated the render, LFX, planet and Inspector contracts; existing production
constructors and Inspector opening, Reset lighting, main Reset and selection all
consume that shared default. Explicitly selected values remain explicit. Earlier
1/1/5800 measurements above describe the prior delivery, not the current default.
Terra approved this adjustment in one review round, independently passing the
seven focused tests. No new human-playtest evidence is recorded.

User requested commit and push after this change. Repository shared-checkout policy
uses a whole-tree snapshot, including the other sessions' current work. Pre-commit
quick verification passed contracts and all227 unit tests, and found the existing
RockFlight015 errors plus study warnings (2 errors/34 warnings in4 files). The
plan table formatting finding is corrected before commit. This is partial
verification, not a release gate pass. No additional server is started and no release
is published. Review/run evidence:
`artifacts/verification/2026-11-16T16-55-22.785Z-SW80gC/report.json`.

Recommended next delivery: one World HUD and correct names for every planet,
including stock and material-failure bodies. Reserve a single editor for
`flight-frame.ts` after the rotation owner's handoff, and integrate Inspector and
Flight instrument consumers together. General-body passes and material ownership
follow the settled interface; the full Flight instrument rename stays collateral.
This recommendation does not start another implementation assignment.

## Collateral: name the Flight instrument

Not a render fix. It is recorded here because the review ran into the naming.

Answered 2026-11-16:

- The component is the Flight instrument.
- The Lab page that demonstrates it is the Lab Flight instrument.
- A study that uses it has a Flight instrument.

The current route, code folders and principal spec still use `flight-scene` and
FlightScene identifiers. The full rename is not applied. Earlier occurrence counts
are not a current inventory.

What the rename touches:

- The Lab page: its title in `apps/web/src/data/lab-pages.ts`, the page
  `apps/web/src/pages/lab/flight-scene.astro` and its address.
- The spec `docs/specs/lab/flight-scene-instrument/spec.md`, its folder name, and
  the specs that link to it, including the render spec and the Motion instrument
  spec.
- The skill `.agents/skills/flight-scene-study`.
- The code: `apps/web/src/lib/flight-scene`, `apps/web/src/components/lab/flight-scene`,
  the wrapper `apps/web/src/components/studies/flight-scene.ts`, and names such as
  `FlightScene`, `FlightSceneInstrument` and `FlightSceneDocumentSchema`.
- The remaining files that mention the name, apart from dated material.

Also answered 2026-11-16:

- The rename is full: the displayed name, the folder names and the code identifiers
  all change.
- The Lab page's address is `/lab/flight-instrument`.
- Dated material is left as written: dated study pages, reviews, loop records and
  dated plans keep the old name. Where a dated study page links to the Lab page or
  imports the code, the link and the import are updated so the page still works;
  its prose is not.

Size: medium. Depends on: nothing, and nothing in the steps above depends on it.

## Ownership, integration and recommended next delivery

- This lead updates this plan and reviews evidence; it changes no implementation,
  starts no implementers or chats, and commits nothing without a request.
- The rotation session owns ending the trial, `strip-spherical-surface.ts` and the
  Mercury/Venus web material loaders. It may still edit the planets pass. Obtain
  its explicit frame-edit handoff before another owner changes that pass.
- The Inspector session owns both `planet-inspector/` directories, its spec and
  `Toggle.svelte`. Requests affecting its pass selection or material inputs go to
  that owner when assignment is authorized, not through edits by another worker.
- Reserve one editor at a time for `flight-frame.ts` across HUD, culling and general
  passes. Preserve its existing uncommitted diameter/culling changes. Inspect a
  fresh diff before and after each integration; never restore whole shared files.
- The full Flight instrument rename is behaviorally independent, but shares Lab
  consumers, registry, specs and imports with this work. Schedule it outside those
  edit windows; dated prose stays unchanged, executable imports/links must work.

### Delivered atomic task: prepare and share the directional light stamp

Assigned to Luna after user authorization, with Terra reviewing: remove
angle-driven pixel-mask construction from the
shared rock/cloud painter. Keep `light(...)`, production pass ids and existing
first-on-LFX ordering intact. Reuse one canonical stamp for bodies with the same
shadow intensity and turn it with Canvas toward the Sun. Preserve the unit disc,
alpha edge and current darkening-only intensity behavior. This delivers the
light-cost target without changing the contested frame, Inspector, loaders, HUD,
rotation, materials or general-body interface.

Primary implementation scope is `packages/core/src/lib/assets/rock-body.ts` and
only directly necessary core preparation support. Read all light callers, including
study intensity controls, before choosing preparation lifetime. No pixel loop may
move to a cache miss inside `light`; preparation must precede frame drawing. A
bounded cache must not evict an actively used stamp and force its rebuild in draw.
If preserving the API needs changes in another owner's files, stop at an interface
proposal and coordinate that change; do not expand this assignment silently.

Contract reconciliation for this delivery and proposals for later assignments:

- Render, World bodies / LFX now records this contract: “Bodies with the same shadow
  intensity share one prepared light-and-dark stamp. Star direction changes only
  the Canvas transform, never the stamp. Pixel preparation happens before frame
  drawing; drawing never creates or rebuilds a pixel mask.”
- Planets, Rock shadow inspection: replaced “angular/intensity mask cache” with
  “shared intensity stamp cache”; retain bounded storage and the 0–2 intensity
  range and darkening-only behavior. Angle caching is not the target contract.
- Before remaining culling is assigned, clarify Render Cost: “Visibility uses the
  bounds of all body parts and the light stamp. Offscreen bodies perform no body,
  surface-update or light drawing. World HUD visibility is evaluated separately;
  an orbit or boundary crossing the view remains visible when its body is outside.”
- Before the rename is assigned, set the Flight instrument spec's name and route:
  “The shared component is the Flight instrument. Its reference Lab page is the
  Lab Flight instrument at `/lab/flight-instrument`.” Then align current links,
  folder names and identifiers under the already requested full-rename scope.

Shared preparation and active-user storage are now written into the three owning
specs. Culling clarification and Flight instrument rename wording remain proposals;
this delivery changes neither of those contracts.

Delivery evidence: compare Mercury and Venus at several Sun directions, including
angle wrap and shadow intensities 0, 1 and 2; verify unchanged context transforms,
shared stamp reuse across painter instances, and no pixel preparation during draw.
Check light-over-body composition through the existing app at 1280px or wider.
Re-run the production-pass harness with the original 1920×1080, one tick/frame,
240-frame on-screen/offscreen/close/paused cases, reporting setup separately from
steady-state script time. Preserve the original baseline tables; compare against
a fresh before measurement too. `observe` does not measure raster/compositing.
No expected speedup or human acceptance is asserted in advance.

### Active delivery coordination

User authorized Luna as developer and Terra as reviewer, with at most three formal
developer/reviewer rounds. The lead checks reports and the actual diff and owns
integration judgment. No commits. All three formal review rounds are complete. Round 1 requested partial-construction
cleanup and preparation/draw ordering; round 2 requested paused redraw after prepared
intensity publication. Both were fixed. Round 3 found no remaining blocking code
issues and approved the bounded implementation with incomplete evidence stated.

Caller inspection corrected the proposed core-only scope: the rock-atmospheres
study passes a continuous reactive intensity into `light`. Exact arbitrary values
cannot all be prepared in advance under the old calling pattern. The developer
may therefore add explicit preparation/update and release for that study, narrowly
in `appearance.ts` and `AtmosphereFlight.svelte`, preserving the latter's existing
uncommitted edits. Default production callers must continue to work through painter
construction; protected loaders are not part of the assignment. No quantization.
Storage is to follow currently owned intensity stamps plus the shared default,
not retain slider history; this is not a fixed cap on simultaneous instrument users.
Terra will check preparation ordering, failure behavior, cleanup and shared reuse.
User clarification: historical studies are not compatibility gates. Breakage may be
reported rather than repaired; older completed studies can be compacted later with
their findings. No archival is assigned here. The recent rock-atmospheres integration
is retained narrowly because intensity behavior is also in the current planet spec,
not because every historical study must continue working. When retiring a historical
live JS component, the user's preferred approach is to capture its view and replace
the component with a screenshot, retaining findings and context. Do not invent a
capture of an already broken component or claim it represents an earlier state.

### Delivery evidence and lead disposition

Luna changed `packages/core/src/lib/assets/rock-body.ts`, added `rock-body.test.ts`,
updated recent-study `appearance.ts` and narrow preparation/disposal wiring in
`AtmosphereFlight.svelte`, and reconciled render, LFX and planet shadow specs.
The existing unrelated Toggle `compact` removal was preserved. This lead changed
only this plan. No protected loader, Inspector, rotation surface or frame code was
changed for this delivery, and nothing was committed.

- Developer: focused tests 3/3; `pnpm check` reported 299 files, zero diagnostics;
  Biome on the four changed code files passed.
- Reviewer: independently ran the three focused tests and reviewed stamp sharing,
  release, preparation/draw separation, Canvas restore, study wiring and specs.
- Lead: inspected the final diff and reports; ran the three light-stamp tests and
  two existing frame tests together (5/5); scoped `git diff --check` passed.
- Developer browser observation: Chrome, 1512×803 viewport, existing server4321.
  The recent rock-atmospheres study at paused 0.45s / Follow4× visibly changed dark
  shading between intensity0 and2 without advancing time, then returned to1.45.
  Inspector Mercury and Venus loaded paused with production drawing. These are
  developer observations, not independently reproduced visual findings by this lead.
  No local screenshot artifacts were saved.
- No new comparable 1920×1080 / 240-frame `observe` benchmark was obtained. The
  original 0.32ms mask-build figure is inherited evidence, not a current comparison.
  Raster/compositing, the complete visual direction/intensity matrix and physical
  iPad cost remain unchecked. Unit transform checks are not visual wrap evidence.

Lead disposition: bounded code delivery complete and reviewed; performance evidence
remains open. No measured speedup, full-plan completion or human acceptance is claimed.
At that point the next proposed delivery was the shared World HUD. Its completed
delivery is recorded above; remaining culling is now the next proposed target.

### Provisional remaining sequence by deliverable

1. Existing owners finish rotation and Inspector review in their own sessions.
   The shared light-stamp code delivery is complete; remaining measurement work
   does not establish completion of rotation or Inspector review.
2. Shared World HUD and names are delivered, with one reserved frame owner and
   coordinated Lab consumers; live failure-path inspection remains unchecked.
3. Finish body/light culling with independent HUD visibility. Stock body bounds
   must include visible rings, not just the collision disc. This shares the frame
   and stock renderer with HUD work, so serialize their edits.
4. Settle and review the appearance-data interface, then generalize body/light
   passes and integrate all consumers together. Preserve Inspector timing of the
   `planets` pass or coordinate its spec/readout if that id changes.
5. Move material preparation into core against that interface; no study assets in
   play. Legacy-page deletion is already present and needs integration review,
   not another deletion assignment. Schedule the full rename separately.

## Checks

- Re-run the frame measurement after step 3 and after step 6: the planets pass and
  the whole frame, on screen, off screen and paused.
- Measure through the production passes with `drawFlightFrame`'s `observe`, which
  reports each pass's draw time. The Flight instrument stages a planet through
  those passes, and `/lab/render-model` lists the passes read from code.
- The existing frame tests in `packages/mode-a/src/lib/flight-frame.test.ts` cover
  pass order and layers, and remain applicable, but replace production draw callbacks with recorders: they do
  not prove light-first semantics, culling, HUD names, stamp reuse or visual fidelity.

## Answers and where they are recorded

Given on 2026-11-16. An answer binds where a spec states it.

| Answer                                                                                                     | Recorded in                                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| One planet HUD for all planets in every mode, in the style Mercury and Venus have                          | Render spec, "World bodies"; planets spec, "World HUD"                                                                    |
| Star and planet names: type then name for a star; a planet's own name, or star and position                | Planets spec, "Names"; star spec                                                                                          |
| Authored raster art is acceptable for planet surfaces                                                      | Render spec, "World bodies"; `docs/architecture.md`; `AGENTS.md`                                                          |
| A planet's light and dark side is one stamp on the live-light layer, drawn first; parts on World are unlit | Render spec, "World bodies"; `lfx.md`                                                                                     |
| The cost rule is a method rule: no looping over pixels per frame, no work for bodies outside the view      | Render spec, "World bodies" and method; `AGENTS.md`                                                                       |
| Rotation is drawn with the browser's image drawing                                                         | Render spec, "World bodies" and method                                                                                    |
| The speed camera's levels are meant to be 0.5, 1, 2 and 4 px/u                                             | Not in a spec. Its own plan: [speed camera entrance and zoom levels](2026-11-16-speed-camera-entrance-and-zoom-levels.md) |
| The Flight instrument's name, full rename, address `/lab/flight-instrument`                                | Not in a spec. See "Collateral" above                                                                                     |
| The Planet Inspector uses the production renderers one to one and offers no switch between drawings        | Planet Inspector spec, Context and Architecture; implementation review remains open                                       |

The baked-frames proposal from earlier in the day is dropped. Its sizing is kept in
the trial record only as background.

## Initial step 3 trial, 2026-11-16

The Practice deck opts Mercury and Venus into core's `StripSphericalSurface`.
The previous projector remains available; study consumers keep their previous
implementation. No Lab page was added or changed. This is the rotation trial
only, without culling, new body passes, HUD changes or asset migration.

The candidate keeps the 192px surface buffer and uses 64 column image draws,
then 192 row image draws per changing phase (256 total, rather than the estimated
150). Latitude resampling and strip geometry are prepared once. It uses the
accepted atlases, simulation phase and existing World/LFX painters.

Local headless Chromium measurement, 30 warm-up and 240 measured redraws per case;
script time for Mercury projection plus drawing to the stated destination size:

| Diameter | Existing per-pixel | Native image draws |
| -------- | ------------------ | ------------------ |
| 54px     | 2.07 ms            | 1.00 ms            |
| 323px    | 2.45 ms            | 0.90 ms            |
| 800px    | 1.98 ms            | 0.90 ms            |

A separate production-pass comparison on a 1920×1080 canvas measured the planets
pass at 5.71 / 3.51 ms (existing / candidate) at 1 px/u, and 5.05 / 2.05 ms at
3.2 px/u. Runs varied; these are same-run comparisons, not directly comparable to
the original review's timings or a guarantee of browser raster/compositing cost.

Five evenly spaced phases of the accepted Mercury atlas were visually compared
at 323px: the mineral arrangement and turn direction are retained, with a slightly
different sampled limb. A transparent test map retained both clear and visible
areas, and a full-turn return reproduced the same image. Practice was launched
through the Hangar with no browser errors; pause held ticks and the World image
unchanged, and Resume advanced ticks again. TypeScript and the frame-pass tests
passed. The broader Svelte check still reports two implicit-any errors and 34
warnings in four untouched rock-study components.

This remains a trial for review in actual Practice. iPad cost and the sustained
raster/compositing cost are unmeasured; offscreen culling is still separate work.

## Rotation trial follow-up, 2026-11-16

Following the lead review, Mercury and Venus remain on the native-image path in
Practice. The rotation step remains open; these measurements do not establish
performance acceptance.

Changes:

- The production planets pass supplies the displayed diameter, `radius × 2 × zoom`.
  Core rounds up in 8px steps through 128px, 32px steps through 512px, then 64px
  steps. Buffers rebuild on a bucket change, preserving the output canvas object
  referenced by the body painter. At 54 / 323 / 800px, buffers are 56 / 352 / 832px
  and redraws use 75 / 470 / 1110 image draws.
- Absolute phase is quantized to a fixed grid at each buffer size, at most one
  buffer pixel of equatorial travel apart. Sampling depends on phase and size,
  not the previously drawn tick. Over ticks 0–600, Mercury redraws 57 / 354 / 601
  times at those three sizes; Venus redraws 30 / 185 / 436 times. At 54px this is
  about eleven Mercury ticks between redraws, compared with redrawing every tick.
- Offscreen textured body drawing skips surface resize and rotation. Bounds include
  Venus's atmospheric stroke. Existing orbit/HUD work and light passes are untouched.
- The render spec's trial section is removed. Its method section now states that
  native image scaling/drawing counts as marks and per-frame pixel loops do not.
- The two loaders' true/false projector choices remain trial scaffolding, to remove
  when the trial ends. Material ownership and all Lab pages are unchanged by this
  follow-up.

### Before/after stress measurement

Headed Chromium 156.0.8078.4 on this Mac, 1920×1080 viewport, idle frame interval
8.3ms (120Hz). CDP reports both 2D Canvas and GPU compositing enabled. Before is the
original fixed-192px strip projector, not the per-pixel projector. After is the
screen-sized projector. The same Mercury atlas is used in both.

Each case prepares independent surfaces, forces every surface to redraw each
frame (phase advances 0.08 radians), then draws their images to a visible canvas.
Ten frames warm up; thirty frame intervals and submission times are recorded.
Increasing the number of surfaces produces dropped frames and includes deferred
browser work in the observed frame intervals. Script figures include submission
of the final body image. These are throughput measurements, not isolated GPU
latency, and buffer rebuilding is excluded after warm-up.

| Display diameter | Surfaces per frame | Script ms/redraw before → after | Observed frame ms before → after |
| ---------------- | ------------------ | ------------------------------- | -------------------------------- |
| 54px             | 128                | 0.233 → 0.078                   | 44.17 → 20.56                    |
| 323px            | 32                 | 0.231 → 0.401                   | 10.00 → 16.14                    |
| 800px            | 32                 | 0.230 → 0.936                   | 9.98 → 36.11                     |

Dividing the saturated batch interval by its count gives rough end-to-end
throughput costs of 0.345 → 0.161ms, 0.313 → 0.504ms and 0.312 → 1.128ms per
forced redraw respectively. Refresh quantization and shared presentation costs
are included; these are not precise single-surface latency measurements.

At 54px, 32 surfaces hold 120Hz with no dropped frames over the sample; at 64,
before drops 29/30 frames and after drops 7/30. At 323px, 16 surfaces hold 120Hz;
at 32, before drops 6/30 and after 27/30. At 800px, before holds 120Hz at 16;
after drops 1/30 at 8 and 28/30 at 16. The sharper close-view projection costs
more per forced redraw. Phase skipping reduces actual redraw frequency as listed
above; it does not make a required 800px redraw cheaper.

### Checks and limits

Automated browser checks passed: identical final images after shuffled tick
sampling and resize histories; pause stability; transparent-map clear and visible
areas; preserved painter canvas reference after resizing. The production planets
pass updated only the visible test body, made no surface calls when both bodies
were outside the view, and returned to exactly the fresh projection for that tick.
Actual Practice launched through the Hangar without browser errors; Pause held
both ticks and the World image, and Resume advanced ticks. TypeScript, formatting
and the two existing frame-pass tests passed.

On screen, both unlit materials were compared against the prior strip projector
at 54, 323 and 800px. Mineral layout and Venus cloud structure remain recognizable;
close-view edges are less stair-stepped and Mercury is sharper at the larger
buffer sizes. Actual Practice's lit Mercury, Sun and pause/resume were inspected.
No human visual acceptance is claimed. Sustained iPad cost, long-run thermal
behavior, zoom-driven resize spikes and a full end-to-end production-flight
profile are unverified. The stress workload forces redraws and is not a benchmark
of the entire game.

## Coordinator checkout verification, 16 November 2026

Read AGENTS.md, this complete plan, its render/layer, planet, star, Inspector,
Flight and Motion instrument specs, architecture and the referenced speed-camera
plan. Inspected shared status and relevant frame, painter, loader, simulation,
registry and Inspector source. The frame diff contains rotation diameter and
textured-body culling changes; per-planet HUD/light ids and unculled light calls
remain. Practice still assigns `G7, Sun`. RockBodyPainter still owns an angle/intensity
cache per instance and creates masks within `light`; CloudBodyPainter inherits it.
The spec's flat-disc exception does not exempt stock planets from the shared HUD.
Older planet-spec status/history and old orbit-style descriptions remain stale;
reconcile conflicting HUD wording when that spec is next edited, retaining only
the current contract. The speed-camera plan's baked-frame dependency is obsolete:
this work uses screen-sized browser drawing and does not depend on that proposal.

Ran `pnpm exec vitest run packages/mode-a/src/lib/flight-frame.test.ts`: both tests
passed. No performance measurement or browser inspection was performed in this
handover. Existing trial measurements below/above are inherited evidence, not new
measurements. Full checks, Inspector second-round runtime verification, stock and
failure presentation, raster/compositing and device costs remain unchecked here.
No server was started. Only this plan was edited; no commits or human acceptance.

## Not checked by the original review

- Cost on an iPad or any machine other than the one Mac.
- Raster and compositing time.
- The game itself in Practice; the production passes were measured in a harness on a
  Lab page.
- The darkening of ships or light over a planet body, on screen.
- The fallback paths in a real failure.
- The quilting code beyond its header, and the Practice planet tests.
