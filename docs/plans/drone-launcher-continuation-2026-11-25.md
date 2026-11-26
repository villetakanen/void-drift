# Drone launcher study — continuation brief

Written 2026-11-25 from the session context. This is a handoff, not a production decision. Check the current study, specs and code before continuing; this brief will go stale.

## Resume here

The designer paused after substantial progress and requested a clean-session handoff. Start with this brief, the study and its current implementation, then ask the designer which case to explore next. Do not invent a roadmap or promote the study into production. The user requested first-mate mode for this work; continue that workflow unless they cancel it, following its skill and delegating changes.

- Study: `apps/web/src/pages/lab/studies/drone-launcher-2026-11-25.mdx`, registered as open exploration.
- Live surface: http://localhost:4321/lab/studies/drone-launcher-2026-11-25#025--pursuit-return-and-drift
- Implementation: `apps/web/src/components/studies/drone-launcher-2026-11-25/`, especially `drone-pilot.ts`, `flight-motion.ts`, `launch.ts`, `launch-motion.ts`, their tests, `FlightBench.svelte`, `SizingBench.svelte`, `MasterSpecimen.astro` and `sizing.ts`.
- Source assets: `apps/web/public/studies/drone-launcher-2026-11-25/` (confirm the current location when resuming).

## Study premise and accepted study choices

The launcher manufactures drones with fission payloads from potential after a delay, when its weapon has an enemy target. Enemy proximity should trigger an explosion; otherwise a drone should return to its carrier and convert to energy. Without a target or carrier in range, engines switch off and stabilizers settle rotation. Manufacturing, attack and recovery are still premises, not implemented behaviors. The initial three-active-drone cap remains unsettled. Fission effects share the nuclear color family; the drone uses an ion drive.

02.1 preserves the supplied hacked SVG appearance and proportions as flat named paths. 02.2 accepted the supplied fitting JSON: 17u length, 68% anchor, compared in the actual Fighter aft slot against Ion and Plasma.

02.3 accepted a default 70u/s ejection over the carrier. Preview begins 0.10s before release, with the drone appearing at the yellow receiver hexagon. The drone follows translating and rotating rails until its centre reaches the muzzle, then inherits carrier translation and angular muzzle velocity. The 32u coast distance includes rail travel; ignition cannot precede muzzle exit. The blue world gradient is always decoration, not an effect. G4 is the smallest available G-class star, with radius 36u; the carrier is outside gravity and there are no planets. This section is now compact static captures and conditions JSON. Older repeated release timings (1, 3, 5… seconds) are superseded by 02.5's single inspection launch.

02.4 explored Wasp turn-or-fly, Fighter jet and Scout wushu profiles. The designer selected Fighter with its actual stabilizer response via `applyBuildEngines(referenceFighter)`. Canted net force and counterburn stop rotation; the original fabricated angular-rate response was insufficient. Baseline acceleration is 60u/s². The production `engineImpulse` taper reaches zero positive acceleration along velocity at 271u/s: this is not a velocity clamp. Inherited overspeed persists, while braking and transverse acceleration remain available.

Plume size interpolates between actual ServiceIon (0.7 length/width) and LightIon (1/1). Default 50 gives a 40.8u full-output source, blue ink and production square-root output scaling. The earlier fixed burn became L/F/R/F, each lasting 0.5s after ignition. 02.4 now holds static captures of the accepted Fighter setup. The designer initially suspected an off-phase plume bug, then explicitly stopped that investigation after finding no bug; there is no pending plume bug from that exchange.

## Current live 02.5 behavior

One Fighter drone launches toward a moving Scout target from a carrier coasting at 40u/s. This bounded single launch is for inspection, not a capacity decision. All three distances are adjustable and provisional; the designer suspects they may need changing.

- Launch eligibility: enemy at most 450u centre-to-centre from the carrier.
- Airborne Pursuit: enemy less than 500u from the drone; this has priority.
- Otherwise Return: carrier less than 500u from the drone.
- Otherwise Drift: main engines off, stabilizers brake spin; velocity persists.

For initial eligibility, preview starts at 0.9s and release is at 1s if still eligible. Later eligibility gets a 0.1s preview. Losing eligibility cancels preview, and eligibility is rechecked at release.

Two courses demonstrate actual range transitions, not forced states:

- Long pursuit: release at 1s, ignition about 1.467s; Pursuit → Drift at 8.833s through the 14s end. At transition enemy distance is about 501u and carrier distance 726u. Main output is zero, spin settles from about −30 to zero, speed remains about 81u/s; final carrier distance is about 836u.
- Early departure: Pursuit → Return at 3.733s through 14s, ending about 3u from the carrier, with drone velocity about 41u/s versus carrier 40u/s.

The target script has continuous position and velocity and sets up the scene; it is not enemy AI. The drone pilot precomputes 129 spin bins × four responses (Off/L/R/F) from the accepted Fighter. It evaluates eight candidate first/continuation sequences over 1.2s, using 0.3s for the first action followed by Off or Forward, executes the first action and replans every eight ticks at 60Hz or immediately on mode change. The production 271u/s taper applies in live motion and prediction. Return values matching carrier velocity. This is not a transfer of production standoff, hazard, energy or pirate rules.

No attack, collision, recovery energy conversion or manufacturing is implemented.

## Shared flight instrument changes already made

The user explicitly requested spec-first changes, independent verification, then implementation. AUTO uses the production camera including the settings/speed branch. Fixed 1×/2×/4×/8× modes mean 0.5/1/2/4 CSS pixels per world unit across viewport sizes. Old follow/near/far IDs were removed. The lab-instruments skill and canonical/active fission/derelict consumers were updated.

Two accepted historical studies, `flight-scene-instrument-2026-11-10` and `rock-atmospheres-2026-11-15`, were converted to static MDX at their existing URLs. Nine reconstruction captures explicitly name their reconstruction date; old apparatus was removed. Do not confuse these captures with original historical screenshots or new adoption decisions.

## Verification at handoff

The reported latest implementation checks were 21 study tests plus full type and lint checks passing. Five strengthened duration/pilot tests were rerun and passed. A prior 400-test run belongs to an earlier step and is not the final snapshot. The commit worker is responsible for the actual final checkout and commit verification; this brief does not assert a commit or push has happened.

Independent browser checks at 1280px and 1512px verified that a 50u launch gate suppresses launch and 450u restores it, all three range controls reset, both courses play and seek backwards, Return reaches about 3u, and Drift has zero main output, settled spin and persistent approximately 81u/s speed. A raw `<500` in MDX caused a rendering error despite type checks; it was rewritten in words and verified in the browser. The optional fidelity measurement was updated but not rerun. At 1× overview the drone is very small; use its plume and range circle to locate it. The world gradient was not independently resolvable at that scale.

## Unsettled next questions

The three ranges; attack proximity; return docking and energy conversion; manufacturing potential cost and delay; active cap; selection among multiple enemy targets; gravity and collisions; and any production adoption remain open. For any adoption, first settle whether the project wants the proposal and what subjects it applies to, then record the decision in the relevant spec before changing production code.

## Practical lessons for the next session

Use the shared preview on port 4321 (`pnpm dev:ensure`, `pnpm dev:status`). Managed-process inspection may require escalation. Stale dynamic imports after deleted apparatus were resolved by one `pnpm dev:restart`; inspect the reported log for compilation errors. Freeze edits during visual checks because HMR resets the scene. A CUA tab already held by another session required a fresh capture tab. Keep Lab checks at least 1280px wide, reset viewport after checks, and finish CUA work with `completion_summary`.

Incremental designer feedback, production physics reuse, cached responses, independent review and static records of accepted exploration worked well. Automated passes did not establish plume readability: the designer corrected an initially faint plume and the fabricated angular response. Trying to fit all three modes into one 14s scene consumed repeated fixture tuning; the launch gate changed the premise, and two honest courses resolved it. Distinguish screenshot evidence from behavior/timing evidence when reporting further checks.

## Addendum · 2026-11-26

02.6 was added after this brief. It digests three outside models' proposals for the fission family (Gemini Neon, GPT Astra 6.2, Fable 5.2) and keeps their files as received under `apps/web/public/studies/drone-launcher-2026-11-25/02-6-sources/`, which Biome ignores. The step builds nothing and selects nothing: it lists five options for the drone's detonation, restated in the construction the plasma studies arrived at, and leaves the live bench in 02.5. Engine ideas recorded there are material for the open fission light study. That session worked directly, without first-mate mode.

02.7 followed the same day and was rebuilt once. Its first version was a bench of 02.6's marks (core, leaves, branches, rings); the designer found that nothing in it belonged to the game's light, and it was removed. The lesson, which the plasma studies had already reached: settle what a light expresses first, then paint that onto FX and LFX with the game's own kinds of mark. Outside research inspires and does not direct.

The current 02.7 states what fission light says (no gathering; a local flash frame; matter answers; the remains leave as a shell; the place stays wrong; frightening, fatal, final, immoral) and paints it in `fission-light.ts`. `fission-charge.ts` stages a bare charge beside three ships at rest, and `FissionBench.svelte` groups its controls under those sentences. The drone, the launcher and the fission engine are deliberately out of this step; the engine is to be redesigned after the language exists. 02.6 is unchanged: its ideas stay as naive readings that 02.7 puts to work or leaves untried. 02.5's bench and `launch.ts` are unchanged. No values have been judged and frame time has not been measured.
