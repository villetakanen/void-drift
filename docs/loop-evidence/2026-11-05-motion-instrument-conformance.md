# Motion instrument conformance implementation attempt (2026-11-05)

Evidence record for the request to implement
[the conformance plan](../plans/2026-11-04-motion-instrument-conformance.md).
This records the bounded implementation attempt and its closure; it does not
assess the product contract.

## Intent and scope

- Requested scope: implement the November 4 Motion instrument conformance plan.
- The plan required a shared experiment schema, production simulation wiring,
  configured controls and independent embeds, maintained caller migration,
  acceptance evidence and verification.
- Owner decision: after the attempted changes, the owner asked to undo them.

## Changes and revision

- A temporary schema/calculation/starter edit was made in
  `apps/web/src/lib/instrument/config.ts`,
  `apps/web/src/lib/instrument/calculate.ts`, and
  `apps/web/src/lib/instrument/starter.ts`.
- Those three files were restored before closure at the owner's request. They
  have no remaining changes from this attempt.
- No commit, push, deployment, or live verification occurred.

## Checks

- Attempted `pnpm --filter @void-drift/web check` in the repository on
  2026-11-04. It returned: `No projects matched the filters in
  "/Users/ville.takanen/dev/void-drift"`. This is an unavailable check, not a
  pass or a code failure. No alternate check was run.
- No browser inspection or acceptance test evidence was produced.

## Workspace state and evidence gaps

- At the start of this attempt, the worktree already contained unrelated edits
  in package manifests, the ship-motion study and motion-instrument spec, plus
  untracked study assets and camera-trial evidence. Those were preserved.
- The observed current worktree also contains an edit to
  `packages/mode-a/src/lib/build-flight.ts`; it was not part of the attempted
  edits and was left untouched. Workspace state can change between observations.
- The full plan remains unimplemented. No verification report, browser artifact,
  or stable candidate revision exists for this attempt.
