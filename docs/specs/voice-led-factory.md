# Voice-led development factory

Status: target contract, not yet implemented. Created 2026-10-28.
Authority: [rebuild charter](../rebuild-charter.md).

## Context

The owner develops through conversational speech transcripts and browser inspection. The factory must turn that input into traceable changes and trustworthy evidence without requiring manual IDE operation.

## Architecture

Flow: spoken intent → concise contract → bounded implementation → deterministic gates → browser/Lab evidence → human experience review → local commit → explicitly authorized publication.

The repository holds durable contracts and configuration. The Lab uses the same simulation, procedural assets, camera, and validated ship profiles as production. Test adapters control time, randomness, input, and network outcomes. Live services are exercised separately from deterministic checks.

Existing schema anchors:
- `packages/mode-a/src/lib/schemas/ship-profile.ts`
- `packages/mode-a/src/lib/schemas/game-state.ts`
- `packages/mode-a/src/lib/schemas/settings.ts`
- `packages/mode-a/src/schemas/highscore.ts`

New simulation/replay/network contracts require Zod schemas before game logic. Firebase data lives under `artifacts/{appId}/...`; incoming network data is parsed before use. Access rules must be tested, including rejected writes. Client validation alone does not establish score authenticity.

## Contract

### Definition of done

- [ ] One documented command runs the required automated gates and exits nonzero on failure, locally and in CI.
- [ ] Gates cover formatting/lint rules, strict types across workspace code, schema/behavior tests, production build, and browser gameplay smoke checks.
- [ ] Each check produces a named pass/fail result; skipped or unavailable checks are explicit and cannot count as passes.
- [ ] Check evidence identifies revision, dirty working-tree state, commands, and environment. A subsequent edit invalidates affected evidence.
- [ ] A known failing contract is detected by the gate; correcting it restores success without weakening the assertion.
- [ ] A clean checkout can launch the local game and Lab with documented setup and no live backend credentials.
- [ ] Fixed seed, simulation steps, configuration, and input sequence reproduce the same gameplay state in the supported test runtime.
- [ ] Browser checks exercise ship selection, keyboard movement, two simultaneous touch controls, release/cancel of inputs, game over, and restart.
- [ ] Lab scenarios have reproducible identifiers and configuration export suitable for sharing in conversation.
- [ ] Visual comparisons hold viewport, seed, simulation time, and browser environment fixed. Baseline changes require visual review; captures are never silently refreshed to hide failures.
- [ ] A playable checkpoint includes links to the relevant game/Lab scenario, automated results, known gaps, and a focused experience-review question.
- [ ] Commit and release status reports distinguish working changes, local commit, pushed revision, and verified deployed revision. Unknown remote/deployment state is reported as unknown.
- [ ] A factory experiment can be reconstructed from its intent, change, checks, human assessment, and resulting lesson candidate.

### Regression guardrails

- Rules and tests change when intent changes, with a reason; passing results alone do not justify weakening a contract.
- Performance observations report device/browser and scenario. A 60 FPS target is evaluated as a measurement, not treated as a hardware-independent deterministic assertion.
- Human approval of feel and fidelity remains distinct from automated behavioral correctness.
- Existing unrelated work survives iteration and is not silently absorbed into a new commit.
- Only approved lessons become standing guidance; experiment notes remain evidence rather than instructions.

### Scenarios

```gherkin
Scenario: Voice request becomes a playable change
  Given the owner describes a flight problem conversationally
  When the agent implements the agreed behavior
  Then the contract and executable checks describe the same outcome
  And the owner can inspect a reproducible Lab trial and play the real game

Scenario: Automated verification detects a regression
  Given a required flight contract is deliberately broken
  When the verification command runs
  Then it exits unsuccessfully and names the failed contract
  And the agent repairs the implementation or resolves an explicit intent change

Scenario: Live backend is unavailable
  Given no live service credentials or a failed service connection
  When the developer opens the local game and Lab
  Then flight and design trials remain available
  And shared scores clearly show their unavailable state
  And synthetic scores are identified as fixtures

Scenario: Owner asks whether a change is released
  Given a change exists in a local commit
  When the owner asks for release status
  Then the agent inspects repository and available deployment evidence
  And reports local, pushed, and deployed states separately
```

## Baseline evidence — 2026-10-28

Inspected working tree: branch `feat/0-4-0`, HEAD `ac6abe4`, with pre-existing uncommitted ship-selection work. These observations are not a passing factory acceptance report.

- `pnpm test`: 13 tests passed across two physics test files.
- `pnpm check`: succeeded; Astro reported zero errors, zero warnings, and two hints. The command invokes the web package's Astro check, not the advertised Biome lint gate.
- `pnpm build`: succeeded, producing ten static pages. This does not verify browser playability or a deployed release.
- Root scripts contain no browser gameplay gate or unified verification command.
- `GameWrapper.svelte` selects a ship profile for rendering; its `updateShip` call does not pass the profile's flight multipliers.
- The game loop uses frame delta time, `Math.random()`, and wall-clock elapsed time; deterministic replay needs explicit controls.
- The Supabase module throws at import time if credentials are absent; local development needs an isolated service boundary during the Firebase transition.
- Camera code supports tracking and translation; automatic zoom needs an explicit contract and shared Lab implementation.

## First bounded implementation

Establish the verification command and baseline coverage, isolate local boot from live services, and prove a browser can select a ship, start flight, and restart. Retain existing flight constants. Additional test dependencies require the owner's approval before installation. Ship behavior differences, camera design, and Firebase competition follow as separately reviewable increments.

## Factory foundation delivered — 2026-10-28

- Owner approved Playwright and Biome installation, and the context split into a minimal
  `AGENTS.md`, `docs/architecture.md`, and `docs/design.md`.
- `pnpm verify` runs contracts, strict Biome checks, Astro/workspace types, unit tests,
  build, and browser smoke tests; it retains per-stage logs and working-tree evidence.
- `docs/development.md` describes exact setup, coverage, and remaining gaps.
- Local game and Lab boot now tolerate absent legacy backend credentials; shared
  scores explicitly report unavailability. Firebase migration remains outstanding.
- Initial Chromium checks exercise all three ship selections, start/input feedback,
  changed Lab drawing, and unavailable shared scores. They do not yet verify trajectories,
  touch, or game-over/restart; those remain open acceptance criteria.
- An oversized `AGENTS.md` was injected temporarily: the contract gate rejected it,
  then passed after restoration. This verifies the entry-point size gate, not all gates.
- Explicit workspace type checking exposed a broken game-state import and an invalid
  legacy score-query method order; both were repaired without changing flight constants.
- Existing lint debt is intentionally visible as a failing stage, rather than waived.
  The full factory definition of done above remains open.
