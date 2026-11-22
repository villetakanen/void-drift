---
generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-22T17:38:31+02:00"
verified: []
---

# Game-over product work

Planning snapshot, 22 November 2026. Recheck specs and code at the start of each session. The approved [game-over contract](../specs/game/game-over/spec.md) describes intended boundaries; the current product does not yet satisfy all of it. Preserve existing behaviour during extraction. A redesign may happen later or during a session, but is not planned here.

## Proposed independent sessions

1. **Extract the screen without changing behaviour.** Trace the existing `FlightDeck.svelte` dialog, modes, focus and navigation. Introduce a mode-independent presentation boundary supplied with outcome and statistics and a slot for a result action. Keep current mode-specific content, score entry, Top Scores, navigation, focus and failure behaviour at the caller or in an appropriately composed feature. Check all current mode and experimental variants. No personal-best gating or Retry in this step. Verify extraction independently before proceeding.
2. **Retry.** Add Retry for either launch source, carrying the completed run's setup into a fresh run with a new random seed. Inspect `reset` and its arrival, input, pause and score-state lifecycle; verify the new run and return routing. Clarify whether any additional settings beyond the captured loadout and experimental setting belong to “same setup” before implementation. Keep the relevant contracts consistent.
3. **Personal-best score action.** First settle and amend the [Scores spec](../specs/game/scores/spec.md): the player requested saving only for a new personal best. Define first score, equal score, per-ship and challenge scope, unavailable or failed lookup, pending state and concurrent submissions. Decide what the player sees when no save action is offered. Then implement the self-contained slotted interface and its score access, preserving transaction and security guarantees. Split spec/implementation further if needed; do not assume an unavailable lookup means a new best.

## Starting evidence and dependencies

`FlightDeck.svelte` currently branches on mode, renders the score form inline and allows eligible ranked Survival runs to submit without a prior personal-best check. `submitHighScore` in `packages/mode-a/src/lib/firebase.ts` compares the stored per-challenge, per-user, per-ship score inside a transaction; an equal or lower score is not written but returns success. The Top Scores query returns only the top 30, so it cannot establish every player's best. Check Firestore read rules and schema before designing a separate lookup; do not change challenge names outside a production release.

Each session should inspect current state, update affected contracts when behaviour changes, verify its own changes and leave a clean handover. Browser tests, if added or changed, follow the browser-test-konmari skill. Human playtesting remains outside the repository.
