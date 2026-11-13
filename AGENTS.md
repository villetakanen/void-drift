# Void Drift

Voice-led game design, and development development of a space shooter inspired by Star Control 2: Super melee, and 1990s indie games.

## Repository map

```yaml
- docs/                  # Plans, specs, all docs here
  - plans/               # Transient planning material, a map is not the territory, always check staleness
  - specs/               # ASLDC.io style living specs defining stable, expected intent, and expected functionality of the apps
  - vision.md           # Our vision for the game
  - architrcture.md     # Solution architecture, vocabulary, and dev principles
  - design.md           # Design principles, including branding
  - development.md      # Dev principles
- apps/web/src
  - pages/lab                     # The Lab: component and entity pages
    - studies                     # Design studies, dated; archive/ holds retired ones
    - reviews                     # Design reviews
  - data/studies.ts               # Study registry
  - components/studies            # Study components and benches
  - components/FlightDeck.svelte  # A game loop, keyboard and touch input wiring
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

## ASDLC.io

- We use ASDLC.io living specs methodology, and align with the principles presented in the site

## Local Java

- Use Java 21 at `tools.local/java21/jdk/Contents/Home` (`JAVA_HOME`) for Firebase checks.
- If missing, install Temurin 21 for the host OS/architecture there; keep the runtime in git-ignored `tools.local/`
-
## Engineering essentials

- Define or update Zod schemas before changing data contracts; parse external inputs.
- Use Svelte 5 Runes, native CSS, shared tokens, and procedural Canvas assets.
- Connect controls to the game loop; retain keyboard and iPad landscape touch in play.
- The Lab targets viewports 1280px wide and up; never design, test or fix it below that.

## Evidence and learning

- Keep human playtesting outside the repo: never gate, record, or ask for proof; separate evidence from findings, signals and interpretation, and review lessons before adoption.
