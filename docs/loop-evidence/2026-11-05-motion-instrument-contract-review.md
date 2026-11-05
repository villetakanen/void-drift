# Motion instrument contract review — loop evidence

Closed at the owner's request on 2026-11-05 (Europe/Helsinki). Work and evidence
below span November 4–5. This is an evidence record, not implementation acceptance.

## Intent and scope

The owner reported concern that the motion tool's purpose and agent guidance had
drifted. The initial request was to establish its name and place in the component
system. The owner then requested a rename, commit and push, followed by a review of
the remaining specification one proposed change per conversation turn. Finally the
owner requested a commit, push and implementation plan.

The owner suspected another agent's work contributed to the drift. This loop did
not establish authorship, authorization history or a causal explanation for it.

## Owner decisions recorded in the conversation

- Name the reusable tool **Motion instrument**. Ship tuning and Gravity tuning are
  configured uses of it; “Lab instrument” is a category, not this tool's name.
- Support both controlled investigations of motion rules and small tuning changes.
  Use it in Lab simulation pages and in multiple independently configured study
  instances, with selected variables exposed to the designer.
- Use current production laws, math and libraries. Old live examples may change or
  become incompatible; preserve historical findings in writing and captured images,
  not archived simulation versions. The owner rejected that stronger replay promise.
- Keep proposals and study history in studies, with accepted requirements in specs.
  The design-study skill must make that acceptance boundary explicit.
- Export captures exact current values for the conversation. It is neither an
  acceptance decision nor an application of settings to the game. The owner explicitly
  rejected designer-facing import; agent-supplied configurations still need validation.
- Identical hulls and equipment under identical conditions produce identical paths.
  Hull/equipment properties are shared across an experiment. A gravity shadow retains
  those properties, motion settings, inputs and starting state; gravity is the only
  differing condition.
- Gravity laws belong to the gravity feature. Instrument requirements cover supplying
  settings to production simulation and presenting its results, not defining physics.
- The selected burn is an experiment setting. Reading controls change presentation
  without changing authored settings or calculated results.

The owner corrected two proposed review directions: independently overriding one
otherwise identical ship's thrust, and treating gravity-boundary law assertions as
instrument requirements. The assistant withdrew/revised those proposals. The owner
also rejected the proposed Load scenario. These corrections are conversation evidence,
not proof of a general process lesson.

## Delivered revisions and publication

- `7fcb9cb1b85195b8bdeed950fe85237d2fd69d47`: naming correction. Renamed the living
  spec and components, distinguished Ship tuning from the shared screen, and updated
  references while retaining existing Lab URLs and historical study names.
- `332b3568b949d970d5c06ab68494784bec746685`: reviewed contracts, design-study guidance,
  relocated historical/proposal notes and
  [implementation plan](../plans/2026-11-04-motion-instrument-conformance.md).
  New or changed acceptance criteria remained unchecked pending implementation.

Both commits were pushed to `origin/feat/0-5-0`; successful push output was observed
in this conversation. At closure, HEAD and the local remote-tracking reference both
resolve to `332b356`. No network fetch was performed for closure. No deployment or
live verification was performed in this loop. The closure record itself is local.

The reviewed owning documents are [Motion instrument](../specs/lab/motion-instrument/spec.md),
[Gravity tuning](../specs/lab/gravity-tuning/spec.md) and the
[design-study skill](../../.agents/skills/design-study/SKILL.md).

## Verification evidence

Naming checks ran on macOS arm64, Node v24.14.0, with a dirty working tree based on
`e20ed577f9cf5250ad773a1d6859e7de8a43b45c`. They are not verification of the later
contract commit or of the current working tree.

- `pnpm verify:quick`: **failed**, partial verification. Contracts, types and unit
  tests passed; lint failed. The report also records `sourceUnchanged: false`.
  [Specific report](../../artifacts/verification/2026-11-04T19-47-54.083Z-r2Uffh/report.json).
- `pnpm exec playwright test tests/browser/lab-instrument.spec.ts tests/browser/gravity-tuning.spec.ts`:
  **7 passed**, observed in tool output during the naming work. No stable run-specific
  report path was retained in this conversation for that focused run.
- `pnpm build`: passed during naming work, observed in tool output.
- `JAVA_HOME="$PWD/tools.local/java21/jdk/Contents/Home" pnpm verify`: **failed**.
  Contracts, commit syntax, types, unit tests and build passed individually. Lint
  failed. Browser startup failed with `listen EPERM` on 127.0.0.1:4322. The emulator
  lifecycle failed; rules and competition were marked failed with `notRun: true`.
  The report records `sourceUnchanged: false`, so there was no stable full pass.
  [Specific report and sibling logs](../../artifacts/verification/2026-11-04T19-49-11.321Z-Eoo6J3/report.json).
- During the contract review, focused `pnpm exec biome check`,
  `node scripts/check-contracts.mjs` and diff-whitespace checks were run repeatedly.
  Formatting failures in edited text were corrected. A later whole-tree whitespace
  check found an unrelated line in the concurrently edited ship-motion study.
- Before `332b356`, the exact staged document/page snapshots were checked in
  `/tmp/motion-review-check`: Biome checked five files successfully, and Astro's
  compiler transformed both staged study pages successfully. An earlier stdin check
  failed; an attempt to apply the repository's Biome configuration to outside-root
  files crashed Biome. Copying the same configuration into the snapshot directory
  and disabling VCS discovery allowed the final check to pass. Documentation links
  and staged whitespace checks passed. Both commits passed the commit-message hook
  (the first naming commit attempt was rejected for an overlong body line, then fixed).
- Full runtime verification was **not run for the documentation-only `332b356`**.
  No human review of implemented conformance behavior occurred; that code was not
  delivered by these commits.

The verification reports above were read directly again at closure. Other command
outcomes are retained from tool output in this conversation. Temporary staged
snapshots and ignored verification artifacts are local and not durable backups.

## Interrupted migration investigation

After the plan was pushed, the owner pasted another agent's report that it had begun
but not completed a v2 schema migration in `config.ts`, `calculate.ts` and `starter.ts`
under `apps/web/src/lib/instrument/`. The quoted report said its workspace check
matched no project for `@void-drift/web`.

Direct inspection in this conversation confirmed partial v2 edits at that time:
experiment-level tuning in the schema and calculation, while panels/callers still
used the old per-vehicle API. The schema chained `.strict()` after refinement;
gravity callers passed flight options in the now-changed third argument position.
These were source observations; no reproduction check was run. `apps/web/package.json`
was directly inspected and names the workspace `web`, not `@void-drift/web`.

The assistant announced a repair and inspected code. The owner interrupted the turn
and then requested closure. No repair edits or runtime tests were performed by this
chat between that report and the interruption.

At closure, `git status` no longer lists those three instrument files as modified.
Direct inspection shows v1 configuration with per-vehicle `changes` and the original
`calculate(vehicle, burn, flight)` signature. This differs from the preceding
inspection; who changed the files and why is not established here. The implementation
plan remains unimplemented in the delivered revisions. Current application health
was not tested during closure.

## Working-tree boundaries and evidence gaps

At closure, uncommitted changes remain in the four package manifests, the ship-motion
study page, the Motion instrument spec and `packages/mode-a/src/lib/build-flight.ts`.
There are untracked study assets and a camera-trial evidence file. Those changes are
outside the committed contract-and-plan revision and were not included in this loop's
commits. In particular, the spec has a later unapproved directional-propulsion note;
it is not part of `332b356`.

Selective staging kept the parallel study calculations, conclusions and assets out
of the contract commit while retaining the relocated notes. The live workspace may
therefore contain content beyond the reviewed committed spec. No ownership claim is
made about other sessions' edits.

No end-to-end evidence establishes conformance to the new Gherkins. No old passing
check is treated as proof that the unfinished migration works. Closure collects
these limits; it neither resumes implementation nor promotes a lesson or new rule.
