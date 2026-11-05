# Ship propulsion: accepted model

## Intent and decisions

Implement one assembled-ship powered cruise ceiling: hull base plus every installed
main engine's contribution, whether firing or inactive. Deliver a Lab explanation
with source-derived values/calculations, builder figures and living specifications.
The originating chat retained review authority; a Luna subagent implemented the plan
and repaired the competition test, followed by the parent critic pass.

Owner-selected hull bases (u/s): Scout 370, Wasp 420, Fighter 330, Corvette 240,
Fiddler 280. Contributions per engine: Light ion 8, Heavy ion 11, Fission 17,
Plasma 9. Retain linear taper, braking, transverse steering, gravity overspeed,
force/mass, response timing and angular behavior. Engine balance follows this model;
the recently rebalanced gravity remains unchanged and its interaction is monitored.
Stabilizers do not add cruise capacity. Fission retains the internal `fusion` save ID.

## Delivered revision and scope

Implementation: `1d80106027821893055bffedd790f4c02296ea0f`
(`feat(physics)!: adopt ship-wide powered cruise ceilings`), on `feat/0-5-0`.

- Shared schema values, installed-engine counting and production propulsion.
- `/lab/ship-propulsion/` reference and builder ceiling/breakdown/part descriptions.
- Synchronized propulsion, hangar, motion instrument, playable-alpha and architecture
  contracts. Motion overrides are experiment-wide; old per-vehicle ceiling
  configurations are rejected. The commit records this compatibility break.
- Tests for real pulse/charge timing, inactive-engine capacity, analytical acceleration
  including mount angle, mixed engines, overspeed and current gravity interaction.
- Competition test routes use exact simulation ticks; landing-test time is frozen
  before navigation to avoid the observed clock race. Gameplay physics was not
  changed to repair either test.
- Recovered motion-study findings and historical input, with the existing 02.3 image.

The commit excludes pre-existing package version bumps, the optional directional
projection experiment and unrelated camera material. The stopped spec-relocation
task's 33 staged renames were preserved separately; this commit uses the original
spec paths. Its three edited existing spec destinations retain the committed content
in the relocation index, so the pending rename diff remains content-neutral. The new
propulsion spec's relocation remains an unstaged deletion/new destination pair.

## Verification evidence

The parent directly inspected the final report:
[`2026-11-05T11-49-28.070Z-jqW3oP/report.json`](../../artifacts/verification/2026-11-05T11-49-28.070Z-jqW3oP/report.json).

`JAVA_HOME=tools.local/java21/jdk/Contents/Home pnpm verify` ran locally on macOS
with local browser and Firebase emulator access. The report identifies dirty base
revision `332b3568b949d970d5c06ab68494784bec746685`, fingerprint
`4db86a9f2d639b262301faed6564f2f19e9e902fdd995c4aad5d5e7be6fc4703`, and
`sourceUnchanged: true`. It is working-tree evidence, not an exact test of the later
commit: the subsequent countdown commit, excluded working changes and commit
packaging differ from that tested tree. No full check was rerun solely for closure.

| Check                                                | Recorded outcome                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Contracts and commit syntax                          | Passed                                                                                                                    |
| Lint                                                 | Passed                                                                                                                    |
| Unit tests                                           | Passed: 227 tests, 42 files                                                                                               |
| Build                                                | Passed                                                                                                                    |
| Browser tests                                        | Passed: 39 tests                                                                                                          |
| Firestore rules                                      | Passed                                                                                                                    |
| Competition / score retry / third-player leaderboard | Passed                                                                                                                    |
| Project type check                                   | Failed: concurrent RunCountdown Astro component rejected `client:only` through its inferred `Record<string, never>` props |
| Overall full verification                            | Failed; not represented as a full pass                                                                                    |

The parent separately ran Svelte checking with zero errors/warnings and workspace
TypeScript checking successfully after correcting a test timer annotation. The full
Astro check retained the countdown error above. That is an observation of this run,
not a claim about the countdown task's eventual state.

The critic pass inspected the reference and builder at a 1440px desktop viewport:
default Fighter showed 346 = 330 + 16 u/s; Wasp showed 428 = 420 + 8 u/s.
The mixed Heavy-ion pair + Fission + Plasma Fighter reference correctly shows
378 u/s. An earlier agent summary's 377 claim referred to a different test build
with Light ion + Fission aft, and was corrected in the review conversation.

The current-well check starts each production starter ship at 80% of the current
sun's reach, facing outward with supplied power. Over one second, powered ships
move outward and coasting ships fall inward. This bounded check does not establish
escape from every well or general game balance.

## Study recovery and evidence limits

A Git reset occurred during implementation. The later study sections were missing
when the parent reviewed the workspace. The owner stated the removal was not
intentional and explicitly requested recovery.

Stash `953557ccdb6d2eb777ad22f9f2b7abc0d4d9f1f1`, timestamp
2026-11-05 10:53 +0200, supplied a 592-line intermediate study snapshot. Nov. 4
session evidence supplied the original B1 inputs: Corvette, ceiling 340/234.5/234.5,
acceleration 220/220/110 and zero bonus. This was not a byte-for-byte pre-task
snapshot. Sections 02.1–02.4, decisions, numeric findings and historical settings
were recovered and the parent verified that they render.

The incompatible live comparison was replaced with historical text and JSON;
current physics is not used to regenerate old findings. No 02.4 screenshot was
recovered; only the 02.3 path image is available. Session logs and ignored verification
artifacts are local evidence with no guaranteed durable backup; essential outcomes
are summarized here. The stash was retained.

## Human feedback and publication

Owner feedback on the implemented game, verbatim: “it plays well, I think the model
is now in place, you agree?” The chat accepted the model as the foundation for engine
balancing. The owner then requested: “superb work, commit, push, close loop”. This
records owner acceptance of the model/handling, not final engine balance or release
certification.

Implementation commit `1d80106` was pushed to `origin/feat/0-5-0`; direct
`git ls-remote` inspection returned its full hash above. This closure record is a
separate documentation commit; its push is reported in the closing chat response.
No deployment or production live verification was performed in this loop.
