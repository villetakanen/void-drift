# Plasma integration retrospective

18 November 2026. Assessment of the stopped integration attempt, using existing conversation, source and measurement records. No new experiment was run for this report.

## Disposition: retain understanding, discard the implementation

The user has rejected this tryout as a foundation for another attempt. The next attempt must start from a verified pre-tryout baseline. It must not repair, selectively retain, cherry-pick, port, or refactor the failed tryout's implementation. This includes its new code, specifications, tests, fixtures, and Plasma bench. This report is a record of evidence and reasoning, not a migration plan or replacement specification.

The working distinction is important: a failed loop can contribute lessons and reveal useful approaches without contributing implementation to its successor. Reusing pieces of a rejected implementation can carry its assumptions forward unnoticed and produce expensive drift. Technical merits identified below do not override the discard decision.

Cleanup disposition, 18 November 2026: at the user’s explicit direction, project code was restored to verified pre-local-tryout RC1 `66391118f56ac69aef8d8aa08e9d5af382e1fc40`. The tryout’s added runtime, specifications, tests, Plasma bench, profiling scripts and experiment records were removed. This retrospective and the rejected historical integration plan were retained; unrelated background-star study work was left untouched. RC1 already contains the original plan and its assumptions: retaining that document does not approve its approach. Source paths and measurements below describe the removed attempt, not the restored working tree or reproducible current results.

The proposed working-method changes below remain for review. This report does not modify agent instructions or adopt them as standing rules. The discard boundary above is an explicit user instruction for the restart.

## Finding: the first wrong turn preceded implementation

The original request was to treat an accepted design study as a proposal and work out a performant integration. The initial assessment correctly distinguished design evidence from production authority and listed unresolved decisions.

The failure began when that uncertainty became an adopted local contract without adequate behavioral grounding. The RC1 plan says, “The experiment adopts the following behavior,” then supplies a fallback of outlets 30 degrees either side of the rear axis. That was an engineering invention affecting the weapon's visible and physical behavior, not a demonstrated interpretation of the design. The later source and spec implement it. The study's retained sequences instead show plasma moving forward and outward from the rifle, away from the ship's engine wake.

The same chain made the shot move at a fixed world velocity without carrying the ship's velocity. The later clarification about independent world objects exposed a deeper gap: the work had not sufficiently established what remains attached to the rifle, what is emitted, and how emitted material's motion, lifetime, damage and rendering relate.

The error was not simply that rendering looked wrong. An ungrounded interpretation had become simulation behavior, documentation and test expectations. Writing it into a spec did not make it a justified decision.

Historical evidence: [integration plan](2026-11-18-plasma-combat-integration.md), `docs/specs/game/plasma-rifle/spec.md` (historical reference), [operation study](../../apps/web/src/content/lab/studies/plasma-rifle-operation-2026-11-18.mdx). The plan and rifle contract are failed-attempt artifacts, not restart authority.

## How the mistake became an expensive loop

| What happened                                                                                                                           | Consequence                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broad integration began before one convincing release and target-loss sequence had established the interpretation.                      | The wrong behavior acquired dependencies across shared execution, modes, collision and effects. The broad destination was authorized; the implementation sequence was the problem.             |
| Tests primarily checked the new contracts and implementation.                                                                           | They caught real defects while leaving the invented motion model intact. Passing tests established internal consistency, not that the intended weapon had been understood.                     |
| Clean-context agents received the conductor's interpretation in their briefs.                                                           | Separate agents did not automatically provide independent expectations. Review needed to challenge the interpretation before checking conformance.                                             |
| Early performance work used the historical `/lab/fx` instrument.                                                                        | Sharing some drawing code concealed that the scene, composition and lifecycle differed from actual flight. Those timings could not establish production performance.                           |
| Stages were repeatedly described as complete or visually clear while significant interpretation and appearance questions remained open. | The reported status overstated what had been demonstrated. A mechanics prototype and an integrated weapon were different deliverables.                                                         |
| The correction then swung toward recovered study implementation details.                                                                | Exact prototype dimensions, timing and recipes were treated too much like requirements. This contradicted the original request to engineer the intended experience rather than port the study. |
| Repeated full verification ran against a changing shared tree, and some runs lacked local-server permissions.                           | Infrastructure failures and source changes added avoidable repetitions. These amplified cost but were not the original conceptual failure.                                                     |

No subscription-quota percentage or exact cost has been established by the available evidence. The conversation and retained runs do establish repeated work and invalidated verification. There is no basis for assigning a precise fraction of cost to each cause.

## What changed in targeting and collision

This section answers what the attempt changed and what can be learned from it. It does **not** mean that targeting was completely fixed, or recommend retaining these implementations. A fresh attempt must establish its own contracts and implementation from the clean baseline.

### Acquisition and physical contact became separate questions

The attempt introduced a shared `CombatWorldQuery` inside `salvage.ts`. Its candidate view can be filtered by encounter policy while its physical view contains bodies that can intercept a shot. Player and enemy mounted weapons use those views through the existing scheduler.

That separation is useful conceptually. A pirate may intend to shoot the player while another pirate intercepts the shot. A plasma rifle may acquire ships and wrecks without acquiring fragments, while physical fragments can still obstruct it under the chosen damage policy. Intention, obstruction and damage eligibility should be distinct decisions.

Weapon differences were retained rather than replaced with a universal cone:

| Profile           | Acquisition used by the attempt                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Plasma rifle      | Living ship/wreck centres in a muzzle-centred sector; nearest initial target with stable ID tie breaking, then retention while eligible.    |
| Light Ion Cannon  | Actual material in a forward ship-width rectangle, with a captured ready volley before individual shots resolve.                            |
| Ion Point Defence | Closest eligible material within tracking range, preserving turret turning and retention behavior.                                          |
| Rail and laser    | Existing family-specific rules; rail's enemy acquisition was corrected to consult the intended-target view rather than every physical body. |

This was not a completed generic targeting engine. The query class remained inside the large salvage owner. Some queries still allocate candidate arrays, sort, and use trigonometric/distance calculations. Combining physical body views can also allocate arrays. The work did not make every query allocation-free or remove the cost of scanning bodies.

Source record: `packages/mode-a/src/lib/salvage.ts` (historical reference). Existing family behavior and the distinction between intent and contact should be reconsidered from baseline sources, not copied out of this attempt.

### Cheap rejection reduced expensive material work

The attempt used bounded scans with broad rejection before detailed collision. It did **not** implement the spatial grid discussed in the initial plan.

- A coarse swept circle rejects bodies a cast cannot reach before testing actual derelict material.
- A conservative circle-versus-acquisition-rectangle test avoids constructing/clipping world polygons for cannon candidates that cannot intersect the rectangle.
- Closest-point calculations compare squared distances and keep scalar coordinates while walking edges, avoiding a temporary point object and square root on every edge.
- Existing precomputed derelict material and released-mask caches were reused. Those caches were already present; the attempt did not invent them.

The generalizable finding is to measure and reduce repeated exact-geometry work before assuming a spatial index is necessary. A bounded scan can be an appropriate starting point for small populations. It still has worst-case work proportional to queried bodies and material complexity; a common interface alone does not solve scaling.

Source record: `packages/mode-a/src/lib/derelict-collision.ts` (historical reference). Preliminary timing improvements were observed, but some runs were contended and later fixtures differed. They must not be presented as a controlled universal speedup.

### All modes reached shared mounted execution

Practice acquired an empty-world weapon execution path instead of gaining unwanted encounters. Derelicts and Survival used their encounter bodies. Gauntlet supplied live ship contacts, a shared wreck owner and separate intended-target policy. The work preserved defence-before-guns funding, mount order and the cannon's captured-volley behavior.

The useful lesson is that shared infrastructure need not make modes populate the world identically, nor make weapons aim identically. A fresh implementation must explicitly preserve these intentional differences.

Enemy planning is separate from weapon execution. Planning was eventually removed from scope, and the added rifle-aware pilot scoring was removed. The existing planner's cost is not evidence that a targeting query is slow, and the proposed manoeuvre-table replacement was not adopted.

Source records: `packages/mode-a/src/lib/simulation.ts` (historical reference), `packages/mode-a/src/lib/gauntlet.ts` (historical reference).

### Continuous collision revealed valuable counterexamples

The attempt represented fumes with bounded moving sections, separate from visual particle count. It calculated contact intervals and their union across two outlets, rather than treating endpoint samples as the whole spray. This required more care than the initial plan suggested.

Independent counterexamples exposed issues that ordinary successful firing tests missed:

- A body can touch the capsule between two sample points while touching neither endpoint disk.
- A fast sweep can enter two separated regions of wreck material; merging first entry to last exit erases the intervening hole.
- Crossing between overlapping outlets must not count as another entry; a real exit and later re-entry must.
- A hit before an arena wrap must remain possible without sweeping across the entire arena afterward.
- A body cannot be hit before its birth or after an earlier expiry; breakup must use its position at the event time.
- Damage from an enemy must not produce player kill credit, even when it uses the same wreck owner.

These are useful **problem cases** to preserve in prose. The failed attempt's tests and collision implementation are not to be carried into the restart. Whether a future design requires this degree of fume-contact precision is itself an engineering decision to review, not an obligation created by the existence of the code.

Source records: `packages/mode-a/src/lib/plasma-collision.ts` (historical reference), `packages/mode-a/src/lib/plasma-collision.test.ts` (historical reference), `packages/mode-a/src/lib/plasma-rifle.test.ts` (historical reference).

### What this did not resolve

The attempt still launched fumes in the wrong relative direction and launched the stream without inherited ship velocity. Released state remained organized under mounted rifle state and its presentation remained closely associated with actor rendering. That storage choice alone does not prove a performance or correctness defect, but the intended independent-world behavior had not been made sufficiently explicit.

The later suggestion of an encounter-owned map was a proposal, not an implemented or validated resolution. Neither that proposal nor a general entity framework should become a requirement for the restart. The experience and lifecycle must be settled first; storage is an engineering choice.

## Other findings that would have helped earlier

| Finding                                                                                                   | Why it would have helped                                                                                                                                   | Boundary for another attempt                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The real render contract is the complete `drawFlightFrame` stack: World, persistent FX and immediate LFX. | A page can import production helpers while still presenting a materially different scene and composition. That happened with the historical effects bench. | Verify the execution path before selecting a benchmark. Do not retain the failed bench implementation; rebuild an instrument only if the new experiment needs one.                           |
| Attached charge, emitted material and accumulated light are different kinds of state.                     | Confusing them makes it easy to anchor released effects to a ship or mistake a painted trail for moving matter.                                            | State intended independence, inherited motion and lifetime explicitly. Do not infer that this mandates a particular class hierarchy or particle system.                                      |
| Visual particles need not be collision entities.                                                          | The design's richness does not require collision work for every visible spark or puff.                                                                     | Choose bounded collision representations and bounded decoration independently, then check that both describe the same observable event.                                                      |
| Original study source and capture conditions existed but were recovered late.                             | They clarified ambiguities in the pictures and exposed the reversed motion and misleading comparison setup.                                                | Use them to understand the proposal, not as code to port or a demand for exact prototype parameters. Temporary `/private/tmp` files are not durable project documentation.                   |
| Review scenes changed camera, target motion, world clutter and displayed timing.                          | These differences made comparisons unreliable and obscured motion errors.                                                                                  | Compare controlled, honestly labelled conditions, then inspect the real game. Matching a screenshot is not the goal.                                                                         |
| Workload counters matter.                                                                                 | One early stress fixture did not complete a shot, so apparently good timing could have measured mostly idle weapons.                                       | Record actual acquisitions/releases/contacts and population alongside timing. Distinguish active ticks from cooldown-heavy averages.                                                         |
| Synthetic CPU profiles and game-frame measurements answer different questions.                            | Node fixtures excluded rendering and some physics, advanced faster than real time and reset populations periodically.                                      | Report exactly what was timed. Such fixtures cannot establish presented frame rate or long-run game memory stability.                                                                        |
| Hidden Chromium cadence changed between sessions.                                                         | Roughly 30 Hz and 60 Hz callback cadences were both observed; raw frame intervals and per-callback costs were not directly comparable across sessions.     | Record browser, acceleration, backing size, cadence control and workload. Do not derive GPU/FX cost by adding unrelated trace percentiles.                                                   |
| Local browser execution did not mean local backend execution.                                             | Existing environment files pointed at remote Firebase.                                                                                                     | Future experiments need an explicit offline/emulator boundary before services initialize. Reimplement from the appropriate baseline if needed; do not retain this tryout's guard by default. |
| The shared checkout continued changing.                                                                   | Full suites could pass their stages yet fail the unchanged-source requirement.                                                                             | Use an immutable local snapshot for final verification when needed, ensure dependency links resolve inside it, and disclose snapshot-only differences.                                       |
| Clean context is not sufficient independence.                                                             | Briefs transmitted the conductor's assumptions to subsequent agents.                                                                                       | Have a reviewer derive expectations from original intent before reading the proposed solution. More agents are not a substitute for a clear question.                                        |

## What the recorded measurements establish

The removed experiment record, `docs/loop-evidence/2026-11-18-plasma-combat-local-experiment.md`, reported a normal Derelicts run with two releases/contacts and sixteen peak bodies. It recorded a whole-flight callback p95 of 2.025 ms. The temporary sixteen-Wasp instrument recorded update plus drawing submission p95 of 6.0 ms for twin rifles and 5.0 ms for rifle-plus-turret. Those measurements used simplified effects on one Mac; they did not establish the intended weapon or final appearance.

The removed CPU profile record, `docs/loop-evidence/2026-11-18-plasma-combat-profile.md`, reported a separate dense weapon-only p95 of 2.122 ms. It includes idle/cooldown periods, uses an unpaced synthetic workload and periodically resets its world. It is not a full-game frame measurement or a live memory-stability result. Historical planner timings are outside the final narrowed scope.

The complete suite passed on an isolated pre-final-visual snapshot with unchanged source. Later visual work and the rejected captures are not certified by that earlier pass. Subsequent measurements on revised visuals remain records of those specific candidates, not proof that the rejected interpretation was correct. Passing checks does not override the discard decision.

These results support the feasibility of investigating bounded combat and shared rendering. They do not establish that this implementation should be kept, that the original architecture must be retained, or that another implementation will automatically meet the same costs.

## Proposed working changes for review

1. **Separate intent, engineering choice and unknowns before changing behavior.** Use a short decision brief, not an expanding design document. A consequential unknown must be investigated or raised explicitly; it must not become a rule simply because implementation needs a value.
2. **Demonstrate one representative behavior before generalizing.** One ship, one moving release and one moving target-loss sequence through the real game path would have exposed this interpretation early. Show motion, not only still images. This is an engineering checkpoint, not a request for human playtesting proof.
3. **Review the interpretation independently.** Derive expected behavior from the original request and study before reading the implementation contract. Ask which assumptions could produce a technically correct implementation of the wrong weapon.
4. **Bound correction loops and verification effort.** Agree an effort allowance and stopping condition per experiment. A proposed limit is one implementation attempt and one correction round for a disputed interpretation; a fundamental mismatch stops coding. Run focused checks during iteration and the full suite on a stable candidate. If the loop is rejected, restart from baseline using lessons only—do not turn the correction limit into permission to salvage rejected code.

Completion language also needs discipline: “implemented,” “tests passed,” “performance measured” and “intended behavior demonstrated” are separate claims. None should silently stand in for the others.

The central lesson is not that the user must specify every engineering detail. The agent must expose consequential assumptions early and must not use additional implementation effort as a substitute for understanding the intended result.
