# Game-over spec loop evidence

## Scope and decisions

On 22 November 2026 the designer requested reconstruction of a game-over screen spec and refined its context. The designer prioritised run results and statistics, saving a new personal best in ranked play, and navigation. They decided Retry uses the same setup with a new random seed; Return goes to the launch source rather than offering multiple destinations. They requested a mode-independent screen with a slotted score action owned by the ranked feature. They verified and approved the spec, and subsequently requested a behaviour-preserving product plan; redesign timing remains open. These are conversation records, not playtest evidence.

## Delivered and publication

- [`game-over/spec.md`](../specs/game/game-over/spec.md) was created and approved; commit `d65ff5f8` was pushed to `origin/feat/0-7-0` during this session. The spec describes intended boundaries and Retry, which are not yet implemented.
- [`game-over-product` plan](../plans/2026-11-22-game-over-product.md) records proposed separate sessions. Its publication is part of the commit containing this evidence record; inspect git history and remote for final publication state.
- No product code or deployment was changed in this loop. No live verification was performed.

## Checks and observations

Before commit `d65ff5f8`, `pnpm exec biome check . --write --error-on-warnings`, `pnpm check`, `pnpm check:specs docs/specs/game/game-over` and `pnpm check:contracts` passed on the working tree containing the approved spec. The latter included 21 passing factory tests. Git pre-commit and commit-message hooks passed. Results are from the session command output; no durable run logs were retained.

Direct source inspection found the game-over dialog and score form in `apps/web/src/components/FlightDeck.svelte`. `packages/mode-a/src/lib/firebase.ts` compares a previous score inside the submission transaction and returns success even when an equal or higher stored score prevents a write. These observations describe the inspected source at planning time, not a browser or backend verification.

## Gaps

No automated or human gameplay verification was performed; the spec approval is not evidence of product behaviour. No persistent logs or screenshots were captured. Personal-best lookup and offline behaviour remain undecided. The evidence record does not certify release readiness.
