# Void Drift

Voice-led development of a procedural space survival game and its software factory.

## Repository map

```yaml
- docs                  # Plans, specs, all docs here
  - plans               # Planning material, a map is not the territory, always check staleness
  - specs               # ASLDC.io style living specs defining intent, and expected high-level functionality of the apps
- apps/web/src
  - pages/lab                     # The Lab: component and entity pages
    - studies                     # Design studies, dated; archive/ holds retired ones
    - reviews                     # Design reviews
  - data/studies.ts               # Study registry
  - components/studies            # Study components and benches
  - components/FlightDeck.svelte  # rAF game loop, keyboard and touch input wiring
- packages
  - core                          # Shared engine: physics, input, renderer, asset generators
    - src/lib/schemas             # Shared Zod contracts
    - src/lib/styles/tokens.css   # Visual token source of truth
    - src/lib/ui/colors.ts        # Canvas mirror of tokens; parity checked by scripts/check-contracts.mjs
  - mode-a                        # Game rules, ships, simulation, Firebase client
    - src/lib/game-loop.ts        # Death checks and loop rules
    - src/lib/schemas             # Game-state, flight, loadout, settings, ship Zod contracts
    - src/schemas/highscore.ts    # Leaderboard contract
```

## Read on demand

- Scope or priority: `docs/rebuild-charter.md`.
- Structure, simulation, data: `docs/architecture.md`.
- Visuals, controls, camera, feedback: `docs/design.md`.
- Setup, gates, release: `docs/development.md`.
- Feature work: its spec in `docs/specs/`.
- Changing the factory or its gates: `docs/specs/voice-led-factory.md`.

## Working method

- Read only the context needed for the task; follow the owner's latest decisions.
- Translate conversational requests into a small, explicit acceptance contract.
- Clarify consequential ambiguity; resolve routine implementation details autonomously.
- Implement bounded changes, verify them, and present playable or inspectable evidence.
- Update relevant specs alongside changed behavior; distinguish targets from implemented behavior.
- Reuse real game systems in the Lab; demonstrate shared visual definition changes there.
- Keep this file under 80 lines. Put detailed guidance in its authoritative document.

## Engineering essentials

- Use strict TypeScript; narrow `unknown` instead of introducing `any`.
- Define or update Zod schemas before changing data contracts; parse external inputs.
- Use Svelte 5 Runes, native CSS, shared tokens, and procedural Canvas assets.
- Connect controls to the game loop; retain keyboard and landscape touch support.

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
- A finding is not a signal. Keep loop evidence collection separate from interpretation.
- Review proposed lessons separately before making them standing rules.
