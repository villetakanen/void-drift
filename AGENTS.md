# Void Drift agent guide

Voice-led development of a procedural space survival game and its software factory.

## Read on demand

- Product intent and scope: `docs/rebuild-charter.md`.
- Structure, simulation, or data changes: `docs/architecture.md`.
- Visuals, controls, camera, or feedback: `docs/design.md`.
- Tooling and verification: `docs/development.md` and `docs/specs/voice-led-factory.md`.
- Before committing, follow `.agents/skills/commit-messages/SKILL.md`.
- Feature work: read the relevant spec in `docs/specs/`; use `.agents/skills/spec.md` to author specs.
- Old backlog and phase roadmaps are historical evidence, not active assignments.
- Read only the context needed for the task; follow the owner's latest decisions.

- Design exploration: use `.agents/skills/design-study/SKILL.md`.

## Working method

- Translate conversational requests into a small, explicit acceptance contract.
- Clarify consequential ambiguity; resolve routine implementation details autonomously.
- Implement bounded changes, verify them, and present playable or inspectable evidence.
- Update relevant specs alongside changed behavior; distinguish targets from implemented behavior.
- Reuse the real game systems in the Lab so its examples predict production behavior.
- Keep this file under 80 lines. Put detailed guidance in its authoritative document.

## Engineering essentials

- Use strict TypeScript; narrow `unknown` instead of introducing `any`.
- Define or update Zod schemas before changing data contracts; parse external inputs.
- Use Svelte 5 Runes, native CSS, shared tokens, and procedural Canvas assets.
- Connect controls to the game loop; retain keyboard and landscape touch support.
- Demonstrate changes to shared visual definitions in the Lab.

## Authority

- Implement, repair, test, and make local commits within the agreed scope.
- Preserve unrelated and pre-existing changes; identify their provenance before committing them.
- Ask before adding npm dependencies or changing gravity/friction constants.
- Existing explicit approval covers the authorized action; do not ask again for it.
- Obtain explicit authorization before pushing, publishing, or sending external feedback.
- Use services that do not require a credit card; do not introduce paid services.

## Evidence and learning

- Inspect current evidence before reporting branch, check, commit, or release status.
- Distinguish working changes, local commits, pushed revisions, and verified deployments.
- Report failed, skipped, and unavailable checks explicitly; never count them as passes.
- Repair failures without weakening contracts just to make checks green.
- Human experience review assesses feel and fidelity separately from automated correctness.
- Record evidence-backed lesson candidates; obtain review before making them standing rules.
