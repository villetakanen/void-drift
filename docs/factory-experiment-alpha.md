# Loop 1 retrospective: a voice-led playable alpha

Closed for learning: 2026-10-28. This is a case study and a set of lesson candidates,
not new standing instructions or a claim of complete ASDLC conformance.

## Case and result

An older space-game repository had tests and a build, but those checks did not establish
that selectable ships actually flew differently, that the camera supported the intended
experience, or that players could compete on a working leaderboard. Its instructions,
backend implementation and old backlog no longer consistently represented the owner's intent.

The owner reset the direction through conversational prompts: deliver a substantial,
playable three-ship experience and rebuild the development factory around conversation,
a browser and a Lab. Keyboard play came first; landscape touch remained in scope.
The camera reference meant both automatic framing and arena wrapping. Firebase was
preferred, with no paid services. Ship tuning belonged in the Lab, not the player menu.

The loop delivered the shared game/Lab simulation, flight tuning and replay, camera
framing/wrapping, keyboard and touch input, and Firebase competition. It also delivered
an executable verification command and separate release evidence. Gravity/friction
constants were preserved. Existing ship-selection work was checkpointed separately.

After the release, the owner said: “The end results are actually really good. I really
love them.” This is positive overall experience feedback. It is not a measured acceptance
of every ship's difficulty, every camera transition, or performance on physical phones.
The owner requested this learning record before starting another loop.

## The loop we actually ran

1. **Recover intent.** Retire the old backlog as an authority and clarify the camera,
   backend, control surfaces, tuning boundary and autonomy expectations.
2. **Make the contract durable.** Keep `AGENTS.md` short; split product intent,
   architecture, design and developer operations into documents read on demand.
   Define the playable-alpha acceptance contract and validated data structures.
3. **Establish an honest baseline.** The original 13 unit tests and build passed, but
   did not cover key requested behavior. Stricter gates exposed lint/type debt rather
   than treating that baseline as proof of readiness.
4. **Implement a coherent experience.** Extract a fixed-step simulation used by both
   flight and Lab; wire real profile values into physics; add input, camera and scores.
5. **Build and challenge the evidence.** Add behavioral, browser and emulator tests;
   deliberately break a profile contract and check that the test rejects it.
6. **Verify and publish.** Run the full local suite, commit/push, deploy Firebase and
   verify the live revision and completed score round trip. CI independently ran the suite.
7. **Review the outcome and record learning.** Capture the owner's assessment here;
   leave proposed process changes for review rather than silently adding instructions.

This was not a single unattended command. The owner provided approvals and completed
Google sign-in. The agent repaired tooling and provisioning problems and inspected UI
results. In this loop, publication preceded the owner's positive experience review;
that differs from the idealized review-before-publication sequence in the factory spec.
Publication itself was explicitly authorized.

## How the harness and gates work

The **harness** is the set of entry points, controlled environments and evidence collection
that lets an agent change and inspect the system. A **check** tests a specific claim.
A **gate** turns required check results into a pass/fail decision. Their value depends on
which claims they cover, not on the presence of a green badge.

[`scripts/verify.mjs`](../scripts/verify.mjs) runs eight stages sequentially through
`pnpm verify`. It continues after a failed stage so the report shows all results, then
exits nonzero if any stage failed or the source fingerprint changed during the run.
Each stage has a three-minute timeout. The report records commands, logs, duration,
revision, branch, dirty working-tree state, Node/platform and source fingerprint.
The fingerprint includes tracked files and nonignored new files; it excludes local secrets
and ignored build outputs. It is a source-integrity check, not a complete environment digest.

| Gate             | Claim exercised in this loop                                                                                              | What it does not prove                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Agent contracts  | Entry guide stays below 80 lines; referenced context exists                                                               | Instructions are sufficient or internally consistent     |
| Biome lint       | Formatting, imports and configured rules pass without warnings                                                            | Product correctness or good design                       |
| Type checks      | Astro, Svelte and workspace TypeScript contracts compile                                                                  | Runtime/network data is trustworthy                      |
| Unit tests       | 22 tests cover physics, profile effects, replay, camera and lifecycle                                                     | Every trajectory, device or edge case                    |
| Production build | Static application builds                                                                                                 | Hosting, authentication or live reads work               |
| Browser tests    | Six tests exercise real movement, selection, pause, touch cancellation, Lab replay/import, restart and unavailable scores | Physical-phone performance or subjective fun             |
| Firestore rules  | Eight emulator tests exercise permitted operations and rejected writes                                                    | Honest scores, rate limiting or production configuration |
| Competition      | Two isolated browser identities submit completed runs; a third reads both                                                 | Live Firebase readiness                                  |

Browser tests start their own server rather than reuse potentially stale output. Offline
checks blank backend configuration and block external requests. Integration uses a demo
Firebase project with local Auth/Firestore emulators. Failures retain screenshots/traces.
The same command runs in CI; the workflow uploads evidence even when verification fails.
Branch protection is not configured: these checks report failure but do not yet enforce
an unbypassable repository or deployment policy.

## Where determinism comes from—and where it stops

The simulation advances in explicit 1/60-second steps. Settings include a seed and a
validated ship profile; replay supplies ordered input/tick chunks. Simulation time drives
state progression, with seeded scenario/drawing inputs. Repeating the same trial therefore
has a concrete state to compare, rather than relying on how long a human held a button.

The Lab uses the same simulation, camera and renderer as the game. Pause, step, reset,
replay, JSON import/export and a shareable configuration URL make a reported experience
reconstructable. A saved configuration does not currently capture arbitrary manual input
history; the built-in replay is a prescribed sequence.

The graphics check fixes viewport, seed and simulation ticks and uses a reviewed initial
baseline. That gives a regression signal, not an automated judgment of beauty. Browser
versions, fonts and rendering can still affect images. Passing local macOS and Linux CI
runs is evidence for those environments, not universal bit-identical rendering.

The strongest negative probe temporarily ignored ship thrust multipliers. The simulation
suite rejected the change: one test failed and six passed. Restoring the implementation
restored the contract without weakening the assertion. An earlier oversized `AGENTS.md`
probe also failed its size check. These probes demonstrate two useful checks; they do not
establish that every gate catches every plausible regression.

Network provisioning, sign-in, index creation, browser scheduling and human preference
remain outside deterministic simulation. Emulator isolation makes network behavior more
repeatable; it does not make the entire delivery process deterministic.

## Evidence for this completed loop

- Released revision: `3041a80403676c7a14f95fdf530e162d2c5edbe8`, branch `feat/0-4-0`.
- [Independent CI run](https://github.com/villetakanen/void-drift/actions/runs/40675444224):
  passed; job duration 2m29s, including setup. All eight local stages also passed.
- Local verification took approximately 77 seconds in this recorded run. Competition
  consumed about 57 seconds; unit tests consumed about half a second including command
  overhead. These are observations from one run, not performance budgets.
- Local verification tested dirty changes above `88f3fca`; its HEAD field alone does not
  identify the released source. CI subsequently verified the committed `3041a80` revision.
- [Public game](https://void-drift-alpha.web.app) and
  [flight Lab](https://void-drift-alpha.web.app/lab/flight) were inspected after deployment.
  The deployed `release.json` matched the pushed revision.
- Anonymous authentication saved a completed live run. The leaderboard eventually showed
  `TST`, balanced ship, 32 seconds. Lab replay showed tick 450 and one wrap.
- Firebase remained on Spark. Deployment completed before the new index became ready;
  a successful deploy was therefore insufficient evidence for a functioning leaderboard.
- Detailed local records: `artifacts/verification/latest.json`, `deployment.json`,
  `regression-probe.log` and screenshots. These are ignored, locally retained artifacts;
  they are not guaranteed to exist in a fresh checkout. CI artifacts also have retention limits.
  This committed narrative preserves the essential observations without credentials.

## Lessons supported by this loop

| Observation                                                   | Lesson candidate                                                                         | Limit                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Existing green tests missed unused ship flight multipliers    | Assert visible/domain outcomes, not only UI activation or successful compilation         | One concrete defect class, not a coverage proof                           |
| The same flight code runs in game and Lab                     | Make the design surface an executable example of production behavior                     | Sharing code can also share bugs; independent assertions remain necessary |
| A deliberate regression was detected                          | Challenge important gates with a small negative probe                                    | Probes need scope and restoration discipline                              |
| New gates exposed legacy failures and were repaired           | A baseline should report debt honestly; introducing a gate is not the same as passing it | Broad cleanup enlarged the review diff                                    |
| Emulator competition passed before live provisioning finished | Keep local correctness, service readiness and deployment identity as separate claims     | Live verification remains partly manual                                   |
| The owner assessed the result positively after inspecting it  | Automated evidence and human experience assessment complement each other                 | No granular balance/performance study was conducted                       |
| A short entry guide delegated detail to focused documents     | Keep recurring context compact and retrieve detail when needed                           | Token savings and model-cost effects were not measured                    |

## Friction and improvements to consider next

These are proposals for the next loop's contract, not work silently started here.

1. **Make release verification reproducible.** Project provisioning, authentication
   setup, generating the release marker and checking the live result involved ad hoc
   steps. A documented release command could bind a clean revision, build/configuration
   identity and smoke evidence together. Keep sign-in and spending boundaries explicit.
2. **Retain evidence by loop/revision.** `latest.json` is overwritten by another run,
   and local artifacts are ignored. Preserve a small durable evidence manifest with
   revision, results, limits and human assessment; link heavier artifacts with retention noted.
3. **Reconcile contracts at closure.** The factory spec's unchecked checklist lagged the
   implementation, and some historical prose described superseded states. A closing
   reconciliation should distinguish fulfilled, partial and untested criteria.
4. **Keep large outcomes reviewable.** This loop combined feature work, dependency
   migration and widespread formatting. The user wanted a substantial outcome; that need
   not imply one large mixed implementation diff. Separate mechanical cleanup where useful.
5. **Treat provisioning delays as a designed state.** The leaderboard exposed a raw
   index-building error while Firebase caught up. Provide a readable retry state and
   explicitly verify readiness rather than equating deployment success with release success.
6. **Measure the next bottleneck before optimizing.** Emulator/browser competition
   dominated the recorded gate time. Keep full verification for release; evaluate focused
   feedback during editing without dropping the full gate. Measure physical-phone frame
   rate and collect focused ship/camera feedback before claiming performance or balance.

## Model capability and ASDLC interpretation

The owner noted that a high-capability model was used and that this should not be necessary.
This loop contains no controlled model comparison, cost accounting or intervention-count
baseline. It cannot establish that a smaller model would succeed equally well, or that
model capability caused the result. The useful next hypothesis is narrower: explicit
contracts, shared examples and executable failure signals may reduce dependence on the
agent remembering and judging everything. That hypothesis needs a comparable later loop.

The repository charter names ASDLC's Spec, Agent Constitution, Experience Modeling and
Compound Loop patterns as design inputs. This case illustrates our application of those
ideas: durable intent, explicit authority, a shared Lab, and reviewed learning. It is not
an audit against a particular external ASDLC version. Useful maintainer questions are:

- What minimum evidence should close a voice-led loop?
- How should deterministic checks, live readiness and human assessment be represented together?
- How should lesson candidates be promoted without turning each retrospective into more instructions?

No external feedback has been sent. No lesson here has automatically become a new agent
rule. This record closes the learning step for the alpha; the next implementation loop
can select its contract using this evidence and the owner's next priority.
