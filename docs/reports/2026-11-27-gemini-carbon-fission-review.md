# Fission adversarial review

## Steering at cruise

**Project caveat, 2026-11-27.** Steering authority at cruise is a critical handling issue on the [0.8 roadmap](../roadmap.md#080). The review identifies a specific Fission mechanism: the speed ceiling clips a side-mounted nozzle’s push and reduces its torque by the same fraction. The release decision is broader. How straight and angled mounts steer at cruise is a flight rule across engine families, even though their implementations differ. Address it with release-wide tuning in 0.8 or the following release. Avoid a last-minute 0.7.x change.

## Fission exhaust timing

The existing flash and exhaust timing is an accepted arcade effect. Comparing its feel with sampling the nozzle pose at the start of the firing tick remains a separate 0.8 Maybe item.

## Original review

 ### Adversarial Findings

 #### 1. [CRITICAL] Side-mounted Fission and at-ceiling steering are
 broken (packages/mode-a/src/lib/build-flight.ts:346-455)

 - What the study, plan, and spec expect:
     - Study 03
       (apps/web/src/pages/lab/studies/fission-engine-2026-11-26.mdx)
       : "Keep the 02.6 response. A side nozzle delivers the full
       impulse along its mount angle. Its offset from the centre of
       mass turns the ship. On B2 with the initial tuning, the first
       tick on the left pad takes the side-fission Fighter to 30°/s
       against 4.1°/s for the all-ion Fighter."
     - Plan (docs/plans/2026-11-27-fission-playground.md): "the
       abrupt turn on B2, not just the straight speed trace, is
       evidence to preserve."
     - Study 02.6 (fitting-flight.ts in fbfddfe6) added the angled
       kick, projected resultant velocity back onto
       poweredCruiseCeiling (preserving transverse velocity
       rotation), and applied 100% unscaled angular torque.
 - What buyFissionIgnition + kickFraction actually do:
   kickFraction (build-flight.ts:346-364) only scales along the
   straight ray v⃗ + f · Δv⃗ such that ‖v⃗ + f · Δv⃗‖ ≤ V_ceiling, and
   scales angular impulse by the same fraction (motion.velocity +
   (torque * fraction) / inertia, line 431).
 - Three concrete failure modes in flight:
     1. Dead-stick lockup with stabilizers off: On a Fighter (angle =
        26°), Scout, or Corvette with stabilizers: false flying at
        poweredCruiseCeiling (room = 0), pressing the left or right
        pad gives v⃗ · Δv⃗ > 0 (cos 26^∘ > 0). Line 360 (if (room === 0
        && dot >= 0) return 0;) returns 0 forever. The ship cannot
        turn or steer at all once at cruise speed.
     2. 0.15% micro-kick charging 100% energy on B2 (Fighter side
        Fission): With stabilizers on, pressing the left pad at t =
        6.00 s on B2 runs Fighter’s bow stabilizer first on substep 0
        (fx = -0.290 in packages/mode-a/src/lib/stabilizers.ts:44),
        shaving ∼ 0.057 u/s off forward speed. kickFraction then
        computes fraction ≈ 0.0015 (0.15% of a kick).
        buyFissionIgnition debits the full 0.5 E, locks the nozzle in
        16-tick recovery, emits a full blast + two damaging fronts,
        and delivers ~0.04°/s of Fission turn instead of ~26°/s
        (~3°/s total vs Study 03’s 30°/s). This repeats until
        stabilizers slowly rotate the hull past 64^∘ (64^∘ + 26^∘ =
        90^∘).
     3. Weakened test hid the bug:
        apps/web/src/lib/instrument/paid-ignition.test.ts:64-66 only
        asserts
        expect(side.samples[turn].spin).not.toBeCloseTo(replay(fighte
        rIon).samples[turn].spin) — which passes only because Fighter
        side Fission has mass 139 vs Fighter aft ion mass 125 on the
        stabilizer burn, not because the side Fission kick turned the
        ship.
     4. Same pathology for aft/centre Fission turning near 90^∘ at
        ceiling: Up to 90.0^∘ off velocity, dot >= 0 withholds
        ignition completely; at 90.5^∘, fraction = -2·dot / kickSq
        fires a tiny ~2–10% micro-kick at full 0.5 E cost and 16-tick
        cooldown.

 ────────────────────────────────────────────────────────────────────

 #### 2. [HIGH] Exhaust-vs-derelict collision violates the shared
 derelict shape contract
 (packages/mode-a/src/lib/fission-contact.ts:181-201)

 - Contract (docs/specs/game/world/derelict/spec.md, D2 &
   Guardrails):
   "What is drawn is what collides. A wreck and each piece collide
   with the shape that is drawn, gaps included. A wreck that has shed
   a piece no longer collides or draws there." / "One shape
   definition serves drawing and collision."
 - What fission-contact.ts does:
   Unlike drone-contact.ts:42-99 (which sweeps
   getDerelictWorldPolygons respecting releasedMask and the central
   aperture), fission-contact.ts:198 passes body.radius
   (SALVAGE.wreck.radius = 18) into circular sweepFissionFront.
 - Impact:
     - An intact derelict spans ~110 u end-to-end (± 55 u) along its
       long axis (DERELICT_SCALE in derelict-geometry.ts:255). A 18 u
       circle misses ~37 u of visible solid derelict hull at both
       ends — Fission blasts visibly engulfing the nose or tail deal
       zero damage.
     - Conversely, once a wreck sheds shards (releasedMask at
       20%/40%/60% damage) or across its hollow aperture, the 18 u
       circle registers hits on empty space.
     - Note also an asymmetry with drone-flight.ts:448: drone waves
       damage detached derelict fragment hazards (body.kind !==
       "cell"), whereas fission-contact.ts:185 (body.kind ===
       "wreck") leaves detached fragments immune (matching
       fission-engine/spec.md’s wording "intact damageable derelict",
       though partially-shed wrecks still have kind === "wreck" while
       adjacent shed pieces take no damage).

 ────────────────────────────────────────────────────────────────────

 #### 3. [MEDIUM-HIGH] Motion instrument spec violations and
 simulation divergence (apps/web/src/lib/instrument/)

 1. calculatePaidIgnition omits reserveSeconds
    (apps/web/src/lib/instrument/paid-ignition.ts:59,125):
    Simulation.step passes reserveSeconds: (3 * STEP) / 4
    (packages/mode-a/src/lib/simulation.ts:607) so buyFissionIgnition
    reserves gross continuous loads for substeps 1–3.
    paid-ignition.ts:59 leaves reserveSeconds undefined (0). When
    battery approaches the ignition price on a mixed Ion+Fission
    Fighter, the Motion instrument buys ignitions that real flight
    withholds and then starves continuous engines on substeps 1–3,
    contradicting docs/specs/lab/motion-instrument/spec.md ("uses
    game-owned Fission impulse, recovery and per-nozzle payment").
 2. LEGACY_FISSION pins a retired simulation version in live rooms
    (legacy-fission.ts, calculate.ts:50, energy.ts:43,62,74):
    docs/specs/lab/motion-instrument/spec.md:31,86 states: "Without
    tuning overrides they use current game values" and "Live
    instances follow current production laws under the configured
    conditions... embedded experiments do not pin old simulation
    versions." Yet ordinary Ship tuning, Energy analysis, and Gravity
    tuning hardcode LEGACY_FISSION (mass: 16, +17 u/s, draw: 3, 0.18
    s / 0.45 s pulse) whenever paidIgnition is false.
 3. Forbidden designer-facing JSON import remains in
    DocumentPanel.svelte
    (apps/web/src/components/lab/instrument/DocumentPanel.svelte:134-
    154):
    docs/specs/lab/motion-instrument/spec.md:84 specifies "there is
    no designer-facing import." DocumentPanel.svelte only hid
    <details><summary>Load a document</summary>...</details> behind
    {#if !config.paidIgnition}, leaving JSON import active in default
    mode.

 ────────────────────────────────────────────────────────────────────

 #### 4. [MEDIUM] Substep-0 ordering integrates angular kick for 3/4
 tick vs 4/4 tick for linear kick
 (packages/mode-a/src/lib/gauntlet.ts:143-185)

 In stepMountedActor on substep === 0:
 1. applyBuildEngines runs first and advances ship.rotation +=
    motion.velocity * dt (build-flight.ts:257) using pre-ignition
    spin.
 2. buyFissionIgnition runs second, adding dx, dy to ship.vel, adding
    angular impulse to motion.velocity, and exporting ignition world
    pose using (ship.pos @ t, ship.rotation @ t + STEP/4).
 3. updateShip runs third, integrating ship.pos += ship.vel * dt.

 Consequently, a Fission kick’s linear velocity integrates across all
 4 substeps (STEP), while its rotational impulse only integrates
 ship.rotation across 3 substeps (3/4 * STEP) on the ignition tick,
 and the recorded nozzle pose mixes start-of-tick position with
 post-substep-0 rotation. (fission-flight.test.ts:70 started at spin
 = 0 with stabilizers = false, so it never caught this.)

 ────────────────────────────────────────────────────────────────────

 #### 5. [MEDIUM] FX rendering bugs, uncounted LFX budget, and
 incomplete performance evidence

 1. Counter-sparks are pruned up to 7.07 u short of their target
    length
    (packages/core/src/lib/effects/fission-exhaust.ts:227,274):
    drawReturn advances end = Math.min(spark.end, 2 + age *
    RETURN_SPEED) (RETURN_SPEED ≈ 9.07 u/tick), which lags (age + 1)
    * RETURN_SPEED by 7.07 u. Yet capture() prunes sparks using
    spark.tick + Math.ceil(spark.end / RETURN_SPEED) - 1 > oldest.
    Whenever spark.end % RETURN_SPEED > 2 (~78% of contact distances
    — e.g. a 9 u return spark where Math.ceil(9 / 9.07) = 1), the
    spark is deleted after age = 0 having drawn only 2 u instead of 9
    u (or 47.3 u instead of 54 u).
 2. LFX uses a second FxPass whose stamps/drops are invisible in
    /lab/fx (packages/mode-a/src/lib/gravity-fold-fx.ts:104,296,
    packages/mode-a/src/lib/fx-bench.ts:39,295,
    apps/web/src/components/lab/FxBench.svelte:169-171):
    FlightFx and FxBench allocate a separate FxPass (128 essential +
    1024 decoration) for LFX instead of sharing one whole-scene
    budget, and FxBench.svelte (and scripts/profile-fx.mjs) only
    reads bench.fx.pass.budget. Any LFX stamps or drops for Fission
    flashes, live lances, live tips, or live return sparks go
    completely unreported in /lab/fx.
 3. Lazy canvas/gradient rasterization inside the live frame loop
    (packages/core/src/lib/effects/fission-exhaust.ts:178-197):
    prepareFlash() allocates a 180×360 canvas and builds a radial
    gradient on first drawFlash() inside live(), violating
    docs/specs/game/render/spec.md ("Pixel preparation happens
    outside the frame loop"; compare prepareAtmosphericHeat() in
    FlightFx’s constructor).
 4. Performance evidence does not yet meet
    docs/specs/factory/effects/spec.md:
     - All five 2026-11-27 runs in artifacts/fx-profile/ are 12 s
       fixed-camera runs in headless Chromium on SwiftShader software
       rendering (2d_canvas: unavailable_software, gpu_compositing:
       disabled_software), where FxBench.svelte’s p95 (5.1–11.2 ms)
       bundles 6×4 simulation substeps with FX submission. There is
       no GPU-accelerated desktop trace, no moving-camera run, and no
       physical iPad/mobile evidence against the < 3 ms whole-scene
       effects budget.
     - In packages/mode-a/src/lib/fx-bench.ts:173-189, fission-heavy
       leaves linkedEngines false during 120 <= phase < 180
       (commanding 4 nozzles rather than 16) and lane-wraps ship.pos
       without resetting ship.vel or refreshing power, so straight
       segments quickly hit cruise ceiling / battery limits instead
       of sustaining 16-nozzle bursts.

 ────────────────────────────────────────────────────────────────────

 #### 6. [LOW] HUD feedback, roadmap, and git hygiene

 - Missing HUD engineFeedback
   (packages/mode-a/src/lib/simulation.ts:500-519,
   apps/web/src/components/FlightDeck.svelte:956): Because
   applyBuildEngines exits before engineTimers for paid-ignition,
   simulation.engineFeedback is always "" for Fission mounts (no
   firing or recovery readout on the flight HUD).
 - Inaccurate specimen copy
   (apps/web/src/components/lab/flight-scene/FissionFlightComparison.
   svelte:31): States "Two Fighters fly B1 from rest with weapons
   off", whereas FlightRun.build() leaves weaponsChoice at "auto" on
   an unarmed Fighter loadout.
 - Missing roadmap entry (docs/roadmap.md): Unlike Drone Launcher
   (also Playground-only and listed under Done), Fission engine is
   absent from docs/roadmap.md (AGENTS.md: "Keep the roadmap to one
   short, player-facing bullet per item under Maybe or Done").
 - Unrelated files + typo in commit b6e638d3 & dirty checkout:
     - b6e638d3 (feat: refine fission engine flight and effects)
       committed .pi/agents/git-keeper.md and
       .pi/agents/fix-assesor.md (misspelled fix-assesor in filename,
       frontmatter name, and git-keeper.md).
     - Working tree has uncommitted leftover edits (M
       apps/web/src/components/FlightDeck.svelte, D
       apps/web/src/lib/experimental.ts).

 ────────────────────────────────────────────────────────────────────

 ### Priority Fix Order

 1. Fix buyFissionIgnition ceiling/steering law (build-flight.ts) —
    decide explicitly whether Fission projects resultant velocity
    onto max(speed, ceiling) like engineImpulse / Study 02.6 while
    delivering full mount torque (restoring the 30°/s B2 turn and
    stabilizer-off steering), and tighten paid-ignition.test.ts to
    assert actual turn rate (~30°/s) and stabilizer-off steering at
    ceiling.
 2. Use derelict-collision.ts in fission-contact.ts so Fission fronts
    sweep actual drawn derelict polygons and respect releasedMask and
    apertures per derelict/spec.md D2.
 3. Align Motion instrument with its spec — pass reserveSeconds: (3 *
    DT) / 4 in paid-ignition.ts, remove Load a document from
    DocumentPanel.svelte, and resolve LEGACY_FISSION vs
    motion-instrument/spec.md’s no-pinned-versions rule.
 4. Fix substep-0 spin/pose ordering in stepMountedActor
    (gauntlet.ts) and fix ReturnSpark expiry + pre-init flashStamp +
    LFX budget reporting in fission-exhaust.ts / FxBench.
 5. Clean up git/docs — commit or revert experimental.ts removal, add
    the docs/roadmap.md entry if intended for 0.8.0, and capture real
    GPU desktop + physical iPad performance traces before claiming
    effects/spec.md budget sign-off.