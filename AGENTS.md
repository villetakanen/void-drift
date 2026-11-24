# Void Drift

Voice-led game design, and development development of a space shooter inspired by Star Control 2: Super melee, and 1990s indie games.

## Default working practice

Keep the [roadmap](docs/roadmap.md) to one short, player-facing bullet per item under Maybe or Done. Link to details instead of embedding them. Done feeds the release notes.

Work directly by default, following the relevant task skill. Load and follow [first-mate](.agents/skills/first-mate/SKILL.md) only when the user explicitly requests conductor or first-mate mode. An assigned worker follows its task and reports the result to the assigning agent.

## Repository map

```yaml
- docs/                  # Plans, specs, all docs here
  - plans/               # Transient planning material, a map is not the territory, always check staleness
  - specs/               # ASLDC.io style living specs defining stable, expected intent, and expected functionality of the apps
    - game/render/       # Render model: layers, ordered passes and the demo-scene method
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
    - src/lib/schemas             # Shared Zod schemas
    - src/lib/styles/tokens.css   # Visual token source of truth
    - src/lib/ui/colors.ts        # Canvas mirror of tokens; parity checked by scripts/check-contracts.mjs
  - mode-a                        # Game rules, ships, simulation, Firebase client
    - src/lib/game-loop.ts        # Death checks and loop rules
    - src/lib/flight-frame.ts     # The in-flight frame: its layers and ordered passes
    - src/lib/schemas             # Game-state, flight, loadout, settings, ship Zod schemas
    - src/schemas/highscore.ts    # Leaderboard schema
```

## ASDLC.io

- Use the [write-spec skill](.agents/skills/write-spec/SKILL.md) for ASDLC living specs in `docs/specs/`. Folder nesting expresses parentage. Run `pnpm check:specs` on a spec directory to check its format.

## Shared preview

- In the shared Mac checkout, run `pnpm dev:ensure` and use port 4321. Inspect ownership, readiness and the log path with `pnpm dev:status`.
- Reload the surface you changed. If saved edits still appear stale, run `pnpm dev:restart` once and inspect that surface again. Use the reported log for compilation errors. Browser verification owns its own servers.

## Local Java

- Use Java 21 at `tools.local/java21/jdk/Contents/Home` (`JAVA_HOME`) for Firebase checks.
- If missing, install Temurin 21 for the host OS/architecture there; keep the runtime in git-ignored `tools.local/`
-
## Engineering essentials

- Define or update Zod schemas before changing data shapes or validation rules; parse external inputs.
- Use Svelte 5 Runes, native CSS and shared tokens. Game artwork is procedural Canvas drawing; authored raster art is allowed for planet surfaces.
- Draw in flight only through the render model in `docs/specs/game/render/spec.md`: game code draws shapes, images and cached stamps onto layers and the browser blends, scales and filters them. Never loop over pixels per frame, and do no work for things outside the camera's view.
- Connect controls to the game loop; retain keyboard and iPad landscape touch in play.
- Format and fix lint with `pnpm lint:fix`, then check with `pnpm lint`. Don't call Biome through `pnpm exec`.
- The Lab targets viewports 1280px wide and up; never design, test or fix it below that.
- Never promote code from a study without planning, speccing, architectural review and explicit instruction.
- A study's decisions hold only inside the study. To the project and its specs they are proposals: examine each claim, decide, and write the decision into a spec before changing code. A study names the spec changes it would need; the project decides them.
- For each proposal taken from a study, settle two things before any spec or code changes: whether the project wants it, and what it applies to. A study examines one subject; the project decides whether the change is for that subject or for everything of its kind.

## Ranked challenge names

- 0.5.x: `alpha-1`
- 0.6.x: `ion-storm`
- 0.7.x: `fires-in-the-sky`
- Change `CHALLENGE` (`packages/mode-a/src/schemas/highscore.ts`) and add a name to `firestore.rules` only in a release to production, following the Release section of `docs/development.md`.
- Use the name of the current release line in all other work. There are no development, temporary or per-feature challenge names.

## Evidence and learning

- Keep human playtesting outside the repo: never gate, record, or ask for proof; separate evidence from findings, signals and interpretation, and review lessons before adoption.
