# Roadmap

Updated 22 November 2026.

Write each feature's intended outcome as a draft player-facing release note:
what a player will be able to do or experience once it is done. These are the
items we would later put in the release notes. Until delivered, they describe
an intended result, not something already shipped.

Keep ideas to consider alongside that outcome, so we can discuss a direction
without turning every possibility into a task or a release promise.

Each feature has an intended outcome, a release decision (candidate or selected),
and links to relevant context. Mark it delivered only with links to its final
spec and delivery evidence; link the release record when it ships. Implementation
steps belong in focused [plans](plans/), and agreed behaviour belongs in
[specs](specs/). Adding a candidate here opens a discussion; it does not authorize
implementation.

## 0.8.0

Release direction is being formed. No release theme or complete scope has been
chosen.

### Retry a run

**Decision:** Selected; delivered.

**Draft release note:** Choose Retry after a run to start fresh with a new random
seed and the same ship, fittings, mode, and Playground setting. Choose Return
for the title screen or Hangar if you launched from there. Saving a score still
opens Top Scores.

**Context:** [Game-over spec](specs/game/game-over/spec.md) and
[Retry regression coverage](../tests/browser/launch-navigation.spec.ts).

### Revamp score-table and how scores are collected

**Decision:** Candidate.

**Draft release note:** A revamped score-table makes it clearer how you rank
against other pilots. After submitting a run, you can see whether it was saved
and which of your results stays on the board.

The ranking and retention choices remain to be decided.

**Ideas to consider:**

- Explain when an equal or lower submission keeps the pilot's existing best: today it silently succeeds and opens the score-table, even though the new run and initials were not saved. One possibility is to show “Your best stands: 420” with a link to the table.

**Context:** The [scores contract](specs/game/scores/spec.md) currently retains
one best score per pilot and ship, replacing it only for a higher score. The
[initials study](../apps/web/src/pages/lab/studies/ranked-initials-2026-11-20.mdx)
explores signing a run; its proposals have not been adopted by this roadmap.
The example above comes from the
[submission transaction](../packages/mode-a/src/lib/firebase.ts) and
[run-complete save flow](../apps/web/src/components/FlightDeck.svelte).
