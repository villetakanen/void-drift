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

### Known regressions carried forward

At 0.8.0 scope review, explicitly select each regression for a fix or carry it
forward again.

**Ranked results survive rotation.** Turning the screen after a run no longer
clears typed initials or hides a successful score save.

**Status:** Known 0.7.x regression; deferred to 0.8.0 scope review.
[Reproduction and findings](specs/game/game-screen/rotate-findings.md).

### Retry a run

**Decision:** Selected; delivered.

**Draft release note:** Choose Retry after a run to start fresh with a new random
seed and the same ship, fittings, mode, and Playground setting. Choose Return
for the title screen or Hangar if you launched from there. Saving a score still
opens Top Scores.

**Context:** [Game-over spec](specs/game/game-over/spec.md) and
[Retry regression coverage](../tests/browser/launch-navigation.spec.ts).
