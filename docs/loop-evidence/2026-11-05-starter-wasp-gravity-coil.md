# Starter Wasp Gravity coil — 2026-11-05

## Intent and delivered scope

The owner requested a Gravity coil in the left slot of the Wasp used to start the
default game, clarifying: “not the wasp in the startup screen”. The playable
starter now fits `gravity-coil` in hull slot 0; the right slot remains empty.
The title artwork uses `defaultLoadout("wasp")` independently, retaining empty
hull slots and its ion engine. Both owning game specs were updated.

Implementation: `fbce5cc` (`fix: equip the playable starter Wasp with a gravity coil`).
Unrelated existing package, propulsion, plan, release and evidence edits were
excluded from the commit and left in the working tree.

## Observations and owner feedback

After the initial starter change, the owner asked: “but for some reason the landing
page image also has that equipped?” Source inspection confirmed TitleScreen used
the same `starterLoadout` as gameplay. The subsequent title-only change selects
the existing default loadout. FlightDeck's default launch calls
`gameSettings("wasp")`, which selects the equipped starter loadout.
No owner visual acceptance after this correction was recorded.

## Verification evidence

Direct tool results in this chat, on macOS in the local working tree based on
`612fc5f`, including unrelated pre-existing edits:

- `pnpm exec vitest run packages/mode-a/src/lib/starter-fleet.test.ts packages/mode-a/src/lib/wasp.test.ts packages/mode-a/src/lib/gravity-coil.test.ts`:
  10 tests passed after the starter/spec change, before the title correction.
- `pnpm exec biome check packages/mode-a/src/lib/schemas/loadout.ts`: passed.
- `pnpm exec biome check apps/web/src/components/TitleScreen.svelte`: passed after
  the title correction.
- `pnpm exec playwright test tests/browser/landing.spec.ts`: all 6 Chromium tests
  passed in 28 seconds after the final code changes, using the local test server.
- Implementation commit hooks: staged Biome check and Conventional Commit check passed.

These are focused checks, not full verification. Full gates, manual rendered-image
inspection and deployment checks were not run. The browser tests establish their
covered menu/launch behavior, not visual acceptance or a dedicated coil-slot assertion.
No immutable verification-run report was created; essential command outcomes are
retained here from the chat's tool output rather than linked to mutable test reports.

## Publication and closure

Implementation commit `fbce5cc` was pushed successfully to `origin/feat/0-5-0`,
advancing it from `612fc5f`. This record is a subsequent documentation commit;
its publication is reported separately in the closing chat response.
No deployment or live verification was performed. Closure collects evidence only;
it does not establish release readiness or general process lessons.
